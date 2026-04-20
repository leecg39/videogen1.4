#!/usr/bin/env node
// validate-semantic-shape-cluster.js — Scene Grammar v1.2 픽셀 게이트 P4 (v1.2.1 엄격화)
//
// v1.2 → v1.2.1 변경 (2026-04-19 오른쪽 페인 평가 Q3 답):
//   - signature 에서 pattern_ref / data.value / data.text 제외. **leaf type tuple 만** 비교.
//   - 추가 시그널: trio-pattern 감지 (동일 타입 leaf 가 ≥ 3개 반복되는 구조) — f022↔f068 같은 trio-gauge 쌍둥이 포착.
//   - 글로벌 윈도우: 직전 3 → 직전 10 확장. 영상 전체에서 거리 46씬 떨어진 쌍둥이도 포착.
//   - clusterMax 기본: 2 → 1 (직전 10 씬 내 동일 signature ≤ 1 허용).
//
// Usage:
//   node scripts/validate-semantic-shape-cluster.js <scenes-v2.json> [--scene N] [--window 10] [--cluster-max 1] [--global-max 3]
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");

const DEFAULT_WINDOW = 10;         // 직전 3 → 직전 10
const DEFAULT_CLUSTER_MAX = 1;     // 윈도우 내 동일 signature 최대 (self 제외)
const DEFAULT_GLOBAL_MAX = 3;      // 전체 영상 내 동일 signature 최대
const TRIO_PATTERN_GLOBAL_MAX = 2; // trio-pattern 전역 최대 (3-gauge, 3-table, 3-card 등)

const CONTAINER_TYPES = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "Absolute", "FrameBox", "Overlay", "SafeArea",
  "AnchorBox", "ScatterLayout",
]);
const DECO_TYPES = new Set([
  "AccentGlow", "AmbientBackground", "RotatingRingMotif", "GridLineMotif",
  "Background", "ScenePattern",
]);

// leaf type = 의미 노드 타입 (컨테이너/장식 제외)
function collectLeafTypes(node, out = []) {
  if (!node || typeof node !== "object") return out;
  const t = node.type;
  if (t && !CONTAINER_TYPES.has(t) && !DECO_TYPES.has(t)) out.push(t);
  if (Array.isArray(node.children)) for (const c of node.children) collectLeafTypes(c, out);
  return out;
}

// 제안 A: data.value/text 완전 제외하고 leaf type tuple 만 비교 (순서 유지)
function leafTypeTuple(scene) {
  const leaves = collectLeafTypes(scene.stack_root || {});
  return leaves.join(">");
}

// 제안 B: trio-pattern = 동일 타입이 ≥ 3회 연속 또는 non-연속으로 발생하는 구조
// 예) RingChart x 3 (f022/f068 의 "3-gauge trio"), DataTable-row x 3, IconCard x 3
function detectTrioPatterns(scene) {
  const leaves = collectLeafTypes(scene.stack_root || {});
  const counts = new Map();
  for (const t of leaves) counts.set(t, (counts.get(t) || 0) + 1);
  const trios = [];
  for (const [t, c] of counts.entries()) if (c >= 3) trios.push(`trio:${t}x${c}`);
  return trios.sort();
}

// composite signature = leaf type tuple + trio patterns
function sceneSignature(scene) {
  const tuple = leafTypeTuple(scene);
  const trios = detectTrioPatterns(scene);
  return { tuple, trios, combined: `${tuple}||${trios.join(",")}` };
}

