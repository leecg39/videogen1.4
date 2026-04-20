#!/usr/bin/env node
// validate-node-count.js — Scene Grammar 조건 ② 강제 (v1.1 ZERO-TOLERANCE)
//
// "의미 노드" 5~9개. 컨테이너(SceneRoot/Stack/Grid/Split/Absolute/
// RowStack/ColumnStack/FrameBox) + 순수 장식(AccentGlow/AmbientBackground/
// NoiseTexture/Gradient/Backplate/Spacer) 은 카운트에서 제외.
//
// v1.1 round 2 변경 (2026-04-18 guardrail audit round 2 반영):
//   - 10%/25% 완충 임계값 제거. 한 씬이라도 위반 시 exit 1.
//   - Hyperframes "한 개도 허용 안 함" 철학으로 통일.
//   - env bypass 경로 없음 — 쉘 export 한 줄로 무력화되는 게이트는 게이트가 아니다.
//     위반 씬은 재설계로만 해결.
//
// postprocess ⑥-za 로 삽입.

const fs = require("fs");

const EXCLUDE = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "Absolute", "RowStack", "ColumnStack",
  "Cluster", "Bento", "Flex", "FlexBox", "VerticalStack", "HorizontalStack",
  "FrameBox", "Overlay", "AnchorBox", "SafeArea", "ScatterLayout",
  "AccentGlow", "AccentRing", "AmbientBackground", "NoiseTexture", "Gradient",
  "Backplate", "Spacer", "Divider",
]);

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-node-count.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const under = [];
  const over = [];
  let total = 0;

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    let count = 0;
    walk(sc.stack_root, (n) => { if (n.type && !EXCLUDE.has(n.type)) count++; });
    total++;
    if (count > 9) over.push({ id: sc.id, count });
    if (count < 5) under.push({ id: sc.id, count });  // 너무 적은 것도 체크 (>=5 기본)
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 node-count 검증 (의미 노드 5~9개 권장)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${total}`);
  console.log(`  < 5 (희박): ${under.length}`);
  console.log(`  > 9 (과밀): ${over.length}`);

  // ZERO-TOLERANCE (v1.1 round 2). 한 씬이라도 위반하면 fail. bypass 없음.
  const failures = [];
  if (over.length > 0) {
    failures.push(`[FAIL:node-count:over] ${over.length}개 씬에서 의미 노드 > 9개 (zero-tolerance). 샘플: ${over.slice(0,5).map(x=>`${x.id}(${x.count})`).join(", ")}`);
  }
  if (under.length > 0) {
    failures.push(`[FAIL:node-count:under] ${under.length}개 씬에서 의미 노드 < 5개 (zero-tolerance). 샘플: ${under.slice(0,5).map(x=>`${x.id}(${x.count})`).join(", ")}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log(`✅ node-count 통과.`);
    process.exit(0);
  }
  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 node-count 위반:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  console.log("");
  console.log("해결: 과밀 씬은 분할, 희박 씬은 support 노드 추가 또는 인접 씬과 병합.");
  console.log("      (bypass 없음 — 재설계만이 유일한 경로.)");
  process.exit(1);
}

main();
