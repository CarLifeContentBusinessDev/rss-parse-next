'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useGlobalAudio } from 'react-global-audio';

import { EpisodeList } from './episode-list';
import { ProgramSummaryCard } from './program-summary-card';
import { SectionCard } from '@/app/_components/section-card';
import { useProgramDetailQuery } from '../_hooks/use-program-detail-query';

export function ProgramDetailPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = params?.id;
  const country = (searchParams.get('country') ?? 'KO').toUpperCase();
  const tablePreset = searchParams.get('tablePreset') === 'test' ? 'test' : 'main';

  const { state: audioState, controls } = useGlobalAudio({
    rememberProgress: true,
    storage: 'sessionStorage',
  });
  const {
    loading,
    error,
    program,
    episodes,
    actionMessage,
    processingEpisodeId,
    savingEpisodeId,
    deletingEpisodeId,
    onReprocessEpisode,
    onSaveEpisode,
    onDeleteEpisode,
  } = useProgramDetailQuery({
    id,
    country,
    tablePreset,
  });

  const backHref = `/sync/contents?country=${encodeURIComponent(country)}&tablePreset=${encodeURIComponent(
    tablePreset,
  )}`;

  return (
    <div className='flex flex-col gap-6'>
      <SectionCard title='Program Detail' subtitle={`Program id: ${id ?? '-'}`}>
        <div className='mb-4'>
          <Link
            href={backHref}
            className='inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50'
          >
            Back to Contents
          </Link>
        </div>

        {loading ? <p className='text-sm text-zinc-500'>Loading detail...</p> : null}
        {error ? <p className='text-sm text-rose-700'>{error}</p> : null}

        {program ? <ProgramSummaryCard program={program} /> : null}
      </SectionCard>

      <SectionCard title={`Episodes (${episodes.length})`} subtitle='Latest first'>
        {actionMessage ? (
          <p className='mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700'>
            {actionMessage}
          </p>
        ) : null}
        <EpisodeList
          episodes={episodes}
          loading={loading}
          audioState={audioState}
          controls={controls}
          processingEpisodeId={processingEpisodeId}
          savingEpisodeId={savingEpisodeId}
          deletingEpisodeId={deletingEpisodeId}
          onReprocessEpisode={onReprocessEpisode}
          onSaveEpisode={onSaveEpisode}
          onDeleteEpisode={onDeleteEpisode}
        />
      </SectionCard>
    </div>
  );
}
