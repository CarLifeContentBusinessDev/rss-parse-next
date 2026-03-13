import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { isR2Configured, uploadLocalFileToR2 } from '@/lib/r2';
import { supabase } from '@/lib/supabase';
import { getDownloadsCompressDir } from '@/lib/temp-paths';
import { SyncRuntimeOptions } from '@/config/syncRuntime';

export function validateSyncEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
}

export function sanitizeFileName(name: string) {
  return name.replace(/[\/\\:*?"<>|]/g, '').trim();
}

function cleanupLocalFileIfNeeded(filePath: string, options: SyncRuntimeOptions) {
  if (options.keepLocalFiles) return;
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // best-effort cleanup
    }
  }
}

function cleanupDirIfEmpty(dirPath: string, options: SyncRuntimeOptions) {
  if (options.keepLocalFiles) return;
  try {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
      fs.rmdirSync(dirPath);
    }
  } catch {
    // best-effort cleanup
  }
}

export async function downloadAndCompressAudioFromUrlToRecommendedM4a(
  audioUrl: string,
  outputPath: string,
  audioBitrate: string,
) {
  if (fs.existsSync(outputPath)) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      'ffmpeg',
      [
        '-y',
        '-i',
        audioUrl,
        '-vn',
        '-c:a',
        'aac',
        '-b:a',
        audioBitrate,
        '-movflags',
        '+faststart',
        outputPath,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );

    let stderr = '';
    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    ffmpeg.on('error', (error) => reject(new Error(`Failed to start ffmpeg: ${error.message}`)));
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg audio compression failed (${code}): ${stderr}`));
    });
  });
}

export async function downloadAndCompressImageFromUrlToTargetWebp(
  imageUrl: string,
  outputPath: string,
  targetMaxKb: number,
) {
  if (fs.existsSync(outputPath)) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const targetBytes = targetMaxKb * 1024;
  const widths = [1600, 1400, 1200, 960, 800, 720, 640, 480];
  const qualities = [80, 72, 64, 56, 50, 45, 40];
  let bestPath: string | null = null;
  let bestSize = Number.POSITIVE_INFINITY;

  for (const width of widths) {
    for (const quality of qualities) {
      const tempPath = path.join(
        path.dirname(outputPath),
        `${path.parse(outputPath).name}.tmp.${width}.${quality}.${Date.now()}.webp`,
      );

      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn(
          'ffmpeg',
          [
            '-y',
            '-i',
            imageUrl,
            '-vf',
            `scale='min(iw,${width})':-2`,
            '-frames:v',
            '1',
            '-c:v',
            'libwebp',
            '-q:v',
            String(quality),
            '-compression_level',
            '6',
            '-preset',
            'picture',
            tempPath,
          ],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );

        let stderr = '';
        ffmpeg.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });
        ffmpeg.on('error', (error) =>
          reject(new Error(`Failed to start ffmpeg: ${error.message}`)),
        );
        ffmpeg.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg image compression failed (${code}): ${stderr}`));
        });
      });

      const { size } = fs.statSync(tempPath);
      if (size < bestSize) {
        if (bestPath && fs.existsSync(bestPath)) fs.unlinkSync(bestPath);
        bestSize = size;
        bestPath = tempPath;
      } else {
        fs.unlinkSync(tempPath);
      }

      if (size <= targetBytes) {
        fs.renameSync(tempPath, outputPath);
        if (bestPath && bestPath !== outputPath && fs.existsSync(bestPath)) fs.unlinkSync(bestPath);
        return;
      }
    }
  }

  if (!bestPath || !fs.existsSync(bestPath)) {
    throw new Error(`Image compression failed for URL: ${imageUrl}`);
  }
  fs.renameSync(bestPath, outputPath);
}

export async function syncCategoryMapping(
  programId: number,
  categoryId: string | number | undefined,
  country: string,
  options: SyncRuntimeOptions,
) {
  if (
    !options.syncCategory ||
    categoryId === undefined ||
    Number(categoryId) === options.globalCategoryId
  ) {
    return;
  }

  const { error } = await supabase
    .from(options.tables.programsCategories)
    .upsert(
      { program_id: programId, category_id: categoryId, country },
      { onConflict: 'program_id,category_id,country' },
    );
  if (error) throw error;
}

