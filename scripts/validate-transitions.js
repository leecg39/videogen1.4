#!/usr/bin/env node
// validate-transitions.js — Scene Grammar Section 4 강제 (HyperFrames Non-Negotiable 이식)
//
// 규칙 (v1.1 round 2):
//   1. transition 필드 "부재" 는 OK — Composition.tsx 의 autoSelectTransition 이 intent
//      기반으로 crossfade/wipe/slide rotation 자동 선택.
//   2. transition 필드가 명시적으로 존재할 때:
//      - type === "none" + durationFrames === 0 은 jump cut. 3개 이상 연속 시 exit 1.
//      - 마지막 씬 1개는 none 허용 (끝이므로).
//   3. sync-render-props 가 의도 없는 none/0 을 undefined 로 normalize 하므로,
//      명시적 none 은 transition_explicit === true 로만 보존됨.
//
// postprocess ⑨ 로 삽입 (v1.1 guardrail audit 결함 5).

const fs = require("fs");

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-transitions.js <scenes-v2-or-render-props>.json");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const totalScenes = scenes.length;
  if (totalScenes < 2) {
    console.log("⚠️  씬 1개 이하 — 전환 검사 생략.");
    process.exit(0);
  }

  let autoSelectCount = 0;
  const noneList = [];
  let consecutiveNone = 0;
  let maxConsecutiveNone = 0;

  // 씬 i → 씬 i+1 전환. 마지막 씬 (index N-1) 은 검사 대상 아님.
  for (let i = 0; i < totalScenes - 1; i++) {
    const sc = scenes[i];
    const t = sc.transition;
    if (!t || typeof t !== "object") {
      // transition 부재 = autoSelect 위임 (OK)
      autoSelectCount++;
      consecutiveNone = 0;
      continue;
    }
    const type = t.type ?? "none";
    const dur = t.durationFrames ?? 0;
    if (type === "none" || dur === 0) {
      noneList.push({ id: sc.id ?? `scene-${i}`, type, dur });
      consecutiveNone++;
      if (consecutiveNone > maxConsecutiveNone) maxConsecutiveNone = consecutiveNone;
    } else {
      consecutiveNone = 0;
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 transitions 검증 (Section 4 Non-Negotiable)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  씬: ${totalScenes}  검사 대상 전환: ${totalScenes - 1}`);
  console.log(`  [INFO] autoSelect 위임 (transition 부재): ${autoSelectCount}`);
  console.log(`  명시적 type:"none" or dur:0: ${noneList.length}  (최대 연속: ${maxConsecutiveNone})`);

  const failures = [];
  if (maxConsecutiveNone >= 3) {
    failures.push(`[FAIL:transitions:none-run] 명시적 "none" 전환 ${maxConsecutiveNone}개 연속 — jump cut 3 연속은 단조로움. 의도된 jump cut 이면 흩어 배치.`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ transitions 통과.");
    if (maxConsecutiveNone >= 2) {
      console.log(`  ⚠️  [WARN] 명시적 "none" ${maxConsecutiveNone}개 연속 — 영상 리듬 단조로울 수 있음.`);
    }
    process.exit(0);
  }
  console.log("");
  console.log(`❌ ${failures.length}개 transitions 위반:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  console.log("");
  console.log("해결: 해당 씬의 scene.transition 필드를 제거하거나 transition_explicit:false 로 전환 → autoSelect 위임.");
  console.log("      또는 의도된 jump cut 이면 흩어 배치 (연속 3 미만으로).");
  process.exit(1);
}

main();
