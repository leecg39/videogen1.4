#!/usr/bin/env node
// validate-absolute-bbox.js — HARD GATE: Absolute 정렬 위반 검출
//
// Hyperframes 가드레일 원칙: "컨테이너 없는 flat flow 는 정렬 망가짐 신호".
// 실측: scene-70 Absolute 아래에 9개 FreeText 가 Stack 없이 평행으로 배치 → 시스템
// 기본 flow 로 흘러서 x/y 가 제각각.
//
// 검증 A (flow-collapse):
//   Absolute 직접 자식 중 Stack/Grid/Split/컨테이너가 없고 leaf(FreeText/Badge/
//   Headline/Kicker/BodyText/DevIcon/SvgGraphic 등) 가 ≥ 2 개 → FAIL.
//   (단일 자식은 장식 역할 허용.)
//
// 검증 B (bbox-overlap):
//   같은 부모 아래 Absolute 형제 중 layout.{x,y,width,height} 또는 {top,left,width,height}
//   가 명시된 페어의 IoU > 0.15 → FAIL.
//
// postprocess.sh ⑥-u 로 삽입.

const fs = require("fs");

const CONTAINER_TYPES = new Set([
  "Stack", "Grid", "Split", "RowStack", "ColumnStack", "Flex", "FlexBox",
  "VerticalStack", "HorizontalStack", "Cluster", "Bento",
]);

// Absolute 자식이 단일이면 허용되는 "장식" 타입 (전체 화면 배경/글로우 등)
const SINGLE_CHILD_ALLOWED = new Set([
  "AmbientBackground", "AccentGlow", "NoiseTexture", "Gradient", "BackgroundImage",
  "VideoCanvas", "VideoClip", "ImageAsset",
]);

function getBBox(node) {
  const l = node.layout || {};
  const x = l.x ?? l.left;
  const y = l.y ?? l.top;
  const w = l.width;
  const h = l.height;
  if (
    typeof x === "number" && typeof y === "number" &&
    typeof w === "number" && typeof h === "number" &&
    w > 0 && h > 0
  ) {
    return { x, y, w, h };
  }
  return null;
}

function iou(a, b) {
  const ax2 = a.x + a.w, ay2 = a.y + a.h;
  const bx2 = b.x + b.w, by2 = b.y + b.h;
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni > 0 ? inter / uni : 0;
}

function isLeaf(n) {
  if (!n || typeof n !== "object") return false;
  if (CONTAINER_TYPES.has(n.type)) return false;
  if (n.type === "Absolute") return false;
  if (n.type === "SceneRoot") return false;
  return true;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-absolute-bbox.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const flowCollapse = [];
  const overlaps = [];

  function walk(node, sceneId, path = []) {
    if (!node || typeof node !== "object") return;
    const kids = Array.isArray(node.children) ? node.children : [];

    // 검증 A: Absolute > leaf 다수 (컨테이너 누락)
    if (node.type === "Absolute" && kids.length >= 2) {
      const leaves = kids.filter(isLeaf);
      const hasContainer = kids.some((c) => CONTAINER_TYPES.has(c?.type));
      if (!hasContainer && leaves.length >= 2) {
        // 예외: 모든 leaf 가 "장식" 타입 이거나, 단일만 있는 경우 허용
        const allDecor = leaves.every((l) => SINGLE_CHILD_ALLOWED.has(l.type));
        if (!allDecor) {
          flowCollapse.push({
            sceneId,
            loc: [...path, "Absolute"].join(">"),
            leafCount: leaves.length,
            leafTypes: leaves.map((l) => l.type).slice(0, 6),
            sample: (leaves.find((l) => l.data?.text)?.data?.text || "").slice(0, 30),
          });
        }
      }
    }

    // 검증 B: 형제 Absolute 간 bbox overlap
    const absoluteSiblings = kids.filter((c) => c?.type === "Absolute" && getBBox(c));
    for (let i = 0; i < absoluteSiblings.length; i++) {
      for (let j = i + 1; j < absoluteSiblings.length; j++) {
        const a = getBBox(absoluteSiblings[i]);
        const b = getBBox(absoluteSiblings[j]);
        if (!a || !b) continue;
        const o = iou(a, b);
        if (o > 0.15) {
          overlaps.push({
            sceneId,
            loc: [...path, node.type || "?"].join(">"),
            iou: Number(o.toFixed(3)),
            a,
            b,
          });
        }
      }
    }

    kids.forEach((c) => walk(c, sceneId, [...path, node.type || "?"]));
  }

  scenes.forEach((sc) => walk(sc.stack_root, sc.id));

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 absolute-bbox 검증 (flow-collapse + bbox overlap)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  flow-collapse (컨테이너 누락): ${flowCollapse.length}`);
  console.log(`  bbox overlap (IoU > 0.15): ${overlaps.length}`);

  if (flowCollapse.length === 0 && overlaps.length === 0) {
    console.log("");
    console.log("✅ absolute-bbox 검증 통과.");
    process.exit(0);
  }

  if (flowCollapse.length > 0) {
    console.log("");
    console.log(`❌ [FAIL] flow-collapse ${flowCollapse.length}개 (Absolute 직접 자식에 Stack/Grid 없음):`);
    flowCollapse.slice(0, 15).forEach((f) => {
      console.log(`  - ${f.sceneId}  ${f.loc}  leaves=${f.leafCount} [${f.leafTypes.join(",")}]  sample="${f.sample}"`);
    });
    if (flowCollapse.length > 15) console.log(`  ... 외 ${flowCollapse.length - 15}개`);
  }

  if (overlaps.length > 0) {
    console.log("");
    console.log(`❌ [FAIL] bbox overlap ${overlaps.length}개 (IoU > 0.15):`);
    overlaps.slice(0, 10).forEach((o) => {
      console.log(`  - ${o.sceneId}  ${o.loc}  IoU=${o.iou}  A=${JSON.stringify(o.a)}  B=${JSON.stringify(o.b)}`);
    });
    if (overlaps.length > 10) console.log(`  ... 외 ${overlaps.length - 10}개`);
  }

  console.log("");
  console.log(
    "해결: Absolute 안에 Stack/Grid/Split 컨테이너를 넣고 자식을 그 아래로 이동. Absolute 를 직접 여러 장 겹치지 말 것."
  );
  process.exit(1);
}

main();
