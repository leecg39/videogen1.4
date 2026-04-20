#!/usr/bin/env node
// validate-svg-library-style.js — 라이브러리 자산 규격 검증
//
// public/svg-library/assets/*.svg 전수를 파싱하여 line-art 규격 위반 검출:
//   - viewBox="0 0 120 120" 강제
//   - stroke="currentColor"
//   - stroke-width="3.5"
//   - 금지 태그: text / filter / gradient / image / foreignObject
//   - fill 은 "none" 또는 "currentColor" 만
//
// 단독 실행 또는 optionally postprocess 에 추가 가능 (라이브러리 직접 손댔을 때).
// 기본은 seed/forge 후 품질 감시용.

const fs = require("fs");
const path = require("path");

const LIB = path.resolve(process.cwd(), "public", "svg-library");
const ASSETS = path.join(LIB, "assets");

function main() {
  if (!fs.existsSync(ASSETS)) {
    console.log("⚠️  [SKIP] svg-library/assets 없음 — 검사 생략.");
    process.exit(0);
  }
  const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith(".svg"));
  const bad = [];
  for (const name of files) {
    const p = path.join(ASSETS, name);
    const raw = fs.readFileSync(p, "utf8");
    const reasons = check(raw);
    if (reasons.length) bad.push({ name, reasons });
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔍 svg-library-style (${files.length}개 파일)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OK: ${files.length - bad.length}`);
  console.log(`  BAD: ${bad.length}`);

  if (bad.length === 0) {
    console.log("");
    console.log("✅ svg-library-style 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${bad.length}개 규격 위반:`);
  bad.slice(0, 15).forEach((b) => {
    console.log(`  - ${b.name}: ${b.reasons.join("; ")}`);
  });
  if (bad.length > 15) console.log(`  ... 외 ${bad.length - 15}개`);
  console.log("");
  console.log("해결: 해당 파일 재생성 (svg-forge --add <concept> --force) 또는 수동 교정.");
  process.exit(1);
}

function check(raw) {
  const reasons = [];
  if (!/viewBox\s*=\s*"0 0 120 120"/.test(raw)) reasons.push("viewBox not 0 0 120 120");
  if (/<text\b/i.test(raw)) reasons.push("contains <text>");
  if (/<filter\b/i.test(raw)) reasons.push("contains <filter>");
  if (/<(linear|radial)Gradient\b/i.test(raw)) reasons.push("contains gradient");
  if (/<image\b/i.test(raw)) reasons.push("contains <image>");
  if (/<foreignObject\b/i.test(raw)) reasons.push("contains <foreignObject>");
  const swMatches = raw.match(/stroke-width\s*=\s*"([^"]+)"/g) || [];
  for (const s of swMatches) {
    const v = s.match(/"([^"]+)"/)?.[1];
    if (v !== "3.5") reasons.push(`stroke-width="${v}" (expected 3.5)`);
  }
  const strokeMatches = raw.match(/stroke\s*=\s*"([^"]+)"/g) || [];
  for (const s of strokeMatches) {
    const v = s.match(/"([^"]+)"/)?.[1];
    if (v !== "currentColor") reasons.push(`stroke="${v}" (expected currentColor)`);
  }
  const fillMatches = raw.match(/fill\s*=\s*"([^"]+)"/g) || [];
  for (const s of fillMatches) {
    const v = s.match(/"([^"]+)"/)?.[1];
    if (v !== "none" && v !== "currentColor") reasons.push(`fill="${v}" (expected none|currentColor)`);
  }
  return reasons;
}

main();
