'use client';

import { useState } from 'react';

import { useCategoryOptions } from '../../../_hooks/use-category-options';
import { useThemeOptions } from '../../../_hooks/use-theme-options';
import { defaultRuntimeState, RuntimeState } from '../../../_lib/runtime-options';
import { ExcelSyncPanel } from './excel-sync-panel';

export function ExcelSyncPageClient() {
  const [excelOptions, setExcelOptions] = useState<RuntimeState>(defaultRuntimeState);
  const [sheetName, setSheetName] = useState('IT_\uC774\uD0C8\uB9AC\uC544');
  const [headerSkip, setHeaderSkip] = useState('2');
  const { options: globalCategoryOptions } = useCategoryOptions(
    excelOptions.globalCategoryId,
    '기존값',
  );
  const { options: themeOptions } = useThemeOptions(excelOptions.themeId, '기존값');

  return (
    <ExcelSyncPanel
      options={excelOptions}
      setOptions={setExcelOptions}
      globalCategoryOptions={globalCategoryOptions}
      themeOptions={themeOptions}
      sheetName={sheetName}
      setSheetName={setSheetName}
      headerSkip={headerSkip}
      setHeaderSkip={setHeaderSkip}
    />
  );
}
