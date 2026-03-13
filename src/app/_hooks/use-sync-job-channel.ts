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
  const terminalRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      closeCurrent();
      clearPollTimer();
    };
  }, [clearPollTimer, closeCurrent]);

  const setFailure = useCallback((code: string, text: string) => {
    terminalRef.current = true;
    setResult({ ok: false, error: { code, message: text } });
    setLoading(false);
    pushHistory('failed', `[${code}] ${text}`);
  }, [pushHistory]);

  const applyTerminalJob = useCallback(
    (job: {
      status: string;
      progress?: { percent: number; message: string };
      result?: unknown;
      error?: string;
      finishedAt?: string;
    }) => {
      const at = job.finishedAt ?? new Date().toISOString();
      if (job.status === 'succeeded') {
        terminalRef.current = true;
        setResult({ ok: true, data: job.result as TData });
        setLoading(false);
        setProgress(100);
        setMessage(job.progress?.message ?? 'completed');
        pushHistory('completed', 'job completed', at);
        return true;
      }

      if (job.status === 'failed') {
        terminalRef.current = true;
        setResult({
          ok: false,
          error: { code: 'JOB_FAILED', message: job.error ?? 'Job failed' },
        });
        setLoading(false);
        pushHistory('failed', job.error ?? 'Job failed', at);
        return true;
      }

      return false;
    },
    [pushHistory],
  );

  const schedulePoll = useCallback(() => {
    clearPollTimer();
    if (!jobIdRef.current || terminalRef.current) return;

    const runPoll = async () => {
      const jobId = jobIdRef.current;
      if (!jobId || terminalRef.current) return;

      try {
        const response = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' });
        const json = (await response.json()) as {
          ok: boolean;
          data?: {
            status: string;
            progress?: { percent: number; message: string };
            result?: unknown;
            error?: string;
            finishedAt?: string;
          };
        };

        if (!response.ok || !json.ok || !json.data) {
          setFailure('STREAM_ERROR', 'job stream disconnected');
          return;
        }

        const job = json.data;
        if (job.progress) {
          setProgress(job.progress.percent);
          setMessage(job.progress.message);
          pushHistory('snapshot', `${job.status}: ${job.progress.message}`);
        }

        if (!applyTerminalJob(job)) {
          pollTimerRef.current = setTimeout(runPoll, 1000);
        }
      } catch {
        setFailure('STREAM_ERROR', 'job stream disconnected');
      }
    };

    pollTimerRef.current = setTimeout(runPoll, 1000);
  }, [applyTerminalJob, clearPollTimer, pushHistory, setFailure]);

  const queueJob = useCallback(() => {
    closeCurrent();
    clearPollTimer();
    terminalRef.current = false;
    jobIdRef.current = null;
    setLoading(true);
    setResult(null);
    setProgress(2);
    setMessage('job queued');
    setHistory([]);
    pushHistory('queued', 'job queued');
  }, [clearPollTimer, closeCurrent, pushHistory]);

  const startJob = useCallback(
    (jobId: string) => {
      closeCurrent();
      clearPollTimer();
      terminalRef.current = false;
      jobIdRef.current = jobId;
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
          terminalRef.current = true;
          clearPollTimer();
          setResult({ ok: true, data: event.result as TData });
          setLoading(false);
          setProgress(100);
          setMessage('completed');
          pushHistory('completed', 'job completed', event.at);
          close();
        }

        if (event.type === 'error') {
          terminalRef.current = true;
          clearPollTimer();
          setResult({ ok: false, error: { code: 'JOB_FAILED', message: event.error } });
          setLoading(false);
          pushHistory('error', event.error, event.at);
          close();
        }

        if (event.type === 'status' && event.status === 'succeeded') {
          terminalRef.current = true;
          clearPollTimer();
          pushHistory('status', event.status, event.at);
          close();
        }

        if (event.type === 'status' && event.status === 'failed') {
          terminalRef.current = true;
          clearPollTimer();
          setLoading(false);
          pushHistory('status', event.status, event.at);
          close();
        }

        if (
          event.type === 'status' &&
          (event.status === 'queued' || event.status === 'running')
        ) {
          pushHistory('status', event.status, event.at);
        }
      };

      source.onerror = () => {
        if (terminalRef.current) {
          close();
          return;
        }
        close();
        pushHistory('status', 'stream disconnected, polling job status');
        schedulePoll();
      };
    },
    [clearPollTimer, closeCurrent, pushHistory, schedulePoll],
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
