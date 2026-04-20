#!/usr/bin/env node
/**
 * RAG3 프로젝트 stack_root 생성
 * 21개 씬에 대해 intent/metadata 기반으로 다양한 레이아웃 자동 생성
 */
const fs = require("fs");
const scenes = JSON.parse(fs.readFileSync("data/rag3/scenes-v2.json", "utf-8"));

let idCounter = 0;
function id(prefix) { return `${prefix}-${++idCounter}`; }

// 모션 헬퍼
function m(preset, enterAt, duration = 12) {
  return { preset, enterAt, duration };
}

// 공통 SceneRoot 래퍼
function sceneRoot(children, gap = 28) {
  return {
    id: id("root"), type: "SceneRoot",
    layout: { padding: "60px 160px 160px", gap },
    children,
  };
}

// 노드 생성 헬퍼들
const N = {
  kicker: (text, ea) => ({ id: id("k"), type: "Kicker", data: { text }, motion: m("fadeUp", ea) }),
  badge: (text, ea, variant) => ({ id: id("b"), type: "Badge", data: { text, ...(variant ? {variant} : {}) }, motion: m("popBadge", ea) }),
  headline: (text, ea, size = "lg", emphasis = []) => ({ id: id("h"), type: "Headline", data: { text, size, ...(emphasis.length ? {emphasis} : {}) }, motion: m("fadeUp", ea, 15) }),
  divider: (ea) => ({ id: id("d"), type: "Divider", motion: m("fadeIn", ea, 8) }),
  icon: (name, ea, size = 80, glow = false) => ({ id: id("i"), type: "Icon", data: { name, size, glow }, motion: m("scaleIn", ea) }),
  bodyText: (text, ea) => ({ id: id("bt"), type: "BodyText", data: { text }, motion: m("fadeUp", ea) }),
  bulletList: (items, ea, style = "disc") => ({ id: id("bl"), type: "BulletList", data: { items, bulletStyle: style }, motion: m("fadeUp", ea, 18) }),
  insightTile: (title, ea, index = "·") => ({ id: id("it"), type: "InsightTile", data: { index, title }, motion: m("fadeUp", ea) }),
  footerCaption: (text, ea) => ({ id: id("fc"), type: "FooterCaption", data: { text }, motion: m("fadeIn", ea, 10) }),
  iconCard: (icon, title, ea, body = "") => ({ id: id("ic"), type: "IconCard", data: { icon, title, ...(body ? {body} : {}) }, motion: m("fadeUp", ea) }),
  statCard: (value, label, ea) => ({ id: id("sc"), type: "StatCard", data: { value, label }, motion: m("popNumber", ea) }),
  compareCard: (left, right, ea) => ({ id: id("cc"), type: "CompareCard", data: { left: { label: left.label, items: left.items, tone: "negative" }, right: { label: right.label, items: right.items, tone: "positive" } }, motion: m("slideSplit", ea, 18) }),
  warningCard: (icon, title, body, ea) => ({ id: id("wc"), type: "WarningCard", data: { icon, title, body }, motion: m("fadeUp", ea, 15) }),
  processStep: (step, title, ea, desc = "") => ({ id: id("ps"), type: "ProcessStepCard", data: { step, title, description: desc }, motion: m("fadeUp", ea) }),
  quoteText: (text, ea) => ({ id: id("qt"), type: "QuoteText", data: { text }, motion: m("fadeUp", ea, 15) }),
  progressBar: (value, label, ea) => ({ id: id("pb"), type: "ProgressBar", data: { value, label }, motion: m("wipeBar", ea, 20) }),
  richText: (segments, ea) => ({ id: id("rt"), type: "RichText", data: { segments }, motion: m("fadeUp", ea) }),
  compareBars: (items, ea) => ({ id: id("cb"), type: "CompareBars", data: { items }, motion: m("wipeBar", ea, 20) }),
  pill: (text, ea) => ({ id: id("pill"), type: "Pill", data: { text }, motion: m("popBadge", ea) }),
  arrowConnector: (ea) => ({ id: id("ac"), type: "ArrowConnector", motion: m("drawConnector", ea, 10) }),
  lineConnector: (ea) => ({ id: id("lc"), type: "LineConnector", motion: m("drawConnector", ea, 8) }),
  accentRing: (ea, size = 200) => ({ id: id("ar"), type: "AccentRing", data: { size, thickness: 3 }, motion: m("scaleIn", ea, 20) }),
  ringChart: (value, ea, label = "%", size = 160) => ({ id: id("rc"), type: "RingChart", data: { value, size, label }, motion: m("countUp", ea, 25) }),
  spacer: () => ({ id: id("sp"), type: "Spacer" }),
};

