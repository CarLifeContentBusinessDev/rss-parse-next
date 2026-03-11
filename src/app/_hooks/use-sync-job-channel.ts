import { useCallback, useEffect, useRef, useState } from 'react';

import { JobEvent, JobHistoryEntry, SyncFailure } from '../_lib/sync-types';

type SuccessState<TData> = { ok: true; data: TData };
type ChannelResult<TData> = SuccessState<TData> | SyncFailure;

export function useSyncJobChannel<TData>() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<ChannelResult<TData> | null>(null);
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  const pushHistory = useCallback((label: string, detail?: string, at?: string) => {
    const stamp = at ?? new Date().toISOString();
    setHistory((prev) => [
      {
        id: `${stamp}-${prev.length + 1}`,
        at: stamp,
        label,
        detail,
      },
      ...prev,
    ]);
  }, []);

  const closeCurrent = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      closeCurrent();
    };
  }, [closeCurrent]);

  const setFailure = useCallback((code: string, text: string) => {
    setResult({ ok: false, error: { code, message: text } });
    setLoading(false);
    pushHistory('failed', `[${code}] ${text}`);
  }, [pushHistory]);

  const queueJob = useCallback(() => {
    closeCurrent();
    setLoading(true);
    setResult(null);
    setProgress(2);
    setMessage('job queued');
    setHistory([]);
    pushHistory('queued', 'job queued');
  }, [closeCurrent, pushHistory]);

  const startJob = useCallback(
    (jobId: string) => {
      closeCurrent();
      const source = new EventSource(`/api/jobs/${jobId}/events`);
      sourceRef.current = source;

      const close = () => {
        source.close();
        if (sourceRef.current === source) sourceRef.current = null;
      };

      source.onmessage = (evt) => {
        if (!evt.data) return;
        const event = JSON.parse(evt.data) as JobEvent;

        if (event.type === 'snapshot' && event.job.progress) {
          setProgress(event.job.progress.percent);
          setMessage(event.job.progress.message);
          pushHistory('snapshot', `${event.job.status}: ${event.job.progress.message}`, event.at);
        }

        if (event.type === 'progress') {
          setProgress(event.progress.percent);
          setMessage(event.progress.message);
          pushHistory(
            `progress ${event.progress.percent}%`,
            event.progress.message,
            event.at,
          );
        }

        if (event.type === 'result') {
          setResult({ ok: true, data: event.result as TData });
          setLoading(false);
          setProgress(100);
          setMessage('completed');
          pushHistory('completed', 'job completed', event.at);
          close();
        }

        if (event.type === 'error') {
          setResult({ ok: false, error: { code: 'JOB_FAILED', message: event.error } });
          setLoading(false);
          pushHistory('error', event.error, event.at);
          close();
        }

        if (event.type === 'status' && event.status === 'failed') {
          setLoading(false);
          pushHistory('status', event.status, event.at);
          close();
        }

        if (event.type === 'status' && event.status !== 'failed') {
          pushHistory('status', event.status, event.at);
          close();
        }
      };

      source.onerror = () => {
        setFailure('STREAM_ERROR', 'job stream disconnected');
        close();
      };
    },
    [closeCurrent, pushHistory, setFailure],
  );

  return {
    loading,
    progress,
    message,
    result,
    history,
    queueJob,
    startJob,
    setFailure,
    closeCurrent,
  };
}
