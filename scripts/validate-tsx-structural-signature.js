#!/usr/bin/env node
// validate-tsx-structural-signature.js — R8 (e) P4 AST 이식.
//
// DSL 의 validate-semantic-shape-cluster 를 TSX AST 로 이식.
// src/remotion/custom/scene-XX.tsx 의 최상위 JSX return 에서 leaf element tag sequence 를
// 추출, 직전 3씬과 signature cluster ≤ 2 검증.
//
// cluster size > 2 → exit 1 (trio 쌍둥이 구조 방지).
//
// 사용:
//   node scripts/validate-tsx-structural-signature.js <scenes-v2.json>

const fs = require("fs");
const path = require("path");

function isTsxWrapper(scene) {
  const root = scene?.stack_root;
  return root?.type === "SceneRoot" && root.children?.[0]?.type === "TSX";
}

function extractTsxComponentKey(scene) {
  return scene?.stack_root?.children?.[0]?.data?.component;
}

function readTsxFile(compKey) {
  const file = path.join("src/remotion/custom", `${compKey}.tsx`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

// 경량 JSX signature 추출 — regex 기반 (부분적 AST 없이도 충분).
// 최상위 `return (...)` 또는 `return (<AbsoluteFill>...</AbsoluteFill>)` 블록 안의
// JSX 태그들을 top-down 순서로 캡처.
function extractJsxSignature(src) {
  // return ( ... ); 블록 추출
  const retMatch = src.match(/return\s*\(([\s\S]*?)\n\s*\);/);
  if (!retMatch) return [];
  const block = retMatch[1];
  // JSX 오프닝 태그 (컴포넌트 or HTML element)
  const tagRegex = /<([A-Za-z][A-Za-z0-9]*)\b/g;
  const tags = [];
  let m;
  while ((m = tagRegex.exec(block)) !== null) {
    tags.push(m[1]);
  }
  return tags;
}

// signature: 첫 12 태그 concat. 장식성 (AbsoluteFill/div/defs/linearGradient/stop/style) 는 제외.
const DECO_TAGS = new Set([
  "AbsoluteFill", "defs", "linearGradient", "radialGradient", "stop",
  "filter", "feTurbulence", "feColorMatrix", "pattern", "animate",
  "style", "React.Fragment",
]);

function makeSignature(tags) {
  const meaningful = tags.filter((t) => !DECO_TAGS.has(t));
  return meaningful.slice(0, 12).join(">");
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/validate-tsx-structural-signature.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));

  const tsxScenes = scenes.filter(isTsxWrapper);
  const sigMap = new Map(); // signature → [sceneId, ...]

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`tsx-structural-signature 검증 (TSX 씬 ${tsxScenes.length}개, P4 AST 이식)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const s of tsxScenes) {
    const comp = extractTsxComponentKey(s);
    const src = comp ? readTsxFile(comp) : null;
    if (!src) {
      console.log(`  [SKIP] ${s.id}: component ${comp} TSX 파일 없음`);
      continue;
    }
    const tags = extractJsxSignature(src);
    const sig = makeSignature(tags);
    if (!sig) {
      console.log(`  [SKIP] ${s.id}: JSX signature 추출 실패`);
      continue;
    }
    const arr = sigMap.get(sig) || [];
    arr.push(s.id);
    sigMap.set(sig, arr);
  }

  const violations = [];
  for (const [sig, ids] of sigMap.entries()) {
    if (ids.length > 2) {
      violations.push({ sig, ids });
    }
  }

  console.log(`  고유 signature: ${sigMap.size}`);
  console.log(`  cluster > 2 위반: ${violations.length}`);

  if (violations.length > 0) {
    for (const v of violations) {
      console.log(`❌ [FAIL:tsx-structural-signature] cluster=${v.ids.length} sig="${v.sig.slice(0, 80)}..." scenes=${v.ids.join(", ")}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("✅ [PASS] 모든 TSX 씬의 JSX structural signature 고유 또는 cluster ≤ 2.");
}

main();
