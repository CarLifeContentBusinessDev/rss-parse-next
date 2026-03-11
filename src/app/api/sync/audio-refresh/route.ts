import { NextResponse } from 'next/server';

import { PartialSyncRuntimeOptions } from '@/config/syncRuntime';
import { createJob } from '@/jobs/runners';

export const runtime = 'nodejs';

type TablePreset = 'main' | 'test';

type ErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

function toErrorResponse(status: number, code: string, message: string, details?: string) {
  const body: ErrorBody = {
    ok: false,
    error: { code, message, details },
  };

  return NextResponse.json(body, { status });
}

function resolveTablePreset(input: unknown): TablePreset | null {
  if (input === undefined || input === null || input === '') return 'main';
  if (input === 'main' || input === 'test') return input;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      country?: string;
      tablePreset?: TablePreset;
      options?: PartialSyncRuntimeOptions;
    };

    const country = String(body.country ?? '').trim();
    if (!country) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'country is required');
    }

    const tablePreset = resolveTablePreset(body.tablePreset);
    if (!tablePreset) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'tablePreset must be main or test');
    }

    const jobId = createJob('audio-refresh', {
      country,
      tablePreset,
      options: body.options,
    });

    return NextResponse.json({ ok: true, data: { jobId } }, { status: 202 });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/sync/audio-refresh] failed', error);
    return toErrorResponse(500, 'SYNC_FAILED', 'Audio refresh job failed', details);
  }
}
