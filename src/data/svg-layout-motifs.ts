export interface SvgLayoutMotif {
  id: string;
  name: string;
  description: string;
}

export interface SvgTemplateReference {
  id: string;
  svg_path: string;
  family_id: string;
  aspect: "landscape" | "portrait" | "square";
  density: "sparse" | "balanced" | "dense";
  intent_tags: string[];
  layout_family_bias: string[];
  motif_ids: string[];
  notes: string;
}

export const svgLayoutMotifs: SvgLayoutMotif[] = [
  { id: "center-hero-title", name: "Center Hero Title", description: "중앙 헤드라인을 크게 세우고 주변 보조 요소를 배치하는 히어로 문법" },
  { id: "dual-contrast-pillars", name: "Dual Contrast Pillars", description: "좌우 두 기둥을 대비시키는 비교 문법" },
  { id: "orbit-node-cluster", name: "Orbit Node Cluster", description: "중심 개체 주변에 노드를 배치하는 방사형 군집 문법" },
  { id: "four-up-icon-grid", name: "Four-Up Icon Grid", description: "동일 위계의 4개 아이콘 또는 카드 요약 문법" },
  { id: "vertical-step-rail", name: "Vertical Step Rail", description: "세로 축을 따라 단계가 내려가는 타임라인 문법" },
  { id: "horizontal-process-ribbon", name: "Horizontal Process Ribbon", description: "가로 방향으로 프로세스가 흐르는 리본 문법" },
  { id: "asymmetric-feature-panel", name: "Asymmetric Feature Panel", description: "큰 주연 패널과 작은 보조 설명 패널을 엮는 비대칭 문법" },
  { id: "metric-bar-strip", name: "Metric Bar Strip", description: "수치와 비교 막대를 연속 띠처럼 배열하는 문법" },
  { id: "stacked-detail-cards", name: "Stacked Detail Cards", description: "세로로 정리된 설명 카드가 단계적으로 쌓이는 문법" },
  { id: "device-spotlight", name: "Device Spotlight", description: "디바이스 또는 UI 목업을 스포트라이트처럼 세우는 문법" },
  { id: "badge-led-summary", name: "Badge Led Summary", description: "상단 뱃지와 하단 요약 카드가 묶이는 문법" },
  { id: "hub-spoke-discs", name: "Hub Spoke Discs", description: "원형 디스크 또는 노드를 허브-스포크처럼 반복 배치하는 문법" },
];

