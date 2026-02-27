'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { CountryContentItem, CountryOption, countryOptions, QueryResult, TablePreset } from './country-contents.types';

type UseCountryContentsQueryInput = {
  initialCountryRaw: string | null;
  initialTablePresetRaw: string | null;
  limit?: number;
};

function resolveInitialCountry(input: string | null): CountryOption {
  const normalized = (input ?? 'KO').toUpperCase();
  return countryOptions.includes(normalized as CountryOption) ? (normalized as CountryOption) : 'KO';
}

function resolveInitialTablePreset(input: string | null): TablePreset {
  return input === 'test' ? 'test' : 'main';
}

export function useCountryContentsQuery({
  initialCountryRaw,
  initialTablePresetRaw,
  limit = 24,
}: UseCountryContentsQueryInput) {
  const initialCountry = resolveInitialCountry(initialCountryRaw);
  const initialTablePreset = resolveInitialTablePreset(initialTablePresetRaw);

  const [country, setCountry] = useState<CountryOption>(initialCountry);
  const [tablePreset, setTablePreset] = useState<TablePreset>(initialTablePreset);
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

  const loadContents = useCallback(
    async (nextCountry: string, nextPreset: TablePreset, nextCursorInput: string | null) => {
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
    },
    [limit],
  );

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCurrentCursor(null);
      setCursorStack([]);
      await loadContents(country, tablePreset, null);
    },
    [country, loadContents, tablePreset],
  );

  const onNextPage = useCallback(async () => {
    if (!nextCursor || loading) return;
    setCursorStack((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
    await loadContents(country, tablePreset, nextCursor);
  }, [country, currentCursor, loadContents, loading, nextCursor, tablePreset]);

  const onPrevPage = useCallback(async () => {
    if (cursorStack.length === 0 || loading) return;
    const previousCursor = cursorStack[cursorStack.length - 1] ?? null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
    await loadContents(country, tablePreset, previousCursor);
  }, [country, cursorStack, loadContents, loading, tablePreset]);

  useEffect(() => {
    void loadContents(initialCountry, initialTablePreset, null);
  }, [initialCountry, initialTablePreset, loadContents]);

  return {
    country,
    setCountry,
    tablePreset,
    setTablePreset,
    limit,
    currentCursor,
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
  };
}

