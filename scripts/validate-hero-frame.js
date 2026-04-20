#!/usr/bin/env node
// validate-hero-frame.js — Scene Grammar Hard Gates ④ 강제
//
// 규칙:
//   - 각 씬에 hero_frame_ms 필드 필수 (Phase B 씬만)
//   - 값은 0 이상, duration_ms 이내
//   - 미정의 씬 > 10% 이면 exit 1 (예외: 슬라이드 모드 · subtitles 없음은 완화)
//
// postprocess ⑥-zb 로 삽입.

const fs = require("fs");

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-hero-frame.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const slideProject = scenes.every((s) => Array.isArray(s.subtitles) && s.subtitles.length === 0);
  if (slideProject) {
    console.log("⚠️  hero-frame 검증 완화 — 슬라이드 프로젝트 (subtitles 없음).");
    process.exit(0);
  }

  // v1.1 round 2: Phase B 씬만 hero_frame_ms 필수. Phase 미지정/A 는 생략.
  // (compute-hero-frame.js 가 Phase B 에 자동 주입하므로, 누락 시 그 스크립트 미실행 신호)
  const missing = [];
  const invalid = [];
  let phaseBCount = 0;
  for (const sc of scenes) {
    if (sc.phase !== "B") continue;
    phaseBCount++;
    const hf = sc.hero_frame_ms;
    if (hf == null) { missing.push(sc.id); continue; }
    if (typeof hf !== "number" || hf < 0) { invalid.push({ id: sc.id, value: hf }); continue; }
    const dur = (sc.end_ms ?? 0) - (sc.start_ms ?? 0);
    if (dur > 0 && hf > dur) invalid.push({ id: sc.id, value: hf, reason: `> duration ${dur}` });
  }

  const missPct = phaseBCount > 0 ? (missing.length / phaseBCount) * 100 : 0;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 hero-frame 검증 (hero_frame_ms 필수 필드)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}  Phase B: ${phaseBCount}`);
  console.log(`  missing: ${missing.length} (${missPct.toFixed(1)}% of Phase B)`);
  console.log(`  invalid: ${invalid.length}`);

  const failures = [];
  if (phaseBCount > 0 && missPct > 10) {
    failures.push(`[hero:missing] hero_frame_ms 누락 ${missing.length}개 (${missPct.toFixed(1)}% > 10%). 해결: node scripts/compute-hero-frame.js <scenes-v2.json> (자동 계산).`);
  }
  if (invalid.length > 0) {
    failures.push(`[hero:invalid] hero_frame_ms 값 오류 ${invalid.length}개. 샘플: ${invalid.slice(0,3).map(x=>`${x.id}=${x.value}`).join(", ")}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ hero-frame 통과.");
    process.exit(0);
  }
  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 hero-frame 위반:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  console.log("");
  console.log("해결: 씬별 hero_frame_ms 지정 (모든 모션이 정착된 시점 ms).");
  process.exit(1);
}

main();
