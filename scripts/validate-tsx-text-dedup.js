#!/usr/bin/env node
// validate-tsx-text-dedup.js — R9 (d) P3 AST 이식.
//
// TSX 씬의 JSX string literal 에서 텍스트를 추출하여 동시간대 SRT 자막과 중복 검사.
// Levenshtein similarity > 0.6 FAIL (기존 validate-subtitle-visual-dedup 과 임계 유사).
//
// 사용: node scripts/validate-tsx-text-dedup.js <scenes-v2.json>

const fs = require("fs");
const path = require("path");

function isTsxWrapper(scene) {
  const root = scene?.stack_root;
  return root?.type === "SceneRoot" && root.children?.[0]?.type === "TSX";
}

function extractJsxStrings(src) {
  // JSX 텍스트 노드 + string literal 추출.
  // 1) >텍스트< 형식 (JSX text)
  // 2) "string" / 'string' (attribute)
  const results = [];
  // 주석 제거 — 간단히 // 주석 / /* ... */
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  // JSX 텍스트 — > 사이의 한글/영문 단어
  const jsxTextRegex = />([^<>{}\n]{2,}?)</g;
  let m;
  while ((m = jsxTextRegex.exec(cleaned)) !== null) {
    const t = m[1].trim();
    if (/[가-힣A-Za-z0-9]/.test(t) && t.length >= 3) results.push(t);
  }

  // 문자열 리터럴 중 한글 포함 ≥ 3자
  const strRegex = /["'`]([^"'`\n]{3,})["'`]/g;
  while ((m = strRegex.exec(cleaned)) !== null) {
    const t = m[1].trim();
    if (/[가-힣]/.test(t) && t.length >= 3 && !t.startsWith("#") && !/^[a-z-]+$/.test(t)) {
      results.push(t);
    }
  }
  return results;
}

// token-level dedup (strict mode 유사)
function tokenize(s) {
  return s.replace(/[^\w가-힣\s]/g, " ").split(/\s+/).filter((t) => t.length >= 2);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/validate-tsx-text-dedup.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  const threshold = 0.6;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`tsx-text-dedup 검증 (P3 AST 이식 · 임계 ${threshold})`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const issues = [];
  let tsxChecked = 0;

  for (const s of scenes) {
    if (!isTsxWrapper(s)) continue;
    const comp = s.stack_root.children[0]?.data?.component;
    const tsxPath = path.join("src/remotion/custom", `${comp}.tsx`);
    if (!fs.existsSync(tsxPath)) continue;
    tsxChecked++;
    const src = fs.readFileSync(tsxPath, "utf8");
    const jsxStrings = extractJsxStrings(src);
    const subtitles = Array.isArray(s.subtitles) ? s.subtitles.map((sub) => sub.text || "") : [];

    for (const subtitle of subtitles) {
      if (subtitle.length < 4) continue;
      for (const jsxStr of jsxStrings) {
        const sim = similarity(subtitle, jsxStr);
        if (sim >= threshold && jsxStr.length >= 4) {
          issues.push({ id: s.id, comp, jsx: jsxStr.slice(0, 40), sub: subtitle.slice(0, 40), sim: sim.toFixed(3) });
        }
      }
    }
  }

  console.log(`  TSX 씬: ${tsxChecked}  ·  중복 건: ${issues.length}`);

  if (issues.length > 0) {
    for (const it of issues.slice(0, 10)) {
      console.log(`❌ [FAIL:tsx-text-dedup] ${it.id} jsx="${it.jsx}" ↔ sub="${it.sub}" sim=${it.sim}`);
    }
    if (issues.length > 10) console.log(`  ... +${issues.length - 10} more`);
    process.exit(1);
  }

  console.log("");
  console.log("✅ [PASS] 모든 TSX 씬의 JSX 문자열이 동시간대 자막과 중복 없음.");
}

main();
