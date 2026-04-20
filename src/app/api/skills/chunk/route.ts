// @TASK P1.5-SK1-T2 - /vg-chunk SRT 의미 청킹 API Route
// @SPEC specs/shared/types.yaml
// @TEST tests/api/skills-chunk.test.ts

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { readJSON, writeJSON, getProjectPath } from "@/services/file-service";
import { parseSRT, type SRTEntry } from "@/services/srt-parser";
import type { BeatLite } from "@/services/svg-planner";
import type { Project } from "@/types/index";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface BeatSemantic {
  intent: string;
  tone: string;
  evidence_type: string;
  emphasis_tokens: string[];
  density: number;
  [key: string]: unknown;
}

export interface SvgNeedLite {
  concept: string;
  asset_id?: string;
  role: "focal" | "support" | "accent";
  style: "line-art" | "duotone" | "filled";
  pending_forge: boolean;
  rationale?: string;
}

interface Beat extends BeatLite {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  text: string;
  semantic: BeatSemantic;
  svg_needs?: SvgNeedLite[];
}

// ─────────────────────────────────────────────
// Input validation
// ─────────────────────────────────────────────

const ChunkRequestSchema = z.object({
  project_id: z.string().min(1, "project_id는 필수입니다"),
  plan_svg: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// 의미 분석은 Claude CLI가 /vg-layout에서 직접 수행.
// 이 API는 SRT → Beat 변환만 담당 (기본값으로 채움).
// ─────────────────────────────────────────────

function defaultSemantic(text: string): BeatSemantic {
  const wordCount = text.split(/\s+/).length;
  return {
    intent: "pending",
    tone: "neutral",
    evidence_type: "statement",
    emphasis_tokens: [],
    density: Math.min(5, Math.max(1, Math.ceil(wordCount / 5))),
  };
}

// ─────────────────────────────────────────────
// SRT entries -> Beat 배열 변환
// ─────────────────────────────────────────────

function entriesToBeats(entries: SRTEntry[]): Beat[] {
  return entries.map((entry, idx) => ({
    beat_index: idx,
    start_ms: entry.startMs,
    end_ms: entry.endMs,
    start_frame: entry.startFrame,
    end_frame: entry.endFrame,
    text: entry.text,
    semantic: defaultSemantic(entry.text),
  }));
}

// ─────────────────────────────────────────────
// POST /api/skills/chunk
// ─────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse & validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 JSON 형식입니다" },
        { status: 400 }
      );
    }

    const parsed = ChunkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "입력 검증 실패",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { project_id } = parsed.data;

    // 2. Read project.json
    const projectPath = getProjectPath(project_id, "project.json");
    const project = await readJSON<Project>(projectPath);
    if (!project) {
      return NextResponse.json(
        { error: `프로젝트를 찾을 수 없습니다: ${project_id}` },
        { status: 404 }
      );
    }

    // 3. Read SRT file
    let srtContent: string;
    try {
      const srtFilePath = path.join(
        process.cwd(),
        "data",
        project_id,
        project.srt_path
      );
      srtContent = await fs.readFile(srtFilePath, "utf-8");
    } catch {
      return NextResponse.json(
        { error: `SRT 파일을 읽을 수 없습니다: ${project.srt_path}` },
        { status: 400 }
      );
    }

    // 4. Parse SRT
    const entries = parseSRT(srtContent);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "SRT 파일에 유효한 자막 엔트리가 없습니다" },
        { status: 400 }
      );
    }

    // 5. Generate beats with semantic analysis
    let beats: Beat[] = entriesToBeats(entries);

    // 5.5. Optional: plan svg_needs per beat (opt-in via plan_svg: true)
    let svgCoverage: ReturnType<typeof import("@/services/svg-planner").libraryCoverageReport> | undefined;
    if (parsed.data.plan_svg) {
      const { planSvgNeedsForBeats, libraryCoverageReport } = await import("@/services/svg-planner");
      beats = planSvgNeedsForBeats(beats);
      svgCoverage = libraryCoverageReport(beats);
    }

    // 6. Write beats.json
    const beatsPath = getProjectPath(project_id, "beats.json");
    await writeJSON(beatsPath, beats);

    // 7. Update project status to "chunked"
    const updatedProject: Project = {
      ...project,
      status: "chunked",
      updated_at: new Date().toISOString(),
    };
    const updatedProjectPath = getProjectPath(project_id, "project.json");
    await writeJSON(updatedProjectPath, updatedProject);

    // 8. Return success
    return NextResponse.json(
      {
        success: true,
        beats_count: beats.length,
        output_path: `data/${project_id}/beats.json`,
        ...(svgCoverage ? { svg_coverage: svgCoverage } : {}),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "청킹 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
