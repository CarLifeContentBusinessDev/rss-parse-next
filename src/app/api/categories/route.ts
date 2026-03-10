import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type CategoryRow = {
  id: number;
  title: string | null;
};

export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('id,title')
    .order('id', { ascending: true });

  if (error) {
    console.error('[api/categories] failed', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CATEGORY_FETCH_FAILED',
          message: '카테고리 목록을 불러오지 못했습니다.',
        },
      },
      { status: 500 },
    );
  }

  const items = ((data ?? []) as CategoryRow[]).map((item) => ({
    value: String(item.id),
    label: `${item.id} ${item.title ?? ''}`.trim(),
  }));

  return NextResponse.json({ ok: true, data: { items } });
}
