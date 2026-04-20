#!/usr/bin/env node
// validate-svg-motif-count.js — HARD GATE: motif_ids ≤ 3 강제
//
// vg-scene SKILL.md:150 — layout_reference.motif_ids 가 4개 이상이면 exit 1.
// motif 가 너무 많으면 한 씬이 너무 다양한 시각 신호를 담아 primary_family 정체성이 흐려진다.
//
// 대상 파일: scene-plan.json (plans[].layout_reference.motif_ids)
//          또는 scenes-v2.json (layout_reference.motif_ids)
//
// postprocess.sh ⑥-p 로 삽입.

const fs = require("fs");

function extractFromPlan(data) {
  // scene-plan 형태: { plans: [{ scene_index, layout_reference: { motif_ids: [] } }] }
  if (data && Array.isArray(data.plans)) {
    return data.plans.map((p, i) => ({
      id: `plan#${p.scene_index ?? i}`,
      family: p.layout_reference?.primary_family_id || null,
      motifs: Array.isArray(p.layout_reference?.motif_ids) ? p.layout_reference.motif_ids : [],
    }));
  }
  // scenes-v2 배열 형태
  if (Array.isArray(data)) {
    return data.map((sc, i) => ({
      id: sc.id || `scene#${i}`,
      family: sc.layout_reference?.primary_family_id || null,
      motifs: Array.isArray(sc.layout_reference?.motif_ids) ? sc.layout_reference.motif_ids : [],
    }));
  }
  return [];
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-svg-motif-count.js <scene-plan.json | scenes-v2.json>");
    process.exit(2);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const items = extractFromPlan(data);

  if (items.length === 0) {
    console.log("");
    console.log("⚠️  [SKIP] motif-count 검증 생략 — layout_reference.motif_ids 없음.");
    process.exit(0);
  }

  const failures = [];
  const warnings = [];
  let totalResolved = 0;

  for (const it of items) {
    if (!it.motifs || it.motifs.length === 0) continue;
    totalResolved++;
    if (it.motifs.length > 3) {
      failures.push(`[svg:motif-count] ${it.id} family=${it.family} motif_ids=${it.motifs.length} (> 3) — ${it.motifs.join(", ")}`);
    } else if (it.motifs.length === 3) {
      warnings.push(`[svg:motif-count] ${it.id} motif_ids=3 (상한). 꼭 필요한지 확인.`);
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 svg motif count 검증 (motif_ids ≤ 3)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 플랜: ${items.length}   motif 존재: ${totalResolved}   FAIL ${failures.length}  WARN ${warnings.length}`);

  if (warnings.length > 0 && warnings.length <= 10) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ svg motif count 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 motif 개수 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: svg-layout-selector 에서 motif_ids 를 최대 3개로 자르거나 primary_family 를 좁힘. /vg-scene 재실행."
  );
  process.exit(1);
}

main();
