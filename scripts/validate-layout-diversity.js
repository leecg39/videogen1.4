#!/usr/bin/env node
// validate-layout-diversity.js — HARD GATE: stack_root 구조 다양성 검증
//
// 목적: "씬별 수동 설계" 강제. 배치 스크립트로 동일 shape 반복한 결과를 탐지해 렌더 차단.
// 검증 규칙 (CLAUDE.md + vg-layout SKILL 법칙):
//   (1) 같은 stack_root shape 해시 3회 이상 = FAIL
//   (2) 연속 동일 layout_family 3회 이상 = FAIL
//   (3) 고유 layout_family 종류 < 6 = FAIL
//   (4) 고유 노드 타입 < 10종 = FAIL
//   (5) 비카드(focal-only) 비율 < 40% = FAIL
//   (6) Split 비율 > 30% = FAIL
//   (7) visual_plan.pattern_ref 연속 동일 3회 이상 = FAIL (/vg-scene commit 무시 탐지)
//   (8) stack_root 가 visual_plan.focal.type 을 포함 = CHECK (realize fidelity)
//
// 이 가드는 /vg-layout 의 핵심 법칙("씬별 수동 설계")을 자동화 체크로 강제한다.
// 위반 시 exit 1 → postprocess.sh 중단 → 렌더 불가.

const fs = require("fs");
const crypto = require("crypto");

function shapeHash(node) {
  if (!node || typeof node !== "object") return "leaf";
  const out = { t: node.type };
  const kids = node.children || node.items;
  if (Array.isArray(kids)) out.c = kids.map(shapeHash);
  return crypto
    .createHash("md5")
    .update(JSON.stringify(out))
    .digest("hex")
    .slice(0, 8);
}

function collectNodeTypes(node, set) {
  if (!node || typeof node !== "object") return;
  if (node.type) set.add(node.type);
  const kids = node.children || node.items;
  if (Array.isArray(kids)) kids.forEach((k) => collectNodeTypes(k, set));
}

function isNonCardScene(sc) {
  const root = sc.stack_root;
  if (!root || !Array.isArray(root.children)) return false;
  // focal-only: SceneRoot 직계 자식 중 Split/Grid/Stack/FrameBox 컨테이너가 0개
  const CONTAINERS = new Set(["Split", "Grid", "Stack", "FrameBox"]);
  return !root.children.some((c) => CONTAINERS.has(c?.type));
}

