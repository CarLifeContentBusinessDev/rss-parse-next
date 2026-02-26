'use client';

import { useState } from 'react';

import { ExcelSyncPanel } from './_components/panels/excel-sync-panel';
import { RSSSyncPanel } from './_components/panels/rss-sync-panel';
import { defaultRuntimeState, RuntimeState } from './_lib/runtime-options';

export default function Home() {
  const [rssOptions, setRssOptions] = useState<RuntimeState>(defaultRuntimeState);
  const [sheetName, setSheetName] = useState('IT_이탈리아');
  const [headerSkip, setHeaderSkip] = useState('2');
  const [excelOptions, setExcelOptions] = useState<RuntimeState>(defaultRuntimeState);

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1700px] flex-col gap-6 px-5 py-10 sm:px-8 xl:px-10'>
      <section className='relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.08)] backdrop-blur'>
        <div className='pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-cyan-200/60 blur-2xl' />
        <div className='pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl' />
        <h1 className='relative text-3xl font-semibold tracking-tight text-zinc-900'>
          RSS Sync Console
        </h1>
        <p className='relative mt-2 text-sm text-zinc-600'>
          RSS 단건과 Excel 배치를 독립 옵션으로 실행합니다.
        </p>
      </section>

      <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <RSSSyncPanel
          options={rssOptions}
          setOptions={setRssOptions}
          sheetName={sheetName}
          headerSkip={headerSkip}
        />
        <ExcelSyncPanel
          options={excelOptions}
          setOptions={setExcelOptions}
          sheetName={sheetName}
          setSheetName={setSheetName}
          headerSkip={headerSkip}
          setHeaderSkip={setHeaderSkip}
        />
      </section>
    </main>
  );
}