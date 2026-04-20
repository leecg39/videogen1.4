// POST /api/demo-projects → 새 product-demo 프로젝트 스켈레톤 생성
// GET /api/demo-projects → 기존 demo 프로젝트 목록
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import {
  ensureDir,
  writeJSON,
  readJSON,
  listDirs,
  getProjectPath,
} from "@/services/file-service";
import type { DemoSpec } from "@/types/index";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || `demo-${Date.now()}`;
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const dirs = await listDirs(dataDir);
    const items: Array<{ id: string; title: string; slides: number }> = [];
    for (const d of dirs) {
      const spec = await readJSON<DemoSpec>(getProjectPath(d, "demo-spec.json"));
      if (spec && spec.kind === "product-demo") {
        items.push({ id: spec.id, title: spec.title, slides: spec.slides.length });
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
      style_pack?: string;
    };
    const title = body.title?.trim() || "Untitled Demo";
    const id = body.id ? slugify(body.id) : slugify(title);

    const projectDir = path.join(process.cwd(), "data", id);
    const imagesDir = path.join(process.cwd(), "public", "images", id);
    await ensureDir(projectDir);
    await ensureDir(imagesDir);

    const now = new Date().toISOString();
    const spec: DemoSpec = {
      id,
      kind: "product-demo",
      title,
      style_pack: body.style_pack || "dark-neon",
      voice: {},
      slides: [],
      created_at: now,
      updated_at: now,
    };
    await writeJSON(getProjectPath(id, "demo-spec.json"), spec);

    return NextResponse.json({ ok: true, id, spec });
  } catch (e) {
    return NextResponse.json(
      { error: "프로젝트 생성 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
