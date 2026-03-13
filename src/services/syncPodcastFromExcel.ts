import path from 'node:path';
import Parser from 'rss-parser';
import { supabase } from '@/lib/supabase';
import {
  downloadEpisodeFiles,
  downloadEpisodesFromDb,
  sanitizeFileName,
  syncCategoryMapping,
  syncThemeMapping,
  validateSyncEnv,
} from '@/services/syncPodcastCommon';
import { formatDateYYMMDD, formatDuration, retryAsync } from '@/utils/duration';
import { PartialSyncRuntimeOptions, resolveSyncOptions } from '@/config/syncRuntime';
import * as XLSX from 'xlsx';
import { getDownloadsCompressDir } from '@/lib/temp-paths';
import {
  EXCEL_CATEGORY_ID_KEYS,
  EXCEL_ORDER_POPULAR_KEYS,
  EXCEL_PROGRAM_TITLE_KEYS,
  EXCEL_RANK_KEYS,
  EXCEL_RSS_KEYS,
  EXCEL_SUBTITLE_KEYS,
  getExcelField,
  toExcelNumber,
} from '@/services/excelHeaders';

type FeedItem = {
  title?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  itunes?: { duration?: string; image?: string };
};

type ParsedFeed = {
  image?: { url?: string };
  itunes?: { image?: string };
  items: FeedItem[];
};

export type SyncPodcastFromExcelInput = {
  rssUrl: string;
  programTitle: string;
  subtitle?: string | null;
  language?: string[];
  country: string;
  categoryId?: string | number;
  orderPopular?: number;
  options?: PartialSyncRuntimeOptions;
};

export type ExcelSyncRunResult = {
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  uploadedCount: number;
  updatedSupabaseCount: number;
  failures: Array<{ row: number; rssUrl: string | null; message: string }>;
  failureReportCsv: string;
};

type ExcelRunOptions = {
  buffer: Buffer;
  sheetName?: string;
  headerSkip?: number;
  country?: string;
  options?: PartialSyncRuntimeOptions;
  onProgress?: (percent: number, message: string) => void;
};

const parser = new Parser();
const SKIP_DUPLICATES = true;

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isRankInRange(rank: number | undefined, minRank: number | null, maxRank: number | null) {
  if (rank === undefined) return false;
  if (minRank !== null && rank < minRank) return false;
  if (maxRank !== null && rank > maxRank) return false;
  return true;
}

export async function syncPodcastFromExcel(
  input: SyncPodcastFromExcelInput,
): Promise<{ processedItems: number; uploadedCount: number; updatedSupabaseCount: number }> {
  const { rssUrl, programTitle, subtitle, country, categoryId, orderPopular, options } = input;

  const config = resolveSyncOptions(options);
  const language = input.language ?? config.languageList;

  const { data: existingProgram } = await supabase
    .from(config.tables.programs)
    .select('id,img_url')
    .eq('title', programTitle)
    .maybeSingle();

  if (existingProgram) {
    const { count } = await supabase
      .from(config.tables.episodes)
      .select('*', { count: 'exact', head: true })
      .eq('program_id', existingProgram.id);

    if ((count ?? 0) >= config.episodeLimit) {
      await syncCategoryMapping(existingProgram.id, categoryId, country, config);
      await syncThemeMapping(existingProgram.id, orderPopular, config);

      if (config.downloadFiles) {
        const summary = await downloadEpisodesFromDb(
          existingProgram.id,
          country,
          programTitle,
          existingProgram.img_url ?? null,
          config.downloadLimit,
          config,
        );
        return {
          processedItems: 0,
          uploadedCount: summary.uploadedCount,
          updatedSupabaseCount: summary.updatedSupabaseCount,
        };
      }

      return { processedItems: 0, uploadedCount: 0, updatedSupabaseCount: 0 };
    }
  }

  const feed = (await retryAsync(() => parser.parseURL(rssUrl), 2, 1500)) as unknown as ParsedFeed;

  const programImage = feed.itunes?.image ?? feed.image?.url ?? null;
  const { data: program, error: programError } = await supabase
    .from(config.tables.programs)
    .upsert(
      {
        title: programTitle,
        subtitle: subtitle ?? null,
        img_url: programImage,
        type: config.programType,
        language,
      },
      { onConflict: 'title', ignoreDuplicates: SKIP_DUPLICATES },
    )
    .select()
    .maybeSingle();

  if (programError) throw programError;

  let finalProgram = program;
  if (!finalProgram) {
    const { data, error } = await supabase
      .from(config.tables.programs)
      .select()
      .eq('title', programTitle)
      .single();
    if (error) throw error;
    finalProgram = data;
  }

  await syncCategoryMapping(finalProgram.id, categoryId, country, config);
  await syncThemeMapping(finalProgram.id, orderPopular, config);

  const { count } = await supabase
    .from(config.tables.episodes)
    .select('*', { count: 'exact', head: true })
    .eq('program_id', finalProgram.id);

  const needCount = config.episodeLimit - (count ?? 0);
  const { data: existingEpisodes } = await supabase
    .from(config.tables.episodes)
    .select('title')
    .eq('program_id', finalProgram.id);

  const existingTitles = new Set((existingEpisodes ?? []).map((item) => item.title));
  const newItems = feed.items.filter((item) => item.title && !existingTitles.has(item.title));
  const recentItems = newItems.slice(0, Math.max(needCount, 0));

  const savedEpisodes: Array<{
    id?: number | null;
    title: string;
    audio_file: string | null;
    img_url: string | null;
  }> = [];

  for (const item of recentItems) {
    const title = item.title ?? 'untitled';
    const image = item.itunes?.image ?? programImage ?? null;
    const { data: upsertedEpisode, error } = await supabase
      .from(config.tables.episodes)
      .upsert(
        {
          program_id: finalProgram.id,
          title,
          img_url: image,
          audio_file: item.enclosure?.url ?? null,
          date: formatDateYYMMDD(item.pubDate),
          duration: formatDuration(item.itunes?.duration),
          type: config.programType,
          language,
        },
        { onConflict: 'program_id,title', ignoreDuplicates: SKIP_DUPLICATES },
      )
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[syncPodcastFromExcel] episode upsert failed', { title, error });
      continue;
    }

    let episodeId = upsertedEpisode?.id ?? null;
    if (episodeId === null) {
      const { data } = await supabase
        .from(config.tables.episodes)
        .select('id')
        .eq('program_id', finalProgram.id)
        .eq('title', title)
        .maybeSingle();
      episodeId = data?.id ?? null;
    }

    savedEpisodes.push({
      id: episodeId,
      title,
      audio_file: item.enclosure?.url ?? null,
      img_url: image,
    });
  }

  let uploadedCount = 0;
  let updatedSupabaseCount = 0;
  if (config.downloadFiles) {
    const baseDir = getDownloadsCompressDir(sanitizeFileName(programTitle));
    const downloadItems =
      config.downloadLimit > 0 ? savedEpisodes.slice(0, config.downloadLimit) : savedEpisodes;
    const summary = await downloadEpisodeFiles(
      baseDir,
      finalProgram.id,
      country,
      downloadItems,
      programImage,
      programTitle,
      config,
    );
    uploadedCount = summary.uploadedCount;
    updatedSupabaseCount = summary.updatedSupabaseCount;
  }

  return { processedItems: recentItems.length, uploadedCount, updatedSupabaseCount };
}

