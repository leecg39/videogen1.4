#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import { parseSRT } from "../src/services/srt-parser";
import { rebuildScenesFromSrt } from "../src/services/scene-sync-validator";

const pid = process.argv[2];
if (!pid) {
  console.error("Usage: rebuild-scenes-from-srt.ts <projectId>");
  process.exit(2);
}

const scenesPath = path.join("data", pid, "scenes-v2.json");
const srtPath = path.join("data", pid, `${pid}.srt`);

const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
const srtText = fs.readFileSync(srtPath, "utf8");
const parsed = parseSRT(srtText);
const srtEntries = parsed.map((e: any) => ({
  start_ms: e.startMs,
  end_ms: e.endMs,
  text: e.text,
}));

const { scenes: fixed, report } = rebuildScenesFromSrt(scenes, srtEntries);
fs.writeFileSync(scenesPath, JSON.stringify(fixed, null, 2));
console.log(report.slice(0, 10).join("\n"));
console.log(`... total ${report.length} adjustments`);
