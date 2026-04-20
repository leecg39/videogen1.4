#!/usr/bin/env npx tsx
/**
 * tts-generate.ts
 *
 * script.json → ElevenLabs TTS → MP3 + SRT
 *
 * Usage:
 *   npx tsx scripts/tts-generate.ts {projectId}
 *   npx tsx scripts/tts-generate.ts {projectId} --preview  (첫 챕터만)
 *
 * 환경변수 (.env):
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Load .env
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}

const projectId = process.argv[2];
const previewMode = process.argv.includes("--preview");

if (!projectId) {
  console.error("Usage: npx tsx scripts/tts-generate.ts {projectId} [--preview]");
  process.exit(1);
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY not found in .env");
  process.exit(1);
}

const projectDir = path.join("data", projectId);
const scriptPath = path.join(projectDir, "script.json");
const projectPath = path.join(projectDir, "project.json");

if (!fs.existsSync(scriptPath)) {
  console.error(`❌ ${scriptPath} not found. Run /vg-script first.`);
  process.exit(1);
}

interface Paragraph {
  text: string;
  pause_after?: number;
}

interface Chapter {
  id: string;
  title: string;
  intent?: string;
  paragraphs: Paragraph[];
}

interface Script {
  title: string;
  chapters: Chapter[];
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

const script: Script = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
const project = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
const VOICE_ID = project.voice?.voice_id || process.env.ELEVENLABS_VOICE_ID;

if (!VOICE_ID) {
  console.error("❌ No voice_id found in project.json or .env");
  process.exit(1);
}

const MAX_CHARS_PER_CALL = 4500;

// 영문 → 한글 음차 (한국어 문맥 속 영문 고유명사). project.json의 romanize 필드로 확장 가능.
const DEFAULT_ROMANIZE: Record<string, string> = {
  "Save to Notion": "세이브 투 노션",
  "Notion": "노션",
};
const romanizeMap: Record<string, string> = {
  ...DEFAULT_ROMANIZE,
  ...(project.romanize || {}),
};
function romanize(text: string): string {
  if (project.keep_english) return text;
  const keys = Object.keys(romanizeMap).sort((a, b) => b.length - a.length);
  let out = text;
  for (const k of keys) {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), romanizeMap[k]);
  }
  return out;
}

async function callTTS(text: string): Promise<{ audioBuffer: Buffer; alignment: Alignment }> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;
  const body = JSON.stringify({
    text: romanize(text),
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
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { audio_base64: string; alignment: Alignment };
  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  return { audioBuffer, alignment: data.alignment };
}

function alignmentToSRT(alignment: Alignment, timeOffset: number): { srt: string; duration: number } {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  // Reconstruct text with timestamps
  const fullText = chars.join("");

  // Split into sentences by punctuation
  const sentences: Array<{ text: string; start: number; end: number }> = [];
  let sentStart = 0;
  let sentStartTime = starts[0] ?? 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "." || ch === "?" || ch === "!" || i === chars.length - 1) {
      const sentText = fullText.substring(sentStart, i + 1).trim();
      if (sentText.length > 0) {
        sentences.push({
          text: sentText,
          start: sentStartTime + timeOffset,
          end: (ends[i] ?? ends[ends.length - 1] ?? 0) + timeOffset,
        });
      }
      sentStart = i + 1;
      if (i + 1 < starts.length) {
        sentStartTime = starts[i + 1];
      }
    }
  }

  // Format as SRT
  let srtIndex = 1;
  let srtContent = "";
  for (const sent of sentences) {
    srtContent += `${srtIndex}\n`;
    srtContent += `${formatSRTTime(sent.start)} --> ${formatSRTTime(sent.end)}\n`;
    srtContent += `${sent.text}\n\n`;
    srtIndex++;
  }

  const duration = ends.length > 0 ? ends[ends.length - 1] : 0;
  return { srt: srtContent, duration };
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// loudnorm I=-18 + 250ms apad → wav. 길이는 원본 + 0.25s.
function normalizeToWav(inMp3: string, outWav: string) {
  execSync(
    `ffmpeg -y -i "${inMp3}" -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" -ar 44100 -ac 1 "${outWav}" 2>/dev/null`
  );
}

async function main() {
  console.log(`\n🎙️  TTS 생성 시작: ${script.title}`);
  console.log(`   Voice ID: ${VOICE_ID}`);
  console.log(`   챕터: ${script.chapters.length}개${previewMode ? " (미리보기: 첫 챕터만)" : ""}\n`);

  const tmpDir = path.join("/tmp", `tts-${projectId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chapters = previewMode ? [script.chapters[0]] : script.chapters;
  const normWavFiles: string[] = [];
  let allSRT = "";
  let srtIndex = 1;
  let timeOffset = 0;
  let chunkCounter = 0;

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    const fullText = ch.paragraphs.map(p => p.text).join(" ");
    console.log(`  [${ci + 1}/${chapters.length}] ${ch.title} (${fullText.length}자)...`);

    // Split if too long
    const chunks: string[] = [];
    if (fullText.length > MAX_CHARS_PER_CALL) {
      const sentences = fullText.split(/(?<=[.?!])\s+/);
      let current = "";
      for (const sent of sentences) {
        if ((current + " " + sent).length > MAX_CHARS_PER_CALL) {
          if (current) chunks.push(current);
          current = sent;
        } else {
          current = current ? current + " " + sent : sent;
        }
      }
      if (current) chunks.push(current);
    } else {
      chunks.push(fullText);
    }

    for (const chunk of chunks) {
      const { audioBuffer, alignment } = await callTTS(chunk);

      // per-chunk loudnorm + apad=0.25
      const rawPath = path.join(tmpDir, `chunk-${String(chunkCounter).padStart(3, "0")}.raw.mp3`);
      const normPath = path.join(tmpDir, `chunk-${String(chunkCounter).padStart(3, "0")}.norm.wav`);
      fs.writeFileSync(rawPath, audioBuffer);
      normalizeToWav(rawPath, normPath);
      normWavFiles.push(normPath);
      chunkCounter++;

      // Generate SRT with correct offset
      const chars = alignment.characters;
      const starts = alignment.character_start_times_seconds;
      const ends = alignment.character_end_times_seconds;
      const chunkText = chars.join("");

      // Split into sentences
      let sentStart = 0;
      let sentStartTime = starts[0] ?? 0;
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === "." || c === "?" || c === "!" || i === chars.length - 1) {
          const sentText = chunkText.substring(sentStart, i + 1).trim();
          if (sentText.length > 1) {
            const sStart = sentStartTime + timeOffset;
            const sEnd = (ends[i] ?? 0) + timeOffset;
            allSRT += `${srtIndex}\n`;
            allSRT += `${formatSRTTime(sStart)} --> ${formatSRTTime(sEnd)}\n`;
            allSRT += `${sentText}\n\n`;
            srtIndex++;
          }
          sentStart = i + 1;
          if (i + 1 < starts.length) sentStartTime = starts[i + 1];
        }
      }

      const chunkDuration = ends.length > 0 ? ends[ends.length - 1] : 0;
      // 0.25s apad per chunk → SRT gap 동일하게 0.25s
      timeOffset += chunkDuration + 0.25;
    }

    console.log(`    ✅ 완료 (누적: ${timeOffset.toFixed(1)}초)`);
  }

  // Create concat file for ffmpeg (normalized wavs)
  const concatList = normWavFiles.map(f => `file '${path.resolve(f)}'`).join("\n");
  const concatPath = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatPath, concatList);

  // 최종 산출물은 output/에 (user-facing). vg-new 호환을 위해 input/에도 복사.
  fs.mkdirSync("output", { recursive: true });
  fs.mkdirSync("input", { recursive: true });
  const outputMp3 = path.join("output", `${projectId}.mp3`);
  const outputSrt = path.join("output", `${projectId}.srt`);
  const inputMp3 = path.join("input", `${projectId}.mp3`);
  const inputSrt = path.join("input", `${projectId}.srt`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a libmp3lame -q:a 2 -ar 44100 -ac 1 "${outputMp3}" 2>/dev/null`
  );

  fs.writeFileSync(outputSrt, allSRT);
  fs.copyFileSync(outputMp3, inputMp3);
  fs.copyFileSync(outputSrt, inputSrt);

  // Update project.json
  project.srt_path = `${projectId}.srt`;
  project.audio_path = `${projectId}.mp3`;
  project.status = "voiced";
  fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const mp3Size = fs.statSync(outputMp3).size;
  console.log(`\n✅ TTS 생성 완료!`);
  console.log(`   MP3: ${outputMp3} (${(mp3Size / 1024 / 1024).toFixed(1)}MB)`);
  console.log(`   SRT: ${outputSrt} (${srtIndex - 1}개 자막)`);
  console.log(`   총 길이: ${timeOffset.toFixed(1)}초 (${(timeOffset / 60).toFixed(1)}분)`);
}

main().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
