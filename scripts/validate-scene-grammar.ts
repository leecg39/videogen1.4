#!/usr/bin/env tsx
// validate-scene-grammar.ts — 메타 러너
//
// scene-grammar.md Section 11 "제출 전 자가 검증" 을 한 번에 돌리는 러너.
// 14개 가드 중 scenes-v2 를 대상으로 하는 것을 일괄 실행하고,
// --scene 옵션이 주어지면 vg-preview-still 도 같이 돈다.
//
// 사용법:
//   npx tsx scripts/validate-scene-grammar.ts <scenes-v2.json>
//   npx tsx scripts/validate-scene-grammar.ts <scenes-v2.json> --scene 3
//
// 종료 코드:
//   0 = 모두 통과
//   1 = 하나 이상 FAIL
//   2 = 사용법 오류

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

type GuardResult = {
  name: string;
  cmd: string;
  status: "pass" | "fail" | "skip";
  code: number;
  tail: string;
};

const ROOT = path.resolve(__dirname, "..");
const SCRIPTS = path.join(ROOT, "scripts");

function exists(p: string) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function run(label: string, bin: string, args: string[]): GuardResult {
  if (!exists(args[0] ?? "")) {
    // 첫 인자가 경로인 경우 존재 체크 (phase/label 등은 스크립트가 자체 판단)
  }
  const r = spawnSync(bin, args, { cwd: ROOT, encoding: "utf8" });
  const stdout = (r.stdout || "") + (r.stderr || "");
  const tail = stdout.split("\n").slice(-8).join("\n");
  const code = r.status ?? 0;
  let status: GuardResult["status"] = "pass";
  if (code === 0) status = "pass";
  else if (code === 2) status = "skip";
  else status = "fail";
  return { name: label, cmd: `${bin} ${args.join(" ")}`, status, code, tail };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1 || argv[0].startsWith("--")) {
    console.error("Usage: npx tsx scripts/validate-scene-grammar.ts <scenes-v2.json> [--scene N]");
    process.exit(2);
  }
  const scenesFile = path.resolve(argv[0]);
  if (!exists(scenesFile)) {
    console.error(`❌ File not found: ${scenesFile}`);
    process.exit(2);
  }
  const sceneFlag = argv.indexOf("--scene");
  const sceneNum = sceneFlag >= 0 ? argv[sceneFlag + 1] : null;

  const projectDir = path.dirname(scenesFile);
  const scenePlan = path.join(projectDir, "scene-plan.json");
  const videoSpec = path.join(projectDir, "video-spec.json");
  const demoSpec = path.join(projectDir, "demo-spec.json");

  const guards: Array<{ name: string; bin: string; args: string[]; optional?: boolean }> = [
    { name: "phase-separation", bin: "node", args: [path.join(SCRIPTS, "validate-phase-separation.js"), scenesFile] },
    { name: "determinism", bin: "node", args: [path.join(SCRIPTS, "validate-determinism.js")] },
    { name: "no-exit-anim", bin: "node", args: [path.join(SCRIPTS, "validate-no-exit-anim.js"), scenesFile] },
    { name: "motion-variety", bin: "node", args: [path.join(SCRIPTS, "validate-motion-variety.js"), scenesFile] },
    { name: "no-br", bin: "node", args: [path.join(SCRIPTS, "validate-no-br.js"), scenesFile] },
    { name: "tabular", bin: "node", args: [path.join(SCRIPTS, "validate-tabular.js")] },
    { name: "text-length", bin: "node", args: [path.join(SCRIPTS, "validate-text-length.js"), scenesFile] },
    { name: "progression", bin: "node", args: [path.join(SCRIPTS, "validate-progression.js"), scenesFile] },
    { name: "slide-archetype", bin: "node", args: [path.join(SCRIPTS, "validate-slide-archetype.js"), scenesFile] },
    { name: "svg-motif-count", bin: "node", args: [path.join(SCRIPTS, "validate-svg-motif-count.js"), exists(scenePlan) ? scenePlan : scenesFile] },
    { name: "no-emoji", bin: "node", args: [path.join(SCRIPTS, "validate-no-emoji.js"), scenesFile] },
    { name: "freetext-cap", bin: "node", args: [path.join(SCRIPTS, "validate-freetext-cap.js"), scenesFile] },
    { name: "absolute-bbox", bin: "node", args: [path.join(SCRIPTS, "validate-absolute-bbox.js"), scenesFile] },
    { name: "frame-pixels", bin: "node", args: [path.join(SCRIPTS, "validate-frame-pixels.js"), path.join(ROOT, "output", "full-frames")], optional: true },
    { name: "label-quality", bin: "node", args: [path.join(SCRIPTS, "validate-label-quality.js"), scenesFile], optional: true },
    { name: "node-uniqueness", bin: "node", args: [path.join(SCRIPTS, "validate-node-uniqueness.js"), scenesFile], optional: true },
    { name: "fidelity", bin: "node", args: [path.join(SCRIPTS, "validate-fidelity.js"), scenesFile], optional: true },
    { name: "layout-diversity", bin: "node", args: [path.join(SCRIPTS, "validate-layout-diversity.js"), scenesFile], optional: true },
    { name: "visual-plan-coverage", bin: "node", args: [path.join(SCRIPTS, "validate-visual-plan-coverage.js"), scenesFile], optional: true },
  ];

  // narration-sync 는 spec 이 있을 때만
  if (exists(videoSpec)) {
    guards.push({ name: "narration-sync(video)", bin: "node", args: [path.join(SCRIPTS, "validate-narration-sync.js"), videoSpec] });
    guards.push({ name: "sfx-volume", bin: "node", args: [path.join(SCRIPTS, "validate-sfx-volume.js"), scenesFile, videoSpec] });
  }
  if (exists(demoSpec)) {
    guards.push({ name: "narration-sync(demo)", bin: "node", args: [path.join(SCRIPTS, "validate-narration-sync.js"), demoSpec] });
    guards.push({ name: "sfx-volume", bin: "node", args: [path.join(SCRIPTS, "validate-sfx-volume.js"), scenesFile, demoSpec] });
  }

  // Phase A preview-still (scene 지정된 경우)
  if (sceneNum != null && exists(path.join(SCRIPTS, "vg-preview-still.ts"))) {
    guards.unshift({
      name: "preview-still",
      bin: "npx",
      args: ["tsx", path.join(SCRIPTS, "vg-preview-still.ts"), path.basename(projectDir), "--scene", sceneNum, "--time", "hero"],
    });
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🧭 scene-grammar 메타 러너 — ${path.relative(ROOT, scenesFile)}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results: GuardResult[] = [];
  for (const g of guards) {
    const scriptPath = g.args.find((a) => a.endsWith(".js") || a.endsWith(".ts"));
    if (scriptPath && !exists(scriptPath)) {
      if (!g.optional) {
        results.push({ name: g.name, cmd: `${g.bin} ${g.args.join(" ")}`, status: "fail", code: 127, tail: `missing script: ${scriptPath}` });
      } else {
        results.push({ name: g.name, cmd: `${g.bin} ${g.args.join(" ")}`, status: "skip", code: 0, tail: "(optional script not found)" });
      }
      continue;
    }
    process.stdout.write(`  · ${g.name.padEnd(24)} `);
    const r = run(g.name, g.bin, g.args);
    results.push(r);
    const mark = r.status === "pass" ? "✅" : r.status === "skip" ? "⚪" : "❌";
    console.log(`${mark} (exit=${r.code})`);
  }

  const failed = results.filter((r) => r.status === "fail");

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🧭 요약 — pass ${results.filter((r) => r.status === "pass").length} · skip ${results.filter((r) => r.status === "skip").length} · fail ${failed.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (failed.length === 0) {
    console.log("");
    console.log("✅ scene-grammar 전체 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ ${failed.length}개 가드 실패:`);
  for (const f of failed) {
    console.log(`\n  ▼ ${f.name} (exit=${f.code})`);
    f.tail.split("\n").forEach((line) => console.log(`    ${line}`));
  }
  process.exit(1);
}

main();
