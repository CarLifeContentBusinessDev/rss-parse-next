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
  title?: string;
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

type ProgramRecord = {
  id: number;
  title: string;
};

type RowContext = {
  rowNumber: number;
  rank?: number;
  rssUrl?: string;
  programTitle?: string;
};

const parser = new Parser();
const RANK_KEYS = ['rank', 'Rank', '전체 순위', '순위'];
const RSS_KEYS = ['RSS', 'rss', 'rssUrl', 'RSS URL'];
const PROGRAM_TITLE_KEYS = ['채널명', 'programTitle', 'title', 'Program Title'];

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = value.replace(/[^0-9.-]+/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeHeaderKey(value: string) {
  return String(value)
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

function getField<T>(row: Record<string, unknown>, keys: string[]): T | undefined {
  const entries = Object.entries(row);
  const normalizedKeyMap = new Map(
    entries.map(([key, value]) => [normalizeHeaderKey(key), value] as const),
  );

  for (const key of keys) {
    const direct = row[key];
    if (direct !== undefined && direct !== null && direct !== '') {
      return direct as T;
    }

    const normalized = normalizedKeyMap.get(normalizeHeaderKey(key));
    if (normalized !== undefined && normalized !== null && normalized !== '') {
      return normalized as T;
    }
  }

  return undefined;
}

function hasRankFilter(minRank: number | null, maxRank: number | null) {
  return minRank !== null || maxRank !== null;
}

function isRankInRange(rank: number | undefined, minRank: number | null, maxRank: number | null) {
  if (rank === undefined) return false;
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

function normalizeLookupKey(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9가-힣]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isMeaningfulRow(row: Record<string, unknown>) {
  return Object.values(row).some((value) => String(value ?? '').trim() !== '');
}

function pickFeedItem(episode: ExistingEpisode, feedItems: FeedItem[]) {
  const normalizedEpisodeTitle = normalizeTitle(episode.title);
  const titleMatches = feedItems.filter(
    (item) => normalizeTitle(item.title) === normalizedEpisodeTitle,
  );

  if (titleMatches.length === 0) return null;
  if (titleMatches.length === 1) return titleMatches[0];
  if (!episode.date) return titleMatches[0];

  const datedMatch = titleMatches.find((item) => formatDateYYMMDD(item.pubDate) === episode.date);
  return datedMatch ?? titleMatches[0];
}

function buildProgramLookup(programs: ProgramRecord[]) {
  const exact = new Map<string, ProgramRecord>();

  for (const program of programs) {
    const key = normalizeLookupKey(program.title);
    if (!key || exact.has(key)) continue;
    exact.set(key, program);
  }

  return { exact, programs };
}

function resolveProgramMatch(
  lookup: ReturnType<typeof buildProgramLookup>,
  candidates: Array<string | null | undefined>,
) {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeLookupKey(candidate))
    .filter((candidate): candidate is string => candidate.length > 0);

  for (const candidate of normalizedCandidates) {
    const exactMatch = lookup.exact.get(candidate);
    if (exactMatch) return exactMatch;
  }

  for (const candidate of normalizedCandidates) {
    const fuzzyMatches = lookup.programs.filter((program) => {
      const programKey = normalizeLookupKey(program.title);
      return (
        programKey === candidate ||
        programKey.includes(candidate) ||
        candidate.includes(programKey)
      );
    });

    if (fuzzyMatches.length === 1) return fuzzyMatches[0];
  }

  return null;
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
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: resolvedHeaderSkip,
  });
  const meaningfulRows = rawRows
    .map((row, index) => ({ row, rowNumber: index + resolvedHeaderSkip + 1 }))
    .filter(({ row }) => isMeaningfulRow(row));

  const filteredRows: Array<{ row: Record<string, unknown>; context: RowContext }> = [];
  const enforceRankFilter = hasRankFilter(config.minRank, config.maxRank);

  for (const { row, rowNumber } of meaningfulRows) {
    const rank = toNumber(getField<number | string>(row, RANK_KEYS));
    const rssUrl = getField<string>(row, RSS_KEYS);
    const programTitle = getField<string>(row, PROGRAM_TITLE_KEYS);

    if (enforceRankFilter && !isRankInRange(rank, config.minRank, config.maxRank)) {
      continue;
    }

    filteredRows.push({
      row,
      context: {
        rowNumber,
        rank,
        rssUrl,
        programTitle,
      },
    });
  }

  const { data: programs, error: programListError } = await supabase
    .from(tables.programs)
    .select('id,title');
  if (programListError) throw programListError;
  const programLookup = buildProgramLookup(programs ?? []);

  let succeededRows = 0;
  let failedRows = 0;
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;
  const failures: Array<{ row: number; rssUrl: string | null; message: string }> = [];

  for (let index = 0; index < filteredRows.length; index += 1) {
    const { context } = filteredRows[index];
    const rssUrl = context.rssUrl;
    const programTitle = context.programTitle;

    if (!rssUrl || !programTitle) {
      failedRows += 1;
      failures.push({
        row: context.rowNumber,
        rssUrl: rssUrl ?? null,
        message: 'Missing required fields: RSS/programTitle',
      });
      continue;
    }

    try {
      onProgress?.(
        15 + Math.round(((index + 1) / Math.max(filteredRows.length, 1)) * 75),
        `matching source ${index + 1}/${filteredRows.length}: ${programTitle}`,
      );

      const program = resolveProgramMatch(programLookup, [programTitle]);
      const feed = (await retryAsync(() => parser.parseURL(String(rssUrl)), 2, 1500)) as ParsedFeed;
      const resolvedProgram = program ?? resolveProgramMatch(programLookup, [feed.title]);

      if (!resolvedProgram) {
        throw new Error(
          `Program not found: ${programTitle}${feed.title ? ` (rss title: ${feed.title})` : ''}`,
        );
      }

      const { data: episodes, error: episodeError } = await supabase
        .from(tables.episodes)
        .select('id,title,date')
        .eq('program_id', resolvedProgram.id)
        .order('date', { ascending: false });
      if (episodeError) throw episodeError;

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
        throw new Error(`No RSS enclosure matches found for program: ${resolvedProgram.title}`);
      }

      const baseDir = getDownloadsCompressDir(sanitizeFileName(resolvedProgram.title));
      const summary = await downloadEpisodeFiles(
        baseDir,
        resolvedProgram.id,
        config.countryCode,
        matchedEpisodes,
        null,
        resolvedProgram.title,
        config,
      );

      succeededRows += 1;
      uploadedCount += summary.uploadedCount;
      updatedSupabaseCount += summary.updatedSupabaseCount;
    } catch (error) {
      failedRows += 1;
      failures.push({
        row: context.rowNumber,
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
    totalRows: filteredRows.length,
    succeededRows,
    failedRows,
    uploadedCount,
    updatedSupabaseCount,
    failures,
    failureReportCsv,
  };
}
