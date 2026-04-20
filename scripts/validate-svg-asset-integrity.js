#!/usr/bin/env node
// validate-svg-asset-integrity.js — HARD GATE: SvgAsset 참조 무결성
//
// 배경: SvgAsset 또는 IconCard 의 icon_asset_id 가 public/svg-library/index.json
// 에 존재하지 않으면 Remotion 렌더 시 "missing asset" 플레이스홀더가 화면에 노출.
//
// 검증:
//   - 씬 내 모든 SvgAsset.data.asset_id / icon_asset_id 가 라이브러리에 등록돼 있는지
//   - 없으면 exit 1 + forge 명령 안내
//
// postprocess.sh ⑥-w 로 삽입.

const fs = require("fs");
const path = require("path");

function loadKnownIds() {
  const p = path.resolve(process.cwd(), "public", "svg-library", "index.json");
  if (!fs.existsSync(p)) return new Set();
  try {
    const idx = JSON.parse(fs.readFileSync(p, "utf8"));
    return new Set((idx.assets || []).map((a) => a.id));
  } catch {
    return new Set();
  }
}

function walk(node, fn, pathArr = []) {
  if (!node || typeof node !== "object") return;
  fn(node, pathArr);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...pathArr, node.type || "?"]));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-svg-asset-integrity.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const known = loadKnownIds();

  const violations = [];
  const missing = new Set();

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n, p) => {
      const d = n.data || {};
      const candidates = [];
      if (n.type === "SvgAsset") candidates.push({ field: "asset_id", value: d.asset_id });
      if (d.icon_asset_id) candidates.push({ field: "icon_asset_id", value: d.icon_asset_id });
      for (const c of candidates) {
        if (typeof c.value !== "string" || !c.value) continue;
        if (!known.has(c.value)) {
          violations.push({
            sceneId: sc.id,
            loc: [...p, n.type].join(">"),
            field: c.field,
            id: c.value,
          });
          missing.add(c.value);
        }
      }
    });
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 svg-asset integrity (svg-library/index.json 참조 검증)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  라이브러리 등록 asset: ${known.size}`);
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  누락 참조: ${violations.length}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ svg-asset integrity 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${violations.length}개 누락 참조 (${missing.size}개 고유 id):`);
  violations.slice(0, 20).forEach((v) => {
    console.log(`  - ${v.sceneId} ${v.loc}.${v.field} = "${v.id}"  (not in library)`);
  });
  if (violations.length > 20) console.log(`  ... 외 ${violations.length - 20}개`);
  console.log("");
  console.log("해결:");
  console.log(`  npx tsx scripts/svg-forge.ts --project ${pathProjectId(file)}`);
  console.log(`  또는 개별:  npx tsx scripts/svg-forge.ts --add <concept>`);
  process.exit(1);
}

function pathProjectId(scenesFile) {
  const dir = path.dirname(scenesFile);
  return path.basename(dir);
}

main();
