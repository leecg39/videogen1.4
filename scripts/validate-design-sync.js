#!/usr/bin/env node
// validate-design-sync.js — HARD GATE: docs/design-system.md ↔ theme.ts sync
//
// 배경: 2026-04-17 세션. docs/design-system.md 가 v1 (퍼플 네온 #A855F7) 인데
// 실제 theme.ts SCENE_PALETTES[0] 는 mint (#39FF14) 였음.
// 이 불일치로 "브랜드색이 뭔지" 혼란 → 일부 씬 legacy T.accent (#9945FF) fallback.
//
// 검증 규칙:
//   (1) docs/design-system.md 에 mint #39FF14 명시 여부
//   (2) docs/design-system.md 에 금지색 (#A855F7 / #C084FC / #9945FF) 언급 금지
//       (단 "금지 목록" / "NEVER" 컨텍스트는 허용)
//   (3) theme.ts SCENE_PALETTES[0].accent 가 #39FF14 인지
//   (4) theme.ts T.accent 가 legacy purple 이면 경고
//
// postprocess.sh ⑥-f 로 삽입 (선택적 — docs 변경 시만 필요).

const fs = require("fs");

function main() {
  const docPath = "docs/design-system.md";
  const themePath = "src/remotion/common/theme.ts";

  if (!fs.existsSync(docPath)) {
    console.error(`❌ [FAIL] ${docPath} 없음`);
    process.exit(1);
  }
  if (!fs.existsSync(themePath)) {
    console.error(`❌ [FAIL] ${themePath} 없음`);
    process.exit(1);
  }

  const doc = fs.readFileSync(docPath, "utf8");
  const theme = fs.readFileSync(themePath, "utf8");

  const failures = [];
  const warnings = [];

  // (1) mint 명시 여부
  if (!doc.includes("#39FF14")) {
    failures.push(`[design-sync:mint-missing] docs/design-system.md 에 mint #39FF14 명시 필요`);
  }

  // (2) 금지색 사용 (단 NEVER / 금지 컨텍스트 외)
  // 단순 체크: 금지색 나타나는 줄에 "금지" 또는 "NEVER" 단어가 같은 블록(앞 20줄 내) 있어야 허용
  const forbidden = [
    { hex: "#A855F7", name: "purple-500" },
    { hex: "#C084FC", name: "purple-400" },
    { hex: "#9945FF", name: "violet-legacy" },
    { hex: "#7C3AED", name: "violet-600" },
    { hex: "#BB86FC", name: "purple-legacy-bright" },
  ];
  for (const f of forbidden) {
    const idx = doc.indexOf(f.hex);
    if (idx === -1) continue;
    // 앞 800 자 범위에 "금지" / "NEVER" / "폐기" 있는지
    const ctx = doc.slice(Math.max(0, idx - 800), idx + 100);
    const allowed = /금지|NEVER|폐기|legacy|금지 목록|안 됨|사용 금지/.test(ctx);
    if (!allowed) {
      failures.push(
        `[design-sync:forbidden-color] 금지색 ${f.hex} (${f.name}) 이 docs 에 "허용 컨텍스트" 없이 등장`
      );
    }
  }

  // (3) theme.ts SCENE_PALETTES[0].accent = #39FF14
  // SCENE_PALETTES 배열 선언 이후 첫 번째 accent: "#..." 값을 찾음
  const palettesIdx = theme.indexOf("SCENE_PALETTES");
  let palette0Hex = null;
  if (palettesIdx >= 0) {
    const rest = theme.slice(palettesIdx);
    const m = rest.match(/accent:\s*"(#[A-Fa-f0-9]{6})"/);
    if (m) palette0Hex = m[1].toUpperCase();
  }
  if (palette0Hex !== "#39FF14") {
    failures.push(
      `[design-sync:palette0-mismatch] theme.ts SCENE_PALETTES[0].accent 가 #39FF14 아님 (발견: ${palette0Hex || "unknown"})`
    );
  }

  // (4) legacy T.accent 경고
  const tAccentMatch = theme.match(/export const T = \{[\s\S]*?accent:\s*"(#[A-Fa-f0-9]{6})"/);
  if (tAccentMatch && tAccentMatch[1].toUpperCase() !== "#39FF14") {
    warnings.push(
      `[design-sync:t-accent-legacy] theme.ts T.accent = ${tAccentMatch[1]} (non-mint). ` +
        `fallback 에서 purple 튐 위험. mint 로 교체 권장.`
    );
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 design-system sync 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ design-system sync 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 design-sync 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: docs/design-system.md 와 theme.ts 의 브랜드 색 (#39FF14 mint) 을 일치시키세요."
  );
  process.exit(1);
}

main();
