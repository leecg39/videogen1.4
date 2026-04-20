#!/usr/bin/env node
// validate-color-hierarchy.js — Scene Grammar v1.2.2 신규
//
// 목적:
//   감사 "민트 단색 97%" 차단. 씬당 의미 컬러 위계 ≥ 2 강제.
//   영상 전체 프레임 중 mint/cyan hue 외 의미 accent (yellow/red/blue/purple) 비율이 낮으면 FAIL.
//
// 알고리즘:
//   1. downsample 240×135
//   2. 각 pixel 을 HSV 로 변환. S ≥ 0.35, V ≥ 0.35 인 "채도 있는" 픽셀만 집계.
//   3. hue bucket (30° 간격, 12개) 별 pixel 수 집계.
//   4. 프레임 전체에서 dominant bucket (mint ≈ 140-160°) 외 다른 bucket 에도 pixel ≥ 1% 있어야 함.
//   5. unique hue bucket count (의미 채도 픽셀 기준) ≥ 2 인 프레임 비율 ≥ 70%.
//   6. 기준 미달 시 FAIL.
//
// v1.2.3 변경:
//   --mode dominance: 단일 vivid hue bucket 이 전체 vivid pixel 의 > 80% 차지 시 FAIL.
//                     감사 "민트 단색 97%" 재현용 (dominance 기준).
//
// Modes:
//   node validate-color-hierarchy.js <img> [--min-hues 2]
//   node validate-color-hierarchy.js --folder <dir> [--mode presence|dominance] [--min-hues 2] [--dominance-max 0.80] [--pass-ratio 0.70] [--summary]
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DEFAULT_MIN_HUES = 2;
const DEFAULT_PASS_RATIO = 0.70;
const DEFAULT_DOMINANCE_MAX = 0.80;
const DOWN_W = 240, DOWN_H = 135;
const SAT_MIN = 0.35;
const VAL_MIN = 0.35;
const BUCKET_SIZE = 30; // 12 buckets

function parseArgs(argv) {
  const args = {
    positional: [], folder: null, minHues: DEFAULT_MIN_HUES, passRatio: DEFAULT_PASS_RATIO,
    dominanceMax: DEFAULT_DOMINANCE_MAX, mode: "presence", summary: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--min-hues") args.minHues = parseInt(argv[++i], 10);
    else if (a === "--pass-ratio") args.passRatio = parseFloat(argv[++i]);
    else if (a === "--dominance-max") args.dominanceMax = parseFloat(argv[++i]);
    else if (a === "--mode") args.mode = argv[++i];
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--summary") args.summary = true;
    else args.positional.push(a);
  }
  return args;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

async function measureHues(imgPath) {
  const { data, info } = await sharp(imgPath).resize(DOWN_W, DOWN_H, { fit: "fill" }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const buckets = new Array(Math.ceil(360 / BUCKET_SIZE)).fill(0);
  let vivid = 0, total = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    if (s >= SAT_MIN && v >= VAL_MIN) {
      vivid++;
      buckets[Math.floor(h / BUCKET_SIZE) % buckets.length]++;
    }
  }
  const active = buckets.map((c, idx) => ({ hueStart: idx * BUCKET_SIZE, count: c, ratio: c / total }))
    .filter((b) => b.ratio >= 0.01)
    .sort((a, b) => b.count - a.count);
  // dominance = 가장 큰 bucket 의 vivid 대비 비율
  const dominantRatio = vivid > 0 ? (buckets.reduce((m, c) => Math.max(m, c), 0) / vivid) : 0;
  return { buckets: active, vividRatio: vivid / total, dominantRatio };
}

async function validateImage(imgPath, args) {
  if (!fs.existsSync(imgPath)) {
    console.error(`❌ [FAIL:color-hierarchy] 부재: ${imgPath}`);
    return { path: imgPath, hues: 0, dominantRatio: 1, pass: false };
  }
  try {
    const r = await measureHues(imgPath);
    const hues = r.buckets.length;
    const nearEmpty = r.vividRatio < 0.01;

    let pass = true;
    const reasons = [];
    if (args.mode === "dominance") {
      if (!nearEmpty && r.dominantRatio > args.dominanceMax) {
        pass = false;
        reasons.push(`dominant=${(r.dominantRatio * 100).toFixed(1)}%>${(args.dominanceMax * 100).toFixed(0)}%`);
      }
    } else {
      if (!nearEmpty && hues < args.minHues) {
        pass = false;
        reasons.push(`hues=${hues}<${args.minHues}`);
      }
    }
    if (pass) {
      console.log(`✅ [PASS:color-hierarchy] ${path.basename(imgPath)} hues=${hues} vivid=${(r.vividRatio * 100).toFixed(1)}% dominant=${(r.dominantRatio * 100).toFixed(0)}%`);
    } else {
      const topStr = r.buckets.slice(0, 3).map((b) => `${b.hueStart}°(${(b.ratio * 100).toFixed(1)}%)`).join(",");
      console.error(`❌ [FAIL:color-hierarchy] ${path.basename(imgPath)} ${reasons.join(" | ")} top=${topStr}`);
    }
    return { path: imgPath, hues, vividRatio: r.vividRatio, dominantRatio: r.dominantRatio, pass };
  } catch (err) {
    console.error(`❌ [FAIL:color-hierarchy] ${path.basename(imgPath)} 처리 오류: ${err.message}`);
    return { path: imgPath, hues: 0, dominantRatio: 1, pass: false };
  }
}

function listImagesInFolder(dir) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  return fs.readdirSync(dir).filter((f) => exts.has(path.extname(f).toLowerCase())).sort().map((f) => path.join(dir, f));
}

