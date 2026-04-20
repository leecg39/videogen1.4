#!/usr/bin/env node
// validate-bottom-occupancy.js — Scene Grammar v1.2 픽셀 게이트 P2 (v1.2.2 center-of-mass 확장)
//
// v1.2.1 → v1.2.2 변경 (2026-04-19 R2→R3 평가 반영):
//   - 오른쪽 페인 감사 "82% dead-space / 73% center-locked" 재현 위해 top-heavy 감지 추가.
//   - 단일 씬의 content pixel centroid Y 좌표를 계산.
//   - centroid Y / effective_height < 0.42 이면 top-heavy FAIL. (0.42 는 화면 상단 42% 선)
//   - 그리고 상단 50% content 비율 > 0.70 이면 center-locked FAIL.
//   - 기존 하단 20% 임계 규칙은 유지 (bottom-dead). 세 지표 OR.
//
// 규칙:
//   - (a) 하단 50%(자막바 제외) content ≥ 20% — bottom-dead 차단
//   - (b) content centroid Y / effective_height ≥ 0.42 — top-heavy 차단 (v1.2.2 신규)
//   - (c) 상단 50% content ratio ≤ 0.70 — center-locked/상단편향 차단 (v1.2.2 신규)
//   셋 중 하나라도 위반 시 FAIL.
//
// Modes:
//   (1) 단일 이미지:   node validate-bottom-occupancy.js <png|jpg>
//   (2) 폴더 배치:     node validate-bottom-occupancy.js --folder <dir>
//   (3) mp4 N초 샘플:  node validate-bottom-occupancy.js --video <mp4> [--sample-every 5 | --samples 3]
//   공통 옵션:        [--threshold 0.20] [--centroid-min 0.42] [--top-half-max 0.70]
//                    [--subtitle-bar-ratio 0.148] [--summary]
//   모드 제외 옵션:   [--skip-centroid] [--skip-top-half] [--skip-bottom]
//
// exit 0: all pass | exit 1: any fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const sharp = require("sharp");
const os = require("os");

const DEFAULT_THRESHOLD = 0.20;
const DEFAULT_SUBTITLE_BAR_RATIO = 0.148; // 160 / 1080
const DEFAULT_CENTROID_MIN = 0.42;        // effective_height 대비 centroid Y 최소 비율
const DEFAULT_TOP_HALF_MAX = 0.70;        // 상단 50% content ratio 최대
const DEFAULT_LOWER_THIRD_MIN = 0.30;     // 하단 1/3 영역 content ratio 최소 (v1.2.3: 0.10 → 0.30 상향, 감사 82% dead-space 재현)

function parseArgs(argv) {
  const args = {
    positional: [],
    threshold: DEFAULT_THRESHOLD,
    centroidMin: DEFAULT_CENTROID_MIN,
    topHalfMax: DEFAULT_TOP_HALF_MAX,
    lowerThirdMin: DEFAULT_LOWER_THIRD_MIN,
    subtitleBarRatio: DEFAULT_SUBTITLE_BAR_RATIO,
    subtitleBarPx: null,
    video: null,
    folder: null,
    sampleEvery: null,
    samples: null,
    summary: false,
    skipCentroid: false,
    skipTopHalf: false,
    skipBottom: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--threshold") args.threshold = parseFloat(argv[++i]);
    else if (a === "--centroid-min") args.centroidMin = parseFloat(argv[++i]);
    else if (a === "--top-half-max") args.topHalfMax = parseFloat(argv[++i]);
    else if (a === "--lower-third-min") args.lowerThirdMin = parseFloat(argv[++i]);
    else if (a === "--subtitle-bar-ratio") args.subtitleBarRatio = parseFloat(argv[++i]);
    else if (a === "--subtitle-bar-px") args.subtitleBarPx = parseInt(argv[++i], 10);
    else if (a === "--video") args.video = argv[++i];
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--sample-every") args.sampleEvery = parseFloat(argv[++i]);
    else if (a === "--samples") args.samples = parseInt(argv[++i], 10);
    else if (a === "--summary") args.summary = true;
    else if (a === "--skip-centroid") args.skipCentroid = true;
    else if (a === "--skip-top-half") args.skipTopHalf = true;
    else if (a === "--skip-bottom") args.skipBottom = true;
    else args.positional.push(a);
  }
  return args;
}