export async function syncPodcastFromExcelBuffer(
  runOptions: ExcelRunOptions,
): Promise<ExcelSyncRunResult> {
  validateSyncEnv();
  const config = resolveSyncOptions(runOptions.options);
  runOptions.onProgress?.(10, 'excel loaded');

  const workbook = XLSX.read(runOptions.buffer, { type: 'buffer' });
  const sheetName = runOptions.sheetName ?? config.sheetName;
  if (!sheetName) {
    throw new Error('No sheet found in excel file');
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  const headerSkip = runOptions.headerSkip ?? config.excelHeaderSkip;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerSkip,
  });
  runOptions.onProgress?.(15, 'rows parsed');

  let succeededRows = 0;
  let failedRows = 0;
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;
  const failures: Array<{ row: number; rssUrl: string | null; message: string }> = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? {};
    const rank = toExcelNumber(getExcelField<number | string>(row, EXCEL_RANK_KEYS));

    if (!isRankInRange(rank, config.minRank, config.maxRank)) {
      const percent = 15 + Math.round(((index + 1) / Math.max(rows.length, 1)) * 75);
      runOptions.onProgress?.(percent, `row ${index + 1}/${rows.length} filtered`);
      continue;
    }

    const rssUrl = getExcelField<string>(row, EXCEL_RSS_KEYS);
    const programTitle = getExcelField<string>(row, EXCEL_PROGRAM_TITLE_KEYS);

    if (!rssUrl || !programTitle) {
      failedRows += 1;
      failures.push({
        row: index + headerSkip + 1,
        rssUrl: rssUrl ?? null,
        message: 'Missing required fields: RSS/programTitle',
      });
      continue;
    }

    const subtitle = getExcelField<string>(row, EXCEL_SUBTITLE_KEYS) ?? null;
    const categoryId = getExcelField<string | number>(row, EXCEL_CATEGORY_ID_KEYS);
    const orderPopular = toExcelNumber(
      getExcelField<number | string>(row, EXCEL_ORDER_POPULAR_KEYS),
    );

    if (config.syncThemes && orderPopular === undefined) {
      failedRows += 1;
      failures.push({
        row: index + headerSkip + 1,
        rssUrl: String(rssUrl),
        message: `Missing required field for theme mapping: orderPopular (themeId=${config.themeId}, table=${config.tables.themesPrograms})`,
      });
      continue;
    }

    try {
      const summary = await syncPodcastFromExcel({
        rssUrl: String(rssUrl),
        programTitle: String(programTitle),
        subtitle,
        country: runOptions.country ?? config.countryCode,
        categoryId,
        orderPopular,
        options: config,
      });
      uploadedCount += summary.uploadedCount;
      updatedSupabaseCount += summary.updatedSupabaseCount;
      succeededRows += 1;
    } catch (error) {
      failedRows += 1;
      failures.push({
        row: index + headerSkip + 1,
        rssUrl: String(rssUrl),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    const percent = 15 + Math.round(((index + 1) / Math.max(rows.length, 1)) * 75);
    runOptions.onProgress?.(percent, `row ${index + 1}/${rows.length} processed`);
  }
  runOptions.onProgress?.(95, 'building result');

  const failureReportCsv = [
    'row,rssUrl,message',
    ...failures.map((failure) =>
      [String(failure.row), escapeCsv(failure.rssUrl ?? ''), escapeCsv(failure.message)].join(','),
    ),
  ].join('\n');

  return {
    totalRows: rows.length,
    succeededRows,
    failedRows,
    uploadedCount,
    updatedSupabaseCount,
    failures,
    failureReportCsv,
  };
}
