#!/usr/bin/env node
// validate-allow-exit.js — allow_exit: true 는 마지막 씬에만 허용
//
// postprocess ⑥-ze 로 삽입.

const fs = require("fs");

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-allow-exit.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const lastIdx = scenes.length - 1;
  const violations = [];
  scenes.forEach((s, i) => {
    if (s.allow_exit === true && i !== lastIdx) violations.push({ id: s.id, idx: i });
  });
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 allow-exit 검증 (마지막 씬 외 금지)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}  위반: ${violations.length}`);
  if (violations.length === 0) { console.log("✅ allow-exit 통과."); process.exit(0); }
  console.log("");
  console.log("❌ [FAIL] 중간 씬에 allow_exit:true:");
  violations.forEach((v) => console.log(`  - ${v.id} (idx=${v.idx})`));
  process.exit(1);
}
main();