function isBackgroundPixel(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.06;
}

// v1.2.2: 4종 지표 동시 계산 — bottom 50%, 하단 1/3, centroid Y, top-half ratio
async function measureFrameBalance(imgPath, subtitleBarRatio, subtitleBarPxOverride) {
  const { data, info } = await sharp(imgPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const subtitleBarPx = subtitleBarPxOverride != null
    ? subtitleBarPxOverride
    : Math.round(height * subtitleBarRatio);
  const effH = Math.max(1, height - subtitleBarPx);
  const halfY = Math.floor(effH / 2);
  const thirdY = Math.floor((effH * 2) / 3); // 하단 1/3 시작선

  let contentBottom = 0, totalBottom = 0;
  let contentTop = 0, totalTop = 0;
  let contentLowerThird = 0, totalLowerThird = 0;
  let weightedY = 0, totalContent = 0;

  for (let y = 0; y < effH; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const isContent = !isBackgroundPixel(data[idx], data[idx + 1], data[idx + 2]);
      if (y < halfY) {
        totalTop++;
        if (isContent) contentTop++;
      } else {
        totalBottom++;
        if (isContent) contentBottom++;
      }
      if (y >= thirdY) {
        totalLowerThird++;
        if (isContent) contentLowerThird++;
      }
      if (isContent) {
        weightedY += y;
        totalContent++;
      }
    }
  }

  const bottomRatio = totalBottom > 0 ? contentBottom / totalBottom : 0;
  const lowerThirdRatio = totalLowerThird > 0 ? contentLowerThird / totalLowerThird : 0;
  const centroidY = totalContent > 0 ? weightedY / totalContent : effH / 2;
  const centroidRatio = centroidY / effH;
  const totalContentRatio = (contentTop + contentBottom) / (totalTop + totalBottom);
  const topOverAll = totalContent > 0 ? contentTop / totalContent : 0;

  return {
    bottomRatio, lowerThirdRatio, centroidY, centroidRatio, totalContentRatio, topOverAll,
    width, height, effH, subtitleBarPx,
  };
}

async function validateImage(imgPath, args) {
  if (!fs.existsSync(imgPath)) {
    console.error(`❌ [FAIL:bottom-occupancy] 부재: ${imgPath}`);
    return { path: imgPath, bottomRatio: 0, centroidRatio: 0, topOverAll: 1, pass: false };
  }
  try {
    const r = await measureFrameBalance(imgPath, args.subtitleBarRatio, args.subtitleBarPx);
    const reasons = [];

    const bottomFail = !args.skipBottom && r.bottomRatio < args.threshold;
    const lowerThirdFail = r.lowerThirdRatio < args.lowerThirdMin;
    const meaningfulContent = r.totalContentRatio >= 0.02;
    const centroidFail = !args.skipCentroid && meaningfulContent && r.centroidRatio < args.centroidMin;
    const topHalfFail = !args.skipTopHalf && meaningfulContent && r.topOverAll > args.topHalfMax;

    if (bottomFail) reasons.push(`bottom50=${(r.bottomRatio * 100).toFixed(1)}%<${(args.threshold * 100).toFixed(0)}%`);
    if (lowerThirdFail) reasons.push(`lower⅓=${(r.lowerThirdRatio * 100).toFixed(1)}%<${(args.lowerThirdMin * 100).toFixed(0)}%(dead-bottom)`);
    if (centroidFail) reasons.push(`centroidY=${(r.centroidRatio * 100).toFixed(0)}%<${(args.centroidMin * 100).toFixed(0)}%(top-heavy)`);
    if (topHalfFail) reasons.push(`topHalf=${(r.topOverAll * 100).toFixed(0)}%>${(args.topHalfMax * 100).toFixed(0)}%(center-locked)`);

    const pass = reasons.length === 0;
    if (pass) {
      console.log(`✅ [PASS:bottom-occupancy] ${path.basename(imgPath)} bot=${(r.bottomRatio * 100).toFixed(0)}% l⅓=${(r.lowerThirdRatio * 100).toFixed(0)}% cY=${(r.centroidRatio * 100).toFixed(0)}% topAll=${(r.topOverAll * 100).toFixed(0)}%`);
    } else {
      console.error(`❌ [FAIL:bottom-occupancy] ${path.basename(imgPath)} ${reasons.join(" | ")}`);
    }
    return { path: imgPath, ...r, pass, reasons };
  } catch (err) {
    console.error(`❌ [FAIL:bottom-occupancy] ${path.basename(imgPath)} 처리 오류: ${err.message}`);
    return { path: imgPath, bottomRatio: 0, centroidRatio: 0, topOverAll: 1, pass: false };
  }
}

