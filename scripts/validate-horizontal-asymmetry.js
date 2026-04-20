#!/usr/bin/env node
// validate-horizontal-asymmetry.js — Scene Grammar v1.2.3 신규 (오른쪽 페인 가설 B 채택)
//
// 목적:
//   감사 "73% center-locked" 의 가로 편향 차단.
//   화면 좌우 중앙 ±10% (40% ~ 60%) 영역에 content 가 > 60% 몰려있으면 FAIL.
//   HF 철학 "비대칭 기본" 강제.
//
// 알고리즘:
//   1. content mask 생성 (luminance ≥ 0.06)
//   2. x 방향으로 content 픽셀 히스토그램
//   3. center strip (x ∈ [0.40*W, 0.60*W]) 의 content 비율 계산 = cl-ratio
//   4. cl-ratio > 0.60 이면 center-locked FAIL
//   5. 추가: centroid X 가 |0.5 - cx/W| < 0.05 이고 전체 content 가 세로 중앙 ± 20% 에 몰리면 double-locked
//
// Modes:
//   node validate-horizontal-asymmetry.js <img>
//   node validate-horizontal-asymmetry.js --folder <dir> [--center-max 0.60] [--summary]
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DEFAULT_CENTER_MAX = 0.60;
const CENTER_STRIP_LEFT = 0.40;
const CENTER_STRIP_RIGHT = 0.60;
const CENTROID_DEAD_BAND = 0.05;

function parseArgs(argv) {
  const args = { positional: [], folder: null, centerMax: DEFAULT_CENTER_MAX, summary: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--center-max") args.centerMax = parseFloat(argv[++i]);
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--summary") args.summary = true;
    else args.positional.push(a);
  }
  return args;
}

function isContent(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum >= 0.06;
}

async function measureAsymmetry(imgPath) {
  const { data, info } = await sharp(imgPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const xStart = Math.floor(width * CENTER_STRIP_LEFT);
  const xEnd = Math.floor(width * CENTER_STRIP_RIGHT);
  let totalContent = 0, centerContent = 0, weightedX = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (isContent(data[idx], data[idx + 1], data[idx + 2])) {
        totalContent++;
        weightedX += x;
        if (x >= xStart && x < xEnd) centerContent++;
      }
    }
  }
  const centerRatio = totalContent > 0 ? centerContent / totalContent : 0;
  const centroidX = totalContent > 0 ? weightedX / totalContent / width : 0.5;
  const centroidDeviation = Math.abs(centroidX - 0.5);
  return { centerRatio, centroidX, centroidDeviation, totalContent, width, height };
}

async function validateImage(imgPath, args) {
  if (!fs.existsSync(imgPath)) {
    console.error(`❌ [FAIL:horizontal-asymmetry] 부재: ${imgPath}`);
    return { path: imgPath, centerRatio: 0, pass: false };
  }
  try {
    const r = await measureAsymmetry(imgPath);
    const meaningful = r.totalContent > 100;
    const centerFail = meaningful && r.centerRatio > args.centerMax;
    const balanceFail = meaningful && r.centroidDeviation < CENTROID_DEAD_BAND && r.centerRatio > 0.50;
    const pass = !(centerFail || balanceFail);
    if (pass) {
      console.log(`✅ [PASS:horizontal-asymmetry] ${path.basename(imgPath)} centerStrip=${(r.centerRatio * 100).toFixed(1)}% centroidDev=${(r.centroidDeviation * 100).toFixed(1)}%`);
    } else {
      const reasons = [];
      if (centerFail) reasons.push(`centerStrip=${(r.centerRatio * 100).toFixed(1)}%>${(args.centerMax * 100).toFixed(0)}%`);
      if (balanceFail) reasons.push(`centroidDev=${(r.centroidDeviation * 100).toFixed(1)}%<5%(dead-center)`);
      console.error(`❌ [FAIL:horizontal-asymmetry] ${path.basename(imgPath)} ${reasons.join(" | ")}`);
    }
    return { path: imgPath, centerRatio: r.centerRatio, centroidDeviation: r.centroidDeviation, pass };
  } catch (err) {
    console.error(`❌ [FAIL:horizontal-asymmetry] ${path.basename(imgPath)} 처리 오류: ${err.message}`);
    return { path: imgPath, centerRatio: 0, pass: false };
  }
}

function listImagesInFolder(dir) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  return fs.readdirSync(dir).filter((f) => exts.has(path.extname(f).toLowerCase())).sort().map((f) => path.join(dir, f));
}

function summarize(results, args) {
  const centerLocked = results.filter((r) => r.centerRatio > args.centerMax).length;
  const deadCenter = results.filter((r) => r.centroidDeviation < CENTROID_DEAD_BAND && r.centerRatio > 0.50).length;
  const fail = results.filter((r) => !r.pass).length;
  const pct = (v) => ((v / results.length) * 100).toFixed(1);
  console.log("");
  console.log(`=== SUMMARY (n=${results.length}, center-max=${(args.centerMax * 100).toFixed(0)}%) ===`);
  console.log(`center-locked (centerStrip>${(args.centerMax * 100).toFixed(0)}%): ${centerLocked}/${results.length} = ${pct(centerLocked)}%`);
  console.log(`dead-center   (centroidDev<5% & centerStrip>50%): ${deadCenter}/${results.length} = ${pct(deadCenter)}%`);
  console.log(`fail:                                             ${fail}/${results.length} = ${pct(fail)}%`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let paths = [];
  if (args.folder) paths = listImagesInFolder(args.folder);
  else if (args.positional.length > 0) paths = args.positional;
  else {
    console.error("Usage: validate-horizontal-asymmetry.js <img> | --folder <dir> [--center-max 0.60]");
    process.exit(2);
  }
  const results = [];
  for (const p of paths) results.push(await validateImage(p, args));
  if (args.summary || paths.length > 3) summarize(results, args);
  if (results.some((r) => !r.pass)) {
    const n = results.filter((r) => !r.pass).length;
    console.error(`\n❌ [FAIL] ${n}/${results.length} 개 이미지 center-locked.`);
    process.exit(1);
  }
  console.log(`\n✅ [PASS] ${results.length}개 이미지 모두 pass.`);
})();
