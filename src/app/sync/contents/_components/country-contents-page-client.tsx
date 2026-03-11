'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ProgressBar } from '../../../_components/progress-bar';
import { SectionCard } from '../../../_components/section-card';
import { JobHistory } from '../../../_components/job-history';
import { inputClass } from '../../../_components/runtime-options';
import { useSyncJobChannel } from '../../../_hooks/use-sync-job-channel';
import { AudioRefreshSuccess } from '../../../_lib/sync-types';
import { CountryOption, countryOptions, RankFilter, SortKey, TablePreset } from '../_types/country-contents.types';
import { useCountryContentsQuery } from '../_hooks/use-country-contents-query';
import { useCountryContentsView } from '../_hooks/use-country-contents-view';

export function CountryContentsPageClient() {
  const searchParams = useSearchParams();
  const channel = useSyncJobChannel<AudioRefreshSuccess['data']>();
  const {
    country,
    setCountry,
    tablePreset,
    setTablePreset,
    limit,
    cursorStack,
    nextCursor,
    hasMore,
    totalPrograms,
    totalPages,
    rankMatchedCount,
    loading,
    error,
    items,
    onSubmit,
    onNextPage,
    onPrevPage,
  } = useCountryContentsQuery({
    initialCountryRaw: searchParams.get('country'),
    initialTablePresetRaw: searchParams.get('tablePreset'),
  });

  const { searchKeyword, setSearchKeyword, rankFilter, setRankFilter, sortKey, setSortKey, visibleItems } =
    useCountryContentsView(items);

  const pageNumber = cursorStack.length + 1;

  const onRefreshCountryAudio = async () => {
    channel.queueJob();

    try {
      const response = await fetch('/api/sync/audio-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          tablePreset,
          options: {
            countryCode: country,
            downloadLimit: 0,
            audioBitrate: '128k',
          },
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        data?: { jobId?: string };
        error?: { code?: string; message?: string; details?: string };
      };

      if (!response.ok || !json.ok) {
        const code = json.error?.code ?? 'REQUEST_FAILED';
        const message =
          json.error?.details ?? json.error?.message ?? 'Failed to create audio refresh job';
        channel.setFailure(code, message);
        return;
      }

      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create audio refresh job');
      channel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      channel.setFailure('NETWORK_ERROR', message);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <SectionCard title='Country Content Query' subtitle='Filter programs by country code'>
        <form onSubmit={onSubmit} className='grid grid-cols-1 gap-3 sm:grid-cols-[180px_200px_auto] sm:items-end'>
          <div>
            <label className='block text-sm font-medium text-zinc-700'>Country</label>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value as CountryOption)}
              className={inputClass}
            >
              {countryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-700'>Table Preset</label>
            <select
              value={tablePreset}
              onChange={(event) => setTablePreset(event.target.value as TablePreset)}
              className={inputClass}
            >
              <option value='test'>test tables</option>
              <option value='main'>main tables</option>
            </select>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
          >
            {loading ? 'Loading...' : 'Load List'}
          </button>
        </form>
        <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <button
              type='button'
              onClick={() => {
                void onRefreshCountryAudio();
              }}
              disabled={channel.loading}
              className='rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60'
            >
              {channel.loading ? 'Refreshing country audio...' : 'Refresh Country Audio URLs'}
            </button>
            <p className='text-xs leading-relaxed text-amber-900'>
              Current filters 기준으로 이 언어/국가 그룹의 오디오 URL 전체 교체 job을 시작합니다.
            </p>
          </div>
          {channel.loading ? (
            <div className='mt-3'>
              <ProgressBar value={channel.progress} />
              <p className='mt-2 text-xs text-amber-950'>
                {channel.progress}% {channel.message}
              </p>
            </div>
          ) : null}
          {channel.result && !channel.result.ok ? (
            <p className='mt-2 text-xs text-rose-700'>
              [{channel.result.error.code}] {channel.result.error.message}
            </p>
          ) : null}
          {channel.result && channel.result.ok ? (
            <p className='mt-2 text-xs text-emerald-700'>
              {channel.result.data.country} processed {channel.result.data.processedPrograms}/
              {channel.result.data.matchedPrograms}, uploaded {channel.result.data.uploadedCount},
              updated {channel.result.data.updatedSupabaseCount}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title='View Options' subtitle='Sort and filter current page items'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div>
            <label className='block text-sm font-medium text-zinc-700'>Keyword</label>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder='Title or subtitle'
              className={inputClass}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700'>Rank Filter</label>
            <select
              value={rankFilter}
              onChange={(event) => setRankFilter(event.target.value as RankFilter)}
              className={inputClass}
            >
              <option value='all'>All</option>
              <option value='ranked'>Ranked only</option>
              <option value='unranked'>Unranked only</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700'>Sort</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className={inputClass}
            >
              <option value='rankAsc'>Rank (asc)</option>
              <option value='rankDesc'>Rank (desc)</option>
              <option value='titleAsc'>Title (A-Z)</option>
              <option value='titleDesc'>Title (Z-A)</option>
              <option value='idDesc'>Newest id</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {error ? (
        <section className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'>
          {error}
        </section>
      ) : null}

      <JobHistory entries={channel.history} title='Country Refresh History' />

      <SectionCard title={`Programs (Page ${pageNumber} / ${totalPages})`} subtitle={`${totalPrograms} total programs`}>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600'>
          <p>
            Showing up to {limit} items per page
          </p>
          <p>
            Current country: <span className='font-semibold text-zinc-800'>{country}</span>
          </p>
          <p>
            Rank mapped: <span className='font-semibold text-zinc-800'>{rankMatchedCount}</span>
          </p>
          <p>
            Visible after filter:{' '}
            <span className='font-semibold text-zinc-800'>{visibleItems.length}</span>
          </p>
        </div>

        <div className='mb-3 flex items-center gap-2'>
          <button
            type='button'
            onClick={onPrevPage}
            disabled={loading || cursorStack.length === 0}
            className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={onNextPage}
            disabled={loading || !hasMore || !nextCursor}
            className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50'
          >
            Next
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <p className='text-sm text-zinc-500'>{loading ? 'Loading list...' : 'No contents found.'}</p>
        ) : (
          <div className='grid grid-cols-1 gap-3'>
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={`/sync/contents/${item.id}?country=${encodeURIComponent(
                  country,
                )}&tablePreset=${encodeURIComponent(tablePreset)}`}
                className='grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-teal-300 hover:bg-teal-50/40'
              >
                <div className='h-[72px] w-[72px] overflow-hidden rounded-lg bg-zinc-100'>
                  {item.img_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.img_url} alt={item.title} className='h-full w-full object-cover' />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-[10px] text-zinc-500'>
                      No Image
                    </div>
                  )}
                </div>

                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-zinc-900'>{item.title}</p>
                  {item.subtitle ? (
                    <p className='mt-1 line-clamp-2 text-xs leading-5 text-zinc-500'>{item.subtitle}</p>
                  ) : null}
                  <div className='mt-2 flex flex-wrap gap-2 text-xs text-zinc-600'>
                    <span className='rounded-md bg-zinc-100 px-2 py-1'>id: {item.id}</span>
                    <span className='rounded-md bg-zinc-100 px-2 py-1'>
                      rank: {item.popularOrder ?? '-'}
                    </span>
                    {item.type ? <span className='rounded-md bg-zinc-100 px-2 py-1'>{item.type}</span> : null}
                    {item.language ? (
                      <span className='rounded-md bg-zinc-100 px-2 py-1'>
                        {Array.isArray(item.language) ? item.language.join(', ') : item.language}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