function listImagesInFolder(dir) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  return fs.readdirSync(dir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(dir, f));
}

function getDurationSec(mp4) {
  return parseFloat(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", mp4,
  ]).toString().trim());
}

async function sampleFromVideo(mp4, sampleEvery, samples) {
  const dur = getDurationSec(mp4);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bot-occ-"));
  let times = [];
  if (sampleEvery && sampleEvery > 0) for (let t = sampleEvery / 2; t < dur; t += sampleEvery) times.push(t);
  else if (samples && samples > 0) for (let i = 0; i < samples; i++) times.push((dur * (i + 1)) / (samples + 1));
  else times = [dur * 0.25, dur * 0.5, dur * 0.75];
  const paths = [];
  for (let i = 0; i < times.length; i++) {
    const out = path.join(tmp, `s-${i.toString().padStart(4, "0")}-t${times[i].toFixed(1)}.png`);
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", times[i].toFixed(3), "-i", mp4, "-vframes", "1", out]);
    paths.push(out);
  }
  return paths;
}

function summarize(results, args) {
  const dead5 = results.filter((r) => (r.bottomRatio || 0) < 0.05).length;
  const deadBottom = results.filter((r) => (r.lowerThirdRatio || 0) < args.lowerThirdMin).length;
  const topHeavy = results.filter((r) => (r.totalContentRatio || 0) >= 0.02 && (r.centroidRatio || 1) < args.centroidMin).length;
  const centerLocked = results.filter((r) => (r.totalContentRatio || 0) >= 0.02 && (r.topOverAll || 0) > args.topHalfMax).length;
  const anyFail = results.filter((r) => !r.pass).length;
  const pct = (v) => ((v / results.length) * 100).toFixed(1);
  console.log("");
  console.log(`=== SUMMARY (n=${results.length}, bottom50≥${(args.threshold * 100).toFixed(0)}%, lower⅓≥${(args.lowerThirdMin * 100).toFixed(0)}%, centroidY≥${(args.centroidMin * 100).toFixed(0)}%, topHalf≤${(args.topHalfMax * 100).toFixed(0)}%) ===`);
  console.log(`bottom-dead (bot<5%):          ${dead5}/${results.length} = ${pct(dead5)}%`);
  console.log(`dead-bottom (l⅓<${(args.lowerThirdMin * 100).toFixed(0)}%):         ${deadBottom}/${results.length} = ${pct(deadBottom)}%`);
  console.log(`top-heavy   (centroidY<${(args.centroidMin * 100).toFixed(0)}%):   ${topHeavy}/${results.length} = ${pct(topHeavy)}%`);
  console.log(`center-lock (topHalf>${(args.topHalfMax * 100).toFixed(0)}%):      ${centerLocked}/${results.length} = ${pct(centerLocked)}%`);
  console.log(`any-fail (총 FAIL):              ${anyFail}/${results.length} = ${pct(anyFail)}%`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let paths = [];
  if (args.video) paths = await sampleFromVideo(args.video, args.sampleEvery, args.samples);
  else if (args.folder) paths = listImagesInFolder(args.folder);
  else if (args.positional.length > 0) paths = args.positional;
  else {
    console.error("Usage: validate-bottom-occupancy.js <img> | --folder <dir> | --video <mp4> [--subtitle-bar-ratio 0.148] [--threshold 0.20] [--summary]");
    process.exit(2);
  }
  const results = [];
  for (const p of paths) results.push(await validateImage(p, args));
  if (args.summary || paths.length > 3) summarize(results, args);
  const anyFail = results.some((r) => !r.pass);
  if (anyFail) {
    const n = results.filter((r) => !r.pass).length;
    console.error(`\n❌ [FAIL] ${n}/${results.length} 개 이미지 bottom occupancy < ${(args.threshold * 100).toFixed(0)}%.`);
    process.exit(1);
  }
  console.log(`\n✅ [PASS] ${results.length}개 이미지 bottom occupancy OK.`);
})();
