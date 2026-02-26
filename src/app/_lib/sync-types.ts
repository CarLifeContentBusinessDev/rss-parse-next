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

export type SyncFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

export type JobEvent =
  | { type: 'snapshot'; job: { status: string; progress?: { percent: number; message: string } } }
  | { type: 'progress'; progress: { percent: number; message: string } }
  | { type: 'result'; result: unknown }
  | { type: 'error'; error: string }
  | { type: 'status'; status: string };
