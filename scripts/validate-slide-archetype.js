#!/usr/bin/env node
// validate-slide-archetype.js — HARD GATE: 슬라이드 유형↔아키타입 매핑 강제
//
// vg-slides SKILL.md:49 — 슬라이드 유형 ↔ 필수 컴포넌트 매핑.
// project.json 의 kind === "slides" 이거나 scenes-v2 의 모든 씬이 subtitles=[] 이면 슬라이드로 간주.
// 각 씬의 slide_type (또는 meta.slide_type / chunk_metadata.slide_type) 이 지정돼 있으면
// stack_root 하위에 매핑된 필수 컴포넌트가 최소 1개 포함돼야 한다.
//
// 미지정 slide_type 은 검사 생략 (기존 프로젝트 호환).
// postprocess.sh ⑥-o 로 삽입.

const fs = require("fs");
const path = require("path");

// type → 필수 포함 컴포넌트 후보 (하나 이상 매칭)
const ARCHETYPE_MAP = {
  title: ["Headline", "AccentGlow", "Pill"],
  overview: ["ProcessStepCard", "NumberCircle", "BulletList"],
  concept: ["IconCard", "DevIcon", "SvgGraphic"],
  comparison: ["VersusCard", "CompareBars", "Split"],
  process: ["FlowDiagram", "ArrowConnector", "AnimatedTimeline"],
  stats: ["StatCard", "ProgressBar", "ImpactStat", "RingChart"],
  quote: ["QuoteText", "Divider"],
  demo: ["TerminalBlock", "CodeBlock", "CodeTyping"],
  timeline: ["AnimatedTimeline", "CycleDiagram"],
  gallery: ["ImageAsset"],
  venn: ["VennDiagram"],
  funnel: ["FunnelDiagram"],
  pyramid: ["PyramidDiagram"],
  matrix: ["MatrixQuadrant"],
  "custom-svg": ["SvgGraphic"],
  closing: ["Headline", "TerminalBlock", "Pill"],
};

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function getSlideType(sc) {
  return sc?.slide_type ?? sc?.meta?.slide_type ?? sc?.chunk_metadata?.slide_type ?? null;
}

function isSlidesProject(scenes, projectJson) {
  if (projectJson && /slide/i.test(String(projectJson.kind || projectJson.type || ""))) return true;
  if (!Array.isArray(scenes) || scenes.length === 0) return false;
  return scenes.every((s) => {
    const subs = s.subtitles;
    return Array.isArray(subs) && subs.length === 0;
  });
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-slide-archetype.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const projectJsonPath = path.join(path.dirname(file), "project.json");
  let projectJson = null;
  if (fs.existsSync(projectJsonPath)) {
    try { projectJson = JSON.parse(fs.readFileSync(projectJsonPath, "utf8")); } catch {}
  }

  const isSlides = isSlidesProject(scenes, projectJson);
  if (!isSlides) {
    console.log("");
    console.log("⚠️  [SKIP] slide-archetype 검증 생략 — 영상(나레이션) 프로젝트.");
    process.exit(0);
  }

  const failures = [];
  let checked = 0;
  let untyped = 0;

  for (const sc of scenes) {
    const st = getSlideType(sc);
    if (!st) { untyped++; continue; }
    const expected = ARCHETYPE_MAP[st];
    if (!expected) {
      failures.push(`[slide:unknown-type] ${sc.id}: slide_type="${st}" (허용 목록 외)`);
      continue;
    }
    checked++;
    const presentTypes = new Set();
    if (sc.stack_root) walk(sc.stack_root, (n) => { if (n.type) presentTypes.add(n.type); });
    const hit = expected.some((t) => presentTypes.has(t));
    if (!hit) {
      failures.push(
        `[slide:archetype-miss] ${sc.id}: type="${st}" → 필요 컴포넌트 중 하나 [${expected.join("/")}] 누락. 현재 노드: ${[...presentTypes].slice(0, 6).join(", ")}...`
      );
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 slide archetype 검증 (vg-slides 매핑)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${scenes.length}   검사 대상: ${checked}   slide_type 미지정: ${untyped}`);

  if (failures.length === 0) {
    console.log("");
    console.log("✅ slide archetype 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 아키타입 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: 슬라이드 유형에 대응되는 필수 컴포넌트를 stack_root 에 포함 (예: comparison → VersusCard/CompareBars/Split)."
  );
  process.exit(1);
}

main();
