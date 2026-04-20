#!/usr/bin/env node
// validate-dsl-rationale.js — R9 (e) 원칙 A strict hook.
//
// DSL 씬 (TSX wrapper 가 아닌 씬) 은 `_dsl_rationale` 필드에 3조건 근거를 명시해야 한다.
//   {
//     "data_only":     "narration 이 순수 데이터 제시 의도인 이유",
//     "pattern_unique": "이 DSL pattern 이 다른 씬에서 쓰이지 않는 이유",
//     "no_emotion":    "감정 비트(승부/대비/전환/엔딩) 가 없는 이유"
//   }
//
// 누락 또는 각 필드 길이 < 10자 → exit 2 (strict block, --no-verify 권장 금지).
//
// 사용: node scripts/validate-dsl-rationale.js <scenes-v2.dsl-subset.json | scenes-v2.json>

const fs = require("fs");

function isTsxWrapper(scene) {
  const root = scene?.stack_root;
  return root?.type === "SceneRoot" && root.children?.[0]?.type === "TSX";
}

function checkRationale(rat, scene) {
  if (!rat || typeof rat !== "object") return { ok: false, reason: "missing _dsl_rationale" };
  const REQUIRED = ["data_only", "pattern_unique", "no_emotion"];
  for (const key of REQUIRED) {
    const v = rat[key];
    if (typeof v !== "string") return { ok: false, reason: `missing field: ${key}` };
    if (v.trim().length < 10) return { ok: false, reason: `${key} 근거 < 10자 (형식적 기입 의심)` };
    // strict: 자동 생성된 "재검토 필요" 또는 "반복" 또는 "감정 키워드 검출" → FAIL
    if (v.includes("재검토 필요") || v.includes("감정 키워드 검출") || /\d+회 반복/.test(v)) {
      return { ok: false, reason: `${key} review_required flag — TSX 전환 후보` };
    }
  }
  // _dsl_rationale_review_required 플래그 명시 체크
  if (scene?._dsl_rationale_review_required === true) {
    return { ok: false, reason: "_dsl_rationale_review_required=true — TSX 전환 후보" };
  }
  return { ok: true };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/validate-dsl-rationale.js <scenes-v2(.dsl-subset).json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  const dslScenes = scenes.filter((s) => !isTsxWrapper(s));

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`dsl-rationale 검증 (원칙 A strict · DSL ${dslScenes.length}/${scenes.length} 씬)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const violations = [];
  for (const s of dslScenes) {
    const res = checkRationale(s._dsl_rationale, s);
    if (!res.ok) violations.push({ id: s.id, reason: res.reason });
  }

  console.log(`  검사 씬: ${dslScenes.length}  ·  위반: ${violations.length}`);

  if (violations.length > 0) {
    for (const v of violations.slice(0, 15)) {
      console.log(`❌ [FAIL:dsl-rationale] ${v.id} — ${v.reason}`);
    }
    if (violations.length > 15) console.log(`  ... +${violations.length - 15} more`);
    console.log("");
    console.log("원칙 A 3조건 (동시 만족 시만 DSL 허용):");
    console.log("  1. data_only:      narration 이 순수 데이터 제시 의도");
    console.log("  2. pattern_unique: 이 DSL pattern 이 프로젝트 내 다른 씬에서 미사용");
    console.log("  3. no_emotion:     감정 비트(승부/대비/전환/엔딩) 없음");
    console.log("");
    console.log("근거를 보강하거나 TSX 로 전환하세요. (3 조건 미달 시 기본값은 TSX.)");
    process.exit(2);
  }

  console.log("");
  console.log("✅ [PASS] 모든 DSL 씬에 _dsl_rationale 3조건 근거 명시.");
}

main();
