// @TASK P1-R1-T1 - Project 상세 조회 & 수정 & 삭제 API
// @SPEC docs/planning/05-api-spec.md#projects-id

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { readJSON, writeJSON, getProjectPath } from "@/services/file-service";
import { ProjectUpdateSchema } from "@/types/schemas";
import type { Project } from "@/types/index";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

// ─────────────────────────────────────────────
// GET /api/projects/:id - 프로젝트 상세 조회
// ─────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId: id } = await context.params;
    const filePath = getProjectPath(id, "project.json");
    const project = await readJSON<Project>(filePath);

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "프로젝트 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// PUT /api/projects/:id - 프로젝트 수정
// ─────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId: id } = await context.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 JSON 형식입니다" },
        { status: 400 }
      );
    }

    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "입력 검증 실패",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filePath = getProjectPath(id, "project.json");
    const existing = await readJSON<Project>(filePath);

    if (!existing) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const updated: Project = {
      ...existing,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    await writeJSON(filePath, updated);

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "프로젝트 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/projects/:id - 프로젝트 삭제
// ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId: id } = await context.params;
    const projectDir = path.join(process.cwd(), "data", id);

    // 프로젝트 존재 확인
    const filePath = getProjectPath(id, "project.json");
    const project = await readJSON<Project>(filePath);
    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // data/{projectId}/ 폴더 삭제
    await fs.rm(projectDir, { recursive: true, force: true });

    // output/{projectId}*.mp4 삭제
    const outputDir = path.join(process.cwd(), "output");
    try {
      const outputFiles = await fs.readdir(outputDir);
      for (const file of outputFiles) {
        if (file.startsWith(id) && file.endsWith(".mp4")) {
          await fs.unlink(path.join(outputDir, file));
        }
      }
    } catch {
      // output 폴더가 없어도 무시
    }

    return NextResponse.json(
      { message: `프로젝트 '${project.name}' 삭제 완료` },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "프로젝트 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
