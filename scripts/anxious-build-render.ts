#!/usr/bin/env npx tsx
/**
 * anxious-build-render.ts
 *
 * scenes-meta.json 의 35 씬을 읽어
 *   1) 씬별 mp3 → 단일 통합 mp3 (순차 concat, 씬 간 0.15s 간격)
 *   2) render-full.json (scenes 배열 + audioSrc)
 * 를 생성한다.
 */
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const PID = "anxious-claude-0420";
const metaPath = path.join("data", PID, "scenes-meta.json");
const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

const audioDir = path.join("public", "audio", PID);
const outputAudio = path.join(audioDir, "full.mp3");

const fps = meta.fps ?? 30;
const SCENE_GAP_MS = 150;
const SCENE_TAIL_MS = 200; // 씬 마지막 프레임에서 마이크로 여운

// concat list (scene mp3 → 0.15s 무음 → next) via ffmpeg filter
// ffmpeg 로 모든 scene mp3 를 amix/concat 하여 단일 mp3 생성 + 각 씬 offset 기록
const inputs: string[] = [];
let filterBuild = "";
const scenesOut: any[] = [];
let startMs = 0;

for (let i = 0; i < meta.scenes.length; i++) {
  const s = meta.scenes[i];
  if (!s.duration_ms) {
    console.error(`scene ${s.id} duration_ms missing — run TTS first`);
    process.exit(1);
  }
  const audioFile = path.join(audioDir, `scene-${String(i + 1).padStart(2, "0")}.mp3`);
  if (!fs.existsSync(audioFile)) {
    console.error(`missing: ${audioFile}`);
    process.exit(1);
  }
  inputs.push("-i", audioFile);
}

// adelay 기반 merge. 각 씬에 해당하는 start offset 계산 + mix.
let mixParts: string[] = [];
let cursorMs = 0;
const offsets: number[] = [];
for (let i = 0; i < meta.scenes.length; i++) {
  offsets.push(cursorMs);
  const dms = meta.scenes[i].duration_ms;
  // delay = cursorMs (ms), apply to channel [i:a]
  mixParts.push(`[${i}:a]adelay=${cursorMs}|${cursorMs},apad[s${i}]`);
  cursorMs += dms + SCENE_GAP_MS;
}
const totalMs = cursorMs - SCENE_GAP_MS + SCENE_TAIL_MS;
const mixInputs = meta.scenes.map((_: any, i: number) => `[s${i}]`).join("");
const filterComplex = [
  ...mixParts,
  `${mixInputs}amix=inputs=${meta.scenes.length}:normalize=0:duration=longest,atrim=0:${(totalMs / 1000).toFixed(3)}[a]`,
].join("; ");

const cmd = [
  "ffmpeg -y",
  inputs.join(" "),
  `-filter_complex "${filterComplex}"`,
  `-map "[a]"`,
  `-ar 44100 -ac 1 -c:a libmp3lame -q:a 2`,
  `"${outputAudio}"`,
].join(" ");

console.log("🎛  building combined audio…");
execSync(cmd + " 2>&1 | tail -4", { stdio: "inherit" });

// render-full.json
const renderProps = {
  audioSrc: `audio/${PID}/full.mp3`,
  stylePack: "dark-neon",
  render: { fps, width: 1920, height: 1080, stylePack: "dark-neon" },
  scenes: meta.scenes.map((s: any, i: number) => {
    const startMs = offsets[i];
    const durMs = s.duration_ms + SCENE_GAP_MS;
    const endMs = startMs + durMs;
    const durFrames = Math.round((durMs / 1000) * fps);
    // sentences → subtitles (seconds, relative to scene start)
    const subtitles = (s.sentences ?? []).map((sent: any) => ({
      startTime: sent.startMs / 1000,
      endTime: sent.endMs / 1000,
      text: sent.text.replace(/[.?!,]+$/, ""),
    }));
    const componentId = `anxious-${String(i + 1).padStart(2, "0")}`;
    return {
      id: s.id,
      project_id: PID,
      beat_index: i,
      layout_family: "custom-tsx",
      start_ms: startMs,
      end_ms: endMs,
      duration_frames: durFrames,
      components: [],
      copy_layers: { kicker: null, headline: s.narration.slice(0, 40), supporting: null, footer_caption: null, hook: null, claim: null, evidence: null, counterpoint: null, annotation: null, cta: null },
      motion: { entrance: "fadeUp", emphasis: null, exit: null, duration_ms: 800 },
      assets: { svg_icons: [], chart_type: null, chart_data: null },
      chunk_metadata: { intent: "custom", tone: "custom", evidence_type: "statement", emphasis_tokens: [], density: 1, beat_count: 1 },
      subtitles,
      narration: s.narration,
      transitions: { in: i === 0 ? "none" : "crossfade", out: "crossfade" },
      // 자막-오디오 싱크 보존을 위해 transition overlap 제거 (durationFrames=0 → 컷 전환)
      transition: { type: "crossfade", durationFrames: 0 },
      stack_root: {
        id: `${s.id}-root`,
        type: "SceneRoot",
        layout: { padding: 0, gap: 0 },
        style: { background: "transparent" },
        children: [
          { id: `${s.id}-tsx`, type: "TSX", data: { component: componentId }, layout: { width: "100%", height: "100%" } },
        ],
      },
    };
  }),
};

const renderPath = path.join("data", PID, "render-full.json");
fs.writeFileSync(renderPath, JSON.stringify(renderProps, null, 2));

const totalSec = (totalMs / 1000).toFixed(2);
console.log(`✅ ${outputAudio} (${totalSec}s)`);
console.log(`✅ ${renderPath}`);
console.log(`   총 씬: ${meta.scenes.length}, 총 프레임: ${renderProps.scenes.reduce((a: number, s: any) => a + s.duration_frames, 0)}`);
