#!/usr/bin/env npx tsx
/**
 * tts-demo-slides.ts
 *
 * demo-spec.json slides → ElevenLabs PVC TTS (slide-by-slide)
 *   → per-slide loudnorm + apad → merged MP3 + voice-timeline.json
 *
 * Usage: npx tsx scripts/tts-demo-slides.ts {projectId} [--preview]
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const projectId = process.argv[2];
const preview = process.argv.includes("--preview");
if (!projectId) { console.error("Usage: tts-demo-slides.ts {pid}"); process.exit(1); }

const API_KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID!;
if (!API_KEY || !VOICE_ID) { console.error("Missing ELEVENLABS keys"); process.exit(1); }

const projectDir = path.join("data", projectId);
const specPath = path.join(projectDir, "demo-spec.json");
const spec = JSON.parse(fs.readFileSync(specPath, "utf-8"));

// 영문 → 한글 음차 (한국어 문맥 속 영문 고유명사 치환).
// 프로젝트별로 demo-spec.json의 `romanize` 필드가 있으면 머지.
const DEFAULT_ROMANIZE: Record<string, string> = {
  "Save to Notion": "세이브 투 노션",
  "Notion": "노션",
};
const romanizeMap: Record<string, string> = {
  ...DEFAULT_ROMANIZE,
  ...(spec.romanize || {}),
};

function romanize(text: string): string {
  if (spec.keep_english) return text;
  // 긴 키부터 치환해야 부분 매치가 먼저 먹지 않음
  const keys = Object.keys(romanizeMap).sort((a, b) => b.length - a.length);
  let out = text;
  for (const k of keys) {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), romanizeMap[k]);
  }
  return out;
}

async function tts(text: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function ffprobeMs(file: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  ).toString().trim();
  return Math.round(parseFloat(out) * 1000);
}

// loudnorm I=-18 + 250ms apad (슬라이드 경계 호흡). 결과는 wav.
function normalizeSlide(inMp3: string, outWav: string) {
  execSync(
    `ffmpeg -y -i "${inMp3}" -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" -ar 44100 -ac 1 "${outWav}" 2>/dev/null`
  );
}

async function main() {
  const tmpDir = path.join("tmp", projectId);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync("output", { recursive: true });

  const slides = preview ? spec.slides.slice(0, 1) : spec.slides;
  console.log(`🎙️  PVC TTS ${slides.length}슬라이드 (voice=${VOICE_ID})`);

  const chunkFiles: string[] = [];
  const timeline: Array<{ id: string; offset_ms: number; duration_ms: number }> = [];
  let offset = 0;

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (!s.narration) throw new Error(`slide ${s.id} narration missing`);
    const spoken = romanize(s.narration);
    process.stdout.write(`  [${i + 1}/${slides.length}] ${s.id}...`);

    const buf = await tts(spoken);
    const rawPath = path.join(tmpDir, `${s.id}.raw.mp3`);
    fs.writeFileSync(rawPath, buf);

    const normPath = path.join(tmpDir, `${s.id}.norm.wav`);
    normalizeSlide(rawPath, normPath);

    const ms = ffprobeMs(normPath);
    s.narration_ms = ms;
    s.audio_offset_ms = offset;
    timeline.push({ id: s.id, offset_ms: offset, duration_ms: ms });
    offset += ms;
    chunkFiles.push(normPath);
    console.log(` ${ms}ms (norm)`);
  }

  // concat 정규화된 wav들 → 최종 mp3
  const concatPath = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatPath, chunkFiles.map(f => `file '${path.resolve(f)}'`).join("\n"));
  const outMp3 = path.join("output", `${projectId}.mp3`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a libmp3lame -q:a 2 -ar 44100 -ac 1 "${outMp3}" 2>/dev/null`
  );

  fs.writeFileSync(
    path.join(projectDir, "voice-timeline.json"),
    JSON.stringify({ total_ms: offset, slides: timeline }, null, 2),
  );

  spec.updated_at = new Date().toISOString();
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  const kb = fs.statSync(outMp3).size / 1024;
  console.log(`✅ ${outMp3} (${kb.toFixed(0)}KB, ${(offset / 1000).toFixed(1)}s)`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
