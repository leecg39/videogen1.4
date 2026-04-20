// @TASK Control Center Phase 2 — 프로젝트 파이프라인 상태 조회
// 응답에 available_pipelines + suggested_pipeline 포함.

import { NextRequest, NextResponse } from "next/server";
import { getProjectStatus } from "@/services/project-status";
import { detectAvailablePipelines } from "@/services/project-type-detector";
import { PIPELINES, type PipelineId } from "@/lib/pipelines";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId } = await context.params;
    const url = new URL(req.url);
    const requested = url.searchParams.get("pipeline") as PipelineId | null;

    const detected = await detectAvailablePipelines(projectId);

    const pipelineId: PipelineId =
      requested && requested in PIPELINES ? requested : detected.suggested;

    const status = await getProjectStatus(projectId, pipelineId);

    return NextResponse.json({
      ...status,
      available_pipelines: detected.available,
      suggested_pipeline: detected.suggested,
      detection_signals: detected.signals,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "상태 조회 실패" },
      { status: 500 }
    );
  }
}
