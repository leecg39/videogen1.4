// GET / PUT / PATCH /api/video-demo-projects/[projectId]/spec
import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, getProjectPath } from "@/services/file-service";
import type { VideoSpec, VideoSegment } from "@/types/index";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const spec = await readJSON<VideoSpec>(
    getProjectPath(projectId, "video-spec.json")
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
    const body = (await req.json()) as VideoSpec;
    if (!body || body.kind !== "video-demo") {
      return NextResponse.json({ error: "invalid spec" }, { status: 400 });
    }
    body.id = projectId;
    body.updated_at = new Date().toISOString();
    await writeJSON(getProjectPath(projectId, "video-spec.json"), body);
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
      segmentId?: string;
      segment?: Partial<VideoSegment>;
      reorder?: string[];
      title?: string;
      delete?: string;
    };
    const specPath = getProjectPath(projectId, "video-spec.json");
    const spec = await readJSON<VideoSpec>(specPath);
    if (!spec) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (patch.title !== undefined) spec.title = patch.title;

    if (patch.delete) {
      spec.segments = spec.segments.filter((s) => s.id !== patch.delete);
    }

    if (patch.segmentId && patch.segment) {
      spec.segments = spec.segments.map((s) =>
        s.id === patch.segmentId ? { ...s, ...patch.segment } : s
      );
    }

    if (patch.reorder && patch.reorder.length > 0) {
      const idx = new Map(patch.reorder.map((id, i) => [id, i + 1]));
      spec.segments
        .sort((a, b) => (idx.get(a.id) ?? 999) - (idx.get(b.id) ?? 999))
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
