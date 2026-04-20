#!/usr/bin/env node
/**
 * preview-read-log.js — PostToolUse[Read] hook
 *
 * Claude Code 가 output/preview/*.png 를 Read 할 때마다 .claude/state/preview-reads.json 에 기록.
 * scene-grammar v1.1 조건: Phase B 씬 커밋 전 해당 씬 preview PNG 를 반드시 Read 해야 함.
 * fallback 필드 (preview_reviewed_at) 가 자기 신고인 것과 달리 이건 도구 사용 증적.
 *
 * Input (stdin): { tool_name: "Read", tool_input: { file_path: "..." }, ... }
 * Output: stdout JSON (무조건 ok). 기록만 하고 절대 block 하지 않음.
 */

const fs = require("node:fs");
const path = require("node:path");

const STATE_DIR = path.join(".claude", "state");
const LOG_PATH = path.join(STATE_DIR, "preview-reads.json");
const PREVIEW_RE = /(?:^|\/)output\/preview\/([^/]+)\.png$/;
// projectId-scene-{N}-{time}.png pattern
const NAME_RE = /^(?<pid>.+?)-scene-(?<scene>\d+)-(?<time>hero|start|mid|end)$/;

function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    // no stdin — exit silently
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
  if (toolName !== "Read") process.exit(0);

  const input = payload?.tool_input ?? payload?.toolInput ?? {};
  const filePath = input?.file_path ?? input?.filePath ?? "";
  if (typeof filePath !== "string" || !filePath) process.exit(0);

  const match = filePath.match(PREVIEW_RE);
  if (!match) process.exit(0);

  const base = match[1];
  const parsed = NAME_RE.exec(base);
  if (!parsed?.groups) process.exit(0);

  const { pid, scene, time } = parsed.groups;

  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    let log = {};
    if (fs.existsSync(LOG_PATH)) {
      try {
        log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8")) || {};
      } catch {
        log = {};
      }
    }
    const key = `${pid}/scene-${scene}`;
    const now = new Date().toISOString();
    const prev = log[key] ?? { reads: 0, first_read_at: now };
    log[key] = {
      project_id: pid,
      scene_index: Number(scene),
      last_time_arg: time,
      reads: (prev.reads ?? 0) + 1,
      first_read_at: prev.first_read_at ?? now,
      last_read_at: now,
    };
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  } catch {
    // 기록 실패는 silent — block 하지 않는 정책
  }
  process.exit(0);
}

main();
