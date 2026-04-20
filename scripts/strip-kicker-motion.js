#!/usr/bin/env node
/**
 * strip-kicker-motion.js — 모든 Kicker 노드에서 entrance preset 제거
 *
 * Why: 씬 상단 Kicker에 fadeUp 같은 entrance를 넣으면 매 씬마다 24px 위에서
 * 떨어지며 들어와 "흔들거림"으로 인식된다. Kicker는 정적으로 렌더되어야
 * 시청자가 영상의 골격을 안정적으로 인식할 수 있다.
 *
 * 동작: motion.preset / motion.emphasis / motion.duration 제거.
 *       motion.enterAt은 보존 (timing 정보).
 *       다른 노드 타입 (Headline/Stat 등)의 motion은 그대로 유지.
 *
 * Usage: node scripts/strip-kicker-motion.js data/{pid}/scenes-v2.json
 */

const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/strip-kicker-motion.js <scenes-v2.json>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
const scenes = Array.isArray(data) ? data : data.scenes;

let stripped = 0;
function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.type === "Kicker" && node.motion) {
    if (node.motion.preset || node.motion.emphasis) {
      delete node.motion.preset;
      delete node.motion.emphasis;
      delete node.motion.duration;
      // motion이 비어있으면 통째로 제거
      if (Object.keys(node.motion).length === 0) {
        delete node.motion;
      }
      stripped++;
    }
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) walk(c);
  }
}

for (const sc of scenes) {
  if (sc.stack_root) walk(sc.stack_root);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`  strip-kicker-motion: ${stripped} Kicker(s) cleaned`);
