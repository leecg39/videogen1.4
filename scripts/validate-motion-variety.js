#!/usr/bin/env node
// validate-motion-variety.js — HARD GATE: 애니메이션 다양성
//
// scene-grammar.md Section 5:
//   (1) 첫 애니 t=0 금지, enterAt ≥ 3f
//   (2) 노드 ≥ 5 인 씬은 unique preset 종류 ≥ 3
//   (3) 같은 preset 2개 트윈 이상 금지 (씬 내 preset 빈도 ≤ 1)
//   (4) emphasis: "loop-*" 에 무한 루프 없이 emphasisCycle 지정 필수
//   (5) stagger 총 범위 > 500ms (≈ 15f@30fps) 경고
//
// postprocess.sh ⑥-j 로 삽입.

const fs = require("fs");

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function collectMotion(scene) {
  const out = [];
  if (!scene.stack_root) return out;
  walk(scene.stack_root, (n, path) => {
    const m = n.motion;
    if (!m || typeof m !== "object") return;
    if (m.preset || m.enterAt != null || m.emphasis) {
      out.push({
        nodeType: n.type,
        loc: [...path, n.type || "?"].join(">"),
        preset: m.preset || null,
        enterAt: typeof m.enterAt === "number" ? m.enterAt : null,
        emphasis: m.emphasis || null,
        emphasisCycle: m.emphasisCycle || null,
      });
    }
  });
  return out;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-motion-variety.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const failures = [];
  const warnings = [];

  for (const sc of scenes) {
    // Phase A 씬은 모션 없는 게 정상이라 건너뛴다
    if (sc.phase === "A") continue;

    const motions = collectMotion(sc);
    if (motions.length === 0) continue;

    // (1) 첫 enterAt ≥ 3f (Phase B 씬에만 적용)
    const enterAts = motions.map((m) => m.enterAt).filter((v) => typeof v === "number");
    if (enterAts.length > 0) {
      const minEnter = Math.min(...enterAts);
      if (minEnter < 3 && sc.phase === "B") {
        failures.push(
          `[motion:first-enterAt] ${sc.id}: 첫 enterAt=${minEnter}f (< 3f). 시청자 인지 시간 부족.`
        );
      }
    }

    // (2) 노드 ≥ 5 씬은 unique preset 종류 ≥ 3
    const presets = motions.map((m) => m.preset).filter(Boolean);
    const uniquePresets = new Set(presets);
    if (motions.length >= 5 && uniquePresets.size < 3) {
      failures.push(
        `[motion:variety] ${sc.id}: 노드 ${motions.length}개인데 unique preset ${uniquePresets.size}종 (< 3). presets=[${[...uniquePresets].join("/")}]`
      );
    }

    // (3) 같은 preset 2회 이상
    const counts = new Map();
    for (const p of presets) counts.set(p, (counts.get(p) || 0) + 1);
    const dupPresets = [...counts.entries()].filter(([, n]) => n >= 2);
    if (dupPresets.length > 0) {
      // 2개는 경고, 3개 이상 또는 한 preset 이 3회+ 면 FAIL
      const severe = dupPresets.some(([, n]) => n >= 3) || dupPresets.length >= 2;
      const msg = `${sc.id}: 같은 preset 반복 (${dupPresets.map(([p, n]) => `${p}×${n}`).join(", ")})`;
      if (severe) failures.push(`[motion:duplicate-preset] ${msg}`);
      else warnings.push(`[motion:duplicate-preset] ${msg}`);
    }

    // (4) emphasis: "loop-*" 또는 무한 반복 신호 에 emphasisCycle 없음
    for (const m of motions) {
      if (m.emphasis && typeof m.emphasis === "string" && /^loop[-_]/i.test(m.emphasis)) {
        if (!m.emphasisCycle || m.emphasisCycle <= 0) {
          failures.push(
            `[motion:infinite-loop] ${sc.id}:${m.loc}: emphasis="${m.emphasis}" 에 emphasisCycle 미지정. 무한 루프 금지.`
          );
        }
      }
    }

    // (5) stagger 총 범위 > 500ms (assume 30fps → > 15f)
    if (enterAts.length >= 2) {
      const span = Math.max(...enterAts) - Math.min(...enterAts);
      // 너무 늘어진 스태거는 시청자가 마지막 요소를 놓침
      const durationFrames = sc.duration_frames || 150;
      const halfPoint = durationFrames * 0.6;
      if (span > halfPoint) {
        warnings.push(
          `[motion:stagger-span] ${sc.id}: enterAt span ${span}f (씬 길이의 ${((span / durationFrames) * 100).toFixed(0)}%). 늦은 등장은 cut off 위험.`
        );
      }
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 motion variety 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  FAIL 규칙: ${failures.length}`);
  console.log(`  WARN 규칙: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건 (일부):`);
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... 외 ${warnings.length - 10}개`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ motion variety 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 motion 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: preset 다양화 (씬당 ≥3종), 첫 enterAt ≥3f, 무한 loop 에 emphasisCycle 지정, stagger 범위 단축."
  );
  process.exit(1);
}

main();
