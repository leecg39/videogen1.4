#!/usr/bin/env npx tsx
/**
 * anxious-tts-scene.ts
 *
 * 단일 씬 TTS 생성 + loudnorm + apad. 공심 PVC 보이스 사용.
 *
 * Usage:
 *   npx tsx scripts/anxious-tts-scene.ts <sceneId>
 *   예: npx tsx scripts/anxious-tts-scene.ts 01
 *
 * 입력: data/anxious-claude-0420/scenes-meta.json 의 scenes[sceneId].narration
 * 출력: public/audio/anxious-claude-0420/scene-<id>.mp3 + data/anxious-claude-0420/voices/scene-<id>.json
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Load .env
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const sceneArg = process.argv[2];
if (!sceneArg) {
  console.error("Usage: anxious-tts-scene.ts <sceneId>  (예: 01)");
  process.exit(1);
}
const sceneId = sceneArg.padStart(2, "0");

const API_KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID!;
if (!API_KEY || !VOICE_ID) {
  console.error("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env");
  process.exit(1);
}

const PROJECT_ID = "anxious-claude-0420";
const metaPath = path.join("data", PROJECT_ID, "scenes-meta.json");
if (!fs.existsSync(metaPath)) {
  console.error(`❌ ${metaPath} not found — run author step first.`);
  process.exit(1);
}
const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
const scene = meta.scenes.find((s: { id: string }) => s.id === `anxious-${sceneId}`);
if (!scene) {
  console.error(`❌ scene anxious-${sceneId} not found in meta`);
  process.exit(1);
}

const narration = scene.narration;
if (!narration) {
  console.error(`❌ scene anxious-${sceneId} has no narration`);
  process.exit(1);
}

// 한글 문맥 영문 고유명사 음차
const ROMANIZE: Record<string, string> = {
  "Anthropic": "앤트로픽",
  "Claude": "클로드",
  "Criticism Spiral": "크리티시즘 스파이럴",
  "Context Engineering": "컨텍스트 엔지니어링",
  "AI": "에이 아이",
};
function romanize(text: string): string {
  const keys = Object.keys(ROMANIZE).sort((a, b) => b.length - a.length);
  let out = text;
  for (const k of keys) {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), ROMANIZE[k]);
  }
  return out;
}

async function tts(text: string): Promise<{ audio: Buffer; alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } }> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;
  const body = JSON.stringify({
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style: 0.0,
      use_speaker_boost: true,
    },
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { audio_base64: string; alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } };
  return { audio: Buffer.from(data.audio_base64, "base64"), alignment: data.alignment };
}

function ffprobeMs(file: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  )
    .toString()
    .trim();
  return Math.round(parseFloat(out) * 1000);
}

async function main() {
  const tmpDir = path.join("tmp", `anxious-${sceneId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const audioDir = path.join("public", "audio", PROJECT_ID);
  fs.mkdirSync(audioDir, { recursive: true });

  const voicesDir = path.join("data", PROJECT_ID, "voices");
  fs.mkdirSync(voicesDir, { recursive: true });

  const spoken = romanize(narration);
  console.log(`🎙️  scene ${sceneId}: ${spoken}`);
  console.log(`   voice=${VOICE_ID}`);

  const { audio, alignment } = await tts(spoken);
  const rawPath = path.join(tmpDir, `raw.mp3`);
  fs.writeFileSync(rawPath, audio);

  // loudnorm I=-18 + 0.25s apad
  const outMp3 = path.join(audioDir, `scene-${sceneId}.mp3`);
  execSync(
    `ffmpeg -y -i "${rawPath}" -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" -ar 44100 -ac 1 -c:a libmp3lame -q:a 2 "${outMp3}" 2>/dev/null`
  );

  const durationMs = ffprobeMs(outMp3);

  // SRT용: 문장별 분할
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const fullText = chars.join("");
  const sentences: Array<{ text: string; startMs: number; endMs: number }> = [];
  let sStart = 0;
  let sStartTime = starts[0] ?? 0;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "." || c === "?" || c === "!" || c === "," || i === chars.length - 1) {
      const sentText = fullText.substring(sStart, i + 1).trim();
      if (sentText.length > 1) {
        sentences.push({
          text: sentText,
          startMs: Math.round(sStartTime * 1000),
          endMs: Math.round((ends[i] ?? 0) * 1000),
        });
      }
      sStart = i + 1;
      if (i + 1 < starts.length) sStartTime = starts[i + 1];
    }
  }

  const voiceMeta = {
    sceneId: `anxious-${sceneId}`,
    narration,
    narration_romanized: spoken,
    duration_ms: durationMs,
    audio_path: `audio/${PROJECT_ID}/scene-${sceneId}.mp3`,
    sentences,
  };
  fs.writeFileSync(
    path.join(voicesDir, `scene-${sceneId}.json`),
    JSON.stringify(voiceMeta, null, 2)
  );

  // Update scenes-meta.json with duration
  scene.duration_ms = durationMs;
  scene.audio_path = `audio/${PROJECT_ID}/scene-${sceneId}.mp3`;
  scene.sentences = sentences;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  // cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`✅ MP3: ${outMp3} (${durationMs}ms, ${(durationMs / 1000).toFixed(2)}s)`);
  console.log(`✅ META: ${path.join(voicesDir, `scene-${sceneId}.json`)}`);
}

main().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
