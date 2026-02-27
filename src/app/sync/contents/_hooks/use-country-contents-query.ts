'use client';

import { FormEvent, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CountryOption, countryOptions, QueryResult, TablePreset } from '../_types/country-contents.types';

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

async function fetchCountryContents(
  country: string,
  tablePreset: TablePreset,
  limit: number,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<QueryResult['data']> {
  const cursorQuery = cursor ? `&cursor=${encodeURIComponent(String(cursor))}` : '';
  const response = await fetch(
    `/api/content/by-country?country=${encodeURIComponent(
      country,
    )}&tablePreset=${encodeURIComponent(tablePreset)}&limit=${limit}${cursorQuery}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch contents (${response.status})`);
  }

  const json = (await response.json()) as QueryResult;
  if (!json.ok || !json.data) {
    throw new Error(json.error?.message ?? 'Unknown query failure');
  }

  return json.data;
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
  const [appliedCountry, setAppliedCountry] = useState<CountryOption>(initialCountry);
  const [appliedTablePreset, setAppliedTablePreset] = useState<TablePreset>(initialTablePreset);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);

  const query = useQuery({
    queryKey: ['country-contents', appliedCountry, appliedTablePreset, limit, currentCursor],
    queryFn: ({ signal }) =>
      fetchCountryContents(appliedCountry, appliedTablePreset, limit, currentCursor, signal),
    retry: 1,
  });

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const sameQuery =
        country === appliedCountry && tablePreset === appliedTablePreset && currentCursor === null;

      setCurrentCursor(null);
      setCursorStack([]);
      setAppliedCountry(country);
      setAppliedTablePreset(tablePreset);

      if (sameQuery) {
        await query.refetch();
      }
    },
    [appliedCountry, appliedTablePreset, country, currentCursor, query, tablePreset],
  );

  const onNextPage = useCallback(async () => {
    const nextCursor = query.data?.pagination.nextCursor ?? null;
    const hasMore = query.data?.pagination.hasMore ?? false;
    if (!nextCursor || !hasMore || query.isFetching) return;
    setCursorStack((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
  }, [currentCursor, query.data, query.isFetching]);

  const onPrevPage = useCallback(async () => {
    if (cursorStack.length === 0 || query.isFetching) return;
    const previousCursor = cursorStack[cursorStack.length - 1] ?? null;
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
  }, [cursorStack, query.isFetching]);

  return {
    country,
    setCountry,
    tablePreset,
    setTablePreset,
    limit,
    currentCursor,
    cursorStack,
    nextCursor: query.data?.pagination.nextCursor ?? null,
    hasMore: query.data?.pagination.hasMore ?? false,
    totalPrograms: query.data?.pagination.totalPrograms ?? 0,
    totalPages: query.data?.pagination.totalPages ?? 1,
    rankMatchedCount: query.data?.stats?.rankMatchedCount ?? 0,
    loading: query.isPending || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    items: query.data?.items ?? [],
    onSubmit,
    onNextPage,
    onPrevPage,
  };
}