function summarize(results, args) {
  const bad = results.filter((r) => !r.pass).length;
  const monochrome = results.filter((r) => r.hues === 1).length;
  const dominant = results.filter((r) => (r.dominantRatio || 0) > args.dominanceMax && (r.vividRatio || 0) >= 0.01).length;
  const pct = (v) => ((v / results.length) * 100).toFixed(1);
  console.log("");
  console.log(`=== SUMMARY (n=${results.length}, mode=${args.mode}) ===`);
  console.log(`single hue (presence, hues=1):    ${monochrome}/${results.length} = ${pct(monochrome)}%`);
  console.log(`dominant (dominantRatio>${(args.dominanceMax * 100).toFixed(0)}%): ${dominant}/${results.length} = ${pct(dominant)}%`);
  console.log(`below minimum:                     ${bad}/${results.length} = ${pct(bad)}%`);
  console.log(`pass rate:                         ${((results.length - bad) / results.length * 100).toFixed(1)}%`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let paths = [];
  if (args.folder) paths = listImagesInFolder(args.folder);
  else if (args.positional.length > 0) paths = args.positional;
  else {
    console.error("Usage: validate-color-hierarchy.js <img> | --folder <dir> [--min-hues 2] [--pass-ratio 0.70] [--summary]");
    process.exit(2);
  }
  const results = [];
  for (const p of paths) results.push(await validateImage(p, args));
  if (args.summary || paths.length > 3) summarize(results, args);
  const passCount = results.filter((r) => r.pass).length;
  const passRate = passCount / results.length;
  if (paths.length > 1) {
    if (passRate < args.passRatio) {
      console.error(`\n❌ [FAIL] pass rate ${(passRate * 100).toFixed(1)}% < ${(args.passRatio * 100).toFixed(0)}% (min-hues ≥ ${args.minHues}).`);
      process.exit(1);
    }
    console.log(`\n✅ [PASS] pass rate ${(passRate * 100).toFixed(1)}% ≥ ${(args.passRatio * 100).toFixed(0)}%.`);
  } else if (!results[0].pass) {
    process.exit(1);
  }
})();
