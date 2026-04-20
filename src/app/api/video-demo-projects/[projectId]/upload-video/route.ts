// POST /api/video-demo-projects/[projectId]/upload-video
//  - multipart "file" 필드 하나 받아서 public/videos/{pid}/source.mp4 저장
//  - ffprobe 로 dimensions/fps/duration 추출
//  - ffmpeg scene detection → 초기 segments 배열 생성
//  - 세그먼트 당 대표 프레임 1 장씩 썸네일 추출
//  - data/{pid}/video-spec.json 작성 후 반환
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import {
  readJSON,
  writeJSON,
  ensureDir,
  getProjectPath,
} from "@/services/file-service";
import {
  probe,
  detectScenes,
  extractFrame,
  cutsToSegments,
} from "@/services/ffmpeg-utils";
import type { VideoSpec, VideoSegment } from "@/types/index";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!/^[a-zA-Z0-9가-힣_\-]+$/.test(projectId)) {
      return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드 없음" }, { status: 400 });
    }

    // 1) 원본 mp4 저장
    const videoDir = path.join(process.cwd(), "public", "videos", projectId);
    const thumbsDir = path.join(videoDir, "thumbnails");
    await ensureDir(videoDir);
    await ensureDir(thumbsDir);

    const srcAbs = path.join(videoDir, "source.mp4");
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(srcAbs, buf);

    // 2) ffprobe
    const info = await probe(srcAbs);

    // 3) scene detection → segments
    const cuts = await detectScenes(srcAbs, 0.3);
    const rawSegs = cutsToSegments(cuts, info.durationMs, 1500);

    // 4) 썸네일 + segment 객체 생성
    const segments: VideoSegment[] = [];
    for (let i = 0; i < rawSegs.length; i++) {
      const { startMs, endMs } = rawSegs[i];
      const id = `seg-${i + 1}`;
      const midMs = Math.round((startMs + endMs) / 2);
      const thumbName = `${id}.png`;
      const thumbAbs = path.join(thumbsDir, thumbName);
      try {
        await extractFrame(srcAbs, midMs, thumbAbs);
      } catch (e) {
        // 썸네일 실패해도 segment 자체는 생성
        console.warn(`[upload-video] thumbnail failed for ${id}:`, e);
      }
      segments.push({
        id,
        order: i + 1,
        startMs,
        endMs,
        thumbnail: `videos/${projectId}/thumbnails/${thumbName}`,
        action: "",
        narration: null,
        narration_ms: null,
        hotspot: null,
        showCursor: true,
        keepOriginalAudio: false,
      });
    }

    // 5) video-spec.json 작성
    const specPath = getProjectPath(projectId, "video-spec.json");
    const existing = await readJSON<VideoSpec>(specPath);
    const now = new Date().toISOString();
    const spec: VideoSpec = {
      id: projectId,
      kind: "video-demo",
      title: existing?.title ?? projectId,
      videoSrc: `videos/${projectId}/source.mp4`,
      videoWidth: info.width,
      videoHeight: info.height,
      videoDuration_ms: info.durationMs,
      videoFps: info.fps,
      voice: existing?.voice,
      segments,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await writeJSON(specPath, spec);

    return NextResponse.json({
      ok: true,
      spec,
      detectedCuts: cuts.length,
      segmentCount: segments.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "업로드 실패", detail: String(e) },
      { status: 500 }
    );
  }
}

// FormData body 크기 제한 완화 (기본 1MB → 500MB)
export const runtime = "nodejs";
export const maxDuration = 300;
