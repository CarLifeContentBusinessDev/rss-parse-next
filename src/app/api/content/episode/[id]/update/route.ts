import path from 'node:path';
import { NextResponse } from 'next/server';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { resolveSyncOptions } from '@/config/syncRuntime';
import { downloadEpisodeFiles, sanitizeFileName, validateSyncEnv } from '@/services/syncPodcastCommon';
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const { data: episode, error: episodeError } = await supabase
      .from(tables.episodes)
      .select('id,title,audio_file,img_url,program_id')
      .eq('id', id)
      .maybeSingle();
    if (episodeError) throw episodeError;
    if (!episode) return toErrorResponse(404, 'NOT_FOUND', 'episode not found');

    const { data: program, error: programError } = await supabase
      .from(tables.programs)
      .select('id,title,img_url')
      .eq('id', episode.program_id)
      .maybeSingle();
    if (programError) throw programError;
    if (!program) return toErrorResponse(404, 'NOT_FOUND', 'program not found');

    if (!episode.audio_file && !episode.img_url) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'episode has no audio/image source url');
    }

    const options = resolveSyncOptions({
      countryCode: country,
      downloadFiles: true,
      downloadLimit: 1,
      tables,
    });

    const baseDir = path.join(process.cwd(), 'downloads_compress', sanitizeFileName(program.title));
    const summary = await downloadEpisodeFiles(
      baseDir,
      program.id,
      country,
      [
        {
          id: episode.id,
          title: episode.title,
          audio_file: episode.audio_file,
          img_url: episode.img_url,
        },
      ],
      null,
      program.title,
      options,
    );

    const { data: refreshedEpisode, error: refreshedError } = await supabase
      .from(tables.episodes)
      .select('id,title,audio_file,img_url,duration,date')
      .eq('id', id)
      .maybeSingle();
    if (refreshedError) throw refreshedError;

    return NextResponse.json(
      {
        ok: true,
        data: {
          episode: refreshedEpisode,
          uploadedCount: summary.uploadedCount,
          updatedSupabaseCount: summary.updatedSupabaseCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/episode/:id/update] failed', error);
    return toErrorResponse(500, 'UPDATE_FAILED', `Failed to update episode: ${details}`);
  }
}
