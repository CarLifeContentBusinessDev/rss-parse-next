import { NextResponse } from "next/server";
import { jobManager } from "@/jobs/jobManager";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = jobManager.getJob(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: { message: "job not found" } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: job });
}
