#!/usr/bin/env node
/**
 * fix-svg-fill.js — SvgGraphic shape 요소의 fill을 제거하고 stroke로 교체
 *
 * 규칙: SVG shape(path/circle/rect/ellipse/polygon/polyline)는 fill 금지.
 *       stroke만 사용, strokeWidth 2~3. text 태그만 fill 허용.
 *
 * 사용법: node scripts/fix-svg-fill.js data/{projectId}/scenes-v2.json
 */

const fs = require("fs");

const SHAPE_TAGS = new Set(["path", "circle", "rect", "line", "ellipse", "polygon", "polyline"]);

function fixElements(elements) {
  let fixed = 0;
  for (const el of elements) {
    if (SHAPE_TAGS.has(el.tag) && el.attrs) {
      const hasFill = el.attrs.fill && el.attrs.fill !== "none";
      if (hasFill) {
        // fill 색상을 stroke로 이동 (stroke가 없으면)
        if (!el.attrs.stroke || el.attrs.stroke === "none") {
          el.attrs.stroke = el.attrs.fill;
        }
        el.attrs.fill = "none";
        if (!el.attrs.strokeWidth) {
          el.attrs.strokeWidth = 2.5;
        }
        fixed++;
      }
    }
    // 재귀: g 태그의 children
    if (el.children && Array.isArray(el.children)) {
      fixed += fixElements(el.children);
    }
  }
  return fixed;
}

function walkNode(node) {
  let fixed = 0;
  if (node.type === "SvgGraphic" && node.data && Array.isArray(node.data.elements)) {
    fixed += fixElements(node.data.elements);
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      fixed += walkNode(child);
    }
  }
  return fixed;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/fix-svg-fill.js <scenes-v2.json>");
  process.exit(1);
}

const scenes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
let totalFixed = 0;

for (const scene of scenes) {
  if (scene.stack_root) {
    totalFixed += walkNode(scene.stack_root);
  }
}

if (totalFixed > 0) {
  fs.writeFileSync(filePath, JSON.stringify(scenes, null, 2), "utf-8");
  console.log(`✅ ${totalFixed}개 SVG shape fill → stroke 교체 완료`);
} else {
  console.log("✅ fill 있는 SVG shape 없음 — 수정 불필요");
}
