'use client';

import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

import { ProgressBar } from '../../../_components/progress-bar';
import { JobHistory } from '../../../_components/job-history';
import { RuntimeOptions } from '../../../_components/runtime-options';
import { SectionCard } from '../../../_components/section-card';
import { CategoryOption } from '../../../_hooks/use-category-options';
import { ThemeOption } from '../../../_hooks/use-theme-options';
import { useSyncJobChannel } from '../../../_hooks/use-sync-job-channel';
import { buildOptions, RuntimeState } from '../../../_lib/runtime-options';
import { SyncSuccess } from '../../../_lib/sync-types';

export function RSSSyncPanel({
  options,
  setOptions,
  categoryId,
  setCategoryId,
  globalCategoryOptions,
  rssCategoryOptions,
  themeOptions,
  sheetName,
  headerSkip,
}: {
  options: RuntimeState;
  setOptions: Dispatch<SetStateAction<RuntimeState>>;
  categoryId: string;
  setCategoryId: Dispatch<SetStateAction<string>>;
  globalCategoryOptions: CategoryOption[];
  rssCategoryOptions: CategoryOption[];
  themeOptions: ThemeOption[];
  sheetName: string;
  headerSkip: string;
}) {
  const formId = 'rss-sync-form';
  const [rssUrl, setRssUrl] = useState('');
  const channel = useSyncJobChannel<SyncSuccess['data']>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    channel.queueJob();

    try {
      const trimmedRssUrl = rssUrl.trim();
      const parsedCategoryId = categoryId.trim() ? Number(categoryId) : undefined;
      const response = await fetch('/api/sync/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rssUrl: trimmedRssUrl,
          options: {
            ...buildOptions(options, sheetName, headerSkip),
            categoryId: parsedCategoryId,
          },
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        data?: { jobId?: string };
        error?: { code?: string; message?: string; details?: string };
      };

      if (!response.ok || !json.ok) {
        const code = json.error?.code ?? 'REQUEST_FAILED';
        const message = json.error?.details ?? json.error?.message ?? 'Failed to create RSS job';
        channel.setFailure(code, message);
        return;
      }

      const jobId = json.data?.jobId;
      if (!jobId) throw new Error('Failed to create RSS job');
      channel.startJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected request failure';
      channel.setFailure('NETWORK_ERROR', message);
    }
  };

  const summary = useMemo(() => {
    if (!channel.result || !channel.result.ok) return null;
    return {
      processed: channel.result.data.processedItems,
      total: channel.result.data.totalItems,
      uploaded: channel.result.data.uploadedCount,
      updated: channel.result.data.updatedSupabaseCount,
    };
  }, [channel.result]);

  return (
    <div className='space-y-6'>
      <SectionCard
        title='RSS 단건 실행'
        subtitle='RSS 피드 URL 하나를 입력하고, 같은 화면에서 작업 실행과 결과 확인까지 진행합니다.'
      >
        <form id={formId} onSubmit={onSubmit} className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='rss-url'>RSS URL</Label>
            <Input
              id='rss-url'
              type='url'
              required
              placeholder='https://example.com/feed.xml'
              value={rssUrl}
              onChange={(event) => setRssUrl(event.target.value)}
            />
            <p className='text-xs leading-relaxed text-zinc-500'>
              직접 접근 가능한 `http` 또는 `https` 피드 URL을 입력하세요. 실행에는 아래 옵션이
              적용됩니다.
            </p>
          </div>
        </form>
      </SectionCard>

      <RuntimeOptions
        label='RSS 실행 옵션'
        state={options}
        setState={setOptions}
        categoryOptions={globalCategoryOptions}
        themeOptions={themeOptions}
        hiddenFields={['minRank', 'maxRank']}
      >
        {options.syncCategory ? (
          <div className='space-y-2'>
            <Label htmlFor='rss-category-id'>카테고리</Label>
            <Select value={categoryId} onValueChange={setCategoryId} options={rssCategoryOptions} />
            <p className='text-xs leading-relaxed text-zinc-500'>
              RSS 단건 실행에서만 사용됩니다. 카테고리 동기화를 켜면 현재 선택된
              `programs_categories` 테이블에 이 값이 들어갑니다.
            </p>
          </div>
        ) : null}
      </RuntimeOptions>

      <SectionCard title='작업 실행' subtitle='위에서 RSS URL과 옵션을 확인한 뒤 동기화 작업을 시작합니다.'>
        <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Button form={formId} type='submit' size='lg' disabled={channel.loading}>
              {channel.loading ? 'RSS 작업 실행 중...' : 'RSS 동기화 실행'}
            </Button>
            <p className='text-xs text-zinc-500'>
              작업은 비동기로 실행되며, 진행 상태와 실패 정보가 이 패널에 표시됩니다.
            </p>
          </div>
          {channel.loading ? <ProgressBar value={channel.progress} /> : null}
          {channel.loading ? <p className='mt-2 text-sm text-zinc-600'>{channel.message}</p> : null}
        </div>
      </SectionCard>

      {channel.result && !channel.result.ok ? (
        <section className='rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-[0_12px_30px_rgba(244,63,94,0.08)]'>
          <p className='font-semibold'>RSS 작업 실패</p>
          <p className='mt-1'>
            [{channel.result.error.code}] {channel.result.error.message}
          </p>
        </section>
      ) : null}

      {summary ? (
        <section className='rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.1)]'>
          <p className='font-semibold'>작업 완료</p>
          <p className='mt-1'>
            처리 에피소드 {summary.processed}/{summary.total}, 업로드 {summary.uploaded},
            Supabase 업데이트 {summary.updated}
          </p>
        </section>
      ) : null}

      <JobHistory entries={channel.history} />
    </div>
  );
}
