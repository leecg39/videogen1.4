#!/usr/bin/env node
// validate-sfx-volume.js — HARD GATE: 원본 오디오 마스킹 방지
//
// vg-video-demo SKILL.md:71 — segment.keepOriginalAudio === true 인 씬에서
// SfxAudio (click.mp3) 의 volume > 0.5 면 원본 오디오를 가려 FAIL.
//
// 경계:
//   - click 류 SFX: volume 상한 0.5
//   - whoosh 류 SFX: volume 상한 0.6 (짧으므로 약간 관대)
//   - keepOriginalAudio=false 세그먼트: 상한 0.8
//
// 대상:
//   - scenes-v2.json 에서 SfxAudio 노드 수집
//   - video-spec.json (또는 demo-spec.json) 에서 segments/slides 의 keepOriginalAudio 조회
//   - 씬 id 와 segment id 매칭은 scene.segment_id 또는 seg-N / scene-N 인덱스 대응
//
// 사용법:
//   node validate-sfx-volume.js <scenes-v2.json> [video-spec.json]

const fs = require("fs");
const path = require("path");

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function collectSfx(scene) {
  const out = [];
  if (!scene.stack_root) return out;
  walk(scene.stack_root, (n) => {
    if (n.type !== "SfxAudio") return;
    const d = n.data || {};
    const src = String(d.src || "");
    const vol = typeof d.volume === "number" ? d.volume : 0.6;
    const kind = /click/i.test(src) ? "click" : /whoosh/i.test(src) ? "whoosh" : "other";
    out.push({ src, volume: vol, kind, startFrame: d.startFrame ?? d.from ?? 0 });
  });
  return out;
}

function findSpec(scenesFile, explicitSpec) {
  if (explicitSpec && fs.existsSync(explicitSpec)) return explicitSpec;
  const dir = path.dirname(scenesFile);
  for (const name of ["video-spec.json", "demo-spec.json"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function buildSegmentMap(spec) {
  // segment id → keepOriginalAudio
  const map = new Map();
  const items = spec.segments || spec.slides || [];
  items.forEach((item, i) => {
    const id = item.id || `seg-${i + 1}`;
    map.set(id, !!item.keepOriginalAudio);
    // 인덱스 기반 fallback 키 — scene-N / seg-N 매칭용
    map.set(`__idx_${i}__`, !!item.keepOriginalAudio);
  });
  return map;
}

function keepAudioForScene(scene, segmentMap, sceneIdx) {
  if (!segmentMap) return false; // spec 없으면 보수적으로 false (= click 상한 엄격 적용 안 됨 → 일반 상한 0.8 만)
  if (scene.segment_id && segmentMap.has(scene.segment_id)) return segmentMap.get(scene.segment_id);
  if (segmentMap.has(scene.id)) return segmentMap.get(scene.id);
  if (segmentMap.has(`__idx_${sceneIdx}__`)) return segmentMap.get(`__idx_${sceneIdx}__`);
  return false;
}

function main() {
  const scenesFile = process.argv[2];
  const specArg = process.argv[3];
  if (!scenesFile) {
    console.error("Usage: node validate-sfx-volume.js <scenes-v2.json> [video-spec.json]");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(scenesFile, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  if (scenes.length === 0) {
    console.log("");
    console.log("⚠️  [SKIP] sfx-volume 검증 생략 — scenes 배열이 비어있거나 형식이 다릅니다.");
    process.exit(0);
  }
  const specPath = findSpec(scenesFile, specArg);
  let segmentMap = null;
  if (specPath) {
    try {
      const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
      segmentMap = buildSegmentMap(spec);
    } catch {}
  }

  const failures = [];
  const warnings = [];
  let totalSfx = 0;

  scenes.forEach((sc, idx) => {
    const sfxs = collectSfx(sc);
    if (sfxs.length === 0) return;
    totalSfx += sfxs.length;

    const keepOriginal = keepAudioForScene(sc, segmentMap, idx);

    for (const fx of sfxs) {
      let cap = 0.8; // 기본 상한
      if (keepOriginal) {
        if (fx.kind === "click") cap = 0.5;
        else if (fx.kind === "whoosh") cap = 0.6;
        else cap = 0.5; // 기타 SFX 도 원본 유지 씬이면 보수적
      }
      if (fx.volume > cap + 1e-9) {
        const msg = `${sc.id} (keepOriginalAudio=${keepOriginal})  ${fx.src} volume=${fx.volume} > ${cap}`;
        if (keepOriginal) failures.push(`[sfx:mask] ${msg}`);
        else warnings.push(`[sfx:loud] ${msg}`);
      }
    }
  });

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 sfx volume 검증 (원본 오디오 마스킹 방지)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 SfxAudio 노드: ${totalSfx}   spec 참조: ${specPath ? path.basename(specPath) : "(없음 — 보수 판정)"}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warnings.length}건:`);
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... 외 ${warnings.length - 10}개`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ sfx volume 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 원본 오디오 마스킹 위반:`);
  failures.slice(0, 15).forEach((f) => console.log(`  - ${f}`));
  if (failures.length > 15) console.log(`  ... 외 ${failures.length - 15}개`);
  console.log("");
  console.log(
    "해결: keepOriginalAudio=true 세그먼트의 click SFX volume ≤ 0.5 로 낮춤. /vg-demo-fx 재실행 후 수동 조정."
  );
  process.exit(1);
}

main();
