import { NextResponse } from 'next/server';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type TablePreset = 'main' | 'test';

const COUNTRY_ALIAS_TO_CANONICAL: Record<string, string> = {
  kr: 'ko',
  ko: 'ko',
  us: 'en',
  en: 'en',
  de: 'de',
  ja: 'jp',
  jp: 'jp',
};

const POPULAR_THEME_BY_COUNTRY: Record<string, number> = {
  ko: 8,
  en: 12,
  de: 15,
  jp: 19,
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
  return input === 'main' ? 'main' : 'test';
}

function normalizeCountryCode(input: string) {
  return COUNTRY_ALIAS_TO_CANONICAL[input.toLowerCase()] ?? input.toLowerCase();
}

function resolveEpisodeLimit(input: string | null) {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) return 30;
  return Math.min(parsed, 100);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'id must be numeric');
    }

    const { searchParams } = new URL(request.url);
    const preset = resolvePreset(searchParams.get('tablePreset'));
    const country = normalizeCountryCode((searchParams.get('country') ?? 'ko').trim());
    const episodeLimit = resolveEpisodeLimit(searchParams.get('episodeLimit'));

    const tables = preset === 'main' ? MAIN_TABLES : TEST_TABLES;

    const { data: program, error: programError } = await supabase
      .from(tables.programs)
      .select('id,title,subtitle,img_url,type,language')
      .eq('id', id)
      .maybeSingle();

    if (programError) throw programError;
    if (!program) return toErrorResponse(404, 'NOT_FOUND', 'program not found');

    const themeId = POPULAR_THEME_BY_COUNTRY[country];
    const { data: themeRow, error: themeError } = themeId
      ? await supabase
          .from(tables.themesPrograms)
          .select('order,theme_id')
          .eq('theme_id', themeId)
          .eq('program_id', id)
          .maybeSingle()
      : { data: null, error: null };
    if (themeError) throw themeError;

    const { data: episodes, error: episodeError } = await supabase
      .from(tables.episodes)
      .select('id,title,date,duration,audio_file,img_url')
      .eq('program_id', id)
      .order('date', { ascending: false })
      .limit(episodeLimit);
    if (episodeError) throw episodeError;

    return NextResponse.json(
      {
        ok: true,
        data: {
          country: country.toUpperCase(),
          tablePreset: preset,
          program: {
            ...program,
            popularOrder: themeRow?.order ?? null,
            popularThemeId: themeRow?.theme_id ?? themeId ?? null,
            latestDuration: episodes?.[0]?.duration ?? null,
          },
          episodes: episodes ?? [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/program/:id] failed', error);
    return toErrorResponse(500, 'QUERY_FAILED', `Failed to fetch program detail: ${details}`);
  }
}
