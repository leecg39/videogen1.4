// @TASK Control Center Phase 2 — 스텝/오케스트레이터 실행 (Claude CLI spawn)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createJob, startJob } from "@/services/job-runner";
import {
  findStep,
  getPipeline,
  ORCHESTRATOR_STEP_ID,
  PIPELINE_IDS,
  type PipelineId,
} from "@/lib/pipelines";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

const RunRequestSchema = z.object({
  pipeline_id: z.enum(PIPELINE_IDS as [PipelineId, ...PipelineId[]]),
  step_id: z.string().min(1),
  mode: z.enum(["auto", "manual"]).default("manual"),
});

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId } = await context.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "JSON 파싱 실패" },
        { status: 400 }
      );
    }

    const parsed = RunRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력 검증 실패", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { pipeline_id, step_id, mode } = parsed.data;

    if (step_id === ORCHESTRATOR_STEP_ID) {
      const pipeline = getPipeline(pipeline_id);
      if (!pipeline.orchestratorSkill) {
        return NextResponse.json(
          { error: `파이프라인에 orchestrator 가 없습니다: ${pipeline_id}` },
          { status: 400 }
        );
      }
    } else {
      const step = findStep(pipeline_id, step_id);
      if (!step) {
        return NextResponse.json(
          { error: `스텝을 찾을 수 없습니다: ${pipeline_id}/${step_id}` },
          { status: 404 }
        );
      }
    }

    const job = await createJob({
      projectId,
      pipelineId: pipeline_id,
      stepId: step_id,
      mode,
    });

    startJob(job).catch((err) => {
      console.error("[control] startJob failed:", err);
    });

    return NextResponse.json(
      {
        job_id: job.id,
        project_id: projectId,
        pipeline_id,
        step_id,
        mode,
        status: "running",
      },
      { status: 202 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "실행 실패" },
      { status: 500 }
    );
  }
}
