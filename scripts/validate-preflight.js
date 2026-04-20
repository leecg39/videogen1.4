#!/usr/bin/env node
// validate-preflight.js — Pre-write gate (HyperFrames 철학 이식)
//
// scenes-v2.json 을 한 줄이라도 쓰기 전에 호출해야 하는 차단 검사.
// 하나라도 실패하면 exit 1 — /vg-layout, /vg-scene 스킬이 시작 단계에서 실행.
//
// 검사 항목:
//   1. theme.ts 와 docs/design-system.md sync (validate-design-sync.js 재사용)
//   2. output/{projectId}.srt 존재 + 씬 경계 실측 가능
//   3. public/icons/{projectId}/manifest.json 존재 (있으면 통과, 없으면 경고)
//   4. scenes-v2.json 자체는 선택적 — 아직 없어도 OK (preflight 는 write 전에 부르는 게임)
//
// 이 게이트가 차단하는 것: postprocess 가 scenes 를 다 받은 후 reject 하는 낭비 루프.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { projectId: null, skill: "vg-layout" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--skill=")) out.skill = a.slice("--skill=".length);
    else if (!out.projectId) out.projectId = a;
  }
  return out;
}

function check(label, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`  ✅ ${label}`);
      return true;
    }
    if (typeof result === "string") {
      console.log(`  ❌ [FAIL] ${label} — ${result}`);
      return false;
    }
    return !!result;
  } catch (e) {
    console.log(`  ❌ [FAIL] ${label} — ${e?.message ?? e}`);
    return false;
  }
}

function main() {
  const { projectId, skill } = parseArgs();
  if (!projectId) {
    console.error("Usage: node validate-preflight.js <projectId> [--skill=vg-layout|vg-scene]");
    process.exit(2);
  }
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚪 Pre-write gate — /${skill} ${projectId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results = [];

  // 1. theme.ts + design-system.md sync
  results.push(check("theme.ts ↔ docs/design-system.md sync", () => {
    const syncScript = "scripts/validate-design-sync.js";
    if (!fs.existsSync(syncScript)) return "validate-design-sync.js 부재 — docs/design-system.md 를 theme.ts 와 동기화하는 스크립트가 필요.";
    try {
      execSync(`node ${syncScript}`, { stdio: "pipe" });
      return true;
    } catch (e) {
      return `design-sync 위반 — theme.ts 와 docs/design-system.md 불일치.`;
    }
  }));

  // 2. SRT 존재 + 최소 entry 수 (씬 경계 실측)
  const srtCandidates = [];
  const candidateRoots = [
    path.join("output", `${projectId}.srt`),
    path.join("output", projectId, `${projectId}.srt`),
    path.join("data", projectId, `${projectId}.srt`),
  ];
  for (const p of candidateRoots) if (fs.existsSync(p)) srtCandidates.push(p);
  // data/{pid} 내 임의 이름 SRT 도 허용 (한국어 파일명 등)
  const projectDir = path.join("data", projectId);
  if (fs.existsSync(projectDir)) {
    for (const name of fs.readdirSync(projectDir)) {
      if (name.toLowerCase().endsWith(".srt")) srtCandidates.push(path.join(projectDir, name));
    }
  }
  results.push(check("{pid} SRT 존재 + 씬 경계 실측 가능", () => {
    if (srtCandidates.length === 0) {
      return `SRT 부재 (output/${projectId}.srt · data/${projectId}/*.srt 모두 없음). /vg-voice 로 자막 생성 필요.`;
    }
    const srt = fs.readFileSync(srtCandidates[0], "utf8");
    const entries = srt.trim().split(/\n\n+/).length;
    if (entries < 3) return `SRT entry 수 ${entries} — 최소 3 이상 필요 (씬 경계 실측 불가).`;
    return true;
  }));

  // 3. project.json 또는 scene-plan.json 중 하나
  results.push(check("data/{pid}/project.json 또는 scene-plan.json 존재", () => {
    const a = path.join("data", projectId, "project.json");
    const b = path.join("data", projectId, "scene-plan.json");
    if (!fs.existsSync(a) && !fs.existsSync(b)) {
      return `프로젝트 메타데이터 부재 — /vg-new 또는 /vg-chunk 먼저 실행.`;
    }
    return true;
  }));

  // 4. (경고) manifest
  const manifest = path.join("public", "icons", projectId, "manifest.json");
  if (!fs.existsSync(manifest)) {
    console.log(`  ⚠️  [WARN] ${manifest} 부재 — manifest 없이 진행 (ImageAsset 매칭 스킵).`);
  } else {
    console.log(`  ℹ️  [INFO] ${manifest} 발견 — Step B7.5 에 따라 매칭 삽입 의무.`);
  }

  const failed = results.filter((r) => !r).length;
  console.log("");
  if (failed === 0) {
    console.log(`✅ Pre-write gate 통과 — /${skill} authoring 시작 허용.`);
    process.exit(0);
  }
  console.log(`❌ [FAIL] Pre-write gate 실패: ${failed}개 위반.`);
  console.log("");
  console.log("이 상태로 scenes-v2.json 을 작성하면 postprocess 에서 reject 됨. 위 항목 해결 후 재시도.");
  process.exit(1);
}

main();
