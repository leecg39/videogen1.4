#!/usr/bin/env node
// validate-text-length.js — HARD GATE: VersusCard / ImpactStat 텍스트 길이
//
// vg-layout SKILL.md:309,313
//   - VersusCard.leftValue / rightValue: 16자 이상 → exit 1
//   - ImpactStat.value + suffix 합쳐 9자 이상 → exit 1 (프레임 overflow)
// 추가:
//   - VersusCard.leftLabel / rightLabel: 20자 이상 경고
//   - Kicker.text: 30자 이상 경고 (레이아웃 위치 상단이라 overflow 민감)
//
// postprocess.sh ⑥-m 로 삽입.

const fs = require("fs");

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function graphemeLen(s) {
  if (typeof s !== "string") return 0;
  // 이모지/조합 문자 보정용 — 단순 길이보다 Array.from 의 code point 수가 정확
  return [...s].length;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-text-length.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const failures = [];
  const warnings = [];

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n, path) => {
      const d = n.data || {};
      const loc = `${sc.id} ${[...path, n.type].join(">")}`;

      if (n.type === "VersusCard") {
        for (const key of ["leftValue", "rightValue"]) {
          const len = graphemeLen(d[key]);
          if (len >= 16) {
            failures.push(
              `[text:versus-value] ${loc}.${key} = "${d[key]}" (${len}자 ≥ 16)`
            );
          }
        }
        for (const key of ["leftLabel", "rightLabel"]) {
          const len = graphemeLen(d[key]);
          if (len >= 20) {
            warnings.push(`[text:versus-label] ${loc}.${key} = "${d[key]}" (${len}자 ≥ 20)`);
          }
        }
      }

      if (n.type === "ImpactStat") {
        const val = d.value != null ? String(d.value) : "";
        const suf = d.suffix != null ? String(d.suffix) : "";
        const combined = val + suf;
        const len = graphemeLen(combined);
        if (len >= 9) {
          failures.push(
            `[text:impact-stat] ${loc}  value+suffix = "${combined}" (${len}자 ≥ 9)`
          );
        }
      }

      if (n.type === "Kicker") {
        const len = graphemeLen(d.text);
        if (len >= 30) {
          warnings.push(`[text:kicker] ${loc}.text = "${d.text}" (${len}자 ≥ 30)`);
        }
      }
    });
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 text length 검증 (VersusCard / ImpactStat 텍스트 오버플로우 방지)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  FAIL: ${failures.length}  WARN: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... 외 ${warnings.length - 10}개`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ text length 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 텍스트 길이 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: VersusCard value ≤15자, ImpactStat value+suffix ≤8자로 단축. 긴 서술은 label 로 이동."
  );
  process.exit(1);
}

main();
