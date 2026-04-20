#!/usr/bin/env node
// validate-preview-reviewed.js — Phase B 씬에 preview Read 증적 필수
//
// 이중 검증 (v1.1):
//   (A) HOOK 증적: .claude/state/preview-reads.json 에 해당 씬 entry 존재 (신뢰 우선)
//   (B) FALLBACK 필드: scene.preview_reviewed_at (ISO8601) — hook 미설정 시
// 둘 중 하나라도 있으면 통과. 둘 다 없으면 exit 1.
//
// 엄격 모드 (v1.1 round 2 — opt-out 방향 반전):
//   기본값: STRICT — fallback 필드 불인정, hook 증적만 인정. Goodhart 구멍 차단.
//   VG_PREVIEW_STRICT_HOOK=0 env 설정 시에만 legacy 이중 검증 (하위 호환).
//   legacy 호출 시 .claude/state/preview-strict-opt-out.log 에 증적 기록.
//
// 인자로 projectId 감지 시 파일 경로에서 추출 (data/{pid}/scenes-v2.json 패턴).
//
// postprocess ⑥-zd 로 삽입.

const fs = require("fs");
const path = require("path");

const STATE_LOG = path.join(".claude", "state", "preview-reads.json");

function readHookLog() {
  if (!fs.existsSync(STATE_LOG)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_LOG, "utf8"));
  } catch {
    return null;
  }
}

function extractProjectId(filePath) {
  const m = filePath.match(/data\/([^/]+)\/scenes-v2\.json$/);
  return m ? m[1] : null;
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-preview-reviewed.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const projectId = extractProjectId(file);
  const hookLog = readHookLog();
  // v1.1 round 2: STRICT 가 기본. VG_PREVIEW_STRICT_HOOK=0 만 legacy 허용.
  const strictHook = process.env.VG_PREVIEW_STRICT_HOOK !== "0";
  if (!strictHook) {
    try {
      const fsMod = require("fs");
      const pathMod = require("path");
      const stateDir = pathMod.join(".claude", "state");
      if (!fsMod.existsSync(stateDir)) fsMod.mkdirSync(stateDir, { recursive: true });
      fsMod.appendFileSync(
        pathMod.join(stateDir, "preview-strict-opt-out.log"),
        `${new Date().toISOString()}\t${file}\tstrict-hook-disabled\n`,
      );
    } catch {}
  }

  let phaseB = 0;
  let hookReviewed = 0;
  let fallbackReviewed = 0;
  const notReviewed = [];
  const fallbackOnly = [];

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (sc.phase !== "B") continue;
    phaseB++;

    const hookKey = projectId ? `${projectId}/scene-${i}` : null;
    const hookHit = hookLog && hookKey && hookLog[hookKey] && (hookLog[hookKey].reads ?? 0) > 0;
    const fieldHit = sc.preview_reviewed_at && /^\d{4}-\d{2}-\d{2}/.test(sc.preview_reviewed_at);

    if (hookHit) hookReviewed++;
    else if (fieldHit) {
      fallbackReviewed++;
      fallbackOnly.push(sc.id ?? `scene-${i}`);
    } else notReviewed.push(sc.id ?? `scene-${i}`);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔍 preview-reviewed 검증${strictHook ? " (STRICT HOOK)" : ""} (Phase B 씬의 preview Read 증적)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Phase B 씬: ${phaseB}  hook 증적: ${hookReviewed}  fallback 필드: ${fallbackReviewed}  누락: ${notReviewed.length}`);
  if (hookLog == null) {
    console.log("  ⚠️  [WARN] .claude/state/preview-reads.json 없음 — hook 미등록 의심. settings.json 의 PostToolUse[Read] 확인.");
  }

  if (phaseB === 0) {
    console.log("⚠️  [SKIP] Phase B 씬 없음 — 검증 생략.");
    process.exit(0);
  }

  // STRICT HOOK 모드: fallback 필드만 있고 hook 증적 없는 씬도 실패 처리.
  if (strictHook && fallbackOnly.length > 0) {
    console.log("");
    console.log(`❌ [FAIL] STRICT HOOK 모드 — fallback 필드만 있는 씬 ${fallbackOnly.length}개 거부 (Goodhart 차단).`);
    console.log("  샘플:", fallbackOnly.slice(0, 10).join(", "));
    console.log("");
    console.log("해결: 각 씬 PNG 를 Claude Code Read 도구로 실제 열어서 hook 증적 기록.");
    console.log("      scene.preview_reviewed_at 필드는 v1.1 STRICT 모드에서 인정되지 않음.");
    process.exit(1);
  }

  if (notReviewed.length === 0) {
    console.log("");
    console.log(`✅ preview-reviewed 통과${strictHook ? " (STRICT HOOK)" : ""}.`);
    if (!strictHook && fallbackReviewed > 0) {
      console.log(`  ℹ️  [INFO] fallback 필드 사용 ${fallbackReviewed}개 — VG_PREVIEW_STRICT_HOOK 기본 STRICT (v1.1 round 2).`);
    }
    process.exit(0);
  }
  console.log("");
  console.log(`❌ [FAIL] Phase B 씬 ${notReviewed.length}개에 preview Read 증적 없음.`);
  console.log("  샘플:", notReviewed.slice(0, 10).join(", "));
  console.log("");
  console.log("해결 (A) 권장 — hook 증적:");
  console.log("  1) npx tsx scripts/vg-preview-still.ts <pid> --scene N --time hero");
  console.log("  2) Claude Code 의 Read 도구로 output/preview/<pid>-scene-N-hero.png 확인");
  console.log("     → PostToolUse[Read] hook 이 .claude/state/preview-reads.json 에 자동 기록");
  if (!strictHook) {
    console.log("해결 (B) fallback — 필드 (STRICT 모드 아닐 때만):");
    console.log(`  scene.preview_reviewed_at = "${new Date().toISOString()}"`);
  }
  process.exit(1);
}

main();
