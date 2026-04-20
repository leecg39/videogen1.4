// ffmpeg-utils.ts — ffprobe + ffmpeg 쉘 호출 래퍼 (서버 사이드 전용)
//
// 사용처: /api/video-demo-projects/[pid]/upload-video
// 환경변수 FFMPEG_PATH / FFPROBE_PATH 로 바이너리 경로 override 가능.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";

export interface ProbeResult {
  width: number;
  height: number;
  durationMs: number;
  fps: number;
}

/**
 * mp4 의 width/height/duration/fps 를 JSON 으로 추출.
 */
export async function probe(absPath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    absPath,
  ]);
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{ width: number; height: number; r_frame_rate: string }>;
    format?: { duration: string };
  };
  const s = parsed.streams?.[0];
  if (!s) throw new Error(`ffprobe: no video stream in ${absPath}`);
  const durSec = Number(parsed.format?.duration ?? "0");
  const [num, den] = s.r_frame_rate.split("/").map(Number);
  const fps = den && den > 0 ? num / den : 30;
  return {
    width: s.width,
    height: s.height,
    durationMs: Math.round(durSec * 1000),
    fps,
  };
}

/**
 * ffmpeg scene detection. threshold 0~1 사이. 기본 0.3 은 적당히 보수적.
 * 반환: cut 시점의 ms 배열 (정렬됨, 항상 0 과 끝을 포함하지 않음).
 */
export async function detectScenes(
  absPath: string,
  threshold = 0.3
): Promise<number[]> {
  // showinfo 로그가 stderr 로 출력됨
  const { stderr } = await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-nostats",
      "-i",
      absPath,
      "-vf",
      `select='gt(scene,${threshold})',showinfo`,
      "-f",
      "null",
      "-",
    ],
    { maxBuffer: 16 * 1024 * 1024 }
  ).catch((err) => {
    // ffmpeg 는 exit 0 여도 stderr 로 showinfo 출력. catch 는 실제 실패만.
    if (err && typeof err === "object" && "stderr" in err) {
      return { stderr: String((err as { stderr: string }).stderr) };
    }
    throw err;
  });

  const cuts: number[] = [];
  const re = /pts_time:([0-9.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr)) !== null) {
    const sec = Number(m[1]);
    if (!Number.isNaN(sec)) cuts.push(Math.round(sec * 1000));
  }
  return cuts.sort((a, b) => a - b);
}

/**
 * 특정 시점(ms)에서 1 프레임 추출. outAbsPath 에 PNG 로 저장.
 */
export async function extractFrame(
  absPath: string,
  timeMs: number,
  outAbsPath: string
): Promise<void> {
  const ss = (timeMs / 1000).toFixed(3);
  await execFileAsync(FFMPEG, [
    "-y",
    "-hide_banner",
    "-nostats",
    "-loglevel",
    "error",
    "-ss",
    ss,
    "-i",
    absPath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outAbsPath,
  ]);
}

/**
 * scene cut 배열 + 전체 길이 → segment 배열 변환.
 * minDurationMs 이하는 병합해서 너무 짧은 세그먼트를 방지.
 */
export function cutsToSegments(
  cuts: number[],
  totalMs: number,
  minDurationMs = 1500
): Array<{ startMs: number; endMs: number }> {
  const bounds = [0, ...cuts.filter((c) => c > 0 && c < totalMs), totalMs];
  const segments: Array<{ startMs: number; endMs: number }> = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const startMs = bounds[i];
    const endMs = bounds[i + 1];
    if (endMs - startMs < minDurationMs && segments.length > 0) {
      // 직전 segment 에 병합
      segments[segments.length - 1].endMs = endMs;
    } else {
      segments.push({ startMs, endMs });
    }
  }
  return segments;
}
