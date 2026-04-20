#!/usr/bin/env node
// append-density-nodes.js — 직렬화 전용 유틸리티.
// 역할: 사용자가 authoring 한 per-scene 노드들을 기존 SceneRoot.children 끝에 merge-append.
// 금지사항: 이 스크립트는 새로운 stack_root 를 생성하지 않는다. 단지 제공된 JSON 노드를
//           해당 scene_id 의 SceneRoot.children 뒤에 그대로 덧붙인다.
//
// 사용법:
//   node scripts/append-density-nodes.js data/{projectId}/scenes-v2.json additions.json

const fs = require("fs");

const scenesPath = process.argv[2];
const additionsPath = process.argv[3];
if (!scenesPath || !additionsPath) {
  console.error("Usage: node append-density-nodes.js <scenes-v2.json> <additions.json>");
  process.exit(2);
}

const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
const additions = JSON.parse(fs.readFileSync(additionsPath, "utf8"));

let appended = 0;
for (const sc of scenes) {
  const nodes = additions[sc.id];
  if (!nodes || !Array.isArray(nodes)) continue;
  if (!sc.stack_root || !Array.isArray(sc.stack_root.children)) continue;
  sc.stack_root.children = sc.stack_root.children.concat(nodes);
  appended += nodes.length;
}

fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2));
console.log(`✅ appended ${appended} nodes → ${scenesPath}`);

// Remotion 이 읽는 파일은 render-props-v2.json. 동기화 생략 시 stale 파일로 렌더된다.
try {
  const { execSync } = require("child_process");
  execSync(`node scripts/sync-render-props.js "${scenesPath}"`, { stdio: "inherit" });
} catch (err) {
  console.error("⚠️ render-props sync 실패 — 렌더 전에 수동으로 sync 하세요.");
  process.exitCode = 1;
}
