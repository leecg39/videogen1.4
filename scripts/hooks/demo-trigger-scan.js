#!/usr/bin/env node
/**
 * SessionStart hook — data/<pid>/demo-trigger.json 중 status:pending 항목을
 * <system-reminder>로 노출하여 Claude가 다음 턴에 /vg-demo {pid}를 실행하도록 유도.
 *
 * stdout 출력이 있으면 Claude Code가 시스템 리마인더로 받는다.
 * 출력이 없으면 noop.
 */

const fs = require("fs");
const path = require("path");

function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) return;

  const pending = [];
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const triggerPath = path.join(dataDir, entry.name, "demo-trigger.json");
    if (!fs.existsSync(triggerPath)) continue;
    try {
      const trig = JSON.parse(fs.readFileSync(triggerPath, "utf-8"));
      if (trig.status === "pending") pending.push(trig.pid);
    } catch {
      // ignore parse errors
    }
  }

  if (pending.length === 0) return;

  const list = pending.map((p) => `\`${p}\``).join(", ");
  console.log(
    `[demo-trigger] Pending product-demo submissions detected: ${list}.\n` +
      `→ Run \`/vg-demo ${pending[0]}\` to start the pipeline. ` +
      `(or process all: ${pending.map((p) => `/vg-demo ${p}`).join("; ")})`
  );
}

try {
  main();
} catch (e) {
  // 훅 실패는 세션 시작을 막아선 안 됨 — 조용히 종료
  process.exit(0);
}
