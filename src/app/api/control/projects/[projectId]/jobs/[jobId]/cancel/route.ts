// @TASK Control Center Phase 1 — 실행 중 잡 취소

import { NextRequest, NextResponse } from "next/server";
import { cancelJob } from "@/services/job-runner";

type RouteContext = {
  params: Promise<{ projectId: string; jobId: string }>;
};

export async function POST(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { projectId, jobId } = await context.params;
  const job = await cancelJob(projectId, jobId);
  if (!job) {
    return NextResponse.json(
      { error: "잡을 찾을 수 없습니다" },
      { status: 404 }
    );
  }
  return NextResponse.json({ job_id: job.id, status: job.status });
}
