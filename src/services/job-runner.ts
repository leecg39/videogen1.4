// @TASK Control Center Phase 1 — 잡 런너 (파일 기반 큐 + Claude spawn + SSE pub/sub)
// 단일 프로세스 가정(로컬 전용). 서버 재시작 시 in-memory 상태는 소실되며
// running 상태로 남은 파일은 다음 부트 시 orphaned 로 보정해야 한다 (Phase 2).

import path from "path";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import fs from "fs/promises";

import {
  findStep,
  getNextStep,
  getPipeline,
  ORCHESTRATOR_STEP_ID,
  type PipelineId,
  type PipelineStep,
} from "@/lib/pipelines";
import { readJSON, writeJSON, ensureDir } from "@/services/file-service";
import {
  spawnClaude,
  getProjectCwd,
  type ClaudeHandle,
} from "@/services/claude-cli";

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type JobMode = "auto" | "manual";

export interface JobLogLine {
  ts: number;
  stream: "stdout" | "stderr" | "system";
  text: string;
}

export interface JobRecord {
  id: string;
  project_id: string;
  pipeline_id: PipelineId;
  step_id: string;
  skill: string;
  mode: JobMode;
  status: JobStatus;
  pid?: number;
  heartbeat_at?: number;
  started_at?: number;
  finished_at?: number;
  exit_code?: number | null;
  logs: JobLogLine[];
  chained_next_job_id?: string;
  created_at: number;
  updated_at: number;
}

interface RunnerState {
  handle: ClaudeHandle;
  emitter: EventEmitter;
}

const runners: Map<string, RunnerState> = new Map();
const emitters: Map<string, EventEmitter> = new Map();

function jobsDir(projectId: string): string {
  return path.join(process.cwd(), "data", projectId, "control-jobs");
}

function jobPath(projectId: string, jobId: string): string {
  return path.join(jobsDir(projectId), `${jobId}.json`);
}

async function persist(job: JobRecord): Promise<void> {
  job.updated_at = Date.now();
  await ensureDir(jobsDir(job.project_id));
  await writeJSON(jobPath(job.project_id, job.id), job);
}

function getEmitter(jobId: string): EventEmitter {
  let em = emitters.get(jobId);
  if (!em) {
    em = new EventEmitter();
    em.setMaxListeners(0);
    emitters.set(jobId, em);
  }
  return em;
}

function emit(
  jobId: string,
  type: "log" | "status" | "done",
  payload: unknown
): void {
  const em = emitters.get(jobId);
  if (em) em.emit("event", { type, payload });
}

export function subscribeJob(
  jobId: string,
  listener: (ev: { type: string; payload: unknown }) => void
): () => void {
  const em = getEmitter(jobId);
  em.on("event", listener);
  return () => em.off("event", listener);
}

export async function getJob(
  projectId: string,
  jobId: string
): Promise<JobRecord | null> {
  return readJSON<JobRecord>(jobPath(projectId, jobId));
}

export async function listJobs(projectId: string): Promise<JobRecord[]> {
  const dir = jobsDir(projectId);
  try {
    const entries = await fs.readdir(dir);
    const files = entries.filter((e) => e.endsWith(".json"));
    const records = await Promise.all(
      files.map((f) => readJSON<JobRecord>(path.join(dir, f)))
    );
    return records
      .filter((r): r is JobRecord => r !== null)
      .sort((a, b) => b.created_at - a.created_at);
  } catch {
    return [];
  }
}

export async function createJob(args: {
  projectId: string;
  pipelineId: PipelineId;
  stepId: string;
  mode: JobMode;
}): Promise<JobRecord> {
  let skill: string;

  if (args.stepId === ORCHESTRATOR_STEP_ID) {
    const pipeline = getPipeline(args.pipelineId);
    if (!pipeline.orchestratorSkill) {
      throw new Error(
        `파이프라인에 orchestrator 가 없습니다: ${args.pipelineId}`
      );
    }
    skill = pipeline.orchestratorSkill;
  } else {
    const step = findStep(args.pipelineId, args.stepId);
    if (!step) {
      throw new Error(
        `스텝을 찾을 수 없습니다: ${args.pipelineId}/${args.stepId}`
      );
    }
    skill = step.skill;
  }

  const now = Date.now();
  const job: JobRecord = {
    id: randomUUID(),
    project_id: args.projectId,
    pipeline_id: args.pipelineId,
    step_id: args.stepId,
    skill,
    mode: args.mode,
    status: "pending",
    logs: [],
    created_at: now,
    updated_at: now,
  };

  await persist(job);
  return job;
}

