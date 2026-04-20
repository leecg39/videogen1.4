#!/usr/bin/env npx tsx
/**
 * enrich-sparse-scenes-2.ts — 2차 sparse 씬 enrichment
 */
import fs from "fs";
import path from "path";

const SCENES_PATH = path.resolve("data/rag-intro/scenes-v2.json");
const scenes = JSON.parse(fs.readFileSync(SCENES_PATH, "utf-8"));

// ── Scene-3 (beat 3): "기억만으로 요리하는 셰프" ──────────────────
// 현재: Badge + Headline + Divider + Split(2 IconCards) — 카드 enterAt 너무 늦음
// 수정: enterAt 앞당김 + InsightTile 추가
const s3 = scenes.find((s: any) => s.beat_index === 3);
if (s3) {
  s3.stack_root = {
    id: "sceneroot-7",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 24 },
    children: [
      {
        id: "badge-1", type: "Badge",
        data: { text: "비교" }, variant: "accent",
        motion: { preset: "popBadge", enterAt: 0, duration: 10 },
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "기억만으로 요리하는 셰프", size: "md", emphasis: ["기억"] },
        motion: { preset: "fadeUp", enterAt: 10, duration: 15 },
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 22, duration: 8 },
      },
      {
        id: "split-6", type: "Split",
        layout: { ratio: [1, 1], gap: 36, maxWidth: 900 },
        children: [
          {
            id: "iconcard-4", type: "IconCard",
            data: { icon: "chef-hat", title: "레시피 없이 기억에만 의존", body: "기억이 흐릿하면 즉흥 조리" },
            variant: "glass",
            motion: { preset: "slideSplit", enterAt: 80, duration: 15 },
          },
          {
            id: "iconcard-5", type: "IconCard",
            data: { icon: "alert-triangle", title: "가끔 이상한 결과물", body: "기억의 한계 = 환각(Hallucination)" },
            variant: "glass",
            motion: { preset: "slideRight", enterAt: 200, duration: 15 },
          },
        ],
      },
      {
        id: "insight-7", type: "InsightTile",
        data: { index: "→", title: "이것이 기존 AI의 한계" },
        motion: { preset: "fadeUp", enterAt: 380, duration: 12 },
      },
    ],
  };
  console.log("✅ scene-3: Split(2 IconCard) + InsightTile, enterAt 앞당김");
}

// ── Scene-6 (beat 6): "RAG의 핵심 3단계" ─────────────────────────
// 수정: ProcessStepCard maxWidth 260→360 (더 넓게)
const s6 = scenes.find((s: any) => s.beat_index === 6);
if (s6) {
  const root = s6.stack_root;
  // DFS로 ProcessStepCard 찾아서 maxWidth 변경
  function fixMaxWidth(node: any) {
    if (node.type === "ProcessStepCard" && node.style?.maxWidth) {
      node.style.maxWidth = 360;
    }
    if (node.children) node.children.forEach(fixMaxWidth);
  }
  fixMaxWidth(root);
  // 카드 row Stack의 gap도 조정
  function fixGap(node: any) {
    if (node.type === "Stack" && node.layout?.direction === "row" && node.children?.some((c: any) => c.type === "ProcessStepCard")) {
      node.layout.gap = 16;
    }
    if (node.children) node.children.forEach(fixGap);
  }
  fixGap(root);
  console.log("✅ scene-6: ProcessStepCard maxWidth 260→360, gap 24→16");
}

