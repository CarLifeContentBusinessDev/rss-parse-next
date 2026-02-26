'use client';

import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from 'react';

import { useSyncJobChannel } from '../../_hooks/use-sync-job-channel';
import { buildOptions, RuntimeState } from '../../_lib/runtime-options';
import { SyncSuccess } from '../../_lib/sync-types';

import { ProgressBar } from '../progress-bar';
import { RuntimeOptions, inputClass } from '../runtime-options';
import { SectionCard } from '../section-card';

export function RSSSyncPanel({
  options,
  setOptions,
  sheetName,
  headerSkip,
}: {
  options: RuntimeState;
  setOptions: Dispatch<SetStateAction<RuntimeState>>;
  sheetName: string;
  headerSkip: string;
}) {
  const [rssUrl, setRssUrl] = useState('');
  const channel = useSyncJobChannel<SyncSuccess['data']>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    channel.queueJob();

    try {
      const response = await fetch('/api/sync/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rssUrl,
          options: buildOptions(options, sheetName, headerSkip),
        }),
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
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
    return `RSS 처리 ${channel.result.data.processedItems}/${channel.result.data.totalItems} · 업로드 ${channel.result.data.uploadedCount} · 업데이트 ${channel.result.data.updatedSupabaseCount}`;
  }, [channel.result]);

  return (
    <div className='flex flex-col gap-6'>
      <RuntimeOptions label='RSS 단건 옵션' state={options} setState={setOptions} />

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
            disabled={channel.loading}
            className='mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60'
          >
            {channel.loading ? '동기화 중...' : '동기화 실행'}
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
      {summary ? (
        <section className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800'>
          {summary}
        </section>
      ) : null}
    </div>
  );
}