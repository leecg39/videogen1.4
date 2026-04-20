#!/usr/bin/env npx tsx
/**
 * enrich-sparse-scenes.ts
 * Sparse 씬의 stack_root를 풍부한 레이아웃으로 교체
 */
import fs from "fs";
import path from "path";

const SCENES_PATH = path.resolve("data/rag-intro/scenes-v2.json");
const scenes = JSON.parse(fs.readFileSync(SCENES_PATH, "utf-8"));

// ── Scene-2 (beat_index 2): "영상 개요" ─────────────────────────────
// 현재: Icon + Headline + Divider (3 leaf만)
// 변경: Icon + Headline + Divider + Grid(3 IconCard) "학습 로드맵"
const scene2 = scenes.find((s: any) => s.beat_index === 2);
if (scene2) {
  scene2.stack_root = {
    id: "sceneroot-5",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "icon-1",
        type: "Icon",
        data: { name: "target", size: 80 },
        motion: { preset: "popBadge", enterAt: 0, duration: 12 },
      },
      {
        id: "headline-2",
        type: "Headline",
        data: {
          text: "오늘 영상을 끝까지 보시면\nRAG를 설명할 수 있게 됩니다",
          size: "lg",
          emphasis: ["RAG", "설명"],
        },
        motion: { preset: "fadeUp", enterAt: 8, duration: 15 },
      },
      {
        id: "divider-3",
        type: "Divider",
        motion: { preset: "drawConnector", enterAt: 18, duration: 8 },
      },
      {
        id: "grid-4",
        type: "Grid",
        layout: { columns: 3, gap: 24, maxWidth: 900 },
        children: [
          {
            id: "iconcard-5",
            type: "IconCard",
            data: { icon: "brain", title: "RAG 개념" },
            variant: "glass",
            motion: { preset: "fadeUp", enterAt: 65, duration: 12 },
          },
          {
            id: "iconcard-6",
            type: "IconCard",
            data: { icon: "search", title: "작동 원리" },
            variant: "glass",
            motion: { preset: "fadeUp", enterAt: 80, duration: 12 },
          },
          {
            id: "iconcard-7",
            type: "IconCard",
            data: { icon: "sparkles", title: "실전 활용" },
            variant: "glass",
            motion: { preset: "fadeUp", enterAt: 95, duration: 12 },
          },
        ],
      },
    ],
  };
  console.log("✅ scene-2: Icon + Headline + Divider + Grid(3 IconCard)");
}

// ── Scene-12 (beat_index 12): "청킹" ────────────────────────────────
// 현재: Kicker + Headline + Divider + 2개 row (sparse)
// 변경: Kicker + Headline + Divider + CompareCard + InsightTile
const scene12 = scenes.find((s: any) => s.beat_index === 12);
if (scene12) {
  scene12.stack_root = {
    id: "sceneroot-15",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "kicker-11",
        type: "Kicker",
        data: { text: "청킹" },
        motion: { preset: "fadeUp", enterAt: 0, duration: 10 },
      },
      {
        id: "headline-12",
        type: "Headline",
        data: {
          text: "문서를 작은 조각으로 나누기",
          size: "lg",
          emphasis: ["청킹", "Chunking"],
        },
        style: { maxWidth: 980 },
        motion: { preset: "fadeUp", enterAt: 12, duration: 15 },
      },
      {
        id: "divider-13",
        type: "Divider",
        motion: { preset: "drawConnector", enterAt: 24, duration: 8 },
      },
      {
        id: "compare-14",
        type: "CompareCard",
        data: {
          left: {
            icon: "file-text",
            title: "500페이지 통째로",
            subtitle: "검색 불가",
            negative: true,
          },
          right: {
            icon: "layers",
            title: "작은 조각으로 분할",
            subtitle: "정확한 검색 가능",
            positive: true,
          },
        },
        motion: { preset: "fadeUp", enterAt: 160, duration: 15 },
      },
      {
        id: "insight-15",
        type: "InsightTile",
        data: { title: "이것이 바로 청킹(Chunking)" },
        motion: { preset: "fadeUp", enterAt: 400, duration: 12 },
      },
    ],
  };
  console.log("✅ scene-12: Kicker + Headline + Divider + CompareCard + InsightTile");
}

// ── Scene-17 (beat_index 17): "임베딩" ───────────────────────────────
// 현재: Kicker + Headline + Divider + 1개 row item만 (매우 sparse)
// 변경: Kicker + Headline + Divider + CompareCard(두 문장 비교) + InsightTile
const scene17 = scenes.find((s: any) => s.beat_index === 17);
if (scene17) {
  scene17.stack_root = {
    id: "sceneroot-10",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "kicker-6",
        type: "Kicker",
        data: { text: "임베딩이란?" },
        motion: { preset: "fadeUp", enterAt: 0, duration: 10 },
      },
      {
        id: "headline-7",
        type: "Headline",
        data: {
          text: "텍스트를 숫자(벡터)로 변환",
          size: "lg",
          emphasis: ["벡터"],
        },
        style: { maxWidth: 980 },
        motion: { preset: "fadeUp", enterAt: 12, duration: 15 },
      },
      {
        id: "divider-8",
        type: "Divider",
        motion: { preset: "drawConnector", enterAt: 24, duration: 8 },
      },
      {
        id: "compare-9",
        type: "CompareCard",
        data: {
          left: {
            icon: "file-text",
            title: "퇴사 후 외주 계약 주의점",
            subtitle: "글자가 완전히 다르지만",
          },
          right: {
            icon: "file-text",
            title: "회사 그만두고 프리랜서 할 때 조심할 것",
            subtitle: "의미는 같다!",
            positive: true,
          },
        },
        motion: { preset: "fadeUp", enterAt: 230, duration: 15 },
      },
      {
        id: "insight-10",
        type: "InsightTile",
        data: {
          index: "→",
          title: "같은 벡터로 변환됨 = 임베딩(Embedding)",
        },
        motion: { preset: "fadeUp", enterAt: 540, duration: 12 },
      },
    ],
  };
  console.log("✅ scene-17: Kicker + Headline + Divider + CompareCard + InsightTile");
}

// ── 저장 ─────────────────────────────────────────────────────────────
fs.writeFileSync(SCENES_PATH, JSON.stringify(scenes, null, 2), "utf-8");
console.log(`\n✅ scenes-v2.json 저장 완료 (${scenes.length}개 씬)`);

// ── render-props-v2.json 동기화 ──────────────────────────────────────
const PROPS_PATH = path.resolve("data/rag-intro/render-props-v2.json");
const props = JSON.parse(fs.readFileSync(PROPS_PATH, "utf-8"));
props.scenes = scenes;
fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2), "utf-8");
console.log("✅ render-props-v2.json 동기화 완료");
