import { Suspense } from 'react';
import { ProgramDetailPageClient } from './_components/program-detail-page-client';

export default function ProgramDetailPage() {
  return (
    <Suspense fallback={<p className='text-sm text-zinc-500'>Loading program detail...</p>}>
      <ProgramDetailPageClient />
    </Suspense>
  );
}
