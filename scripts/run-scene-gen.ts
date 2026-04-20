import { readJSON, writeJSON, getProjectPath } from "../src/services/file-service";
import {
  selectBestLayout,
  scoreAllLayouts,
  type ScoringInput,
  type ScoringContext,
} from "../src/services/scoring-engine";
import { generateSceneDSL, type DSLGeneratorInput } from "../src/services/dsl-generator";
import { groupBeatsIntoSceneBlocks, type SceneBlock } from "../src/services/scene-blocks";
import { selectSvgLayoutReferencePack } from "../src/services/svg-layout-selector";

interface Beat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  text: string;
  semantic: {
    intent: string;
    tone: string;
    evidence_type: string;
    emphasis_tokens: string[];
    density: number;
  };
}

async function main() {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error("Usage: npx tsx scripts/run-scene-gen.ts <projectId>");
    process.exit(1);
  }

  const beats = await readJSON<Beat[]>(getProjectPath(projectId, "beats.json"));
  if (!beats || beats.length === 0) {
    console.error("No beats.json found or empty");
    process.exit(1);
  }

  const sceneBlocks = groupBeatsIntoSceneBlocks(beats);
  const ctx: ScoringContext = { recentLayouts: [], previousLayout: null };
  const plans: Array<{
    scene_index: number;
    beat_range: [number, number];
    beat_count: number;
    selected_layout: string;
    score: number;
    breakdown: object;
    alternatives: Array<{ layout: string; score: number }>;
    layout_reference: ReturnType<typeof selectSvgLayoutReferencePack>;
  }> = [];
  const scenes: unknown[] = [];

  function blockToScoringInput(block: SceneBlock): ScoringInput {
    const leadBeat = block.beats[0];
    const allTokens = Array.from(
      new Set(block.beats.flatMap((beat) => beat.semantic.emphasis_tokens))
    ).slice(0, 5);
    const evidenceType =
      block.beats.find((beat) => beat.semantic.evidence_type === "statistic")
        ?.semantic.evidence_type ?? leadBeat.semantic.evidence_type;
    const avgDensity = Math.round(
      block.beats.reduce((sum, beat) => sum + beat.semantic.density, 0) /
        Math.max(block.beats.length, 1)
    );

    return {
      intent: leadBeat.semantic.intent,
      tone: leadBeat.semantic.tone,
      evidenceType,
      emphasisTokens: allTokens,
      density: Math.min(5, Math.max(1, avgDensity)),
      hasChartData: evidenceType === "statistic",
      hasIcons: allTokens.length > 0,
    };
  }

  for (const block of sceneBlocks) {
    const input = blockToScoringInput(block);

    const best = selectBestLayout(input, { ...ctx });
    const all = scoreAllLayouts(input, { ...ctx });
    const alts = all
      .filter((r) => r.layoutFamily !== best.layoutFamily)
      .slice(0, 3)
      .map((r) => ({ layout: r.layoutFamily, score: r.score }));
    const layoutReference = selectSvgLayoutReferencePack(input, best.layoutFamily);

    plans.push({
      scene_index: block.scene_index,
      beat_range: block.beat_range,
      beat_count: block.beat_count,
      selected_layout: best.layoutFamily,
      score: best.score,
      breakdown: best.breakdown,
      alternatives: alts,
      layout_reference: layoutReference,
    });

    const leadBeat = block.beats[0];
    const dslInput: DSLGeneratorInput = {
      beat: leadBeat,
      layoutFamily: best.layoutFamily,
      projectId,
      sceneIndex: block.scene_index,
      sceneBlock: block,
      layoutReference: layoutReference,
    };
    scenes.push({
      ...generateSceneDSL(dslInput),
    });

    ctx.previousLayout = best.layoutFamily;
    ctx.recentLayouts = [...ctx.recentLayouts, best.layoutFamily].slice(-3);
  }

  await writeJSON(getProjectPath(projectId, "scene-plan.json"), {
    project_id: projectId,
    total_beats: beats.length,
    total_scenes: sceneBlocks.length,
    plans,
  });
  await writeJSON(getProjectPath(projectId, "scenes.json"), scenes);

  // Update project status
  const proj = await readJSON<Record<string, unknown>>(
    getProjectPath(projectId, "project.json")
  );
  if (proj) {
    proj.status = "scened";
    proj.updated_at = new Date().toISOString();
    await writeJSON(getProjectPath(projectId, "project.json"), proj);
  }

  // Layout distribution
  const dist: Record<string, number> = {};
  plans.forEach((p) => {
    dist[p.selected_layout] = (dist[p.selected_layout] || 0) + 1;
  });

  console.log(`✅ ${projectId}: ${scenes.length} scenes generated`);
  console.log("Layout distribution:", JSON.stringify(dist, null, 2));
}

main();
