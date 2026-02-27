import { Suspense } from 'react';
import { CountryContentsPageClient } from './_components/country-contents-page-client';

export default function CountryContentsPage() {
  return (
    <Suspense fallback={<p className='text-sm text-zinc-500'>Loading contents...</p>}>
      <CountryContentsPageClient />
    </Suspense>
  );
}
