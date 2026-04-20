// PATCH /api/settings/[projectId] — 특정 프로젝트의 render 설정 업데이트
//   body: { render: Partial<RenderSettings> }
//
// 동작:
// 1) project.json / demo-spec.json / video-spec.json 중 존재하는 소스 파일 감지
// 2) 해당 파일의 render 필드 merge + 저장
// 3) render-props-v2.json 이 존재하면 같은 render 필드를 루트에 주입 (스킵하면 다음 렌더 때까지 stale)
import { NextRequest, NextResponse } from "next/server";
import {
  readJSON,
  writeJSON,
  getProjectPath,
} from "@/services/file-service";
import type {
  Project,
  DemoSpec,
  VideoSpec,
  RenderSettings,
} from "@/types/index";

type AnyWithRender = {
  render?: RenderSettings;
  updated_at?: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = (await req.json()) as { render?: Partial<RenderSettings> };
    if (!body.render || typeof body.render !== "object") {
      return NextResponse.json({ error: "render 필드 없음" }, { status: 400 });
    }

    // fps/width/height 유효성
    const r = body.render;
    if (r.fps !== undefined && (r.fps < 1 || r.fps > 120)) {
      return NextResponse.json({ error: "fps 범위 오류(1~120)" }, { status: 400 });
    }
    if (r.width !== undefined && (r.width < 160 || r.width > 7680)) {
      return NextResponse.json({ error: "width 범위 오류" }, { status: 400 });
    }
    if (r.height !== undefined && (r.height < 120 || r.height > 4320)) {
      return NextResponse.json({ error: "height 범위 오류" }, { status: 400 });
    }

    // 소스 파일 감지
    const candidates: Array<{
      file: "project.json" | "demo-spec.json" | "video-spec.json";
    }> = [
      { file: "project.json" },
      { file: "demo-spec.json" },
      { file: "video-spec.json" },
    ];

    let updated: AnyWithRender | null = null;
    let updatedSource: string | null = null;

    for (const c of candidates) {
      const abs = getProjectPath(projectId, c.file);
      const existing = await readJSON<AnyWithRender>(abs);
      if (!existing) continue;
      existing.render = { ...(existing.render ?? {}), ...r };
      existing.updated_at = new Date().toISOString();
      await writeJSON(abs, existing);
      updated = existing;
      updatedSource = c.file;
      break;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "소스 파일 없음 (project/demo-spec/video-spec)" },
        { status: 404 }
      );
    }

    // render-props-v2.json 동기화 (존재할 때만)
    try {
      const rpPath = getProjectPath(projectId, "render-props-v2.json");
      const rp = await readJSON<Record<string, unknown> & { render?: RenderSettings }>(
        rpPath
      );
      if (rp) {
        rp.render = { ...(rp.render ?? {}), ...r };
        await writeJSON(rpPath, rp);
      }
    } catch {
      /* 동기화 실패는 치명적이지 않음 */
    }

    return NextResponse.json({
      ok: true,
      source: updatedSource,
      render: updated.render,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "설정 업데이트 실패", detail: String(e) },
      { status: 500 }
    );
  }
}

// render-props-v2.json 을 추가 ProjectFileName 으로 등록해야 함 — 이미 등록됨.
