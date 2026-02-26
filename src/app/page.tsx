'use client';

import { FormEvent, useMemo, useState } from 'react';

import { FieldHelp } from './_components/field-help';
import { ProgressBar } from './_components/progress-bar';
import { RuntimeOptions, inputClass } from './_components/runtime-options';
import { SectionCard } from './_components/section-card';
import { useSyncJobChannel } from './_hooks/use-sync-job-channel';
import { buildOptions, defaultRuntimeState, RuntimeState } from './_lib/runtime-options';
import { ExcelSyncSuccess, SyncSuccess } from './_lib/sync-types';

export default function Home() {
  const [rssUrl, setRssUrl] = useState('');
  const [rssOptions, setRssOptions] = useState<RuntimeState>(defaultRuntimeState);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState('IT_이탈리아');
  const [headerSkip, setHeaderSkip] = useState('2');
  const [copyDone, setCopyDone] = useState(false);
  const [excelOptions, setExcelOptions] = useState<RuntimeState>(defaultRuntimeState);

  const rssChannel = useSyncJobChannel<SyncSuccess['data']>();
  const excelChannel = useSyncJobChannel<ExcelSyncSuccess['data']>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    rssChannel.queueJob();

    try {
      const response = await fetch('/api/sync/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rssUrl,
          options: buildOptions(rssOptions, sheetName, headerSkip),
        }),
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create RSS job');
      rssChannel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      rssChannel.setFailure('NETWORK_ERROR', message);
    }
  };

  const onExcelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!excelFile) {
      excelChannel.setFailure('INVALID_REQUEST', '엑셀 파일을 선택하세요.');
      return;
    }

    excelChannel.queueJob();
    setCopyDone(false);

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      formData.append('sheetName', sheetName.trim());
      formData.append('headerSkip', headerSkip.trim());
      formData.append('countryCode', excelOptions.countryCode.trim());
      formData.append(
        'optionsJson',
        JSON.stringify(buildOptions(excelOptions, sheetName, headerSkip)),
      );

      const response = await fetch('/api/sync/excel', {
        method: 'POST',
        body: formData,
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create Excel job');
      excelChannel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      excelChannel.setFailure('NETWORK_ERROR', message);
    }
  };

  const rssSummary = useMemo(() => {
    if (!rssChannel.result || !rssChannel.result.ok) return null;
    return `RSS 처리 ${rssChannel.result.data.processedItems}/${rssChannel.result.data.totalItems} · 업로드 ${rssChannel.result.data.uploadedCount} · 업데이트 ${rssChannel.result.data.updatedSupabaseCount}`;
  }, [rssChannel.result]);

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
        <div className='flex flex-col gap-6'>
          <RuntimeOptions label='RSS 단건 옵션' state={rssOptions} setState={setRssOptions} />

          <SectionCard title='RSS 단건 실행'>
            <form onSubmit={onSubmit}>
              <input
                type='url'
                required
                placeholder='https://example.com/feed.xml'
                value={rssUrl}
                onChange={(event) => setRssUrl(event.target.value)}
                className={inputClass}
              />
              <button
                type='submit'
                disabled={rssChannel.loading}
                className='mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
              >
                {rssChannel.loading ? '동기화 중...' : '동기화 실행'}
              </button>
              {rssChannel.loading ? <ProgressBar value={rssChannel.progress} /> : null}
              {rssChannel.loading ? (
                <p className='mt-2 text-xs text-zinc-500'>{rssChannel.message}</p>
              ) : null}
            </form>
          </SectionCard>

          {rssChannel.result && !rssChannel.result.ok ? (
            <section className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'>
              [{rssChannel.result.error.code}] {rssChannel.result.error.message}
            </section>
          ) : null}
          {rssSummary ? (
            <section className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800'>
              {rssSummary}
            </section>
          ) : null}
        </div>

        <div className='flex flex-col gap-6'>
          <RuntimeOptions label='Excel 배치 옵션' state={excelOptions} setState={setExcelOptions} />

          <SectionCard title='Excel 배치 실행'>
            <form onSubmit={onExcelSubmit}>
              <input
                type='file'
                accept='.xlsx'
                required
                onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)}
                className='w-full text-sm text-zinc-700'
              />
              <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder='Sheet Name'
                  className={inputClass}
                />
                <input
                  value={headerSkip}
                  onChange={(e) => setHeaderSkip(e.target.value)}
                  type='number'
                  min={0}
                  placeholder='Header Skip'
                  className={inputClass}
                />
              </div>
              <FieldHelp>`Sheet Name`: 읽을 시트 이름, `Header Skip`: 건너뛸 행 수</FieldHelp>
              <button
                type='submit'
                disabled={excelChannel.loading}
                className='mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
              >
                {excelChannel.loading ? '배치 실행 중...' : 'Excel 실행'}
              </button>
              {excelChannel.loading ? <ProgressBar value={excelChannel.progress} /> : null}
              {excelChannel.loading ? (
                <p className='mt-2 text-xs text-zinc-500'>{excelChannel.message}</p>
              ) : null}
            </form>
          </SectionCard>

          {excelChannel.result && !excelChannel.result.ok ? (
            <section className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'>
              [{excelChannel.result.error.code}] {excelChannel.result.error.message}
            </section>
          ) : null}
          {excelChannel.result && excelChannel.result.ok ? (
            <section className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>
              <p className='font-medium'>
                Excel 성공 {excelChannel.result.data.succeededRows}/
                {excelChannel.result.data.totalRows}, 실패 {excelChannel.result.data.failedRows}
              </p>
              {excelChannel.result.data.failures.length > 0 ? (
                <div className='mt-3'>
                  <button
                    type='button'
                    onClick={async () => {
                      if (!excelChannel.result || !excelChannel.result.ok) return;
                      await navigator.clipboard.writeText(
                        excelChannel.result.data.failureReportCsv,
                      );
                      setCopyDone(true);
                    }}
                    className='rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600'
                  >
                    실패 CSV 복사
                  </button>
                  {copyDone ? <p className='mt-1 text-xs'>복사 완료</p> : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
