import { LoginPageClient } from './_components/login-page-client';

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === 'string' && params.next.trim() ? params.next : '/sync/rss';
  const error = typeof params.error === 'string' ? params.error : null;

  return <LoginPageClient nextPath={nextPath} initialError={error} />;
}

