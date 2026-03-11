'use client';

import { useState } from 'react';
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
  const [rssUrl, setRssUrl] = useState('');

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
    processingProgram,
    processingProgramFromRss,
    processingEpisodeId,
    savingEpisodeId,
    deletingEpisodeId,
    onReprocessProgram,
    onReprocessProgramFromRss,
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
          <div className='flex flex-wrap gap-2'>
            <Link
              href={backHref}
              className='inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50'
            >
              Back to Contents
            </Link>
            <button
              type='button'
              onClick={() => {
                void onReprocessProgram();
              }}
              disabled={loading || processingProgram || !program}
              className='inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60'
            >
              {processingProgram ? 'Refreshing Program Audio...' : 'Refresh Program Audio'}
            </button>
          </div>
        </div>

        <div className='mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4'>
          <label className='block text-sm font-medium text-zinc-700'>RSS URL Source Refresh</label>
          <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
            <input
              type='url'
              value={rssUrl}
              onChange={(event) => setRssUrl(event.target.value)}
              placeholder='https://example.com/feed.xml'
              className='flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-500'
            />
            <button
              type='button'
              onClick={() => {
                void onReprocessProgramFromRss(rssUrl.trim());
              }}
              disabled={loading || processingProgramFromRss || !program || !rssUrl.trim()}
              className='inline-flex rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-60'
            >
              {processingProgramFromRss ? 'Refreshing From RSS...' : 'Refresh From RSS URL'}
            </button>
          </div>
          <p className='mt-2 text-xs text-zinc-500'>
            이 프로그램의 DB 에피소드를 RSS item의 title/date와 매칭해서 원본 enclosure URL로 다시
            생성합니다.
          </p>
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
