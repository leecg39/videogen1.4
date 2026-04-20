#!/usr/bin/env node
/**
 * scenes-v2.json의 10개 씬 stack_root를 재설계하는 스크립트
 * 미사용 노드 도입 + 패턴 반복 해소 + 빈약한 씬 보강
 */
const fs = require("fs");
const path = require("path");

const scenesPath = path.resolve(__dirname, "../data/rag-intro/scenes-v2.json");
const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf-8"));

function getScene(beat) {
  return scenes.find(s => s.beat_index === beat);
}

// ====== BEAT 9: 환각이 줄어듭니다 (warn) — WarningCard, ProgressBar, FooterCaption 도입 ======
{
  const s = getScene(9); // duration_frames: 554
  s.stack_root = {
    id: "sceneroot-b9",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "이유 3" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "환각이 줄어듭니다", size: "md", emphasis: ["환각"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "split-4", type: "Split",
        layout: { ratio: [1, 1], gap: 32, maxWidth: 1000 },
        children: [
          {
            id: "warningcard-5", type: "WarningCard",
            data: {
              icon: "alert-triangle",
              title: "완전 제거는 불가",
              body: "맥락 오해 시 여전히 오류 발생 가능"
            },
            style: { padding: 28 },
            motion: { preset: "fadeUp", enterAt: 86, duration: 15 }
          },
          {
            id: "stack-6", type: "Stack",
            layout: { direction: "column", align: "stretch", gap: 24 },
            style: { width: "100%" },
            children: [
              {
                id: "insighttile-7", type: "InsightTile",
                data: { index: "✓", title: "근거 자료로 헛소리 확률 ↓" },
                motion: { preset: "fadeUp", enterAt: 200, duration: 12 }
              },
              {
                id: "progressbar-8", type: "ProgressBar",
                data: { value: 70, label: "환각 감소율" },
                motion: { preset: "fadeUp", enterAt: 350, duration: 20 }
              }
            ]
          }
        ]
      },
      {
        id: "footercaption-9", type: "FooterCaption",
        data: { text: "완전 제거가 아닌 확률 감소" },
        motion: { preset: "fadeIn", enterAt: 470, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 7: RAG의 핵심 전환 (emphasize) — QuoteText, Pill 도입 ======
{
  const s = getScene(7); // duration_frames: 224
  s.stack_root = {
    id: "sceneroot-b7",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "pill-1", type: "Pill",
        data: { text: "대화의 전환" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "quotetext-2", type: "QuoteText",
        data: { text: "기억나는 대로 말해봐... → 이 자료 보고 대답해!" },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "compare-4", type: "CompareCard",
        data: {
          left: { icon: "x-circle", title: "기억 의존", subtitle: "환각 위험", negative: true },
          right: { icon: "check-circle", title: "자료 기반", subtitle: "근거 있는 답변", positive: true }
        },
        motion: { preset: "fadeUp", enterAt: 60, duration: 15 }
      },
      {
        id: "footercaption-5", type: "FooterCaption",
        data: { text: "RAG의 핵심 전환" },
        motion: { preset: "fadeIn", enterAt: 150, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 20: 벡터 유사도 비교 (list) — StatCard×3, RichText 도입 ======
{
  const s = getScene(20); // duration_frames: 565
  s.stack_root = {
    id: "sceneroot-b20",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "벡터 검색" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "벡터를 비교하여\n유사한 조각 찾기", size: "md", emphasis: ["코사인 유사도"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "grid-4", type: "Grid",
        layout: { columns: 3, gap: 28 },
        style: { width: "100%", maxWidth: 960 },
        children: [
          {
            id: "statcard-5", type: "StatCard",
            data: { value: "0.95", label: "높은 유사도" },
            motion: { preset: "fadeUp", enterAt: 150, duration: 12 }
          },
          {
            id: "statcard-6", type: "StatCard",
            data: { value: "0.72", label: "중간 유사도" },
            motion: { preset: "fadeUp", enterAt: 220, duration: 12 }
          },
          {
            id: "statcard-7", type: "StatCard",
            data: { value: "0.31", label: "낮은 유사도" },
            motion: { preset: "fadeUp", enterAt: 290, duration: 12 }
          }
        ]
      },
      {
        id: "richtext-8", type: "RichText",
        data: {
          segments: [
            { text: "코사인 유사도로 ", tone: "normal" },
            { text: "가장 가까운 조각", tone: "accent" },
            { text: "을 찾습니다", tone: "normal" }
          ]
        },
        motion: { preset: "fadeUp", enterAt: 400, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 21: 벡터 검색 = 후보 선별 (warn) — WarningCard 2회째 ======
{
  const s = getScene(21); // duration_frames: 650
  s.stack_root = {
    id: "sceneroot-b21",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "kicker-1", type: "Kicker",
        data: { text: "주의" },
        motion: { preset: "fadeUp", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "벡터 검색은 후보 선별 기술", size: "md", emphasis: ["후보 선별"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "warningcard-4", type: "WarningCard",
        data: {
          icon: "alert-triangle",
          title: "가장 가까운 조각 ≠ 정답",
          body: "후보를 골라내는 것일 뿐, 최종 답변이 아닙니다"
        },
        style: { maxWidth: 700 },
        motion: { preset: "fadeUp", enterAt: 100, duration: 15 }
      },
      {
        id: "insighttile-5", type: "InsightTile",
        data: { index: "→", title: "Top-K로 후보 선별 → 리랭킹으로 정밀 검증" },
        motion: { preset: "fadeUp", enterAt: 400, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 25: 하이브리드 검색 (compare) — Row(IconCard→Pill→IconCard) + CompareBars ======
{
  const s = getScene(25); // duration_frames: 949
  s.stack_root = {
    id: "sceneroot-b25",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "두 방식 결합" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "하이브리드 검색", size: "md", emphasis: ["하이브리드"] },
        motion: { preset: "fadeUp", enterAt: 14, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 28, duration: 8 }
      },
      {
        id: "stack-row-4", type: "Stack",
        layout: { direction: "row", align: "center", justify: "center", gap: 20 },
        children: [
          {
            id: "iconcard-5", type: "IconCard", variant: "glass",
            data: { icon: "search", title: "벡터 검색", body: "의미 기반", size: "sm" },
            style: { padding: 20, maxWidth: 240 },
            motion: { preset: "slideSplit", enterAt: 188, duration: 15 }
          },
          {
            id: "arrow-6", type: "ArrowConnector",
            data: { direction: "right" },
            motion: { preset: "drawConnector", enterAt: 250, duration: 10 }
          },
          {
            id: "pill-7", type: "Pill",
            data: { text: "결합" },
            motion: { preset: "popBadge", enterAt: 300, duration: 10 }
          },
          {
            id: "arrow-8", type: "ArrowConnector",
            data: { direction: "right" },
            motion: { preset: "drawConnector", enterAt: 350, duration: 10 }
          },
          {
            id: "iconcard-9", type: "IconCard", variant: "glass",
            data: { icon: "code", title: "키워드 검색", body: "정확한 단어", size: "sm" },
            style: { padding: 20, maxWidth: 240 },
            motion: { preset: "slideRight", enterAt: 397, duration: 15 }
          }
        ]
      },
      {
        id: "comparebars-10", type: "CompareBars",
        data: {
          items: [
            { label: "벡터만", value: 72 },
            { label: "키워드만", value: 65 },
            { label: "하이브리드", value: 91 }
          ],
          unit: "%"
        },
        style: { maxWidth: 700 },
        motion: { preset: "fadeUp", enterAt: 600, duration: 20 }
      }
    ]
  };
}

// ====== BEAT 19: 임베딩 = 검색 준비 (emphasize) — 파이프라인 레이아웃 ======
{
  const s = getScene(19); // duration_frames: 874
  s.stack_root = {
    id: "sceneroot-b19",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "핵심 포인트" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "임베딩은 답변이 아닌\n검색 준비 작업", size: "md", emphasis: ["준비 작업"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "stack-row-4", type: "Stack",
        layout: { direction: "row", align: "center", justify: "center", gap: 24 },
        children: [
          {
            id: "stack-col-5", type: "Stack",
            layout: { direction: "column", align: "center", gap: 12 },
            children: [
              {
                id: "icon-6", type: "Icon",
                data: { name: "trending-up", size: 56, glow: true },
                motion: { preset: "popBadge", enterAt: 200, duration: 12 }
              },
              {
                id: "bodytext-7", type: "BodyText",
                data: { text: "문서 → 벡터" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 215, duration: 10 }
              }
            ]
          },
          {
            id: "line-8", type: "LineConnector",
            layout: { direction: "horizontal" },
            motion: { preset: "drawConnector", enterAt: 300, duration: 10 }
          },
          {
            id: "stack-col-9", type: "Stack",
            layout: { direction: "column", align: "center", gap: 12 },
            children: [
              {
                id: "icon-10", type: "Icon",
                data: { name: "search", size: 56, glow: true },
                motion: { preset: "popBadge", enterAt: 400, duration: 12 }
              },
              {
                id: "bodytext-11", type: "BodyText",
                data: { text: "질문 → 벡터" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 415, duration: 10 }
              }
            ]
          },
          {
            id: "line-12", type: "LineConnector",
            layout: { direction: "horizontal" },
            motion: { preset: "drawConnector", enterAt: 500, duration: 10 }
          },
          {
            id: "stack-col-13", type: "Stack",
            layout: { direction: "column", align: "center", gap: 12 },
            children: [
              {
                id: "icon-14", type: "Icon",
                data: { name: "target", size: 56, glow: true },
                motion: { preset: "popBadge", enterAt: 600, duration: 12 }
              },
              {
                id: "bodytext-15", type: "BodyText",
                data: { text: "유사도 비교" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 615, duration: 10 }
              }
            ]
          }
        ]
      },
      {
        id: "footercaption-16", type: "FooterCaption",
        data: { text: "임베딩 = 검색 인덱스 작업" },
        motion: { preset: "fadeIn", enterAt: 750, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 14: 청킹의 3가지 방법 (list) — Grid 3열 레이아웃 ======
{
  const s = getScene(14); // duration_frames: 473
  s.stack_root = {
    id: "sceneroot-b14",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 32 },
    children: [
      {
        id: "kicker-1", type: "Kicker",
        data: { text: "나누는 방식" },
        motion: { preset: "fadeUp", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "청킹의 3가지 방법", size: "md", emphasis: ["문장", "문단", "토큰"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "grid-4", type: "Grid",
        layout: { columns: 3, gap: 28 },
        style: { width: "100%", maxWidth: 1000 },
        children: [
          {
            id: "stack-5", type: "Stack",
            layout: { direction: "column", align: "center", gap: 16 },
            style: { width: "100%" },
            children: [
              {
                id: "icon-6", type: "Icon",
                data: { name: "file-text", size: 52, glow: true },
                motion: { preset: "popBadge", enterAt: 150, duration: 12 }
              },
              {
                id: "headline-7", type: "Headline",
                data: { text: "문장 단위", size: "sm" },
                motion: { preset: "fadeUp", enterAt: 165, duration: 10 }
              },
              {
                id: "bodytext-8", type: "BodyText",
                data: { text: "가장 세밀한 분할" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 178, duration: 10 }
              }
            ]
          },
          {
            id: "stack-9", type: "Stack",
            layout: { direction: "column", align: "center", gap: 16 },
            style: { width: "100%" },
            children: [
              {
                id: "icon-10", type: "Icon",
                data: { name: "layers", size: 52, glow: true },
                motion: { preset: "popBadge", enterAt: 250, duration: 12 }
              },
              {
                id: "headline-11", type: "Headline",
                data: { text: "문단 단위", size: "sm" },
                motion: { preset: "fadeUp", enterAt: 265, duration: 10 }
              },
              {
                id: "bodytext-12", type: "BodyText",
                data: { text: "의미 보존에 유리" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 278, duration: 10 }
              }
            ]
          },
          {
            id: "stack-13", type: "Stack",
            layout: { direction: "column", align: "center", gap: 16 },
            style: { width: "100%" },
            children: [
              {
                id: "icon-14", type: "Icon",
                data: { name: "code", size: 52, glow: true },
                motion: { preset: "popBadge", enterAt: 350, duration: 12 }
              },
              {
                id: "headline-15", type: "Headline",
                data: { text: "토큰 수 기준", size: "sm" },
                motion: { preset: "fadeUp", enterAt: 365, duration: 10 }
              },
              {
                id: "bodytext-16", type: "BodyText",
                data: { text: "균일한 크기 보장" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 378, duration: 10 }
              }
            ]
          }
        ]
      }
    ]
  };
}

// ====== BEAT 10: 답의 근거 추적 (explain) — Row 파이프라인 + InsightTile ======
{
  const s = getScene(10); // duration_frames: 410
  s.stack_root = {
    id: "sceneroot-b10",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "이유 4" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "답의 근거를 추적 가능", size: "md", emphasis: ["근거", "추적"] },
        motion: { preset: "fadeUp", enterAt: 15, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 30, duration: 8 }
      },
      {
        id: "stack-row-4", type: "Stack",
        layout: { direction: "row", align: "center", justify: "center", gap: 28 },
        children: [
          {
            id: "icon-5", type: "Icon",
            data: { name: "file-text", size: 60, glow: true },
            motion: { preset: "popBadge", enterAt: 80, duration: 12 }
          },
          {
            id: "arrow-6", type: "ArrowConnector",
            data: { direction: "right" },
            motion: { preset: "drawConnector", enterAt: 110, duration: 10 }
          },
          {
            id: "icon-7", type: "Icon",
            data: { name: "search", size: 60, glow: true },
            motion: { preset: "popBadge", enterAt: 140, duration: 12 }
          },
          {
            id: "arrow-8", type: "ArrowConnector",
            data: { direction: "right" },
            motion: { preset: "drawConnector", enterAt: 170, duration: 10 }
          },
          {
            id: "icon-9", type: "Icon",
            data: { name: "check-circle", size: 60, glow: true },
            motion: { preset: "popBadge", enterAt: 200, duration: 12 }
          }
        ]
      },
      {
        id: "insighttile-10", type: "InsightTile",
        data: { index: "1.", title: "AI 답변에서 참고한 문서와 문단을 역추적" },
        motion: { preset: "fadeUp", enterAt: 260, duration: 12 }
      },
      {
        id: "insighttile-11", type: "InsightTile",
        data: { index: "2.", title: "투명한 의사결정 = 신뢰 확보" },
        motion: { preset: "fadeUp", enterAt: 340, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 32: 오늘 배운 내용 정리 (summarize) — BulletList + FooterCaption ======
{
  const s = getScene(32); // duration_frames: 615
  s.stack_root = {
    id: "sceneroot-b32",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 32 },
    children: [
      {
        id: "kicker-1", type: "Kicker",
        data: { text: "5문장 정리" },
        motion: { preset: "fadeUp", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: {
          text: "오늘 배운 내용 정리",
          size: "lg",
          emphasis: ["RAG", "청킹", "임베딩", "벡터 검색"]
        },
        style: { maxWidth: 980 },
        motion: { preset: "fadeUp", enterAt: 13, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 26, duration: 8 }
      },
      {
        id: "bulletlist-4", type: "BulletList",
        data: {
          items: [
            "RAG는 자료를 먼저 찾고, 그 자료를 바탕으로 답한다",
            "청킹은 의미를 살리면서 문서를 나누는 작업이다",
            "임베딩은 텍스트를 벡터로 바꾸는 검색 준비 단계다",
            "벡터 검색은 후보를 선별하고, 리랭킹이 정밀 검증한다",
            "하이브리드 검색 + GraphRAG로 정확도를 극대화한다"
          ],
          bulletStyle: "check"
        },
        style: { maxWidth: 900 },
        motion: { preset: "fadeUp", enterAt: 100, duration: 15 }
      },
      {
        id: "footercaption-5", type: "FooterCaption",
        data: { text: "RAG = Retrieval + Augmented + Generation" },
        motion: { preset: "fadeIn", enterAt: 520, duration: 12 }
      }
    ]
  };
}

// ====== BEAT 5: 냉장고를 먼저 확인하는 셰프 (compare) — Split 비유 + FooterCaption ======
{
  const s = getScene(5); // duration_frames: 379
  s.stack_root = {
    id: "sceneroot-b5",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "badge-1", type: "Badge", variant: "accent",
        data: { text: "이것이 RAG" },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 }
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "냉장고를 먼저 확인하는 셰프", size: "md", emphasis: ["냉장고", "재료"] },
        motion: { preset: "fadeUp", enterAt: 14, duration: 15 }
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 28, duration: 8 }
      },
      {
        id: "split-4", type: "Split",
        layout: { ratio: [1, 1], gap: 32, maxWidth: 900 },
        children: [
          {
            id: "stack-5", type: "Stack",
            layout: { direction: "column", align: "center", gap: 16 },
            style: { width: "100%" },
            children: [
              {
                id: "icon-6", type: "Icon",
                data: { name: "refrigerator", size: 64, glow: true },
                motion: { preset: "popBadge", enterAt: 60, duration: 12 }
              },
              {
                id: "headline-7", type: "Headline",
                data: { text: "재료 확인", size: "sm" },
                motion: { preset: "fadeUp", enterAt: 75, duration: 10 }
              },
              {
                id: "bodytext-8", type: "BodyText",
                data: { text: "필요한 재료를 먼저 파악" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 88, duration: 10 }
              }
            ]
          },
          {
            id: "stack-9", type: "Stack",
            layout: { direction: "column", align: "center", gap: 16 },
            style: { width: "100%" },
            children: [
              {
                id: "icon-10", type: "Icon",
                data: { name: "chef-hat", size: 64, glow: true },
                motion: { preset: "popBadge", enterAt: 150, duration: 12 }
              },
              {
                id: "headline-11", type: "Headline",
                data: { text: "근거 기반 요리", size: "sm" },
                motion: { preset: "fadeUp", enterAt: 165, duration: 10 }
              },
              {
                id: "bodytext-12", type: "BodyText",
                data: { text: "있는 재료로 정확한 요리" },
                style: { fontSize: 22, textAlign: "center" },
                motion: { preset: "fadeIn", enterAt: 178, duration: 10 }
              }
            ]
          }
        ]
      },
      {
        id: "footercaption-13", type: "FooterCaption",
        data: { text: "엉터리 확률 ↓" },
        motion: { preset: "fadeIn", enterAt: 300, duration: 12 }
      }
    ]
  };
}

// 저장
fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2));
console.log("✅ 10개 씬 stack_root 재설계 완료");

// 변경 검증: 사용된 노드 타입 수집
const usedTypes = new Set();
[5,7,9,10,14,19,20,21,25,32].forEach(beat => {
  const s = getScene(beat);
  function walk(node) {
    usedTypes.add(node.type);
    if (node.children) node.children.forEach(walk);
  }
  walk(s.stack_root);
});
console.log("사용된 노드 타입:", [...usedTypes].sort().join(", "));

// 신규 도입 노드 확인
const newNodes = ["StatCard", "WarningCard", "QuoteText", "RichText", "Pill", "ProgressBar", "FooterCaption", "CompareBars", "LineConnector"];
const found = newNodes.filter(n => usedTypes.has(n));
const missing = newNodes.filter(n => !usedTypes.has(n));
console.log("도입된 미사용 노드:", found.join(", "));
if (missing.length) console.log("⚠️ 미도입:", missing.join(", "));
