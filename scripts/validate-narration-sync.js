#!/usr/bin/env node
// validate-narration-sync.js — HARD GATE: 데모 narration 메타톤 금지
//
// vg-demo-script SKILL.md:29, vg-video-demo-script SKILL.md:29:
//   금지: "이 슬라이드에서는~", "다음으로~" 같은 메타 언어
//   MUST: 사용자 시선/행동에 맞춰 직접적
//
// 대상 파일: demo-spec.json (slides[].narration) 또는 video-spec.json (segments[].narration)
// 검출:
//   - 메타톤 접두 패턴 매치 → FAIL
//   - narration 길이 < 20자 → WARN
//   - narration 이 null / "" 이면 WARN (미생성)
//
// 사용법: node validate-narration-sync.js <demo-spec.json | video-spec.json>

const fs = require("fs");

// 금지 접두 패턴 (슬라이드 경계 메타언어 + 공허한 꾸밈어)
const META_PREFIXES = [
  /^이\s*슬라이드/,
  /^다음\s*슬라이드/,
  /^이\s*화면에서(는|)/,
  /^이번\s*(슬라이드|챕터|페이지|화면)/,
  /^지금부터\s/,
  /^이제부터\s/,
  /^다음으로/,
  /^다음\s*단계로/,
  /^이어서\s/,
  /^먼저\s*말씀드리면/,
  /^여기서는/,
  /^이\s*세그먼트/,
  /^이\s*영상에서(는|)/,
  /^우선\s*말씀드리면/,
];

function detectMeta(text) {
  if (typeof text !== "string") return null;
  const t = text.trim();
  for (const re of META_PREFIXES) {
    if (re.test(t)) return re.source;
  }
  return null;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-narration-sync.js <demo-spec.json | video-spec.json>");
    process.exit(2);
  }
  if (!fs.existsSync(file)) {
    console.error(`❌ [FAIL] File not found: ${file}`);
    process.exit(2);
  }
  const spec = JSON.parse(fs.readFileSync(file, "utf8"));

  const items = Array.isArray(spec.slides)
    ? spec.slides.map((s, i) => ({ kind: "slide", idx: i, id: s.id || `s${i + 1}`, narration: s.narration }))
    : Array.isArray(spec.segments)
    ? spec.segments.map((s, i) => ({ kind: "segment", idx: i, id: s.id || `seg-${i + 1}`, narration: s.narration }))
    : [];

  if (items.length === 0) {
    console.log("");
    console.log("⚠️  [SKIP] narration-sync 검증 생략 — slides/segments 배열이 없습니다.");
    process.exit(0);
  }

  const failures = [];
  const warnings = [];
  let missing = 0;

  for (const it of items) {
    const n = it.narration;
    if (n == null || (typeof n === "string" && n.trim() === "")) {
      missing++;
      warnings.push(`[narration:empty] ${it.id} narration 미생성.`);
      continue;
    }
    if (typeof n !== "string") continue;

    const meta = detectMeta(n);
    if (meta) {
      failures.push(`[narration:meta-tone] ${it.id} "${n.slice(0, 40)}..." (패턴: ${meta})`);
    }
    const t = n.trim();
    // 자소 길이 대략치
    const len = [...t].length;
    if (len > 0 && len < 20) {
      warnings.push(`[narration:too-short] ${it.id} ${len}자 — 최소 20자 필요: "${t}"`);
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔍 narration-sync 검증 (${items[0].kind} ${items.length}개)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 ${items.length}개  ·  미생성 ${missing}  ·  FAIL ${failures.length}  ·  WARN ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... 외 ${warnings.length - 10}개`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ narration-sync 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 메타톤 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: narration 을 사용자 시점 직접 화법으로 재작성. \"이 슬라이드에서는\" 대신 \"여기를 누르면 ~ 이 열려요\" 같이 행동 중심."
  );
  process.exit(1);
}

main();
