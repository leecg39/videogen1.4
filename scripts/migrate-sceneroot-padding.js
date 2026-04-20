#!/usr/bin/env node
// migrate-sceneroot-padding.js — SceneRoot padding 을 balanced (140/120/160) 로 일괄 교체
//
// 배경: 2026-04-17 세션에서 scene_001 등 "수직 center 미작동" = top-heavy.
// 원인: 기존 authored 씬들이 SceneRoot.layout.padding 을 "60px 100px 140px" 로 명시.
// top/bottom 비대칭 (60 vs 140) → content center 가 viewport center 보다 40px 위로 쏠림.
//
// Fix: 모든 씬의 SceneRoot padding 을 "140px 120px 160px" 로 통일.
// (top=140, right/left=120, bottom=160) → subtitle safe 160, top padding 140 으로 balanced center.

const fs = require("fs");

const NEW_PADDING = "140px 120px 160px";
const OLD_PATTERNS = [
  "60px 100px 140px",
  "60px 120px 140px",
  "60px 100px 160px",
  "60px 120px 160px",
  "80px 100px 140px",
  "80px 120px 140px",
];

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node migrate-sceneroot-padding.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = 0;
  for (const sc of scenes) {
    const root = sc.stack_root;
    if (!root || root.type !== "SceneRoot") continue;
    if (!root.layout) root.layout = {};
    const cur = root.layout.padding;
    if (OLD_PATTERNS.includes(cur) || !cur) {
      root.layout.padding = NEW_PADDING;
      changed += 1;
    }
  }
  fs.writeFileSync(file, JSON.stringify(scenes, null, 2) + "\n");
  console.log(`✅ SceneRoot padding 마이그레이션 완료: ${changed}/${scenes.length} 씬 업데이트 → "${NEW_PADDING}"`);
}

main();
