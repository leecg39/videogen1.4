#!/usr/bin/env node
// _redesign-48-57-batch3.mjs — scene-48~57 3차 배치 재설계
// 전략:
//   1. VerticalTimeline 실투입 (scene-52 시간 단축 narrative)
//   2. 비카드(focal-only) 씬 비율 증가 → scene-49/52/53/55/57
//   3. 각 씬 고유 구조 (shape 반복 회피, 특히 25691e5b 2d77f25e 09ef663d 영역)

import fs from "node:fs";

const FILE = "data/vibe-news-0407/scenes-v2.json";
const scenes = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ──────────────────────────────────────────────────────────────
// scene-48 — 구글독스 피드백 + 두 가지 선택지 (282f, 9.4s) — 카드
// ──────────────────────────────────────────────────────────────
scenes[48].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "기획 이후 두 갈래" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 80, maxWidth: 1400, variant: "vs" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "cloud-line", size: 140, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "클라우드 이어서 구현", size: "md" },
                motion: { preset: "fadeUp", enterAt: 30, duration: 18 } },
              { type: "Badge", data: { text: "AI 전담 유지" },
                motion: { preset: "fadeUp", enterAt: 54, duration: 14 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "laptop-line", size: 140, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 132, duration: 22 } },
              { type: "Headline", data: { text: "내 컴퓨터로 구현", size: "md" },
                motion: { preset: "fadeUp", enterAt: 189, duration: 18 } },
              { type: "Badge", data: { text: "기획서 로컬 이식" },
                motion: { preset: "fadeUp", enterAt: 207, duration: 14 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "구글독스 피드백 워크플로우 유사" },
        motion: { preset: "fadeUp", enterAt: 240, duration: 20 } },
    ],
  }],
};
scenes[48].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-49 — 1인 창업자 유즈케이스 (비카드 focal hero) (315f, 10.5s)
// ──────────────────────────────────────────────────────────────
// 비카드 구조: SceneRoot 직계 자식에 컨테이너 없음 (Kicker + focal + Footer)
scenes[49].stack_root = {
  type: "SceneRoot",
  layout: { gap: 56, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [
    { type: "Kicker", data: { text: "가상 시나리오 · 1인 창업자" } },
    {
      type: "DevIcon",
      data: { name: "User", size: 220, label: "앱을 만들려는 혼자" },
      style: { transform: "translateY(0)" },
      motion: { preset: "scaleIn", enterAt: 12, duration: 28 },
    },
    { type: "FooterCaption", data: { text: "기획과 구현 모두 AI에 맡기는 상황" },
      motion: { preset: "fadeUp", enterAt: 135, duration: 22 } },
  ],
};
scenes[49].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-50 — 쇼핑몰 요구사항 (171f, 5.7s) — 짧은 카드
// ──────────────────────────────────────────────────────────────
scenes[50].stack_root = {
  type: "SceneRoot",
  layout: { gap: 28, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 32, maxWidth: 1300, align: "center" },
    children: [
      { type: "Kicker", data: { text: "프롬프트 요구사항" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1100, gap: 16, padding: "32px 44px" },
        data: { variant: "border-accent" },
        children: [
          { type: "BulletList",
            data: { items: ["회원 가입 기능", "결제 시스템", "관리자 페이지", "쇼핑몰 완성형"], variant: "check" },
            motion: { preset: "fadeUp", enterAt: 0, duration: 24 } },
        ],
      },
      { type: "FooterCaption", data: { text: "한 문장 프롬프트로 전체 요청" },
        motion: { preset: "fadeUp", enterAt: 114, duration: 20 } },
    ],
  }],
};
scenes[50].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-51 — AI 웹 설계 + 예전 개발자 대조 (279f, 9.3s) — 카드
// ──────────────────────────────────────────────────────────────
scenes[51].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "설계 방식 변화" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 64, maxWidth: 1400, variant: "arrow" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "calendar-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "예전 방식", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 18 } },
              { type: "BodyText", data: { text: "기획 설명 + 견적 + 수 주 대기" },
                motion: { preset: "fadeUp", enterAt: 48, duration: 18 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "spark-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 114, duration: 22 } },
              { type: "Headline", data: { text: "AI 웹 설계", size: "md" },
                motion: { preset: "fadeUp", enterAt: 174, duration: 18 } },
              { type: "BodyText", data: { text: "자동 설계도 생성 병행" },
                motion: { preset: "fadeUp", enterAt: 201, duration: 18 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "사용자는 병렬 다른 작업 가능" },
        motion: { preset: "fadeUp", enterAt: 246, duration: 20 } },
    ],
  }],
};
scenes[51].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-52 — VerticalTimeline 실투입: 수 주 → 30분 획기적 단축 (비카드)
// (237f, 7.9s)
// ──────────────────────────────────────────────────────────────
// 비카드 구조: SceneRoot 직계 = Kicker + VerticalTimeline + Footer
scenes[52].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [
    { type: "Kicker", data: { text: "개발 소요시간 전환" } },
    {
      type: "VerticalTimeline",
      layout: { maxWidth: 900 },
      data: {
        align: "left",
        lineStyle: "solid",
        steps: [
          { year: "이전", label: "수 주", desc: "기획 설명 + 견적 + 수정 반복" },
          { year: "현재", label: "30분", desc: "AI 자율 기획 + 병렬 구현", accent: true },
        ],
        stepEnterAts: [12, 117],
      },
      motion: { enterAt: 0, duration: 30 },
    },
    { type: "FooterCaption", data: { text: "연구 미리보기 단계 · 방향성 뚜렷" },
      motion: { preset: "fadeUp", enterAt: 180, duration: 20 } },
  ],
};
scenes[52].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-53 — 뉴스 4 GPT6 4월 14일 (비카드 mega hero) (312f, 10.4s)
// ──────────────────────────────────────────────────────────────
// 비카드: SceneRoot 직계 = Kicker + ImpactStat + Footer
scenes[53].stack_root = {
  type: "SceneRoot",
  layout: { gap: 42, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [
    { type: "Kicker", data: { text: "뉴스 4 · GPT6 출시설" } },
    {
      type: "ImpactStat",
      data: { value: "4.14", label: "출시설 · 월요일", size: "xl" },
      motion: { preset: "popNumber", enterAt: 129, duration: 28 },
    },
    {
      type: "Stack",
      layout: { direction: "row", gap: 16, align: "center", justify: "center" },
      children: [
        { type: "Badge", data: { text: "OpenAI 내부 소문" },
          motion: { preset: "fadeUp", enterAt: 213, duration: 14 } },
        { type: "Badge", data: { text: "출처 미확인" },
          motion: { preset: "fadeUp", enterAt: 228, duration: 14 } },
      ],
    },
    { type: "FooterCaption", data: { text: "마지막 소식 · 소문 검증" },
      motion: { preset: "fadeUp", enterAt: 265, duration: 20 } },
  ],
};
scenes[53].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-54 — OpenAI GPT6 공개설 + 내부자 주장 (345f, 11.5s) — 카드
// ──────────────────────────────────────────────────────────────
scenes[54].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "4월 14일 공개설 소스" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1280, gap: 18, padding: "36px 48px" },
        data: { variant: "border-neutral" },
        children: [
          {
            type: "Stack",
            layout: { direction: "row", gap: 28, align: "center" },
            children: [
              { type: "DevIcon", data: { name: "OpenAI", size: 140 },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Stack", layout: { direction: "column", gap: 10, align: "start" },
                children: [
                  { type: "Headline", data: { text: "GPT6 공개 주장", size: "md" },
                    motion: { preset: "fadeUp", enterAt: 66, duration: 18 } },
                  { type: "BodyText", data: { text: "내부자 계정 · 출처 미확인" },
                    motion: { preset: "fadeUp", enterAt: 195, duration: 18 } },
                ] },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "주장 핵심 검증 필요" },
        motion: { preset: "fadeUp", enterAt: 309, duration: 20 } },
    ],
  }],
};
scenes[54].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-55 — GPT5.4 대비 40% 향상 (비카드 mega hero) (297f, 9.9s)
// ──────────────────────────────────────────────────────────────
// 비카드: SceneRoot 직계 = Kicker + ImpactStat + Stack(Badge row) + Footer
scenes[55].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [
    { type: "Kicker", data: { text: "내부자 주장 핵심" } },
    {
      type: "ImpactStat",
      data: { value: "40", suffix: "%", label: "지능 향상 · GPT5.4 대비", size: "xl" },
      motion: { preset: "popNumber", enterAt: 0, duration: 26 },
    },
    {
      type: "Stack",
      layout: { direction: "row", gap: 20, align: "center", justify: "center" },
      children: [
        { type: "Badge", data: { text: "코딩" },
          motion: { preset: "fadeUp", enterAt: 105, duration: 14 } },
        { type: "Badge", data: { text: "논리 추론" },
          motion: { preset: "fadeUp", enterAt: 117, duration: 14 } },
        { type: "Badge", data: { text: "에이전트 기능" },
          motion: { preset: "fadeUp", enterAt: 144, duration: 14 } },
      ],
    },
    { type: "FooterCaption", data: { text: "대폭 향상 3축" },
      motion: { preset: "fadeUp", enterAt: 240, duration: 20 } },
  ],
};
scenes[55].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-56 — 하네스 시스템 업그레이드 기대 (246f, 8.2s) — 카드
// ──────────────────────────────────────────────────────────────
scenes[56].stack_root = {
  type: "SceneRoot",
  layout: { gap: 32, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 32, maxWidth: 1400, align: "center" },
    children: [
      { type: "Kicker", data: { text: "하네스 시스템 전망" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 56, maxWidth: 1300, variant: "arrow" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 12, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "weight-scale-line", size: 120, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "코덱스 하네스 아쉬움", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 18 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 12, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "ladder-line", size: 120, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 114, duration: 22 } },
              { type: "Headline", data: { text: "3축 + 하네스 업그레이드", size: "md" },
                motion: { preset: "fadeUp", enterAt: 138, duration: 18 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "추론 기반 기대감 증폭" },
        motion: { preset: "fadeUp", enterAt: 200, duration: 20 } },
    ],
  }],
};
scenes[56].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-57 — 200만 토큰 컨텍스트 = 책 15권 (비카드 mega) (276f, 9.2s)
// ──────────────────────────────────────────────────────────────
// 비카드: SceneRoot 직계 = Kicker + ImpactStat + Stack(row) + Footer
scenes[57].stack_root = {
  type: "SceneRoot",
  layout: { gap: 40, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [
    { type: "Kicker", data: { text: "컨텍스트 윈도우 확장" } },
    {
      type: "ImpactStat",
      data: { value: "200M", label: "토큰 · 한 번 처리량", size: "xl" },
      motion: { preset: "popNumber", enterAt: 0, duration: 26 },
    },
    {
      type: "Stack",
      layout: { direction: "row", gap: 24, align: "center", justify: "center" },
      children: [
        { type: "SvgAsset", data: { asset_id: "document-line", size: 64, drawMode: true, tint: "accent" },
          motion: { preset: "scaleIn", enterAt: 156, duration: 16 } },
        { type: "Headline", data: { text: "책 약 15권 분량", size: "md" },
          motion: { preset: "fadeUp", enterAt: 165, duration: 18 } },
      ],
    },
    { type: "FooterCaption", data: { text: "단일 프롬프트 대용량 처리" },
      motion: { preset: "fadeUp", enterAt: 225, duration: 20 } },
  ],
};
scenes[57].phase = "B";

fs.writeFileSync(FILE, JSON.stringify(scenes, null, 2));
console.log("✓ scene-48~57 배치 3 재설계 완료 (10 씬)");
// 비카드 씬 개수 집계
let nonCard = 0;
for (const i of [48,49,50,51,52,53,54,55,56,57]) {
  const root = scenes[i].stack_root;
  const hasContainerChild = (root?.children ?? []).some((c) =>
    ["Stack", "Grid", "Split", "FrameBox", "Absolute", "Overlay"].includes(c.type));
  if (!hasContainerChild) nonCard++;
  console.log(`  scene-${i} nonCard:${!hasContainerChild}`);
}
console.log(`\n배치 3 비카드: ${nonCard}/10 (= ${(nonCard*10).toFixed(0)}%)`);
