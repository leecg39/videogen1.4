#!/usr/bin/env node
// validate-absolute-content.js — Scene Grammar Section 3 강제
//
// Absolute 는 장식 전용. 허용 자식 화이트리스트:
//   AccentGlow · AccentRing · AmbientBackground · NoiseTexture · Gradient ·
//   Backplate · SvgGraphic (textless) · ImageAsset (role: "bg") · Stack · Grid ·
//   Split · FrameBox (레이아웃 자식 허용)
//
// 금지: FreeText / Badge / Headline / BodyText / Kicker / FooterCaption /
//       ImpactStat / RingChart / CompareBars 등 콘텐츠 노드 직접 자식.
//
// 위반 씬 > 5% 이면 exit 1.
// postprocess ⑥-zc 로 삽입.

const fs = require("fs");

const ALLOWED_ABSOLUTE_CHILD = new Set([
  "AccentGlow", "AccentRing", "AmbientBackground", "NoiseTexture",
  "Gradient", "Backplate", "SvgGraphic",
  "Stack", "Grid", "Split", "FrameBox", "Overlay", "AnchorBox", "Cluster", "Bento",
  "ImageAsset",  // role:"bg" 검사 필요
  "VideoClip", "VideoCanvas",
]);

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-absolute-content.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const violations = [];

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n, path) => {
      if (n.type !== "Absolute") return;
      const kids = n.children || [];
      for (const c of kids) {
        if (!ALLOWED_ABSOLUTE_CHILD.has(c.type)) {
          violations.push({
            sceneId: sc.id, loc: [...path, "Absolute"].join(">"), childType: c.type,
          });
        } else if (c.type === "SvgGraphic") {
          // text-less 검사: elements 에 tag:"text" 금지
          const els = c.data?.elements || [];
          if (els.some((e) => e.tag === "text")) {
            violations.push({ sceneId: sc.id, loc: [...path, "Absolute"].join(">"), childType: "SvgGraphic(text)", reason: "SVG text in Absolute" });
          }
        } else if (c.type === "ImageAsset") {
          // role:"bg" 아닌 ImageAsset 은 의미 노드
          if (c.data?.role !== "bg") {
            violations.push({ sceneId: sc.id, loc: [...path, "Absolute"].join(">"), childType: "ImageAsset(non-bg)", reason: "ImageAsset without role:bg" });
          }
        }
      }
    });
  }

  const scenesWithViol = new Set(violations.map((v) => v.sceneId));
  const pct = scenes.length > 0 ? (scenesWithViol.size / scenes.length) * 100 : 0;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 absolute-content 검증 (Absolute 는 장식 전용)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}  위반 씬: ${scenesWithViol.size} (${pct.toFixed(1)}%)  위반 지점: ${violations.length}`);

  if (pct <= 5) {
    console.log("");
    console.log("✅ absolute-content 통과.");
    process.exit(0);
  }
  console.log("");
  console.log(`❌ [FAIL] ${scenesWithViol.size}개 씬이 Absolute 에 금지 자식 배치 (${pct.toFixed(1)}% > 5%):`);
  violations.slice(0, 15).forEach((v) => console.log(`  - ${v.sceneId} ${v.loc} child=${v.childType}${v.reason ? " ("+v.reason+")" : ""}`));
  if (violations.length > 15) console.log(`  ... 외 ${violations.length - 15}개`);
  console.log("");
  console.log("해결: Absolute 안에 Stack/Grid 컨테이너를 추가하고 콘텐츠 노드는 그 안으로 이동.");
  process.exit(1);
}

main();
