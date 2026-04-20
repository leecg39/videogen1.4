#!/usr/bin/env node
// validate-opening-hook.js — Scene Grammar v1.2.2 신규
//
// 목적:
//   영상 오프닝 3초 (90f @ 30fps) 의 density 가 충분하지 않으면 "지루한 시작" — 시청자 이탈.
//   f001 빈 배지만 있는 오프닝 차단 (감사 지적).
//
// 규칙:
//   - 첫 3초 (default) 동안 매 0.5초(15f) 샘플한 PNG 의 평균 pixel density ≥ 0.50
//   - OR 첫 씬 scenes[0] 의 preview PNG density ≥ 0.50
//   - OR 폴더 모드에서 첫 N 개 이미지 평균 density ≥ 0.50
//
// Modes:
//   (1) scenes-v2.json 의 첫 씬 preview:
//       node validate-opening-hook.js --scenes data/{pid}/scenes-v2.json --preview-dir output/preview
//   (2) mp4 첫 3초 샘플:
//       node validate-opening-hook.js --video output/{pid}.mp4
//   (3) 폴더 첫 N 개 이미지 평균:
//       node validate-opening-hook.js --folder /tmp/vibe-frames --first-n 9
//   공통: [--min-density 0.50] [--window-sec 3.0]
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const sharp = require("sharp");
const os = require("os");

const DEFAULT_MIN_DENSITY = 0.50;
const DEFAULT_WINDOW_SEC = 3.0;
const DEFAULT_SAMPLE_INTERVAL_SEC = 0.5;

function parseArgs(argv) {
  const args = {
    positional: [],
    scenes: null,
    previewDir: null,
    video: null,
    folder: null,
    firstN: 9,
    minDensity: DEFAULT_MIN_DENSITY,
    windowSec: DEFAULT_WINDOW_SEC,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--scenes") args.scenes = argv[++i];
    else if (a === "--preview-dir") args.previewDir = argv[++i];
    else if (a === "--video") args.video = argv[++i];
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--first-n") args.firstN = parseInt(argv[++i], 10);
    else if (a === "--min-density") args.minDensity = parseFloat(argv[++i]);
    else if (a === "--window-sec") args.windowSec = parseFloat(argv[++i]);
    else args.positional.push(a);
  }
  return args;
}

function isBackgroundPixel(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.06;
}

async function density(imgPath) {
  const { data, info } = await sharp(imgPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  let content = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2])) content++;
  }
  return content / (info.width * info.height);
}

async function validateFolderMode(args) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  const files = fs.readdirSync(args.folder).filter((f) => exts.has(path.extname(f).toLowerCase())).sort().slice(0, args.firstN);
  if (files.length === 0) {
    console.error(`[FAIL:opening-hook] 폴더 비어있음: ${args.folder}`);
    return false;
  }
  let sum = 0;
  const detail = [];
  for (const f of files) {
    const d = await density(path.join(args.folder, f));
    sum += d;
    detail.push(`${f}:${(d * 100).toFixed(1)}%`);
  }
  const avg = sum / files.length;
  if (avg < args.minDensity) {
    console.error(`❌ [FAIL:opening-hook] 첫 ${files.length}개 평균 density=${(avg * 100).toFixed(1)}% < ${(args.minDensity * 100).toFixed(0)}%`);
    console.error(`  ${detail.join(" ")}`);
    return false;
  }
  console.log(`✅ [PASS:opening-hook] 첫 ${files.length}개 평균 density=${(avg * 100).toFixed(1)}%`);
  return true;
}

async function validateVideoMode(args) {
  const dur = parseFloat(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", args.video,
  ]).toString().trim());
  const windowEnd = Math.min(args.windowSec, dur);
  const times = [];
  for (let t = DEFAULT_SAMPLE_INTERVAL_SEC / 2; t < windowEnd; t += DEFAULT_SAMPLE_INTERVAL_SEC) times.push(t);
  if (times.length === 0) times.push(windowEnd / 2);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "open-hook-"));
  let sum = 0;
  const detail = [];
  for (let i = 0; i < times.length; i++) {
    const out = path.join(tmp, `t${times[i].toFixed(2)}.png`);
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", times[i].toFixed(3), "-i", args.video, "-vframes", "1", out]);
    const d = await density(out);
    sum += d;
    detail.push(`t=${times[i].toFixed(1)}s:${(d * 100).toFixed(1)}%`);
  }
  const avg = sum / times.length;
  if (avg < args.minDensity) {
    console.error(`❌ [FAIL:opening-hook] mp4 첫 ${args.windowSec}s 평균 density=${(avg * 100).toFixed(1)}% < ${(args.minDensity * 100).toFixed(0)}%`);
    console.error(`  ${detail.join(" ")}`);
    return false;
  }
  console.log(`✅ [PASS:opening-hook] mp4 첫 ${args.windowSec}s 평균 density=${(avg * 100).toFixed(1)}%`);
  return true;
}

async function validateScenesMode(args) {
  const raw = JSON.parse(fs.readFileSync(args.scenes, "utf8"));
  const scenes = Array.isArray(raw) ? raw : (raw.scenes || []);
  const firstScene = scenes[0];
  if (!firstScene) {
    console.error(`[FAIL:opening-hook] scenes 비어있음`);
    return false;
  }
  const pid = firstScene.project_id || path.basename(path.dirname(args.scenes));
  const previewPath = args.previewDir
    ? path.join(args.previewDir, `${pid}-scene-0-hero.png`)
    : path.join(path.dirname(args.scenes), "..", "..", "output", "preview", `${pid}-scene-0-hero.png`);
  if (!fs.existsSync(previewPath)) {
    console.error(`[FAIL:opening-hook] preview PNG 부재: ${previewPath} (vg-preview-still 먼저 실행)`);
    return false;
  }
  const d = await density(previewPath);
  if (d < args.minDensity) {
    console.error(`❌ [FAIL:opening-hook] scene-0 preview density=${(d * 100).toFixed(1)}% < ${(args.minDensity * 100).toFixed(0)}%`);
    return false;
  }
  console.log(`✅ [PASS:opening-hook] scene-0 preview density=${(d * 100).toFixed(1)}%`);
  return true;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let ok = false;
  if (args.video) ok = await validateVideoMode(args);
  else if (args.folder) ok = await validateFolderMode(args);
  else if (args.scenes) ok = await validateScenesMode(args);
  else {
    console.error("Usage: validate-opening-hook.js --video <mp4> | --folder <dir> --first-n N | --scenes <scenes-v2.json> --preview-dir <dir>");
    process.exit(2);
  }
  process.exit(ok ? 0 : 1);
})();