export async function syncThemeMapping(
  programId: number,
  orderPopular: number | undefined,
  options: SyncRuntimeOptions,
) {
  if (!options.syncThemes || orderPopular === undefined) return;

  const { error } = await supabase
    .from(options.tables.themesPrograms)
    .upsert(
      { program_id: programId, theme_id: options.themeId, order: orderPopular },
      { onConflict: 'program_id,theme_id' },
    );
  if (error) throw error;
}

type EpisodeFileInput = {
  id?: number | null;
  title: string;
  audio_file: string | null;
  img_url: string | null;
};

type DownloadSummary = {
  uploadedCount: number;
  updatedSupabaseCount: number;
};

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function summarizeRejectedTasks(
  settled: PromiseSettledResult<void>[],
  prefix: string,
  maxDetails = 3,
) {
  const rejected = settled.filter(
    (item): item is PromiseRejectedResult => item.status === 'rejected',
  );
  if (rejected.length === 0) return null;

  const details = rejected
    .slice(0, maxDetails)
    .map((item) => toErrorMessage(item.reason).replace(/\s+/g, ' ').trim())
    .join(' | ');
  const remainder =
    rejected.length > maxDetails ? ` | and ${rejected.length - maxDetails} more` : '';

  return `${prefix}: ${rejected.length}${details ? ` | ${details}${remainder}` : ''}`;
}

export async function downloadEpisodeFiles(
  baseDir: string,
  programId: number,
  country: string,
  episodes: EpisodeFileInput[],
  programImage: string | null,
  programTitle: string,
  options: SyncRuntimeOptions,
): Promise<DownloadSummary> {
  if (!options.downloadFiles) {
    return { uploadedCount: 0, updatedSupabaseCount: 0 };
  }

  const uploadToR2 = isR2Configured();
  const countryPrefix = country.toLowerCase();
  const safeProgramTitle = sanitizeFileName(programTitle);
  const r2Prefix = 'test';
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;

  const tasks = episodes.map(async (episode) => {
    const safeTitle = sanitizeFileName(episode.title || 'untitled');
    const updatePayload: { audio_file?: string; img_url?: string } = {};

    if (episode.audio_file) {
      const m4aPath = path.join(baseDir, `${safeTitle}.m4a`);
      try {
        await downloadAndCompressAudioFromUrlToRecommendedM4a(
          episode.audio_file,
          m4aPath,
          options.audioBitrate,
        );
        if (uploadToR2) {
          const audioKey = `${r2Prefix}/${countryPrefix}-episodes-audio/program/${safeProgramTitle}/${safeTitle}.m4a`;
          updatePayload.audio_file = await uploadLocalFileToR2(m4aPath, audioKey);
          uploadedCount += 1;
        }
      } finally {
        cleanupLocalFileIfNeeded(m4aPath, options);
      }
    }

    if (episode.img_url) {
      const imagePath = path.join(baseDir, `${safeTitle}.webp`);
      try {
        await downloadAndCompressImageFromUrlToTargetWebp(
          episode.img_url,
          imagePath,
          options.imageTargetMaxKb,
        );
        if (uploadToR2) {
          const imageKey = `${r2Prefix}/${countryPrefix}-episodes-audio/program/${safeProgramTitle}/${safeTitle}.webp`;
          updatePayload.img_url = await uploadLocalFileToR2(imagePath, imageKey);
          uploadedCount += 1;
        }
      } finally {
        cleanupLocalFileIfNeeded(imagePath, options);
      }
    }

    if (uploadToR2 && Object.keys(updatePayload).length > 0) {
      const query = supabase.from(options.tables.episodes).update(updatePayload);
      const scoped =
        episode.id !== undefined && episode.id !== null
          ? query.eq('id', episode.id)
          : query.eq('program_id', programId).eq('title', episode.title);

      const { data, error } = await scoped.select('id');
      if (error) throw error;
      if (data && data.length > 0) updatedSupabaseCount += data.length;
    }
  }).map((task, index) =>
    task.catch((error) => {
      const episodeTitle = episodes[index]?.title || 'untitled';
      throw new Error(`episode "${episodeTitle}": ${toErrorMessage(error)}`);
    }),
  );

  if (programImage) {
    tasks.push(
      (async () => {
        const imagePath = path.join(baseDir, `${safeProgramTitle}.webp`);
        try {
          await downloadAndCompressImageFromUrlToTargetWebp(
            programImage,
            imagePath,
            options.imageTargetMaxKb,
          );
          if (!uploadToR2) return;

          const key = `${r2Prefix}/${countryPrefix}-episodes-audio/program/${safeProgramTitle}/${safeProgramTitle}.webp`;
          const programImageUrl = await uploadLocalFileToR2(imagePath, key);
          uploadedCount += 1;

          const { data, error } = await supabase
            .from(options.tables.programs)
            .update({ img_url: programImageUrl })
            .eq('id', programId)
            .select('id');
          if (error) throw error;
          if (data && data.length > 0) updatedSupabaseCount += data.length;
        } finally {
          cleanupLocalFileIfNeeded(imagePath, options);
        }
      })().catch((error) => {
        throw new Error(`program image "${programTitle}": ${toErrorMessage(error)}`);
      }),
    );
  }

  const settled = await Promise.allSettled(tasks);
  const rejectedSummary = summarizeRejectedTasks(settled, 'Download/upload tasks failed');
  if (rejectedSummary) {
    throw new Error(rejectedSummary);
  }

  cleanupDirIfEmpty(baseDir, options);

  return { uploadedCount, updatedSupabaseCount };
}

