'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginPageClientProps = {
  nextPath: string;
  initialError: string | null;
};

function toUserMessage(errorCode: string | null) {
  if (errorCode === 'forbidden') return '허용된 관리자 이메일이 아닙니다.';
  return null;
}

export function LoginPageClient({ nextPath, initialError }: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(toUserMessage(initialError));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const json = (await response.json()) as { ok: boolean; error?: { message?: string } };
      if (!json.ok) {
        setError(json.error?.message ?? '로그인에 실패했습니다.');
        return;
      }

      router.replace(nextPath || '/sync/rss');
      router.refresh();
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : '로그인 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10'>
      <section className='w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm'>
        <h1 className='text-xl font-semibold text-zinc-900'>Admin Login</h1>
        <p className='mt-2 text-sm text-zinc-600'>허용된 관리자 이메일로 로그인하세요.</p>

        <form className='mt-5 space-y-3' onSubmit={onSubmit}>
          <input
            type='email'
            required
            placeholder='admin@example.com'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className='w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-900/20 transition focus:ring'
          />
          <input
            type='password'
            required
            placeholder='Password'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className='w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-900/20 transition focus:ring'
          />
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {error ? (
          <p className='mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

