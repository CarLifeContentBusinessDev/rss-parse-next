import { NextResponse } from 'next/server';

import { refreshAudioFromRssSource } from '@/services/refreshAudioFromRssSource';

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

function normalizeCountryCode(input: string) {
  return (COUNTRY_ALIAS_TO_CANONICAL[input.toLowerCase()] ?? input.toLowerCase()).toUpperCase();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'id must be numeric');
    }

    const body = (await request.json().catch(() => ({}))) as {
      rssUrl?: string;
      country?: string;
      tablePreset?: TablePreset;
    };

    const rssUrl = String(body.rssUrl ?? '').trim();
    if (!rssUrl) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'rssUrl is required');
    }

    const result = await refreshAudioFromRssSource({
      programId: Number(id),
      rssUrl,
      country: normalizeCountryCode((body.country ?? 'KO').trim() || 'KO'),
      tablePreset: body.tablePreset === 'test' ? 'test' : 'main',
    });

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/program/:id/update-from-rss] failed', error);
    return toErrorResponse(500, 'UPDATE_FAILED', `Failed to refresh program audio: ${details}`);
  }
}
