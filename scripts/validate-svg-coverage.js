#!/usr/bin/env node
// validate-svg-coverage.js — SVG Forge 사용 비율 검증 (라이브러리 이전 유도)
//
// 배경: SvgGraphic.elements[] 직접 작성이 많을수록 재활용 불가. SvgAsset 라이브러리
// 참조가 많을수록 품질 일관성 상승. 30% 초과 warning, 50% 초과 시 exit 1.
//
// 지표:
//   - svgGraphicScenes: SvgGraphic.elements 를 직접 쓴 씬 수
//   - svgAssetScenes: SvgAsset 참조 씬 수
//   - total: 전체 씬 수
//   - direct_ratio = svgGraphicScenes / total
//   - asset_ratio  = svgAssetScenes  / total
//
// postprocess.sh ⑥-x 로 삽입.

const fs = require("fs");

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-svg-coverage.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  let svgGraphicScenes = 0;
  let svgAssetScenes = 0;
  let devIconScenes = 0;
  let svgIconScenes = 0;
  let elementsTotal = 0;
  let assetRefsTotal = 0;

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    let hasGraphic = false, hasAsset = false, hasDev = false, hasSvgIcon = false;
    walk(sc.stack_root, (n) => {
      if (n.type === "SvgGraphic") {
        hasGraphic = true;
        const els = n.data?.elements;
        if (Array.isArray(els)) elementsTotal += els.length;
      }
      if (n.type === "SvgAsset") {
        hasAsset = true;
        assetRefsTotal++;
      }
      if (n.type === "DevIcon") hasDev = true;
      if (n.type === "IconCard" && n.data?.icon_asset_id) {
        hasAsset = true; assetRefsTotal++;
      }
      if (n.type === "IconCard" && !n.data?.icon_asset_id) hasSvgIcon = true;
    });
    if (hasGraphic) svgGraphicScenes++;
    if (hasAsset) svgAssetScenes++;
    if (hasDev) devIconScenes++;
    if (hasSvgIcon) svgIconScenes++;
  }

  const total = scenes.length;
  const directRatio = total > 0 ? svgGraphicScenes / total : 0;
  const assetRatio = total > 0 ? svgAssetScenes / total : 0;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 svg-coverage (SvgGraphic 직접작성 비율 제한)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${total}`);
  console.log(`  SvgAsset 참조 씬: ${svgAssetScenes} (${(assetRatio * 100).toFixed(1)}%) · 총 참조 ${assetRefsTotal}`);
  console.log(`  DevIcon 사용 씬:  ${devIconScenes}`);
  console.log(`  SvgIcon(IconCard) 씬: ${svgIconScenes}`);
  console.log(`  SvgGraphic.elements 직접 씬: ${svgGraphicScenes} (${(directRatio * 100).toFixed(1)}%) · 총 elements ${elementsTotal}`);

  const warnings = [];
  const failures = [];

  if (directRatio > 0.5) {
    failures.push(
      `[svg:coverage] SvgGraphic.elements 직접 씬 비율 ${(directRatio * 100).toFixed(1)}% > 50%. ` +
      `재사용 가능한 scene-agnostic 그래픽을 svg-library 로 이전하여 SvgAsset 노드로 교체.`
    );
  } else if (directRatio > 0.3) {
    warnings.push(
      `[svg:coverage] SvgGraphic.elements 직접 씬 비율 ${(directRatio * 100).toFixed(1)}% > 30%. 라이브러리 이전 검토.`
    );
  }

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ svg-coverage 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 coverage 위반:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  console.log("");
  console.log("해결: npx tsx scripts/svg-forge.ts --add <concept> 으로 에셋 제작 후 SvgAsset 로 교체.");
  process.exit(1);
}

main();
