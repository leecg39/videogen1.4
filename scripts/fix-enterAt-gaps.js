#!/usr/bin/env node
/**
 * sync-enterAt가 만든 갭 문제 수정
 * 헤더(Badge/Kicker, Headline, Divider)는 처음 15%에,
 * 콘텐츠는 20%~80% 구간에 균등 분배
 */
const fs = require("fs");
const path = require("path");

const scenesPath = path.resolve(__dirname, "../data/rag-intro/scenes-v2.json");
const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf-8"));

const HEADER_TYPES = new Set(["Badge", "Kicker", "Pill", "Headline", "Divider"]);

function collectMotionNodes(node, list = []) {
  if (node.motion?.enterAt !== undefined) {
    list.push(node);
  }
  if (node.children) node.children.forEach(c => collectMotionNodes(c, list));
  return list;
}

function fixScene(beat) {
  const s = scenes.find(x => x.beat_index === beat);
  const dur = s.duration_frames;
  const nodes = collectMotionNodes(s.stack_root);

  // 헤더/콘텐츠 분리
  const headers = [];
  const contents = [];
  nodes.forEach(n => {
    if (HEADER_TYPES.has(n.type)) headers.push(n);
    else contents.push(n);
  });

  // 헤더: 0% ~ 10% 구간에 균등 배치
  const headerEnd = Math.round(dur * 0.10);
  headers.sort((a, b) => a.motion.enterAt - b.motion.enterAt);
  headers.forEach((n, i) => {
    n.motion.enterAt = Math.round((i / Math.max(headers.length - 1, 1)) * headerEnd);
  });

  // 콘텐츠: 15% 시작, 최대 갭 120프레임(4초) 보장
  const MAX_GAP = 120; // 4초
  const contentStart = Math.round(dur * 0.15);
  contents.sort((a, b) => a.motion.enterAt - b.motion.enterAt);

  // 이상적 간격: 헤더 마지막부터 씬 80%까지 균등 분배하되 MAX_GAP 이내
  const contentEnd = Math.round(dur * 0.80);
  const idealSpan = contentEnd - contentStart;
  const idealGap = contents.length > 1 ? idealSpan / (contents.length - 1) : 0;
  const effectiveGap = Math.min(idealGap, MAX_GAP);
  const actualEnd = contentStart + effectiveGap * Math.max(contents.length - 1, 0);

  contents.forEach((n, i) => {
    n.motion.enterAt = Math.round(contentStart + effectiveGap * i);
  });

  // 검증
  const all = [...headers, ...contents].sort((a, b) => a.motion.enterAt - b.motion.enterAt);
  let maxGap = 0;
  for (let i = 1; i < all.length; i++) {
    maxGap = Math.max(maxGap, all[i].motion.enterAt - all[i - 1].motion.enterAt);
  }
  console.log(`Beat ${beat}: ${contents.length} content nodes redistributed (15%-80% of ${dur}f). Max gap: ${(maxGap/30).toFixed(1)}s`);
}

// 문제 씬 수정
[9, 19, 20, 21, 25, 32, 5].forEach(fixScene);

fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2));
console.log("\n✅ enterAt 갭 수정 완료");
