#!/usr/bin/env node
// _sweep-warn-tags.mjs — validator 들의 ⚠️/❌/ℹ️ 메시지에 [SKIP]/[INFO]/[WARN]/[FAIL] prefix 추가
//
// 규칙:
//   1. `console.error("❌ ...")` 패턴 — 이미 실패 메시지, [FAIL:...] 로 분류
//      단 이미 prefix 있으면 skip.
//   2. `console.log("❌ ...")` — 동일.
//   3. `console.log("⚠️  ...생략")` or `...skip` 등 단어 매칭 — [SKIP]
//   4. `console.warn("⚠️  ...")` 일반 — [WARN]
//   5. `console.log("ℹ️ ...")` or "info" — [INFO]
//
// 이미 `[` prefix 있으면 중복 적용 방지.

import fs from "node:fs";
import path from "node:path";

const FILES = [
  "scripts/count-visual-elements.js",
  "scripts/validate-absolute-bbox.js",
  "scripts/validate-absolute-content.js",
  "scripts/validate-allow-exit.js",
  "scripts/validate-background-coverage.js",
  "scripts/validate-design-sync.js",
  "scripts/validate-determinism.js",
  "scripts/validate-fidelity.js",
  "scripts/validate-frame-pixels.js",
  "scripts/validate-freetext-cap.js",
  "scripts/validate-hero-frame.js",
  "scripts/validate-label-quality.js",
  "scripts/validate-layout-diversity.js",
  "scripts/validate-motion-variety.js",
  "scripts/validate-narration-sync.js",
  "scripts/validate-no-br.js",
  "scripts/validate-no-emoji.js",
  "scripts/validate-no-exit-anim.js",
  "scripts/validate-node-uniqueness.js",
  "scripts/validate-phase-separation.js",
  "scripts/validate-progression.js",
  "scripts/validate-sfx-volume.js",
  "scripts/validate-slide-archetype.js",
  "scripts/validate-svg-asset-integrity.js",
  "scripts/validate-svg-coverage.js",
  "scripts/validate-svg-library-style.js",
  "scripts/validate-svg-motif-count.js",
  "scripts/validate-tabular.js",
  "scripts/validate-text-length.js",
  "scripts/validate-visual-plan-coverage.js",
];

// 간단한 휴리스틱 매칭. 기존 prefix 들 중복 피하고, 가장 명확한 패턴만 변환.
const PATTERNS = [
  // 이미 [TAG:...] prefix 있으면 skip 처리하는 regex
  { re: /console\.error\(`❌ (?!\[)([^`]*?)`/g, replace: 'console.error(`❌ [FAIL] $1`' },
  { re: /console\.error\("❌ (?!\[)([^"]*?)"/g, replace: 'console.error("❌ [FAIL] $1"' },
  { re: /console\.log\(`❌ (?!\[)([^`]*?)`/g, replace: 'console.log(`❌ [FAIL] $1`' },
  { re: /console\.log\("❌ (?!\[)([^"]*?)"/g, replace: 'console.log("❌ [FAIL] $1"' },
  // SKIP 패턴: 생략/skip/검사 생략
  { re: /console\.log\(`⚠️\s+(?!\[)([^`]*?(?:생략|skip|Skipping|scan 대상 없음)[^`]*?)`/g, replace: 'console.log(`⚠️  [SKIP] $1`' },
  { re: /console\.log\("⚠️\s+(?!\[)([^"]*?(?:생략|skip|Skipping|scan 대상 없음)[^"]*?)"/g, replace: 'console.log("⚠️  [SKIP] $1"' },
  // WARN (나머지 ⚠️)
  { re: /console\.warn\(`⚠️\s+(?!\[)([^`]*?)`/g, replace: 'console.warn(`⚠️  [WARN] $1`' },
  { re: /console\.warn\("⚠️\s+(?!\[)([^"]*?)"/g, replace: 'console.warn("⚠️  [WARN] $1"' },
  // INFO
  { re: /console\.log\(`ℹ️\s+(?!\[)([^`]*?)`/g, replace: 'console.log(`ℹ️  [INFO] $1`' },
  { re: /console\.log\("ℹ️\s+(?!\[)([^"]*?)"/g, replace: 'console.log("ℹ️  [INFO] $1"' },
];

let totalFiles = 0;
let totalChanges = 0;

for (const file of FILES) {
  if (!fs.existsSync(file)) continue;
  const orig = fs.readFileSync(file, "utf8");
  let next = orig;
  let fileChanges = 0;
  for (const p of PATTERNS) {
    next = next.replace(p.re, (match, ...args) => {
      fileChanges++;
      return p.replace.replace("$1", args[0]);
    });
  }
  if (fileChanges > 0) {
    fs.writeFileSync(file, next);
    totalFiles++;
    totalChanges += fileChanges;
    console.log(`  ${path.basename(file)}: ${fileChanges} 치환`);
  }
}
console.log("");
console.log(`✅ 태깅 스윕 완료: ${totalFiles} 파일 / ${totalChanges} 치환`);
