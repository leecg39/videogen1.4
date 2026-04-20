#!/usr/bin/env npx tsx
/**
 * tts-video-demo-segments.ts
 *
 * video-spec.json segments → local TTS, OpenAI TTS, or ElevenLabs PVC
 * (segment-by-segment)
 *   → per-segment loudnorm + apad → merged MP3 + voice-timeline.json
 *
 * Usage: npx tsx scripts/tts-video-demo-segments.ts {projectId} [--preview]
 *
 * NOTE: tts-demo-slides.ts 의 쌍둥이. 변경 사항:
 *   - spec 파일이 demo-spec.json 대신 video-spec.json
 *   - slides[] 대신 segments[] 순회
 *   - 단, narration / narration_ms / audio_offset_ms 필드명은 동일 유지
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
if (!projectId) { console.error("Usage: tts-video-demo-segments.ts {pid}"); process.exit(1); }

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_ELEVENLABS_VOICE_ID = "j9zDdWCMVw4VqUJwzwAL";
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

const projectDir = path.join("data", projectId);
const specPath = path.join(projectDir, "video-spec.json");
const spec = JSON.parse(fs.readFileSync(specPath, "utf-8"));

if (spec.kind !== "video-demo") {
  console.error(`❌ ${specPath} kind='${spec.kind}', expected 'video-demo'`);
  process.exit(1);
}

const DEFAULT_ROMANIZE: Record<string, string> = {
  "Save to Notion": "세이브 투 노션",
  "Notion": "노션",
};
const romanizeMap: Record<string, string> = {
  ...DEFAULT_ROMANIZE,
  ...(spec.romanize || {}),
};

type SupportedTtsProvider = "elevenlabs" | "openai" | "local";

function hasLocalSay(): boolean {
  try {
    execSync("command -v say >/dev/null 2>&1");
    return true;
  } catch {
    return false;
  }
}

function detectProvider(): SupportedTtsProvider {
  const requested = spec.voice?.provider;
  if (
    requested === "openai" ||
    requested === "elevenlabs" ||
    requested === "local"
  ) {
    return requested;
  }
  if (ELEVENLABS_API_KEY) return "elevenlabs";
  if (OPENAI_API_KEY) return "openai";
  if (hasLocalSay()) return "local";
  throw new Error(
    "Missing TTS credentials. Set OPENAI_API_KEY, ELEVENLABS_API_KEY, or use local macOS say."
  );
}

const provider = detectProvider();

const openaiModel =
  spec.voice?.model || process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const openaiVoice =
  spec.voice?.voice || process.env.OPENAI_TTS_VOICE || "coral";
const openaiInstructions =
  spec.voice?.instructions ||
  process.env.OPENAI_TTS_INSTRUCTIONS ||
  "차분하고 명확한 한국어 튜토리얼 톤으로 읽어주세요. 과한 감정 없이 전문적이되 딱딱하지 않게, 문장 사이 호흡을 자연스럽게 주세요.";
const rawOpenAiSpeed =
  spec.voice?.speed ??
  (process.env.OPENAI_TTS_SPEED
    ? Number(process.env.OPENAI_TTS_SPEED)
    : undefined);
const openaiSpeed =
  typeof rawOpenAiSpeed === "number" && Number.isFinite(rawOpenAiSpeed)
    ? rawOpenAiSpeed
    : undefined;
const localVoice = spec.voice?.voice || process.env.LOCAL_TTS_VOICE || "Yuna";
const localRate = (() => {
  const raw =
    spec.voice?.speed ??
    (process.env.LOCAL_TTS_RATE ? Number(process.env.LOCAL_TTS_RATE) : 1);
  if (!Number.isFinite(raw)) return 185;
  if (raw > 20) return Math.max(90, Math.min(360, Math.round(raw)));
  return Math.max(90, Math.min(360, Math.round(185 * raw)));
})();

function romanize(text: string): string {
  if (spec.keep_english) return text;
  const keys = Object.keys(romanizeMap).sort((a, b) => b.length - a.length);
  let out = text;
  for (const k of keys) {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), romanizeMap[k]);
  }
  return out;
}

async function ttsWithElevenLabs(text: string): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const voiceId = spec.voice?.voice_id || ELEVENLABS_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
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
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function ttsWithOpenAI(text: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (OPENAI_ORG_ID) headers["OpenAI-Organization"] = OPENAI_ORG_ID;
  if (OPENAI_PROJECT_ID) headers["OpenAI-Project"] = OPENAI_PROJECT_ID;

  const body: Record<string, unknown> = {
    model: openaiModel,
    voice: openaiVoice,
    input: text,
    response_format: "mp3",
  };

  if (openaiModel.startsWith("gpt-4o-mini-tts") && openaiInstructions) {
    body.instructions = openaiInstructions;
  }
  if (openaiSpeed !== undefined) {
    body.speed = openaiSpeed;
  }

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function ttsWithLocal(text: string, outPath: string): void {
  if (!hasLocalSay()) {
    throw new Error("Local macOS say command is not available");
  }

  const textPath = `${outPath}.txt`;
  fs.writeFileSync(textPath, text, "utf-8");
  execSync(
    `say -v "${localVoice}" -r ${localRate} -f "${textPath}" -o "${outPath}"`,
  );
}

async function tts(text: string): Promise<Buffer> {
  if (provider === "openai") return ttsWithOpenAI(text);
  return ttsWithElevenLabs(text);
}

function ffprobeMs(file: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  ).toString().trim();
  return Math.round(parseFloat(out) * 1000);
}

function normalizeSegment(inputFile: string, outWav: string) {
  execSync(
    `ffmpeg -y -i "${inputFile}" -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" -ar 44100 -ac 1 "${outWav}" 2>/dev/null`
  );
}

async function main() {
  const tmpDir = path.join("tmp", projectId);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync("output", { recursive: true });

  const segments = preview ? spec.segments.slice(0, 1) : spec.segments;
  const ttsLabel =
    provider === "local"
      ? `Local TTS say/${localVoice}@${localRate}`
      : provider === "openai"
      ? `OpenAI TTS ${openaiModel}/${openaiVoice}`
      : `ElevenLabs PVC (${spec.voice?.voice_id || ELEVENLABS_VOICE_ID})`;
  console.log(`🎙️  ${ttsLabel} ${segments.length} segments`);

  const chunkFiles: string[] = [];
  const timeline: Array<{ id: string; offset_ms: number; duration_ms: number }> = [];
  let offset = 0;

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (!s.narration) throw new Error(`segment ${s.id} narration missing`);
    const spoken = romanize(s.narration);
    process.stdout.write(`  [${i + 1}/${segments.length}] ${s.id}...`);

    const rawExt = provider === "local" ? "aiff" : "mp3";
    const rawPath = path.join(tmpDir, `${s.id}.raw.${rawExt}`);
    if (provider === "local") {
      ttsWithLocal(spoken, rawPath);
    } else {
      const buf = await tts(spoken);
      fs.writeFileSync(rawPath, buf);
    }

    const normPath = path.join(tmpDir, `${s.id}.norm.wav`);
    normalizeSegment(rawPath, normPath);

    const ms = ffprobeMs(normPath);
    s.narration_ms = ms;
    s.audio_offset_ms = offset;
    timeline.push({ id: s.id, offset_ms: offset, duration_ms: ms });
    offset += ms;
    chunkFiles.push(normPath);
    console.log(` ${ms}ms (norm)`);
  }

  const concatPath = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatPath, chunkFiles.map(f => `file '${path.resolve(f)}'`).join("\n"));
  const outMp3 = path.join("output", `${projectId}.mp3`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a libmp3lame -q:a 2 -ar 44100 -ac 1 "${outMp3}" 2>/dev/null`
  );

  fs.writeFileSync(
    path.join(projectDir, "voice-timeline.json"),
    JSON.stringify({ total_ms: offset, segments: timeline }, null, 2),
  );

  spec.updated_at = new Date().toISOString();
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  const kb = fs.statSync(outMp3).size / 1024;
  console.log(`✅ ${outMp3} (${kb.toFixed(0)}KB, ${(offset / 1000).toFixed(1)}s)`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
