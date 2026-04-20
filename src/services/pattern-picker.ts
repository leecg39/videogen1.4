// pattern-picker.ts
// SceneBlock + ScoringInput → VisualPlan 매핑.
// /vg-scene 에서 호출되어 각 씬에 visual_plan 을 commit 한다.
//
// 핵심: 다양성은 scene 단계에서 확정된다. /vg-layout 은 이 visual_plan 을 realize 만.

import type {
  VisualAccentColor,
  VisualCompositionDirection,
  VisualDensity,
  VisualPlan,
  VisualPlanFocal,
  VisualPlanSupport,
  VisualTypoVariant,
} from "@/types/index";
import type { SceneBlock } from "./scene-blocks";
import type { ScoringInput } from "./scoring-engine";
import { PATTERN_CATALOG, type PatternSpec } from "./pattern-catalog";

export interface PatternPickerContext {
  /** 최근 5개 씬의 pattern_ref (반복 페널티용) */
  recentPatterns: string[];
  /** 직전 씬 pattern_ref (연속 금지용) */
  previousPattern: string | null;
  /** 현재까지 선택된 pattern_ref 분포 (balancing용) */
  patternCounts: Record<string, number>;
  /** 총 씬 수 (분포 비율 계산용) */
  totalScenes: number;
  /** 최근 3개 accent (색상 순환) */
  recentAccents: VisualAccentColor[];
  /** accent 누적 카운트 (fidelity 쿼터 강제용) */
  accentCounts: Record<VisualAccentColor, number>;
  /** composition_direction 누적 카운트 (25% 비중앙 강제용) */
  directionCounts: Record<VisualCompositionDirection, number>;
  /** typo_variant 누적 카운트 */
  typoCounts: Record<VisualTypoVariant, number>;
  /** density 누적 카운트 */
  densityCounts: Record<VisualDensity, number>;
}

