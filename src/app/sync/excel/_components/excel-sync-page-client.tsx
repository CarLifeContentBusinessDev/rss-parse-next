'use client';

import { useState } from 'react';

import { defaultRuntimeState, RuntimeState } from '../../../_lib/runtime-options';
import { ExcelSyncPanel } from './excel-sync-panel';

export function ExcelSyncPageClient() {
  const [excelOptions, setExcelOptions] = useState<RuntimeState>(defaultRuntimeState);
  const [sheetName, setSheetName] = useState('IT_\uC774\uD0C8\uB9AC\uC544');
  const [headerSkip, setHeaderSkip] = useState('2');

  return (
    <ExcelSyncPanel
      options={excelOptions}
      setOptions={setExcelOptions}
      sheetName={sheetName}
      setSheetName={setSheetName}
      headerSkip={headerSkip}
      setHeaderSkip={setHeaderSkip}
    />
  );
}
