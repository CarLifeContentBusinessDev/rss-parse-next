'use client';

import { Dispatch, FormEvent, SetStateAction, useState } from 'react';

import { JobHistory } from '@/app/_components/job-history';
import { ProgressBar } from '@/app/_components/progress-bar';
import { SectionCard } from '@/app/_components/section-card';
import { inputClass } from '@/app/_components/runtime-options';
import { useSyncJobChannel } from '@/app/_hooks/use-sync-job-channel';
import { RuntimeState } from '@/app/_lib/runtime-options';
import { AudioRefreshExcelSuccess } from '@/app/_lib/sync-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const tablePresetOptions = [
  { value: 'test', label: 'test tables' },
  { value: 'main', label: 'main tables' },
];

const bitrateOptions = [
  { value: '48k', label: '48k' },
  { value: '64k', label: '64k' },
  { value: '96k', label: '96k' },
  { value: '128k', label: '128k' },
  { value: '192k', label: '192k' },
];

export function AudioRefreshPanel({
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
  const formId = 'audio-refresh-form';
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const channel = useSyncJobChannel<AudioRefreshExcelSuccess['data']>();

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
      formData.append('tablePreset', options.tablePreset === 'main' ? 'main' : 'test');
      formData.append(
        'optionsJson',
        JSON.stringify({
          countryCode: options.countryCode.trim(),
          audioBitrate: options.audioBitrate,
          keepLocalFiles: options.keepLocalFiles,
          minRank: options.minRank.trim() ? Number(options.minRank) : null,
          maxRank: options.maxRank.trim() ? Number(options.maxRank) : null,
        }),
      );

      const response = await fetch('/api/sync/audio-refresh/excel', {
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
        const message =
          json.error?.details ?? json.error?.message ?? 'Failed to create audio refresh excel job';
        channel.setFailure(code, message);
        return;
      }

      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create audio refresh excel job');
      channel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      channel.setFailure('NETWORK_ERROR', message);
    }
  };

  return (
    <div className='space-y-6'>
      <SectionCard
        title='오디오 소스 재생성'
        subtitle='Excel의 rssUrl을 다시 읽어 원본 enclosure URL을 찾고, 그 소스로 m4a를 새로 생성해 episodes.audio_file을 교체합니다.'
      >
        <form id={formId} onSubmit={onSubmit} className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='audio-refresh-excel-file'>Excel 파일</Label>
            <Input
              id='audio-refresh-excel-file'
              type='file'
              accept='.xlsx'
              required
              onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)}
              className='h-auto cursor-pointer py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800'
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='audio-refresh-country'>Country Code</Label>
              <Input
                id='audio-refresh-country'
                value={options.countryCode}
                maxLength={8}
                onChange={(event) =>
                  setOptions((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))
                }
                placeholder='IT'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='audio-refresh-sheet-name'>Sheet Name</Label>
              <Input
                id='audio-refresh-sheet-name'
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder='IT_이탈리아'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='audio-refresh-header-skip'>Header Skip</Label>
              <Input
                id='audio-refresh-header-skip'
                type='number'
                min={0}
                value={headerSkip}
                onChange={(event) => setHeaderSkip(event.target.value)}
                placeholder='2'
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Table Preset</Label>
              <Select
                value={options.tablePreset === 'main' ? 'main' : 'test'}
                onValueChange={(value) =>
                  setOptions((prev) => ({
                    ...prev,
                    tablePreset: value as RuntimeState['tablePreset'],
                  }))
                }
                options={tablePresetOptions}
              />
            </div>
            <div className='space-y-2'>
              <Label>Audio Bitrate</Label>
              <Select
                value={options.audioBitrate}
                onValueChange={(value) => setOptions((prev) => ({ ...prev, audioBitrate: value }))}
                options={bitrateOptions}
              />
            </div>
            <div className='space-y-2'>
              <Label>Program / Episode Matching</Label>
              <div className={`${inputClass} flex items-center bg-zinc-50 text-zinc-600`}>
                programTitle + episode title/date
              </div>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='audio-refresh-min-rank'>Min Rank</Label>
              <Input
                id='audio-refresh-min-rank'
                type='number'
                min={0}
                value={options.minRank}
                onChange={(event) =>
                  setOptions((prev) => ({ ...prev, minRank: event.target.value }))
                }
                placeholder='60'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='audio-refresh-max-rank'>Max Rank</Label>
              <Input
                id='audio-refresh-max-rank'
                type='number'
                min={0}
                value={options.maxRank}
                onChange={(event) =>
                  setOptions((prev) => ({ ...prev, maxRank: event.target.value }))
                }
                placeholder='60'
              />
            </div>
          </div>

          <div className='rounded-2xl border border-amber-200 bg-amber-50/90 p-4'>
            <p className='text-sm font-semibold text-amber-950'>주의</p>
            <p className='mt-1 text-xs leading-relaxed text-amber-900'>
              이 경로는 현재 DB의 `audio_file`을 다시 쓰지 않고, Excel row의 `rssUrl`을 소스로 RSS를
              재조회해 원본 enclosure URL을 찾아 새 `m4a`를 만듭니다.
            </p>
            <p className='mt-2 text-xs leading-relaxed text-amber-900'>
              `rank`, `Rank`, `전체 순위`, `순위` 컬럼이 있으면 Min/Max Rank 범위만 처리합니다.
            </p>
          </div>

          <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-sm font-medium text-zinc-900'>Keep Local Files</p>
                <p className='mt-1 text-xs leading-relaxed text-zinc-500'>
                  디버깅이 필요할 때만 켜세요. 기본값은 작업 후 임시 변환 파일을 정리합니다.
                </p>
              </div>
              <Switch
                checked={options.keepLocalFiles}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, keepLocalFiles: checked }))
                }
                aria-label='keep local files'
              />
            </div>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title='작업 실행'
        subtitle='Excel의 RSS 소스를 기준으로 오디오를 다시 생성하고 업로드합니다.'
      >
        <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Button form={formId} type='submit' size='lg' disabled={channel.loading}>
              {channel.loading ? 'Source refresh running...' : 'Refresh Audio From Excel Sources'}
            </Button>
            <p className='text-xs text-zinc-500'>
              각 row의 rssUrl을 다시 읽고, 기존 프로그램의 에피소드와 매칭된 원본 소스로 m4a를
              재생성합니다.
            </p>
          </div>
          {channel.loading ? <ProgressBar value={channel.progress} /> : null}
          {channel.loading ? <p className='mt-2 text-sm text-zinc-600'>{channel.message}</p> : null}
        </div>
      </SectionCard>

      {channel.result && !channel.result.ok ? (
        <section className='rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-[0_12px_30px_rgba(244,63,94,0.08)]'>
          <p className='font-semibold'>Audio source refresh failed</p>
          <p className='mt-1'>
            [{channel.result.error.code}] {channel.result.error.message}
          </p>
        </section>
      ) : null}

      {channel.result && channel.result.ok ? (
        <section className='rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.1)]'>
          <p className='font-semibold'>
            Refreshed {channel.result.data.succeededRows}/{channel.result.data.totalRows} rows
          </p>
          <p className='mt-1'>
            Failed {channel.result.data.failedRows}, uploaded {channel.result.data.uploadedCount},
            Supabase updated {channel.result.data.updatedSupabaseCount}
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
                Copy Failure CSV
              </Button>
              {copyDone ? <p className='text-xs text-emerald-800'>Copied to clipboard.</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <JobHistory entries={channel.history} />
    </div>
  );
}
