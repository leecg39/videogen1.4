#!/usr/bin/env node
// prepare-dsl-subset.js — R8 (a) TSX 분기 preprocess.
//
// scenes-v2.json 을 읽어 두 개 subset 을 생성:
//   1. {input}.dsl-subset.json — TSX wrapper 가 아닌 씬만. DSL 전용 validator 대상.
//   2. {input}.tsx-subset.json — TSX wrapper 인 씬만. TSX AST validator 대상.
//
// TSX wrapper 판정: stack_root.children[0].type === "TSX"
//
// 이 분기는 R7→R8 원칙 A 채택 이후 DSL validator 가 TSX 씬에 false-positive 를
// 발생시키는 것을 막기 위해 필수.

const fs = require("fs");
const path = require("path");

function isTsxWrapper(scene) {
  const root = scene?.stack_root;
  if (!root || root.type !== "SceneRoot") return false;
  const kids = root.children;
  if (!Array.isArray(kids) || kids.length === 0) return false;
  return kids[0].type === "TSX";
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/prepare-dsl-subset.js <scenes-v2.json>");
    process.exit(2);
  }
  const abs = path.resolve(file);
  const raw = fs.readFileSync(abs, "utf8");
  const scenes = JSON.parse(raw);
  if (!Array.isArray(scenes)) {
    console.error("Expected top-level array of scenes.");
    process.exit(2);
  }

  const dslScenes = [];
  const tsxScenes = [];
  for (const s of scenes) {
    if (isTsxWrapper(s)) {
      tsxScenes.push(s);
    } else {
      dslScenes.push(s);
    }
  }

  const base = abs.replace(/\.json$/, "");
  const dslOut = `${base}.dsl-subset.json`;
  const tsxOut = `${base}.tsx-subset.json`;
  fs.writeFileSync(dslOut, JSON.stringify(dslScenes, null, 2));
  fs.writeFileSync(tsxOut, JSON.stringify(tsxScenes, null, 2));

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`TSX 분기 preprocess (원칙 A)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  원본 총 씬: ${scenes.length}`);
  console.log(`  TSX 씬:     ${tsxScenes.length} (${((tsxScenes.length / scenes.length) * 100).toFixed(1)}%) → ${path.basename(tsxOut)}`);
  console.log(`  DSL 씬:     ${dslScenes.length} (${((dslScenes.length / scenes.length) * 100).toFixed(1)}%) → ${path.basename(dslOut)}`);

  // R7 답신 보강 — DSL 씬에 _dsl_rationale 필드 누락 경고
  const missingRationale = dslScenes.filter((s) => !s._dsl_rationale).map((s) => s.id);
  if (missingRationale.length > 0) {
    console.log("");
    console.log(`[WARN] DSL 씬 중 _dsl_rationale 필드 누락: ${missingRationale.length}개`);
    console.log(`  ${missingRationale.slice(0, 10).join(", ")}${missingRationale.length > 10 ? " ..." : ""}`);
    console.log(`  원칙 A 3조건 (순수 데이터 / pattern unique / 감정 비트 없음) 근거 명시 필요.`);
    console.log(`  각 DSL 씬에 _dsl_rationale: { "data_only": "...", "pattern_unique": "...", "no_emotion": "..." } 추가.`);
  }
}

main();
