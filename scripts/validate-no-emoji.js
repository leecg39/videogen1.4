#!/usr/bin/env node
// validate-no-emoji.js — HARD GATE: 유니코드 이모지 금지
//
// 배경: 시스템 이모지(Apple Color Emoji / Segoe UI Emoji) 는 Remotion 헤드리스
// 브라우저에서 일관된 크기/정렬로 렌더되지 않고, 다크 배경에서 대비도 나쁘다.
// Hyperframes 가드레일 원칙: "시각 출력은 SVG/DevIcon 으로 통일한다".
//
// 검출: data.text / data.title / data.body / data.label / data.subtitle /
//       data.caption / data.centerLabel / SvgGraphic elements[].text /
//       items[].label / steps[].label 등에서 `\p{Extended_Pictographic}` 매칭.
//
// 교체 유도: 이모지 → DevIcon(브랜드/도구) 또는 SvgGraphic path(개념 일러스트).
// 예외: U+2713 ✓ / U+2717 ✗ / U+2022 • 등 단순 기호는 허용.
//
// postprocess.sh ⑥-s 로 삽입.

const fs = require("fs");

// 허용 유니코드 기호 (dingbats 중 단순 체크/불릿)
const ALLOWED = new Set(["✓", "✗", "✔", "✘", "•", "·", "→", "←", "↑", "↓", "—", "–"]);

// 이모지 감지 정규식 — 그래픽 이모지만. Emoji_Component(숫자 0-9) 는 제외.
// keycap sequence(4️⃣ 등)는 별도로 잡기 위해 U+FE0F + U+20E3 조합 추가.
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F3FB}-\u{1F3FF}]|\uFE0F\u20E3/gu;

const SCAN_FIELDS = [
  "text", "title", "body", "subtitle", "desc", "description",
  "label", "caption", "centerLabel", "hook", "claim",
  "leftLabel", "rightLabel", "leftValue", "rightValue",
  "headline", "kicker",
];

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function findEmojis(s) {
  if (typeof s !== "string") return [];
  const hits = [];
  for (const m of s.matchAll(EMOJI_RE)) {
    const ch = m[0];
    if (!ALLOWED.has(ch)) hits.push(ch);
  }
  return hits;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-no-emoji.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const violations = [];

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n, path) => {
      const d = n.data || {};
      const loc = [...path, n.type].join(">");

      for (const f of SCAN_FIELDS) {
        const hits = findEmojis(d[f]);
        if (hits.length) {
          violations.push({ sceneId: sc.id, loc, field: f, emojis: [...new Set(hits)].join(""), sample: String(d[f]).slice(0, 40) });
        }
      }
      // 배열 필드 안의 text/label 도 검사
      for (const arrKey of ["items", "steps", "elements", "lines", "messages", "bullets"]) {
        const arr = d[arrKey];
        if (!Array.isArray(arr)) continue;
        arr.forEach((item, i) => {
          if (typeof item === "string") {
            const hits = findEmojis(item);
            if (hits.length) {
              violations.push({ sceneId: sc.id, loc, field: `${arrKey}[${i}]`, emojis: [...new Set(hits)].join(""), sample: item.slice(0, 40) });
            }
          } else if (item && typeof item === "object") {
            for (const k of Object.keys(item)) {
              if (typeof item[k] !== "string") continue;
              const hits = findEmojis(item[k]);
              if (hits.length) {
                violations.push({ sceneId: sc.id, loc, field: `${arrKey}[${i}].${k}`, emojis: [...new Set(hits)].join(""), sample: item[k].slice(0, 40) });
              }
            }
          }
        });
      }
    });
  }

  const sceneCount = new Set(violations.map((v) => v.sceneId)).size;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 no-emoji 검증 (유니코드 이모지 → DevIcon/SvgGraphic 로 교체 강제)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}  ·  위반 씬: ${sceneCount}  ·  위반 지점: ${violations.length}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ no-emoji 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${violations.length}개 이모지 사용 (${sceneCount}개 씬):`);
  for (const v of violations.slice(0, 20)) {
    console.log(`  - ${v.sceneId}  ${v.loc}.${v.field}  ${v.emojis}  ("${v.sample}")`);
  }
  if (violations.length > 20) console.log(`  ... 외 ${violations.length - 20}개`);
  console.log("");
  console.log(
    "해결: 브랜드/도구 → DevIcon 노드. 개념 일러스트 → SvgGraphic path. 허용 기호는 ✓✗•→ 등 단순 dingbats 만."
  );
  process.exit(1);
}

main();
