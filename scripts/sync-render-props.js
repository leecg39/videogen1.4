#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const scenesPath = process.argv[2];

if (!scenesPath) {
  console.error("Usage: node scripts/sync-render-props.js data/{projectId}/scenes-v2.json");
  process.exit(1);
}

const absoluteScenesPath = path.resolve(scenesPath);
if (!fs.existsSync(absoluteScenesPath)) {
  console.error(`❌ scenes-v2.json not found: ${absoluteScenesPath}`);
  process.exit(1);
}

const dataDir = path.dirname(absoluteScenesPath);
const projectPath = path.join(dataDir, "project.json");
const renderPropsPath = path.join(dataDir, "render-props-v2.json");

if (!fs.existsSync(projectPath)) {
  console.error(`❌ project.json not found: ${projectPath}`);
  process.exit(1);
}

const rawScenes = JSON.parse(fs.readFileSync(absoluteScenesPath, "utf8"));
const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));

// v1.1 guardrail audit round 2 — transition normalization.
// "의도 없는 none" 전환은 Composition.tsx 의 autoSelectTransition (intent 기반 rotation)
// 이 실행되도록 undefined 로 정리한다. 마지막 씬은 그대로 none.
// 명시적 의도는 scene.transition_explicit === true 로 보존.
const scenes = rawScenes.map((sc, i) => {
  const isLast = i === rawScenes.length - 1;
  if (!sc.transition) return sc;
  if (sc.transition_explicit === true) return sc; // 명시적 의도 보존
  if (isLast) {
    // 마지막 씬은 항상 none
    return { ...sc, transition: { type: "none", durationFrames: 0 } };
  }
  const type = sc.transition.type;
  const dur = sc.transition.durationFrames ?? 0;
  if (type === "none" || dur === 0) {
    // autoSelect 가 rotation 적용하도록 undefined 로 날리기
    const { transition, ...rest } = sc;
    return rest;
  }
  return sc;
});

const durationInFrames = scenes.reduce(
  (sum, scene) => sum + Math.max(0, scene.duration_frames || 0),
  0
);

const renderProps = {
  scenes,
  durationInFrames,
  fps: 30,
  width: 1920,
  height: 1080,
  audioSrc: project.audio_path,
};

fs.writeFileSync(renderPropsPath, JSON.stringify(renderProps, null, 2));

// 진단: 몇 개 씬이 autoSelect 로 위임되었는지
const normalizedCount = rawScenes.length - scenes.filter((s) => s.transition).length;
console.log(
  `✅ render-props-v2.json 동기화 완료 (${scenes.length} scenes, ${durationInFrames} frames)`
);
console.log(
  `   [INFO] transition autoSelect 위임: ${normalizedCount} 씬 (의도 없는 none/0 → intent 기반 rotation)`
);
