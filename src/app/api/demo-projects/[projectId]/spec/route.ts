// GET / PUT / PATCH /api/demo-projects/[projectId]/spec
import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, getProjectPath } from "@/services/file-service";
import type { DemoSpec, DemoSlide } from "@/types/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const spec = await readJSON<DemoSpec>(
    getProjectPath(projectId, "demo-spec.json")
  );
  if (!spec) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(spec);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = (await req.json()) as DemoSpec;
    if (!body || body.kind !== "product-demo") {
      return NextResponse.json({ error: "invalid spec" }, { status: 400 });
    }
    body.id = projectId;
    body.updated_at = new Date().toISOString();
    await writeJSON(getProjectPath(projectId, "demo-spec.json"), body);
    return NextResponse.json({ ok: true, spec: body });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const patch = (await req.json()) as {
      slideId?: string;
      slide?: Partial<DemoSlide>;
      reorder?: string[];
      title?: string;
      delete?: string;
    };
    const specPath = getProjectPath(projectId, "demo-spec.json");
    const spec = await readJSON<DemoSpec>(specPath);
    if (!spec) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (patch.title !== undefined) spec.title = patch.title;

    if (patch.delete) {
      spec.slides = spec.slides.filter((s) => s.id !== patch.delete);
    }

    if (patch.slideId && patch.slide) {
      spec.slides = spec.slides.map((s) =>
        s.id === patch.slideId ? { ...s, ...patch.slide } : s
      );
    }

    if (patch.reorder && patch.reorder.length > 0) {
      const idx = new Map(patch.reorder.map((id, i) => [id, i + 1]));
      spec.slides
        .sort(
          (a, b) => (idx.get(a.id) ?? 999) - (idx.get(b.id) ?? 999)
        )
        .forEach((s, i) => {
          s.order = i + 1;
        });
    }

    spec.updated_at = new Date().toISOString();
    await writeJSON(specPath, spec);
    return NextResponse.json({ ok: true, spec });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
