import { NextResponse } from 'next/server';
import { PartialSyncRuntimeOptions } from '@/config/syncRuntime';
import { createJob } from '@/jobs/runners';

export const runtime = 'nodejs';

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

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rssUrl?: string;
      options?: PartialSyncRuntimeOptions;
    };
    const rssUrl = body.rssUrl?.trim();

    if (!rssUrl) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'rssUrl is required');
    }

    if (!isValidHttpUrl(rssUrl)) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'rssUrl must be a valid http/https URL');
    }

    const jobId = createJob('rss', { rssUrl, options: body.options });
    return NextResponse.json({ ok: true, data: { jobId } }, { status: 202 });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/sync/rss] failed', error);
    return toErrorResponse(500, 'SYNC_FAILED', 'RSS sync failed', details);
  }
}