export function createPatternPickerContext(
  totalScenes: number
): PatternPickerContext {
  return {
    recentPatterns: [],
    previousPattern: null,
    patternCounts: {},
    totalScenes,
    recentAccents: [],
    accentCounts: { mint: 0, yellow: 0, red: 0, white: 0 },
    directionCounts: {
      center: 0, left: 0, right: 0, diagonal: 0, asymmetric: 0, horizontal: 0,
    },
    typoCounts: {
      standard: 0, medium_hero: 0, giant_wordmark: 0, mono_terminal: 0,
    },
    densityCounts: { sparse: 0, medium: 0, dense: 0 },
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function matchIntent(p: PatternSpec, intent: string): number {
  if (!p.matches.intents) return 0;
  return p.matches.intents.includes(intent) ? 40 : 0;
}

function matchEvidence(p: PatternSpec, evidenceType: string): number {
  if (!p.matches.evidence_types) return 0;
  return p.matches.evidence_types.includes(evidenceType) ? 25 : 0;
}

function matchShot(p: PatternSpec, shotType: string | undefined): number {
  if (!shotType || !p.matches.shot_types) return 0;
  return p.matches.shot_types.includes(shotType) ? 30 : 0;
}

function matchKeywords(
  p: PatternSpec,
  text: string,
  hasStrongIntent: boolean
): number {
  if (!p.matches.keywords) return 0;
  const lower = text.toLowerCase();
  const hit = p.matches.keywords.some((k) => {
    const key = k.toLowerCase();
    return lower.includes(key);
  });
  if (!hit) return 0;
  // 강한 intent(compare/emphasize/sequence 등)가 없을 때 키워드 매칭을 약화.
  // "월요일" 같은 우연 키워드가 P03_weekly_bars 를 잘못 트리거하는 것을 방지.
  return hasStrongIntent ? 20 : 8;
}

function matchRegex(p: PatternSpec, text: string): number {
  if (!p.matches.text_regex) return 0;
  return p.matches.text_regex.some((re) => re.test(text)) ? 25 : 0;
}

function matchDuration(p: PatternSpec, durationMs: number): number {
  if (p.matches.min_duration_ms && durationMs < p.matches.min_duration_ms) {
    return -15;
  }
  if (p.matches.max_duration_ms && durationMs > p.matches.max_duration_ms) {
    return -10;
  }
  return 0;
}

function repetitionPenalty(
  p: PatternSpec,
  ctx: PatternPickerContext
): number {
  let penalty = 0;
  if (ctx.previousPattern === p.id) penalty += 60;
  const recentHits = ctx.recentPatterns.filter((x) => x === p.id).length;
  penalty += recentHits * 25;
  return penalty;
}

function saturationPenalty(
  p: PatternSpec,
  ctx: PatternPickerContext
): number {
  const count = ctx.patternCounts[p.id] || 0;
  // 동일 패턴이 전체의 15% 넘어가면 강한 페널티
  const cap = Math.max(2, Math.ceil(ctx.totalScenes * 0.15));
  if (count >= cap) return 40;
  if (count >= Math.max(1, Math.ceil(cap / 2))) return 15;
  return 0;
}

function nonCardBias(
  p: PatternSpec,
  ctx: PatternPickerContext,
  sceneIndex: number
): number {
  // 현재까지의 non-card 비율 검사, 40% 미만이면 non-card 패턴 보너스.
  if (sceneIndex === 0) return p.non_card ? 10 : 0;
  const nonCardCount = Object.entries(ctx.patternCounts).reduce(
    (sum, [id, n]) => {
      const pat = PATTERN_CATALOG.find((x) => x.id === id);
      return pat?.non_card ? sum + n : sum;
    },
    0
  );
  const totalCounted = Object.values(ctx.patternCounts).reduce((a, b) => a + b, 0);
  if (totalCounted === 0) return 0;
  const nonCardRatio = nonCardCount / totalCounted;
  if (nonCardRatio < 0.4 && p.non_card) return 15;
  if (nonCardRatio > 0.65 && !p.non_card) return 10;
  return 0;
}

const STRONG_INTENTS = new Set([
  "compare",
  "contrast",
  "emphasize",
  "sequence",
  "timeline",
  "list",
  "enumerate",
  "focus",
  "highlight",
  "before-after",
  "myth-reality",
  "do-dont",
  "empathy",
]);

const MEGA_PATTERNS = new Set([
  "P01_mega_number",
  "P02_number_hero_double_bar",
  "P38_hero_wordmark",
  "P39_big_number_context_sub",
]);

function scorePattern(
  p: PatternSpec,
  input: ScoringInput,
  text: string,
  durationMs: number,
  ctx: PatternPickerContext,
  sceneIndex: number
): number {
  const hasStrongIntent = STRONG_INTENTS.has(input.intent);
  const matchScore =
    matchIntent(p, input.intent) +
    matchEvidence(p, input.evidenceType) +
    matchShot(p, input.shotType) +
    matchKeywords(p, text, hasStrongIntent) +
    matchRegex(p, text) +
    matchDuration(p, durationMs);
  const penalty = repetitionPenalty(p, ctx) + saturationPenalty(p, ctx);
  const bias = nonCardBias(p, ctx, sceneIndex);
  // intent 가 약할 때(pending/statement/neutral) 는 P01 (단순 히어로)를 약간 선호
  const introBias =
    !hasStrongIntent && sceneIndex < 2 && p.id === "P01_mega_number" ? 12 : 0;
  // Fidelity: mega-number 패턴은 텍스트에 명확한 숫자/단위가 있어야 선택.
  // narration 에 숫자 없으면 mega 패턴을 대폭 억제 → P01/P02/P38/P39 남발 방지.
  const hasBigNumber = /\d+\s*(%|배|만|억|조|K|M|B|명|일|분|초|점|원|달러)/.test(text);
  const megaPenalty = MEGA_PATTERNS.has(p.id) && !hasBigNumber ? 45 : 0;
  return matchScore - penalty + bias + introBias - megaPenalty;
}

// ---------------------------------------------------------------------------
// Focal / support derivation
// ---------------------------------------------------------------------------

/** 텍스트에서 첫 숫자+단위 조합을 추출. e.g. "10%", "31조", "200명" */
export function extractFirstNumber(text: string): {
  value: string;
  suffix: string | null;
} | null {
  const match = text.match(
    /([+-]?\d+(?:\.\d+)?)\s*(%|배|점|조|억|만|천|개|명|개월|분|초|시간|일|주|년)?/
  );
  if (!match) return null;
  return { value: match[1], suffix: match[2] || null };
}

/** 텍스트에서 핵심 키워드(2~8자 단어) 추출. */
export function extractKeyPhrases(text: string, max = 3): string[] {
  const tokens = text
    .split(/[\s,./!?()[\]{}"'`~:;|+\-→]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 14)
    .filter((t) => !/^[0-9]+$/.test(t))
    .filter((t) => !/^[가-힣]$/.test(t));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function buildFocal(
  p: PatternSpec,
  block: SceneBlock,
  text: string
): VisualPlanFocal {
  const num = extractFirstNumber(text);
  const phrases = extractKeyPhrases(text, 2);
  const firstBeatKicker = phrases[0] || null;

  switch (p.focal_type) {
    case "ImpactStat": {
      return {
        type: "ImpactStat",
        value: num?.value ?? phrases[0] ?? "",
        suffix: num?.suffix ?? null,
        label: phrases.slice(0, 2).join(" / ") || firstBeatKicker,
      };
    }
    case "RingChart": {
      return {
        type: "RingChart",
        value: num?.value ? Number(num.value) : null,
        label: firstBeatKicker,
      };
    }
    case "CompareBars": {
      return {
        type: "CompareBars",
        value: num?.value ?? null,
        label: firstBeatKicker,
        note: "items[] 로 2~7개 막대 구성",
      };
    }
    case "VersusCard": {
      return {
        type: "VersusCard",
        label: firstBeatKicker,
        note: "leftLabel / rightLabel 15자 이내",
      };
    }
    case "FlowDiagram": {
      return {
        type: "FlowDiagram",
        label: firstBeatKicker,
        note: "steps[] 2~5개 + stepEnterAts",
      };
    }
    case "AnimatedTimeline": {
      return {
        type: "AnimatedTimeline",
        label: firstBeatKicker,
        note: `steps[] ${block.beat_count} 단계 + stepEnterAts 자막 싱크`,
      };
    }
    case "CycleDiagram": {
      return {
        type: "CycleDiagram",
        label: firstBeatKicker,
        note: "centerLabel + 4~6 위성",
      };
    }
    case "DevIcon": {
      return {
        type: "DevIcon",
        label: firstBeatKicker,
        note: "브랜드/기술 로고. manifest에 있으면 ImageAsset 으로 교체 가능",
      };
    }
    case "ImageAsset": {
      return {
        type: "ImageAsset",
        label: firstBeatKicker,
        note: "인물/사진. circle:true 권장",
      };
    }
    case "SvgGraphic": {
      return {
        type: "SvgGraphic",
        label: firstBeatKicker,
        note: p.id.includes("warning")
          ? "outline triangle + ! dot"
          : "document/structural shape",
      };
    }
    case "IconCard": {
      return {
        type: "IconCard",
        label: firstBeatKicker,
        note: "title+body 텍스트 필수",
      };
    }
    case "BulletList": {
      return {
        type: "BulletList",
        label: firstBeatKicker,
        note: "items[] 3~5개",
      };
    }
    case "Grid": {
      return {
        type: "Grid",
        label: firstBeatKicker,
        note: "columns:3 + 각 셀 label+value",
      };
    }
    default: {
      return {
        type: p.focal_type,
        label: firstBeatKicker,
      };
    }
  }
}

function buildSupport(
  p: PatternSpec,
  block: SceneBlock,
  text: string
): VisualPlanSupport[] {
  const phrases = extractKeyPhrases(text, 4);
  const supports: VisualPlanSupport[] = [];

  for (const t of p.support_types) {
    switch (t) {
      case "Kicker":
        supports.push({ type: "Kicker", text: phrases[0] || null });
        break;
      case "FooterCaption":
        supports.push({ type: "FooterCaption", text: phrases[phrases.length - 1] || null });
        break;
      case "Headline":
        supports.push({ type: "Headline", text: phrases[0] || null });
        break;
      case "BodyText":
        supports.push({ type: "BodyText", text: block.beats[0]?.text.slice(0, 40) || null });
        break;
      case "Badge":
        supports.push({ type: "Badge", text: phrases[1] || phrases[0] || null });
        break;
      case "BulletList":
        supports.push({ type: "BulletList", items: phrases.slice(0, 3) });
        break;
      case "CompareBars":
        supports.push({
          type: "CompareBars",
          items: phrases.slice(0, 3),
          note: "2~3 항목. value 는 realize 단계에서 결정",
        });
        break;
      case "CheckMark":
        supports.push({ type: "CheckMark", text: phrases[0] || null });
        break;
      case "ImageAsset":
        supports.push({ type: "ImageAsset", text: "manifest 매칭 우선" });
        break;
      case "RingChart":
        supports.push({ type: "RingChart", text: phrases[1] || null });
        break;
      case "ImpactStat":
        supports.push({ type: "ImpactStat", text: phrases[0] || null });
        break;
      default:
        supports.push({ type: t, text: null });
    }
    if (supports.length >= 3) break;
  }

  return supports;
}

// ---------------------------------------------------------------------------
// Accent rotation
// ---------------------------------------------------------------------------

function pickAccent(
  p: PatternSpec,
  text: string,
  ctx: PatternPickerContext
): VisualAccentColor {
  // ── Fidelity: mint 우세 강제 + 비-mint 는 하드 쿼터 관리 ──
  // reference/ 60장은 mint 단일 기본. yellow/red 는 명시적 의미 + 쿼터 내에서만.
  const totalScenes = ctx.totalScenes;
  const yellowCap = Math.max(1, Math.floor(totalScenes * 0.15));
  const redCap = Math.max(1, Math.floor(totalScenes * 0.08));
  const whiteCap = Math.max(1, Math.floor(totalScenes * 0.10));

  // 경고/위험 (Red) — 명확한 부정적 사건 단어만 + 하드 쿼터
  const isRed = /\b(경고|위험|실패|폭락|에러|버그|장애|치명|금지|유출)\b|무서워/.test(text);
  if (isRed && ctx.accentCounts.red < redCap) return "red";

  // 비용/가격 (Yellow) — 매우 명시적 금액·요금 단어만 + 하드 쿼터
  const isYellow = /\$\d|\d+\s*(달러|만원|억|원\/월)|요금제|구독료|청구서/.test(text);
  if (isYellow && ctx.accentCounts.yellow < yellowCap) return "yellow";

  // 기본은 항상 mint. rotation 제거 (fidelity gate 위반 원인).
  // reference/ 60장은 단일 mint accent. 색상 변주는 scene-variation 이 아니라 명시적 의미 시에만.
  return "mint";
}

// ─── P1: composition_direction ─────────────────────────
// 전체 씬의 75% 이상 center, 나머지 25%는 left/right/diagonal/asymmetric/horizontal 강제.
// 패턴 구조에 따라 기본값이 정해지지만 누적 분포에 따라 동적 조정.
const PATTERN_DIRECTION_HINT: Record<string, VisualCompositionDirection> = {
  P22_browser_mockup: "left",
  P26_diagonal_flow: "diagonal",
  P30_era_timeline_photo: "asymmetric",
  P34_quad_mockup: "horizontal",
  P35_stat_with_bullets_side: "horizontal",
  P28_priority_color_list: "left",
  P40_safety_priority_list: "left",
  P18_vertical_dual_bar: "center",
  P11_persona_stack: "asymmetric",
  P19_two_col_contrast: "horizontal",
  P06_brand_bar_pair: "horizontal",
  P32_big_ratio_contrast: "horizontal",
};

function pickDirection(
  p: PatternSpec,
  ctx: PatternPickerContext,
  sceneIndex: number
): VisualCompositionDirection {
  const hint = PATTERN_DIRECTION_HINT[p.id] ?? "center";
  const total = Math.max(1, sceneIndex);
  const centerRatio = ctx.directionCounts.center / total;

  // center 가 75% 초과 + 패턴 힌트가 center 가 아니면 그대로 hint 사용
  if (hint !== "center") return hint;

  // center 이 과잉(80%+) 이고 패턴이 center 힌트라도 다양성 위해 가끔 변주
  if (centerRatio > 0.8 && sceneIndex >= 4) {
    const rotation: VisualCompositionDirection[] = [
      "left", "right", "horizontal", "asymmetric", "diagonal",
    ];
    const least = rotation.reduce((min, d) =>
      ctx.directionCounts[d] < ctx.directionCounts[min] ? d : min
    , rotation[0]);
    return least;
  }
  return "center";
}

// ─── P3: typo_variant ─────────────────────────
// 30% medium_hero, 10% giant_wordmark, 5% mono_terminal, 55% standard.
function pickTypoVariant(
  p: PatternSpec,
  text: string,
  ctx: PatternPickerContext,
  sceneIndex: number
): VisualTypoVariant {
  // 패턴 힌트
  if (p.id === "P38_hero_wordmark") return "giant_wordmark";
  if (p.id === "P23_terminal_code") return "mono_terminal";
  if (/\/\w+|[$>]/.test(text)) return "mono_terminal";

  const total = Math.max(1, sceneIndex);
  const medHeroR = ctx.typoCounts.medium_hero / total;
  const wmR = ctx.typoCounts.giant_wordmark / total;

  // 거대 숫자 + 짧은 헤드라인 패턴이면 medium_hero
  const isBigStat = ["P01_mega_number", "P02_number_hero_double_bar", "P39_big_number_context_sub"].includes(p.id);
  if (isBigStat && medHeroR < 0.3) return "medium_hero";

  // wordmark 부족하고 강한 emphasis 인 경우
  if (wmR < 0.1 && /^[A-Za-z0-9]+$|wordmark|단어|키워드/.test(text)) return "giant_wordmark";

  return "standard";
}

// ─── P4: density ─────────────────────────
// 20% sparse / 60% medium / 20% dense.
function pickDensity(
  p: PatternSpec,
  block: SceneBlock,
  ctx: PatternPickerContext,
  sceneIndex: number
): VisualDensity {
  const total = Math.max(1, sceneIndex);
  const sparseR = ctx.densityCounts.sparse / total;
  const denseR = ctx.densityCounts.dense / total;
  const durationSec = block.duration_ms / 1000;

  // 짧은 씬 + warning/pause 패턴 → sparse
  if (durationSec < 6 && sparseR < 0.2 && ["pause", "case"].includes(p.relationship)) {
    return "sparse";
  }
  if (["P16_warning_triangle", "P38_hero_wordmark", "P08_vertical_timeline"].includes(p.id) && sparseR < 0.2) {
    return "sparse";
  }

  // 긴 씬 + enumerate/contrast → dense
  if (durationSec > 10 && denseR < 0.2 && ["enumerate", "flow", "contrast"].includes(p.relationship)) {
    return "dense";
  }
  if (["P34_quad_mockup", "P28_priority_color_list", "P40_safety_priority_list", "P37_brand_card_triptych"].includes(p.id) && denseR < 0.2) {
    return "dense";
  }

  return "medium";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function pickVisualPlan(
  input: ScoringInput,
  block: SceneBlock,
  ctx: PatternPickerContext
): VisualPlan {
  const text = block.text;
  const durationMs = block.duration_ms;

  const scored = PATTERN_CATALOG.map((p) => ({
    pattern: p,
    score: scorePattern(p, input, text, durationMs, ctx, block.scene_index),
  }));
  scored.sort((a, b) => b.score - a.score);

  const winner = scored[0].pattern;
  const focal = buildFocal(winner, block, text);
  const support = buildSupport(winner, block, text);
  const accent = pickAccent(winner, text, ctx);
  const direction = pickDirection(winner, ctx, block.scene_index);
  const typoVariant = pickTypoVariant(winner, text, ctx, block.scene_index);
  const density = pickDensity(winner, block, ctx, block.scene_index);

  // context 갱신
  ctx.patternCounts[winner.id] = (ctx.patternCounts[winner.id] || 0) + 1;
  ctx.previousPattern = winner.id;
  ctx.recentPatterns = [...ctx.recentPatterns, winner.id].slice(-5);
  ctx.recentAccents = [...ctx.recentAccents, accent].slice(-3);
  ctx.accentCounts[accent] = (ctx.accentCounts[accent] || 0) + 1;
  ctx.directionCounts[direction] += 1;
  ctx.typoCounts[typoVariant] += 1;
  ctx.densityCounts[density] += 1;

  return {
    pattern_ref: winner.id,
    relationship: winner.relationship,
    focal,
    support,
    accent_color: accent,
    recommended_container: winner.container,
    composition_direction: direction,
    typo_variant: typoVariant,
    density,
    rationale: `intent=${input.intent} evidence=${input.evidenceType} shot=${
      input.shotType ?? "-"
    } dir=${direction} typo=${typoVariant} density=${density} → ${winner.label}`,
  };
}

/** 외부에서 사용할 때를 위한 export */
export { PATTERN_CATALOG };
