'use client';

import { useEffect, useMemo, useState } from 'react';

export type CategoryOption = {
  value: string;
  label: string;
};

type CategoryResponse = {
  ok: boolean;
  data?: { items?: CategoryOption[] };
};

function mergeCurrentValue(
  items: CategoryOption[],
  currentValue?: string,
  fallbackLabel?: string,
): CategoryOption[] {
  if (!currentValue || items.some((item) => item.value === currentValue)) {
    return items;
  }

  return [
    {
      value: currentValue,
      label: fallbackLabel ? `${currentValue} ${fallbackLabel}` : `${currentValue} 기존값`,
    },
    ...items,
  ];
}

export function useCategoryOptions(currentValue?: string, fallbackLabel?: string) {
  const [items, setItems] = useState<CategoryOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/categories');
        const json = (await response.json()) as CategoryResponse;
        if (!response.ok || !json.ok) {
          throw new Error('카테고리 목록 조회 실패');
        }

        if (!cancelled) {
          setItems(json.data?.items ?? []);
        }
      } catch (error) {
        console.error('[useCategoryOptions] failed', error);
        if (!cancelled) {
          setItems([]);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () => mergeCurrentValue(items, currentValue, fallbackLabel),
    [items, currentValue, fallbackLabel],
  );

  return { options };
}
