import { NextResponse } from 'next/server';

import { MAIN_TABLES, TEST_TABLES } from '@/app/_lib/runtime-options.constants';
import { supabase } from '@/lib/supabase';

type TablePreset = 'main' | 'test';

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'id must be numeric');
    }

    const body = (await request.json().catch(() => ({}))) as {
      tablePreset?: TablePreset;
      patch?: {
        title?: string | null;
        date?: string | null;
        duration?: string | null;
        audio_file?: string | null;
        img_url?: string | null;
      };
    };

    const preset = resolvePreset(body.tablePreset ?? null);
    const tables = preset === 'main' ? MAIN_TABLES : TEST_TABLES;
    const patch = body.patch ?? {};

    const updatePayload: Record<string, string | null> = {};

    if ('title' in patch && patch.title !== undefined) {
      const normalized = String(patch.title ?? '').trim();
      if (!normalized) {
        return toErrorResponse(400, 'INVALID_REQUEST', 'title cannot be empty');
      }
      updatePayload.title = normalized;
    }
    if ('date' in patch && patch.date !== undefined) {
      const normalized = String(patch.date ?? '').trim();
      updatePayload.date = normalized || null;
    }
    if ('duration' in patch && patch.duration !== undefined) {
      const normalized = String(patch.duration ?? '').trim();
      updatePayload.duration = normalized || null;
    }
    if ('audio_file' in patch && patch.audio_file !== undefined) {
      const normalized = String(patch.audio_file ?? '').trim();
      updatePayload.audio_file = normalized || null;
    }
    if ('img_url' in patch && patch.img_url !== undefined) {
      const normalized = String(patch.img_url ?? '').trim();
      updatePayload.img_url = normalized || null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'no editable fields provided');
    }

    const { data, error } = await supabase
      .from(tables.episodes)
      .update(updatePayload)
      .eq('id', id)
      .select('id,title,date,duration,audio_file,img_url')
      .maybeSingle();

    if (error) throw error;
    if (!data) return toErrorResponse(404, 'NOT_FOUND', 'episode not found');

    return NextResponse.json(
      {
        ok: true,
        data: {
          episode: data,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/episode/:id] patch failed', error);
    return toErrorResponse(500, 'UPDATE_FAILED', `Failed to patch episode: ${details}`);
  }
}
