import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

// GET /api/projects/:id/chunks — chunks.json 조회
export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { projectId } = await context.params;
    const filePath = path.join(process.cwd(), "data", projectId, "chunks.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const chunks = JSON.parse(raw);
    return NextResponse.json(chunks, { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
