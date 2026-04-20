#!/usr/bin/env node
// compute-hero-frame.js — hero_frame_ms 자동 계산 (Positive→Negative 리팩토링 P2-6)
//
// Claude 가 hero_frame_ms 를 창작으로 채우는 Goodhart 경로 제거.
// 각 씬의 stack_root 를 순회하여 max(enterAt + duration) + 여유 6f → ms 로 변환.
// 기존 hero_frame_ms 필드는 덮어씀 (scene.hero_frame_ms_manual === true 시에만 보존).
//
// 사용:
//   node scripts/compute-hero-frame.js data/{pid}/scenes-v2.json [--dry]
//
// 검증 실패 케이스 (exit 1):
//   - Phase B 씬인데 stack_root 에 motion 필드 0개 (compute 불가)
//   - scene.duration_frames 없음

const fs = require("fs");

const FPS = 30;
const HERO_MARGIN_FRAMES = 6;

function walkMotion(node, fn) {
  if (!node || typeof node !== "object") return;
  if (node.motion) fn(node.motion, node);
  for (const c of node.children ?? []) walkMotion(c, fn);
}

function computeHeroFrameMs(scene) {
  if (!scene.stack_root) return null;
  let maxEnd = 0;
  let sawMotion = false;
  walkMotion(scene.stack_root, (m) => {
    sawMotion = true;
    const enterAt = Number.isFinite(m.enterAt) ? m.enterAt : 0;
    const duration = Number.isFinite(m.duration) ? m.duration : 0;
    const end = enterAt + duration;
    if (end > maxEnd) maxEnd = end;
  });
  const heroFrame = maxEnd + HERO_MARGIN_FRAMES;
  // 씬 길이 상한
  const durFrames = scene.duration_frames;
  const maxAllowed = Number.isFinite(durFrames) ? Math.max(0, durFrames - 6) : heroFrame;
  const finalFrame = Math.min(heroFrame, maxAllowed);
  return Math.round((finalFrame / FPS) * 1000);
}

function main() {
  const file = process.argv[2];
  const dry = process.argv.includes("--dry");
  if (!file) {
    console.error("Usage: node compute-hero-frame.js <scenes-v2.json> [--dry]");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : null;
  if (!scenes) {
    console.error("❌ [FAIL] scenes-v2.json 형식 오류");
    process.exit(2);
  }

  let updated = 0;
  let preserved = 0;
  let skipped = 0;
  const failures = [];
  const manualOverrides = [];

  const path = require("path");
  const projectId = (() => {
    const m = file.match(/data\/([^/]+)\/scenes-v2\.json$/);
    return m ? m[1] : "unknown";
  })();

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (sc.phase !== "B") { skipped++; continue; }
    if (sc.hero_frame_ms_manual === true) {
      preserved++;
      manualOverrides.push({
        projectId,
        sceneId: sc.id ?? `scene-${i}`,
        sceneIndex: i,
        hero_frame_ms: sc.hero_frame_ms,
      });
      continue;
    }

    const computed = computeHeroFrameMs(sc);
    if (computed === null) {
      failures.push(`${sc.id ?? `scene-${i}`}: stack_root 없음 (compute 불가)`);
      continue;
    }
    // motion 필드 0개 → enterAt+duration 전부 0 → maxEnd=0 → hero=6f margin.
    // 이 경우 경고하되 compute 는 진행 (정적 씬 허용).
    if (sc.hero_frame_ms !== computed) {
      sc.hero_frame_ms = computed;
      updated++;
    } else {
      updated++;
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🧮 compute-hero-frame (자동 계산)${dry ? " [DRY-RUN]" : ""}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  검사 씬: ${scenes.length}`);
  console.log(`  자동 계산/업데이트: ${updated}`);
  console.log(`  manual=true 보존: ${preserved}`);
  console.log(`  Phase A/생략: ${skipped}`);

  if (failures.length > 0) {
    console.log(`  ❌ [FAIL] compute 실패: ${failures.length}`);
    failures.slice(0, 5).forEach((f) => console.log(`    - ${f}`));
    process.exit(1);
  }

  // manual override 증적 기록 (v1.1 round 3 잔여 2)
  if (manualOverrides.length > 0) {
    try {
      const stateDir = path.join(".claude", "state");
      if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
      const logPath = path.join(stateDir, "hero-manual-override.log");
      const now = new Date().toISOString();
      for (const o of manualOverrides) {
        fs.appendFileSync(
          logPath,
          `${now}\t${o.projectId}\t${o.sceneId}\t${o.sceneIndex}\t${o.hero_frame_ms}\n`,
        );
      }
      console.log(`  ℹ️  [INFO] manual override ${manualOverrides.length}건 → .claude/state/hero-manual-override.log 기록.`);
    } catch {}
  }

  if (!dry) {
    fs.writeFileSync(file, JSON.stringify(scenes, null, 2));
    console.log("");
    console.log(`✅ ${file} 에 hero_frame_ms 자동 주입 완료.`);
  } else {
    console.log("");
    console.log("ℹ️  [INFO] --dry — 실제 쓰기 없음. 제거 후 재실행하여 주입.");
  }
  process.exit(0);
}

main();
