import fs from 'node:fs/promises';
import { syncPodcastFromRss } from '@/services/syncPodcastFromRss';
import { syncPodcastFromExcelBuffer } from '@/services/syncPodcastFromExcel';
import { refreshCountryAudioUrls } from '@/services/refreshCountryAudioUrls';
import { refreshAudioFromExcelSourceBuffer } from '@/services/refreshAudioFromExcelSource';
import { jobManager } from '@/jobs/jobManager';
import {
  AudioRefreshExcelJobPayload,
  AudioRefreshJobPayload,
  ExcelJobPayload,
  JobKind,
  RssJobPayload,
} from '@/jobs/types';

export function ensureWorkerStarted() {
  void jobManager.start((kind) => {
    if (kind === 'rss') {
      return async ({ payload, updateProgress }) =>
        runRssJob({ payload: payload as RssJobPayload, updateProgress });
    }
    if (kind === 'audio-refresh') {
      return async ({ payload, updateProgress }) =>
        runAudioRefreshJob({ payload: payload as AudioRefreshJobPayload, updateProgress });
    }
    if (kind === 'audio-refresh-excel') {
      return async ({ payload, updateProgress }) =>
        runAudioRefreshExcelJob({
          payload: payload as AudioRefreshExcelJobPayload,
          updateProgress,
        });
    }
    return async ({ payload, updateProgress }) =>
      runExcelJob({ payload: payload as ExcelJobPayload, updateProgress });
  });
}

async function runRssJob({
  payload,
  updateProgress,
}: {
  payload: RssJobPayload;
  updateProgress: (percent: number, message: string) => void;
}) {
  updateProgress(5, 'rss fetch started');
  return syncPodcastFromRss({
    rssUrl: payload.rssUrl,
    options: payload.options,
    onProgress: updateProgress,
  });
}

async function runExcelJob({
  payload,
  updateProgress,
}: {
  payload: ExcelJobPayload;
  updateProgress: (percent: number, message: string) => void;
}) {
  updateProgress(5, 'excel parse started');
  try {
    const buffer = await fs.readFile(payload.filePath);
    return await syncPodcastFromExcelBuffer({
      buffer,
      sheetName: payload.sheetName,
      headerSkip: payload.headerSkip,
      country: payload.country,
      options: payload.options,
      onProgress: updateProgress,
    });
  } finally {
    await fs.unlink(payload.filePath).catch(() => undefined);
  }
}

async function runAudioRefreshJob({
  payload,
  updateProgress,
}: {
  payload: AudioRefreshJobPayload;
  updateProgress: (percent: number, message: string) => void;
}) {
  updateProgress(5, 'audio refresh started');
  return refreshCountryAudioUrls({
    country: payload.country,
    tablePreset: payload.tablePreset,
    options: payload.options,
    onProgress: updateProgress,
  });
}

async function runAudioRefreshExcelJob({
  payload,
  updateProgress,
}: {
  payload: AudioRefreshExcelJobPayload;
  updateProgress: (percent: number, message: string) => void;
}) {
  updateProgress(5, 'audio refresh excel started');
  try {
    const buffer = await fs.readFile(payload.filePath);
    return await refreshAudioFromExcelSourceBuffer({
      buffer,
      sheetName: payload.sheetName,
      headerSkip: payload.headerSkip,
      country: payload.country,
      tablePreset: payload.tablePreset,
      options: payload.options,
      onProgress: updateProgress,
    });
  } finally {
    await fs.unlink(payload.filePath).catch(() => undefined);
  }
}

export function createJob(
  kind: JobKind,
  payload:
    | RssJobPayload
    | ExcelJobPayload
    | AudioRefreshJobPayload
    | AudioRefreshExcelJobPayload,
) {
  const id = jobManager.createJob(kind, payload);
  ensureWorkerStarted();
  return id;
}
