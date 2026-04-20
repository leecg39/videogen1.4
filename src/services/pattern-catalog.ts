// pattern-catalog.ts
// Visual DNA 20 패턴 카탈로그 — reference/SC *.png 에서 추출.
// /vg-scene 단계에서 pattern-picker 가 여기서 패턴을 선택하여 visual_plan 을 commit 한다.
// /vg-layout 단계에서는 visual_plan.pattern_ref 를 기준으로 realize 만 수행.
//
// 핸드오프: docs/handoff-2026-04-17-ref-dna-and-visual-plan.md §3
// 메모리: feedback_reference_folder.md (reference/ ABSOLUTE 규칙)

import type {
  VisualAccentColor,
  VisualRelationship,
} from "@/types/index";

export interface PatternSpec {
  /** 고유 패턴 ID — scenes-v2.json 의 visual_plan.pattern_ref 로 저장됨 */
  id: string;
  /** 참조 SC 파일 번호 (reference/SC *.png) */
  sc_refs: number[];
  /** 사람이 읽는 설명 (스킬/디버깅용) */
  label: string;
  relationship: VisualRelationship;
  /** 주 시각 요소의 노드 타입 */
  focal_type: string;
  /** 보조 시각 요소 힌트 (순서 의미 있음) */
  support_types: string[];
  /** 컨테이너 추천 (focal-only 이면 null) */
  container: "Split" | "Grid" | "Stack" | "FrameBox" | null;
  /** 기본 강조 색상 */
  accent_default: VisualAccentColor;
  /**
   * 이 패턴이 어울리는 조건.
   * 하나라도 맞으면 후보가 됨. (pattern-picker 에서 스코어링)
   */
  matches: {
    intents?: string[];
    evidence_types?: string[];
    shot_types?: string[];
    /** 나레이션 정규식 — 숫자/퍼센트/브랜드명 등 */
    text_regex?: RegExp[];
    /** 키워드 (소문자/한글 원문) */
    keywords?: string[];
    /** 최소 씬 길이(ms). 너무 짧은 씬 배제. */
    min_duration_ms?: number;
    /** 최대 씬 길이(ms). 너무 긴 씬 배제. */
    max_duration_ms?: number;
  };
  /** focal-only 비카드 씬이면 true (handoff §A3 규칙 충족) */
  non_card: boolean;
  /** realize 단계에서 참고할 구조 힌트 */
  realize_hint: string;
}

// ---------------------------------------------------------------------------
// 20 Patterns (handoff §3)
// ---------------------------------------------------------------------------

