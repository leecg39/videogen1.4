// POST /api/demo-projects/[projectId]/upload — 이미지 업로드 + spec slides 추가
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import {
  readJSON,
  writeJSON,
  ensureDir,
  getProjectPath,
} from "@/services/file-service";
import type { DemoSpec, DemoSlide } from "@/types/index";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const specPath = getProjectPath(projectId, "demo-spec.json");
    const spec = await readJSON<DemoSpec>(specPath);
    if (!spec) {
      return NextResponse.json({ error: "spec 없음" }, { status: 404 });
    }

    const form = await req.formData();
    const files = form.getAll("file") as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: "file 필드 비어있음" }, { status: 400 });
    }

    const imagesDir = path.join(process.cwd(), "public", "images", projectId);
    await ensureDir(imagesDir);

    const newSlides: DemoSlide[] = [];
    let nextOrder = (spec.slides.at(-1)?.order ?? 0) + 1;

    for (const file of files) {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const seq = String(nextOrder).padStart(2, "0");
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40) || "slide";
      const fileName = `${seq}-${baseName}.${ext}`;
      const absPath = path.join(imagesDir, fileName);
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(absPath, buf);

      const slide: DemoSlide = {
        id: `s${nextOrder}`,
        order: nextOrder,
        image: `images/${projectId}/${fileName}`,
        action: "",
        narration: null,
        narration_ms: null,
        hotspots: [],
        camera: null,
      };
      newSlides.push(slide);
      nextOrder++;
    }

    spec.slides.push(...newSlides);
    spec.updated_at = new Date().toISOString();
    await writeJSON(specPath, spec);

    return NextResponse.json({ ok: true, added: newSlides.length, spec });
  } catch (e) {
    return NextResponse.json(
      { error: "업로드 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
