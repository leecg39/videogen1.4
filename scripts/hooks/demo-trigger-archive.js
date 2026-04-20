#!/usr/bin/env node
/**
 * Stop hook — 세션 종료 시점에 status:pending 트리거 중 output/{pid}.mp4 가
 * 생성된 항목을 status:done으로 갱신. 다음 세션에서 중복 트리거 방지.
 */

const fs = require("fs");
const path = require("path");

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const outputDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(dataDir)) return;

  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const triggerPath = path.join(dataDir, entry.name, "demo-trigger.json");
    if (!fs.existsSync(triggerPath)) continue;
    let trig;
    try {
      trig = JSON.parse(fs.readFileSync(triggerPath, "utf-8"));
    } catch {
      continue;
    }
    if (trig.status === "done" || trig.status === "failed") continue;

    const mp4 = path.join(outputDir, `${trig.pid}.mp4`);
    if (fs.existsSync(mp4)) {
      const st = fs.statSync(mp4);
      trig.status = "done";
      trig.updated_at = new Date().toISOString();
      trig.output_path = `output/${trig.pid}.mp4`;
      trig.file_size = st.size;
      fs.writeFileSync(triggerPath, JSON.stringify(trig, null, 2));
    }
  }
}

try {
  main();
} catch {
  process.exit(0);
}
