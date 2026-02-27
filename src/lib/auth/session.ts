import { createClient, User } from '@supabase/supabase-js';

export const ACCESS_TOKEN_COOKIE = 'rss_sync_access_token';
export const REFRESH_TOKEN_COOKIE = 'rss_sync_refresh_token';

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function createAnonClient() {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_ANON_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createAnonClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function getUserFromAccessToken(accessToken: string): Promise<User | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function refreshSession(refreshToken: string) {
  const supabase = createAnonClient();
  return supabase.auth.refreshSession({ refresh_token: refreshToken });
}

export function getAuthCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

