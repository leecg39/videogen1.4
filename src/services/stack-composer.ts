// Stack Composer - 의미 청킹 → 스택 트리 매핑 (v3 스키마)
// beat의 intent + evidence_type + tone → StackNode 트리 템플릿 선택
// v3: 19개 템플릿 + 3연속 방지 + 밀도 기반 변주 + 다형성 노드 활용

import type { LayoutReferencePack } from "@/types/index";
import type { StackNode } from "@/types/stack-nodes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposeInput {
  intent: string;
  evidence_type: string;
  tone: string;
  density: number;
  layout_family?: string;
  copy_layers: {
    kicker: string | null;
    headline: string;
    supporting: string | null;
    footer_caption: string | null;
    hook?: string | null;
    claim?: string | null;
    evidence?: string | null;
    counterpoint?: string | null;
    annotation?: string | null;
    cta?: string | null;
  };
  emphasis_tokens: string[];
  svg_icons: string[];
  chart_data?: Record<string, unknown> | null;
  layout_reference?: LayoutReferencePack;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}-${++_idCounter}`;
}

export function resetIdCounter(): void { _idCounter = 0; }

type N = StackNode;

function node(type: string, extra: Omit<N, "id" | "type"> & { id?: string }): N {
  return { id: extra.id ?? uid(type.toLowerCase()), type, ...extra } as N;
}

function getSupportingLines(input: ComposeInput): string[] {
  return (input.copy_layers.supporting ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanListItem(text: string): string {
  return text.replace(/^[①②③④⑤\d.)\s•\-]+/, "").trim();
}

function getKeywordPairs(input: ComposeInput): Array<{ keyword: string; detail: string }> {
  const lines = getSupportingLines(input);
  const pairs = lines
    .map((line) => {
      const arrow = line.split(/→|:|-/).map((part) => part.trim()).filter(Boolean);
      if (arrow.length >= 2) {
        return { keyword: cleanListItem(arrow[0]), detail: arrow.slice(1).join(" ") };
      }
      return null;
    })
    .filter((pair): pair is { keyword: string; detail: string } => Boolean(pair));

  if (pairs.length > 0) return pairs.slice(0, 4);

  return input.emphasis_tokens.slice(0, 4).map((token, index) => ({
    keyword: token,
    detail: cleanListItem(lines[index] ?? ""),
  })).filter((pair) => pair.keyword || pair.detail);
}

function hasNumericSignal(input: ComposeInput): boolean {
  return /\d/.test(`${input.copy_layers.headline} ${input.copy_layers.supporting ?? ""}`);
}

function resolveIconPool(input: ComposeInput): string[] {
  const text = `${input.copy_layers.kicker ?? ""} ${input.copy_layers.headline} ${input.copy_layers.supporting ?? ""}`.toLowerCase();
  const extras: string[] = [];

  const rules: Array<[RegExp, string[]]> = [
    [/(냉장고|fridge|refrigerator)/, ["refrigerator", "search"]],
    [/(셰프|요리|레시피|chef|cook)/, ["chef-hat", "sparkles"]],
    [/(검색|retrieve|retrieval|search)/, ["search", "target"]],
    [/(문서|텍스트|자료|document|text)/, ["file-text", "book-open"]],
    [/(벡터|임베딩|좌표|vector|embedding)/, ["layers", "brain"]],
    [/(그래프|관계|graph)/, ["globe", "layers"]],
    [/(보안|안전|security)/, ["shield", "lock"]],
    [/(속도|빠르|성능|speed|fast)/, ["zap", "rocket"]],
  ];

  for (const [pattern, icons] of rules) {
    if (pattern.test(text)) extras.push(...icons);
  }

  return [...new Set([...input.svg_icons.filter(Boolean), ...extras, "sparkles", "lightbulb"])]
    .filter(Boolean)
    .slice(0, 6);
}

function getKeywordTokens(input: ComposeInput, max = 5): string[] {
  const raw = [
    ...input.emphasis_tokens,
    ...(input.copy_layers.kicker ? [input.copy_layers.kicker] : []),
    ...input.copy_layers.headline.split(/\s+|\n+/),
    ...getSupportingLines(input).flatMap((line) => line.split(/\s+/)),
  ];

  const cleaned = raw
    .map((token) => token.replace(/["'“”‘’.,!?()[\]{}:;/%]/g, "").trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !/^\d+$/.test(token));

  return [...new Set(cleaned)].slice(0, max);
}

function getLineKeywords(text: string, fallback: string[], max = 2): string[] {
  const tokens = text
    .replace(/["'“”‘’.,!?()[\]{}:;/%]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !/^\d+$/.test(token));

  return [...new Set([...tokens, ...fallback])].slice(0, max);
}

function miniBarChartNode(input: ComposeInput, enterAt: number): N | null {
  const source = getSupportingLines(input).slice(0, 4);
  if (source.length < 3 && !hasNumericSignal(input)) return null;

  const items = source.slice(0, 4).map((line, index) => {
    const cleaned = cleanListItem(line);
    const match = cleaned.match(/(\d+)/);
    return {
      label: cleaned.replace(/\d+%?/, "").trim() || cleaned.slice(0, 6),
      value: match ? parseInt(match[1], 10) : Math.max(35, 88 - index * 14),
    };
  });

  return node("MiniBarChart", {
    data: { items },
    style: { marginTop: 6 },
    motion: { preset: "fadeUp", enterAt, duration: 18 },
  });
}

function progressBarNode(input: ComposeInput, enterAt: number): N {
  const value = hasNumericSignal(input)
    ? Math.min(95, Math.max(45, Number(String(input.copy_layers.supporting ?? input.copy_layers.headline).match(/(\d+)/)?.[1] ?? 72)))
    : Math.min(92, 58 + getSupportingLines(input).length * 8);

  return node("ProgressBar", {
    data: { value, label: input.emphasis_tokens[0] ?? input.copy_layers.kicker ?? "핵심 포인트" },
    motion: { preset: "fadeUp", enterAt, duration: 18 },
  });
}

// ---------------------------------------------------------------------------
// 공통 헬퍼: 보조 요소 생성
// ---------------------------------------------------------------------------

/** supporting 텍스트를 개별 animated InsightTile 배열로 변환 */
function supportingToTiles(input: ComposeInput, baseEnterAt: number, gap: number): N[] {
  const lines = getSupportingLines(input);
  return lines.slice(0, 5).map((line, i) =>
    node("InsightTile", {
      data: { index: `${i + 1}.`, title: cleanListItem(line) },
      motion: { preset: "fadeUp", enterAt: baseEnterAt + i * gap, duration: 12 },
    })
  );
}

/** emphasis 키워드를 Badge 노드 배열로 변환 */
function keywordBadges(input: ComposeInput, baseEnterAt: number, gap: number): N[] {
  return input.emphasis_tokens.slice(0, 3).map((token, i) =>
    node("Badge", {
      variant: "accent",
      data: { text: token },
      motion: { preset: "popBadge", enterAt: baseEnterAt + i * gap, duration: 10 },
    })
  );
}

/** 마무리 footer 요소 — ProgressBar (Badge 남발 방지) */
function footerElement(input: ComposeInput, enterAt: number): N {
  return progressBarNode(input, enterAt);
}

// ---------------------------------------------------------------------------
// SvgGraphic accent helper — 장식 SVG 요소 생성
// ---------------------------------------------------------------------------

type SvgVariant = "circle" | "bracket" | "arrow" | "dots" | "line" | "ring" | "wave";

function accentSvg(variant: SvgVariant, enterAt: number): N {
  const variants: Record<SvgVariant, any[]> = {
    circle: [
      { tag: "circle", attrs: { cx: 300, cy: 100, r: 60, fill: "none", strokeWidth: 3.5, strokeLinecap: "round" }, themeColor: "accent", staggerIndex: 0 },
    ],
    bracket: [
      { tag: "path", attrs: { d: "M80 30 Q30 100 80 170", fill: "none", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }, themeColor: "accent", staggerIndex: 0 },
      { tag: "path", attrs: { d: "M520 30 Q570 100 520 170", fill: "none", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }, themeColor: "accent", staggerIndex: 1 },
    ],
    arrow: [
      { tag: "line", attrs: { x1: 100, y1: 100, x2: 480, y2: 100, strokeWidth: 3.5, strokeLinecap: "round" }, themeColor: "accent", staggerIndex: 0 },
      { tag: "path", attrs: { d: "M460 80 L480 100 L460 120", fill: "none", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }, themeColor: "accent", staggerIndex: 1 },
    ],
    dots: [
      { tag: "circle", attrs: { cx: 150, cy: 100, r: 8, fill: "none", strokeWidth: 3 }, themeColor: "accent", staggerIndex: 0 },
      { tag: "circle", attrs: { cx: 300, cy: 100, r: 8, fill: "none", strokeWidth: 3 }, themeColor: "accent", staggerIndex: 1 },
      { tag: "circle", attrs: { cx: 450, cy: 100, r: 8, fill: "none", strokeWidth: 3 }, themeColor: "accent", staggerIndex: 2 },
    ],
    line: [
      { tag: "line", attrs: { x1: 100, y1: 100, x2: 500, y2: 100, strokeWidth: 4, strokeLinecap: "round" }, themeColor: "accent", staggerIndex: 0 },
    ],
    ring: [
      { tag: "circle", attrs: { cx: 300, cy: 100, r: 80, fill: "none", strokeWidth: 3, strokeLinecap: "round" }, themeColor: "accent", staggerIndex: 0 },
      { tag: "circle", attrs: { cx: 300, cy: 100, r: 50, fill: "none", strokeWidth: 2, strokeLinecap: "round" }, themeColor: "accent", staggerIndex: 1 },
    ],
    wave: [
      { tag: "path", attrs: { d: "M50 100 Q150 40 250 100 Q350 160 450 100 Q550 40 600 100", fill: "none", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }, themeColor: "accent", staggerIndex: 0 },
    ],
  };
  return node("SvgGraphic", {
    data: {
      viewBox: "0 0 600 200",
      width: 600, height: 140,
      elements: variants[variant] ?? variants.line,
      drawMode: true, fillAfterDraw: false, drawDuration: 18, staggerDelay: 4,
    },
    motion: { preset: "fadeIn", enterAt, duration: 12 },
  });
}

const SVG_VARIANTS: SvgVariant[] = ["circle", "bracket", "arrow", "dots", "line", "ring", "wave"];
let _svgVariantIdx = 0;
function nextSvgVariant(): SvgVariant {
  const v = SVG_VARIANTS[_svgVariantIdx % SVG_VARIANTS.length];
  _svgVariantIdx++;
  return v;
}

// ---------------------------------------------------------------------------
// Template Builders (29개 — 기존 21 + 신규 8)
// ---------------------------------------------------------------------------

type TemplateBuilder = (input: ComposeInput) => N;

// ═══════════════════════════════════════════════════════════════════════════
// 기존 14개 템플릿
// ═══════════════════════════════════════════════════════════════════════════

// 1. Hero center — 큰 아이콘 + 타이틀 (인트로/아웃트로) → 7개 노드
const heroCenter: TemplateBuilder = (input) =>
  (() => {
    const iconPool = resolveIconPool(input);
    const lines = getSupportingLines(input);
    // supporting을 라인별 개별 BodyText로 분해
    const bodyNodes: N[] = lines.length >= 2
      ? lines.slice(0, 3).map((line, i) =>
          node("BodyText", { data: { text: cleanListItem(line) }, style: { maxWidth: 800 }, motion: { preset: "fadeUp", enterAt: 40 + i * 15, duration: 12 } }))
      : input.copy_layers.supporting
        ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 800 }, motion: { preset: "fadeIn", enterAt: 40, duration: 12 } })]
        : [];
    return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 24 }, children: [
      node("Icon", { data: { name: iconPool[0] ?? "sparkles", size: 88 }, motion: { preset: "popBadge", enterAt: 0, duration: 12 } }),
      ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 12 } })] : []),
      node("Headline", { data: { text: input.copy_layers.headline, size: "lg", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
      node("Divider", { motion: { preset: "drawConnector", enterAt: 12, duration: 10 } }),
      ...bodyNodes,
    ]}),
  ]});
  })();

// 2. Definition frame — 용어 정의 (FrameBox 강조)
const definitionFrame: TemplateBuilder = (input) =>
  (() => {
    const lines = getSupportingLines(input);
    const keywordPairs = getKeywordPairs(input);
    const detailNode = keywordPairs.length >= 2
      ? node("Stack", {
        layout: { direction: "column", align: "stretch", gap: 18, width: "100%" },
        style: { width: "100%", maxWidth: 760 },
        children: keywordPairs.map((pair, index) =>
          node("Stack", {
            layout: { direction: "row", align: "center", justify: "space-between", gap: 20, width: "100%" },
            style: {
              width: "100%",
              padding: "0 0 14px 0",
              borderBottom: index < keywordPairs.length - 1 ? "1px solid rgba(168,85,247,0.18)" : "none",
            },
            motion: { preset: "fadeUp", enterAt: 28 + index * 18, duration: 12 },
            children: [
              node("Headline", {
                data: { text: pair.keyword, size: "sm", emphasis: [pair.keyword] },
                style: { textAlign: "left", width: "48%" },
              }),
              node("BodyText", {
                data: { text: pair.detail },
                style: { textAlign: "left", width: "52%", fontSize: 30, color: "rgba(255,255,255,0.78)" },
              }),
            ],
          })
        ),
      })
      : lines.length >= 2
        ? node("BulletList", {
          data: { items: lines.map(cleanListItem), bulletStyle: "check" },
          motion: { preset: "fadeUp", enterAt: 34, duration: 12 },
        })
        : node("BodyText", {
          data: { text: input.copy_layers.supporting ?? "", emphasis: input.emphasis_tokens },
          style: { fontSize: 28, maxWidth: 720 },
          motion: { preset: "fadeUp", enterAt: 34, duration: 12 },
        });

    return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 28 }, children: [
      ...(input.copy_layers.kicker ? [node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } })] : []),
      node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
      node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
      detailNode,
    ]});
  })();

// 3. Split compare — 좌우 비교 → 7개 노드 (CompareCard → 개별 IconCard 분해)
const splitCompare: TemplateBuilder = (input) => {
  const lines = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  return node("SceneRoot", { layout: { padding: "60px 140px 160px", gap: 28 }, children: [
    node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker ?? "비교" }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
    node("Split", { layout: { ratio: [1, 1], gap: 36, maxWidth: 920 }, children: [
      node("IconCard", { variant: "glass", data: { icon: iconPool[0] ?? "alert-triangle", title: lines[0] ?? "A", body: lines[2] ?? "" }, style: { padding: 28 }, motion: { preset: "slideSplit", enterAt: 18, duration: 15 } }),
      node("IconCard", { variant: "glass", data: { icon: iconPool[1] ?? "check-circle", title: lines[1] ?? "B", body: lines[3] ?? "" }, style: { padding: 28 }, motion: { preset: "slideRight", enterAt: 35, duration: 15 } }),
    ]}),
  ]});
};

// 4. Icon grid — 아이콘 카드 격자 (특징/이유 나열) → 6+ 노드
const iconGrid: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  const cols = Math.min(Math.max(items.length, 2), 3);
  const cards: N[] = items.slice(0, 4).map((item, i) =>
    node("IconCard", { data: { icon: iconPool[i] ?? "sparkles", title: cleanListItem(item) }, style: { padding: 28 }, motion: { preset: "fadeUp", enterAt: 30 + i * 16, duration: 12 } })
  );
  return node("SceneRoot", { layout: { padding: "60px 140px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Grid", { layout: { columns: cols, gap: 28 }, children: cards }),
  ]});
};

// 5. Process flow — 단계 흐름 (ProcessStepCard + ArrowConnector)
const processFlow: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  const stepChildren: N[] = [];
  items.slice(0, 4).forEach((item, i) => {
    if (i > 0) stepChildren.push(node("ArrowConnector", { data: { direction: "right" }, motion: { preset: "drawConnector", enterAt: 28 + i * 25, duration: 10 } }));
    stepChildren.push(node("ProcessStepCard", {
      data: { step: String(i + 1).padStart(2, "0"), icon: iconPool[i] ?? "sparkles", title: cleanListItem(item), highlighted: i === items.length - 1 },
      style: { maxWidth: 260 },
      motion: { preset: "fadeUp", enterAt: 28 + i * 25 + 8, duration: 12 },
    }));
  });
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Stack", { layout: { direction: "row", align: "stretch", justify: "center", gap: 16 }, children: stepChildren }),
  ]});
};

// 6. Quote emphasis — 인용 강조 (큰 인용문) → 6-7개 노드
const quoteEmphasis: TemplateBuilder = (input) =>
  node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 24 }, children: [
      node("Icon", { data: { name: "quote", size: 64 }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
      ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
      node("Headline", { data: { text: input.copy_layers.headline, size: "lg", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
      node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
      node("QuoteText", { data: { text: input.copy_layers.supporting ?? input.copy_layers.headline }, motion: { preset: "fadeUp", enterAt: 20, duration: 15 } }),
      ...(input.copy_layers.footer_caption ? [node("BodyText", { data: { text: input.copy_layers.footer_caption }, style: { maxWidth: 700 }, motion: { preset: "fadeIn", enterAt: 38, duration: 12 } })] : []),
    ]}),
  ]});

// 7. Warning alert — 경고/주의 → 6개 노드 (WarningCard → Icon + 개별 텍스트 분해)
const warningAlert: TemplateBuilder = (input) =>
  node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Icon", { data: { name: input.svg_icons[0] ?? "alert-triangle", size: 72 }, motion: { preset: "popBadge", enterAt: 0, duration: 12 } }),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
    ...(input.copy_layers.supporting ? [node("Headline", { data: { text: input.copy_layers.supporting, size: "sm" }, motion: { preset: "fadeUp", enterAt: 20, duration: 12 } })] : []),
    ...(input.copy_layers.footer_caption ? [node("BodyText", { data: { text: input.copy_layers.footer_caption }, motion: { preset: "fadeIn", enterAt: 36, duration: 12 } })] : []),
  ]});

// 8. Stat highlight — 숫자/통계 강조 → 6개 노드
const statHighlight: TemplateBuilder = (input) =>
  node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 24 }, children: [
      ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
      node("StatNumber", {
        data: { value: input.emphasis_tokens[0] ?? "—", label: input.copy_layers.headline },
        motion: { preset: "popNumber", enterAt: 12, duration: 20 },
      }),
      node("Divider", { motion: { preset: "drawConnector", enterAt: 28, duration: 10 } }),
      ...(input.copy_layers.supporting ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 760 }, motion: { preset: "fadeIn", enterAt: 38, duration: 12 } })] : []),
    ]}),
  ]});

// 9. Insight tile — 핵심 인사이트 (InsightTile 나열) + footer
const insightList: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const tiles: N[] = items.slice(0, 5).map((item, i) =>
    node("InsightTile", { data: { index: `${i + 1}.`, title: cleanListItem(item) }, motion: { preset: "fadeUp", enterAt: 20 + i * 16, duration: 12 } })
  );
  return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Stack", { layout: { direction: "column", align: "center", gap: 10 }, children: tiles }),
  ]});
};

// 10. Split icon cards — 좌우 아이콘카드 비교 (Split) + footer
const splitIconCards: TemplateBuilder = (input) => {
  const lines = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  return node("SceneRoot", { layout: { padding: "60px 140px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Split", { layout: { ratio: [1, 1], gap: 36, maxWidth: 920 }, children: [
      node("IconCard", { variant: "glass", data: { icon: iconPool[0] ?? "sparkles", title: lines[0] ?? "A", body: lines[2] ?? "" }, style: { padding: 28 }, motion: { preset: "slideSplit", enterAt: 18, duration: 15 } }),
      node("IconCard", { variant: "glass", data: { icon: iconPool[1] ?? "check-circle", title: lines[1] ?? "B", body: lines[3] ?? "" }, style: { padding: 28 }, motion: { preset: "slideRight", enterAt: 35, duration: 15 } }),
    ]}),
  ]});
};

// 11. Glow emphasis — 글로우 강조 (오버레이) → 7개 노드
const glowEmphasis: TemplateBuilder = (input) =>
  (() => {
    const iconPool = resolveIconPool(input);
    const lines = getSupportingLines(input);
    return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 20 }, children: [
    node("Overlay", { children: [
      node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 24 }, children: [
        ...(iconPool[0] ? [node("Icon", { data: { name: iconPool[0], size: 88, glow: true }, motion: { preset: "popBadge", enterAt: 0, duration: 12 } })] : []),
        node("Headline", { data: { text: input.copy_layers.headline, size: "lg", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
        node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
        ...(input.emphasis_tokens[0] ? [node("Badge", { variant: "accent", data: { text: input.emphasis_tokens[0] }, motion: { preset: "popBadge", enterAt: 20, duration: 10 } })] : []),
        ...(lines.length >= 2
          ? lines.slice(0, 2).map((line, i) =>
              node("BodyText", { data: { text: cleanListItem(line) }, style: { maxWidth: 760 }, motion: { preset: "fadeUp", enterAt: 30 + i * 14, duration: 12 } }))
          : input.copy_layers.supporting
            ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 760 }, motion: { preset: "fadeIn", enterAt: 30, duration: 12 } })]
            : []),
      ]}),
    ]}),
  ]});
  })();

// 12. Analogy visual — 비유 시각화 (아이콘 + 설명) + footer
const analogyVisual: TemplateBuilder = (input) =>
  (() => {
    const iconPool = resolveIconPool(input);
    return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 20 }, children: [
      node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker ?? "비유" }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
      node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
      node("Stack", { layout: { direction: "row", align: "center", gap: 32 }, children: [
        node("Icon", { data: { name: iconPool[0] ?? "lightbulb", size: 80, glow: true }, motion: { preset: "popBadge", enterAt: 14, duration: 12 } }),
        node("ArrowConnector", { data: { direction: "right" }, motion: { preset: "drawConnector", enterAt: 26, duration: 10 } }),
        node("Icon", { data: { name: iconPool[1] ?? "brain", size: 80, glow: true }, motion: { preset: "popBadge", enterAt: 34, duration: 12 } }),
      ]}),
      ...(input.copy_layers.supporting ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 760 }, motion: { preset: "fadeIn", enterAt: 46, duration: 12 } })] : []),
    ]}),
  ]});
  })();

// 13. Summary grid — 요약 (IconCard 그리드)
const summaryGrid: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  const cards: N[] = items.slice(0, 5).map((item, i) =>
    node("IconCard", { data: { icon: iconPool[i % iconPool.length] ?? "check-circle", title: cleanListItem(item), size: "sm" }, motion: { preset: "fadeUp", enterAt: 20 + i * 16, duration: 12 } })
  );
  const cols = Math.min(cards.length, 3);
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker ?? "정리" }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Grid", { layout: { columns: cols, gap: 24 }, children: cards }),
  ]});
};

// 14. Vertical list — 세로 목록 (InsightTile) + footer
const verticalList: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const listItems: N[] = items.slice(0, 6).map((item, i) =>
    node("InsightTile", { data: { index: `${i + 1}`, title: cleanListItem(item) }, motion: { preset: "fadeUp", enterAt: 20 + i * 14, duration: 12 } })
  );
  return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Stack", { layout: { direction: "column", align: "center", gap: 10 }, children: listItems }),
  ]});
};

const keywordFlow: TemplateBuilder = (input) => {
  const pairs = getKeywordPairs(input);
  const iconPool = resolveIconPool(input);
  const rows = (pairs.length ? pairs : [{ keyword: input.emphasis_tokens[0] ?? input.copy_layers.headline, detail: input.copy_layers.supporting ?? "" }])
    .slice(0, 4)
    .map((pair, index) =>
      node("Stack", {
        layout: { direction: "row", align: "center", gap: 20, width: "100%" },
        style: {
          width: "100%",
          maxWidth: 920,
          padding: "0 0 16px 0",
          borderBottom: index < pairs.length - 1 ? "1px solid rgba(168,85,247,0.18)" : "none",
        },
        motion: { preset: "fadeUp", enterAt: 24 + index * 18, duration: 12 },
        children: [
          node("Icon", { data: { name: iconPool[index] ?? iconPool[0] ?? "sparkles", size: 44 }, style: { flexShrink: 0 } }),
          node("Stack", {
            layout: { direction: "column", align: "start", gap: 6, width: "100%" },
            style: { flex: 1 },
            children: [
              node("Headline", {
                data: { text: pair.keyword, size: "sm", emphasis: [pair.keyword] },
                style: { textAlign: "left", width: "100%" },
              }),
              ...(pair.detail ? [node("BodyText", {
                data: { text: pair.detail },
                style: { textAlign: "left", width: "100%", fontSize: 26, color: "rgba(255,255,255,0.76)" },
              })] : []),
            ],
          }),
        ],
      })
    );

  return node("SceneRoot", { layout: { padding: "70px 140px 160px", gap: 24 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "lg", emphasis: input.emphasis_tokens }, style: { maxWidth: 980 }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Stack", { layout: { direction: "column", align: "stretch", gap: 18, width: "100%" }, style: { width: "100%", maxWidth: 920 }, children: rows }),
  ]});
};

// ═══════════════════════════════════════════════════════════════════════════
// 신규 5개 다형성 템플릿 (RingChart, CompareBars, BulletList, QuoteText, AccentRing)
// ═══════════════════════════════════════════════════════════════════════════

// 15. Introduce Hero — Overlay + AccentRing + 대형 Icon (극적 인트로) + footer
const introduceHero: TemplateBuilder = (input) =>
  (() => {
    const iconPool = resolveIconPool(input);
    return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 20 }, children: [
    node("Overlay", { children: [
      node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 28 }, children: [
        node("Stack", { layout: { direction: "column", align: "center", justify: "center", gap: 0 }, style: { position: "relative" }, children: [
          node("AccentRing", { data: { size: 200, thickness: 3 }, motion: { preset: "scaleIn", enterAt: 0, duration: 20 } }),
          node("Icon", { data: { name: iconPool[0] ?? "sparkles", size: 100, glow: true }, style: { position: "absolute" }, motion: { preset: "popBadge", enterAt: 0, duration: 15 } }),
        ]}),
        ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 12 } })] : []),
        node("Headline", { data: { text: input.copy_layers.headline, size: "lg", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
        node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
        ...(input.copy_layers.supporting ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 760 }, motion: { preset: "fadeIn", enterAt: 20, duration: 12 } })] : []),
      ]}),
    ]}),
  ]});
  })();

// 16. Explain Chart — Split + RingChart 좌측 + IconCard 우측
const explainChart: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  const percent = (input.chart_data?.percent as number) ?? 85;
  const cards: N[] = items.slice(0, 3).map((item, i) =>
    node("IconCard", {
        variant: "glass",
        data: {
          icon: iconPool[i + 1] ?? iconPool[0] ?? "sparkles",
          title: cleanListItem(item),
          size: "sm",
        },
        style: { padding: 20, maxWidth: 340 },
      motion: { preset: "fadeUp", enterAt: 35 + i * 18, duration: 12 },
    })
  );
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Split", { layout: { ratio: [1, 1], gap: 24, maxWidth: 860 }, children: [
      node("Stack", { layout: { direction: "column", align: "center", gap: 12 }, style: { width: "100%", maxWidth: 320 }, children: [
        node("RingChart", {
          data: { value: percent, size: 240, unit: "%", label: input.emphasis_tokens[0] ?? iconPool[0] ?? "" },
          motion: { preset: "scaleIn", enterAt: 12, duration: 25 },
        }),
      ]}),
      node("Stack", { layout: { direction: "column", align: "stretch", gap: 12 }, style: { width: "100%", maxWidth: 340 }, children: cards }),
    ]}),
  ]});
};

// 17. Statistic Bars — FrameBox + CompareBars (수치 비교) + footer
const statisticBars: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const barItems = items.slice(0, 5).map((item, i) => {
    const cleaned = item.replace(/^[①②③④⑤\d.)\s]+/, "");
    const match = cleaned.match(/(\d+)/);
    return { label: cleaned.replace(/\d+%?/, "").trim() || cleaned, value: match ? parseInt(match[1]) : (80 - i * 15), subtitle: "" };
  });
  const miniBars = miniBarChartNode(input, 44);
  return node("SceneRoot", { layout: { padding: "60px 140px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("CompareBars", {
      data: { items: barItems, unit: input.chart_data?.unit as string ?? "" },
      motion: { preset: "fadeUp", enterAt: 18, duration: 30 },
    }),
    ...(miniBars ? [miniBars] : []),
  ]});
};

// 18. List Bullets — Divider + 개별 InsightTile (구조화된 목록) → 8개 노드
const listBullets: TemplateBuilder = (input) => {
  const tiles = supportingToTiles(input, 20, 14);
  return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 24 }, children: [
    ...(input.copy_layers.kicker ? [node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 10 } }),
    node("Stack", { layout: { direction: "column", align: "center", gap: 10 }, children: tiles }),
  ]});
};

// 19. Emphasize QuoteBox — 보라 FrameBox + QuoteText (인용구 강조) → 6개 노드
const emphasizeQuoteBox: TemplateBuilder = (input) =>
  node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 28 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Divider", { motion: { preset: "drawConnector", enterAt: 10, duration: 8 } }),
    node("Icon", { data: { name: "quote", size: 56, glow: true }, motion: { preset: "popBadge", enterAt: 18, duration: 12 } }),
    node("QuoteText", { data: { text: input.copy_layers.supporting ?? input.copy_layers.headline }, motion: { preset: "fadeUp", enterAt: 26, duration: 15 } }),
    ...(input.copy_layers.footer_caption ? [node("BodyText", { data: { text: input.copy_layers.footer_caption }, style: { maxWidth: 720 }, motion: { preset: "fadeIn", enterAt: 42, duration: 12 } })] : []),
  ]});

// 20. Numbered Timeline — 번호 원 + 세로 연결선 + 제목/설명 (타임라인 스텝)
const numberedTimeline: TemplateBuilder = (input) => {
  const items = input.copy_layers.supporting?.split("\n").filter(Boolean) ?? [];
  const iconPool = resolveIconPool(input);
  const stepRows: N[] = [];
  items.slice(0, 4).forEach((item, i) => {
    const parts = item.replace(/^[-•*]\s*/, "").split(/[:\-—]/).map(s => s.trim());
    const title = parts[0] ?? cleanListItem(item);
    const desc = parts.slice(1).join(" — ") || "";
    if (i > 0) {
      stepRows.push(
        node("Stack", { layout: { direction: "row", align: "center", gap: 0 }, children: [
          node("Stack", { layout: { direction: "column", align: "center", gap: 0 }, style: { width: 60, flexShrink: 0 }, children: [
            node("LineConnector", { layout: { direction: "column" }, motion: { preset: "fadeIn", enterAt: 20 + i * 22, duration: 8 } }),
          ]}),
          node("Spacer", { layout: { size: 16, axis: "horizontal" } }),
        ]}),
      );
    }
    stepRows.push(
      node("Stack", { layout: { direction: "row", align: "center", gap: 24 }, children: [
        node("Badge", { variant: "outline", data: { text: String(i + 1).padStart(2, "0") }, style: { fontSize: 28, padding: "12px 0", width: 60, flexShrink: 0, textAlign: "center", borderRadius: 100 }, motion: { preset: "popBadge", enterAt: 20 + i * 22, duration: 10 } }),
        node("Stack", { layout: { direction: "column", align: "start", gap: 6 }, children: [
          node("Headline", { data: { text: title, size: "sm" }, style: { textAlign: "left" }, motion: { preset: "fadeUp", enterAt: 22 + i * 22, duration: 12 } }),
          ...(desc ? [node("BodyText", { data: { text: desc }, style: { textAlign: "left", maxWidth: 700, opacity: 0.7 }, motion: { preset: "fadeIn", enterAt: 28 + i * 22, duration: 10 } })] : []),
        ]}),
      ]}),
    );
  });
  return node("SceneRoot", { layout: { padding: "60px 160px 160px", gap: 20 }, children: [
    ...(input.copy_layers.kicker ? [node("Kicker", { data: { text: input.copy_layers.kicker }, motion: { preset: "fadeUp", enterAt: 0, duration: 10 } })] : []),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Stack", { layout: { direction: "column", align: "start", justify: "center", gap: 8 }, style: { width: "100%", maxWidth: 800 }, children: stepRows }),
  ]});
};

// ═══════════════════════════════════════════════════════════════════════════
// 신규 8개 — 복합 노드 + SvgGraphic 기반 (실루엣 다양성 확보)
// ═══════════════════════════════════════════════════════════════════════════

// 22. versusMain — VersusCard가 지배 (fingerprint: Headline+VersusCard)
const versusMain: TemplateBuilder = (input) => {
  const lines = getSupportingLines(input);
  const iconPool = resolveIconPool(input);
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 28 }, children: [
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("VersusCard", {
      data: {
        leftLabel: lines[0] ? cleanListItem(lines[0]) : input.emphasis_tokens[0] ?? "A",
        rightLabel: lines[1] ? cleanListItem(lines[1]) : input.emphasis_tokens[1] ?? "B",
        leftIcon: iconPool[0] ?? "alert-triangle",
        rightIcon: iconPool[1] ?? "check-circle",
        leftValue: lines[2] ? cleanListItem(lines[2]) : "",
        rightValue: lines[3] ? cleanListItem(lines[3]) : "",
      },
      motion: { preset: "fadeUp", enterAt: 20, duration: 25 },
    }),
  ]});
};

// 23. compareBarsHero — CompareBars 히어로 (fingerprint: Headline+CompareBars)
const compareBarsHero: TemplateBuilder = (input) => {
  const items = getSupportingLines(input).slice(0, 5).map((line, i) => {
    const cleaned = cleanListItem(line);
    const match = cleaned.match(/(\d+)/);
    return { label: cleaned.replace(/\d+%?/, "").trim() || cleaned, value: match ? parseInt(match[1]) : (90 - i * 15), subtitle: "" };
  });
  if (items.length < 2) {
    items.push({ label: input.emphasis_tokens[0] ?? "항목 A", value: 78, subtitle: "" });
    items.push({ label: input.emphasis_tokens[1] ?? "항목 B", value: 45, subtitle: "" });
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 28 }, children: [
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("CompareBars", {
      data: { items, unit: "" },
      motion: { preset: "fadeUp", enterAt: 18, duration: 30 },
    }),
  ]});
};

// 24. flowDiagramMain — FlowDiagram 수평 (fingerprint: Badge+Headline+FlowDiagram)
const flowDiagramMain: TemplateBuilder = (input) => {
  const items = getSupportingLines(input);
  const iconPool = resolveIconPool(input);
  const steps = items.slice(0, 5).map((item, i) => ({
    title: cleanListItem(item),
    icon: iconPool[i] ?? "sparkles",
  }));
  while (steps.length < 3) {
    steps.push({ title: input.emphasis_tokens[steps.length] ?? `단계 ${steps.length + 1}`, icon: iconPool[steps.length] ?? "check-circle" });
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker ?? "프로세스" }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("FlowDiagram", {
      data: { steps },
      motion: { preset: "fadeUp", enterAt: 20, duration: 30 },
    }),
  ]});
};

// 25. cycleDiagramMain — CycleDiagram 원형 (fingerprint: Badge+Headline+CycleDiagram)
const cycleDiagramMain: TemplateBuilder = (input) => {
  const items = getSupportingLines(input);
  const steps = items.slice(0, 5).map(item => ({ label: cleanListItem(item) }));
  while (steps.length < 3) {
    steps.push({ label: input.emphasis_tokens[steps.length] ?? `단계 ${steps.length + 1}` });
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    node("Badge", { variant: "accent", data: { text: input.copy_layers.kicker ?? "순환" }, motion: { preset: "popBadge", enterAt: 0, duration: 10 } }),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("CycleDiagram", {
      data: { steps },
      motion: { preset: "scaleIn", enterAt: 12, duration: 30 },
    }),
  ]});
};

// 26. timelineMain — AnimatedTimeline 수직 (fingerprint: Headline+AnimatedTimeline)
const timelineMain: TemplateBuilder = (input) => {
  const items = getSupportingLines(input);
  const iconPool = resolveIconPool(input);
  const steps = items.slice(0, 5).map((item, i) => ({
    title: cleanListItem(item),
    icon: iconPool[i] ?? "sparkles",
  }));
  while (steps.length < 3) {
    steps.push({ title: input.emphasis_tokens[steps.length] ?? `단계 ${steps.length + 1}`, icon: iconPool[steps.length] ?? "check-circle" });
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 20 }, children: [
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("AnimatedTimeline", {
      data: { steps },
      motion: { preset: "fadeUp", enterAt: 15, duration: 30 },
    }),
  ]});
};

// 27. svgAccentSplit — SvgGraphic + Split (fingerprint: SvgGraphic+Headline+Split)
const svgAccentSplit: TemplateBuilder = (input) => {
  const lines = getSupportingLines(input);
  const iconPool = resolveIconPool(input);
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    accentSvg(nextSvgVariant(), 0),
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("Split", { layout: { ratio: [3, 2], gap: 32, maxWidth: 980 }, children: [
      node("Stack", { layout: { direction: "column", gap: 14 }, children: [
        ...(input.copy_layers.supporting ? [node("BodyText", { data: { text: input.copy_layers.supporting }, style: { maxWidth: 500 }, motion: { preset: "fadeUp", enterAt: 20, duration: 12 } })] : []),
      ]}),
      node("Stack", { layout: { direction: "column", align: "center", gap: 12 }, children: [
        node("Icon", { data: { name: iconPool[0] ?? "sparkles", size: 72, glow: true }, motion: { preset: "popBadge", enterAt: 30, duration: 12 } }),
        ...(lines[0] ? [node("Badge", { variant: "accent", data: { text: cleanListItem(lines[0]) }, motion: { preset: "popBadge", enterAt: 40, duration: 10 } })] : []),
      ]}),
    ]}),
  ]});
};

// 28. svgGridDashboard — SvgGraphic + Grid (fingerprint: SvgGraphic+Grid)
const svgGridDashboard: TemplateBuilder = (input) => {
  const lines = getSupportingLines(input);
  const iconPool = resolveIconPool(input);
  const cards: N[] = lines.slice(0, 4).map((item, i) =>
    node("IconCard", { data: { icon: iconPool[i] ?? "sparkles", title: cleanListItem(item), size: "sm" }, style: { padding: 20 }, motion: { preset: "fadeUp", enterAt: 24 + i * 14, duration: 12 } })
  );
  while (cards.length < 2) {
    cards.push(node("IconCard", { data: { icon: iconPool[cards.length] ?? "sparkles", title: input.emphasis_tokens[cards.length] ?? "항목" }, style: { padding: 20 }, motion: { preset: "fadeUp", enterAt: 24 + cards.length * 14, duration: 12 } }));
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 20 }, children: [
    accentSvg(nextSvgVariant(), 0),
    node("Grid", { layout: { columns: Math.min(cards.length, 3), gap: 24, maxWidth: 1000 }, children: cards }),
  ]});
};

// 29. scaleComparisonMain — ScaleComparison 비례 원 (fingerprint: Headline+ScaleComparison)
const scaleComparisonMain: TemplateBuilder = (input) => {
  const items = getSupportingLines(input).slice(0, 4).map((line, i) => {
    const cleaned = cleanListItem(line);
    const match = cleaned.match(/(\d+)/);
    return { label: cleaned.replace(/\d+%?/, "").trim() || cleaned, value: match ? parseInt(match[1]) : (80 - i * 15) };
  });
  while (items.length < 2) {
    items.push({ label: input.emphasis_tokens[items.length] ?? "항목", value: 60 - items.length * 20 });
  }
  return node("SceneRoot", { layout: { padding: "60px 120px 160px", gap: 24 }, children: [
    node("Headline", { data: { text: input.copy_layers.headline, size: "md", emphasis: input.emphasis_tokens }, motion: { preset: "fadeUp", enterAt: 0, duration: 15 } }),
    node("ScaleComparison", {
      data: { items },
      motion: { preset: "scaleIn", enterAt: 15, duration: 30 },
    }),
  ]});
};

// ---------------------------------------------------------------------------
// Template selection (29 템플릿)
// ---------------------------------------------------------------------------

type TemplateKey =
  | "heroCenter" | "definitionFrame" | "splitCompare" | "iconGrid"
  | "processFlow" | "quoteEmphasis" | "warningAlert" | "statHighlight"
  | "insightList" | "splitIconCards" | "glowEmphasis" | "analogyVisual"
  | "summaryGrid" | "verticalList" | "keywordFlow"
  // v3 신규
  | "introduceHero" | "explainChart" | "statisticBars" | "listBullets"
  | "emphasizeQuoteBox" | "numberedTimeline"
  // v4 복합 노드 + SvgGraphic
  | "versusMain" | "compareBarsHero" | "flowDiagramMain" | "cycleDiagramMain"
  | "timelineMain" | "svgAccentSplit" | "svgGridDashboard" | "scaleComparisonMain";

const TEMPLATE_MAP: Record<TemplateKey, TemplateBuilder> = {
  heroCenter, definitionFrame, splitCompare, iconGrid,
  processFlow, quoteEmphasis, warningAlert, statHighlight,
  insightList, splitIconCards, glowEmphasis, analogyVisual,
  summaryGrid, verticalList, keywordFlow,
  // v3 신규
  introduceHero, explainChart, statisticBars, listBullets,
  emphasizeQuoteBox, numberedTimeline,
  // v4 복합 노드 + SvgGraphic
  versusMain, compareBarsHero, flowDiagramMain, cycleDiagramMain,
  timelineMain, svgAccentSplit, svgGridDashboard, scaleComparisonMain,
};

const EMPTY_COPY_LAYERS: ComposeInput["copy_layers"] = {
  kicker: null, headline: "", supporting: null, footer_caption: null,
  hook: null, claim: null, evidence: null, counterpoint: null, annotation: null, cta: null,
};

const FAMILY_TEMPLATE_PRIORITIES: Record<string, TemplateKey[]> = {
  "hero-callout": ["introduceHero", "heroCenter", "svgAccentSplit"],
  "comparison-columns": ["versusMain", "compareBarsHero", "splitCompare"],
  "icon-grid": ["svgGridDashboard", "iconGrid", "summaryGrid"],
  "process-ribbon": ["flowDiagramMain", "processFlow", "timelineMain"],
  "step-rail": ["timelineMain", "numberedTimeline", "flowDiagramMain"],
  "radial-cluster": ["cycleDiagramMain", "scaleComparisonMain", "heroCenter"],
  "asymmetric-feature": ["svgAccentSplit", "splitIconCards", "compareBarsHero"],
  "stacked-panels": ["timelineMain", "flowDiagramMain", "listBullets"],
  "dashboard-board": ["svgGridDashboard", "scaleComparisonMain", "summaryGrid"],
  "device-spotlight": ["svgAccentSplit", "analogyVisual", "versusMain"],
};

const MOTIF_TEMPLATE_PRIORITIES: Record<string, TemplateKey[]> = {
  "center-hero-title": ["introduceHero", "heroCenter", "svgAccentSplit"],
  "dual-contrast-pillars": ["versusMain", "compareBarsHero", "splitCompare"],
  "orbit-node-cluster": ["cycleDiagramMain", "scaleComparisonMain", "heroCenter"],
  "four-up-icon-grid": ["svgGridDashboard", "iconGrid", "summaryGrid"],
  "vertical-step-rail": ["timelineMain", "numberedTimeline", "flowDiagramMain"],
  "horizontal-process-ribbon": ["flowDiagramMain", "processFlow", "timelineMain"],
  "asymmetric-feature-panel": ["svgAccentSplit", "splitIconCards", "compareBarsHero"],
  "metric-bar-strip": ["compareBarsHero", "statisticBars", "scaleComparisonMain"],
  "stacked-detail-cards": ["verticalList", "insightList", "listBullets"],
  "device-spotlight": ["analogyVisual", "splitIconCards", "definitionFrame"],
  "badge-led-summary": ["summaryGrid", "heroCenter", "insightList"],
  "hub-spoke-discs": ["heroCenter", "iconGrid", "summaryGrid"],
};

function bumpTemplateScores(
  scoreMap: Map<TemplateKey, number>,
  candidates: TemplateKey[] | undefined,
  baseScore: number
): void {
  if (!candidates) return;
  candidates.forEach((candidate, index) => {
    const next = baseScore - index * 4;
    const prev = scoreMap.get(candidate) ?? 0;
    scoreMap.set(candidate, prev + Math.max(1, next));
  });
}

function selectTemplateFromLayoutReference(
  input: ComposeInput,
  fallback: TemplateKey
): TemplateKey {
  const reference = input.layout_reference;
  if (!reference) return fallback;

  const scores = new Map<TemplateKey, number>();
  scores.set(fallback, 12);

  bumpTemplateScores(scores, FAMILY_TEMPLATE_PRIORITIES[reference.primary_family_id], 36);

  reference.references.forEach((ref, index) => {
    bumpTemplateScores(scores, FAMILY_TEMPLATE_PRIORITIES[ref.family_id], 24 - index * 3);
  });

  reference.motif_ids.forEach((motifId, index) => {
    bumpTemplateScores(scores, MOTIF_TEMPLATE_PRIORITIES[motifId], 22 - index * 2);
  });

  ALTERNATES[fallback].forEach((candidate, index) => {
    const prev = scores.get(candidate) ?? 0;
    scores.set(candidate, prev + Math.max(1, 7 - index * 2));
  });

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? fallback;
}

// intent + evidence + tone → 기본 템플릿 매핑
function selectTemplate(intent: string, evidence: string, tone: string, density: number): TemplateKey {
  return selectTemplateFromInput({
    intent,
    evidence_type: evidence,
    tone,
    density,
    copy_layers: EMPTY_COPY_LAYERS,
    emphasis_tokens: [],
    svg_icons: [],
  });
}

function selectTemplateFromInput(input: ComposeInput): TemplateKey {
  const { intent, evidence_type: evidence, tone, density, layout_family } = input;
  const lines = getSupportingLines(input);
  const lineCount = lines.length;
  const iconCount = input.svg_icons.filter(Boolean).length;
  const hasStats = hasNumericSignal(input);
  const combined = `${input.copy_layers.headline} ${input.copy_layers.supporting ?? ""}`.toLowerCase();
  const isAnalogy = /(냉장고|셰프|요리|레시피|비유|처럼|같다|예를 들|예시)/.test(combined);

  if (isAnalogy) {
    return selectTemplateFromLayoutReference(
      input,
      lineCount >= 2 ? "splitCompare" : "analogyVisual"
    );
  }

  if (layout_family === "hero-center") {
    return selectTemplateFromLayoutReference(
      input,
      tone === "dramatic" || iconCount > 0 ? "introduceHero" : "heroCenter"
    );
  }

  if (layout_family === "split-2col") {
    if (hasStats) return selectTemplateFromLayoutReference(input, "compareBarsHero");
    if (lineCount >= 2 && lineCount <= 3) return selectTemplateFromLayoutReference(input, "svgAccentSplit");
    return selectTemplateFromLayoutReference(
      input,
      lineCount >= 4 || iconCount >= 2 ? "svgAccentSplit" : "splitCompare"
    );
  }

  if (layout_family === "grid-4x3") {
    if (hasStats) return selectTemplateFromLayoutReference(input, "scaleComparisonMain");
    return selectTemplateFromLayoutReference(
      input,
      lineCount >= 4 ? "svgGridDashboard" : "iconGrid"
    );
  }

  if (layout_family === "process-horizontal") {
    return selectTemplateFromLayoutReference(input, "flowDiagramMain");
  }

  if (layout_family === "quote-highlight") {
    return selectTemplateFromLayoutReference(
      input,
      lineCount > 0 ? "emphasizeQuoteBox" : "quoteEmphasis"
    );
  }

  if (layout_family === "stacked-vertical") {
    if (intent === "compare") {
      return selectTemplateFromLayoutReference(
        input,
        lineCount >= 3 ? "splitCompare" : "compareBarsHero"
      );
    }
    if (intent === "warn" || intent === "caution") {
      return selectTemplateFromLayoutReference(input, "warningAlert");
    }
    if (hasStats) return selectTemplateFromLayoutReference(input, "compareBarsHero");
    if (evidence === "definition" && (input.emphasis_tokens.length >= 2 || lineCount <= 3)) {
      return selectTemplateFromLayoutReference(input, "keywordFlow");
    }
    if (intent === "explain" && lineCount >= 3) {
      return selectTemplateFromLayoutReference(input, "flowDiagramMain");
    }
    if (intent === "explain" && lineCount >= 2) {
      return selectTemplateFromLayoutReference(input, "svgAccentSplit");
    }
    if (intent === "emphasize" && lineCount >= 2) {
      return selectTemplateFromLayoutReference(input, "compareBarsHero");
    }
    if (intent === "emphasize") return selectTemplateFromLayoutReference(input, "glowEmphasis");
    if (intent === "list") {
      return selectTemplateFromLayoutReference(
        input,
        lineCount >= 4 ? "timelineMain" : "svgGridDashboard"
      );
    }
    if (lineCount >= 4) return selectTemplateFromLayoutReference(input, "timelineMain");
    if (lineCount >= 2) return selectTemplateFromLayoutReference(input, "svgAccentSplit");
  }

  // introduce
  if (intent === "introduce" && tone === "dramatic") {
    return selectTemplateFromLayoutReference(input, "introduceHero");
  }
  if (intent === "introduce") return selectTemplateFromLayoutReference(input, "heroCenter");

  // summarize
  if (intent === "summarize") return selectTemplateFromLayoutReference(input, "summaryGrid");

  // explain
  if (intent === "explain" && evidence === "definition") {
    return selectTemplateFromLayoutReference(
      input,
      input.emphasis_tokens.length >= 2 ? "keywordFlow" : "svgAccentSplit"
    );
  }
  if (intent === "explain" && tone === "dramatic") {
    return selectTemplateFromLayoutReference(input, "glowEmphasis");
  }
  if (intent === "explain" && evidence === "example") {
    return selectTemplateFromLayoutReference(input, "cycleDiagramMain");
  }
  if (intent === "explain" && evidence === "statistic") {
    return selectTemplateFromLayoutReference(input, "compareBarsHero");
  }
  if (intent === "explain") {
    return selectTemplateFromLayoutReference(
      input,
      density >= 4 ? "flowDiagramMain" : "svgAccentSplit"
    );
  }

  // compare
  if (intent === "compare" || intent === "contrast") {
    return selectTemplateFromLayoutReference(input, "splitCompare");
  }

  // statistic
  if (intent === "statistic") return selectTemplateFromLayoutReference(input, "compareBarsHero");

  // list
  if (intent === "list" && evidence === "definition") {
    return selectTemplateFromLayoutReference(input, "timelineMain");
  }
  if (intent === "list" && density >= 4) {
    return selectTemplateFromLayoutReference(input, "svgGridDashboard");
  }
  if (intent === "list" && density >= 3) {
    return selectTemplateFromLayoutReference(input, "flowDiagramMain");
  }
  if (intent === "list") return selectTemplateFromLayoutReference(input, "timelineMain");

  // emphasize
  if (intent === "emphasize" && evidence === "quote") {
    return selectTemplateFromLayoutReference(input, "emphasizeQuoteBox");
  }
  if (intent === "emphasize" && tone === "warning") {
    return selectTemplateFromLayoutReference(input, "warningAlert");
  }
  if (intent === "emphasize" && tone === "dramatic") {
    return selectTemplateFromLayoutReference(input, "introduceHero");
  }
  if (intent === "emphasize") return selectTemplateFromLayoutReference(input, "glowEmphasis");

  // warn
  if (intent === "warn" || intent === "caution") {
    return selectTemplateFromLayoutReference(input, "warningAlert");
  }

  // fallback: 밀도에 따라 변주 (복합 노드 우선)
  if (density >= 4) return selectTemplateFromLayoutReference(input, "svgGridDashboard");
  if (density <= 2 && input.emphasis_tokens.length >= 1) {
    return selectTemplateFromLayoutReference(input, "svgAccentSplit");
  }
  if (density <= 2) return selectTemplateFromLayoutReference(input, "heroCenter");
  return selectTemplateFromLayoutReference(input, "compareBarsHero");
}

export function selectTemplateKeyForComposeInput(input: ComposeInput): string {
  return selectTemplateFromInput(input);
}

// 각 템플릿의 대체 후보 풀 (복합 노드 우선 배치)
const ALTERNATES: Record<TemplateKey, TemplateKey[]> = {
  heroCenter:        ["introduceHero", "svgAccentSplit", "glowEmphasis"],
  definitionFrame:   ["compareBarsHero", "svgAccentSplit", "insightList"],
  splitCompare:      ["versusMain", "compareBarsHero", "svgAccentSplit"],
  iconGrid:          ["svgGridDashboard", "scaleComparisonMain", "summaryGrid"],
  processFlow:       ["flowDiagramMain", "timelineMain", "numberedTimeline"],
  quoteEmphasis:     ["emphasizeQuoteBox", "svgAccentSplit", "heroCenter"],
  warningAlert:      ["versusMain", "svgAccentSplit", "glowEmphasis"],
  statHighlight:     ["compareBarsHero", "scaleComparisonMain", "explainChart"],
  insightList:       ["timelineMain", "svgGridDashboard", "flowDiagramMain"],
  splitIconCards:    ["versusMain", "svgAccentSplit", "compareBarsHero"],
  glowEmphasis:      ["introduceHero", "svgAccentSplit", "cycleDiagramMain"],
  analogyVisual:     ["flowDiagramMain", "cycleDiagramMain", "svgAccentSplit"],
  summaryGrid:       ["svgGridDashboard", "scaleComparisonMain", "timelineMain"],
  verticalList:      ["timelineMain", "flowDiagramMain", "svgGridDashboard"],
  keywordFlow:       ["compareBarsHero", "timelineMain", "svgAccentSplit"],
  // v3 신규
  introduceHero:     ["heroCenter", "svgAccentSplit", "cycleDiagramMain"],
  explainChart:      ["compareBarsHero", "scaleComparisonMain", "svgAccentSplit"],
  statisticBars:     ["compareBarsHero", "scaleComparisonMain", "svgGridDashboard"],
  listBullets:       ["timelineMain", "flowDiagramMain", "svgGridDashboard"],
  emphasizeQuoteBox: ["svgAccentSplit", "glowEmphasis", "introduceHero"],
  numberedTimeline:  ["timelineMain", "flowDiagramMain", "cycleDiagramMain"],
  // v4 복합 노드 + SvgGraphic
  versusMain:        ["splitCompare", "compareBarsHero", "svgAccentSplit"],
  compareBarsHero:   ["versusMain", "scaleComparisonMain", "statisticBars"],
  flowDiagramMain:   ["timelineMain", "processFlow", "cycleDiagramMain"],
  cycleDiagramMain:  ["flowDiagramMain", "timelineMain", "scaleComparisonMain"],
  timelineMain:      ["flowDiagramMain", "numberedTimeline", "cycleDiagramMain"],
  svgAccentSplit:    ["svgGridDashboard", "versusMain", "compareBarsHero"],
  svgGridDashboard:  ["svgAccentSplit", "scaleComparisonMain", "iconGrid"],
  scaleComparisonMain: ["compareBarsHero", "versusMain", "svgGridDashboard"],
};

// ---------------------------------------------------------------------------
// Visual asset 탐지 + Fingerprint 계산
// ---------------------------------------------------------------------------

const VISUAL_TYPES = new Set(["ImageAsset", "SvgGraphic", "VideoClip"]);

function hasVisualAsset(root: StackNode): boolean {
  if (VISUAL_TYPES.has(root.type)) return true;
  if (root.children) {
    for (const child of root.children) {
      if (hasVisualAsset(child as StackNode)) return true;
    }
  }
  return false;
}

function computeFingerprint(root: StackNode): string {
  if (!root.children) return "none";
  return root.children
    .filter((c: any) => c.type !== "Kicker" && c.type !== "FooterCaption")
    .map((c: any) => c.type)
    .join("+");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const recentTemplates: string[] = [];
const fingerprintCounts: Record<string, number> = {};
let textHeavyStreak = 0;

const STRUCTURAL_TYPES = new Set([
  "Split", "Grid", "VersusCard", "FlowDiagram", "AnimatedTimeline",
  "CompareBars", "CycleDiagram", "DataTable", "ScaleComparison",
  "RingChart", "MiniBarChart",
]);

function isTreeTextHeavy(root: StackNode): boolean {
  if (!root.children) return true;
  return !root.children.some((c: any) => STRUCTURAL_TYPES.has(c.type));
}

// text-heavy를 깨는 "구조적" 템플릿 목록
const STRUCTURAL_TEMPLATES: TemplateKey[] = [
  "versusMain", "compareBarsHero", "flowDiagramMain", "cycleDiagramMain",
  "timelineMain", "scaleComparisonMain", "svgAccentSplit", "svgGridDashboard",
  "splitCompare", "iconGrid", "explainChart", "statisticBars",
];

/** 트리 생성 + SvgGraphic 삽입 + fingerprint 계산 (원자적 단위) */
function buildAndFinalize(key: TemplateKey, input: ComposeInput, svgPosition: "prepend" | "after-first" = "prepend"): { tree: StackNode; fp: string } {
  _idCounter = 0;
  let tree = TEMPLATE_MAP[key](input);
  // visual asset 없으면 SvgGraphic accent 자동 삽입
  if (!hasVisualAsset(tree) && tree.children) {
    const svg = accentSvg(nextSvgVariant(), 0);
    if (svgPosition === "after-first" && tree.children.length >= 2) {
      const [first, ...rest] = tree.children;
      tree = { ...tree, children: [first, svg, ...rest] };
    } else {
      tree = { ...tree, children: [svg, ...tree.children] };
    }
  }
  return { tree, fp: computeFingerprint(tree) };
}

export function composeStackTree(input: ComposeInput): StackNode {
  _svgVariantIdx = Math.floor(Math.random() * SVG_VARIANTS.length);
  const templateKey = selectTemplateFromInput(input);
  let finalKey = templateKey;

  // 1단계: 직전 3개 템플릿 이름 연속 방지
  const recent3 = recentTemplates.slice(-3);
  if (recent3.includes(templateKey)) {
    const alts = ALTERNATES[templateKey];
    const best = alts.find(a => !recent3.includes(a));
    if (best) {
      finalKey = best;
    } else {
      const allKeys = Object.keys(TEMPLATE_MAP) as TemplateKey[];
      const fallback = allKeys.find(k => !recent3.includes(k) && k !== templateKey);
      finalKey = fallback ?? alts[0] ?? templateKey;
    }
  }

  // 2단계: text-heavy 2연속이면 구조적 템플릿으로 강제 전환
  if (textHeavyStreak >= 2) {
    const structCandidate = STRUCTURAL_TEMPLATES.find(k => !recent3.includes(k));
    if (structCandidate) finalKey = structCandidate;
  }

  // 3단계: build + SVG injection + fingerprint 계산 (원자적)
  let { tree, fp } = buildAndFinalize(finalKey, input);

  // 4단계: fingerprint 과잉 사용 방지 (동일 fingerprint 3회 초과 금지)
  if ((fingerprintCounts[fp] ?? 0) >= 3) {
    // 4a: 같은 템플릿, SvgGraphic 위치만 변경 시도
    const altPosition = buildAndFinalize(finalKey, input, "after-first");
    if ((fingerprintCounts[altPosition.fp] ?? 0) < 3) {
      tree = altPosition.tree;
      fp = altPosition.fp;
    } else {
      // 4b: 대체 템플릿 시도
      const alts = ALTERNATES[finalKey];
      let found = false;
      for (const alt of alts) {
        for (const pos of ["prepend", "after-first"] as const) {
          const candidate = buildAndFinalize(alt, input, pos);
          if ((fingerprintCounts[candidate.fp] ?? 0) < 3) {
            finalKey = alt;
            tree = candidate.tree;
            fp = candidate.fp;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      // 4c: 전체 풀 검색
      if (!found) {
        const allKeys = Object.keys(TEMPLATE_MAP) as TemplateKey[];
        let bestKey = finalKey;
        let bestCount = Infinity;
        for (const k of allKeys) {
          if (recent3.includes(k)) continue;
          for (const pos of ["prepend", "after-first"] as const) {
            const candidate = buildAndFinalize(k, input, pos);
            const count = fingerprintCounts[candidate.fp] ?? 0;
            if (count < bestCount) {
              bestCount = count;
              bestKey = k;
              tree = candidate.tree;
              fp = candidate.fp;
            }
            if (bestCount === 0) break;
          }
          if (bestCount === 0) break;
        }
        finalKey = bestKey;
      }
    }
  }

  // text-heavy 연속 추적 (G축)
  if (isTreeTextHeavy(tree)) {
    textHeavyStreak++;
  } else {
    textHeavyStreak = 0;
  }

  // 기록
  fingerprintCounts[fp] = (fingerprintCounts[fp] ?? 0) + 1;
  recentTemplates.push(finalKey);
  if (recentTemplates.length > 8) recentTemplates.shift();
  return tree;
}

export function resetRecentTemplates(): void {
  recentTemplates.length = 0;
  Object.keys(fingerprintCounts).forEach(k => delete fingerprintCounts[k]);
  _svgVariantIdx = 0;
  textHeavyStreak = 0;
}

export function composeWithTemplate(templateKey: string, input: ComposeInput): StackNode | null {
  _idCounter = 0;
  const builder = TEMPLATE_MAP[templateKey as TemplateKey];
  if (!builder) return null;
  return builder(input);
}
