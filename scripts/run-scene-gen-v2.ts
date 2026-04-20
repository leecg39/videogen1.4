/**
 * run-scene-gen-v2.ts — Geometry-First 6-Stage Pipeline
 *
 * Stage A: Beat Layer (beats.json — 이미 생성됨)
 * Stage B: Scene Block Layer (groupBeatsIntoSceneBlocks)
 * Stage C: Geometry Plan (planGeometry)
 * Stage D: Slot Copy (generateSlotCopy)
 * Stage E: Layout Compile (composeFromGeometry)
 * Stage F: Validation Gate (validateBeforeRender)
 *
 * 사용: npx tsx scripts/run-scene-gen-v2.ts <projectId>
 */

import * as fs from "fs";
import * as path from "path";
import {
  selectBestLayout,
  scoreAllLayouts,
  type ScoringInput,
  type ScoringContext,
} from "../src/services/scoring-engine";
import { generateSceneDSL, type DSLGeneratorInput } from "../src/services/dsl-generator";
import { groupBeatsIntoSceneBlocks, type SceneBlockBeat } from "../src/services/scene-blocks";
import { selectSvgLayoutReferencePack } from "../src/services/svg-layout-selector";
import {
  planGeometry,
  advanceContext,
  type GeometryContext,
  type GeometryPlan,
} from "../src/services/geometry-planner";
import { generateSlotCopy, type SlotCopy } from "../src/services/slot-copy-generator";
import { composeFromGeometry } from "../src/services/stack-composer";
import { validateBeforeRender } from "../src/services/render-validator";

const FPS = 30;

// scene.role → semantic.intent 매핑
const ROLE_TO_INTENT: Record<string, string> = {
  pause: "introduce",
  cluster: "list",
  declaration: "emphasize",
  evidence: "example",
  comparison: "compare",
  escalation: "stack",
  sequence: "sequence",
  metaphor: "focus",
  payoff: "highlight",
  support: "introduce",
};

function parseSrt(filePath: string): Array<{ start: number; end: number; text: string }> {
  const text = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const blocks = text.trim().split(/\n\n+/);
  const result: Array<{ start: number; end: number; text: string }> = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const times = lines[1].split(" --> ");
    const parseT = (t: string) => {
      const [hms, ms] = t.trim().split(",");
      const [h, m, s] = hms.split(":").map(Number);
      return h * 3600000 + m * 60000 + s * 1000 + Number(ms);
    };
    result.push({ start: parseT(times[0]), end: parseT(times[1]), text: lines.slice(2).join(" ") });
  }
  return result;
}

function getSubs(srt: ReturnType<typeof parseSrt>, startMs: number, endMs: number) {
  return srt
    .filter((e) => e.start >= startMs && e.end <= endMs + 500)
    .map((e) => ({ startTime: e.start / 1000, endTime: e.end / 1000, text: e.text }));
}

