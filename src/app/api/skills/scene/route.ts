// @TASK P1.5-SK2-T3 - /vg-scene Scene 생성 API Route
// @SPEC beats.json + catalog -> scene-plan.json + scenes.json 생성
// @TEST tests/api/skills-scene.test.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJSON, writeJSON, getProjectPath } from "@/services/file-service";
import {
  selectBestLayout,
  scoreAllLayouts,
  type ScoringInput,
  type ScoringContext,
  type ScoringResult,
} from "@/services/scoring-engine";
import { generateSceneDSL, type DSLGeneratorInput } from "@/services/dsl-generator";
import { groupBeatsIntoSceneBlocks, type SceneBlock } from "@/services/scene-blocks";
import { selectSvgLayoutReferencePack } from "@/services/svg-layout-selector";
import {
  pickVisualPlan,
  createPatternPickerContext,
  type PatternPickerContext,
} from "@/services/pattern-picker";
import type { Project, Scene, VisualPlan } from "@/types/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  shot_plan?: {
    shot_type?: string;
    [key: string]: unknown;
  };
}

interface ScenePlanEntry {
  scene_index: number;
  beat_range: [number, number];
  beat_count: number;
  selected_layout: string;
  score: number;
  breakdown: object;
  alternatives: Array<{ layout: string; score: number }>;
  layout_reference?: import("@/types/index").LayoutReferencePack;
  /** visual_plan commit — /vg-layout 은 이를 realize 만 수행 */
  visual_plan: VisualPlan;
}

