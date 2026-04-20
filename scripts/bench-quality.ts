/**
 * bench-quality.ts — 스킬 품질 벤치마크
 *
 * 측정 메트릭:
 *   1. layout_diversity  : 사용된 고유 레이아웃 / 전체 씬 수 (0~1, 높을수록 다양)
 *   2. template_diversity : 사용된 고유 템플릿 / 전체 씬 수 (0~1)
 *   3. sync_match_rate    : 자막 매칭된 노드 / 전체 animated 노드 (0~1)
 *   4. repetition_penalty : 연속 동일 레이아웃 발생 횟수 (0이 최적)
 *   5. composite_score    : 가중 합산 (높을수록 좋음, 0~100)
 *
 * 사용법:
 *   npx tsx scripts/bench-quality.ts [projectId1] [projectId2] ...
 *   npx tsx scripts/bench-quality.ts          # 기본: rag-intro, rag3
 */

import {
  selectBestLayout,
  scoreAllLayouts,
  type ScoringInput,
  type ScoringContext,
} from "../src/services/scoring-engine";
import { generateSceneDSLv2 } from "../src/services/dsl-generator";
import { resetRecentTemplates } from "../src/services/stack-composer";
import { readJSON, getProjectPath } from "../src/services/file-service";

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
}

interface StackNode {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  motion?: { preset?: string; enterAt?: number; duration?: number };
  children?: StackNode[];
}

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

// ---------------------------------------------------------------------------
// Subtitle sync analysis
// ---------------------------------------------------------------------------

const HEADER_TYPES = new Set([
  "Badge", "Icon", "Kicker", "Headline", "Divider", "AccentRing",
]);

function collectAnimatedNodes(node: StackNode): StackNode[] {
  const result: StackNode[] = [];
  function walk(n: StackNode) {
    if (n.motion?.preset) result.push(n);
    if (n.children) for (const c of n.children) walk(c);
  }
  walk(node);
  return result;
}

function extractNodeText(node: StackNode): string {
  const parts: string[] = [];
  function collect(n: StackNode) {
    const d = (n.data ?? {}) as Record<string, unknown>;
    for (const key of ["text", "title", "body", "label", "desc", "step"]) {
      if (typeof d[key] === "string") parts.push(d[key] as string);
    }
    if (Array.isArray(d.items)) {
      for (const item of d.items) {
        if (typeof item === "string") parts.push(item);
        else if (item?.label) parts.push(item.label);
        else if (item?.title) parts.push(item.title);
      }
    }
    if (n.children) for (const c of n.children) collect(c);
  }
  collect(node);
  return parts.join(" ");
}

