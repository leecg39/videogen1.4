#!/usr/bin/env node
// validate-phase-separation.js — HARD GATE: Phase A/B 분리 강제
//
// scene-grammar.md Section 2: Phase A (레이아웃만) → vg-preview-still → Phase B (모션).
// scene.phase === "A" 인데 stack_root 의 어떤 노드라도 motion props 가 있으면 exit 1.
// scene.phase === "B" 거나 미지정은 통과.
//
// postprocess.sh ⑥-g 로 삽입.

const fs = require("fs");

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) {
    kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
  }
}

function hasMotionProps(node) {
  const m = node.motion;
  if (!m || typeof m !== "object") return false;
  // motion 객체에 실제 값이 있는지 (빈 {} 은 허용)
  const keys = Object.keys(m).filter((k) => m[k] !== null && m[k] !== undefined);
  return keys.length > 0;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-phase-separation.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const violations = [];
  let phaseAScenes = 0;
  let phaseBScenes = 0;
  let unsetScenes = 0;

  for (const sc of scenes) {
    if (sc.phase === "A") phaseAScenes++;
    else if (sc.phase === "B") phaseBScenes++;
    else unsetScenes++;

    if (sc.phase !== "A") continue;
    if (!sc.stack_root) continue;

    const offending = [];
    walk(sc.stack_root, (n, path) => {
      if (hasMotionProps(n)) {
        const loc = [...path, n.type || "?"].join(">");
        const props = Object.keys(n.motion || {}).filter((k) => n.motion[k] != null);
        offending.push(`${loc}:{${props.join(",")}}`);
      }
    });

    if (offending.length > 0) {
      violations.push({ id: sc.id, count: offending.length, sample: offending.slice(0, 3) });
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 phase separation 검증 (Phase A = motion 금지)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Phase A 씬: ${phaseAScenes}`);
  console.log(`  Phase B 씬: ${phaseBScenes}`);
  console.log(`  phase 미지정 씬 (검사 생략): ${unsetScenes}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ phase separation 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] Phase A 씬 ${violations.length}개에 motion props 존재:`);
  for (const v of violations.slice(0, 10)) {
    console.log(`  - ${v.id}: ${v.count}개 노드 (예: ${v.sample.join(", ")})`);
  }
  if (violations.length > 10) console.log(`  ... 외 ${violations.length - 10}개 씬`);
  console.log("");
  console.log(
    "해결: Phase A 는 레이아웃/콘텐츠만. motion props 를 모두 제거하고 vg-preview-still 로 정적 PNG 검증 후 Phase B 에서 모션 추가."
  );
  process.exit(1);
}

main();
