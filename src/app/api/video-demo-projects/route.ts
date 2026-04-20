// POST /api/video-demo-projects → 새 video-demo 프로젝트 스켈레톤 생성
// GET /api/video-demo-projects → 기존 video-demo 프로젝트 목록
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  ensureDir,
  writeJSON,
  readJSON,
  listDirs,
  getProjectPath,
} from "@/services/file-service";
import type { VideoSpec } from "@/types/index";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || `video-demo-${Date.now()}`;
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const dirs = await listDirs(dataDir);
    const items: Array<{
      id: string;
      title: string;
      segments: number;
      videoDuration_ms: number;
    }> = [];
    for (const d of dirs) {
      const spec = await readJSON<VideoSpec>(
        getProjectPath(d, "video-spec.json")
      );
      if (spec && spec.kind === "video-demo") {
        items.push({
          id: spec.id,
          title: spec.title,
          segments: spec.segments.length,
          videoDuration_ms: spec.videoDuration_ms,
        });
      }
    }
    return NextResponse.json({ projects: items });
  } catch {
    return NextResponse.json({ error: "목록 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      id?: string;
    };
    const title = body.title?.trim() || "Untitled Video Demo";
    const id = body.id ? slugify(body.id) : slugify(title);

    const projectDir = path.join(process.cwd(), "data", id);
    const videoDir = path.join(process.cwd(), "public", "videos", id);
    await ensureDir(projectDir);
    await ensureDir(videoDir);

    const now = new Date().toISOString();
    // 빈 스켈레톤 (업로드 전까지는 segments/videoSrc 비어있음)
    const spec: VideoSpec = {
      id,
      kind: "video-demo",
      title,
      videoSrc: "",
      videoWidth: 0,
      videoHeight: 0,
      videoDuration_ms: 0,
      videoFps: 0,
      voice: {},
      segments: [],
      created_at: now,
      updated_at: now,
    };
    await writeJSON(getProjectPath(id, "video-spec.json"), spec);

    return NextResponse.json({ ok: true, id, spec });
  } catch (e) {
    return NextResponse.json(
      { error: "프로젝트 생성 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
