#!/usr/bin/env node
/**
 * RAG3 v2 -- 49-scene generator
 * Input:  data/rag3/chunks.json  +  input/RAG3.srt
 * Output: data/rag3/scenes-v2.json  +  data/rag3/render-props-v2.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// SRT Parser
// ---------------------------------------------------------------------------
function parseSRT(text) {
  const blocks = text.trim().replace(/^\uFEFF/, "").split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const lines = block.trim().split("\n");
      if (lines.length < 3) return null;
      const m = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
      );
      if (!m) return null;
      const startTime = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
      const endTime = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
      const t = lines.slice(2).join(" ").trim();
      return { startTime, endTime, text: t };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
const srt = parseSRT(
  fs.readFileSync(path.join(ROOT, "input/RAG3.srt"), "utf-8"),
);
const chunks = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/rag3/chunks.json"), "utf-8"),
);
console.log(
  `SRT parsed: ${srt.length} subtitles, ${(srt[srt.length - 1].endTime / 60).toFixed(1)} min`,
);
console.log(`Chunks loaded: ${chunks.length} scenes`);

// ---------------------------------------------------------------------------
// enterAt algorithm
// ---------------------------------------------------------------------------
const HEADER_TYPES = new Set([
  "Kicker",
  "Badge",
  "Headline",
  "Divider",
  "AccentGlow",
]);
const TAIL_TYPES = new Set(["FooterCaption", "InsightTile"]);

function assignEnterAt(root, durationFrames) {
  const nodes = [];
  function dfs(node) {
    if (node.motion) nodes.push(node);
    if (node.children) node.children.forEach(dfs);
  }
  dfs(root);
  if (nodes.length === 0) return;

  const headers = [];
  const contents = [];
  const tails = [];

  let pastHeaders = false;
  for (const n of nodes) {
    if (!pastHeaders && HEADER_TYPES.has(n.type)) {
      headers.push(n);
    } else {
      pastHeaders = true;
      contents.push(n);
    }
  }
  while (
    contents.length > 0 &&
    TAIL_TYPES.has(contents[contents.length - 1].type)
  ) {
    tails.unshift(contents.pop());
  }

  // Sequential appearance: min 30 frames (1s) gap between siblings
  const GAP = 30; // 1 second between each element
  const maxAt = Math.round(durationFrames * 0.7); // last element by 70% of duration

  // Calculate total slots needed
  const totalNodes = headers.length + contents.length + tails.length;
  // Shrink gap if too many nodes for the duration
  const effectiveGap = Math.max(15, Math.min(GAP, Math.floor(maxAt / Math.max(totalNodes, 1))));

  let cursor = 0;
  for (const n of headers) {
    n.motion.enterAt = cursor;
    cursor += effectiveGap;
  }
  // Content starts after headers with extra pause
  if (headers.length > 0) cursor = Math.max(cursor, effectiveGap * headers.length + 15);
  for (const n of contents) {
    n.motion.enterAt = Math.min(cursor, maxAt);
    cursor += effectiveGap;
  }
  // Tail after content
  if (contents.length > 0) cursor = Math.max(cursor, cursor);
  for (const n of tails) {
    n.motion.enterAt = Math.min(cursor, maxAt);
    cursor += effectiveGap;
  }
}

// ---------------------------------------------------------------------------
// Shorthand helpers
// ---------------------------------------------------------------------------
const M = (preset = "fadeUp", dur = 15) => ({
  preset,
  enterAt: 0,
  duration: dur,
});

function sceneRoot(idx, children, padOverride) {
  return {
    id: `sceneroot-${idx}`,
    type: "SceneRoot",
    layout: padOverride || { padding: "60px 120px 140px", gap: 20 },
    children,
  };
}

function kicker(idx, text) {
  return {
    id: `kicker-${idx}`,
    type: "Kicker",
    data: { text },
    motion: M("fadeUp", 12),
  };
}

function badge(idx, text, variant = "accent") {
  return {
    id: `badge-${idx}`,
    type: "Badge",
    data: { text },
    variant,
    motion: M("popBadge", 10),
  };
}

function headline(idx, text, size = "lg", emphasis = [], suffix = "") {
  return {
    id: `hl-${idx}${suffix}`,
    type: "Headline",
    data: { text, size, emphasis },
    style: { maxWidth: size === "xl" ? 1000 : 980 },
    motion: M("fadeUp", size === "xl" ? 18 : 15),
  };
}

function divider(idx) {
  return {
    id: `div-${idx}`,
    type: "Divider",
    motion: M("drawConnector", 8),
  };
}

function bodyText(idx, text, emphasis = [], suffix = "") {
  return {
    id: `bt-${idx}${suffix}`,
    type: "BodyText",
    data: { text, emphasis },
    motion: M("fadeUp", 12),
  };
}

function bulletList(idx, items, bulletStyle = "check", suffix = "") {
  return {
    id: `bl-${idx}${suffix}`,
    type: "BulletList",
    data: { items, bulletStyle },
    motion: M("fadeUp", 15),
  };
}

function icon(idx, name, size = 64, glow = false, suffix = "") {
  return {
    id: `icon-${idx}${suffix}`,
    type: "Icon",
    data: { name, size, glow },
    motion: M("scaleIn", 12),
  };
}

function iconCard(idx, iconName, title, body, size = "md", suffix = "", variant = "default") {
  return {
    id: `ic-${idx}${suffix}`,
    type: "IconCard",
    data: { icon: iconName, title, body, size },
    variant,
    style: { maxWidth: 700 },
    motion: M("fadeUp", 15),
  };
}

function warningCard(idx, iconName, title, body, suffix = "") {
  return {
    id: `wc-${idx}${suffix}`,
    type: "WarningCard",
    data: { icon: iconName, title, body },
    style: { maxWidth: 750 },
    motion: M("fadeUp", 15),
  };
}

function insightTile(idx, title, index = "→", suffix = "") {
  return {
    id: `it-${idx}${suffix}`,
    type: "InsightTile",
    data: { index, title },
    style: { maxWidth: 700 },
    motion: M("fadeUp", 15),
  };
}

function quoteText(idx, text) {
  return {
    id: `qt-${idx}`,
    type: "QuoteText",
    data: { text },
    motion: M("fadeUp", 18),
  };
}

function compareCard(idx, left, right) {
  return {
    id: `cc-${idx}`,
    type: "CompareCard",
    data: { left, right },
    style: { maxWidth: 900 },
    motion: M("slideSplit", 18),
  };
}

function compareBars(idx, items, unit = "%") {
  return {
    id: `cb-${idx}`,
    type: "CompareBars",
    data: { items, unit },
    motion: M("wipeBar", 20),
  };
}

function processStepCard(idx, step, iconName, title, desc, suffix = "") {
  return {
    id: `psc-${idx}${suffix}`,
    type: "ProcessStepCard",
    data: { step, icon: iconName, title, desc },
    style: { maxWidth: 700 },
    motion: M("fadeUp", 15),
  };
}

function statCard(idx, value, label, suffix = "") {
  return {
    id: `sc-${idx}${suffix}`,
    type: "StatCard",
    data: { value, label },
    style: { maxWidth: 320 },
    motion: M("popNumber", 18),
  };
}

function footerCaption(idx, text) {
  return {
    id: `fc-${idx}`,
    type: "FooterCaption",
    data: { text },
    motion: M("fadeUp", 12),
  };
}

function accentGlow(idx) {
  return {
    id: `glow-${idx}`,
    type: "AccentGlow",
    motion: M("pulseAccent", 30),
  };
}

function stack(idx, dir, children, extra = {}, suffix = "") {
  return {
    id: `stack-${idx}${suffix}`,
    type: "Stack",
    layout: {
      direction: dir,
      gap: 20,
      width: "100%",
      ...extra,
    },
    children,
  };
}

function split(idx, children, ratio = [1, 1], gap = 24) {
  return {
    id: `split-${idx}`,
    type: "Split",
    layout: { gap, width: "100%", maxWidth: 900, ratio },
    children,
  };
}

function grid(idx, columns, children, gap = 28) {
  return {
    id: `grid-${idx}`,
    type: "Grid",
    layout: { columns, gap, width: "100%", maxWidth: 1100 },
    children,
  };
}

function frameBox(idx, children, layoutExtra = {}, styleExtra = {}, suffix = "") {
  return {
    id: `frame-${idx}${suffix}`,
    type: "FrameBox",
    layout: {
      gap: 20,
      padding: 28,
      width: "fit-content",
      maxWidth: 750,
      ...layoutExtra,
    },
    style: {
      border: "1.5px solid rgba(255,255,255,0.15)",
      radius: 16,
      ...styleExtra,
    },
    children,
  };
}

function overlay(idx, children) {
  return {
    id: `overlay-${idx}`,
    type: "Overlay",
    layout: {},
    children,
  };
}

function pill(idx, text, suffix = "") {
  return {
    id: `pill-${idx}${suffix}`,
    type: "Pill",
    data: { text },
    motion: M("popBadge", 10),
  };
}

function richText(idx, segments, suffix = "") {
  return {
    id: `rt-${idx}${suffix}`,
    type: "RichText",
    data: { segments },
    motion: M("fadeUp", 15),
  };
}

function ringChart(idx, value, label, size = 200, unit = "%") {
  return {
    id: `ring-${idx}`,
    type: "RingChart",
    data: { value, label, size, unit },
    motion: M("scaleIn", 20),
  };
}

function backplate(idx, background = "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08))") {
  return {
    id: `bp-${idx}`,
    type: "Backplate",
    style: { background, radius: 24 },
  };
}

function arrowConnector(idx, direction = "right", suffix = "") {
  return {
    id: `arrow-${idx}${suffix}`,
    type: "ArrowConnector",
    data: { direction },
    motion: M("drawConnector", 8),
  };
}

function progressBar(idx, value, label) {
  return {
    id: `pb-${idx}`,
    type: "ProgressBar",
    data: { value, label },
    motion: M("wipeBar", 20),
  };
}

// ---------------------------------------------------------------------------
// 49-Scene Layout Builder — 15 Archetypes (A~O)
// ---------------------------------------------------------------------------
function buildLayout(idx) {
  switch (idx) {
    // ===== A. 히어로 오버레이 =====
    // Scene 0: 인트로 [A]
    case 0:
      return sceneRoot(
        idx,
        [
          overlay(idx, [
            backplate(idx),
            stack(idx, "column", [
              icon(idx, "brain", 120, true),
              headline(idx, "안녕하세요 여러분\n바이브랩스의 이석현입니다", "xl", ["바이브랩스"]),
            ], { align: "center", justify: "center", gap: 28 }),
          ]),
        ],
        { padding: "80px 120px 140px", gap: 32 },
      );

    // ===== N. RichText + Pill 조합 =====
    // Scene 1: RAG 소개 [N]
    case 1:
      return sceneRoot(idx, [
        stack(idx, "row", [
          pill(idx, "RAG", "-a"),
          pill(idx, "세번째", "-b"),
        ], { gap: 12, justify: "center" }, "-pills"),
        headline(idx, "RAG, 왜 실패하는가?", "lg", ["RAG", "실패"]),
        richText(idx, [
          { text: "기대" },
          { text: " vs ", tone: "accent" },
          { text: "현실" },
        ]),
      ]);

    // ===== F. FrameBox 카드 + 인사이트 =====
    // Scene 2: 엉뚱한 답변 [F]
    case 2:
      return sceneRoot(idx, [
        kicker(idx, "문제 인식"),
        headline(idx, "문서 안에 답이 있는데\nAI가 못 찾는다?", "lg", ["못 찾는다"]),
        frameBox(idx, [
          stack(idx, "row", [
            icon(idx, "help-circle", 56),
            bodyText(idx, "답변 엉뚱 → 원인 추적", ["엉뚱"]),
          ], { align: "center", gap: 16 }),
        ]),
        insightTile(idx, "파이프라인 문제 신호"),
      ]);

    // Scene 3: 오늘 주제 [N]
    case 3:
      return sceneRoot(idx, [
        stack(idx, "row", [
          pill(idx, "실패원인", "-a"),
          pill(idx, "해결법", "-b"),
        ], { gap: 12, justify: "center" }, "-pills"),
        headline(idx, "RAG 실패 원인과\n해결법 깊이 파헤치기", "lg", ["실패 원인", "해결법"]),
        richText(idx, [
          { text: "실패 원인 → " },
          { text: "해결법", tone: "accent" },
        ]),
        insightTile(idx, "핵심 개념 정리"),
      ]);

    // ===== K. 단일 IconCard 집중 =====
    // Scene 4: 청킹 정의 [K]
    case 4:
      return sceneRoot(idx, [
        badge(idx, "첫 번째 관문"),
        headline(idx, "청킹: 문서를\n작은 조각으로 자르기", "lg", ["청킹"]),
        iconCard(idx, "layers", "청킹이란?", "긴 문서 → 작은 조각", "md", "", "bold"),
      ]);

    // ===== L. Split 비대칭 =====
    // Scene 5: 컨텍스트 한계 [L] -- Split(2:1) + RingChart
    case 5:
      return sceneRoot(idx, [
        kicker(idx, "한계"),
        headline(idx, "컨텍스트 윈도우\n100만 토큰의 한계", "lg", ["100만 토큰"]),
        divider(idx),
        split(idx, [
          bodyText(idx, "수천 문서 = 통째 불가", ["불가"]),
          ringChart(idx, 100, "만 토큰", 180, ""),
        ], [2, 1]),
      ]);

    // ===== G. Warning 강조 =====
    // Scene 6: 중간 내용 누락 [G]
    case 6:
      return sceneRoot(idx, [
        badge(idx, "주의"),
        headline(idx, "문서가 길어질수록\n중간 내용을 놓친다", "lg", ["놓친다"]),
        warningCard(idx, "alert-triangle", "비용 + 누락", "중간 누락 + 비용 폭증"),
        insightTile(idx, "통째 넣기 = 손해"),
      ]);

    // ===== B. 풀블리드 임팩트 =====
    // Scene 7: 청킹 핵심 [B]
    case 7:
      return sceneRoot(
        idx,
        [
          badge(idx, "핵심"),
          headline(idx, "필요한 부분만\n정확히 꺼내 쓰는 것", "xl", ["정확히"]),
          footerCaption(idx, "그것이 청킹의 핵심"),
        ],
        { padding: "80px 120px 140px", gap: 28 },
      );

    // ===== M. 차트 중심 =====
    // Scene 8: 잘게 자르면 [M]
    case 8:
      return sceneRoot(idx, [
        badge(idx, "크기 딜레마"),
        headline(idx, "너무 잘게 자르면\n문맥이 깨진다", "lg", ["문맥", "깨진다"]),
        compareBars(idx, [
          { label: "문맥 깨짐 위험", value: 85 },
          { label: "잡음 섞임 위험", value: 40 },
        ]),
        footerCaption(idx, "잘게 → 문맥 파편화"),
      ]);

    // ===== C. 좌우 비교 CompareCard =====
    // Scene 9: 크게 자르면 [C]
    case 9:
      return sceneRoot(idx, [
        kicker(idx, "설계 문제"),
        headline(idx, "너무 크게 자르면\n잡음이 섞인다", "lg", ["잡음", "설계 문제"]),
        divider(idx),
        compareCard(idx,
          { icon: "x", title: "너무 잘게", subtitle: "문맥이 깨진다", negative: true },
          { icon: "x", title: "너무 크게", subtitle: "잡음이 섞인다", negative: true },
        ),
        footerCaption(idx, "문서마다 전략이 다르다"),
      ]);

    // Scene 10: 기술문서 예시 [K]
    case 10:
      return sceneRoot(idx, [
        badge(idx, "예시"),
        headline(idx, "기술 문서라면\n제목 단위로 자르기", "lg", ["기술 문서"]),
        iconCard(idx, "file-text", "제목/소제목 단위", "제목·소제목 기준", "md", "", "glass"),
      ]);

    // Scene 11: 영상대본 예시 [K]
    case 11:
      return sceneRoot(idx, [
        badge(idx, "예시"),
        headline(idx, "영상 대본이라면\n장면 전환 단위로", "lg", ["영상 대본"]),
        iconCard(idx, "play", "장면 전환 단위", "장면 전환 기준", "md", "", "outline"),
        bulletList(idx, ["오프닝", "문제 제기", "사례", "결론"]),
      ]);

    // ===== E. 프로세스 플로우 =====
    // Scene 12: 오버랩 소개 [E]
    case 12:
      return sceneRoot(idx, [
        kicker(idx, "오버랩 기법"),
        headline(idx, "퍼즐 조각처럼\n앞뒤를 겹쳐라", "lg", ["오버랩"]),
        divider(idx),
        stack(idx, "row", [
          stack(idx, "column", [icon(idx, "layers", 56, false, "-a"), bodyText(idx, "원본 청크", [], "-a")], { align: "center", gap: 8, width: "auto" }, "-ca"),
          arrowConnector(idx, "right", "-1"),
          stack(idx, "column", [icon(idx, "copy", 56, true, "-b"), bodyText(idx, "겹침 영역", [], "-b")], { align: "center", gap: 8 }, "-cb"),
          arrowConnector(idx, "right", "-2"),
          stack(idx, "column", [icon(idx, "layers", 56, false, "-c"), bodyText(idx, "다음 청크", [], "-c")], { align: "center", gap: 8 }, "-cc"),
        ], { align: "center", justify: "center", gap: 16, maxWidth: 600 }, "-flow"),
      ]);

    // Scene 13: 오버랩 효과 [B]
    case 13:
      return sceneRoot(
        idx,
        [
          badge(idx, "효과"),
          headline(idx, "문맥이 끊기는 걸\n어느 정도 방지", "lg", ["문맥", "방지"]),
          insightTile(idx, "문맥 끊김 방지"),
        ],
        { padding: "80px 120px 140px", gap: 28 },
      );

    // Scene 14: 오버랩 주의 [G]
    case 14:
      return sceneRoot(idx, [
        badge(idx, "주의사항"),
        headline(idx, "오버랩이 항상\n효과적이지 않다", "lg", ["항상", "효과적이지 않다"]),
        warningCard(idx, "alert-triangle", "연구 결과", "효과 미보장 + 비용 증가"),
      ]);

    // Scene 15: 테스트 중요 [F]
    case 15:
      return sceneRoot(idx, [
        kicker(idx, "핵심 원칙"),
        headline(idx, "무조건 넣는 게 아니라\n테스트가 필수", "lg", ["테스트"]),
        frameBox(idx, [
          stack(idx, "row", [
            icon(idx, "check-circle", 56),
            bodyText(idx, "문서별 테스트 필수", ["테스트"]),
          ], { align: "center", gap: 16 }),
        ]),
        footerCaption(idx, "무조건 ✕ → 검증 후 적용"),
      ]);

    // Scene 16: 검색 관문 [E] -- 프로세스 플로우
    case 16:
      return sceneRoot(idx, [
        kicker(idx, "두 번째 관문"),
        headline(idx, "검색: 관련 있는\n청크를 찾아오는 일", "lg", ["검색"]),
        divider(idx),
        stack(idx, "row", [
          stack(idx, "column", [icon(idx, "help-circle", 56, false, "-a"), bodyText(idx, "질문", [], "-a")], { align: "center", gap: 8, width: "auto" }, "-ca"),
          arrowConnector(idx, "right", "-1"),
          stack(idx, "column", [icon(idx, "search", 56, true, "-b"), bodyText(idx, "벡터 검색", [], "-b")], { align: "center", gap: 8 }, "-cb"),
          arrowConnector(idx, "right", "-2"),
          stack(idx, "column", [icon(idx, "file-text", 56, false, "-c"), bodyText(idx, "청크 매칭", [], "-c")], { align: "center", gap: 8 }, "-cc"),
        ], { align: "center", justify: "center", gap: 16, maxWidth: 600 }, "-flow"),
      ]);

    // Scene 17: 검색 엉뚱 [G]
    case 17:
      return sceneRoot(idx, [
        badge(idx, "경고"),
        headline(idx, "검색이 엉뚱할 때\n청킹부터 고치지 마라", "lg", ["데이터 지옥"]),
        warningCard(idx, "alert-triangle", "데이터 지옥", "청킹부터 고치면 = 지옥"),
        insightTile(idx, "원인 먼저, 순서대로"),
      ]);

    // Scene 18: 원인 따지기 [F]
    case 18:
      return sceneRoot(idx, [
        kicker(idx, "진단 원칙"),
        headline(idx, "순서대로\n원인을 따져봐야", "lg", ["순서대로"]),
        frameBox(idx, [
          stack(idx, "row", [
            icon(idx, "target", 56),
            bodyText(idx, "원인 순서대로 추적", ["순서대로"]),
          ], { align: "center", gap: 16 }),
        ]),
        insightTile(idx, "질문→임베딩→청킹→설정"),
      ]);

    // Scene 19: 원인1 질문 [L] -- Split(1:2)
    case 19:
      return sceneRoot(idx, [
        kicker(idx, "원인 1"),
        headline(idx, "질문이 너무 짧거나\n모호하면?", "lg", ["질문", "모호"]),
        divider(idx),
        split(idx, [
          icon(idx, "help-circle", 80, true),
          bulletList(idx, [
            "임베딩 흐릿",
            "범위 과다",
            "우선순위 혼란",
          ]),
        ], [1, 2]),
      ]);

    // Scene 20: 원인2 임베딩 [K]
    case 20:
      return sceneRoot(idx, [
        badge(idx, "원인 2"),
        headline(idx, "임베딩 모델이\n맞지 않을 수 있다", "lg", ["임베딩"]),
        iconCard(idx, "globe", "임베딩 불일치", "언어·도메인 불일치", "md", "", "bold"),
      ]);

    // Scene 21: 원인3 청킹 [L] -- Split(2:1)
    case 21:
      return sceneRoot(idx, [
        kicker(idx, "원인 3"),
        headline(idx, "청킹이나 오버랩\n문제일 수 있다", "lg", ["청킹", "오버랩"]),
        divider(idx),
        split(idx, [
          bodyText(idx, "반쪽 결과 → 경계 문제", ["청킹", "오버랩"]),
          icon(idx, "layers", 80, true),
        ], [2, 1]),
      ]);

    // Scene 22: 원인4 설정 [J] -- 체크리스트
    case 22:
      return sceneRoot(idx, [
        kicker(idx, "원인 4"),
        headline(idx, "검색 설정 자체가\n부실할 수 있다", "lg", ["검색 설정"]),
        divider(idx),
        bulletList(idx, [
          "Top-K 부족",
          "하이브리드 없음",
          "리랭킹 미적용",
        ], "check"),
      ]);

    // ===== H. 인용문 중심 =====
    // Scene 23: 빠른 진단법 [H]
    case 23:
      return sceneRoot(idx, [
        pill(idx, "진단법"),
        quoteText(idx, "상위 5개를 직접 읽어보라"),
        divider(idx),
        footerCaption(idx, "가장 빠른 진단법"),
      ]);

    // ===== D. 3열 Grid =====
    // Scene 24: 진단 분류 [D]
    case 24:
      return sceneRoot(idx, [
        badge(idx, "진단 분류"),
        headline(idx, "상위 5개 청크로\n원인을 분류하라", "lg", ["분류"]),
        divider(idx),
        grid(idx, 3, [
          statCard(idx, "?!", "주제 다름\n→ 임베딩/질문", "-a"),
          statCard(idx, "//", "문맥 찢김\n→ 청킹", "-b"),
          statCard(idx, "...", "순서 밀림\n→ 리랭킹/Top-K", "-c"),
        ]),
      ]);

    // Scene 25: 원인분류 정리 [B]
    case 25:
      return sceneRoot(
        idx,
        [
          badge(idx, "정리"),
          headline(idx, "원인을 먼저 분류해야\n삽질 없이 고친다", "xl", ["원인", "분류"]),
          footerCaption(idx, "분류 먼저, 수정은 나중"),
        ],
        { padding: "80px 120px 140px", gap: 28 },
      );

    // Scene 26: RAG 실패 4가지 [D] -- Grid(2x2)
    case 26:
      return sceneRoot(idx, [
        badge(idx, "실무 RAG"),
        headline(idx, "실무에서 RAG가\n안되는 4가지 이유", "lg", ["4가지"]),
        divider(idx),
        grid(idx, 2, [
          iconCard(idx, "layers", "청킹 실패", "경계 틀어짐", "sm", "-a"),
          iconCard(idx, "globe", "임베딩 불일치", "의미 못잡음", "sm", "-b"),
          iconCard(idx, "search", "검색 부정확", "엉뚱한 결과", "sm", "-c"),
          iconCard(idx, "zap", "생성 환각", "근거밖 답변", "sm", "-d"),
        ], 20),
      ]);

    // Scene 27: 실패1 청킹 [K]
    case 27:
      return sceneRoot(idx, [
        badge(idx, "실패 1"),
        headline(idx, "청킹이 잘못됐을 때", "lg", ["청킹"]),
        iconCard(idx, "layers", "청킹 실패", "잘게·크게·경계 문제", "md", "", "outline"),
      ]);

    // Scene 28: 실패2 임베딩 [L] -- Split(1:2)
    case 28:
      return sceneRoot(idx, [
        kicker(idx, "실패 2"),
        headline(idx, "임베딩이\n잘 안 맞을 때", "lg", ["임베딩"]),
        divider(idx),
        split(idx, [
          icon(idx, "globe", 80, true),
          bodyText(idx, "의미 거리 인식 실패", ["의미"]),
        ], [1, 2]),
      ]);

    // Scene 29: 실패3 검색 [J]
    case 29:
      return sceneRoot(idx, [
        kicker(idx, "실패 3"),
        headline(idx, "검색이 부정확할 때", "lg", ["검색", "부정확"]),
        divider(idx),
        bulletList(idx, [
          "Top-K",
          "Threshold",
          "하이브리드",
          "메타 필터",
        ], "check"),
        footerCaption(idx, "검색 파이프라인 점검"),
      ]);

    // Scene 30: 실패4 생성환각 [G]
    case 30:
      return sceneRoot(idx, [
        badge(idx, "실패 4"),
        headline(idx, "생성 단계에서\n헛소리 할 때", "lg", ["생성", "헛소리"]),
        warningCard(idx, "alert-triangle", "LLM 환각", "근거 밖 답변 = 환각"),
      ]);

    // Scene 31: 재료vs조리 비유 [C]
    case 31:
      return sceneRoot(idx, [
        kicker(idx, "비유"),
        headline(idx, "엉뚱한 재료인가\n이상한 조리인가", "lg", ["재료", "조리"]),
        divider(idx),
        compareCard(idx,
          { icon: "search", title: "검색 문제", subtitle: "엉뚱한 재료" },
          { icon: "chef-hat", title: "생성 문제", subtitle: "이상한 조리" },
        ),
      ]);

    // Scene 32: 디버깅 방향 [E] -- 프로세스 플로우
    case 32:
      return sceneRoot(idx, [
        kicker(idx, "디버깅"),
        headline(idx, "검색 vs 생성\n한 가지 질문이면 된다", "lg", ["검색", "생성"]),
        divider(idx),
        stack(idx, "row", [
          stack(idx, "column", [icon(idx, "search", 56, false, "-a"), bodyText(idx, "검색 쪽?", [], "-a")], { align: "center", gap: 8, width: "auto" }, "-ca"),
          arrowConnector(idx, "right", "-1"),
          stack(idx, "column", [icon(idx, "help-circle", 56, true, "-b"), bodyText(idx, "어디?", [], "-b")], { align: "center", gap: 8 }, "-cb"),
          arrowConnector(idx, "right", "-2"),
          stack(idx, "column", [icon(idx, "zap", 56, false, "-c"), bodyText(idx, "생성 쪽?", [], "-c")], { align: "center", gap: 8 }, "-cc"),
        ], { align: "center", justify: "center", gap: 16, maxWidth: 600 }, "-flow"),
      ]);

    // Scene 33: 마법상자 아님 [G]
    case 33:
      return sceneRoot(idx, [
        badge(idx, "중요"),
        headline(idx, "RAG는 마법상자가\n절대 아니다", "lg", ["마법상자", "절대 아니다"]),
        warningCard(idx, "alert-triangle", "좋은 자료 + 좋은 질문", "자료 + 질문 = 결과물"),
        richText(idx, [
          { text: "모호한 질문 → " },
          { text: "흐릿한 결과", tone: "accent" },
        ]),
      ]);

    // ===== O. 나쁜예시/좋은예시 대비 =====
    // Scene 34: 나쁜질문 예시 [O]
    case 34:
      return sceneRoot(idx, [
        kicker(idx, "나쁜 질문 vs 좋은 질문"),
        headline(idx, "이런 질문은\nRAG도 헤맨다", "lg", ["나쁜 질문"]),
        divider(idx),
        split(idx, [
          frameBox(idx, [
            headline(idx, "✕ 나쁜 질문", "sm", ["✕"], "-bad"),
            bulletList(idx, [
              "AI 알려줘",
              "트렌드는?",
              "메모 정리",
            ], "dash", "-bad"),
          ], { width: "100%" }, { border: "2px solid rgba(239,68,68,0.5)" }, "-bad"),
          frameBox(idx, [
            headline(idx, "✓ 좋은 질문", "sm", ["✓"], "-good"),
            bulletList(idx, [
              "글감 5개 찾기",
              "동시 등장 묶기",
            ], "check", "-good"),
          ], { width: "100%" }, { border: "2px solid rgba(34,197,94,0.5)" }, "-good"),
        ], [1, 1], 24),
      ]);

    // Scene 35: 좋은질문 예시 [H]
    case 35:
      return sceneRoot(idx, [
        pill(idx, "좋은 질문"),
        quoteText(idx, "시간 관리 글감 5개를 찾아줘"),
        divider(idx),
        footerCaption(idx, "주제 + 관점 + 결과형태"),
      ]);

    // Scene 36: 질문 3요소 [D] -- 3열 Grid
    case 36:
      return sceneRoot(idx, [
        badge(idx, "질문 3요소"),
        headline(idx, "좋은 RAG 질문에는\n3가지가 들어간다", "lg", ["3가지"]),
        divider(idx),
        grid(idx, 3, [
          processStepCard(idx, "1", "target", "주제", "뭘 찾을지", "-a"),
          processStepCard(idx, "2", "lightbulb", "관점", "어떤 각도", "-b"),
          processStepCard(idx, "3", "star", "결과 형태", "어떤 모양", "-c"),
        ]),
      ]);

    // ===== I. 번호 리스트 (ProcessStepCard 세로) =====
    // Scene 37: 2.관점 [I]
    case 37:
      return sceneRoot(idx, [
        badge(idx, "질문 3요소"),
        headline(idx, "어떤 각도에서\n볼 건지", "lg", ["관점"]),
        stack(idx, "column", [
          processStepCard(idx, "2", "lightbulb", "관점", "불안·철학·시장성"),
        ], { gap: 16, align: "center" }, "-steps"),
      ]);

    // Scene 38: 3.결과형태 [I]
    case 38:
      return sceneRoot(idx, [
        badge(idx, "질문 3요소"),
        headline(idx, "어떤 모양으로\n받고 싶은지", "lg", ["결과 형태"]),
        stack(idx, "column", [
          processStepCard(idx, "3", "star", "결과 형태", "메모 5개·요약·비교"),
        ], { gap: 16, align: "center" }, "-steps"),
      ]);

    // Scene 39: 탐색의 방향 [B]
    case 39:
      return sceneRoot(
        idx,
        [
          badge(idx, "검색 품질"),
          headline(idx, "질문은 검색어가 아니라\n탐색의 방향이다", "xl", ["탐색의 방향"]),
          footerCaption(idx, "세 요소 → 검색 품질 ↑"),
        ],
        { padding: "80px 120px 140px", gap: 28 },
      );

    // Scene 40: 평가 어려움 [F]
    case 40:
      return sceneRoot(idx, [
        kicker(idx, "평가 기준"),
        headline(idx, "가장 어려운 건\n왜 안 맞는지 구분하는 것", "lg", ["구분"]),
        divider(idx),
        frameBox(idx, [
          stack(idx, "row", [
            icon(idx, "check-circle", 56),
            bodyText(idx, "만들기 < 구분하기", ["구분"]),
          ], { align: "center", gap: 16 }),
        ]),
        insightTile(idx, "평가 기준 먼저"),
      ]);

    // Scene 41: 평가 3가지 [J]
    case 41:
      return sceneRoot(idx, [
        kicker(idx, "3가지 체크"),
        headline(idx, "이 세 가지만\n기억하세요", "lg", ["세 가지"]),
        divider(idx),
        bulletList(idx, [
          "독립 의미?",
          "근거 포함?",
          "경계 일치?",
        ], "check"),
        footerCaption(idx, "청킹 품질 3대 체크"),
      ]);

    // Scene 42: 2단계 평가 [C]
    case 42:
      return sceneRoot(idx, [
        badge(idx, "2단계 평가"),
        headline(idx, "검색 평가와\n생성 평가를 분리하라", "lg", ["검색 평가", "생성 평가"]),
        divider(idx),
        compareCard(idx,
          { icon: "search", title: "검색 평가", subtitle: "맞는 근거?" },
          { icon: "check-circle", title: "생성 평가", subtitle: "제대로 답?" },
        ),
      ]);

    // Scene 43: 분리 습관 [N]
    case 43:
      return sceneRoot(idx, [
        stack(idx, "row", [
          pill(idx, "분리", "-a"),
          pill(idx, "습관", "-b"),
        ], { gap: 12, justify: "center" }, "-pills"),
        headline(idx, "두 가지를 분리해서\n보는 습관만 들여도", "lg", ["분리", "습관"]),
        richText(idx, [
          { text: "분리 → " },
          { text: "품질 향상", tone: "accent" },
        ]),
        insightTile(idx, "디버깅이 쉬워진다"),
      ]);

    // Scene 44: 핵심 5가지 [J]
    case 44:
      return sceneRoot(idx, [
        kicker(idx, "핵심 정리"),
        headline(idx, "오늘의 핵심 5가지", "lg", ["핵심"]),
        divider(idx),
        bulletList(idx, [
          "청킹 = 설계",
          "원인 분류 먼저",
          "4대 실패 유형",
          "주제·관점·형태",
          "검색·생성 분리",
        ], "check"),
        footerCaption(idx, "이 5가지만 기억하세요"),
      ]);

    // Scene 45: 한 문장 [B]
    case 45:
      return sceneRoot(
        idx,
        [
          badge(idx, "한 문장"),
          headline(idx, "RAG 튜닝은\n원인 분류부터 시작한다", "xl", ["원인 분류"]),
          footerCaption(idx, "원인 분류가 첫 번째"),
        ],
        { padding: "80px 120px 140px", gap: 28 },
      );

    // Scene 46: 실습편 예고 [N]
    case 46:
      return sceneRoot(idx, [
        stack(idx, "row", [
          pill(idx, "다음 영상", "-a"),
          pill(idx, "실습편", "-b"),
        ], { gap: 12, justify: "center" }, "-pills"),
        headline(idx, "메모 10~20개로\nRAG 실험 실습편", "lg", ["실습편"]),
        richText(idx, [
          { text: "메모로 " },
          { text: "RAG 실험", tone: "accent" },
        ]),
        insightTile(idx, "직접 해보기 = 학습"),
      ]);

    // Scene 47: 구독 부탁 [K]
    case 47:
      return sceneRoot(idx, [
        badge(idx, "바이브랩스"),
        headline(idx, "구독과 좋아요\n댓글 부탁드립니다", "lg", ["구독", "좋아요"]),
        iconCard(idx, "star", "응원해주세요", "구독·좋아요·댓글", "md", "", "bold"),
      ]);

    // Scene 48: 감사합니다 [A]
    case 48:
      return sceneRoot(
        idx,
        [
          overlay(idx, [
            backplate(idx, "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(56,189,248,0.08))"),
            stack(idx, "column", [
              icon(idx, "star", 100, true),
              headline(idx, "감사합니다", "xl", ["감사합니다"]),
            ], { align: "center", justify: "center", gap: 24 }),
          ]),
        ],
        { padding: "80px 120px 140px", gap: 32 },
      );

    default:
      return sceneRoot(idx, [
        badge(idx, "Scene"),
        headline(idx, `Scene ${idx}`, "lg"),
      ]);
  }
}

// ---------------------------------------------------------------------------
// Intent / Tone derivation per scene
// ---------------------------------------------------------------------------
const SCENE_META = [
  /* 0  */ { intent: "introduce", tone: "dramatic", icons: ["brain", "sparkles"] },
  /* 1  */ { intent: "introduce", tone: "questioning", icons: ["brain", "search"] },
  /* 2  */ { intent: "emphasize", tone: "questioning", icons: ["help-circle", "file-text"] },
  /* 3  */ { intent: "define", tone: "confident", icons: ["target", "search"] },
  /* 4  */ { intent: "define", tone: "neutral", icons: ["layers", "file-text"] },
  /* 5  */ { intent: "emphasize", tone: "analytical", icons: ["database", "alert-triangle"] },
  /* 6  */ { intent: "warn", tone: "dramatic", icons: ["alert-triangle", "clock"] },
  /* 7  */ { intent: "define", tone: "confident", icons: ["target", "zap"] },
  /* 8  */ { intent: "compare", tone: "analytical", icons: ["alert-triangle", "layers"] },
  /* 9  */ { intent: "compare", tone: "analytical", icons: ["layers", "alert-triangle"] },
  /* 10 */ { intent: "explain", tone: "neutral", icons: ["file-text", "layers"] },
  /* 11 */ { intent: "explain", tone: "neutral", icons: ["play", "file-text"] },
  /* 12 */ { intent: "define", tone: "neutral", icons: ["layers", "search"] },
  /* 13 */ { intent: "explain", tone: "confident", icons: ["layers", "check-circle"] },
  /* 14 */ { intent: "warn", tone: "analytical", icons: ["alert-triangle", "search"] },
  /* 15 */ { intent: "emphasize", tone: "confident", icons: ["check-circle", "settings"] },
  /* 16 */ { intent: "define", tone: "neutral", icons: ["search", "database"] },
  /* 17 */ { intent: "warn", tone: "dramatic", icons: ["alert-triangle", "search"] },
  /* 18 */ { intent: "explain", tone: "analytical", icons: ["search", "target"] },
  /* 19 */ { intent: "list", tone: "analytical", icons: ["help-circle", "message-circle"] },
  /* 20 */ { intent: "explain", tone: "analytical", icons: ["globe", "search"] },
  /* 21 */ { intent: "explain", tone: "analytical", icons: ["layers", "search"] },
  /* 22 */ { intent: "list", tone: "analytical", icons: ["settings", "search"] },
  /* 23 */ { intent: "process", tone: "confident", icons: ["search", "check-circle"] },
  /* 24 */ { intent: "process", tone: "analytical", icons: ["search", "target"] },
  /* 25 */ { intent: "summarize", tone: "confident", icons: ["check-circle", "target"] },
  /* 26 */ { intent: "introduce", tone: "neutral", icons: ["alert-triangle", "shield"] },
  /* 27 */ { intent: "explain", tone: "neutral", icons: ["layers", "alert-triangle"] },
  /* 28 */ { intent: "explain", tone: "analytical", icons: ["globe", "search"] },
  /* 29 */ { intent: "list", tone: "analytical", icons: ["search", "settings"] },
  /* 30 */ { intent: "warn", tone: "dramatic", icons: ["alert-triangle", "zap"] },
  /* 31 */ { intent: "compare", tone: "neutral", icons: ["search", "chef-hat"] },
  /* 32 */ { intent: "compare", tone: "confident", icons: ["search", "zap"] },
  /* 33 */ { intent: "warn", tone: "dramatic", icons: ["alert-triangle", "lightbulb"] },
  /* 34 */ { intent: "list", tone: "questioning", icons: ["help-circle", "alert-triangle"] },
  /* 35 */ { intent: "list", tone: "confident", icons: ["check-circle", "lightbulb"] },
  /* 36 */ { intent: "define", tone: "confident", icons: ["target", "lightbulb"] },
  /* 37 */ { intent: "define", tone: "confident", icons: ["lightbulb", "target"] },
  /* 38 */ { intent: "define", tone: "confident", icons: ["star", "target"] },
  /* 39 */ { intent: "emphasize", tone: "confident", icons: ["target", "search"] },
  /* 40 */ { intent: "explain", tone: "analytical", icons: ["check-circle", "target"] },
  /* 41 */ { intent: "list", tone: "confident", icons: ["check-circle", "target"] },
  /* 42 */ { intent: "compare", tone: "confident", icons: ["search", "check-circle"] },
  /* 43 */ { intent: "emphasize", tone: "confident", icons: ["check-circle", "trending-up"] },
  /* 44 */ { intent: "summarize", tone: "confident", icons: ["star", "book-open"] },
  /* 45 */ { intent: "impact", tone: "dramatic", icons: ["zap", "target"] },
  /* 46 */ { intent: "introduce", tone: "confident", icons: ["rocket", "play"] },
  /* 47 */ { intent: "introduce", tone: "dramatic", icons: ["star", "users"] },
  /* 48 */ { intent: "introduce", tone: "dramatic", icons: ["star", "sparkles"] },
];

