#!/usr/bin/env node
// validate-outro-black.js — Scene Grammar v1.2 픽셀 게이트 P5
//
// 규칙:
//   - 영상 마지막 2초(60f @ 30fps) 구간에 블랙 세그먼트 1개라도 있으면 FAIL.
//   - ffprobe lavfi blackdetect 로 탐지.
//   - vibe-news-0407 엔딩 5프레임 블랙(f075~f079) 차단 목적.
//
// Usage:
//   node scripts/validate-outro-black.js <mp4-path> [--outro-sec 2.0] [--black-dur 0.05] [--pix-th 0.10]
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");
const { execFileSync } = require("child_process");

const DEFAULT_OUTRO_SEC = 2.0;
const DEFAULT_BLACK_DUR = 0.05;
// 0.03: 다크 바이올렛 틴트 배경(#08060D ~ #14101C, lum ≈ 0.03~0.05) 을 블랙으로 오판하지 않도록 보수적 세팅.
// 완전 블랙(lum < 0.03) 만 감지 → "엔딩 5프레임 블랙" 같은 sync-render-props 버그는 잡고 정상 다크 씬은 통과.
const DEFAULT_PIX_TH = 0.03;

function parseArgs(argv) {
  const args = { positional: [], outroSec: DEFAULT_OUTRO_SEC, blackDur: DEFAULT_BLACK_DUR, pixTh: DEFAULT_PIX_TH };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--outro-sec") args.outroSec = parseFloat(argv[++i]);
    else if (a === "--black-dur") args.blackDur = parseFloat(argv[++i]);
    else if (a === "--pix-th") args.pixTh = parseFloat(argv[++i]);
    else args.positional.push(a);
  }
  return args;
}

function getDurationSec(mp4) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", mp4,
  ]).toString().trim();
  return parseFloat(out);
}

function detectBlackSegments(mp4, blackDur, pixTh) {
  // ffmpeg blackdetect filter, stderr 에 lavfi.black_start/end 출력
  const output = execFileSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "info", "-nostats",
      "-i", mp4,
      "-vf", `blackdetect=d=${blackDur}:pix_th=${pixTh}`,
      "-an", "-f", "null", "-",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const stderr = output.toString(); // some platforms pipe all to stdout; handle below
  return stderr;
}

function parseBlackLines(stderr) {
  const re = /black_start:([\d.]+).*?black_end:([\d.]+).*?black_duration:([\d.]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(stderr)) !== null) {
    out.push({ start: parseFloat(m[1]), end: parseFloat(m[2]), duration: parseFloat(m[3]) });
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.positional.length === 0) {
    console.error("Usage: node validate-outro-black.js <mp4-path> [--outro-sec 2.0]");
    process.exit(2);
  }
  const mp4 = args.positional[0];
  if (!fs.existsSync(mp4)) {
    console.error(`[FAIL:outro-black] mp4 부재: ${mp4}`);
    process.exit(1);
  }

  const dur = getDurationSec(mp4);
  const outroStart = Math.max(0, dur - args.outroSec);

  let stderrText = "";
  try {
    // execFileSync 로 ffmpeg blackdetect, stderr 에서 라인 수집
    const res = require("child_process").spawnSync("ffmpeg", [
      "-hide_banner", "-loglevel", "info", "-nostats",
      "-i", mp4,
      "-vf", `blackdetect=d=${args.blackDur}:pix_th=${args.pixTh}`,
      "-an", "-f", "null", "-",
    ], { encoding: "utf8" });
    stderrText = (res.stderr || "") + "\n" + (res.stdout || "");
  } catch (err) {
    console.error(`[FAIL:outro-black] ffmpeg blackdetect 실행 실패: ${err.message}`);
    process.exit(1);
  }

  const segments = parseBlackLines(stderrText);
  const outroSegments = segments.filter((s) => s.end > outroStart);

  if (outroSegments.length > 0) {
    console.error(`❌ [FAIL:outro-black] ${mp4} (dur=${dur.toFixed(2)}s)`);
    for (const s of outroSegments) {
      console.error(`  black: ${s.start.toFixed(2)}s ~ ${s.end.toFixed(2)}s (dur=${s.duration.toFixed(3)}s)`);
    }
    process.exit(1);
  }

  console.log(`✅ [PASS:outro-black] ${mp4} 마지막 ${args.outroSec}s 구간 블랙 없음 (총 블랙 세그먼트 ${segments.length}개, 모두 outro 이전)`);
}

main();
