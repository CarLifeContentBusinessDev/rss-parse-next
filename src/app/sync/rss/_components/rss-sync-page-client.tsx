'use client';

import { useState } from 'react';

import { defaultRuntimeState, RuntimeState } from '../../../_lib/runtime-options';
import { RSSSyncPanel } from './rss-sync-panel';

export function RSSSyncPageClient() {
  const [rssOptions, setRssOptions] = useState<RuntimeState>(defaultRuntimeState);
  const [sheetName] = useState('IT_\uC774\uD0C8\uB9AC\uC544');
  const [headerSkip] = useState('2');

  return (
    <RSSSyncPanel
      options={rssOptions}
      setOptions={setRssOptions}
      sheetName={sheetName}
      headerSkip={headerSkip}
    />
  );
}
