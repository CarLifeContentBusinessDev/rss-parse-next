export type SyncSuccess = {
  ok: true;
  data: {
    rssUrl: string;
    feedTitle: string | null;
    totalItems: number;
    processedItems: number;
    skippedItems: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
  };
};

export type ExcelSyncSuccess = {
  ok: true;
  data: {
    totalRows: number;
    succeededRows: number;
    failedRows: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
    failures: Array<{ row: number; rssUrl: string | null; message: string }>;
    failureReportCsv: string;
  };
};

export type AudioRefreshSuccess = {
  ok: true;
  data: {
    country: string;
    tablePreset: 'main' | 'test';
    matchedPrograms: number;
    processedPrograms: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
    failures: Array<{ programId: number; title: string; message: string }>;
  };
};

export type AudioRefreshExcelSuccess = {
  ok: true;
  data: {
    totalRows: number;
    succeededRows: number;
    failedRows: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
    failures: Array<{ row: number; rssUrl: string | null; message: string }>;
    failureReportCsv: string;
  };
};

export type SyncFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

export type JobEvent =
  | {
      type: 'snapshot';
      at?: string;
      job: { status: string; progress?: { percent: number; message: string } };
    }
  | { type: 'progress'; at?: string; progress: { percent: number; message: string } }
  | { type: 'result'; at?: string; result: unknown }
  | { type: 'error'; at?: string; error: string }
  | { type: 'status'; at?: string; status: string };

export type JobHistoryEntry = {
  id: string;
  at: string;
  label: string;
  detail?: string;
};
