// @TASK Control Center Phase 1 — 잡 상세 조회

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/services/job-runner";

type RouteContext = {
  params: Promise<{ projectId: string; jobId: string }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { projectId, jobId } = await context.params;
  const job = await getJob(projectId, jobId);
  if (!job) {
    return NextResponse.json(
      { error: "잡을 찾을 수 없습니다" },
      { status: 404 }
    );
  }
  return NextResponse.json(job);
}
