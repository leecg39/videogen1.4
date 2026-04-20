#!/usr/bin/env node
// validate-rendered-node-presence.js — Scene Grammar v1.2 Goodhart 방지 게이트
//
// 목적:
//   validate-node-count.js 가 schema-level 에서 5~9 통과해도 실제 렌더에서 노드가 1~2 개로 줄어드는 현상 차단.
//   렌더 PNG 를 contrast mask + connected component 로 분해해서 "실제 보이는 시각 블록" 개수 측정.
//
// 알고리즘:
//   1. downsample 480x270 (빠른 처리)
//   2. luminance ≥ 0.18 pixel = foreground mask
//   3. morphological close (dilate 2px) 로 인접 텍스트/요소 병합
//   4. 4-연결 flood-fill 로 컴포넌트 카운트
//   5. min bbox area ≥ 0.003 * W*H (총 ≥ 388px @ 480x270) 컴포넌트만 집계
//   6. 카운트 < 5 이면 FAIL
//
// Modes:
//   node validate-rendered-node-presence.js <img>
//   node validate-rendered-node-presence.js --folder <dir>
//   공통 옵션: [--min 5] [--summary]
//
// exit 0: all pass | exit 1: any fail | exit 2: usage error

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DEFAULT_MIN = 5;
const DOWN_W = 480;
const DOWN_H = 270;
const LUM_TH = 0.18;           // foreground luminance threshold
const DILATE_PX = 2;           // morphological close
const MIN_AREA_RATIO = 0.003;  // 컴포넌트 최소 면적 = 전체 * 0.003

function parseArgs(argv) {
  const args = { positional: [], folder: null, min: DEFAULT_MIN, summary: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--min") args.min = parseInt(argv[++i], 10);
    else if (a === "--folder") args.folder = argv[++i];
    else if (a === "--summary") args.summary = true;
    else args.positional.push(a);
  }
  return args;
}

function makeMask(data, width, height, channels) {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const lum = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
      if (lum >= LUM_TH) mask[y * width + x] = 1;
    }
  }
  return mask;
}

// simple dilate by k pixels (manhattan)
function dilate(mask, width, height, k) {
  let cur = mask;
  for (let i = 0; i < k; i++) {
    const next = new Uint8Array(cur.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (cur[y * width + x]) { next[y * width + x] = 1; continue; }
        if (x > 0 && cur[y * width + (x - 1)]) { next[y * width + x] = 1; continue; }
        if (x < width - 1 && cur[y * width + (x + 1)]) { next[y * width + x] = 1; continue; }
        if (y > 0 && cur[(y - 1) * width + x]) { next[y * width + x] = 1; continue; }
        if (y < height - 1 && cur[(y + 1) * width + x]) { next[y * width + x] = 1; continue; }
      }
    }
    cur = next;
  }
  return cur;
}

// iterative flood fill, returns component count above area threshold
function countComponents(mask, width, height, minArea) {
  const visited = new Uint8Array(mask.length);
  const stack = [];
  let components = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx] || visited[idx]) continue;
      stack.length = 0;
      stack.push(idx);
      visited[idx] = 1;
      let area = 0;
      while (stack.length > 0) {
        const cur = stack.pop();
        area++;
        const cx = cur % width;
        const cy = Math.floor(cur / width);
        const neighbors = [
          cy > 0 ? cur - width : -1,
          cy < height - 1 ? cur + width : -1,
          cx > 0 ? cur - 1 : -1,
          cx < width - 1 ? cur + 1 : -1,
        ];
        for (const n of neighbors) {
          if (n < 0) continue;
          if (mask[n] && !visited[n]) { visited[n] = 1; stack.push(n); }
        }
      }
      if (area >= minArea) components++;
    }
  }
  return components;
}

async function measureComponents(imgPath) {
  const { data, info } = await sharp(imgPath)
    .resize(DOWN_W, DOWN_H, { fit: "fill" })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const mask = makeMask(data, info.width, info.height, info.channels);
  const closed = dilate(mask, info.width, info.height, DILATE_PX);
  const minArea = Math.round(info.width * info.height * MIN_AREA_RATIO);
  const components = countComponents(closed, info.width, info.height, minArea);
  return { components, minArea, width: info.width, height: info.height };
}

async function validateImage(imgPath, minCount) {
  if (!fs.existsSync(imgPath)) {
    console.error(`❌ [FAIL:rendered-node-presence] 부재: ${imgPath}`);
    return { path: imgPath, components: 0, pass: false };
  }
  try {
    const r = await measureComponents(imgPath);
    const pass = r.components >= minCount;
    if (pass) console.log(`✅ [PASS:rendered-node-presence] ${path.basename(imgPath)} components=${r.components}`);
    else console.error(`❌ [FAIL:rendered-node-presence] ${path.basename(imgPath)} components=${r.components} < ${minCount}`);
    return { path: imgPath, components: r.components, pass };
  } catch (err) {
    console.error(`❌ [FAIL:rendered-node-presence] ${path.basename(imgPath)} 처리 오류: ${err.message}`);
    return { path: imgPath, components: 0, pass: false };
  }
}

function listImagesInFolder(dir) {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  return fs.readdirSync(dir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(dir, f));
}

function summarize(results, minCount) {
  const nearEmpty = results.filter((r) => r.components <= 3).length;
  const fails = results.filter((r) => !r.pass).length;
  const pct = (v) => ((v / results.length) * 100).toFixed(1);
  console.log("");
  console.log(`=== SUMMARY (n=${results.length}, min=${minCount}) ===`);
  console.log(`components ≤ 3 (near-empty):  ${nearEmpty}/${results.length} = ${pct(nearEmpty)}%`);
  console.log(`components < ${minCount} (fails):       ${fails}/${results.length} = ${pct(fails)}%`);
  const worst = [...results].sort((a, b) => a.components - b.components).slice(0, 6);
  console.log(`worst 6: ${worst.map((r) => `${path.basename(r.path)}(${r.components})`).join(", ")}`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  let paths = [];
  if (args.folder) paths = listImagesInFolder(args.folder);
  else if (args.positional.length > 0) paths = args.positional;
  else {
    console.error("Usage: validate-rendered-node-presence.js <img> | --folder <dir> [--min 5] [--summary]");
    process.exit(2);
  }
  const results = [];
  for (const p of paths) results.push(await validateImage(p, args.min));
  if (args.summary || paths.length > 3) summarize(results, args.min);
  const anyFail = results.some((r) => !r.pass);
  if (anyFail) {
    const n = results.filter((r) => !r.pass).length;
    console.error(`\n❌ [FAIL] ${n}/${results.length} 개 이미지 components < ${args.min}.`);
    process.exit(1);
  }
  console.log(`\n✅ [PASS] ${results.length}개 이미지 모두 components ≥ ${args.min}.`);
})();
