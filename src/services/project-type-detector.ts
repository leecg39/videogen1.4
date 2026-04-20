// @TASK Control Center Phase 2 — 프로젝트 타입 자동 추론
// data/{projectId}/ 내 파일 존재 여부로 사용 가능한 파이프라인과 기본 제안 파이프라인을 판정.

import path from "path";
import fs from "fs/promises";
import type { PipelineId } from "@/lib/pipelines";

export interface DetectedPipelines {
  available: PipelineId[];
  suggested: PipelineId;
  signals: {
    has_demo_spec: boolean;
    has_video_spec: boolean;
    has_srt: boolean;
    has_mp3: boolean;
    has_beats: boolean;
    has_script: boolean;
    has_project: boolean;
    has_topic: boolean;
  };
}

async function fileExists(abs: string): Promise<boolean> {
  try {
    await fs.stat(abs);
    return true;
  } catch {
    return false;
  }
}

async function anyWithExt(dir: string, ext: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dir);
    return entries.some((e) => e.endsWith(ext));
  } catch {
    return false;
  }
}

export async function detectAvailablePipelines(
  projectId: string
): Promise<DetectedPipelines> {
  const projectDir = path.join(process.cwd(), "data", projectId);

  const [
    has_demo_spec,
    has_video_spec,
    has_srt,
    has_mp3,
    has_beats,
    has_script,
    has_project,
  ] = await Promise.all([
    fileExists(path.join(projectDir, "demo-spec.json")),
    fileExists(path.join(projectDir, "video-spec.json")),
    anyWithExt(projectDir, ".srt"),
    anyWithExt(projectDir, ".mp3"),
    fileExists(path.join(projectDir, "beats.json")),
    fileExists(path.join(projectDir, "script.json")),
    fileExists(path.join(projectDir, "project.json")),
  ]);

  let has_topic = false;
  if (has_project) {
    try {
      const raw = await fs.readFile(
        path.join(projectDir, "project.json"),
        "utf-8"
      );
      const parsed = JSON.parse(raw) as { topic?: string };
      has_topic = typeof parsed.topic === "string" && parsed.topic.length > 0;
    } catch {
      has_topic = false;
    }
  }

  const available: PipelineId[] = [];

  if (has_demo_spec) available.push("product-demo");
  if (has_video_spec) available.push("video-demo");
  if (has_srt) {
    available.push("from-input");
    available.push("cinematic");
  }
  if (has_script || has_topic) available.push("topic");

  const unique = Array.from(new Set(available));

  let suggested: PipelineId;
  if (has_demo_spec) suggested = "product-demo";
  else if (has_video_spec) suggested = "video-demo";
  else if (has_srt) suggested = "from-input";
  else if (has_script || has_topic) suggested = "topic";
  else suggested = "topic";

  return {
    available: unique,
    suggested,
    signals: {
      has_demo_spec,
      has_video_spec,
      has_srt,
      has_mp3,
      has_beats,
      has_script,
      has_project,
      has_topic,
    },
  };
}
