'use client';

import { Dispatch, FormEvent, SetStateAction, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ProgressBar } from '@/app/_components/progress-bar';
import { RuntimeOptions } from '@/app/_components/runtime-options';
import { SectionCard } from '@/app/_components/section-card';
import { CategoryOption } from '@/app/_hooks/use-category-options';
import { ThemeOption } from '@/app/_hooks/use-theme-options';
import { useSyncJobChannel } from '@/app/_hooks/use-sync-job-channel';
import { buildOptions, RuntimeState } from '@/app/_lib/runtime-options';
import { ExcelSyncSuccess } from '@/app/_lib/sync-types';

export function ExcelSyncPanel({
  options,
  setOptions,
  globalCategoryOptions,
  themeOptions,
  sheetName,
  setSheetName,
  headerSkip,
  setHeaderSkip,
}: {
  options: RuntimeState;
  setOptions: Dispatch<SetStateAction<RuntimeState>>;
  globalCategoryOptions: CategoryOption[];
  themeOptions: ThemeOption[];
  sheetName: string;
  setSheetName: Dispatch<SetStateAction<string>>;
  headerSkip: string;
  setHeaderSkip: Dispatch<SetStateAction<string>>;
}) {
  const formId = 'excel-sync-form';
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const channel = useSyncJobChannel<ExcelSyncSuccess['data']>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!excelFile) {
      channel.setFailure('INVALID_REQUEST', 'Excel file is required');
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

      const json = (await response.json()) as {
        ok: boolean;
        data?: { jobId?: string };
        error?: { code?: string; message?: string; details?: string };
      };

      if (!response.ok || !json.ok) {
        const code = json.error?.code ?? 'REQUEST_FAILED';
        const message = json.error?.details ?? json.error?.message ?? 'Failed to create Excel job';
        channel.setFailure(code, message);
        return;
      }

      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create Excel job');
      channel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      channel.setFailure('NETWORK_ERROR', message);
    }
  };

  return (
    <div className='space-y-6'>
      <SectionCard
        title='Excel 배치 실행'
        subtitle='.xlsx 파일을 업로드하고 파싱 옵션을 설정한 뒤 배치 작업을 실행합니다.'
      >
        <form id={formId} onSubmit={onSubmit} className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='excel-file'>Excel 파일</Label>
            <Input
              id='excel-file'
              type='file'
              accept='.xlsx'
              required
              onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)}
              className='h-auto cursor-pointer py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='sheet-name'>시트 이름</Label>
              <Input
                id='sheet-name'
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder='시트 이름'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='header-skip'>헤더 스킵</Label>
              <Input
                id='header-skip'
                value={headerSkip}
                onChange={(event) => setHeaderSkip(event.target.value)}
                type='number'
                min={0}
                placeholder='건너뛸 헤더 행 수'
              />
            </div>
          </div>

          <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs leading-relaxed text-zinc-500'>
            `시트 이름`은 읽을 워크시트를 지정합니다. `헤더 스킵`은 필드 매핑 시작 전
            건너뛸 행 수를 뜻합니다.
          </div>
        </form>
      </SectionCard>

      <RuntimeOptions
        label='Excel 실행 옵션'
        state={options}
        setState={setOptions}
        categoryOptions={globalCategoryOptions}
        themeOptions={themeOptions}
      />

      <SectionCard title='작업 실행' subtitle='위에서 파일과 파싱 옵션을 확인한 뒤 배치 동기화를 시작합니다.'>
        <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Button form={formId} type='submit' size='lg' disabled={channel.loading}>
              {channel.loading ? 'Excel 배치 실행 중...' : 'Excel 동기화 실행'}
            </Button>
            <p className='text-xs text-zinc-500'>
              파일은 API로 업로드된 뒤 큐에 등록되고, 워커에서 순차적으로 처리됩니다.
            </p>
          </div>
          {channel.loading ? <ProgressBar value={channel.progress} /> : null}
          {channel.loading ? <p className='mt-2 text-sm text-zinc-600'>{channel.message}</p> : null}
        </div>
      </SectionCard>

      {channel.result && !channel.result.ok ? (
        <section className='rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-[0_12px_30px_rgba(244,63,94,0.08)]'>
          <p className='font-semibold'>Excel 작업 실패</p>
          <p className='mt-1'>
            [{channel.result.error.code}] {channel.result.error.message}
          </p>
        </section>
      ) : null}

      {channel.result && channel.result.ok ? (
        <section className='rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.1)]'>
          <p className='font-semibold'>
            배치 완료 {channel.result.data.succeededRows}/{channel.result.data.totalRows}
          </p>
          <p className='mt-1'>
            실패 행 {channel.result.data.failedRows}, 업로드 {channel.result.data.uploadedCount},
            Supabase 업데이트 {channel.result.data.updatedSupabaseCount}
          </p>
          {channel.result.data.failures.length > 0 ? (
            <div className='mt-4 flex items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={async () => {
                  if (!channel.result || !channel.result.ok) return;
                  await navigator.clipboard.writeText(channel.result.data.failureReportCsv);
                  setCopyDone(true);
                }}
              >
                실패 CSV 복사
              </Button>
              {copyDone ? <p className='text-xs text-emerald-800'>클립보드에 복사했습니다.</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