// 컨테이너 헬퍼
function stack(dir, children, opts = {}) {
  return { id: id("stk"), type: "Stack", layout: { direction: dir, gap: opts.gap || 20, align: opts.align || "center", justify: opts.justify || "center" }, children, ...(opts.style ? {style: opts.style} : {}) };
}
function grid(cols, children, opts = {}) {
  return { id: id("g"), type: "Grid", layout: { columns: cols, gap: opts.gap || 24 }, children };
}
function split(children, opts = {}) {
  return { id: id("sp"), type: "Split", layout: { ratio: opts.ratio || [1,1], gap: opts.gap || 32 }, children };
}
function overlay(children) {
  return { id: id("ov"), type: "Overlay", children };
}
function frameBox(children, opts = {}) {
  return { id: id("fb"), type: "FrameBox", layout: { padding: opts.padding || 24, gap: opts.gap || 16 }, children };
}

// === 21개 씬 stack_root 생성 ===
const layouts = [];

// Beat 0 (5s, introduce): Hero - AccentRing + Icon + Kicker + Headline
layouts.push(sceneRoot([
  overlay([
    stack("column", [
      stack("column", [N.accentRing(0), N.icon("brain", 3, 80, true)], {style:{position:"relative"}}),
      N.kicker("INTRO", 6),
      N.headline("RAG, 왜 실패하는가?", 10, "lg", ["RAG"]),
      N.divider(14),
    ], {gap: 32}),
  ]),
]));

// Beat 1 (17s, emphasize): Split - Icon + Stack(Headline + InsightTile)
layouts.push(sceneRoot([
  N.badge("문제 인식", 0),
  N.headline("문서 안에 답이 있는데\nAI가 못 찾는다?", 5, "lg", ["못 찾는다"]),
  N.divider(10),
  split([
    stack("column", [N.icon("help-circle", 15, 100, true), N.bodyText("분명히 답이 있는데...", 20)]),
    stack("column", [
      N.insightTile("엉뚱한 답변이 나오는 이유", 25),
      N.insightTile("AI가 문서를 못 찾거나 무시", 30),
    ]),
  ]),
]));

// Beat 2 (8s, define): Stack - Badge + Headline
layouts.push(sceneRoot([
  N.badge("오늘의 주제", 0),
  N.headline("RAG 실패 원인과\n해결법", 4, "lg", ["실패","해결법"]),
  N.divider(8),
  stack("row", [
    N.iconCard("target", "왜 실패?", 12),
    N.arrowConnector(16),
    N.iconCard("check-circle", "어떻게 고치나", 20),
  ]),
]));

// Beat 3 (20s, define): Grid - 청킹 소개
layouts.push(sceneRoot([
  N.kicker("첫 번째 관문", 0),
  N.headline("청킹: 문서를\n작은 조각으로 자르기", 5, "lg", ["청킹"]),
  N.divider(10),
  split([
    stack("column", [N.icon("layers", 15, 100, true), N.bodyText("긴 문서를 의미 단위로\n잘라내는 기술", 20)]),
    stack("column", [
      N.iconCard("file-text", "100만 토큰 모델", 25, "그래도 수천 개는 불가"),
      N.iconCard("zap", "비용 + 정확도", 30, "필요한 부분만 꺼내기"),
    ]),
  ]),
]));