export const svgTemplateReferences: SvgTemplateReference[] = [
  { id: "template-1", svg_path: "public/assets/svg/템플릿1.svg", family_id: "comparison-columns", aspect: "portrait", density: "balanced", intent_tags: ["compare", "example"], layout_family_bias: ["split-2col", "spotlight-case"], motif_ids: ["dual-contrast-pillars", "device-spotlight", "center-hero-title"], notes: "양측 큰 패널 비교 + 중앙 타이틀" },
  { id: "template-2", svg_path: "public/assets/svg/템플릿2.svg", family_id: "step-rail", aspect: "portrait", density: "dense", intent_tags: ["sequence", "define"], layout_family_bias: ["process-horizontal", "stacked-vertical"], motif_ids: ["vertical-step-rail", "stacked-detail-cards"], notes: "복잡한 세로 축 안내형" },
  { id: "template-3", svg_path: "public/assets/svg/템플릿3.svg", family_id: "process-ribbon", aspect: "landscape", density: "dense", intent_tags: ["sequence", "cluster"], layout_family_bias: ["process-horizontal", "grid-4x3"], motif_ids: ["horizontal-process-ribbon", "four-up-icon-grid"], notes: "가로 프로세스와 다중 카드 혼합" },
  { id: "template-4", svg_path: "public/assets/svg/템플릿4.svg", family_id: "stacked-panels", aspect: "portrait", density: "dense", intent_tags: ["sequence", "summary"], layout_family_bias: ["stacked-vertical", "process-horizontal"], motif_ids: ["stacked-detail-cards", "badge-led-summary"], notes: "상하 분절이 강한 다단 구성" },
  { id: "template-5", svg_path: "public/assets/svg/템플릿5.svg", family_id: "comparison-columns", aspect: "landscape", density: "balanced", intent_tags: ["compare", "contrast"], layout_family_bias: ["split-2col", "comparison-bars"], motif_ids: ["dual-contrast-pillars", "metric-bar-strip"], notes: "가로 비교에 적합한 균형형" },
  { id: "template-6", svg_path: "public/assets/svg/템플릿6.svg", family_id: "asymmetric-feature", aspect: "portrait", density: "sparse", intent_tags: ["emphasize", "define"], layout_family_bias: ["hero-center", "spotlight-case"], motif_ids: ["center-hero-title", "asymmetric-feature-panel"], notes: "큰 설명 패널 하나를 세우는 구조" },
  { id: "template-7", svg_path: "public/assets/svg/템플릿7.svg", family_id: "comparison-columns", aspect: "square", density: "sparse", intent_tags: ["compare", "payoff"], layout_family_bias: ["split-2col", "hero-center"], motif_ids: ["dual-contrast-pillars", "badge-led-summary"], notes: "짧은 비교 카피에 적합" },
  { id: "template-8", svg_path: "public/assets/svg/템플릿8.svg", family_id: "step-rail", aspect: "portrait", density: "balanced", intent_tags: ["sequence", "pause"], layout_family_bias: ["stacked-vertical", "process-horizontal"], motif_ids: ["vertical-step-rail", "badge-led-summary"], notes: "슬림 세로형 단계 안내" },
  { id: "template-9", svg_path: "public/assets/svg/템플릿9.svg", family_id: "icon-grid", aspect: "landscape", density: "balanced", intent_tags: ["cluster", "summary"], layout_family_bias: ["grid-4x3", "radial-focus"], motif_ids: ["four-up-icon-grid", "hub-spoke-discs", "badge-led-summary"], notes: "4개 원형 노드 요약형" },
  { id: "template-10", svg_path: "public/assets/svg/템플릿10.svg", family_id: "asymmetric-feature", aspect: "landscape", density: "dense", intent_tags: ["example", "emphasize"], layout_family_bias: ["spotlight-case", "hero-center"], motif_ids: ["asymmetric-feature-panel", "center-hero-title"], notes: "큰 배경 조형 + 설명 패널" },
  { id: "template-11", svg_path: "public/assets/svg/템플릿11.svg", family_id: "dashboard-board", aspect: "landscape", density: "dense", intent_tags: ["cluster", "evidence"], layout_family_bias: ["grid-4x3", "spotlight-case"], motif_ids: ["four-up-icon-grid", "stacked-detail-cards"], notes: "카드와 텍스트가 촘촘히 섞이는 보드" },
  { id: "template-12", svg_path: "public/assets/svg/템플릿12.svg", family_id: "process-ribbon", aspect: "landscape", density: "balanced", intent_tags: ["sequence", "transformation"], layout_family_bias: ["process-horizontal", "split-2col"], motif_ids: ["horizontal-process-ribbon", "asymmetric-feature-panel"], notes: "상단-하단 전개가 있는 변환형" },
  { id: "template-13", svg_path: "public/assets/svg/템플릿13.svg", family_id: "icon-grid", aspect: "portrait", density: "dense", intent_tags: ["cluster", "list"], layout_family_bias: ["grid-4x3", "stacked-vertical"], motif_ids: ["four-up-icon-grid", "stacked-detail-cards"], notes: "그리드와 세부 설명이 결합된 카드형" },
  { id: "template-14", svg_path: "public/assets/svg/템플릿14.svg", family_id: "hero-callout", aspect: "landscape", density: "sparse", intent_tags: ["emphasize", "payoff"], layout_family_bias: ["hero-center", "spotlight-case"], motif_ids: ["center-hero-title", "badge-led-summary"], notes: "짧은 문장 강조형" },
  { id: "template-15", svg_path: "public/assets/svg/템플릿15.svg", family_id: "dashboard-board", aspect: "landscape", density: "dense", intent_tags: ["cluster", "evidence"], layout_family_bias: ["grid-4x3", "comparison-bars"], motif_ids: ["four-up-icon-grid", "metric-bar-strip", "badge-led-summary"], notes: "넓은 보드형 대시보드" },
  { id: "template-16", svg_path: "public/assets/svg/템플릿16.svg", family_id: "process-ribbon", aspect: "landscape", density: "balanced", intent_tags: ["sequence", "explain"], layout_family_bias: ["process-horizontal", "hero-center"], motif_ids: ["horizontal-process-ribbon", "center-hero-title"], notes: "낮은 높이의 가로 흐름형" },
  { id: "template-17", svg_path: "public/assets/svg/템플릿17.svg", family_id: "dashboard-board", aspect: "landscape", density: "dense", intent_tags: ["cluster", "summary"], layout_family_bias: ["grid-4x3", "spotlight-case"], motif_ids: ["four-up-icon-grid", "asymmetric-feature-panel", "stacked-detail-cards"], notes: "텍스트 비중이 높은 복합 보드형" },
  { id: "template-18", svg_path: "public/assets/svg/템플릿18.svg", family_id: "radial-cluster", aspect: "landscape", density: "balanced", intent_tags: ["hierarchy", "cluster"], layout_family_bias: ["radial-focus", "hero-center"], motif_ids: ["orbit-node-cluster", "hub-spoke-discs"], notes: "중심부와 주변 노드의 위계가 분명한 구조" },
  { id: "template-19", svg_path: "public/assets/svg/템플릿19.svg", family_id: "step-rail", aspect: "portrait", density: "balanced", intent_tags: ["sequence", "evidence"], layout_family_bias: ["stacked-vertical", "process-horizontal"], motif_ids: ["vertical-step-rail", "metric-bar-strip"], notes: "세로 막대/단계 결합형" },
  { id: "template-20", svg_path: "public/assets/svg/템플릿20.svg", family_id: "hero-callout", aspect: "landscape", density: "balanced", intent_tags: ["emphasize", "summary"], layout_family_bias: ["hero-center", "grid-4x3"], motif_ids: ["center-hero-title", "four-up-icon-grid"], notes: "넓은 가로 히어로 + 보조 블록" },
  { id: "template-21", svg_path: "public/assets/svg/템플릿21.svg", family_id: "stacked-panels", aspect: "portrait", density: "balanced", intent_tags: ["sequence", "pause"], layout_family_bias: ["stacked-vertical", "spotlight-case"], motif_ids: ["stacked-detail-cards", "vertical-step-rail"], notes: "긴 세로 프레임에 적합한 단계형" },
  { id: "template-22", svg_path: "public/assets/svg/템플릿22.svg", family_id: "comparison-columns", aspect: "landscape", density: "dense", intent_tags: ["compare", "evidence"], layout_family_bias: ["split-2col", "comparison-bars"], motif_ids: ["dual-contrast-pillars", "metric-bar-strip", "stacked-detail-cards"], notes: "대조와 근거를 같이 넣는 비교형" },
  { id: "template-23", svg_path: "public/assets/svg/템플릿23.svg", family_id: "device-spotlight", aspect: "landscape", density: "balanced", intent_tags: ["example", "evidence"], layout_family_bias: ["spotlight-case", "split-2col"], motif_ids: ["device-spotlight", "asymmetric-feature-panel"], notes: "제품/도구/화면 캡처 소개에 적합" },
  { id: "template-24", svg_path: "public/assets/svg/템플릿24.svg", family_id: "dashboard-board", aspect: "portrait", density: "dense", intent_tags: ["cluster", "list"], layout_family_bias: ["grid-4x3", "stacked-vertical"], motif_ids: ["four-up-icon-grid", "stacked-detail-cards", "badge-led-summary"], notes: "카드가 많이 들어가는 요약 보드형" },
  { id: "template-25", svg_path: "public/assets/svg/템플릿25.svg", family_id: "stacked-panels", aspect: "portrait", density: "dense", intent_tags: ["sequence", "summary"], layout_family_bias: ["stacked-vertical", "process-horizontal"], motif_ids: ["vertical-step-rail", "stacked-detail-cards", "badge-led-summary"], notes: "긴 설명을 단계 카드로 쪼개는 데 적합" },
];
