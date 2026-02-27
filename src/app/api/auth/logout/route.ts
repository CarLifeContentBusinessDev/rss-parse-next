import { NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