export async function downloadEpisodesFromDb(
  programId: number,
  country: string,
  programTitle: string,
  programImage: string | null,
  downloadLimit: number,
  options: SyncRuntimeOptions,
) {
  const baseDir = getDownloadsCompressDir(sanitizeFileName(programTitle));
  let query = supabase
    .from(options.tables.episodes)
    .select('id,title,audio_file,img_url,date')
    .eq('program_id', programId)
    .order('date', { ascending: false });

  if (downloadLimit > 0) {
    query = query.limit(downloadLimit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return downloadEpisodeFiles(
    baseDir,
    programId,
    country,
    data ?? [],
    programImage,
    programTitle,
    options,
  );
}

export async function refreshEpisodeAudiosFromDb(
  programId: number,
  country: string,
  programTitle: string,
  downloadLimit: number,
  options: SyncRuntimeOptions,
) {
  if (!options.downloadFiles) {
    return { uploadedCount: 0, updatedSupabaseCount: 0 };
  }

  if (!isR2Configured()) {
    throw new Error('R2 is not configured, cannot replace audio URLs');
  }

  const baseDir = getDownloadsCompressDir(sanitizeFileName(programTitle));
  let query = supabase
    .from(options.tables.episodes)
    .select('id,title,audio_file,date')
    .eq('program_id', programId)
    .not('audio_file', 'is', null)
    .order('date', { ascending: false });

  if (downloadLimit > 0) {
    query = query.limit(downloadLimit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const episodes = data ?? [];
  const countryPrefix = country.toLowerCase();
  const safeProgramTitle = sanitizeFileName(programTitle);
  const r2Prefix = 'test';
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;

  const tasks = episodes.map(async (episode) => {
    if (!episode.audio_file) return;

    const safeTitle = sanitizeFileName(episode.title || 'untitled');
    const m4aPath = path.join(baseDir, `${safeTitle}.m4a`);

    try {
      await downloadAndCompressAudioFromUrlToRecommendedM4a(
        episode.audio_file,
        m4aPath,
        options.audioBitrate,
      );

      const audioKey = `${r2Prefix}/${countryPrefix}-episodes-audio/program/${safeProgramTitle}/${safeTitle}.m4a`;
      const audioUrl = await uploadLocalFileToR2(m4aPath, audioKey);
      uploadedCount += 1;

      const { data: updatedRows, error: updateError } = await supabase
        .from(options.tables.episodes)
        .update({ audio_file: audioUrl })
        .eq('id', episode.id)
        .select('id');

      if (updateError) throw updateError;
      if (updatedRows && updatedRows.length > 0) updatedSupabaseCount += updatedRows.length;
    } finally {
      cleanupLocalFileIfNeeded(m4aPath, options);
    }
  }).map((task, index) =>
    task.catch((error) => {
      const episodeTitle = episodes[index]?.title || 'untitled';
      throw new Error(`episode "${episodeTitle}": ${toErrorMessage(error)}`);
    }),
  );

  const settled = await Promise.allSettled(tasks);
  const rejectedSummary = summarizeRejectedTasks(
    settled,
    'Audio refresh tasks failed',
  );
  if (rejectedSummary) {
    throw new Error(rejectedSummary);
  }

  cleanupDirIfEmpty(baseDir, options);

  return { uploadedCount, updatedSupabaseCount };
}
