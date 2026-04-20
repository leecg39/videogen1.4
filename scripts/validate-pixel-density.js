#!/usr/bin/env node
// validate-pixel-density.js — Scene Grammar v1.2 픽셀 게이트 P1
//
// 규칙:
//   - PNG/JPG 의 non-empty pixel ratio 가 ≥ 15% 여야 한다.
//   - non-empty 정의: luminance ≥ 0.06 픽셀 (어두운 바이올렛 틴트 배경 제외).
//   - 기본 임계치 15%. 35.4% near-empty 프레임 (vibe-news-0407) 차단 목적.
//
// Modes:
//   (1) 단일 이미지:   node validate-pixel-density.js <png|jpg>
//   (2) 폴더 배치:     node validate-pixel-density.js --folder <dir>
//   (3) mp4 N초 샘플:  node validate-pixel-density.js --video <mp4> [--sample-every 5 | --samples 3]
//   공통 옵션:        [--threshold 0.15] [--summary]
//
// exit 0: all pass | exit 1: any fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const sharp = require("sharp");
const os = require("os");

const DEFAULT_THRESHOLD = 0.15;

function parseArgs(argv) {
  const args = {
    positional: [],
    threshold: DEFAULT_THRESHOLD,
    video: null,
    folder: null,
    sampleEvery: null,
    samples: null,
    summary: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--threshold") args.threshold = parseFloat(argv[++i]);
    else if (a === "--video") args.video = argv[++i];
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--sample-every") args.sampleEvery = parseFloat(argv[++i]);
    else if (a === "--samples") args.samples = parseInt(argv[++i], 10);
    else if (a === "--summary") args.summary = true;
    else args.positional.push(a);
  }
  return args;
}

function isBackgroundPixel(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.06;
}

async function measureDensity(imgPath) {
  const { data, info } = await sharp(imgPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let contentPixels = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += channels) {
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2])) contentPixels++;
  }
  return { ratio: contentPixels / total, width, height };
}

async function validateImage(imgPath, threshold) {
  if (!fs.existsSync(imgPath)) {
    console.error(`❌ [FAIL:pixel-density] 부재: ${imgPath}`);
    return { path: imgPath, ratio: 0, pass: false };
  }
  try {
    const r = await measureDensity(imgPath);
    const pct = (r.ratio * 100).toFixed(2);
    const pass = r.ratio >= threshold;
    if (pass) console.log(`✅ [PASS:pixel-density] ${path.basename(imgPath)} density=${pct}%`);
    else console.error(`❌ [FAIL:pixel-density] ${path.basename(imgPath)} density=${pct}% < ${(threshold * 100).toFixed(0)}%`);
    return { path: imgPath, ratio: r.ratio, pass };
  } catch (err) {
    console.error(`❌ [FAIL:pixel-density] ${path.basename(imgPath)} 처리 오류: ${err.message}`);
    return { path: imgPath, ratio: 0, pass: false };
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
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", mp4,
  ]).toString().trim();
  return parseFloat(out);
}

async function sampleFromVideo(mp4, sampleEvery, samples) {
  if (!fs.existsSync(mp4)) throw new Error(`mp4 부재: ${mp4}`);
  const dur = getDurationSec(mp4);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "px-density-"));
  const paths = [];
  let times = [];
  if (sampleEvery && sampleEvery > 0) {
    for (let t = sampleEvery / 2; t < dur; t += sampleEvery) times.push(t);
  } else if (samples && samples > 0) {
    for (let i = 0; i < samples; i++) times.push((dur * (i + 1)) / (samples + 1));
  } else {
    times = [dur * 0.25, dur * 0.5, dur * 0.75];
  }
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const out = path.join(tmp, `s-${i.toString().padStart(4, "0")}-t${t.toFixed(1)}.png`);
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", t.toFixed(3), "-i", mp4, "-vframes", "1", out]);
    paths.push(out);
  }
  return paths;
}

function summarize(results, threshold) {
  const nearEmpty = results.filter((r) => r.ratio < 0.03).length;
  const belowThreshold = results.filter((r) => !r.pass).length;
  const pct = (v) => ((v / results.length) * 100).toFixed(1);
  console.log("");
  console.log(`=== SUMMARY (n=${results.length}, threshold=${(threshold * 100).toFixed(0)}%) ===`);
  console.log(`near-empty (density < 3%): ${nearEmpty}/${results.length} = ${pct(nearEmpty)}%`);
  console.log(`below threshold:            ${belowThreshold}/${results.length} = ${pct(belowThreshold)}%`);
  const top = [...results].sort((a, b) => a.ratio - b.ratio).slice(0, 6);
  console.log(`worst 6: ${top.map((r) => `${path.basename(r.path)}(${(r.ratio * 100).toFixed(1)}%)`).join(", ")}`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let paths = [];
  if (args.video) paths = await sampleFromVideo(args.video, args.sampleEvery, args.samples);
  else if (args.folder) paths = listImagesInFolder(args.folder);
  else if (args.positional.length > 0) paths = args.positional;
  else {
    console.error("Usage: validate-pixel-density.js <img> | --folder <dir> | --video <mp4> [--sample-every S|--samples N] [--threshold 0.15] [--summary]");
    process.exit(2);
  }
  const results = [];
  for (const p of paths) results.push(await validateImage(p, args.threshold));
  if (args.summary || paths.length > 3) summarize(results, args.threshold);
  const anyFail = results.some((r) => !r.pass);
  if (anyFail) {
    const n = results.filter((r) => !r.pass).length;
    console.error(`\n❌ [FAIL] ${n}/${results.length} 개 이미지 density < ${(args.threshold * 100).toFixed(0)}%.`);
    process.exit(1);
  }
  console.log(`\n✅ [PASS] ${results.length}개 이미지 모두 density ≥ ${(args.threshold * 100).toFixed(0)}%.`);
})();
