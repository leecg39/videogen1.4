#!/usr/bin/env tsx
// migrate-to-phase-ab.ts — 기존 scenes-v2.json 을 Phase A / Phase B 로 분리
//
// 사용법:
//   npx tsx scripts/migrate-to-phase-ab.ts <scenes-v2.json> [--dry-run]
//
// 동작:
//   1. 원본 scenes-v2.json 을 읽음
//   2. 모든 노드의 motion 필드를 path 기준으로 추출 → Phase B diff
//   3. Phase A 버전 (motion 제거) → scenes-v2.<pid>.phase-a.json
//   4. Phase B diff → scenes-v2.<pid>.phase-b.json
//   5. 각 씬에 phase: "A" | "B" 필드 부착
//
// 역방향 merge: scripts/merge-phase-ab.ts (별도)

import * as fs from "node:fs";
import * as path from "node:path";

interface NodeLite {
  id?: string;
  type?: string;
  motion?: any;
  children?: NodeLite[];
  [k: string]: any;
}

interface MotionDiff {
  path: string; // "stack_root.children[0].children[2]" 같은 JSON path
  motion: any;
}

function clonePlain<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function extractMotions(node: NodeLite | undefined, basePath: string, acc: MotionDiff[]) {
  if (!node || typeof node !== "object") return;
  if (node.motion && typeof node.motion === "object" && Object.keys(node.motion).filter((k) => node.motion[k] != null).length > 0) {
    acc.push({ path: basePath, motion: clonePlain(node.motion) });
    delete node.motion;
  }
  const kids = node.children;
  if (Array.isArray(kids)) {
    kids.forEach((c, i) => extractMotions(c, `${basePath}.children[${i}]`, acc));
  }
}

function main() {
  const file = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!file) {
    console.error("Usage: npx tsx scripts/migrate-to-phase-ab.ts <scenes-v2.json> [--dry-run]");
    process.exit(2);
  }
  const absPath = path.resolve(file);
  const raw = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const scenes: any[] = Array.isArray(raw) ? raw : raw.scenes ?? [];

  const phaseADoc: any[] = [];
  const phaseBDoc: any[] = [];

  for (const sc of scenes) {
    const copy = clonePlain(sc);
    const motions: MotionDiff[] = [];
    if (copy.stack_root) {
      extractMotions(copy.stack_root, "stack_root", motions);
    }
    // phase-a: motion 제거된 전체 씬
    copy.phase = "A";
    phaseADoc.push(copy);

    // phase-b: scene id + motions diff + preview_reviewed_at slot
    phaseBDoc.push({
      id: sc.id,
      scene_index: scenes.indexOf(sc),
      motions,
      preview_reviewed_at: null,
    });
  }

  const dir = path.dirname(absPath);
  const basename = path.basename(absPath, ".json");
  const phaseAPath = path.join(dir, `${basename}.phase-a.json`);
  const phaseBPath = path.join(dir, `${basename}.phase-b.json`);

  const totalMotions = phaseBDoc.reduce((s, b) => s + b.motions.length, 0);
  console.log(`migrate-to-phase-ab: ${scenes.length} scenes, ${totalMotions} motion nodes extracted`);
  console.log(`  ${phaseAPath}`);
  console.log(`  ${phaseBPath}`);

  if (dryRun) {
    console.log("[dry-run] no files written");
    return;
  }
  fs.writeFileSync(phaseAPath, JSON.stringify(phaseADoc, null, 2));
  fs.writeFileSync(phaseBPath, JSON.stringify(phaseBDoc, null, 2));
  console.log("✓ migration complete");
}

main();
