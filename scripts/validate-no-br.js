#!/usr/bin/env node
// validate-no-br.js — HARD GATE: 한글 텍스트 내 \n 금지
//
// scene-grammar.md Section 10: <br> 로 한글 줄바꿈 금지.
// 한글은 word-break: keep-all 로 자동 래핑해야 하며, data.text 에 \n 을 넣는 것은
// 레이아웃 너비를 무시하고 강제 개행하는 안티패턴.
//
// 대상 필드: data.text / data.title / data.body / data.subtitle / data.desc / data.label /
//           data.caption / data.leftLabel / data.rightLabel / data.leftValue / data.rightValue
// 허용: TerminalBlock.lines[] (다중 라인은 의도), code blocks
//
// postprocess.sh ⑥-k 로 삽입.

const fs = require("fs");

const CHECK_FIELDS = [
  "text", "title", "body", "subtitle", "desc", "description",
  "label", "caption", "centerLabel",
  "leftLabel", "rightLabel", "leftValue", "rightValue",
  "headline", "kicker", "hook", "claim",
];

// \n 허용 노드 (코드/터미널/여러 줄 입력)
const ALLOW_NEWLINE_TYPES = new Set([
  "TerminalBlock", "CodeBlock", "CodeTyping", "MarkdownBlock", "ChatBubble",
]);

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-no-br.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const violations = [];

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n, path) => {
      if (ALLOW_NEWLINE_TYPES.has(n.type)) return;
      const d = n.data || {};
      for (const f of CHECK_FIELDS) {
        const v = d[f];
        if (typeof v === "string" && v.includes("\n")) {
          const loc = [...path, n.type || "?"].join(">");
          violations.push({
            sceneId: sc.id,
            loc,
            field: f,
            sample: v.replace(/\n/g, "⏎").slice(0, 80),
          });
        }
      }
    });
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 no-br 검증 (text 필드 내 \\n 금지)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  위반: ${violations.length}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ no-br 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${violations.length}개 강제 개행 검출:`);
  for (const v of violations.slice(0, 15)) {
    console.log(`  - ${v.sceneId} ${v.loc}.data.${v.field} = "${v.sample}"`);
  }
  if (violations.length > 15) console.log(`  ... 외 ${violations.length - 15}개`);
  console.log("");
  console.log(
    "해결: \\n 제거. 한글은 word-break: keep-all 로 자동 줄바꿈. 긴 문장은 분리된 노드로 author."
  );
  process.exit(1);
}

main();
