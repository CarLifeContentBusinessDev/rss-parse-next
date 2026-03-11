'use client';

import { useState } from 'react';

import { defaultRuntimeState, RuntimeState } from '@/app/_lib/runtime-options';

import { AudioRefreshPanel } from './audio-refresh-panel';

export function AudioRefreshPageClient() {
  const [options, setOptions] = useState<RuntimeState>({
    ...defaultRuntimeState,
    tablePreset: 'test',
  });
  const [sheetName, setSheetName] = useState('IT_이탈리아');
  const [headerSkip, setHeaderSkip] = useState('2');

  return (
    <AudioRefreshPanel
      options={options}
      setOptions={setOptions}
      sheetName={sheetName}
      setSheetName={setSheetName}
      headerSkip={headerSkip}
      setHeaderSkip={setHeaderSkip}
    />
  );
}