// Emphasis tokens extracted from scene text
const SCENE_EMPHASIS = [
  /* 0  */ ["바이브랩스"],
  /* 1  */ ["RAG", "세번째"],
  /* 2  */ ["엉뚱", "못 찾거나"],
  /* 3  */ ["실패", "작동"],
  /* 4  */ ["청킹", "조각"],
  /* 5  */ ["100만 토큰", "불가능"],
  /* 6  */ ["놓치는", "비용"],
  /* 7  */ ["핵심", "정확히"],
  /* 8  */ ["잘게", "문맥"],
  /* 9  */ ["크게", "잡음", "설계 문제"],
  /* 10 */ ["기술 문서", "제목"],
  /* 11 */ ["영상 대본", "장면 전환"],
  /* 12 */ ["오버랩", "겹쳐"],
  /* 13 */ ["문맥", "막을 수"],
  /* 14 */ ["효과적이지 않다", "비용"],
  /* 15 */ ["테스트", "중요"],
  /* 16 */ ["검색", "벡터"],
  /* 17 */ ["데이터 지옥", "엉뚱"],
  /* 18 */ ["순서대로", "원인"],
  /* 19 */ ["질문", "모호", "임베딩"],
  /* 20 */ ["임베딩", "한국어"],
  /* 21 */ ["청킹", "오버랩"],
  /* 22 */ ["Top-K", "하이브리드", "리랭킹"],
  /* 23 */ ["상위 5개", "읽어보세요"],
  /* 24 */ ["임베딩", "청킹", "리랭킹"],
  /* 25 */ ["원인", "분류"],
  /* 26 */ ["4가지"],
  /* 27 */ ["청킹", "잘못"],
  /* 28 */ ["임베딩", "의미"],
  /* 29 */ ["Top-K", "하이브리드"],
  /* 30 */ ["LLM", "근거밖"],
  /* 31 */ ["재료", "조리"],
  /* 32 */ ["검색", "생성"],
  /* 33 */ ["마법상자", "좋은 질문"],
  /* 34 */ ["AI에 대해", "트렌드", "정리해줘"],
  /* 35 */ ["독서 메모", "IT 동향"],
  /* 36 */ ["주제", "3가지"],
  /* 37 */ ["관점", "각도"],
  /* 38 */ ["결과 형태", "모양"],
  /* 39 */ ["검색 품질", "탐색의 방향"],
  /* 40 */ ["평가", "구분"],
  /* 41 */ ["독립적", "근거", "경계"],
  /* 42 */ ["검색평가", "생성평가"],
  /* 43 */ ["분리", "품질"],
  /* 44 */ ["핵심", "5가지"],
  /* 45 */ ["원인 분류", "시작"],
  /* 46 */ ["실습편"],
  /* 47 */ ["구독", "좋아요"],
  /* 48 */ ["감사합니다"],
];