function parseArgs(argv) {
  const args = {
    positional: [],
    scene: null,
    window: DEFAULT_WINDOW,
    clusterMax: DEFAULT_CLUSTER_MAX,
    globalMax: DEFAULT_GLOBAL_MAX,
    trioGlobalMax: TRIO_PATTERN_GLOBAL_MAX,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--scene") args.scene = parseInt(argv[++i], 10);
    else if (a === "--window") args.window = parseInt(argv[++i], 10);
    else if (a === "--cluster-max") args.clusterMax = parseInt(argv[++i], 10);
    else if (a === "--global-max") args.globalMax = parseInt(argv[++i], 10);
    else if (a === "--trio-global-max") args.trioGlobalMax = parseInt(argv[++i], 10);
    else if (a === "--verbose") args.verbose = true;
    else args.positional.push(a);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.positional.length === 0) {
    console.error("Usage: validate-semantic-shape-cluster.js <scenes-v2.json> [--scene N] [--window 10] [--cluster-max 1] [--global-max 3]");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(args.positional[0], "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const sigs = scenes.map(sceneSignature);

  if (args.verbose) {
    console.log("--- signatures ---");
    scenes.forEach((s, i) => console.log(`${s.id || i}: ${sigs[i].combined}`));
  }

  const fails = [];

  // 1) window 내 동일 tuple 검사
  for (let i = 0; i < scenes.length; i++) {
    if (args.scene != null && i !== args.scene) continue;
    const wStart = Math.max(0, i - args.window);
    const within = sigs.slice(wStart, i);
    const matches = within.filter((s) => s.tuple === sigs[i].tuple && s.tuple.length > 0);
    if (matches.length > args.clusterMax) {
      fails.push({
        kind: "window-tuple",
        scene: scenes[i].id || `scene-${i}`,
        tuple: sigs[i].tuple,
        clusterInWindow: matches.length + 1,
        window: within.length,
      });
    }
  }

  if (args.scene == null) {
    // 2) global tuple cluster
    const counts = new Map();
    sigs.forEach((sig, i) => {
      if (!sig.tuple) return;
      if (!counts.has(sig.tuple)) counts.set(sig.tuple, []);
      counts.get(sig.tuple).push(scenes[i].id || `scene-${i}`);
    });
    for (const [tuple, ids] of counts.entries()) {
      if (ids.length > args.globalMax) {
        fails.push({ kind: "global-tuple", tuple, count: ids.length, scenes: ids });
      }
    }

    // 3) trio-pattern global cluster (f022/f068 포착 핵심)
    const trioCounts = new Map();
    sigs.forEach((sig, i) => {
      for (const trio of sig.trios) {
        if (!trioCounts.has(trio)) trioCounts.set(trio, []);
        trioCounts.get(trio).push(scenes[i].id || `scene-${i}`);
      }
    });
    for (const [trio, ids] of trioCounts.entries()) {
      if (ids.length > args.trioGlobalMax) {
        fails.push({ kind: "trio-global", trio, count: ids.length, scenes: ids });
      }
    }
  }

  if (fails.length > 0) {
    for (const f of fails) {
      if (f.kind === "window-tuple") {
        console.error(`❌ [FAIL:semantic-shape-cluster-window] ${f.scene} 직전 ${f.window}씬 중 ${f.clusterInWindow}개 동일 tuple="${f.tuple}" (max=${args.clusterMax})`);
      } else if (f.kind === "global-tuple") {
        console.error(`❌ [FAIL:semantic-shape-cluster-global] tuple="${f.tuple}" count=${f.count} (max=${args.globalMax}) scenes=${f.scenes.slice(0, 8).join(", ")}${f.scenes.length > 8 ? ", ..." : ""}`);
      } else if (f.kind === "trio-global") {
        console.error(`❌ [FAIL:semantic-shape-cluster-trio] pattern="${f.trio}" count=${f.count} (max=${args.trioGlobalMax}) scenes=${f.scenes.slice(0, 8).join(", ")}${f.scenes.length > 8 ? ", ..." : ""}`);
      }
    }
    process.exit(1);
  }
  console.log(`✅ [PASS:semantic-shape-cluster] window=${args.window} tuple cluster-max=${args.clusterMax} global-max=${args.globalMax} trio-global-max=${args.trioGlobalMax} — ${scenes.length}개 씬 OK`);
}

main();
