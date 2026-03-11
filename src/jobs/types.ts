import { PartialSyncRuntimeOptions } from '@/config/syncRuntime';

export type JobKind = 'rss' | 'excel' | 'audio-refresh' | 'audio-refresh-excel';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type JobProgress = {
  percent: number;
  message: string;
};

export type RssJobPayload = {
  rssUrl: string;
  options?: PartialSyncRuntimeOptions;
};

export type ExcelJobPayload = {
  filePath: string;
  sheetName?: string;
  headerSkip?: number;
  country?: string;
  options?: PartialSyncRuntimeOptions;
};

export type AudioRefreshJobPayload = {
  country: string;
  tablePreset?: 'main' | 'test';
  options?: PartialSyncRuntimeOptions;
};

export type AudioRefreshExcelJobPayload = {
  filePath: string;
  sheetName?: string;
  headerSkip?: number;
  country?: string;
  tablePreset?: 'main' | 'test';
  options?: PartialSyncRuntimeOptions;
};

export type JobPayload =
  | RssJobPayload
  | ExcelJobPayload
  | AudioRefreshJobPayload
  | AudioRefreshExcelJobPayload;

export type JobRecord = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress: JobProgress;
  error?: string;
  result?: unknown;
  payload: JobPayload;
};

export type JobEvent =
  | { type: 'status'; status: JobStatus; at: string }
  | { type: 'progress'; progress: JobProgress; at: string }
  | { type: 'result'; result: unknown; at: string }
  | { type: 'error'; error: string; at: string };
