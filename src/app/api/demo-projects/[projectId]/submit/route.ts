// POST /api/demo-projects/[projectId]/submit
// → demo-trigger.json (status: pending) 작성. SessionStart 훅이 다음 세션에서 감지.
import { NextRequest, NextResponse } from "next/server";
import {
  readJSON,
  writeJSON,
  getProjectPath,
} from "@/services/file-service";
import type { DemoSpec, DemoTrigger } from "@/types/index";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const spec = await readJSON<DemoSpec>(
      getProjectPath(projectId, "demo-spec.json")
    );
    if (!spec) {
      return NextResponse.json({ error: "spec 없음" }, { status: 404 });
    }
    if (spec.slides.length === 0) {
      return NextResponse.json(
        { error: "슬라이드가 없습니다" },
        { status: 400 }
      );
    }
    const missingAction = spec.slides.filter((s) => !s.action.trim());
    if (missingAction.length > 0) {
      return NextResponse.json(
        {
          error: "모든 슬라이드에 액션 설명이 필요합니다",
          missing: missingAction.map((s) => s.id),
        },
        { status: 400 }
      );
    }

    const trigger: DemoTrigger = {
      pid: projectId,
      status: "pending",
      created_at: new Date().toISOString(),
      submitted_by: "web",
      output_path: null,
      error: null,
    };
    await writeJSON(getProjectPath(projectId, "demo-trigger.json"), trigger);

    return NextResponse.json({
      ok: true,
      pid: projectId,
      hint: `터미널에서 \`/vg-demo ${projectId}\` 를 실행하세요. SessionStart 훅이 자동 감지합니다.`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
