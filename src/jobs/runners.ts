import fs from "node:fs/promises";
import { syncPodcastFromRss } from "@/services/syncPodcastFromRss";
import { syncPodcastFromExcelBuffer } from "@/services/syncPodcastFromExcel";
import { jobManager } from "@/jobs/jobManager";
import { ExcelJobPayload, JobKind, RssJobPayload } from "@/jobs/types";

export function ensureWorkerStarted() {
  void jobManager.start((kind) => {
    if (kind === "rss") {
      return async ({ payload, updateProgress }) =>
        runRssJob({ payload: payload as RssJobPayload, updateProgress });
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
  updateProgress(5, "rss fetch started");
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
  updateProgress(5, "excel parse started");
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

export function createJob(kind: JobKind, payload: RssJobPayload | ExcelJobPayload) {
  const id = jobManager.createJob(kind, payload);
  ensureWorkerStarted();
  return id;
}
