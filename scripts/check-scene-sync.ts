#!/usr/bin/env npx tsx
/**
 * check-scene-sync.ts — scenes-v2.json과 SRT의 동기화 검증
 *
 * 사용법:
 *   npx tsx scripts/check-scene-sync.ts data/{pid}/scenes-v2.json output/{pid}.srt
 *   npx tsx scripts/check-scene-sync.ts {pid}                    # 자동 경로 추론
 *
 * Exit code:
 *   0 — 동기화 OK
 *   1 — drift 발견
 */

import * as fs from "fs";
import * as path from "path";
import { validateSceneSync, type Scene, type SrtEntry } from "../src/services/scene-sync-validator";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: check-scene-sync.ts <projectId | scenes-v2.json> [srt-path]");
  process.exit(2);
}

let scenesPath: string;
let srtPath: string;
if (arg.endsWith(".json")) {
  scenesPath = arg;
  srtPath = process.argv[3] ?? "";
} else {
  // projectId
  scenesPath = path.join("data", arg, "scenes-v2.json");
  // SRT 후보: output/{pid}.srt → data/{pid}/{pid}.srt
  const candidates = [
    path.join("output", `${arg}.srt`),
    path.join("data", arg, `${arg}.srt`),
  ];
  srtPath = candidates.find((p) => fs.existsSync(p)) ?? "";
}

if (!srtPath || !fs.existsSync(srtPath)) {
  console.error(`❌ SRT 파일을 찾지 못함. 두 번째 인자로 명시: ${srtPath}`);
  process.exit(2);
}

function parseSrt(p: string): SrtEntry[] {
  const raw = fs.readFileSync(p, "utf-8").trim();
  const out: SrtEntry[] = [];
  for (const block of raw.split(/\n\n+/)) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const m = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/,
    );
    if (!m) continue;
    const v = m.slice(1).map(Number);
    out.push({
      start_ms: v[0] * 3600000 + v[1] * 60000 + v[2] * 1000 + v[3],
      end_ms: v[4] * 3600000 + v[5] * 60000 + v[6] * 1000 + v[7],
      text: lines.slice(2).join(" ").trim(),
    });
  }
  return out;
}

const scenesData = JSON.parse(fs.readFileSync(scenesPath, "utf-8"));
const scenes: Scene[] = Array.isArray(scenesData) ? scenesData : scenesData.scenes;
const srt = parseSrt(srtPath);

console.log(`scenes: ${scenes.length} from ${scenesPath}`);
console.log(`srt entries: ${srt.length} from ${srtPath}`);

const issues = validateSceneSync(scenes, srt);
if (issues.length === 0) {
  console.log("✅ scene-SRT sync OK");
  process.exit(0);
}

console.log(`\n❌ ${issues.length} sync issue(s) found:`);
const byType: Record<string, number> = {};
for (const i of issues) byType[i.type] = (byType[i.type] || 0) + 1;
console.log("  by type:", byType);
console.log();
for (const i of issues.slice(0, 30)) {
  console.log(
    `  [${i.type}] ${i.scene_id}: drift ${i.drift_ms > 0 ? "+" : ""}${i.drift_ms}ms — ${i.detail}`,
  );
}
if (issues.length > 30) console.log(`  ... +${issues.length - 30} more`);
console.log();
console.log("💡 복구: rebuildScenesFromSrt() 또는 /vg-chunk + /vg-scene 재실행 후 /vg-layout로 stack_root 재적용");
process.exit(1);
