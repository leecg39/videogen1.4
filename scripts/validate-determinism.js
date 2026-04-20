#!/usr/bin/env node
// validate-determinism.js — HARD GATE: Remotion 결정론 강제
//
// scene-grammar.md Section 6: Remotion 컴포넌트는 frame-pure 여야 한다.
// src/remotion/**/*.tsx 및 *.ts 에서 다음 패턴 검출 시 exit 1:
//   - Math.random
//   - Date.now
//   - new Date( (스트링 인자 포함이면 OK, 인자 없으면 non-deterministic)
//   - setTimeout / setInterval
//   - performance.now
//
// 주석/문자열 내 등장은 허용 (단순 grep 이후 // 또는 /* 또는 "..."/'...' 내부 제외 필터).
// postprocess.sh ⑥-h 로 삽입.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src", "remotion");

const PATTERNS = [
  { name: "Math.random", re: /Math\.random\s*\(/ },
  { name: "Date.now", re: /Date\.now\s*\(/ },
  { name: "new Date()", re: /new\s+Date\s*\(\s*\)/ },
  { name: "setTimeout", re: /\bsetTimeout\s*\(/ },
  { name: "setInterval", re: /\bsetInterval\s*\(/ },
  { name: "performance.now", re: /performance\.now\s*\(/ },
];

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(f)) out.push(p);
  }
  return out;
}

function stripCommentsAndStrings(src) {
  // 라인 주석 제거
  let s = src.replace(/\/\/[^\n]*/g, "");
  // 블록 주석 제거
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // 템플릿 리터럴은 건드리지 않는다 (`${Math.random()}` 같은 코드 경로는 찾아야 함)
  // 단, 문자열 리터럴 내부는 안전하게 제거
  s = s.replace(/"([^"\\\n]|\\.)*"/g, '""');
  s = s.replace(/'([^'\\\n]|\\.)*'/g, "''");
  return s;
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.log(`⚠️  [SKIP] ${ROOT} 없음 — 검사 생략.`);
    process.exit(0);
  }

  const files = walk(ROOT);
  const violations = [];

  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    const src = stripCommentsAndStrings(raw);
    const rel = path.relative(path.resolve(__dirname, ".."), f);
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { name, re } of PATTERNS) {
        if (re.test(line)) {
          violations.push({ file: rel, line: i + 1, name, sample: line.trim().slice(0, 120) });
        }
      }
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 determinism 검증 (src/remotion 의 non-deterministic 패턴)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  스캔 파일: ${files.length}`);
  console.log(`  위반 라인: ${violations.length}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ determinism 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${violations.length}개 non-deterministic 사용:`);
  for (const v of violations.slice(0, 20)) {
    console.log(`  - ${v.file}:${v.line}  ${v.name}  │  ${v.sample}`);
  }
  if (violations.length > 20) console.log(`  ... 외 ${violations.length - 20}개`);
  console.log("");
  console.log(
    "해결: frame 과 useCurrentFrame() 기반 seeded 값으로 교체. setTimeout/setInterval 은 Remotion 에서 동작하지 않음."
  );
  process.exit(1);
}

main();