// Beat 4 (16s, emphasize): Overlay - 핵심 포인트
layouts.push(sceneRoot([
  N.kicker("핵심 포인트", 0),
  N.headline("필요한 부분만\n정확히 꺼내 쓰는 것", 5, "lg", ["정확히"]),
  N.divider(10),
  N.quoteText("중간 내용을 놓치고, 비용도 많이 들고...\n그래서 적당한 크기로 잘라야 합니다", 15),
  N.footerCaption("이것이 청킹의 핵심", 22),
]));

// Beat 5 (25s, compare): Split - CompareCard
layouts.push(sceneRoot([
  N.badge("크기 딜레마", 0),
  N.headline("너무 잘게 vs 너무 크게", 5, "lg", ["잘게","크게"]),
  N.divider(10),
  N.compareCard(
    { label: "너무 잘게", items: ["문맥이 깨짐", "\"결론은...\"만 남으면", "AI가 이해 못함"] },
    { label: "너무 크게", items: ["잡음이 섞임", "관계없는 내용 딸려옴", "정확도 하락"] },
    15
  ),
  N.footerCaption("정답이 하나인 기술이 아니라 설계 문제", 25),
]));

// Beat 6 (14s, list): Grid - 문서별 전략
layouts.push(sceneRoot([
  N.kicker("전략이 다르다", 0),
  N.headline("문서별 청킹 전략", 4, "lg", ["전략"]),
  N.divider(8),
  grid(2, [
    N.iconCard("file-text", "기술 문서", 12, "제목/소제목 단위로 자르기"),
    N.iconCard("play", "영상 대본", 18, "장면 전환 단위로 자르기"),
  ]),
]));

// Beat 7 (32s, explain): FrameBox - 오버랩
layouts.push(sceneRoot([
  N.kicker("오버랩 기법", 0),
  N.headline("퍼즐 조각처럼\n앞뒤를 겹쳐라", 5, "lg", ["겹쳐라"]),
  N.divider(10),
  frameBox([
    stack("row", [
      N.icon("layers", 15, 60),
      N.bodyText("조각 앞뒤를 살짝 물려서\n문맥 끊김을 방지", 20),
    ]),
  ]),
  N.warningCard("alert-triangle", "주의", "항상 효과적이지 않음 — 오히려 인덱싱 비용 증가 가능", 30),
  N.footerCaption("문서 특성에 맞춰 테스트가 핵심", 40),
]));

// Beat 8 (27s, warn): WarningCard - 검색 관문
layouts.push(sceneRoot([
  N.badge("두 번째 관문", 0, "accent"),
  N.headline("검색이 엉뚱할 때\n청킹부터 고치지 마라", 5, "lg", ["고치지 마라"]),
  N.divider(10),
  N.warningCard("alert-triangle", "데이터 지옥 경고", "바로 청킹 뜯어고치면 끝없는 삽질", 15),
  N.insightTile("순서대로 원인을 따져봐야 한다", 25),
  N.footerCaption("질문 → 임베딩 → 청킹 → 검색 설정 순서로", 32),
]));

// Beat 9 (23s, list): Grid - 원인 1-2
layouts.push(sceneRoot([
  N.kicker("원인 진단 ①②", 0),
  N.headline("질문이 모호하거나\n임베딩이 안 맞거나", 5, "lg", ["모호","임베딩"]),
  N.divider(10),
  grid(2, [
    N.iconCard("help-circle", "① 질문 문제", 15, "너무 짧거나 모호하면\n임베딩 자체가 흐릿"),
    N.iconCard("globe", "② 임베딩 불일치", 22, "한국어 문서에 영어 중심\n모델 쓰면 의미 못 잡음"),
  ]),
]));

