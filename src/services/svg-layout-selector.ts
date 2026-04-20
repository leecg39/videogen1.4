import type { ScoringInput } from "@/services/scoring-engine";
import { svgLayoutMotifs, svgTemplateReferences } from "@/data/svg-layout-motifs";

export interface LayoutReferencePack {
  primary_family_id: string;
  references: Array<{
    id: string;
    svg_path: string;
    family_id: string;
    motif_ids: string[];
  }>;
  motif_ids: string[];
  guidance: string[];
}

function preferredSvgFamilies(layoutFamily: string): string[] {
  switch (layoutFamily) {
    case "hero-center":
      return ["hero-callout", "asymmetric-feature", "radial-cluster"];
    case "split-2col":
      return ["comparison-columns", "device-spotlight", "asymmetric-feature"];
    case "grid-4x3":
      return ["icon-grid", "dashboard-board", "stacked-panels"];
    case "process-horizontal":
      return ["process-ribbon", "step-rail", "stacked-panels"];
    case "radial-focus":
      return ["radial-cluster", "hero-callout", "icon-grid"];
    case "comparison-bars":
      return ["comparison-columns", "dashboard-board", "stacked-panels"];
    case "spotlight-case":
      return ["device-spotlight", "asymmetric-feature", "dashboard-board"];
    case "stacked-vertical":
    default:
      return ["stacked-panels", "step-rail", "dashboard-board"];
  }
}

function scoreDensity(templateDensity: string, sceneDensity: number): number {
  if (sceneDensity >= 4) return templateDensity === "dense" ? 18 : templateDensity === "balanced" ? 10 : 2;
  if (sceneDensity <= 2) return templateDensity === "sparse" ? 18 : templateDensity === "balanced" ? 10 : 2;
  return templateDensity === "balanced" ? 18 : 8;
}

function scoreIntent(templateIntentTags: string[], input: ScoringInput): number {
  let score = 0;
  if (templateIntentTags.includes(input.intent)) score += 28;
  if (input.evidenceType === "statistic" && templateIntentTags.includes("evidence")) score += 12;
  if (input.evidenceType === "example" && templateIntentTags.includes("example")) score += 10;
  if ((input.intent === "compare" || input.evidenceType === "statistic") && templateIntentTags.includes("compare")) score += 10;
  if (input.intent === "sequence" && templateIntentTags.includes("sequence")) score += 10;
  return score;
}

export function selectSvgLayoutReferencePack(
  input: ScoringInput,
  layoutFamily: string
): LayoutReferencePack {
  const preferredFamilies = preferredSvgFamilies(layoutFamily);

  const ranked = svgTemplateReferences
    .map((template) => {
      let score = 0;
      if (template.layout_family_bias.includes(layoutFamily)) score += 42;
      if (preferredFamilies.includes(template.family_id)) {
        score += Math.max(8, 24 - preferredFamilies.indexOf(template.family_id) * 6);
      }
      score += scoreIntent(template.intent_tags, input);
      score += scoreDensity(template.density, input.density);
      if (input.hasChartData && template.motif_ids.includes("metric-bar-strip")) score += 10;
      if (input.intent === "compare" && template.motif_ids.includes("dual-contrast-pillars")) score += 8;
      if (input.intent === "sequence" && template.motif_ids.includes("vertical-step-rail")) score += 8;
      return { template, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = ranked.slice(0, 3).map(({ template }) => template);
  const motifIds = Array.from(new Set(selected.flatMap((template) => template.motif_ids))).slice(0, 6);
  const motifNames = motifIds
    .map((id) => svgLayoutMotifs.find((motif) => motif.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return {
    primary_family_id: selected[0]?.family_id ?? preferredFamilies[0] ?? "stacked-panels",
    references: selected.map((template) => ({
      id: template.id,
      svg_path: template.svg_path,
      family_id: template.family_id,
      motif_ids: template.motif_ids,
    })),
    motif_ids: motifIds,
    guidance: [
      "SVG 원본을 통째로 복사하지 말고 family와 motif 단위로 분해해서 사용할 것",
      `${layoutFamily} 구조 안에서 ${motifNames.slice(0, 3).join(", ")} 모티프를 우선 차용할 것`,
      "scene block 내부에서는 같은 primary family를 유지하고, 자막 전개에 따라 support/reveal만 바꿀 것",
    ],
  };
}
