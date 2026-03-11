import Parser from 'rss-parser';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { PartialSyncRuntimeOptions, resolveSyncOptions } from '@/config/syncRuntime';
import { supabase } from '@/lib/supabase';
import { downloadEpisodeFiles, sanitizeFileName, validateSyncEnv } from '@/services/syncPodcastCommon';
import { formatDateYYMMDD, retryAsync } from '@/utils/duration';

type TablePreset = 'main' | 'test';

type FeedItem = {
  title?: string;
  pubDate?: string;
  enclosure?: { url?: string };
};

type ParsedFeed = {
  items: FeedItem[];
};

type ExistingEpisode = {
  id: number;
  title: string;
  date: string | null;
};

type RefreshAudioFromRssSourceInput = {
  programId: number;
  rssUrl: string;
  country: string;
  tablePreset?: TablePreset;
  options?: PartialSyncRuntimeOptions;
};

type RefreshAudioFromRssSourceResult = {
  matchedEpisodes: number;
  uploadedCount: number;
  updatedSupabaseCount: number;
};

const parser = new Parser();

function normalizeTitle(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function pickFeedItem(episode: ExistingEpisode, feedItems: FeedItem[]) {
  const normalizedTitle = normalizeTitle(episode.title);
  const titleMatches = feedItems.filter((item) => normalizeTitle(item.title) === normalizedTitle);

  if (titleMatches.length === 0) return null;
  if (titleMatches.length === 1) return titleMatches[0];
  if (!episode.date) return titleMatches[0];

  const datedMatch = titleMatches.find((item) => formatDateYYMMDD(item.pubDate) === episode.date);
  return datedMatch ?? titleMatches[0];
}

export async function refreshAudioFromRssSource({
  programId,
  rssUrl,
  country,
  tablePreset = 'main',
  options,
}: RefreshAudioFromRssSourceInput): Promise<RefreshAudioFromRssSourceResult> {
  validateSyncEnv();

  const tables = tablePreset === 'test' ? TEST_TABLES : MAIN_TABLES;
  const config = resolveSyncOptions({
    ...options,
    countryCode: country.toUpperCase(),
    downloadFiles: true,
    tables,
  });

  const { data: program, error: programError } = await supabase
    .from(tables.programs)
    .select('id,title')
    .eq('id', programId)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) throw new Error(`Program not found: ${programId}`);

  const { data: episodes, error: episodeError } = await supabase
    .from(tables.episodes)
    .select('id,title,date')
    .eq('program_id', program.id)
    .order('date', { ascending: false });
  if (episodeError) throw episodeError;

  const feed = (await retryAsync(() => parser.parseURL(rssUrl), 2, 1500)) as ParsedFeed;
  const matchedEpisodes = (episodes ?? [])
    .map((episode) => {
      const feedItem = pickFeedItem(episode, feed.items ?? []);
      const sourceUrl = feedItem?.enclosure?.url ?? null;
      if (!sourceUrl) return null;

      return {
        id: episode.id,
        title: episode.title,
        audio_file: sourceUrl,
        img_url: null,
      };
    })
    .filter((episode): episode is NonNullable<typeof episode> => episode !== null);

  if (matchedEpisodes.length === 0) {
    throw new Error(`No RSS enclosure matches found for program: ${program.title}`);
  }

  const baseDir = `${process.cwd()}\\downloads_compress\\${sanitizeFileName(program.title)}`;
  const summary = await downloadEpisodeFiles(
    baseDir,
    program.id,
    config.countryCode,
    matchedEpisodes,
    null,
    program.title,
    config,
  );

  return {
    matchedEpisodes: matchedEpisodes.length,
    uploadedCount: summary.uploadedCount,
    updatedSupabaseCount: summary.updatedSupabaseCount,
  };
}
