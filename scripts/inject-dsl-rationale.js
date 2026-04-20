#!/usr/bin/env node
// inject-dsl-rationale.js — R9 (f) DSL 씬 rationale 자동 기입 스캐폴드.
//
// 주의: 이 스크립트는 "자동화된 스캐폴드" 이지 "근거 생성기" 가 아니다.
// 각 DSL 씬의 narration 과 visual_plan.pattern_ref 를 바탕으로
// data_only / pattern_unique / no_emotion 초안을 만든다.
// 여전히 사람이 최종 검토 필요 (fallback = "재검토 필요" 로 표시).
//
// 원칙 A 엄격 적용: 자동 생성된 근거가 약하면 해당 씬은 TSX 로 전환 권고.
//
// 사용: node scripts/inject-dsl-rationale.js <scenes-v2.json> [--dry-run]

const fs = require("fs");

const EMOTION_KEYWORDS = [
  /뉴스 \d/, /첫 번째|두 번째|세 번째|네 번째/,
  /분노|화나|뜨거운|뜨겁고|아쉬|답답|짜증/,
  /충격|극단|엄청|놀라|대박/,
  /승리|이겼|압도|최고|최상급/,
  /다음에 또|마치겠|사인오프|안녕히/,
  /대결|대비|vs|versus|경쟁/,
  /수렴|결국|미래|앞으로/,
];

const DATA_KEYWORDS = [
  /파라미터|license|Apache|버전/,
  /표|목록|리스트|정리/,
];

function isTsxWrapper(scene) {
  const root = scene?.stack_root;
  return root?.type === "SceneRoot" && root.children?.[0]?.type === "TSX";
}

function hasEmotion(narr) {
  return EMOTION_KEYWORDS.some((re) => re.test(narr || ""));
}

function extractPrimaryNodeTypes(stackRoot) {
  if (!stackRoot) return [];
  const types = [];
  function walk(node) {
    if (!node) return;
    if (node.type && !["SceneRoot", "Stack", "Grid", "Split", "FrameBox", "Absolute"].includes(node.type)) {
      types.push(node.type);
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  }
  walk(stackRoot);
  return types;
}

function main() {
  const file = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!file) {
    console.error("Usage: node scripts/inject-dsl-rationale.js <scenes-v2.json> [--dry-run]");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  // pattern_ref 를 프로젝트 전체에서 카운트
  const patternCount = new Map();
  for (const s of scenes) {
    if (isTsxWrapper(s)) continue;
    const pr = s.visual_plan?.pattern_ref;
    if (pr) patternCount.set(pr, (patternCount.get(pr) || 0) + 1);
  }

  let injected = 0;
  let suggestTsx = 0;
  const report = [];

  for (const s of scenes) {
    if (isTsxWrapper(s)) continue;
    if (s._dsl_rationale) continue; // 이미 기입된 것 skip

    const narr = s.narration || "";
    const pr = s.visual_plan?.pattern_ref || "(없음)";
    const prCount = patternCount.get(pr) || 1;
    const emo = hasEmotion(narr);
    const nodeTypes = extractPrimaryNodeTypes(s.stack_root);

    const data_only = DATA_KEYWORDS.some((re) => re.test(narr))
      ? "narration 이 수치/목록 제시 중심 (키워드 매칭)"
      : "자동 판정 불가 — 재검토 필요 (TSX 전환 후보)";

    const pattern_unique = prCount === 1
      ? `pattern_ref="${pr}" 프로젝트 내 1회만 사용 (unique 확인)`
      : `pattern_ref="${pr}" ${prCount}회 반복 — 재검토 필요 (TSX 전환 후보)`;

    const no_emotion = emo
      ? `narration 에 감정 키워드 검출 — 재검토 필요 (TSX 전환 후보)`
      : "narration 감정 비트 약함 (승부/대비/엔딩 키워드 미검출)";

    const weak = data_only.startsWith("자동") || pattern_unique.includes("반복") || no_emotion.startsWith("narration 에 감정");
    if (weak) suggestTsx++;

    s._dsl_rationale = { data_only, pattern_unique, no_emotion };
    s._dsl_rationale_auto_generated = true;
    s._dsl_rationale_review_required = weak;
    injected++;
    report.push({ id: s.id, weak, pr, emo });
  }

  if (!dryRun) {
    fs.writeFileSync(file, JSON.stringify(scenes, null, 2));
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`inject-dsl-rationale (R9 (f) 스캐폴드)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  주입: ${injected}  ·  TSX 전환 권고: ${suggestTsx}  ·  dry-run: ${dryRun}`);
  console.log(``);
  console.log(`[TSX 전환 권고 씬 — 3조건 중 하나라도 약함]`);
  for (const r of report.filter((r) => r.weak).slice(0, 20)) {
    console.log(`  ${r.id}  pattern=${r.pr}  emotion=${r.emo}`);
  }
}

main();