function appendLog(
  job: JobRecord,
  line: string,
  stream: JobLogLine["stream"]
): void {
  const entry: JobLogLine = { ts: Date.now(), stream, text: line };
  job.logs.push(entry);
  emit(job.id, "log", entry);
}

export async function startJob(job: JobRecord): Promise<void> {
  if (job.status !== "pending") {
    throw new Error(`잡 상태가 pending 이 아닙니다: ${job.status}`);
  }

  const isOrchestrator = job.step_id === ORCHESTRATOR_STEP_ID;
  const step = isOrchestrator ? null : findStep(job.pipeline_id, job.step_id);

  if (!isOrchestrator && !step) {
    job.status = "failed";
    job.finished_at = Date.now();
    await persist(job);
    throw new Error(`스텝을 찾을 수 없습니다: ${job.step_id}`);
  }

  const skillCommand = job.skill;

  job.status = "running";
  job.started_at = Date.now();
  job.heartbeat_at = Date.now();
  appendLog(
    job,
    `[system] Claude CLI 실행: ${skillCommand} ${job.project_id}`,
    "system"
  );
  await persist(job);
  emit(job.id, "status", { status: "running" });

  const command = `${skillCommand} ${job.project_id}`;
  const handle = spawnClaude({
    command,
    cwd: getProjectCwd(),
    headlessMode: isOrchestrator ? "full-restart" : "step",
    onLog: (line, stream) => {
      appendLog(job, line, stream);
      job.heartbeat_at = Date.now();
      void persist(job).catch(() => {});
    },
    onJson: () => {
      job.heartbeat_at = Date.now();
    },
    onExit: (code) => {
      job.exit_code = code;
      job.finished_at = Date.now();
      job.status = code === 0 ? "completed" : "failed";
      appendLog(
        job,
        `[system] Claude CLI 종료 (exit=${code}) status=${job.status}`,
        "system"
      );
      void persist(job).then(() => {
        emit(job.id, "status", { status: job.status });
        emit(job.id, "done", { exit_code: code, status: job.status });
        runners.delete(job.id);

        if (
          job.status === "completed" &&
          job.mode === "auto" &&
          step !== null
        ) {
          void chainNextStep(job, step).catch((err) => {
            appendLog(
              job,
              `[system] 체이닝 실패: ${(err as Error).message}`,
              "system"
            );
            void persist(job);
          });
        }
      });
    },
  });

  job.pid = handle.pid;
  await persist(job);

  runners.set(job.id, { handle, emitter: getEmitter(job.id) });
}

async function chainNextStep(
  previous: JobRecord,
  previousStep: PipelineStep
): Promise<void> {
  const next = getNextStep(previous.pipeline_id, previousStep.id);
  if (!next) return;

  const chained = await createJob({
    projectId: previous.project_id,
    pipelineId: previous.pipeline_id,
    stepId: next.id,
    mode: previous.mode,
  });
  previous.chained_next_job_id = chained.id;
  await persist(previous);
  await startJob(chained);
}

export async function cancelJob(
  projectId: string,
  jobId: string
): Promise<JobRecord | null> {
  const job = await getJob(projectId, jobId);
  if (!job) return null;
  const runner = runners.get(jobId);
  if (runner) {
    runner.handle.cancel("SIGTERM");
  }
  if (job.status === "running" || job.status === "pending") {
    job.status = "cancelled";
    job.finished_at = Date.now();
    appendLog(job, "[system] 사용자에 의해 취소됨", "system");
    await persist(job);
    emit(jobId, "status", { status: "cancelled" });
    emit(jobId, "done", { exit_code: null, status: "cancelled" });
  }
  return job;
}

export function isRunnerActive(jobId: string): boolean {
  return runners.has(jobId);
}
