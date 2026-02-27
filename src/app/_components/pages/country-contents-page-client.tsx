'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { SectionCard } from '../section-card';
import { inputClass } from '../runtime-options';

type TablePreset = 'test' | 'main';

type CountryContentItem = {
  id: number;
  title: string;
  subtitle: string | null;
  img_url: string | null;
  type: string | null;
  language: string[] | string | null;
  popularOrder: number | null;
  latestDuration: string | null;
};

type QueryResult = {
  ok: boolean;
  data?: {
    country: string;
    tablePreset: TablePreset;
    items: CountryContentItem[];
    pagination: {
      limit: number;
      totalPrograms: number;
      totalPages: number;
      nextCursor: string | null;
      hasMore: boolean;
    };
    stats?: {
      rankMatchedCount: number;
    };
  };
  error?: { code: string; message: string };
};

type RankFilter = 'all' | 'ranked' | 'unranked';
type SortKey = 'rankAsc' | 'rankDesc' | 'titleAsc' | 'titleDesc' | 'idDesc' | 'durationDesc';

function durationToSeconds(input: string | null) {
  if (!input) return -1;
  const parts = input.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return -1;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return -1;
}

export function CountryContentsPageClient() {
  const [country, setCountry] = useState('KO');
  const [tablePreset, setTablePreset] = useState<TablePreset>('main');
  const [limit] = useState(24);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rankMatchedCount, setRankMatchedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CountryContentItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rankAsc');

  const loadContents = async (
    nextCountry: string,
    nextPreset: TablePreset,
    nextCursorInput: string | null,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const cursorQuery = nextCursorInput ? `&cursor=${encodeURIComponent(String(nextCursorInput))}` : '';
      const response = await fetch(
        `/api/content/by-country?country=${encodeURIComponent(
          nextCountry,
        )}&tablePreset=${encodeURIComponent(nextPreset)}&limit=${limit}${cursorQuery}`,
      );
      const json = (await response.json()) as QueryResult;

      if (!json.ok || !json.data) {
        setItems([]);
        setHasMore(false);
        setNextCursor(null);
        setTotalPrograms(0);
        setTotalPages(1);
        setRankMatchedCount(0);
        setError(json.error?.message ?? 'Unknown query failure');
        return;
      }

      setItems(json.data.items);
      setHasMore(json.data.pagination.hasMore);
      setNextCursor(json.data.pagination.nextCursor);
      setTotalPrograms(json.data.pagination.totalPrograms);
      setTotalPages(json.data.pagination.totalPages);
      setRankMatchedCount(json.data.stats?.rankMatchedCount ?? 0);
    } catch (queryError) {
      const message = queryError instanceof Error ? queryError.message : 'Network error';
      setItems([]);
      setHasMore(false);
      setNextCursor(null);
      setTotalPrograms(0);
      setTotalPages(1);
      setRankMatchedCount(0);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = country.trim().toUpperCase();
    setCountry(normalized);
    setCurrentCursor(null);
    setCursorStack([]);
    await loadContents(normalized, tablePreset, null);
  };

  const onNextPage = async () => {
    if (!nextCursor || loading) return;
    setCursorStack((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
    await loadContents(country, tablePreset, nextCursor);
  };

  const onPrevPage = async () => {
    if (cursorStack.length === 0 || loading) return;
    const previousCursor = cursorStack[cursorStack.length - 1] ?? null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
    await loadContents(country, tablePreset, previousCursor);
  };

  const pageNumber = cursorStack.length + 1;
  const visibleItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    let filtered = items.filter((item) => {
      const passKeyword =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        (item.subtitle ?? '').toLowerCase().includes(keyword);
      const passRank =
        rankFilter === 'all' ||
        (rankFilter === 'ranked' && item.popularOrder !== null) ||
        (rankFilter === 'unranked' && item.popularOrder === null);
      return passKeyword && passRank;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'rankAsc': {
          const left = a.popularOrder ?? Number.MAX_SAFE_INTEGER;
          const right = b.popularOrder ?? Number.MAX_SAFE_INTEGER;
          return left - right;
        }
        case 'rankDesc': {
          const left = a.popularOrder ?? Number.MIN_SAFE_INTEGER;
          const right = b.popularOrder ?? Number.MIN_SAFE_INTEGER;
          return right - left;
        }
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'idDesc':
          return b.id - a.id;
        case 'durationDesc':
          return durationToSeconds(b.latestDuration) - durationToSeconds(a.latestDuration);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, rankFilter, searchKeyword, sortKey]);

  useEffect(() => {
    void loadContents(country, tablePreset, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='flex flex-col gap-6'>
      <SectionCard title='Country Content Query' subtitle='Filter programs by country code'>
        <form onSubmit={onSubmit} className='grid grid-cols-1 gap-3 sm:grid-cols-[180px_200px_auto] sm:items-end'>
          <div>
            <label className='block text-sm font-medium text-zinc-700'>Country</label>
            <input
              value={country}
              maxLength={8}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              placeholder='IT'
              className={inputClass}
            />
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
              <option value='durationDesc'>Duration (longest)</option>
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
              <article
                key={item.id}
                className='grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-zinc-200 bg-white p-3'
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
                    <span className='rounded-md bg-zinc-100 px-2 py-1'>
                      duration: {item.latestDuration ?? '-'}
                    </span>
                    {item.type ? <span className='rounded-md bg-zinc-100 px-2 py-1'>{item.type}</span> : null}
                    {item.language ? (
                      <span className='rounded-md bg-zinc-100 px-2 py-1'>
                        {Array.isArray(item.language) ? item.language.join(', ') : item.language}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