// Beat 10 (25s, list): Stack(row) - 원인 3-4
layouts.push(sceneRoot([
  N.kicker("원인 진단 ③④", 0),
  N.headline("청킹 반쪽이거나\n검색 설정이 부실하거나", 5, "lg", ["청킹","검색"]),
  N.divider(10),
  grid(2, [
    N.iconCard("layers", "③ 청킹/오버랩", 15, "관련 내용이 반쪽만 나온다면"),
    N.iconCard("settings", "④ 검색 설정", 22, "Top-K, 하이브리드, 리랭킹 누락"),
  ]),
  N.footerCaption("상위 5개 청크를 직접 눈으로 읽어보세요", 30),
]));

// Beat 11 (19s, process): ProcessStepCard ×3 - 빠른 진단
layouts.push(sceneRoot([
  N.badge("빠른 진단법", 0),
  N.headline("상위 5개 청크를\n직접 눈으로 읽어라", 4, "lg", ["5개"]),
  N.divider(8),
  stack("row", [
    N.processStep("1", "주제가 다르면", 12, "→ 임베딩/질문"),
    N.arrowConnector(16),
    N.processStep("2", "문맥이 찢기면", 20, "→ 청킹 문제"),
    N.arrowConnector(24),
    N.processStep("3", "순서가 밀리면", 28, "→ 리랭킹/Top-K"),
  ], {gap: 12}),
]));

// Beat 12 (28s, list): Grid(2×2) - RAG 실패 4유형
layouts.push(sceneRoot([
  N.badge("실무 RAG 실패", 0),
  N.headline("4가지로 나뉜다", 5, "lg", ["4가지"]),
  N.divider(10),
  grid(2, [
    N.iconCard("layers", "① 청킹 잘못", 15, "너무 잘게/크게, 경계 틀어짐"),
    N.iconCard("globe", "② 임베딩 불일치", 22, "질문과 문서 의미 못 잡음"),
    N.iconCard("search", "③ 검색 부정확", 29, "Top-K, 필터링 부실"),
    N.iconCard("alert-triangle", "④ 생성 환각", 36, "근거 밖의 말을 지어냄"),
  ], {gap: 20}),
]));

// Beat 13 (40s, compare): Split - CompareCard 비유
layouts.push(sceneRoot([
  N.kicker("검색 vs 생성", 0),
  N.headline("엉뚱한 재료인가\n이상한 조리인가", 5, "lg", ["재료","조리"]),
  N.divider(10),
  N.compareCard(
    { label: "검색 문제", items: ["엉뚱한 재료를 줌", "요리사 탓이 아님", "재료부터 바꿔야"] },
    { label: "생성 문제", items: ["재료는 괜찮은데", "요리사가 이상하게 조리", "프롬프트/모델 조정"] },
    15
  ),
  N.richText([
    {text: "핵심 질문: ", tone: "normal"},
    {text: "지금 문제가 검색 쪽인가, 생성 쪽인가?", tone: "accent"},
  ], 30),
  N.footerCaption("이 한 가지 질문만으로 디버깅 방향이 달라진다", 40),
]));

// Beat 14 (42s, warn): WarningCard + BulletList - 좋은 질문
layouts.push(sceneRoot([
  N.badge("좋은 질문의 힘", 0),
  N.headline("RAG는 마법상자가\n절대 아니다", 5, "lg", ["마법상자"]),
  N.divider(10),
  split([
    stack("column", [
      N.warningCard("alert-triangle", "나쁜 질문", "범위가 넓어 RAG도 헤맴", 15),
      N.bulletList(["AI에 대해 알려줘", "요즘 트렌드는?", "내 메모를 정리해줘"], 22, "cross"),
    ]),
    stack("column", [
      N.insightTile("좋은 질문 예시", 28, "✓"),
      N.bodyText("독서 메모에서 시간관리 연결 글감 5개를 찾아줘", 33),
      N.bodyText("에이전트+생산성이 동시에 나오는 것만 묶어줘", 38),
    ]),
  ]),
]));

