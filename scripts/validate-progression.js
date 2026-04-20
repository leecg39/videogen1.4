#!/usr/bin/env node
// validate-progression.js — HARD GATE: 씬 intent 진행 패턴
//
// vg-scene SKILL.md:315-321 규칙:
//   (1) emphasize 연속 2회 금지
//   (2) define/explain 연속 3회 금지
//   (3) compare 다음에는 emphasize 또는 example MUST (define/explain 만 오면 FAIL)
//   (4) 첫 씬은 define 또는 emphasize
//   (5) 마지막 2개 씬은 emphasize 또는 list
//
// intent 는 scene.chunk_metadata.intent 에서 읽는다. "pending" 은 의도 미확정 → 검사 생략.
// postprocess.sh ⑥-n 로 삽입.

const fs = require("fs");

const VALID_INTENTS = new Set(["define", "explain", "compare", "emphasize", "example", "list"]);

function getIntent(sc) {
  const raw = sc?.chunk_metadata?.intent ?? sc?.intent ?? null;
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s === "pending") return null;
  return s;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-progression.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const intents = scenes.map(getIntent);
  const resolved = intents.filter(Boolean).length;

  const failures = [];
  const warnings = [];

  // 통계
  const histogram = {};
  for (const i of intents) {
    if (!i) continue;
    histogram[i] = (histogram[i] || 0) + 1;
  }

  // intent 가 하나도 없으면 검사 생략 (pending-only 프로젝트)
  if (resolved === 0) {
    console.log("");
    console.log("⚠️  [SKIP] progression 검증 생략 — 모든 씬 intent 가 pending. vg-scene 재실행 필요.");
    process.exit(0);
  }

  // (3) compare 다음 define/explain
  for (let i = 0; i < intents.length - 1; i++) {
    const curr = intents[i];
    const next = intents[i + 1];
    if (curr === "compare" && next && !["emphasize", "example"].includes(next)) {
      failures.push(
        `[progression:compare-next] ${scenes[i].id}(compare) → ${scenes[i + 1].id}(${next}). compare 다음엔 emphasize/example 만 허용.`
      );
    }
  }

  // (1) emphasize 연속 2회
  for (let i = 0; i < intents.length - 1; i++) {
    if (intents[i] === "emphasize" && intents[i + 1] === "emphasize") {
      failures.push(
        `[progression:emphasize-run] ${scenes[i].id} / ${scenes[i + 1].id}: emphasize 연속 2회. 사이에 explain/compare 삽입.`
      );
    }
  }

  // (2) define/explain 연속 3회
  for (let i = 0; i <= intents.length - 3; i++) {
    const triplet = [intents[i], intents[i + 1], intents[i + 2]];
    if (triplet.every((t) => t === "define" || t === "explain")) {
      warnings.push(
        `[progression:define-run] ${scenes[i].id}/${scenes[i + 1].id}/${scenes[i + 2].id}: define/explain 연속 3회.`
      );
    }
  }

  // (4) 첫 씬
  if (intents.length > 0 && intents[0] && !["define", "emphasize"].includes(intents[0])) {
    warnings.push(
      `[progression:first-scene] ${scenes[0].id} intent=${intents[0]}. 첫 씬은 define/emphasize 권고.`
    );
  }

  // (5) 마지막 2개 씬
  const tail = intents.slice(-2).filter(Boolean);
  for (const t of tail) {
    if (!["emphasize", "list"].includes(t)) {
      warnings.push(
        `[progression:tail] 마지막 2개 씬 중 intent=${t}. emphasize/list 로 마무리 권고.`
      );
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 progression 검증 (씬 intent 흐름)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${scenes.length}   resolved intent: ${resolved}`);
  console.log(`  histogram: ${Object.entries(histogram).map(([k, v]) => `${k}=${v}`).join(", ")}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... 외 ${warnings.length - 10}개`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ progression 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 progression 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: compare 다음엔 emphasize/example 삽입. emphasize 2연속 금지. /vg-scene 재실행 또는 chunk_metadata.intent 수정."
  );
  process.exit(1);
}

main();
