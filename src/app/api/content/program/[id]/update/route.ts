import { NextResponse } from 'next/server';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { resolveSyncOptions } from '@/config/syncRuntime';
import { refreshEpisodeAudiosFromDb, validateSyncEnv } from '@/services/syncPodcastCommon';
import { supabase } from '@/lib/supabase';

type TablePreset = 'main' | 'test';

const COUNTRY_ALIAS_TO_CANONICAL: Record<string, string> = {
  kr: 'ko',
  ko: 'ko',
  us: 'en',
  uk: 'uk',
  gb: 'uk',
  en: 'en',
  de: 'de',
  ja: 'jp',
  jp: 'jp',
};

function toErrorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

function resolvePreset(input: string | null): TablePreset {
  return input === 'test' ? 'test' : 'main';
}

function normalizeCountryCode(input: string) {
  return (COUNTRY_ALIAS_TO_CANONICAL[input.toLowerCase()] ?? input.toLowerCase()).toUpperCase();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    validateSyncEnv();

    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'id must be numeric');
    }

    const body = (await request.json().catch(() => ({}))) as {
      country?: string;
      tablePreset?: TablePreset;
    };

    const tablePreset = resolvePreset(body.tablePreset ?? null);
    const country = normalizeCountryCode((body.country ?? 'KO').trim() || 'KO');
    const tables = tablePreset === 'main' ? MAIN_TABLES : TEST_TABLES;

    const { data: program, error: programError } = await supabase
      .from(tables.programs)
      .select('id,title')
      .eq('id', id)
      .maybeSingle();
    if (programError) throw programError;
    if (!program) return toErrorResponse(404, 'NOT_FOUND', 'program not found');

    const options = resolveSyncOptions({
      countryCode: country,
      downloadFiles: true,
      downloadLimit: 0,
      tables,
    });

    const summary = await refreshEpisodeAudiosFromDb(
      program.id,
      country,
      program.title,
      options.downloadLimit,
      options,
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          programId: program.id,
          uploadedCount: summary.uploadedCount,
          updatedSupabaseCount: summary.updatedSupabaseCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/program/:id/update] failed', error);
    return toErrorResponse(500, 'UPDATE_FAILED', `Failed to refresh program audio: ${details}`);
  }
}