interface ScenePlan {
  project_id: string;
  total_beats: number;
  total_scenes?: number;
  plans: ScenePlanEntry[];
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const SceneRequestSchema = z.object({
  project_id: z.string().min(1, "project_id는 필수입니다"),
});

function sceneBlockToScoringInput(block: SceneBlock): ScoringInput {
  const leadBeat = block.beats[0];
  const intents = block.beats.map((beat) => beat.semantic.intent);
  const evidenceTypes = block.beats.map((beat) => beat.semantic.evidence_type);
  const allTokens = Array.from(
    new Set(block.beats.flatMap((beat) => beat.semantic.emphasis_tokens))
  ).slice(0, 5);

  const intent =
    intents.find((value) => value === "compare") ??
    intents.find((value) => value === "sequence" || value === "list") ??
    intents.find((value) => value === "example") ??
    leadBeat.semantic.intent;

  const evidenceType =
    evidenceTypes.find((value) => value === "statistic") ??
    evidenceTypes.find((value) => value === "quote") ??
    evidenceTypes.find((value) => value === "example") ??
    leadBeat.semantic.evidence_type;

  const avgDensity = Math.round(
    block.beats.reduce((sum, beat) => sum + beat.semantic.density, 0) /
      Math.max(block.beats.length, 1)
  );

  return {
    intent,
    tone: leadBeat.semantic.tone,
    evidenceType,
    emphasisTokens: allTokens,
    density: Math.min(5, Math.max(1, avgDensity)),
    hasChartData: evidenceType === "statistic",
    hasIcons: allTokens.length > 0,
    shotType: leadBeat.shot_plan?.shot_type,
  };
}

// ---------------------------------------------------------------------------
// POST /api/skills/scene
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse & validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 JSON 형식입니다" },
        { status: 400 }
      );
    }

    const parsed = SceneRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "입력 검증 실패",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { project_id } = parsed.data;

    // 2. Read beats.json (required)
    const beatsPath = getProjectPath(project_id, "beats.json");
    const beats = await readJSON<Beat[]>(beatsPath);
    if (!beats || beats.length === 0) {
      return NextResponse.json(
        { error: `beats.json을 찾을 수 없거나 비어 있습니다: ${project_id}` },
        { status: 400 }
      );
    }

    // 3. Read design-tokens.json (optional, use defaults if missing)
    const designTokensPath = getProjectPath(project_id, "design-tokens.json");
    const _designTokens = await readJSON<Record<string, unknown>>(designTokensPath);
    // design-tokens are loaded for future use; defaults apply when null

    const sceneBlocks = groupBeatsIntoSceneBlocks(beats);

    // 4. Process each scene block: scoring + DSL generation + visual_plan commit
    const scoringContext: ScoringContext = {
      recentLayouts: [],
      previousLayout: null,
    };
    const patternContext: PatternPickerContext = createPatternPickerContext(
      sceneBlocks.length
    );

    const plans: ScenePlanEntry[] = [];
    const scenes: Scene[] = [];

    for (const block of sceneBlocks) {
      const scoringInput = sceneBlockToScoringInput(block);
      const leadBeat = block.beats[0];

      // 4a. Select best layout via scoring engine
      const bestResult: ScoringResult = selectBestLayout(scoringInput, { ...scoringContext });

      // 4b. Get all layout scores for alternatives
      const allResults = scoreAllLayouts(scoringInput, { ...scoringContext });
      const alternatives = allResults
        .filter((r) => r.layoutFamily !== bestResult.layoutFamily)
        .slice(0, 3)
        .map((r) => ({ layout: r.layoutFamily, score: r.score }));

      // 4c. Build scene plan entry
      const layoutReference = selectSvgLayoutReferencePack(
        scoringInput,
        bestResult.layoutFamily
      );

      // 4c-visual. visual_plan commit — /vg-layout 은 이 계획을 realize 만 수행
      const visualPlan = pickVisualPlan(scoringInput, block, patternContext);

      plans.push({
        scene_index: block.scene_index,
        beat_range: block.beat_range,
        beat_count: block.beat_count,
        selected_layout: bestResult.layoutFamily,
        score: bestResult.score,
        breakdown: bestResult.breakdown,
        alternatives,
        layout_reference: layoutReference,
        visual_plan: visualPlan,
      });

      // 4d. Generate Scene DSL
      const dslInput: DSLGeneratorInput = {
        beat: leadBeat,
        layoutFamily: bestResult.layoutFamily,
        projectId: project_id,
        sceneIndex: block.scene_index,
        sceneBlock: block,
        layoutReference: layoutReference,
      };
      const scene: Scene = {
        ...generateSceneDSL(dslInput),
        visual_plan: visualPlan,
      };
      scenes.push(scene);

      // 4e. Update scoring context for next beat (repetition penalty tracking)
      scoringContext.previousLayout = bestResult.layoutFamily;
      scoringContext.recentLayouts = [
        ...scoringContext.recentLayouts,
        bestResult.layoutFamily,
      ].slice(-3); // Keep last 3
    }

    // 5. Write scene-plan.json
    const scenePlan: ScenePlan = {
      project_id,
      total_beats: beats.length,
      total_scenes: sceneBlocks.length,
      plans,
    };
    const scenePlanPath = getProjectPath(project_id, "scene-plan.json");
    await writeJSON(scenePlanPath, scenePlan);

    // 6. Write scenes.json
    const scenesPath = getProjectPath(project_id, "scenes.json");
    await writeJSON(scenesPath, scenes);

    // 6b. Merge visual_plan into scenes-v2.json if it exists (realize-time 참조용).
    //     scenes-v2.json 에는 /vg-layout 이 stack_root 를 채운 상태일 수 있음.
    //     여기서는 visual_plan 만 덮어씌워 /vg-layout 이 최신 plan 을 realize 하게 한다.
    const scenesV2Path = getProjectPath(project_id, "scenes-v2.json");
    const existingV2 = await readJSON<Scene[]>(scenesV2Path);
    if (existingV2 && Array.isArray(existingV2) && existingV2.length === scenes.length) {
      const mergedV2 = existingV2.map((sc, i) => ({
        ...sc,
        visual_plan: scenes[i].visual_plan,
      }));
      await writeJSON(scenesV2Path, mergedV2);
    } else {
      // scenes-v2.json 이 없거나 길이 불일치면 scenes.json 을 그대로 복제
      await writeJSON(scenesV2Path, scenes);
    }

    // 6c. render-props-v2.json 자동 sync — Remotion 이 읽는 파일은 이것이다.
    //     이 sync 없이 scenes-v2.json 만 쓰면 렌더링에 반영되지 않는다.
    try {
      const projectPath = getProjectPath(project_id, "project.json");
      const project = await readJSON<Project>(projectPath);
      if (project) {
        const finalScenes = (await readJSON<Scene[]>(scenesV2Path)) ?? scenes;
        const durationInFrames = finalScenes.reduce(
          (sum, sc) => sum + Math.max(0, sc.duration_frames || 0),
          0
        );
        const renderProps = {
          scenes: finalScenes,
          durationInFrames,
          fps: 30,
          width: 1920,
          height: 1080,
          audioSrc: project.audio_path,
        };
        await writeJSON(
          getProjectPath(project_id, "render-props-v2.json"),
          renderProps
        );
      }
    } catch (err) {
      console.error("render-props sync 실패:", err);
    }

    // 7. Update project.json status to "scened"
    const projectPath = getProjectPath(project_id, "project.json");
    const project = await readJSON<Project>(projectPath);
    if (project) {
      const updatedProject: Project = {
        ...project,
        status: "scened",
        updated_at: new Date().toISOString(),
      };
      await writeJSON(projectPath, updatedProject);
    }

    // 8. Return success
    return NextResponse.json(
      {
        success: true,
        scenes_count: scenes.length,
        beats_count: beats.length,
        scene_plan_path: `data/${project_id}/scene-plan.json`,
        scenes_path: `data/${project_id}/scenes.json`,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "씬 생성 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
