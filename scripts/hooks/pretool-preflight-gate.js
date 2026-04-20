#!/usr/bin/env node
/**
 * pretool-preflight-gate.js — PreToolUse[Edit|Write] hook
 *
 * Claude Code 가 data/{pid}/scenes-v2.json 을 Edit/Write 하려 할 때 validate-preflight 실행.
 * preflight 실패 시 tool 차단 (exit 2 — block with reason).
 * 프로젝트 메타데이터/디자인 sync/SRT 미비 상태에서 scenes-v2.json 작성 시도를
 * 시작 시점에 기술적으로 차단. prose-only HARD-GATE → binary gate 승격.
 *
 * bypass: scene 이 이미 존재하면 통과 (재수정 허용). 최초 생성 시점에만 차단.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    process.exit(0);
  }
  if (!raw.trim()) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = payload?.tool_name ?? payload?.toolName ?? "";
  if (!/^(Edit|Write)$/.test(toolName)) process.exit(0);

  const input = payload?.tool_input ?? payload?.toolInput ?? {};
  const filePath = input?.file_path ?? input?.filePath ?? "";
  if (typeof filePath !== "string" || !filePath) process.exit(0);

  // data/{projectId}/scenes-v2.json 패턴만 차단 대상
  const m = filePath.match(/data\/([^/]+)\/scenes-v2\.json$/);
  if (!m) process.exit(0);

  const projectId = m[1];

  // "신규 취급" 판정 — 다음 중 하나면 신규로 취급 (v1.1 round 3 잔여 3):
  //   (a) 파일 자체 없음
  //   (b) 파일 크기 0
  //   (c) 생성 시각(mtime) < 10초 전 (방금 touch 로 우회 시도 감지)
  const FRESH_THRESHOLD_MS = 10_000;
  let treatAsNew = false;
  if (!fs.existsSync(filePath)) {
    treatAsNew = true;
  } else {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) treatAsNew = true;
      else if (Date.now() - stat.mtimeMs < FRESH_THRESHOLD_MS) treatAsNew = true;
    } catch {
      treatAsNew = true;
    }
  }

  if (!treatAsNew) {
    // 기존 파일 재편집 — preflight 경고만 (실패해도 통과, diff workflow 방해 안 함)
    try {
      execSync(`node scripts/validate-preflight.js ${projectId} --skill=edit`, { stdio: "pipe" });
    } catch {}
    process.exit(0);
  }

  // 신규 생성 시점: preflight 실행
  try {
    execSync(`node scripts/validate-preflight.js ${projectId} --skill=vg-layout`, { stdio: "inherit" });
    process.exit(0);
  } catch (e) {
    // exit 2 = block tool with reason (Claude Code hook 규약)
    console.error(`\n🚪 [FAIL] Pre-write gate 차단 — data/${projectId}/scenes-v2.json 신규 생성 거부`);
    console.error(`   해결: 위 preflight 오류를 수정한 뒤 다시 시도. /vg-new 또는 /vg-voice 선행 필요 가능.`);
    // bypass 시도 감지 증적
    try {
      const stateDir = path.join(".claude", "state");
      if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
      fs.appendFileSync(
        path.join(stateDir, "pretool-blocks.log"),
        `${new Date().toISOString()}\t${projectId}\t${filePath}\tblocked-new-or-fresh\n`,
      );
    } catch {}
    process.exit(2);
  }
}

main();