async function main() {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error("Usage: npx tsx scripts/run-scene-gen-v2.ts <projectId>");
    process.exit(1);
  }

  const dataDir = path.join("data", projectId);

  // ── Stage A: Beat Layer (이미 생성된 beats.json 읽기) ──
  const rawBeats = JSON.parse(fs.readFileSync(path.join(dataDir, "beats.json"), "utf-8"));
  const rawBeatList: any[] = Array.isArray(rawBeats) ? rawBeats : rawBeats.beats ?? [];
  console.log(`✅ Stage A: ${rawBeatList.length}개 beats 로드`);

  // SceneBlockBeat 형식 변환
  const beats: SceneBlockBeat[] = rawBeatList.map((b: any) => ({
    beat_index: b.beat_index,
    start_ms: b.start_ms,
    end_ms: b.end_ms,
    start_frame: Math.round((b.start_ms / 1000) * FPS),
    end_frame: Math.round((b.end_ms / 1000) * FPS),
    text: b.text,
    semantic: {
      intent: ROLE_TO_INTENT[b.scene?.role ?? ""] ?? "introduce",
      tone: b.semantic?.tone ?? "neutral",
      evidence_type: b.semantic?.evidence_type ?? "statement",
      emphasis_tokens: b.semantic?.emphasis_tokens ?? [],
      density: b.semantic?.density ?? 2,
    },
  }));

  // SRT 읽기
  let srt: ReturnType<typeof parseSrt> = [];
  try {
    const proj = JSON.parse(fs.readFileSync(path.join(dataDir, "project.json"), "utf-8"));
    const srtPath = path.join("public", proj.srt_path);
    if (fs.existsSync(srtPath)) {
      srt = parseSrt(srtPath);
      console.log(`✅ SRT: ${srt.length}개 엔트리`);
    }
  } catch { console.log("⚠ SRT 없음"); }

  // ── Stage B: Scene Block Layer ──
  const blocks = groupBeatsIntoSceneBlocks(beats);
  console.log(`✅ Stage B: ${blocks.length}개 scene blocks`);

  // ── Stage C + D + E: Geometry Plan → Slot Copy → Layout Compile ──
  const scoringCtx: ScoringContext = { recentLayouts: [], previousLayout: null };
  let geoCtx: GeometryContext = { recent_silhouettes: [], recent_families: [], scene_count: 0 };

  const geometryPlans: GeometryPlan[] = [];
  const slotCopies: SlotCopy[] = [];
  const plans: any[] = [];
  const scenes: any[] = [];

  for (const block of blocks) {
    const leadBeat = block.beats[0];
    const allTokens = Array.from(
      new Set(block.beats.flatMap((b) => b.semantic.emphasis_tokens))
    ).slice(0, 5);
    const intents = block.beats.map((b) => b.semantic.intent);
    const intent =
      intents.find((v) => v === "compare") ??
      intents.find((v) => v === "sequence" || v === "list") ??
      intents.find((v) => v === "example") ??
      leadBeat.semantic.intent;
    const evidenceTypes = block.beats.map((b) => b.semantic.evidence_type);
    const evidenceType =
      evidenceTypes.find((v) => v === "statistic") ??
      evidenceTypes.find((v) => v === "quote") ??
      leadBeat.semantic.evidence_type;
    const avgDensity = Math.round(
      block.beats.reduce((s, b) => s + b.semantic.density, 0) / Math.max(block.beats.length, 1)
    );

    const scoringInput: ScoringInput = {
      intent,
      tone: leadBeat.semantic.tone,
      evidenceType,
      emphasisTokens: allTokens,
      density: Math.min(5, Math.max(1, avgDensity)),
      hasChartData: evidenceType === "statistic",
      hasIcons: allTokens.length > 0,
    };

    // Scoring
    const best = selectBestLayout(scoringInput, { ...scoringCtx });
    const all = scoreAllLayouts(scoringInput, { ...scoringCtx });
    const alts = all
      .filter((r) => r.layoutFamily !== best.layoutFamily)
      .slice(0, 3)
      .map((r) => ({ layout: r.layoutFamily, score: r.score }));
    const layoutReference = selectSvgLayoutReferencePack(scoringInput, best.layoutFamily);

    // ── Stage C: Geometry Plan ──
    const familyId = layoutReference.primary_family_id;
    const geoPlan = planGeometry(
      block.scene_index,
      familyId,
      avgDensity,
      layoutReference,
      geoCtx,
    );
    geometryPlans.push(geoPlan);

    // ── Stage D: Slot Copy ──
    const slotCopy = generateSlotCopy(geoPlan, block.text ?? leadBeat.text, allTokens);
    slotCopies.push(slotCopy);

    // ── Stage E: Layout Compile ──
    const stackRoot = composeFromGeometry(geoPlan, slotCopy);

    // Scene plan entry
    plans.push({
      scene_index: block.scene_index,
      beat_range: block.beat_range,
      beat_count: block.beat_count,
      selected_layout: best.layoutFamily,
      score: best.score,
      breakdown: best.breakdown,
      alternatives: alts,
      layout_reference: layoutReference,
      geometry_plan: {
        silhouette_id: geoPlan.silhouette_id,
        eye_path: geoPlan.eye_path,
        density_class: geoPlan.density_class,
        asymmetry: geoPlan.asymmetry,
      },
    });

    // Build scene DSL (base fields from generateSceneDSL)
    const dslInput: DSLGeneratorInput = {
      beat: leadBeat,
      layoutFamily: best.layoutFamily,
      projectId,
      sceneIndex: block.scene_index,
      sceneBlock: block,
      layoutReference,
    };
    const baseDsl = generateSceneDSL(dslInput);

    // Merge with geometry-compiled stack_root
    const blockSubs = getSubs(srt, block.start_ms, block.end_ms);
    scenes.push({
      ...baseDsl,
      stack_root: stackRoot,
      subtitles: blockSubs,
      narration: block.text ?? leadBeat.text,
      transition: { type: "none", durationFrames: 0 },
      geometry_plan: {
        silhouette_id: geoPlan.silhouette_id,
        family_id: geoPlan.family_id,
        eye_path: geoPlan.eye_path,
      },
    });

    // Update contexts
    scoringCtx.previousLayout = best.layoutFamily;
    scoringCtx.recentLayouts = [...scoringCtx.recentLayouts, best.layoutFamily].slice(-3);
    geoCtx = advanceContext(geoCtx, geoPlan);
  }

  console.log(`✅ Stage C: ${geometryPlans.length}개 geometry plans`);
  console.log(`✅ Stage D: ${slotCopies.length}개 slot copies`);
  console.log(`✅ Stage E: ${scenes.length}개 scenes compiled`);

  // ── Stage F: Validation Gate ──
  const validation = validateBeforeRender(scenes as any);
  console.log(`\n🔍 Stage F: Validation`);
  if (validation.issues.length > 0) {
    console.log("  Issues:");
    validation.issues.forEach((i) => console.log(`    ❌ ${i}`));
  }
  if (validation.warnings.length > 0) {
    console.log("  Warnings:");
    validation.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
  }
  if (validation.pass) {
    console.log("  ✅ Validation PASSED");
  } else {
    console.log("  ❌ Validation FAILED — issues above need fixing");
  }

  // Save outputs
  fs.writeFileSync(
    path.join(dataDir, "scene-plan.json"),
    JSON.stringify({
      project_id: projectId,
      total_beats: beats.length,
      total_scenes: blocks.length,
      plans,
    }, null, 2)
  );
  fs.writeFileSync(
    path.join(dataDir, "geometry-plan.json"),
    JSON.stringify(geometryPlans, null, 2)
  );
  fs.writeFileSync(
    path.join(dataDir, "scenes-v2.json"),
    JSON.stringify(scenes, null, 2)
  );

  // Silhouette distribution
  const silDist: Record<string, number> = {};
  geometryPlans.forEach((g) => { silDist[g.silhouette_id] = (silDist[g.silhouette_id] || 0) + 1; });
  console.log("\n📊 Silhouette 분포:");
  Object.entries(silDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Family distribution
  const famDist: Record<string, number> = {};
  plans.forEach((p) => { famDist[p.layout_reference.primary_family_id] = (famDist[p.layout_reference.primary_family_id] || 0) + 1; });
  console.log("\n📊 Family 분포:");
  Object.entries(famDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log(`\n✅ 저장 완료: scene-plan.json, geometry-plan.json, scenes-v2.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
