#!/usr/bin/env npx tsx
/**
 * gen-cinematic-scenes.ts
 *
 * beats.json → 시네마틱 scenes-v2.json 변환
 * 각 beat를 VideoClip 기반 전체 화면 씬으로 변환합니다.
 *
 * Usage:
 *   npx tsx scripts/gen-cinematic-scenes.ts {projectId}
 *
 * 입력:
 *   data/{projectId}/beats.json
 *
 * 출력:
 *   data/{projectId}/scenes-v2.json
 *   data/{projectId}/render-props-v2.json
 */

import * as fs from "fs";
import * as path from "path";

const projectId = process.argv[2];
if (!projectId) {
  console.error("Usage: npx tsx scripts/gen-cinematic-scenes.ts <projectId>");
  process.exit(1);
}

const FPS = 30;
const CROSSFADE_FRAMES = 30;

const beatsPath = path.join("data", projectId, "beats.json");
if (!fs.existsSync(beatsPath)) {
  console.error(`❌ beats.json not found: ${beatsPath}`);
  console.error(`   /vg-chunk를 먼저 실행하세요.`);
  process.exit(1);
}

interface Beat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  text: string;
  subtitles?: Array<{ startTime: number; endTime: number; text: string }>;
  [key: string]: any;
}

const beatsRaw = JSON.parse(fs.readFileSync(beatsPath, "utf-8"));
const beats: Beat[] = Array.isArray(beatsRaw) ? beatsRaw : beatsRaw.beats ?? [];

if (beats.length === 0) {
  console.error("❌ beats.json에 beat가 없습니다.");
  process.exit(1);
}

console.log(`📽️  시네마틱 씬 생성 시작: ${projectId}`);
console.log(`   beats: ${beats.length}개`);

// Generate scenes
const scenes = beats.map((beat, i) => {
  const startMs = beat.start_ms;
  const endMs = beat.end_ms;
  const durationMs = endMs - startMs;
  const durationFrames = Math.round((durationMs / 1000) * FPS);

  // Default video query from narration text (placeholder — replaced by Claude in skill workflow)
  const videoQuery = beat.video_query || `scene ${i + 1}`;

  return {
    id: `scene-${i}`,
    project_id: projectId,
    beat_index: beat.beat_index ?? i,
    layout_family: "hero-center" as const,
    start_ms: startMs,
    end_ms: endMs,
    duration_frames: durationFrames,
    components: [],
    copy_layers: {
      kicker: null,
      headline: beat.text.substring(0, 60),
      supporting: null,
      footer_caption: null,
    },
    motion: {
      entrance: "fade-in",
      emphasis: null,
      exit: null,
      duration_ms: durationMs,
    },
    assets: {
      svg_icons: [],
      chart_type: null,
      chart_data: null,
      video_queries: [
        {
          query: videoQuery,
          orientation: "landscape",
          minDuration: Math.max(5, Math.ceil(durationMs / 1000)),
        },
      ],
      videos: [],
    },
    chunk_metadata: {
      intent: "cinematic",
      tone: "visual",
      evidence_type: "b-roll",
      emphasis_tokens: [],
      density: 1,
      beat_count: 1,
    },
    narration: beat.text,
    subtitles: beat.subtitles ?? [
      { startTime: startMs, endTime: endMs, text: beat.text },
    ],
    stack_root: {
      type: "SceneRoot",
      layout: { padding: "0" },
      children: [
        {
          type: "VideoClip",
          data: {
            src: "", // filled after fetch-scene-videos
            objectFit: "cover",
            volume: 0,
            loop: true,
            overlay: "rgba(0,0,0,0.25)",
          },
        },
      ],
    },
    transition: i < beats.length - 1
      ? { type: "crossfade" as const, durationFrames: CROSSFADE_FRAMES }
      : undefined,
  };
});

// Write scenes-v2.json
const scenesPath = path.join("data", projectId, "scenes-v2.json");
const scenesData = { scenes, projectId };
fs.writeFileSync(scenesPath, JSON.stringify(scenesData, null, 2));
console.log(`✅ scenes-v2.json 생성: ${scenes.length}개 씬`);

// Write render-props-v2.json
const totalDurationFrames = scenes.reduce((sum, s) => sum + s.duration_frames, 0);

// Find audio file
const audioDir = path.join("data", projectId);
let audioPath = "";
for (const name of ["더빙.mp3", "audio.mp3", "voice.mp3"]) {
  const candidate = path.join(audioDir, name);
  if (fs.existsSync(candidate)) {
    audioPath = candidate;
    break;
  }
}
// Check public/ too
if (!audioPath) {
  for (const name of ["더빙.mp3", "audio.mp3"]) {
    const candidate = path.join("public", name);
    if (fs.existsSync(candidate)) {
      audioPath = name; // relative to public for staticFile
      break;
    }
  }
}

const renderProps = {
  scenes,
  projectId,
  totalDurationFrames,
  fps: FPS,
  width: 1920,
  height: 1080,
  audioPath,
};

const renderPropsPath = path.join("data", projectId, "render-props-v2.json");
fs.writeFileSync(renderPropsPath, JSON.stringify(renderProps, null, 2));
console.log(`✅ render-props-v2.json 생성 (${totalDurationFrames} frames, ${(totalDurationFrames / FPS).toFixed(1)}s)`);

console.log(`\n📋 다음 단계:`);
console.log(`   1. video_queries에 영문 검색 키워드 설정`);
console.log(`   2. npx tsx scripts/fetch-scene-videos.ts ${scenesPath}`);
console.log(`   3. 다운로드된 비디오 경로를 stack_root에 반영`);
console.log(`   4. bash scripts/postprocess-cinematic.sh ${scenesPath}`);