function hasSplitTopLevel(sc) {
  const root = sc.stack_root;
  if (!root || !Array.isArray(root.children)) return false;
  return root.children.some((c) => c?.type === "Split");
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-layout-diversity.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  const total = scenes.length;
  const failures = [];
  const warnings = [];

  // (1) stack_root shape 반복 검사
  const shapeCount = new Map();
  const shapeScenes = new Map();
  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    const h = shapeHash(sc.stack_root);
    shapeCount.set(h, (shapeCount.get(h) || 0) + 1);
    if (!shapeScenes.has(h)) shapeScenes.set(h, []);
    shapeScenes.get(h).push(sc.id);
  }
  for (const [h, n] of shapeCount) {
    if (n >= 3) {
      failures.push(
        `[diversity:shape] 동일 stack_root shape (${h}) 가 ${n}개 씬에서 반복 — ` +
          `${shapeScenes.get(h).slice(0, 6).join(", ")}${
            n > 6 ? " ..." : ""
          }. "씬별 수동 설계" 법칙 위반.`
      );
    }
  }

  // (2) 연속 동일 layout_family
  let prevFam = null;
  let runStart = 0;
  let runLen = 0;
  const runs = [];
  scenes.forEach((sc, i) => {
    const fam = sc.layout_family || "?";
    if (fam === prevFam) {
      runLen += 1;
    } else {
      if (runLen >= 3) {
        runs.push({
          fam: prevFam,
          start: runStart,
          end: i - 1,
          len: runLen,
        });
      }
      prevFam = fam;
      runStart = i;
      runLen = 1;
    }
  });
  if (runLen >= 3) {
    runs.push({
      fam: prevFam,
      start: runStart,
      end: scenes.length - 1,
      len: runLen,
    });
  }
  for (const r of runs) {
    failures.push(
      `[diversity:family-run] layout_family="${r.fam}" 이 scene-${r.start}~scene-${r.end} (${r.len}개 연속). ` +
        `"같은 구도 2연속 금지" 법칙 위반.`
    );
  }

  // (3) 고유 layout_family 종류
  const fams = new Set(scenes.map((s) => s.layout_family).filter(Boolean));
  if (fams.size < 6) {
    failures.push(
      `[diversity:family-variety] 고유 layout_family ${fams.size}종 (< 6). ` +
        `12+ 레이아웃 문법 요구. 발견: ${Array.from(fams).join(", ")}.`
    );
  }

  // (4) 고유 노드 타입 ≥ 10
  const nodeTypes = new Set();
  for (const sc of scenes) collectNodeTypes(sc.stack_root, nodeTypes);
  nodeTypes.delete("SceneRoot");
  if (nodeTypes.size < 10) {
    failures.push(
      `[diversity:node-variety] 고유 노드 타입 ${nodeTypes.size}종 (< 10). ` +
        `사용된 타입: ${Array.from(nodeTypes).sort().join(", ")}.`
    );
  }

  // (5) 비카드 비율
  const nonCard = scenes.filter(isNonCardScene).length;
  const nonCardPct = total > 0 ? (nonCard / total) * 100 : 0;
  if (nonCardPct < 40) {
    failures.push(
      `[diversity:non-card-ratio] 비카드(focal-only) 씬 ${nonCard}/${total} = ${nonCardPct.toFixed(1)}% (< 40%). ` +
        `카드 씬만 배열한 건 파워포인트.`
    );
  }

  // (6) Split 상위비율
  const splits = scenes.filter(hasSplitTopLevel).length;
  const splitPct = total > 0 ? (splits / total) * 100 : 0;
  if (splitPct > 30) {
    failures.push(
      `[diversity:split-overuse] Split 최상위 컨테이너 ${splits}/${total} = ${splitPct.toFixed(1)}% (> 30%). ` +
        `Split 2연속 금지 / 최대 30% 초과.`
    );
  }

  // (7) visual_plan.pattern_ref 연속 동일 검사
  const withPlan = scenes.filter((s) => s.visual_plan?.pattern_ref);
  if (withPlan.length > 0) {
    let prevRef = null;
    let refRunStart = 0;
    let refRunLen = 0;
    const refRuns = [];
    scenes.forEach((sc, i) => {
      const ref = sc.visual_plan?.pattern_ref || null;
      if (ref && ref === prevRef) {
        refRunLen += 1;
      } else {
        if (refRunLen >= 3 && prevRef) {
          refRuns.push({
            ref: prevRef,
            start: refRunStart,
            end: i - 1,
            len: refRunLen,
          });
        }
        prevRef = ref;
        refRunStart = i;
        refRunLen = ref ? 1 : 0;
      }
    });
    if (refRunLen >= 3 && prevRef) {
      refRuns.push({
        ref: prevRef,
        start: refRunStart,
        end: scenes.length - 1,
        len: refRunLen,
      });
    }
    for (const r of refRuns) {
      failures.push(
        `[diversity:pattern-run] visual_plan.pattern_ref="${r.ref}" 이 ` +
          `scene-${r.start}~scene-${r.end} (${r.len}개 연속). ` +
          `/vg-scene 의 pattern commit 이 rotation 을 지키지 못함.`
      );
    }
  }

  // (8) realize fidelity — focal.type 이 stack_root 에 등장하는지 (substitution family 허용)
  // 의미적으로 교환 가능한 노드 쌍은 등가로 인정: "realize only" 는 composition 보존이지 정확한 노드 일치가 아님.
  const FOCAL_SUBSTITUTIONS = {
    ImpactStat: ["NumberCircle", "AnimatedCounter", "MarkerHighlight", "DualToneText"],
    NumberCircle: ["ImpactStat"],
    ImageAsset: ["DevIcon", "FreeText"],
    DevIcon: ["ImageAsset"],
    CompareBars: ["ProgressBar", "AreaChart", "DataTable", "VerticalBars"],
    VerticalBars: ["CompareBars", "ProgressBar", "DataTable"],
    RingChart: ["PieChart"],
    PieChart: ["RingChart"],
    VersusCard: ["CompareCard", "SplitRevealCard", "Split"],
    FlowDiagram: ["AnimatedTimeline", "CycleDiagram"],
    AnimatedTimeline: ["FlowDiagram", "CycleDiagram"],
    CycleDiagram: ["FlowDiagram", "AnimatedTimeline", "BrandSatellite"],
    BulletList: ["CheckMark", "DataTable", "EmojiIconList"],
    EmojiIconList: ["BulletList", "CheckMark"],
    SvgGraphic: ["FreeText"],
    IconCard: ["FrameBox"],
    BrandSatellite: ["CycleDiagram"],
    TerminalBlock: ["FrameBox", "QuoteText"],
    Grid: ["Stack"],
  };
  function focalMatches(focalType, types) {
    if (types.has(focalType)) return true;
    const subs = FOCAL_SUBSTITUTIONS[focalType] || [];
    return subs.some((t) => types.has(t));
  }
  if (withPlan.length > 0) {
    const fidelityMisses = [];
    for (const sc of withPlan) {
      if (!sc.stack_root) continue;
      const focalType = sc.visual_plan.focal?.type;
      if (!focalType) continue;
      const types = new Set();
      collectNodeTypes(sc.stack_root, types);
      if (!focalMatches(focalType, types)) {
        fidelityMisses.push(`${sc.id} (plan=${focalType} missing)`);
      }
    }
    if (fidelityMisses.length >= Math.max(3, Math.floor(withPlan.length * 0.25))) {
      failures.push(
        `[diversity:plan-fidelity] visual_plan.focal.type 이 stack_root 에 없는 씬 ` +
          `${fidelityMisses.length}/${withPlan.length}개 (25% 초과). ` +
          `/vg-layout 이 plan 을 realize 하지 않음: ` +
          `${fidelityMisses.slice(0, 5).join(", ")}${
            fidelityMisses.length > 5 ? " ..." : ""
          }.`
      );
    } else if (fidelityMisses.length > 0) {
      warnings.push(
        `[diversity:plan-fidelity] ${fidelityMisses.length}/${withPlan.length} 씬이 plan 과 다른 focal 사용.`
      );
    }
  }

  // 요약
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 layout diversity 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${total}`);
  console.log(`  고유 layout_family: ${fams.size}`);
  console.log(`  고유 노드 타입: ${nodeTypes.size}`);
  console.log(`  비카드(focal-only) 비율: ${nonCardPct.toFixed(1)}%`);
  console.log(`  Split 상위 비율: ${splitPct.toFixed(1)}%`);
  console.log(`  distinct stack_root shape: ${shapeCount.size} / ${total}`);
  const planCount = scenes.filter((s) => s.visual_plan?.pattern_ref).length;
  console.log(`  visual_plan coverage: ${planCount} / ${total}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ 다양성 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 다양성 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: 반복된 shape 의 씬들을 개별 재설계하세요. 배치 스크립트/템플릿 루프로 생성한 결과는 여기서 차단됩니다."
  );
  process.exit(1);
}

main();
