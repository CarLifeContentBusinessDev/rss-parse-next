'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { SectionCard } from '../../../_components/section-card';
import { inputClass } from '../../../_components/runtime-options';
import { CountryOption, countryOptions, RankFilter, SortKey, TablePreset } from '../_types/country-contents.types';
import { useCountryContentsQuery } from '../_hooks/use-country-contents-query';
import { useCountryContentsView } from '../_hooks/use-country-contents-view';

export function CountryContentsPageClient() {
  const searchParams = useSearchParams();
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