function extractKeywords(text: string): string[] {
  const clean = text
    .replace(/\n/g, " ")
    .replace(/[✕✓→↑↓↗=•·\-–—|:;,.\[\](){}'"「」『』""''/\\]/g, " ");
  return [...new Set(clean.split(/\s+/).filter((t) => t.length >= 2))];
}

function matchScore(keywords: string[], subtitleText: string): number {
  let score = 0;
  for (const kw of keywords) {
    if (subtitleText.includes(kw)) {
      score += kw.length;
    } else if (kw.length >= 3) {
      const prefix = kw.slice(0, Math.ceil(kw.length * 0.7));
      if (subtitleText.includes(prefix)) {
        score += Math.floor(prefix.length * 0.6);
      }
    }
  }
  return score;
}

/**
 * 씬의 자막 매칭률을 계산합니다.
 * 반환: { totalContent, matched, rate }
 */
function analyzeSubtitleSync(
  stackRoot: StackNode,
  subtitles: Subtitle[],
): { totalContent: number; matched: number; rate: number } {
  const animated = collectAnimatedNodes(stackRoot);
  const contents = animated.filter((n) => !HEADER_TYPES.has(n.type));

  if (contents.length === 0 || subtitles.length === 0) {
    return { totalContent: contents.length, matched: 0, rate: 0 };
  }

  let matched = 0;
  for (const node of contents) {
    const text = extractNodeText(node);
    const keywords = extractKeywords(text);
    if (keywords.length === 0) continue;

    let bestScore = 0;
    for (const sub of subtitles) {
      const score = matchScore(keywords, sub.text);
      if (score > bestScore) bestScore = score;
    }
    if (bestScore >= 2) matched++;
  }

  return {
    totalContent: contents.length,
    matched,
    rate: contents.length > 0 ? matched / contents.length : 0,
  };
}

// ---------------------------------------------------------------------------
// Template type extraction from stack_root
// ---------------------------------------------------------------------------

function inferTemplateType(stackRoot: StackNode): string {
  const children = stackRoot.children ?? [];
  const allTypes = new Set<string>();
  const typeCounts: Record<string, number> = {};
  function collectTypes(n: StackNode) {
    allTypes.add(n.type);
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    if (n.children) for (const c of n.children) collectTypes(c);
  }
  collectTypes(stackRoot);

  // 특징적 노드 조합으로 템플릿 식별 (구체적 → 일반적 순서)
  if (allTypes.has("Overlay") && allTypes.has("AccentRing")) return "introduceHero";
  if (allTypes.has("Overlay") && allTypes.has("AccentGlow")) return "glowEmphasis";
  if (allTypes.has("CompareCard")) return "splitCompare";
  if (allTypes.has("CompareBars") && allTypes.has("MiniBarChart")) return "statisticBars";
  if (allTypes.has("CompareBars")) return "statisticBars";
  if (allTypes.has("MiniBarChart")) return "statisticBars";
  if (allTypes.has("RingChart")) return "explainChart";
  if (allTypes.has("ProcessStepCard")) return "processFlow";
  if (allTypes.has("WarningCard")) return "warningAlert";
  if (allTypes.has("QuoteText")) return allTypes.has("Kicker") ? "emphasizeQuoteBox" : "quoteEmphasis";
  if (allTypes.has("ArrowConnector") && allTypes.has("Icon")) return "analogyVisual";
  if (allTypes.has("Grid") && allTypes.has("InsightTile")) return "summaryGrid";
  if (allTypes.has("Grid") && allTypes.has("IconCard")) return "iconGrid";
  if (allTypes.has("Grid")) return "iconGrid";
  if (allTypes.has("Split") && allTypes.has("IconCard")) return "splitIconCards";
  if (allTypes.has("Split")) return "splitCompare";
  if (allTypes.has("StatNumber")) return "statHighlight";
  if (allTypes.has("InsightTile") && (typeCounts["InsightTile"] ?? 0) >= 4) return "verticalList";
  if (allTypes.has("InsightTile")) return "insightList";
  if (allTypes.has("BulletList")) return "listBullets";

  // FrameBox 기반 (definitionFrame, keywordFlow)
  if (allTypes.has("FrameBox")) {
    if (allTypes.has("Pill") || allTypes.has("Badge")) return "keywordFlow";
    return "definitionFrame";
  }

  // Headline + BodyText + Icon = heroCenter
  if (allTypes.has("Headline") && allTypes.has("BodyText") && allTypes.has("Icon")) return "heroCenter";
  if (allTypes.has("Headline") && allTypes.has("BodyText")) return "heroCenter";
  if (allTypes.has("Headline") && allTypes.has("Divider")) return "heroCenter";

  // numbered timeline
  if (allTypes.has("Badge") && (typeCounts["Badge"] ?? 0) >= 3 && allTypes.has("LineConnector")) return "numberedTimeline";

  return "unknown";
}

// ---------------------------------------------------------------------------
// Main benchmark
// ---------------------------------------------------------------------------

async function benchmarkProject(projectId: string) {
  const beats = await readJSON<Beat[]>(getProjectPath(projectId, "beats.json"));
  if (!beats || beats.length === 0) {
    console.error(`  ⛔ ${projectId}: beats.json 없음`);
    return null;
  }

  // 기존 scenes-v2.json에서 자막 정보 가져오기
  const existingScenes = await readJSON<Array<{
    subtitles?: Subtitle[];
    [key: string]: unknown;
  }>>(getProjectPath(projectId, "scenes-v2.json"));

  resetRecentTemplates();
  const ctx: ScoringContext = { recentLayouts: [], previousLayout: null };

  const layouts: string[] = [];
  const templates: string[] = [];
  let totalContent = 0;
  let totalMatched = 0;
  let consecutiveRepeats = 0;

  for (const beat of beats) {
    const input: ScoringInput = {
      intent: beat.semantic.intent,
      tone: beat.semantic.tone,
      evidenceType: beat.semantic.evidence_type,
      emphasisTokens: [...beat.semantic.emphasis_tokens],
      density: beat.semantic.density,
      hasChartData: false,
      hasIcons: false,
    };

    const best = selectBestLayout(input, { ...ctx });
    layouts.push(best.layoutFamily);

    // 연속 반복 카운트
    if (ctx.previousLayout === best.layoutFamily) {
      consecutiveRepeats++;
    }

    const scene = generateSceneDSLv2({
      beat,
      layoutFamily: best.layoutFamily,
      projectId,
    });

    // 템플릿 타입 추론
    if (scene.stack_root) {
      const tmpl = inferTemplateType(scene.stack_root as unknown as StackNode);
      templates.push(tmpl);

      // 자막 매칭 분석 — 시간 기반으로 씬 찾기 (beat_index가 아닌 시간 오버랩)
      const matchedScene = existingScenes?.find((s: any) => {
        const sStart = s.start_ms ?? 0;
        const sEnd = s.end_ms ?? 0;
        return beat.start_ms < sEnd && beat.end_ms > sStart;
      });
      const subtitles = (matchedScene as any)?.subtitles ?? [];
      if (subtitles.length > 0) {
        const sync = analyzeSubtitleSync(
          scene.stack_root as unknown as StackNode,
          subtitles,
        );
        totalContent += sync.totalContent;
        totalMatched += sync.matched;
      }
    }

    ctx.previousLayout = best.layoutFamily;
    ctx.recentLayouts = [...ctx.recentLayouts, best.layoutFamily].slice(-3);
  }

  const totalScenes = beats.length;
  const uniqueLayouts = new Set(layouts).size;
  const uniqueTemplates = new Set(templates).size;
  const layoutDiversity = uniqueLayouts / Math.min(totalScenes, 8); // 최대 8종
  const templateDiversity = uniqueTemplates / Math.min(totalScenes, 20); // 최대 20종
  const syncRate = totalContent > 0 ? totalMatched / totalContent : 0;

  // 복합 점수: layout 25 + template 35 + sync 30 + repeat 10
  const compositeScore =
    layoutDiversity * 25 +
    templateDiversity * 35 +
    syncRate * 30 +
    Math.max(0, 10 - consecutiveRepeats * 5);

  return {
    projectId,
    totalScenes,
    uniqueLayouts,
    uniqueTemplates,
    layoutDiversity: Math.round(layoutDiversity * 100) / 100,
    templateDiversity: Math.round(templateDiversity * 100) / 100,
    syncRate: Math.round(syncRate * 100) / 100,
    consecutiveRepeats,
    totalContent,
    totalMatched,
    compositeScore: Math.round(compositeScore * 100) / 100,
    layoutDist: layouts.reduce((acc, l) => { acc[l] = (acc[l] || 0) + 1; return acc; }, {} as Record<string, number>),
    templateDist: templates.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const projectIds = args.length > 0 ? args : ["rag-intro", "rag3", "value-labor-v2"];

  let totalComposite = 0;
  let count = 0;

  for (const pid of projectIds) {
    const result = await benchmarkProject(pid);
    if (!result) continue;

    console.log(`\n=== ${result.projectId} (${result.totalScenes} scenes) ===`);
    console.log(`  layout_diversity:   ${result.layoutDiversity} (${result.uniqueLayouts}/${Math.min(result.totalScenes, 8)} families)`);
    console.log(`  template_diversity: ${result.templateDiversity} (${result.uniqueTemplates}/${Math.min(result.totalScenes, 20)} templates)`);
    console.log(`  sync_match_rate:    ${result.syncRate} (${result.totalMatched}/${result.totalContent} nodes)`);
    console.log(`  consecutive_repeats: ${result.consecutiveRepeats}`);
    console.log(`  layout_dist: ${JSON.stringify(result.layoutDist)}`);
    console.log(`  template_dist: ${JSON.stringify(result.templateDist)}`);

    totalComposite += result.compositeScore;
    count++;
  }

  const avgScore = count > 0 ? Math.round((totalComposite / count) * 100) / 100 : 0;
  console.log(`\n════════════════════════════════════════`);
  console.log(`composite_score=${avgScore}`);
  console.log(`════════════════════════════════════════`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
