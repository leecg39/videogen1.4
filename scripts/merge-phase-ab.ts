#!/usr/bin/env tsx
// merge-phase-ab.ts — scenes-v2.<pid>.phase-a.json + phase-b.json → scenes-v2.json
//
// Phase A (레이아웃) 승인 + preview PNG Read 후 Phase B (motion diff) 를 재주입.
// 각 씬에 preview_reviewed_at 타임스탬프 보존.
//
// 사용법:
//   npx tsx scripts/merge-phase-ab.ts <project_dir>
//     e.g. npx tsx scripts/merge-phase-ab.ts data/vibe-news-0407

import * as fs from "node:fs";
import * as path from "node:path";

interface MotionDiff { path: string; motion: any; }

function setByPath(scene: any, nodePath: string, motion: any) {
  // nodePath: "stack_root" or "stack_root.children[0].children[2]"
  const parts = nodePath.replace(/\]/g, "").split(/\.|\[/).filter(Boolean);
  let node: any = scene;
  for (const p of parts) {
    if (/^\d+$/.test(p)) node = node[Number(p)];
    else node = node?.[p];
    if (!node) return;
  }
  node.motion = motion;
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: npx tsx scripts/merge-phase-ab.ts <project_dir>");
    process.exit(2);
  }
  const scenesPath = path.join(dir, "scenes-v2.json");
  const phaseAPath = path.join(dir, "scenes-v2.phase-a.json");
  const phaseBPath = path.join(dir, "scenes-v2.phase-b.json");

  if (!fs.existsSync(phaseAPath) || !fs.existsSync(phaseBPath)) {
    console.error("❌ phase-a.json / phase-b.json 없음. migrate-to-phase-ab 먼저.");
    process.exit(1);
  }
  const phaseA = JSON.parse(fs.readFileSync(phaseAPath, "utf8"));
  const phaseB = JSON.parse(fs.readFileSync(phaseBPath, "utf8"));

  const merged = phaseA.map((sc: any, i: number) => {
    const diff = phaseB[i];
    if (!diff) return sc;
    const copy = JSON.parse(JSON.stringify(sc));
    for (const m of diff.motions as MotionDiff[]) {
      setByPath(copy, m.path, m.motion);
    }
    copy.phase = "B";
    if (diff.preview_reviewed_at) copy.preview_reviewed_at = diff.preview_reviewed_at;
    return copy;
  });

  fs.writeFileSync(scenesPath, JSON.stringify(merged, null, 2));
  console.log(`✓ merged ${merged.length} scenes → ${scenesPath}`);
}

main();
