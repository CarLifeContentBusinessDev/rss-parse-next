import { NextResponse } from 'next/server';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type TablePreset = 'main' | 'test';
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

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

function resolveLimit(input: string | null) {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeCountryCode(input: string) {
  return COUNTRY_ALIAS_TO_CANONICAL[input.toLowerCase()] ?? input.toLowerCase();
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toProgramIdKey(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCountry = (searchParams.get('country') ?? '').trim();
    const country = normalizeCountryCode(rawCountry);
    const preset = resolvePreset(searchParams.get('tablePreset'));
    const limit = resolveLimit(searchParams.get('limit'));
    const cursor = (searchParams.get('cursor') ?? '').trim() || null;

    if (!country) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'country is required');
    }

    const tables = preset === 'main' ? MAIN_TABLES : TEST_TABLES;

    const countQuery = supabase
      .from(tables.programs)
      .select('id', { count: 'exact', head: true })
      .contains('language', [country]);

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const totalPrograms = count ?? 0;
    const totalPages = totalPrograms === 0 ? 1 : Math.ceil(totalPrograms / limit);

    let programsQuery = supabase
      .from(tables.programs)
      .select('id,title,subtitle,img_url,type,language')
      .contains('language', [country])
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      programsQuery = programsQuery.lt('id', cursor);
    }

    const { data: programRows, error: programsError } = await programsQuery;
    if (programsError) throw programsError;

    const hasMore = (programRows?.length ?? 0) > limit;
    const programs = (programRows ?? []).slice(0, limit);
    const programIds = programs
      .map((program) => toProgramIdKey(program.id))
      .filter((id): id is string => id !== null);

    const nextCursor = hasMore ? toProgramIdKey(programs[programs.length - 1]?.id) : null;

    if (programIds.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            country: country.toUpperCase(),
            tablePreset: preset,
            items: [],
            pagination: {
              limit,
              totalPrograms,
              totalPages,
              nextCursor: null,
              hasMore: false,
            },
            stats: {
              rankMatchedCount: 0,
            },
          },
        },
        { status: 200 },
      );
    }

    const themeId = POPULAR_THEME_BY_COUNTRY[country];
    const { data: themeRows, error: themeRowsError } = themeId
      ? await supabase
          .from(tables.themesPrograms)
          .select('program_id,order')
          .eq('theme_id', themeId)
          .in('program_id', programIds)
      : { data: [], error: null };
    if (themeRowsError) throw themeRowsError;

    const orderByProgram = new Map<string, number>();
    for (const row of themeRows ?? []) {
      const parsedOrder = toNullableNumber(row.order);
      const parsedProgramId = toProgramIdKey(row.program_id);
      if (parsedProgramId !== null && parsedOrder !== null) {
        orderByProgram.set(parsedProgramId, parsedOrder);
      }
    }

    const items = programs.map((program) => {
      const key = toProgramIdKey(program.id) ?? '';
      return {
        ...program,
        popularOrder: orderByProgram.get(key) ?? null,
      };
    });

    const rankMatchedCount = items.filter((item) => item.popularOrder !== null).length;

    return NextResponse.json(
      {
        ok: true,
        data: {
          country: country.toUpperCase(),
          tablePreset: preset,
          items,
          pagination: {
            limit,
            totalPrograms,
            totalPages,
            nextCursor,
            hasMore,
          },
          stats: {
            rankMatchedCount,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/by-country] failed', error);
    return toErrorResponse(500, 'QUERY_FAILED', `Failed to fetch contents by country: ${details}`);
  }
}