// Copy layers for each scene -- short headline for metadata
const SCENE_COPY = [
  /* 0  */ { kicker: "INTRO", headline: "안녕하세요 여러분\n바이브랩스의 이석현입니다" },
  /* 1  */ { kicker: "RAG 시리즈", headline: "RAG, 왜 실패하는가?" },
  /* 2  */ { kicker: "문제 인식", headline: "문서 안에 답이 있는데\nAI가 못 찾는다?" },
  /* 3  */ { kicker: "오늘의 주제", headline: "RAG 실패 원인과\n해결법 깊이 파헤치기" },
  /* 4  */ { kicker: "첫 번째 관문", headline: "청킹: 문서를\n작은 조각으로 자르기" },
  /* 5  */ { kicker: "한계", headline: "컨텍스트 윈도우\n100만 토큰의 한계" },
  /* 6  */ { kicker: "주의", headline: "문서가 길어질수록\n중간 내용을 놓친다" },
  /* 7  */ { kicker: "핵심", headline: "필요한 부분만\n정확히 꺼내 쓰는 것" },
  /* 8  */ { kicker: "크기 딜레마", headline: "너무 잘게 자르면\n문맥이 깨진다" },
  /* 9  */ { kicker: "설계 문제", headline: "너무 크게 자르면\n잡음이 섞인다" },
  /* 10 */ { kicker: "예시", headline: "기술 문서라면\n제목 단위로 자르기" },
  /* 11 */ { kicker: "예시", headline: "영상 대본이라면\n장면 전환 단위로" },
  /* 12 */ { kicker: "오버랩 기법", headline: "퍼즐 조각처럼\n앞뒤를 겹쳐라" },
  /* 13 */ { kicker: "효과", headline: "문맥이 끊기는 걸\n어느 정도 방지" },
  /* 14 */ { kicker: "주의사항", headline: "오버랩이 항상\n효과적이지 않다" },
  /* 15 */ { kicker: "핵심 원칙", headline: "무조건 넣는 게 아니라\n테스트가 필수" },
  /* 16 */ { kicker: "두 번째 관문", headline: "검색: 관련 있는\n청크를 찾아오는 일" },
  /* 17 */ { kicker: "경고", headline: "검색이 엉뚱할 때\n청킹부터 고치지 마라" },
  /* 18 */ { kicker: "진단 원칙", headline: "순서대로\n원인을 따져봐야" },
  /* 19 */ { kicker: "원인 1", headline: "질문이 너무 짧거나\n모호하면?" },
  /* 20 */ { kicker: "원인 2", headline: "임베딩 모델이\n맞지 않을 수 있다" },
  /* 21 */ { kicker: "원인 3", headline: "청킹이나 오버랩\n문제일 수 있다" },
  /* 22 */ { kicker: "원인 4", headline: "검색 설정 자체가\n부실할 수 있다" },
  /* 23 */ { kicker: "진단법", headline: "가장 빠른 진단법은\n의외로 간단하다" },
  /* 24 */ { kicker: "진단 분류", headline: "상위 5개 청크로\n원인을 분류하라" },
  /* 25 */ { kicker: "정리", headline: "원인을 먼저 분류해야\n삽질 없이 고친다" },
  /* 26 */ { kicker: "실무 RAG", headline: "실무에서 RAG가\n안되는 4가지 이유" },
  /* 27 */ { kicker: "실패 1", headline: "청킹이 잘못됐을 때" },
  /* 28 */ { kicker: "실패 2", headline: "임베딩이\n잘 안 맞을 때" },
  /* 29 */ { kicker: "실패 3", headline: "검색이 부정확할 때" },
  /* 30 */ { kicker: "실패 4", headline: "생성 단계에서\n헛소리 할 때" },
  /* 31 */ { kicker: "비유", headline: "엉뚱한 재료인가\n이상한 조리인가" },
  /* 32 */ { kicker: "디버깅", headline: "검색 vs 생성\n한 가지 질문이면 된다" },
  /* 33 */ { kicker: "중요", headline: "RAG는 마법상자가\n절대 아니다" },
  /* 34 */ { kicker: "나쁜 질문", headline: "이런 질문은\nRAG도 헤맨다" },
  /* 35 */ { kicker: "좋은 질문", headline: "차이가 느껴지시나요?" },
  /* 36 */ { kicker: "질문 3요소", headline: "좋은 RAG 질문에는\n3가지가 들어간다" },
  /* 37 */ { kicker: "질문 3요소", headline: "어떤 각도에서\n볼 건지" },
  /* 38 */ { kicker: "질문 3요소", headline: "어떤 모양으로\n받고 싶은지" },
  /* 39 */ { kicker: "검색 품질", headline: "질문은 검색어가 아니라\n탐색의 방향이다" },
  /* 40 */ { kicker: "평가 기준", headline: "가장 어려운 건\n왜 안 맞는지 구분하는 것" },
  /* 41 */ { kicker: "3가지 체크", headline: "이 세 가지만\n기억하세요" },
  /* 42 */ { kicker: "2단계 평가", headline: "검색 평가와\n생성 평가를 분리하라" },
  /* 43 */ { kicker: "품질 향상", headline: "두 가지를 분리해서\n보는 습관만 들여도" },
  /* 44 */ { kicker: "핵심 정리", headline: "오늘의 핵심 5가지" },
  /* 45 */ { kicker: "한 문장", headline: "RAG 튜닝은\n원인 분류부터 시작한다" },
  /* 46 */ { kicker: "다음 영상", headline: "메모 10~20개로\nRAG 실험 실습편" },
  /* 47 */ { kicker: "바이브랩스", headline: "구독과 좋아요\n댓글 부탁드립니다" },
  /* 48 */ { kicker: "OUTRO", headline: "감사합니다" },
];

