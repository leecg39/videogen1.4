#!/usr/bin/env node
/**
 * normalize-stack-nodes.js — StackNode 플랫 구조를 표준 중첩 구조로 변환
 *
 * vg-layout이 {type:"Headline", text:"...", enterAt:4} 형태(플랫)로 생성하면
 * 렌더러가 node.data.text / node.motion.enterAt을 찾지 못해 빈 화면이 됨.
 *
 * 이 스크립트는 표준 키(id, type, layout, style, motion, data, children 등)
 * 외의 모든 속성을 data 객체로, enterAt을 motion.enterAt으로 이동시킨다.
 *
 * 사용법: node scripts/normalize-stack-nodes.js data/{projectId}/scenes-v2.json
 */

const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/normalize-stack-nodes.js <scenes-v2.json>");
  process.exit(1);
}

const STANDARD_KEYS = new Set([
  "id", "type", "layout", "style", "motion", "data", "children",
  "condition", "variant", "visible", "zIndex", "role",
]);

const CONTAINER_TYPES = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "FrameBox",
  "Overlay", "AnchorBox", "SafeArea", "ScatterLayout",
]);

const CONTAINER_LAYOUT_KEYS = new Set([
  "gap", "columns", "direction", "width", "height", "maxWidth",
  "ratio", "padding", "align", "justify",
]);

function normalizeNode(node) {
  if (!node || typeof node !== "object") return node;

  const result = {};
  const dataObj = node.data ? { ...node.data } : {};
  const motionObj = node.motion ? { ...node.motion } : {};
  let hasExtraData = false;
  let hasExtraMotion = false;

  for (const [key, val] of Object.entries(node)) {
    if (key === "children") {
      result.children = val.map(normalizeNode);
    } else if (key === "enterAt") {
      motionObj.enterAt = val;
      hasExtraMotion = true;
    } else if (key === "data" || key === "motion" || key === "layout" || key === "style") {
      result[key] = val;
    } else if (STANDARD_KEYS.has(key)) {
      result[key] = val;
    } else if (CONTAINER_TYPES.has(node.type) && CONTAINER_LAYOUT_KEYS.has(key)) {
      if (!result.layout) result.layout = { ...(node.layout || {}) };
      result.layout[key] = val;
    } else {
      dataObj[key] = val;
      hasExtraData = true;
    }
  }

  if (hasExtraData || Object.keys(dataObj).length > 0) {
    result.data = dataObj;
  }
  if (hasExtraMotion || Object.keys(motionObj).length > 0) {
    if (!motionObj.preset) motionObj.preset = "fadeUp";
    if (!motionObj.duration) motionObj.duration = 15;
    // Validate motion preset against supported list
    if (motionObj.preset && !SUPPORTED_PRESETS.has(motionObj.preset)) {
      console.warn(`  ⚠ Unknown preset "${motionObj.preset}" on ${node.type}:${node.id} → fallback to "fadeUp"`);
      motionObj.preset = "fadeUp";
    }
    result.motion = motionObj;
  }

  return result;
}

// Supported motion presets from StackRenderer.tsx computeMotionStyle()
const SUPPORTED_PRESETS = new Set([
  "fadeUp", "popNumber", "popBadge", "staggerChildren", "fadeIn",
  "drawConnector", "wipeBar", "slideSplit", "scaleIn", "blurIn",
  "bounceUp", "rotateIn", "zoomBlur", "dropIn", "flipUp",
  "expandCenter", "slideReveal", "swoopLeft", "swoopRight",
  "elasticPop", "riseRotate", "glowIn", "splitReveal",
  "shakeIn", "impactPop", "wipeRight", "stampIn", "revealUp",
]);

const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
let fixed = 0;

for (const scene of scenes) {
  if (!scene.stack_root) continue;
  const before = JSON.stringify(scene.stack_root);
  scene.stack_root = normalizeNode(scene.stack_root);
  if (before !== JSON.stringify(scene.stack_root)) fixed++;
}

fs.writeFileSync(file, JSON.stringify(scenes, null, 2));
console.log(`  normalize-stack-nodes: ${fixed}/${scenes.length} scenes normalized`);