// ── Scene-7 (beat 7): "기억나는 대로 말해봐" ──────────────────────
// 현재: Icon + Headline + Divider + QuoteText (Headline과 QuoteText 내용 중복)
// 수정: CompareCard로 교체하여 시각적 비교
const s7 = scenes.find((s: any) => s.beat_index === 7);
if (s7) {
  s7.stack_root = {
    id: "sceneroot-6",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "icon-1", type: "Icon",
        data: { name: "message-circle", size: 72 },
        motion: { preset: "popBadge", enterAt: 0, duration: 10 },
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "RAG의 핵심 전환", size: "md", emphasis: ["핵심"] },
        motion: { preset: "fadeUp", enterAt: 8, duration: 15 },
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 20, duration: 8 },
      },
      {
        id: "compare-4", type: "CompareCard",
        data: {
          left: {
            icon: "x-circle",
            title: "기억나는 대로 말해봐",
            subtitle: "환각 위험",
            negative: true,
          },
          right: {
            icon: "check-circle",
            title: "이 자료 보고 대답해",
            subtitle: "근거 기반 답변",
            positive: true,
          },
        },
        motion: { preset: "fadeUp", enterAt: 40, duration: 15 },
      },
    ],
  };
  console.log("✅ scene-7: CompareCard (기존 QuoteText 중복 제거)");
}

// ── Scene-11 (beat 11): "RAG의 성패는 검색 품질이 결정한다" ────────
// 현재: Icon + Headline + Divider + Badge (매우 sparse, 756 frames)
// 수정: Icon + Headline + Divider + CompareCard(요리비유) + InsightTile
const s11 = scenes.find((s: any) => s.beat_index === 11);
if (s11) {
  s11.stack_root = {
    id: "sceneroot-7",
    type: "SceneRoot",
    layout: { padding: "60px 120px 160px", gap: 28 },
    children: [
      {
        id: "icon-1", type: "Icon",
        data: { name: "search", size: 80 },
        style: { filter: "drop-shadow(0 0 12px rgba(244,63,94,0.4))" },
        motion: { preset: "popBadge", enterAt: 0, duration: 12 },
      },
      {
        id: "headline-2", type: "Headline",
        data: { text: "RAG의 성패는\n검색 품질이 결정한다", size: "lg", emphasis: ["검색 품질"] },
        motion: { preset: "fadeUp", enterAt: 10, duration: 15 },
      },
      {
        id: "divider-3", type: "Divider",
        motion: { preset: "drawConnector", enterAt: 22, duration: 8 },
      },
      {
        id: "compare-4", type: "CompareCard",
        data: {
          left: {
            icon: "x-circle",
            title: "엉뚱한 재료",
            subtitle: "이상한 요리 = 오답",
            negative: true,
          },
          right: {
            icon: "check-circle",
            title: "좋은 재료",
            subtitle: "좋은 요리 = 정확한 답",
            positive: true,
          },
        },
        motion: { preset: "fadeUp", enterAt: 150, duration: 15 },
      },
      {
        id: "badge-5", type: "Badge",
        data: { text: "검색 품질" }, variant: "accent",
        motion: { preset: "popBadge", enterAt: 400, duration: 10 },
      },
      {
        id: "insight-6", type: "InsightTile",
        data: { index: "→", title: "이후 내용은 '자료를 잘 찾는 법'" },
        motion: { preset: "fadeUp", enterAt: 600, duration: 12 },
      },
    ],
  };
  console.log("✅ scene-11: CompareCard + Badge + InsightTile");
}

// ── Scene-16 (beat 16): "첫 버전은 문단 기반 청킹 + 오버랩" ──────
// 현재: Badge + Headline + Divider + CompareBars
// 수정: InsightTile 추가
const s16 = scenes.find((s: any) => s.beat_index === 16);
if (s16) {
  const root = s16.stack_root;
  // 기존 children 끝에 InsightTile 추가
  root.children.push({
    id: "insight-5",
    type: "InsightTile",
    data: { index: "💡", title: "문단 기반 청킹 + 오버랩이 최고의 출발점" },
    motion: { preset: "fadeUp", enterAt: 450, duration: 12 },
  });
  console.log("✅ scene-16: InsightTile 추가");
}

// ── 저장 ─────────────────────────────────────────────────────────────
fs.writeFileSync(SCENES_PATH, JSON.stringify(scenes, null, 2), "utf-8");
console.log(`\n✅ scenes-v2.json 저장 완료`);

const PROPS_PATH = path.resolve("data/rag-intro/render-props-v2.json");
const props = JSON.parse(fs.readFileSync(PROPS_PATH, "utf-8"));
props.scenes = scenes;
fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2), "utf-8");
console.log("✅ render-props-v2.json 동기화 완료");
