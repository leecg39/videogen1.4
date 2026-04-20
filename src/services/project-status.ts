// @TASK Control Center Phase 1 — 프로젝트 파일 존재 상태 조회
// 각 파이프라인 스텝의 requires/produces 가 실제로 파일 시스템에 있는지 확인.

import path from "path";
import fs from "fs/promises";
import { listJobs, type JobRecord } from "@/services/job-runner";
import {
  getPipeline,
  type PipelineId,
  type PipelineStep,
} from "@/lib/pipelines";

export interface StepStatus {
  step_id: string;
  label: string;
  skill: string;
  requires: Array<{ pattern: string; exists: boolean }>;
  produces: Array<{ pattern: string; exists: boolean; mtime?: number }>;
  ready: boolean;
  satisfied: boolean;
  latest_job?: JobRecord;
}

export interface ProjectStatus {
  project_id: string;
  pipeline_id: PipelineId;
  steps: StepStatus[];
  active_job?: JobRecord;
}

async function checkPattern(
  projectId: string,
  pattern: string
): Promise<{ exists: boolean; mtime?: number }> {
  const projectDir = path.join(process.cwd(), "data", projectId);

  if (pattern.startsWith("output/")) {
    const filename = pattern.replace(
      "{projectId}",
      projectId
    );
    const abs = path.join(process.cwd(), filename);
    try {
      const stat = await fs.stat(abs);
      return { exists: true, mtime: stat.mtimeMs };
    } catch {
      return { exists: false };
    }
  }

  if (pattern.includes("*")) {
    const [dirPart, namePart] = pattern.includes("/")
      ? [
          pattern.substring(0, pattern.lastIndexOf("/")),
          pattern.substring(pattern.lastIndexOf("/") + 1),
        ]
      : ["", pattern];
    const searchDir = dirPart ? path.join(projectDir, dirPart) : projectDir;
    const ext = namePart.replace(/^\*/, "");
    try {
      const entries = await fs.readdir(searchDir);
      const match = entries.find((e) => e.endsWith(ext));
      if (!match) return { exists: false };
      const stat = await fs.stat(path.join(searchDir, match));
      return { exists: true, mtime: stat.mtimeMs };
    } catch {
      return { exists: false };
    }
  }

  const abs = path.join(projectDir, pattern);
  try {
    const stat = await fs.stat(abs);
    return { exists: true, mtime: stat.mtimeMs };
  } catch {
    return { exists: false };
  }
}

async function evaluateStep(
  projectId: string,
  step: PipelineStep,
  jobs: JobRecord[]
): Promise<StepStatus> {
  const requires = await Promise.all(
    step.requires.map(async (pattern) => ({
      pattern,
      ...(await checkPattern(projectId, pattern)),
    }))
  );
  const produces = await Promise.all(
    step.produces.map(async (pattern) => ({
      pattern,
      ...(await checkPattern(projectId, pattern)),
    }))
  );

  const ready = requires.every((r) => r.exists);
  const satisfied = produces.every((p) => p.exists);
  const latest_job = jobs.find((j) => j.step_id === step.id);

  return {
    step_id: step.id,
    label: step.label,
    skill: step.skill,
    requires,
    produces,
    ready,
    satisfied,
    latest_job,
  };
}

export async function getProjectStatus(
  projectId: string,
  pipelineId: PipelineId = "topic"
): Promise<ProjectStatus> {
  const pipeline = getPipeline(pipelineId);
  const jobs = await listJobs(projectId);
  const steps = await Promise.all(
    pipeline.steps.map((step) => evaluateStep(projectId, step, jobs))
  );
  const active_job = jobs.find(
    (j) => j.status === "running" || j.status === "pending"
  );
  return {
    project_id: projectId,
    pipeline_id: pipelineId,
    steps,
    active_job,
  };
}
