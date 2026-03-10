'use client';

import { useState } from 'react';

import { useCategoryOptions } from '../../../_hooks/use-category-options';
import { useThemeOptions } from '../../../_hooks/use-theme-options';
import { defaultRuntimeState, RuntimeState } from '../../../_lib/runtime-options';
import { RSSSyncPanel } from './rss-sync-panel';

export function RSSSyncPageClient() {
  const [rssOptions, setRssOptions] = useState<RuntimeState>(defaultRuntimeState);
  const [sheetName] = useState('IT_\uC774\uD0C8\uB9AC\uC544');
  const [headerSkip] = useState('2');
  const [categoryId, setCategoryId] = useState('');
  const { options: globalCategoryOptions } = useCategoryOptions(rssOptions.globalCategoryId, '기존값');
  const { options: rssCategoryOptions } = useCategoryOptions(categoryId, '기존값');
  const { options: themeOptions } = useThemeOptions(rssOptions.themeId, '기존값');

  return (
    <RSSSyncPanel
      options={rssOptions}
      setOptions={setRssOptions}
      categoryId={categoryId}
      setCategoryId={setCategoryId}
      globalCategoryOptions={globalCategoryOptions}
      rssCategoryOptions={rssCategoryOptions}
      themeOptions={themeOptions}
      sheetName={sheetName}
      headerSkip={headerSkip}
    />
  );
}
