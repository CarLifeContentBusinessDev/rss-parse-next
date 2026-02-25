import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { JobEvent, JobKind, JobPayload, JobRecord, JobStatus } from "@/jobs/types";

type JobRunner = (args: {
  payload: JobPayload;
  updateProgress: (percent: number, message: string) => void;
}) => Promise<unknown>;

class JobManager {
  private jobs = new Map<string, JobRecord>();
  private emitter = new EventEmitter();
  private queue: string[] = [];
  private running = false;

  createJob(kind: JobKind, payload: JobPayload) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const job: JobRecord = {
      id,
      kind,
      payload,
      status: "queued",
      createdAt: now,
      progress: { percent: 0, message: "queued" },
    };
    this.jobs.set(id, job);
    this.queue.push(id);
    this.emit(id, { type: "status", status: "queued", at: now });
    return id;
  }

  getJob(id: string) {
    return this.jobs.get(id);
  }

  subscribe(id: string, listener: (event: JobEvent) => void) {
    this.emitter.on(id, listener);
    return () => this.emitter.off(id, listener);
  }

  async start(worker: (kind: JobKind) => JobRunner) {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const id = this.queue.shift();
      if (!id) continue;

      const job = this.jobs.get(id);
      if (!job) continue;

      this.setStatus(id, "running");
      try {
        const run = worker(job.kind);
        const result = await run({
          payload: job.payload,
          updateProgress: (percent, message) =>
            this.setProgress(id, percent, message),
        });
        const now = new Date().toISOString();
        const next = this.jobs.get(id);
        if (next) {
          next.result = result;
          next.finishedAt = now;
          next.progress = { percent: 100, message: "completed" };
          next.status = "succeeded";
          this.emit(id, { type: "result", result, at: now });
          this.emit(id, { type: "status", status: "succeeded", at: now });
        }
      } catch (error) {
        const now = new Date().toISOString();
        const message = error instanceof Error ? error.message : "Unknown error";
        const next = this.jobs.get(id);
        if (next) {
          next.error = message;
          next.finishedAt = now;
          next.status = "failed";
          this.emit(id, { type: "error", error: message, at: now });
          this.emit(id, { type: "status", status: "failed", at: now });
        }
      }
    }

    this.running = false;
  }

  private setStatus(id: string, status: JobStatus) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = status;
    const now = new Date().toISOString();
    if (status === "running") job.startedAt = now;
    this.emit(id, { type: "status", status, at: now });
  }

  private setProgress(id: string, percent: number, message: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    const normalized = Math.max(0, Math.min(100, percent));
    const progress = { percent: normalized, message };
    job.progress = progress;
    this.emit(id, { type: "progress", progress, at: new Date().toISOString() });
  }

  private emit(id: string, event: JobEvent) {
    this.emitter.emit(id, event);
  }
}

const globalForJobs = globalThis as unknown as { __jobManager?: JobManager };
export const jobManager = globalForJobs.__jobManager ?? new JobManager();
if (!globalForJobs.__jobManager) {
  globalForJobs.__jobManager = jobManager;
}