// ---------------------------------------------------------------------------
// Build all 49 scenes
// ---------------------------------------------------------------------------
const FPS = 30;

const scenes = chunks.map((chunk, idx) => {
  const startMs = chunk.start_ms;
  const endMs = chunk.end_ms;
  const durationFrames = Math.round(((endMs - startMs) / 1000) * FPS);

  // Extract subtitles for this scene from SRT
  const srtStart = chunk.srt_range[0]; // 1-based
  const srtEnd = chunk.srt_range[1]; // 1-based
  const subs = srt.slice(srtStart - 1, srtEnd);

  const narration = chunk.text;

  // Build stack_root
  const stackRoot = buildLayout(idx);
  assignEnterAt(stackRoot, durationFrames);

  const meta = SCENE_META[idx] || {
    intent: "explain",
    tone: "neutral",
    icons: ["star"],
  };
  const copy = SCENE_COPY[idx] || { kicker: "", headline: `Scene ${idx}` };
  const emphasis = SCENE_EMPHASIS[idx] || [];

  return {
    id: `scene-${idx}`,
    project_id: "rag3",
    beat_index: idx,
    layout_family: "hero-center",
    start_ms: startMs,
    end_ms: endMs,
    duration_frames: durationFrames,
    components: [],
    copy_layers: {
      kicker: copy.kicker,
      headline: copy.headline,
      supporting: null,
      footer_caption: null,
    },
    motion: {
      entrance: "fadeUp",
      emphasis: null,
      exit: null,
      duration_ms: endMs - startMs,
    },
    assets: {
      svg_icons: meta.icons,
      chart_type: null,
      chart_data: null,
    },
    chunk_metadata: {
      intent: meta.intent,
      tone: meta.tone,
      evidence_type: "statement",
      emphasis_tokens: emphasis,
      density: Math.min(5, Math.max(1, Math.ceil(subs.length / 2))),
      beat_count: 1,
    },
    subtitles: subs.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.text,
    })),
    narration,
    stack_root: stackRoot,
  };
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outDir = path.join(ROOT, "data/rag3");
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "scenes-v2.json"),
  JSON.stringify(scenes, null, 2),
);
console.log(`${scenes.length} scenes -> data/rag3/scenes-v2.json`);

const renderProps = { scenes, audioFile: "RAG3.mp3" };
fs.writeFileSync(
  path.join(outDir, "render-props-v2.json"),
  JSON.stringify(renderProps, null, 2),
);
console.log(`render-props-v2.json written (audioFile: "RAG3.mp3")`);

// Summary
console.log("\n--- Scene Summary ---");
scenes.forEach((s) => {
  const dur = (s.duration_frames / FPS).toFixed(1);
  const mm = Math.floor(s.start_ms / 1000 / 60);
  const ss = String(Math.floor((s.start_ms / 1000) % 60)).padStart(2, "0");
  console.log(
    `  scene-${s.beat_index} (${mm}:${ss}, ${dur}s) [${s.chunk_metadata.intent}/${s.chunk_metadata.tone}] ${s.copy_layers.headline.replace(/\n/g, " ")}`,
  );
});

const totalDur = (scenes[scenes.length - 1].end_ms / 1000 / 60).toFixed(1);
console.log(`\nTotal: ${scenes.length} scenes, ${totalDur} min`);
