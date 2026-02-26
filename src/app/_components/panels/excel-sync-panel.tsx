'use client';

import { Dispatch, FormEvent, SetStateAction, useState } from 'react';

import { useSyncJobChannel } from '../../_hooks/use-sync-job-channel';
import { buildOptions, RuntimeState } from '../../_lib/runtime-options';
import { ExcelSyncSuccess } from '../../_lib/sync-types';

import { FieldHelp } from '../field-help';
import { ProgressBar } from '../progress-bar';
import { RuntimeOptions, inputClass } from '../runtime-options';
import { SectionCard } from '../section-card';

export function ExcelSyncPanel({
  options,
  setOptions,
  sheetName,
  setSheetName,
  headerSkip,
  setHeaderSkip,
}: {
  options: RuntimeState;
  setOptions: Dispatch<SetStateAction<RuntimeState>>;
  sheetName: string;
  setSheetName: Dispatch<SetStateAction<string>>;
  headerSkip: string;
  setHeaderSkip: Dispatch<SetStateAction<string>>;
}) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const channel = useSyncJobChannel<ExcelSyncSuccess['data']>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!excelFile) {
      channel.setFailure('INVALID_REQUEST', '엑셀 파일을 선택하세요.');
      return;
    }

    channel.queueJob();
    setCopyDone(false);

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      formData.append('sheetName', sheetName.trim());
      formData.append('headerSkip', headerSkip.trim());
      formData.append('countryCode', options.countryCode.trim());
      formData.append('optionsJson', JSON.stringify(buildOptions(options, sheetName, headerSkip)));

      const response = await fetch('/api/sync/excel', {
        method: 'POST',
        body: formData,
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create Excel job');
      channel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      channel.setFailure('NETWORK_ERROR', message);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <RuntimeOptions label='Excel 배치 옵션' state={options} setState={setOptions} />

      <SectionCard title='Excel 배치 실행'>
        <form onSubmit={onSubmit}>
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
            disabled={channel.loading}
            className='mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
          >
            {channel.loading ? '배치 실행 중...' : 'Excel 실행'}
          </button>
          {channel.loading ? <ProgressBar value={channel.progress} /> : null}
          {channel.loading ? <p className='mt-2 text-xs text-zinc-500'>{channel.message}</p> : null}
        </form>
      </SectionCard>

      {channel.result && !channel.result.ok ? (
        <section className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'>
          [{channel.result.error.code}] {channel.result.error.message}
        </section>
      ) : null}
      {channel.result && channel.result.ok ? (
        <section className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'>
          <p className='font-medium'>
            Excel 성공 {channel.result.data.succeededRows}/{channel.result.data.totalRows}, 실패{' '}
            {channel.result.data.failedRows}
          </p>
          {channel.result.data.failures.length > 0 ? (
            <div className='mt-3'>
              <button
                type='button'
                onClick={async () => {
                  if (!channel.result || !channel.result.ok) return;
                  await navigator.clipboard.writeText(channel.result.data.failureReportCsv);
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
  );
}