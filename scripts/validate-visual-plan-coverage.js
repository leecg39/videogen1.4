#!/usr/bin/env node
// validate-visual-plan-coverage.js — HARD GATE: visual_plan commit 검증
//
// 목적: /vg-scene 이 씬별 visual_plan 을 확정했는지 검증.
//       현재 누락 또는 분포 편향 시 postprocess 실패 → 렌더 불가.
//
// 검증 규칙:
//   (1) 모든 씬에 visual_plan 존재
//   (2) pattern_ref 가 pattern-catalog 에 정의된 20개 중 하나
//   (3) 단일 pattern_ref 가 전체 씬의 20% 초과 금지
//   (4) 고유 pattern_ref 종류 ≥ max(6, floor(총씬/10))
//   (5) relationship 다양성 ≥ 4 (metric/contrast/flow/evidence/pause/enumerate/case 중)
//   (6) accent_color 다양성 ≥ 2
//
// 이 가드는 "의미 청킹 단계에서 구성안이 확정된다" 아키텍처 법칙의 자동 검증.

const fs = require("fs");

const VALID_PATTERNS = [
  "P01_mega_number",
  "P02_number_hero_double_bar",
  "P03_weekly_bars",
  "P04_ring_with_bullets",
  "P05_ring_triplet",
  "P06_brand_bar_pair",
  "P07_tile_triplet",
  "P08_vertical_timeline",
  "P09_number_chain_arrow",
  "P10_hub_satellite",
  "P11_persona_stack",
  "P12_doc_split",
  "P13_radial_people",
  "P14_color_bar_bullet",
  "P15_era_timeline",
  "P16_warning_triangle",
  "P17_icon_title_sub_badge",
  "P18_vertical_dual_bar",
  "P19_two_col_contrast",
  "P20_mini_flow",
  "P21_vertical_dual_bar",
  "P22_browser_mockup",
  "P23_terminal_code",
  "P24_emoji_icon_row",
  "P25_brand_satellite",
  "P26_diagonal_flow",
  "P27_ralph_loop",
  "P28_priority_color_list",
  "P29_radial_people",
  "P30_era_timeline_photo",
  "P31_ai_comparison_triangle",
  "P32_big_ratio_contrast",
  "P33_chat_conversation",
  "P34_quad_mockup",
  "P35_stat_with_bullets_side",
  "P36_progress_3_stages",
  "P37_brand_card_triptych",
  "P38_hero_wordmark",
  "P39_big_number_context_sub",
  "P40_safety_priority_list",
];

const VALID_RELATIONSHIPS = [
  "metric",
  "contrast",
  "flow",
  "evidence",
  "pause",
  "enumerate",
  "case",
];

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-visual-plan-coverage.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  const total = scenes.length;
  const failures = [];
  const warnings = [];

  // (1) visual_plan 존재 여부
  const missing = scenes
    .filter((sc) => !sc.visual_plan || !sc.visual_plan.pattern_ref)
    .map((sc) => sc.id);
  if (missing.length > 0) {
    failures.push(
      `[vp:coverage] ${missing.length}/${total} 씬에 visual_plan 누락 — ` +
        `${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " ..." : ""}. ` +
        `/vg-scene 이 pickVisualPlan() 을 수행했는지 확인.`
    );
  }

  // 나머지 검사는 visual_plan 있는 씬만
  const withPlan = scenes.filter((sc) => sc.visual_plan?.pattern_ref);
  if (withPlan.length === 0) {
    console.log("❌ [FAIL] visual_plan 이 하나도 없어 분포 검증 불가.");
    process.exit(1);
  }

  // (2) pattern_ref 유효성
  const invalid = withPlan
    .filter((sc) => !VALID_PATTERNS.includes(sc.visual_plan.pattern_ref))
    .map((sc) => `${sc.id}(${sc.visual_plan.pattern_ref})`);
  if (invalid.length > 0) {
    failures.push(
      `[vp:invalid-pattern] 알 수 없는 pattern_ref: ${invalid
        .slice(0, 6)
        .join(", ")}. pattern-catalog.ts 확인.`
    );
  }

  // (3) 단일 pattern 비율
  const patternCount = new Map();
  for (const sc of withPlan) {
    const p = sc.visual_plan.pattern_ref;
    patternCount.set(p, (patternCount.get(p) || 0) + 1);
  }
  const overused = [];
  for (const [p, n] of patternCount) {
    const pct = (n / total) * 100;
    if (pct > 20) {
      overused.push(`${p}(${n}/${total}=${pct.toFixed(1)}%)`);
    }
  }
  if (overused.length > 0) {
    failures.push(
      `[vp:overuse] 20% 초과 패턴: ${overused.join(", ")}. ` +
        `pattern-picker 의 saturation penalty 조정 또는 cap 낮추기.`
    );
  }

  // (4) 고유 pattern 종류
  const minUnique = Math.max(6, Math.floor(total / 10));
  if (patternCount.size < minUnique) {
    failures.push(
      `[vp:variety] 고유 pattern_ref ${patternCount.size}종 (< ${minUnique}). ` +
        `발견: ${Array.from(patternCount.keys()).sort().join(", ")}.`
    );
  }

  // (5) relationship 다양성
  const rels = new Set(withPlan.map((sc) => sc.visual_plan.relationship));
  for (const r of rels) {
    if (!VALID_RELATIONSHIPS.includes(r)) {
      warnings.push(`[vp:bad-rel] 알 수 없는 relationship: ${r}`);
    }
  }
  if (rels.size < 4) {
    failures.push(
      `[vp:relationship] 고유 relationship ${rels.size}종 (< 4). ` +
        `발견: ${Array.from(rels).join(", ")}. 서사 다양성 부족.`
    );
  }

  // (6) accent 다양성
  const accents = new Set(withPlan.map((sc) => sc.visual_plan.accent_color));
  if (accents.size < 2) {
    failures.push(
      `[vp:accent] 고유 accent_color ${accents.size}종 (< 2). ` +
        `전부 ${Array.from(accents)[0]} — 색상 단조로움.`
    );
  }

  // 요약
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 visual_plan coverage 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${total}`);
  console.log(`  visual_plan 있음: ${withPlan.length}`);
  console.log(`  고유 pattern_ref: ${patternCount.size}`);
  console.log(`  고유 relationship: ${rels.size}`);
  console.log(`  고유 accent: ${accents.size}`);
  if (patternCount.size > 0) {
    const sorted = Array.from(patternCount.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    console.log(
      `  top patterns: ${sorted
        .slice(0, 5)
        .map(([p, n]) => `${p}(${n})`)
        .join(", ")}`
    );
  }

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}개:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ visual_plan coverage 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 visual_plan coverage 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: /vg-scene 을 재실행하여 pattern-picker 결과를 다시 커밋하거나, " +
      "pattern-catalog/pattern-picker 의 매칭 룰을 조정하세요."
  );
  process.exit(1);
}

main();
