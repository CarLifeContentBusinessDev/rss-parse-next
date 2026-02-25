import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PartialSyncRuntimeOptions } from "@/config/syncRuntime";
import { createJob } from "@/jobs/runners";

export const runtime = "nodejs";

type ErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

function toErrorResponse(status: number, code: string, message: string, details?: string) {
  const body: ErrorBody = {
    ok: false,
    error: { code, message, details },
  };

  return NextResponse.json(body, { status });
}

function parseOptionsJson(raw: FormDataEntryValue | null): PartialSyncRuntimeOptions | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  return JSON.parse(raw) as PartialSyncRuntimeOptions;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get("excelFile");

    if (!(excelFile instanceof File)) {
      return toErrorResponse(400, "INVALID_REQUEST", "excelFile is required");
    }

    const sheetName = String(formData.get("sheetName") ?? "").trim() || undefined;
    const headerSkipRaw = String(formData.get("headerSkip") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || undefined;

    const headerSkip = headerSkipRaw ? Number(headerSkipRaw) : undefined;
    if (headerSkip !== undefined && (!Number.isInteger(headerSkip) || headerSkip < 0)) {
      return toErrorResponse(400, "INVALID_REQUEST", "headerSkip must be a non-negative integer");
    }

    const options = parseOptionsJson(formData.get("optionsJson"));
    const tmpDir = path.join(process.cwd(), ".job_tmp");
    await fs.mkdir(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, `${Date.now()}-${randomUUID()}.xlsx`);
    const buffer = Buffer.from(await excelFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const jobId = createJob("excel", {
      filePath,
      sheetName,
      headerSkip,
      country: countryCode,
      options,
    });

    return NextResponse.json({ ok: true, data: { jobId } }, { status: 202 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/sync/excel] failed", error);
    return toErrorResponse(500, "SYNC_FAILED", "Excel sync failed", details);
  }
}
