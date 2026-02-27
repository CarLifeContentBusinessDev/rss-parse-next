import { NextRequest, NextResponse } from 'next/server';

import { isAdminEmail } from '@/lib/auth/admin';
import {
  ACCESS_TOKEN_COOKIE,
  getAuthCookieOptions,
  getUserFromAccessToken,
  REFRESH_TOKEN_COOKIE,
  refreshSession,
} from '@/lib/auth/session';

function isApiRequest(pathname: string) {
  return pathname.startsWith('/api/');
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

async function resolveUserAndResponse(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;

  const response = NextResponse.next();

  if (!accessToken) {
    return { user: null, response };
  }

  const user = await getUserFromAccessToken(accessToken);
  if (user) {
    return { user, response };
  }

  if (!refreshToken) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return { user: null, response };
  }

  const { data, error } = await refreshSession(refreshToken);
  if (error || !data.session || !data.user) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return { user: null, response };
  }

  const accessMaxAge = Math.max(data.session.expires_in ?? 3600, 60);
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token, getAuthCookieOptions(accessMaxAge));
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    data.session.refresh_token,
    getAuthCookieOptions(60 * 60 * 24 * 30),
  );

  return { user: data.user, response };
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { user, response } = await resolveUserAndResponse(request);
  const isLoginPage = pathname === '/login';
  const isProtectedPage = pathname.startsWith('/sync');
  const isProtectedApi =
    pathname.startsWith('/api/sync') ||
    pathname.startsWith('/api/content') ||
    pathname.startsWith('/api/jobs');

  if (!isLoginPage && !isProtectedPage && !isProtectedApi) {
    return response;
  }

  const isAdmin = isAdminEmail(user?.email);

  if (isLoginPage) {
    if (user && isAdmin) {
      return NextResponse.redirect(new URL('/sync/rss', request.url));
    }
    return response;
  }

  if (!user) {
    if (isApiRequest(pathname)) {
      return jsonError(401, 'UNAUTHORIZED', 'login required');
    }
    const nextPath = `${pathname}${search}`;
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  if (!isAdmin) {
    if (isApiRequest(pathname)) {
      return jsonError(403, 'FORBIDDEN', 'admin email required');
    }
    return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/sync/:path*', '/api/sync/:path*', '/api/content/:path*', '/api/jobs/:path*', '/login'],
};

