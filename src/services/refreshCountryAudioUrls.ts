import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { PartialSyncRuntimeOptions, resolveSyncOptions } from '@/config/syncRuntime';
import { supabase } from '@/lib/supabase';
import { refreshEpisodeAudiosFromDb, validateSyncEnv } from '@/services/syncPodcastCommon';

type TablePreset = 'main' | 'test';

const COUNTRY_ALIAS_TO_CANONICAL: Record<string, string> = {
  kr: 'ko',
  ko: 'ko',
  us: 'en',
  gb: 'uk',
  uk: 'uk',
  en: 'en',
  de: 'de',
  ja: 'jp',
  jp: 'jp',
};

type RefreshCountryAudioUrlsInput = {
  country: string;
  tablePreset?: TablePreset;
  options?: PartialSyncRuntimeOptions;
  onProgress?: (percent: number, message: string) => void;
};

type RefreshCountryAudioUrlsResult = {
  country: string;
  tablePreset: TablePreset;
  matchedPrograms: number;
  processedPrograms: number;
  uploadedCount: number;
  updatedSupabaseCount: number;
  failures: Array<{ programId: number; title: string; message: string }>;
};

function normalizeCountryCode(input: string) {
  return COUNTRY_ALIAS_TO_CANONICAL[input.trim().toLowerCase()] ?? input.trim().toLowerCase();
}

export async function refreshCountryAudioUrls({
  country,
  tablePreset = 'main',
  options,
  onProgress,
}: RefreshCountryAudioUrlsInput): Promise<RefreshCountryAudioUrlsResult> {
  validateSyncEnv();

  const normalizedCountry = normalizeCountryCode(country);
  if (!normalizedCountry) {
    throw new Error('country is required');
  }

  const tables = tablePreset === 'test' ? TEST_TABLES : MAIN_TABLES;
  const config = resolveSyncOptions({
    ...options,
    countryCode: normalizedCountry.toUpperCase(),
    downloadFiles: true,
    downloadLimit: options?.downloadLimit ?? 0,
    tables,
  });

  onProgress?.(10, 'loading programs by country');

  const { data: programs, error } = await supabase
    .from(tables.programs)
    .select('id,title')
    .contains('language', [normalizedCountry])
    .order('id', { ascending: false });
  if (error) throw error;

  const items = programs ?? [];
  const failures: RefreshCountryAudioUrlsResult['failures'] = [];
  let processedPrograms = 0;
  let uploadedCount = 0;
  let updatedSupabaseCount = 0;

  if (items.length === 0) {
    return {
      country: normalizedCountry.toUpperCase(),
      tablePreset,
      matchedPrograms: 0,
      processedPrograms: 0,
      uploadedCount: 0,
      updatedSupabaseCount: 0,
      failures,
    };
  }

  for (let index = 0; index < items.length; index += 1) {
    const program = items[index];
    const percent = 15 + Math.round((index / Math.max(items.length, 1)) * 80);
    onProgress?.(percent, `refreshing audio ${index + 1}/${items.length}: ${program.title}`);

    try {
      const summary = await refreshEpisodeAudiosFromDb(
        program.id,
        normalizedCountry.toUpperCase(),
        program.title,
        config.downloadLimit,
        config,
      );
      processedPrograms += 1;
      uploadedCount += summary.uploadedCount;
      updatedSupabaseCount += summary.updatedSupabaseCount;
    } catch (refreshError) {
      failures.push({
        programId: program.id,
        title: program.title,
        message: refreshError instanceof Error ? refreshError.message : 'Unknown error',
      });
    }
  }

  onProgress?.(98, 'audio refresh summary ready');

  return {
    country: normalizedCountry.toUpperCase(),
    tablePreset,
    matchedPrograms: items.length,
    processedPrograms,
    uploadedCount,
    updatedSupabaseCount,
    failures,
  };
}
