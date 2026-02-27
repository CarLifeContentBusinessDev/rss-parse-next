import { NextResponse } from 'next/server';

import { isAdminEmail } from '@/lib/auth/admin';
import {
  ACCESS_TOKEN_COOKIE,
  getAuthCookieOptions,
  REFRESH_TOKEN_COOKIE,
  signInWithPassword,
} from '@/lib/auth/session';

function toErrorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return toErrorResponse(400, 'INVALID_REQUEST', 'email and password are required');
    }

    const { data, error } = await signInWithPassword(email, password);
    if (error || !data.user || !data.session) {
      return toErrorResponse(401, 'INVALID_CREDENTIALS', 'invalid email or password');
    }

    if (!isAdminEmail(data.user.email)) {
      return toErrorResponse(403, 'FORBIDDEN', 'admin email required');
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    const accessMaxAge = Math.max(data.session.expires_in ?? 3600, 60);
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      data.session.access_token,
      getAuthCookieOptions(accessMaxAge),
    );
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      data.session.refresh_token,
      getAuthCookieOptions(60 * 60 * 24 * 30),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return toErrorResponse(500, 'LOGIN_FAILED', message);
  }
}