export const PATTERN_CATALOG: PatternSpec[] = [
  {
    id: "P01_mega_number",
    sc_refs: [1, 12],
    label: "메가 숫자 + 짧은 라벨",
    relationship: "metric",
    focal_type: "ImpactStat",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["emphasize", "introduce"],
      evidence_types: ["statistic"],
      text_regex: [/\d+(%|배|조|억|만|천|분|초|시간|일|주|개월|년|명|점)?/],
      min_duration_ms: 4000,
    },
    non_card: true,
    realize_hint: "ImpactStat size='xl' 단독. focal 이 화면 60%+. Kicker 생략 OK.",
  },
  {
    id: "P02_number_hero_double_bar",
    sc_refs: [5],
    label: "거대 숫자 히어로 + 더블 바",
    relationship: "metric",
    focal_type: "ImpactStat",
    support_types: ["CompareBars", "FooterCaption"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["emphasize", "compare"],
      evidence_types: ["statistic"],
      shot_types: ["stat-punch"],
      text_regex: [/\d+\s*(%|배|대비|vs|보다)/],
      min_duration_ms: 5500,
    },
    non_card: false,
    realize_hint: "ImpactStat + 2-item CompareBars. Stack column, 숫자 위/바 아래.",
  },
  {
    id: "P03_weekly_bars",
    sc_refs: [1],
    label: "주간 7-막대 그래프",
    relationship: "metric",
    focal_type: "CompareBars",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["list", "sequence", "emphasize"],
      evidence_types: ["statistic"],
      keywords: ["주간", "매일", "일주일", "요일", "월요일", "화요일", "시간대", "매주"],
      min_duration_ms: 5500,
    },
    non_card: true,
    realize_hint: "CompareBars 7개, 마지막 하나 accent 강조.",
  },
  {
    id: "P04_ring_with_bullets",
    sc_refs: [11],
    label: "링차트 + 불릿 리스트",
    relationship: "metric",
    focal_type: "RingChart",
    support_types: ["BulletList", "FooterCaption"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["focus", "highlight", "emphasize"],
      evidence_types: ["statistic"],
      shot_types: ["donut-stat"],
      text_regex: [/\d+\s*%/],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "RingChart size 280~360 중앙 + 하단 3 bullet.",
  },
  {
    id: "P05_ring_triplet",
    sc_refs: [45],
    label: "링차트 3개 병렬",
    relationship: "enumerate",
    focal_type: "RingChart",
    support_types: ["RingChart", "RingChart"],
    container: "Grid",
    accent_default: "mint",
    matches: {
      intents: ["compare", "list", "enumerate"],
      evidence_types: ["statistic"],
      text_regex: [/\d+\s*%.{0,30}\d+\s*%/],
      min_duration_ms: 7000,
    },
    non_card: false,
    realize_hint: "Grid columns:3 + RingChart 3개 (mint/yellow/red 색 구분).",
  },
  {
    id: "P06_brand_bar_pair",
    sc_refs: [13, 22],
    label: "브랜드 로고 + 비교 바",
    relationship: "contrast",
    focal_type: "DevIcon",
    support_types: ["CompareBars", "FooterCaption"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast", "introduce"],
      evidence_types: ["statistic", "example"],
      shot_types: ["compare-split", "brand-compare"],
      keywords: [
        "OpenAI", "GPT", "Claude", "Anthropic", "Google", "Gemini", "Microsoft",
        "Meta", "Apple", "Tesla", "오픈AI", "구글", "애플", "마이크로소프트",
      ],
      min_duration_ms: 5500,
    },
    non_card: false,
    realize_hint: "Split ratio:[1,2]. DevIcon 왼쪽 + CompareBars 오른쪽.",
  },
  {
    id: "P07_tile_triplet",
    sc_refs: [16],
    label: "타일 3개 (라벨+값)",
    relationship: "enumerate",
    focal_type: "Grid",
    support_types: ["Kicker"],
    container: "Grid",
    accent_default: "white",
    matches: {
      intents: ["list", "enumerate", "introduce"],
      shot_types: ["icon-cluster", "checklist-reveal"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "Grid columns:3, 각 셀: muted 라벨 상단 + bold 값 하단.",
  },
  {
    id: "P08_vertical_timeline",
    sc_refs: [9],
    label: "세로 타임라인 (원+연결선)",
    relationship: "flow",
    focal_type: "AnimatedTimeline",
    support_types: ["Kicker"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["sequence", "timeline", "list"],
      shot_types: ["timeline-cascade", "diagram-build"],
      keywords: ["단계", "순서", "먼저", "다음", "마지막", "첫째", "둘째", "셋째"],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "AnimatedTimeline direction:'vertical'. stepEnterAts 자막 싱크 필수.",
  },
  {
    id: "P09_number_chain_arrow",
    sc_refs: [25],
    label: "번호 체인 화살표",
    relationship: "flow",
    focal_type: "FlowDiagram",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["sequence", "timeline"],
      shot_types: ["timeline-cascade", "diagram-build", "input-output"],
      keywords: ["단계", "프로세스", "흐름", "과정", "거치"],
      min_duration_ms: 6000,
    },
    non_card: true,
    realize_hint: "FlowDiagram variant:'circle-chain'. 하나의 노드만 accent.",
  },
  {
    id: "P10_hub_satellite",
    sc_refs: [27],
    label: "허브 + 위성",
    relationship: "case",
    focal_type: "CycleDiagram",
    support_types: ["Kicker"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["stack", "layer", "list", "focus"],
      keywords: ["중심", "허브", "사이클", "자동화", "순환", "연결"],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "CycleDiagram centerLabel + 4~6 위성 노드.",
  },
  {
    id: "P11_persona_stack",
    sc_refs: [10, 33],
    label: "인물 실루엣 + 라벨",
    relationship: "case",
    focal_type: "ImageAsset",
    support_types: ["Headline", "Badge"],
    container: "Split",
    accent_default: "white",
    matches: {
      intents: ["introduce", "empathy", "example"],
      shot_types: ["empathy-hook", "persona-empathy"],
      keywords: [
        "기획자", "개발자", "디자이너", "사용자", "팀원", "엔지니어",
        "분들", "여러분", "당신", "사람들",
      ],
      min_duration_ms: 5500,
    },
    non_card: false,
    realize_hint: "Split ratio:[1,2]. ImageAsset circle:true + Headline+Badge.",
  },
  {
    id: "P12_doc_split",
    sc_refs: [19],
    label: "문서 SVG + 텍스트 분할",
    relationship: "evidence",
    focal_type: "SvgGraphic",
    support_types: ["Headline", "BodyText", "FooterCaption"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["explain", "define", "example"],
      evidence_types: ["definition", "example"],
      keywords: ["문서", "보고서", "리포트", "논문", "자료", "기록", "정의"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "Split ratio:[1,1.5]. SvgGraphic 문서 실루엣 + BodyText.",
  },
  {
    id: "P13_radial_people",
    sc_refs: [40],
    label: "중앙 아이콘 + 방사형 인물",
    relationship: "case",
    focal_type: "SvgGraphic",
    support_types: ["Headline", "ImageAsset"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["stack", "layer", "list"],
      keywords: ["팀", "조직", "협업", "공유", "분배", "역할"],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "SvgGraphic 중앙 + 4방향 ImageAsset(circle).",
  },
  {
    id: "P14_color_bar_bullet",
    sc_refs: [50],
    label: "색상 바 글머리 리스트",
    relationship: "enumerate",
    focal_type: "BulletList",
    support_types: ["Kicker", "FooterCaption"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["list", "enumerate", "stack"],
      shot_types: ["checklist-reveal"],
      min_duration_ms: 5000,
    },
    non_card: false,
    realize_hint: "BulletList variant:'dot' 또는 SvgGraphic 색상 바 3~4개 + 각 라벨.",
  },
  {
    id: "P15_era_timeline",
    sc_refs: [30],
    label: "시대 타임라인 (연도+이미지)",
    relationship: "flow",
    focal_type: "AnimatedTimeline",
    support_types: ["ImpactStat", "Headline"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["sequence", "timeline", "compare"],
      keywords: ["년", "시대", "과거", "현재", "미래", "세대", "옛날"],
      text_regex: [/\b(19|20)\d{2}\b/],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "AnimatedTimeline horizontal + 각 step 에 거대 연도 숫자.",
  },
  {
    id: "P16_warning_triangle",
    sc_refs: [8],
    label: "경고 삼각형 + 배지",
    relationship: "pause",
    focal_type: "SvgGraphic",
    support_types: ["Headline", "Badge"],
    container: null,
    accent_default: "red",
    matches: {
      intents: ["emphasize", "warn", "contrast"],
      shot_types: ["warning-callout", "quote-pause"],
      keywords: [
        "경고", "주의", "문제", "위험", "실패", "오류", "사고",
        "버그", "장애", "폭락", "하락", "깨졌",
      ],
      min_duration_ms: 4500,
    },
    non_card: true,
    realize_hint: "SvgGraphic: outline triangle stroke 4 + ! dot. Badge 아래.",
  },
  {
    id: "P17_icon_title_sub_badge",
    sc_refs: [55],
    label: "아이콘+제목+부제+배지",
    relationship: "case",
    focal_type: "IconCard",
    support_types: ["Badge"],
    container: "FrameBox",
    accent_default: "mint",
    matches: {
      intents: ["introduce", "example", "define"],
      evidence_types: ["quote", "example"],
      min_duration_ms: 5000,
    },
    non_card: false,
    realize_hint: "IconCard title+body + 우측 Badge. FrameBox variant:'glass'.",
  },
  {
    id: "P18_vertical_dual_bar",
    sc_refs: [60],
    label: "세로 듀얼 바",
    relationship: "contrast",
    focal_type: "CompareBars",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast"],
      evidence_types: ["statistic"],
      shot_types: ["compare-split", "before-after"],
      min_duration_ms: 5500,
    },
    non_card: true,
    realize_hint: "CompareBars 2 items, 색 대비 강하게 (mint vs red).",
  },
  {
    id: "P19_two_col_contrast",
    sc_refs: [3, 7],
    label: "2열 대비 (✓ vs ✗)",
    relationship: "contrast",
    focal_type: "VersusCard",
    support_types: ["Kicker", "CheckMark"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast", "do-dont"],
      shot_types: ["do-dont", "myth-bust", "compare-split"],
      keywords: [
        "반면", "하지만", "그러나", "대조적으로", "대신",
        "vs", "VS", "대", "좋은", "나쁜", "옳은", "틀린",
      ],
      min_duration_ms: 5500,
    },
    non_card: false,
    realize_hint: "Split variant:'line' + VersusCard 또는 CheckMark 대비.",
  },
  {
    id: "P20_mini_flow",
    sc_refs: [6],
    label: "박스→화살표→박스 (미니 플로우)",
    relationship: "flow",
    focal_type: "FlowDiagram",
    support_types: ["Kicker", "FooterCaption"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["sequence", "explain", "define"],
      shot_types: ["input-output", "diagram-build"],
      keywords: ["입력", "출력", "변환", "거쳐", "통해", "→"],
      min_duration_ms: 5000,
    },
    non_card: false,
    realize_hint: "FlowDiagram variant:'box-chain' 2~3 step.",
  },
  // ─── P21~P40: 다양성 확장 (reference 60장 분석 기반) ───
  {
    id: "P21_vertical_dual_bar",
    sc_refs: [60],
    label: "수직 듀얼 바 (빠름 vs 성능)",
    relationship: "contrast",
    focal_type: "VerticalBars",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast"],
      evidence_types: ["statistic"],
      keywords: ["속도", "성능", "vs", "빠른", "느린", "trade"],
      min_duration_ms: 5000,
    },
    non_card: true,
    realize_hint: "세로 2 bar, 서로 다른 높이 + 색상(mint/red). 라벨 상하.",
  },
  {
    id: "P22_browser_mockup",
    sc_refs: [37, 38, 39],
    label: "브라우저 mockup (반복)",
    relationship: "evidence",
    focal_type: "BrowserMockup",
    support_types: ["FooterCaption"],
    container: null,
    accent_default: "white",
    matches: {
      intents: ["example", "explain"],
      keywords: ["웹사이트", "사이트", "페이지", "UI", "디자인", "AI 만든"],
      min_duration_ms: 6000,
    },
    non_card: true,
    realize_hint: "BrowserMockup 1~4개 반복. 'Unlock Your Potential' 같은 placeholder.",
  },
  {
    id: "P23_terminal_code",
    sc_refs: [29],
    label: "터미널 코드 블록",
    relationship: "evidence",
    focal_type: "TerminalBlock",
    support_types: ["FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["explain", "sequence", "list"],
      keywords: ["명령어", "터미널", "CLI", "/command", "cmd"],
      text_regex: [/\/\w+/],
      min_duration_ms: 5000,
    },
    non_card: true,
    realize_hint: "TerminalBlock 안에 `$ /command` 목록. 모노스페이스.",
  },
  {
    id: "P24_emoji_icon_row",
    sc_refs: [28, 41, 48],
    label: "이모지 아이콘 + 라벨 스택",
    relationship: "enumerate",
    focal_type: "EmojiIconList",
    support_types: ["Kicker", "Badge"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["list", "enumerate", "introduce"],
      keywords: ["역할", "종류", "분야", "기능", "작업", "업무"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "이모지(🔍🛡️🚀📄) + 굵은 라벨 + muted 부제 행을 3~6개.",
  },
  {
    id: "P25_brand_satellite",
    sc_refs: [26],
    label: "중앙 인물 + 브랜드 위성",
    relationship: "case",
    focal_type: "BrandSatellite",
    support_types: ["FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["introduce", "example", "emphasize"],
      keywords: ["대표", "CEO", "창업자", "유명", "실리콘밸리", "YC"],
      min_duration_ms: 6000,
    },
    non_card: true,
    realize_hint: "중앙 인물 circle + 주변 브랜드 로고 pill (Reddit, Airbnb, Stripe 등).",
  },
  {
    id: "P26_diagonal_flow",
    sc_refs: [42],
    label: "대각선 흐름 (↘)",
    relationship: "flow",
    focal_type: "DiagonalFlow",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["sequence", "emphasize", "compare"],
      keywords: ["다음", "그 다음", "진화", "넘어", "업그레이드"],
      min_duration_ms: 5500,
    },
    non_card: true,
    realize_hint: "상단 좌 + 하단 우 배치, 화살표로 연결.",
  },
  {
    id: "P27_ralph_loop",
    sc_refs: [23],
    label: "Ralph loop (내부 메시지 순환)",
    relationship: "flow",
    focal_type: "CycleDiagram",
    support_types: ["Kicker"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["explain", "sequence"],
      keywords: ["루프", "반복", "사이클", "매번", "다시"],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "4 단계 원형 순환 + 중앙 FrameBox 에 '핵심' 메시지.",
  },
  {
    id: "P28_priority_color_list",
    sc_refs: [49, 61],
    label: "컬러 숫자 우선순위 리스트",
    relationship: "enumerate",
    focal_type: "BulletList",
    support_types: ["Kicker"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["list", "enumerate", "emphasize"],
      keywords: ["첫째", "둘째", "셋째", "넷째", "금지", "주의", "필수", "지켜"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "숫자 원 색상 구분 (빨/노/녹/녹) + 제목 + 부제 스택.",
  },
  {
    id: "P29_radial_people",
    sc_refs: [40],
    label: "폴더+방사형 인물 (팀 공유)",
    relationship: "case",
    focal_type: "SvgGraphic",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["stack", "layer", "introduce"],
      keywords: ["팀", "공유", "협업", "모두", "같이", "함께"],
      min_duration_ms: 6000,
    },
    non_card: true,
    realize_hint: "중앙 폴더 아이콘 + 4방향 person outline + 점선 연결.",
  },
  {
    id: "P30_era_timeline_photo",
    sc_refs: [30],
    label: "시대 타임라인 + 인물 photo",
    relationship: "flow",
    focal_type: "AnimatedTimeline",
    support_types: ["ImageAsset", "ImpactStat"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["timeline", "compare", "emphasize"],
      keywords: ["년", "시대", "과거", "철학", "역사"],
      text_regex: [/\b(BC|BCE|AD|\d{3,4}년)\b/],
      min_duration_ms: 7000,
    },
    non_card: true,
    realize_hint: "상단 점선 타임라인 + 인물 photo circle + 거대 연도 inline.",
  },
  {
    id: "P31_ai_comparison_triangle",
    sc_refs: [52, 58],
    label: "AI 3사 삼각 비교",
    relationship: "contrast",
    focal_type: "BrandSatellite",
    support_types: ["Headline"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast", "introduce"],
      keywords: ["ChatGPT", "Claude", "Gemini", "비교", "선택"],
      min_duration_ms: 6000,
    },
    non_card: true,
    realize_hint: "3 브랜드 로고 삼각 배치 + 중앙 accent 메시지.",
  },
  {
    id: "P32_big_ratio_contrast",
    sc_refs: [18, 44],
    label: "거대 2-column 수치 대비",
    relationship: "contrast",
    focal_type: "ImpactStat",
    support_types: ["ImpactStat", "Divider"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast", "emphasize"],
      evidence_types: ["statistic"],
      text_regex: [/\d+\s*(일|줄|시간|분|배|명)\s*(vs|대비)?\s*\d+/],
      min_duration_ms: 5000,
    },
    non_card: false,
    realize_hint: "Split 1:1 + 거대 숫자+단위 좌/우, 중앙 세로선 divider.",
  },
  {
    id: "P33_chat_conversation",
    sc_refs: [32],
    label: "ChatBubble 대화 (사용자 vs AI)",
    relationship: "contrast",
    focal_type: "ChatBubble",
    support_types: ["Kicker"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["contrast", "explain", "myth-reality"],
      keywords: ["잠깐", "사실은", "오해", "\"", "말한", "했는데"],
      min_duration_ms: 5000,
    },
    non_card: false,
    realize_hint: "Split — 좌 사용자 (white bubble) + 우 AI (mint bubble) 비대칭.",
  },
  {
    id: "P34_quad_mockup",
    sc_refs: [37],
    label: "4 mockup 반복 가로 (다 비슷비슷)",
    relationship: "evidence",
    focal_type: "BrowserMockup",
    support_types: ["FooterCaption"],
    container: "Grid",
    accent_default: "white",
    matches: {
      intents: ["example", "contrast", "emphasize"],
      keywords: ["비슷비슷", "똑같", "다 같", "AI가 만든"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "Grid columns:4 + 브라우저 mockup 동일 placeholder 반복.",
  },
  {
    id: "P35_stat_with_bullets_side",
    sc_refs: [17, 54, 58],
    label: "링/원 + 오른쪽 아이콘+라벨 리스트",
    relationship: "metric",
    focal_type: "RingChart",
    support_types: ["BulletList", "EmojiIconList"],
    container: "Split",
    accent_default: "mint",
    matches: {
      intents: ["focus", "emphasize", "list"],
      evidence_types: ["statistic"],
      min_duration_ms: 7000,
    },
    non_card: false,
    realize_hint: "Split 1:1.2 — 좌 대형 링(68% 등) + 우 4~5 아이콘 라벨 행.",
  },
  {
    id: "P36_progress_3_stages",
    sc_refs: [47],
    label: "3단계 진행 상태 (원+progress)",
    relationship: "flow",
    focal_type: "FlowDiagram",
    support_types: ["ProgressBar", "Kicker"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["sequence", "emphasize"],
      keywords: ["단계", "레벨", "stage", "수동", "반자동", "자동"],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "상단 3 원 체인 + 하단 progress 강조 시작점 '↑ 여기서 시작'.",
  },
  {
    id: "P37_brand_card_triptych",
    sc_refs: [21, 59],
    label: "3 브랜드 카드 (강조 border)",
    relationship: "contrast",
    focal_type: "Grid",
    support_types: ["DevIcon", "Headline"],
    container: "Grid",
    accent_default: "mint",
    matches: {
      intents: ["compare", "contrast", "introduce"],
      keywords: ["ChatGPT", "Claude", "Gemini", "비교", "모델"],
      min_duration_ms: 6500,
    },
    non_card: false,
    realize_hint: "Grid 3 — 각 카드 border accent 다르게 (green/yellow/neutral).",
  },
  {
    id: "P38_hero_wordmark",
    sc_refs: [24, 33, 46],
    label: "거대 wordmark (단어/키워드)",
    relationship: "pause",
    focal_type: "MarkerHighlight",
    support_types: ["Kicker", "FooterCaption"],
    container: null,
    accent_default: "mint",
    matches: {
      intents: ["emphasize", "define", "introduce"],
      shot_types: ["hero-text", "quote-pause"],
      min_duration_ms: 4500,
    },
    non_card: true,
    realize_hint: "화면 가득 메시지/단어 (200px+). 옆에 작은 아이콘/부제.",
  },
  {
    id: "P39_big_number_context_sub",
    sc_refs: [14, 33, 56],
    label: "거대 숫자 + 좌 아이콘/인물 + 하단 부제",
    relationship: "metric",
    focal_type: "ImpactStat",
    support_types: ["ImageAsset", "FooterCaption"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["emphasize", "compare"],
      evidence_types: ["statistic"],
      text_regex: [/\d{2,}(만|억|조|K|M|%|명|개)/],
      min_duration_ms: 6000,
    },
    non_card: false,
    realize_hint: "Stack row: 좌 인물 icon + 우 거대 숫자. 아래 mint 부제.",
  },
  {
    id: "P40_safety_priority_list",
    sc_refs: [49],
    label: "색상 우선순위 4단계 (빨→노→녹→녹)",
    relationship: "enumerate",
    focal_type: "BulletList",
    support_types: ["Kicker"],
    container: "Stack",
    accent_default: "mint",
    matches: {
      intents: ["list", "enumerate", "emphasize"],
      keywords: ["지켜", "주의", "금지", "필수", "원칙", "규칙"],
      min_duration_ms: 6500,
    },
    non_card: false,
    realize_hint: "4행 — 숫자 원 [빨/노/녹/녹] + 제목 굵게 + 부제 muted.",
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getPatternById(id: string): PatternSpec | undefined {
  return PATTERN_CATALOG.find((p) => p.id === id);
}

export function getPatternIds(): string[] {
  return PATTERN_CATALOG.map((p) => p.id);
}

/**
 * 카탈로그 전체의 focal_type 고유 집합. validate-layout-diversity 에서
 * 노드 다양성 기준 값으로 사용.
 */
export function getCatalogFocalTypes(): string[] {
  return Array.from(new Set(PATTERN_CATALOG.map((p) => p.focal_type)));
}
