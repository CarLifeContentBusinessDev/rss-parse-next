import Parser from 'rss-parser';
import * as XLSX from 'xlsx';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { PartialSyncRuntimeOptions, resolveSyncOptions } from '@/config/syncRuntime';
import { supabase } from '@/lib/supabase';
import { getDownloadsCompressDir } from '@/lib/temp-paths';
import {
  downloadEpisodeFiles,
  sanitizeFileName,
  validateSyncEnv,
} from '@/services/syncPodcastCommon';
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

type RefreshAudioFromExcelSourceInput = {
  buffer: Buffer;
  sheetName?: string;
  headerSkip?: number;
  country?: string;
  tablePreset?: TablePreset;
  options?: PartialSyncRuntimeOptions;
  onProgress?: (percent: number, message: string) => void;
};

type RefreshAudioFromExcelSourceResult = {
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  uploadedCount: number;
  updatedSupabaseCount: number;
  failures: Array<{ row: number; rssUrl: string | null; message: string }>;
  failureReportCsv: string;
};

type ExistingEpisode = {
  id: number;
  title: string;
  date: string | null;
};

const parser = new Parser();

function getField<T>(row: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  return undefined;
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isRankInRange(rank: number | undefined, minRank: number | null, maxRank: number | null) {
  if (rank === undefined) return true;
  if (minRank !== null && rank < minRank) return false;
  if (maxRank !== null && rank > maxRank) return false;
  return true;
}

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

export async function refreshAudioFromExcelSourceBuffer({
  buffer,
  sheetName,
  headerSkip,
  country,
  tablePreset = 'main',
  options,
  onProgress,
}: RefreshAudioFromExcelSourceInput): Promise<RefreshAudioFromExcelSourceResult> {
  validateSyncEnv();

  const tables = tablePreset === 'test' ? TEST_TABLES : MAIN_TABLES;
  const config = resolveSyncOptions({
    ...options,
    countryCode: (country ?? options?.countryCode ?? 'IT').toUpperCase(),
    downloadFiles: true,
    tables,
  });

  onProgress?.(10, 'excel loaded');

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const resolvedSheetName = sheetName ?? config.sheetName;
  if (!resolvedSheetName) {
    throw new Error('No sheet found in excel file');
  }

  const sheet = workbook.Sheets[resolvedSheetName];
  if (!sheet) {
    throw new Error(`Sheet not found: ${resolvedSheetName}`);
  }

  const resolvedHeaderSkip = headerSkip ?? config.excelHeaderSkip;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: resolvedHeaderSkip,
  });

  let succeededRows = 0;
  let failedRows = 0;
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;
  const failures: Array<{ row: number; rssUrl: string | null; message: string }> = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? {};
    const rank = toNumber(getField<number | string>(row, ['rank', 'Rank', '전체 순위', '순위']));
    const rssUrl = getField<string>(row, ['RSS', 'rss', 'rssUrl', 'RSS URL']);
    const programTitle = getField<string>(row, [
      '채널명',
      'programTitle',
      'title',
      'Program Title',
    ]);

    if (!isRankInRange(rank, config.minRank, config.maxRank)) {
      onProgress?.(
        15 + Math.round(((index + 1) / Math.max(rows.length, 1)) * 75),
        `row ${index + 1}/${rows.length} filtered by rank`,
      );
      continue;
    }

    if (!rssUrl || !programTitle) {
      failedRows += 1;
      failures.push({
        row: index + resolvedHeaderSkip + 1,
        rssUrl: rssUrl ?? null,
        message: 'Missing required fields: RSS/programTitle',
      });
      continue;
    }

    try {
      onProgress?.(
        15 + Math.round(((index + 1) / Math.max(rows.length, 1)) * 75),
        `matching source ${index + 1}/${rows.length}: ${programTitle}`,
      );

      const { data: program, error: programError } = await supabase
        .from(tables.programs)
        .select('id,title')
        .eq('title', String(programTitle))
        .maybeSingle();
      if (programError) throw programError;
      if (!program) throw new Error(`Program not found: ${programTitle}`);

      const { data: episodes, error: episodeError } = await supabase
        .from(tables.episodes)
        .select('id,title,date')
        .eq('program_id', program.id)
        .order('date', { ascending: false });
      if (episodeError) throw episodeError;

      const feed = (await retryAsync(() => parser.parseURL(String(rssUrl)), 2, 1500)) as ParsedFeed;
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
        throw new Error(`No RSS enclosure matches found for program: ${programTitle}`);
      }

      const baseDir = getDownloadsCompressDir(sanitizeFileName(program.title));
      const summary = await downloadEpisodeFiles(
        baseDir,
        program.id,
        config.countryCode,
        matchedEpisodes,
        null,
        program.title,
        config,
      );

      succeededRows += 1;
      uploadedCount += summary.uploadedCount;
      updatedSupabaseCount += summary.updatedSupabaseCount;
    } catch (error) {
      failedRows += 1;
      failures.push({
        row: index + resolvedHeaderSkip + 1,
        rssUrl: String(rssUrl),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  onProgress?.(95, 'building result');

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