// Beat 15 (31s, list): Grid(3) - 질문 3요소
layouts.push(sceneRoot([
  N.kicker("질문 3요소", 0),
  N.headline("주제 + 관점 + 결과 형태", 5, "lg", ["주제","관점","결과"]),
  N.divider(10),
  grid(3, [
    N.statCard("1", "주제", 15),
    N.statCard("2", "관점", 22),
    N.statCard("3", "결과 형태", 29),
  ]),
  N.richText([
    {text: "질문은 단순한 검색어가 아니라 ", tone: "normal"},
    {text: "탐색의 방향", tone: "accent"},
    {text: "이다", tone: "normal"},
  ], 38),
]));

// Beat 16 (26s, process): Stack - 평가 3체크
layouts.push(sceneRoot([
  N.badge("평가 기준", 0),
  N.headline("세 가지만 체크하세요", 5, "lg", ["세 가지"]),
  N.divider(10),
  N.bulletList([
    "이 청크만 읽어도 독립적으로 뜻이 통하는가?",
    "답의 근거가 한 청크 안에 있을 가능성이 높은가?",
    "장면 전환이 청크 경계와 어긋나지 않는가?",
  ], 15, "check"),
  N.footerCaption("이 세 가지로 청킹 품질을 평가할 수 있다", 30),
]));

// Beat 17 (16s, define): Split - 2단계 평가
layouts.push(sceneRoot([
  N.kicker("2단계 평가", 0),
  N.headline("검색 평가와\n생성 평가를 분리하라", 4, "lg", ["검색","생성"]),
  N.divider(8),
  N.compareCard(
    { label: "검색 평가", items: ["맞는 근거를 가져왔는가?"] },
    { label: "생성 평가", items: ["근거를 제대로 써서 답했는가?"] },
    12
  ),
  N.footerCaption("분리해서 보는 습관만 들여도 품질 향상", 20),
]));

// Beat 18 (29s, summarize): BulletList - 핵심 정리
layouts.push(sceneRoot([
  N.kicker("5문장 정리", 0),
  N.headline("오늘 핵심", 5, "lg", ["핵심"]),
  N.divider(10),
  N.bulletList([
    "청킹은 설계 문제 — 문서별 전략이 다르다",
    "검색 엉뚱하면 청킹 전에 원인부터 분류하라",
    "RAG 실패는 4가지 — 청킹/임베딩/검색/생성",
    "좋은 질문에는 주제+관점+결과 형태",
    "평가는 검색과 생성을 분리해서 봐라",
  ], 15, "check"),
  N.footerCaption("RAG 튜닝 = 원인 분류부터 시작", 35),
]));

// Beat 19 (8s, impact): Stack - 한 문장
layouts.push(sceneRoot([
  N.pill("한 문장으로 기억하세요", 0),
  N.headline("RAG 튜닝은\n원인 분류부터 시작한다", 3, "lg", ["원인 분류"]),
  N.divider(6),
  N.insightTile("청킹부터 고치는 일이 아니다", 10),
]));

// Beat 20 (12s, introduce): Outro
layouts.push(sceneRoot([
  overlay([
    stack("column", [
      stack("column", [N.accentRing(0, 160), N.icon("star", 3, 60, true)], {style:{position:"relative"}}),
      N.kicker("바이브랩스", 6),
      N.headline("감사합니다", 9, "lg"),
      N.divider(12),
    ], {gap: 28}),
  ]),
]));

// === 씬에 stack_root 할당 ===
scenes.forEach((s, i) => {
  s.stack_root = layouts[i];
});

fs.writeFileSync("data/rag3/scenes-v2.json", JSON.stringify(scenes, null, 2));
console.log(`✅ ${scenes.length}개 씬 stack_root 생성 완료`);

// 다양성 검증
const rootTypes = scenes.map(s => {
  const first = s.stack_root.children[0];
  return first ? first.type : "empty";
});
console.log("Root container 패턴:", rootTypes.join(" → "));
const uniqueContainers = new Set(rootTypes);
console.log(`컨테이너 종류: ${uniqueContainers.size}가지 (${[...uniqueContainers].join(", ")})`);
