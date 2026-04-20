#!/usr/bin/env node
/**
 * posttool-tsx-tsc-check.js — PostToolUse[Write|Edit] hook
 *
 * *.tsx / *.ts 파일을 Write/Edit 한 직후 tsc --noEmit 로 해당 파일 + 참조 파일의 타입 오류 검증.
 * 에러 발견 시 exit 2 (block) — Claude 가 즉시 수정하도록 피드백.
 *
 * v1.1 round 4 regression (VerticalTimeline TS2339 headingFont) 재발 방지 구조.
 *
 * 스코프: src/remotion/nodes/*.tsx, src/remotion/common/*.tsx, src/remotion/*.tsx
 *   (다른 디렉토리의 대량 tsx 는 건드리지 않음 — 기존 사전 존재 에러 섞이지 않도록)
 *
 * bypass: Edit 이 초기 빌드 실패 상태를 의도적으로 건드릴 때를 위해
 *   VG_SKIP_TSX_CHECK=1 환경변수 설정 시 통과 (증적 기록).
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const TARGET_DIRS = [
  "src/remotion/nodes",
  "src/remotion/common",
  "src/remotion",
];
const STATE_DIR = path.join(".claude", "state");

function inTargetScope(filePath) {
  if (!filePath) return false;
  return TARGET_DIRS.some((d) => {
    const abs = path.resolve(d);
    const fileAbs = path.resolve(filePath);
    // 직계 자식만 (하위 디렉토리 아님)
    return path.dirname(fileAbs) === abs;
  });
}

function writeLog(entry) {
  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(STATE_DIR, "tsx-tsc-check.log"),
      `${new Date().toISOString()}\t${entry}\n`,
    );
  } catch {}
}

function main() {
  let raw = "";
  try { raw = fs.readFileSync(0, "utf8"); } catch { process.exit(0); }
  if (!raw.trim()) process.exit(0);

  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  const toolName = payload?.tool_name ?? payload?.toolName ?? "";
  if (!/^(Edit|Write)$/.test(toolName)) process.exit(0);

  const input = payload?.tool_input ?? payload?.toolInput ?? {};
  const filePath = input?.file_path ?? input?.filePath ?? "";
  if (typeof filePath !== "string") process.exit(0);
  if (!/\.(tsx|ts)$/.test(filePath)) process.exit(0);
  if (!inTargetScope(filePath)) process.exit(0);

  if (process.env.VG_SKIP_TSX_CHECK === "1") {
    writeLog(`${toolName}\t${filePath}\tSKIP (VG_SKIP_TSX_CHECK=1)`);
    process.exit(0);
  }

  // 대상 파일만 타입 체크. tsc --noEmit 은 전체 프로젝트를 하지만 grep 으로 대상 파일만 필터.
  // 사전 존재 에러(chunk/route.ts 등) 무시.
  const targetName = path.basename(filePath);
  try {
    const out = execSync(`npx tsc --noEmit 2>&1 | grep ${JSON.stringify(targetName)} || true`, {
      encoding: "utf8",
      timeout: 60_000,
    });
    const errors = out.split("\n").filter((l) => l.includes("error TS"));
    if (errors.length > 0) {
      writeLog(`${toolName}\t${filePath}\tFAIL\terrors=${errors.length}`);
      console.error(`\n❌ [FAIL:tsx-check] ${filePath}: TypeScript ${errors.length}개 에러`);
      for (const e of errors.slice(0, 8)) console.error(`   ${e}`);
      if (errors.length > 8) console.error(`   ... +${errors.length - 8} more`);
      console.error(`\n   즉시 수정 필요. (VG_SKIP_TSX_CHECK=1 로 임시 bypass 가능, 증적 기록됨.)`);
      process.exit(2); // block tool with reason
    }
    writeLog(`${toolName}\t${filePath}\tPASS`);
    process.exit(0);
  } catch (e) {
    // tsc timeout 또는 실행 실패 — silent pass (가드가 IDE 경험 망가뜨리지 않도록)
    writeLog(`${toolName}\t${filePath}\tERROR\t${e?.message ?? e}`);
    process.exit(0);
  }
}

main();
