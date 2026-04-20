#!/usr/bin/env node
// apply-stack-roots.js — 직렬화 전용 유틸리티
// 역할: 사용자가 authoring한 stack_root override 맵을 scenes-v2.json에 그대로 merge.
// 금지사항: 이 스크립트는 stack_root의 구조/노드 선택에 절대 관여하지 않는다.
//           단지 key=scene_id 로 authored JSON을 그대로 덮어쓴다.
//
// 사용법:
//   node scripts/apply-stack-roots.js data/{projectId}/scenes-v2.json overrides.json

const fs = require("fs");

const scenesPath = process.argv[2];
const overridesPath = process.argv[3];
if (!scenesPath || !overridesPath) {
  console.error("Usage: node apply-stack-roots.js <scenes-v2.json> <overrides.json>");
  process.exit(2);
}

const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));

let applied = 0;
for (const sc of scenes) {
  if (overrides[sc.id]) {
    sc.stack_root = overrides[sc.id];
    sc.transition = { type: "none", durationFrames: 0 };
    applied += 1;
  }
}

fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2));
console.log(`✅ applied ${applied} overrides → ${scenesPath}`);

// Remotion 이 읽는 파일은 render-props-v2.json. 동기화 생략 시 stale 파일로 렌더된다.
try {
  const { execSync } = require("child_process");
  execSync(`node scripts/sync-render-props.js "${scenesPath}"`, { stdio: "inherit" });
} catch (err) {
  console.error("⚠️ render-props sync 실패 — 렌더 전에 수동으로 sync 하세요.");
  process.exitCode = 1;
}
