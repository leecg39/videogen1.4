#!/usr/bin/env node
// validate-tabular.js — HARD GATE: 숫자 노드의 tabular-nums 강제
//
// scene-grammar.md Section 7: 숫자 컬럼은 tabular-nums 로 폭 고정해야 자리수 흔들림이 없다.
// ImpactStat / AnimatedCounter / StatNumber / NumberCircle 이 숫자 값을 렌더하는 노드이므로
// 이들 컴포넌트를 구현하는 tsx 에 fontVariantNumeric/fontFeatureSettings 또는 tabular-nums 가
// 적용돼 있어야 한다.
//
// 검출:
//   1. src/remotion/nodes/*.tsx 중 위 컴포넌트를 export 하는 파일을 찾아
//      'tabular-nums' 또는 'tnum' 또는 'fontVariantNumeric' 문자열이 없으면 FAIL.
//   2. scenes-v2.json 의 노드 중 해당 타입이 style.fontVariantNumeric 명시했다면 pass (override).
//
// postprocess.sh ⑥-l 로 삽입.

const fs = require("fs");
const path = require("path");

const REQUIRED_COMPONENTS = ["ImpactStat", "AnimatedCounter", "StatNumber", "NumberCircle"];
const NODES_DIR = path.resolve(__dirname, "..", "src", "remotion", "nodes");

function fileHasComponent(src, name) {
  // 허용 패턴: `export const NameRenderer`, `export function Name`, `export { Name }`, 또는 파일 내 `${name}Renderer` 정의
  const re = new RegExp(
    `export\\s+(?:const|function|class)\\s+${name}(?:Renderer)?\\b|export\\s*\\{[^}]*\\b${name}(?:Renderer)?\\b|(?:const|function|class)\\s+${name}Renderer\\b`
  );
  return re.test(src);
}

function fileHasTabular(src) {
  return /tabular-nums|\btnum\b|fontVariantNumeric|fontFeatureSettings\s*:\s*["'][^"']*tnum/.test(src);
}

function main() {
  if (!fs.existsSync(NODES_DIR)) {
    console.log(`⚠️  [SKIP] ${NODES_DIR} 없음 — 검사 생략.`);
    process.exit(0);
  }

  const files = fs.readdirSync(NODES_DIR).filter((f) => /\.tsx?$/.test(f));
  const sources = files.map((f) => ({
    file: f,
    src: fs.readFileSync(path.join(NODES_DIR, f), "utf8"),
  }));

  const failures = [];
  const componentStatus = [];

  for (const name of REQUIRED_COMPONENTS) {
    const hosts = sources.filter((s) => fileHasComponent(s.src, name));
    if (hosts.length === 0) {
      componentStatus.push({ name, found: false, tabular: false });
      continue;
    }
    const tabularOk = hosts.some((h) => fileHasTabular(h.src));
    componentStatus.push({ name, found: true, tabular: tabularOk, files: hosts.map((h) => h.file) });
    if (!tabularOk) {
      failures.push(
        `[tabular:missing] ${name} 컴포넌트 (${hosts.map((h) => h.file).join(", ")}) 에 tabular-nums / fontVariantNumeric 미적용.`
      );
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 tabular-nums 검증 (숫자 노드 폭 고정)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const s of componentStatus) {
    const mark = s.found ? (s.tabular ? "✅" : "❌") : "⚠️ ";
    const suffix = s.found ? ` in ${s.files.join(", ")}` : " (not found)";
    console.log(`  ${mark} ${s.name}${suffix}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ tabular-nums 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 컴포넌트에 tabular-nums 누락:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: 숫자 렌더 컴포넌트의 style 에 `fontVariantNumeric: 'tabular-nums'` 또는 `fontFeatureSettings: \"'tnum'\"` 추가."
  );
  process.exit(1);
}

main();
