import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { readJSON } from "@/services/file-service";

interface ChunkScene {
  scene_index: number;
  srt_range: [number, number];
  start_ms: number;
  end_ms: number;
  duration_s: number;
  subtitle_count: number;
  text: string;
}

interface Beat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  text: string;
  semantic: {
    intent: string;
    tone: string;
    evidence_type: string;
    emphasis_tokens: string[];
    density: number;
  };
}

interface ScenesV2Entry {
  id: string;
  project_id: string;
  beat_index: number;
  layout_family: string;
  start_ms: number;
  end_ms: number;
  duration_frames: number;
  components: unknown[];
  copy_layers: {
    kicker: string | null;
    headline: string;
    supporting: string | null;
    footer_caption: string | null;
    hook?: string | null;
    claim?: string | null;
    evidence?: string | null;
    counterpoint?: string | null;
    annotation?: string | null;
    cta?: string | null;
  };
  motion: {
    entrance: string;
    emphasis: string | null;
    exit: string | null;
    duration_ms: number;
  };
  assets: {
    svg_icons: string[];
    chart_type: string | null;
    chart_data: unknown | null;
  };
  chunk_metadata: {
    intent: string;
    tone: string;
    evidence_type: string;
    emphasis_tokens: string[];
    density: number;
    beat_count: number;
  };
  subtitles: Array<{ startTime: number; endTime: number; text: string }>;
  narration: string;
}

const FPS = 30;

// 의미 분석(intent/headline/icon/layout)은 Claude CLI가 /vg-layout에서 직접 수행.
// 이 API는 씬 경계 저장 + 기본 메타데이터 생성만 담당.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, scenes } = body as {
      project_id: string;
      scenes: ChunkScene[];
    };

    if (!project_id || !scenes) {
      return NextResponse.json(
        { error: "project_id와 scenes 필요" },
        { status: 400 }
      );
    }

    const outDir = path.join(process.cwd(), "data", project_id);
    await fs.mkdir(outDir, { recursive: true });

    // 1. chunks.json 저장
    const chunksPath = path.join(outDir, "chunks.json");
    await fs.writeFile(chunksPath, JSON.stringify(scenes, null, 2), "utf-8");

    // 2. beats.json 읽기 (subtitle 정보용)
    const beatsPath = path.join(outDir, "beats.json");
    const beats = await readJSON<Beat[]>(beatsPath);

    // 3. scenes-v2.json 생성
    const scenesV2: ScenesV2Entry[] = scenes.map((chunk, idx) => {
      const durationMs = chunk.end_ms - chunk.start_ms;
      const durationFrames = Math.round((durationMs / 1000) * FPS);

      // 해당 씬에 속하는 beats 추출
      const sceneBeats = beats
        ? beats.filter((b) => b.start_ms >= chunk.start_ms && b.end_ms <= chunk.end_ms + 100)
        : [];

      // subtitle 배열 생성
      const subtitles = sceneBeats.map((b) => ({
        startTime: (b.start_ms - chunk.start_ms) / 1000,
        endTime: (b.end_ms - chunk.start_ms) / 1000,
        text: b.text,
      }));

      // 의미 분석은 Claude CLI가 /vg-layout에서 직접 수행 — 여기선 빈 기본값
      const fullText = chunk.text;
      const density = Math.min(5, Math.max(1, Math.ceil(chunk.subtitle_count / 3)));

      return {
        id: `scene-${idx}`,
        project_id,
        beat_index: idx,
        layout_family: "pending",
        start_ms: chunk.start_ms,
        end_ms: chunk.end_ms,
        duration_frames: durationFrames,
        components: [],
        copy_layers: {
          kicker: null,
          headline: "",
          supporting: null,
          footer_caption: null,
          hook: null,
          claim: null,
          evidence: null,
          counterpoint: null,
          annotation: null,
          cta: null,
        },
        motion: {
          entrance: "fadeUp",
          emphasis: null,
          exit: null,
          duration_ms: durationMs,
        },
        assets: {
          svg_icons: [],
          chart_type: null,
          chart_data: null,
        },
        chunk_metadata: {
          intent: "pending",
          tone: "neutral",
          evidence_type: "statement",
          emphasis_tokens: [],
          density,
          beat_count: sceneBeats.length,
        },
        subtitles,
        narration: fullText,
      };
    });

    // 4. scenes-v2.json 저장
    const scenesV2Path = path.join(outDir, "scenes-v2.json");
    await fs.writeFile(
      scenesV2Path,
      JSON.stringify(scenesV2, null, 2),
      "utf-8"
    );

    // 5. project.json 상태 업데이트
    const projPath = path.join(outDir, "project.json");
    const projRaw = await fs.readFile(projPath, "utf-8").catch(() => null);
    if (projRaw) {
      const proj = JSON.parse(projRaw);
      proj.status = "scened";
      proj.updated_at = new Date().toISOString();
      proj.total_duration_ms = scenes[scenes.length - 1]?.end_ms || 0;
      await fs.writeFile(projPath, JSON.stringify(proj, null, 2), "utf-8");
    }

    return NextResponse.json({
      success: true,
      chunks_path: `data/${project_id}/chunks.json`,
      scenes_v2_path: `data/${project_id}/scenes-v2.json`,
      scenes_count: scenesV2.length,
    });
  } catch {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
