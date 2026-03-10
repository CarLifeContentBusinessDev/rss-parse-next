import Parser from 'rss-parser';
import path from 'node:path';
import { supabase } from '@/lib/supabase';
import { formatDateYYMMDD, formatDuration, retryAsync } from '@/utils/duration';
import {
  downloadEpisodeFiles,
  downloadEpisodesFromDb,
  sanitizeFileName,
  syncCategoryMapping,
  validateSyncEnv,
} from '@/services/syncPodcastCommon';
import { PartialSyncRuntimeOptions, resolveSyncOptions } from '@/config/syncRuntime';

type FeedItem = {
  title?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  itunes?: { duration?: string; image?: string };
};

type ParsedFeed = {
  title?: string;
  image?: { url?: string };
  itunes?: { image?: string };
  items: FeedItem[];
};

type SyncPodcastFromRssInput = {
  rssUrl: string;
  options?: PartialSyncRuntimeOptions;
  onProgress?: (percent: number, message: string) => void;
};

type SyncPodcastFromRssResult = {
  rssUrl: string;
  feedTitle: string | null;
  totalItems: number;
  processedItems: number;
  skippedItems: number;
  uploadedCount: number;
  updatedSupabaseCount: number;
};

const parser = new Parser();
const SKIP_DUPLICATES = true;

export async function syncPodcastFromRss({
  rssUrl,
  options,
  onProgress,
}: SyncPodcastFromRssInput): Promise<SyncPodcastFromRssResult> {
  validateSyncEnv();
  const config = resolveSyncOptions(options);
  onProgress?.(10, 'parsing rss feed');

  const feed = (await retryAsync(() => parser.parseURL(rssUrl), 2, 1500)) as unknown as ParsedFeed;

  const programTitle = feed.title ?? '';
  const programImage = feed.itunes?.image ?? feed.image?.url ?? null;

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
      await syncCategoryMapping(existingProgram.id, config.categoryId, config.countryCode, config);
      onProgress?.(35, 'existing episodes already sufficient');
      if (config.downloadFiles) {
        onProgress?.(70, 'downloading existing episode files');
        const summary = await downloadEpisodesFromDb(
          existingProgram.id,
          config.countryCode,
          programTitle,
          existingProgram.img_url ?? null,
          config.downloadLimit,
          config,
        );
        return {
          rssUrl,
          feedTitle: programTitle || null,
          totalItems: feed.items.length,
          processedItems: 0,
          skippedItems: feed.items.length,
          uploadedCount: summary.uploadedCount,
          updatedSupabaseCount: summary.updatedSupabaseCount,
        };
      }

      return {
        rssUrl,
        feedTitle: programTitle || null,
        totalItems: feed.items.length,
        processedItems: 0,
        skippedItems: feed.items.length,
        uploadedCount: 0,
        updatedSupabaseCount: 0,
      };
    }
  }

  const { data: program, error: programError } = await supabase
    .from(config.tables.programs)
    .upsert(
      {
        title: programTitle,
        img_url: programImage,
        type: config.programType,
        language: config.languageList,
      },
      {
        onConflict: 'title',
        ignoreDuplicates: SKIP_DUPLICATES,
      },
    )
    .select()
    .maybeSingle();

  if (programError) throw programError;
  onProgress?.(40, 'program upserted');

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

  await syncCategoryMapping(finalProgram.id, config.categoryId, config.countryCode, config);

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
  onProgress?.(50, 'syncing episodes');

  const savedEpisodes: Array<{
    id?: number | null;
    title: string;
    audio_file: string | null;
    img_url: string | null;
  }> = [];

  for (let index = 0; index < recentItems.length; index += 1) {
    const item = recentItems[index];
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
          language: config.languageList,
        },
        { onConflict: 'program_id,title', ignoreDuplicates: SKIP_DUPLICATES },
      )
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[syncPodcastFromRss] episode upsert failed', { title, error });
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
    const episodeProgress = 50 + Math.round(((index + 1) / Math.max(recentItems.length, 1)) * 30);
    onProgress?.(episodeProgress, `episode ${index + 1}/${recentItems.length} synced`);
  }

  let uploadedCount = 0;
  let updatedSupabaseCount = 0;
  if (config.downloadFiles) {
    onProgress?.(85, 'downloading/compressing files');
    const baseDir = path.join(process.cwd(), 'downloads_compress', sanitizeFileName(programTitle));
    const downloadItems =
      config.downloadLimit > 0 ? savedEpisodes.slice(0, config.downloadLimit) : savedEpisodes;
    const summary = await downloadEpisodeFiles(
      baseDir,
      finalProgram.id,
      config.countryCode,
      downloadItems,
      programImage,
      programTitle,
      config,
    );
    uploadedCount = summary.uploadedCount;
    updatedSupabaseCount = summary.updatedSupabaseCount;
  }

  return {
    rssUrl,
    feedTitle: programTitle || null,
    totalItems: feed.items.length,
    processedItems: recentItems.length,
    skippedItems: Math.max(feed.items.length - recentItems.length, 0),
    uploadedCount,
    updatedSupabaseCount,
  };
}
