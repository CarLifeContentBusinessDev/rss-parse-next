'use client';

import { useEffect, useMemo, useState } from 'react';

export type ThemeOption = {
  value: string;
  label: string;
};

type ThemeResponse = {
  ok: boolean;
  data?: { items?: ThemeOption[] };
};

function mergeCurrentValue(
  items: ThemeOption[],
  currentValue?: string,
  fallbackLabel?: string,
): ThemeOption[] {
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

export function useThemeOptions(currentValue?: string, fallbackLabel?: string) {
  const [items, setItems] = useState<ThemeOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/themes');
        const json = (await response.json()) as ThemeResponse;
        if (!response.ok || !json.ok) {
          throw new Error('테마 목록 조회 실패');
        }

        if (!cancelled) {
          setItems(json.data?.items ?? []);
        }
      } catch (error) {
        console.error('[useThemeOptions] failed', error);
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
