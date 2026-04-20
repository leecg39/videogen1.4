#!/usr/bin/env node
// _redesign-28-37-batch1.mjs — scene-28~37 1차 배치 재설계 (수동 authoring)
// 9개 씬 각각 고유 stack_root. pattern builder 함수 없음. 각 씬 narration 직접 반영.

import fs from "node:fs";

const FILE = "data/vibe-news-0407/scenes-v2.json";
const scenes = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ──────────────────────────────────────────────────────────────
// scene-28 — Claude Sonnet 벤치마크 공개 + MLX 결합 (278f, 9.3s)
// ──────────────────────────────────────────────────────────────
scenes[28].stack_root = {
  type: "SceneRoot",
  layout: { gap: 40, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 44, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "엔트로픽 공개 벤치마크" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 100, maxWidth: 1400, variant: "arrow" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 20, align: "center" },
            children: [
              { type: "DevIcon", data: { name: "ClaudeAI", size: 150 },
                motion: { preset: "scaleIn", enterAt: 6, duration: 18 } },
              { type: "Headline", data: { text: "Claude Sonnet", size: "md" },
                motion: { preset: "fadeUp", enterAt: 36, duration: 15 } },
              { type: "Badge", data: { text: "공식 성능 발표" },
                motion: { preset: "fadeUp", enterAt: 54, duration: 14 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 20, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "chart-up-line", size: 150, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 70, duration: 22 } },
              { type: "Headline", data: { text: "유로 AI 비교 시험", size: "md" },
                motion: { preset: "fadeUp", enterAt: 96, duration: 15 } },
              { type: "Badge", data: { text: "유럽 모델군" },
                motion: { preset: "fadeUp", enterAt: 114, duration: 14 } },
            ],
          },
        ],
      },
      {
        type: "Stack", layout: { direction: "row", gap: 28, align: "center", justify: "center" },
        children: [
          { type: "SvgAsset", data: { asset_id: "plus-grid-line", size: 64, drawMode: true, tint: "accent" },
            motion: { preset: "scaleIn", enterAt: 165, duration: 16 } },
          { type: "Headline", data: { text: "MLX 맥 가속 결합", size: "md" },
            motion: { preset: "fadeUp", enterAt: 172, duration: 18 } },
        ],
      },
      { type: "FooterCaption", data: { text: "성능 레벨 한 계단 상승" },
        motion: { preset: "fadeUp", enterAt: 220, duration: 18 } },
    ],
  }],
};
scenes[28].phase = "B";
scenes[28].hero_frame_ms = 7000;

// ──────────────────────────────────────────────────────────────
// scene-29 — 속도 3~4배 + vLLM 정의 (339f, 11.3s)
// ──────────────────────────────────────────────────────────────
scenes[29].stack_root = {
  type: "SceneRoot",
  layout: { gap: 40, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "속도 향상 폭" } },
      {
        type: "Split",
        layout: { ratio: [3, 4], gap: 80, maxWidth: 1400, variant: "gap" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "ImpactStat", data: { value: "3~4", suffix: "배", label: "더 빠름", size: "xl" },
                motion: { preset: "popNumber", enterAt: 0, duration: 22 } },
              { type: "Badge", data: { text: "빠른 응답" },
                motion: { preset: "fadeUp", enterAt: 60, duration: 14 } },
            ],
          },
          {
            type: "FrameBox",
            layout: { maxWidth: 640, gap: 18 },
            data: { variant: "border-accent" },
            children: [
              { type: "Kicker", data: { text: "용어 정리" } },
              { type: "Headline", data: { text: "vLLM", size: "md" },
                motion: { preset: "fadeUp", enterAt: 108, duration: 15 } },
              { type: "BodyText", data: { text: "AI 모델을 효율적으로 굴리는 고속 추론 엔진" },
                motion: { preset: "fadeUp", enterAt: 225, duration: 18 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "세 가지 도구만 기억하면 충분" },
        motion: { preset: "fadeUp", enterAt: 280, duration: 20 } },
    ],
  }],
};
scenes[29].phase = "B";
scenes[29].hero_frame_ms = 8500;

// ──────────────────────────────────────────────────────────────
// scene-30 — 주방장 비유 + GitHub 75K★ (257f, 8.6s)
// ──────────────────────────────────────────────────────────────
scenes[30].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "vLLM · 주방장 비유" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 80, maxWidth: 1400, variant: "line" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 20, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "branching-line", size: 150, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "주문 똑똑 배분", size: "md" },
                motion: { preset: "fadeUp", enterAt: 30, duration: 15 } },
              { type: "BodyText", data: { text: "손님 대기 시간 최소화" },
                motion: { preset: "fadeUp", enterAt: 48, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "ImpactStat", data: { value: "75K", suffix: "★", label: "GitHub 지지", size: "lg" },
                motion: { preset: "popNumber", enterAt: 78, duration: 22 } },
              { type: "Badge", data: { text: "오픈소스 최상위권" },
                motion: { preset: "fadeUp", enterAt: 110, duration: 14 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "사실상 표준급 인기 입증" },
        motion: { preset: "fadeUp", enterAt: 200, duration: 18 } },
    ],
  }],
};
scenes[30].phase = "B";
scenes[30].hero_frame_ms = 6800;

// ──────────────────────────────────────────────────────────────
// scene-31 — 사실상 표준 + MLX 정의 (337f, 11.2s)
// ──────────────────────────────────────────────────────────────
scenes[31].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "MLX · 애플의 맥 최적화" } },
      {
        type: "Split",
        layout: { ratio: [2, 3], gap: 80, maxWidth: 1400, variant: "gap" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "DevIcon", data: { name: "AppleLight", size: 170 },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Badge", data: { text: "Apple Silicon" },
                motion: { preset: "fadeUp", enterAt: 45, duration: 14 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 18, align: "start" },
            children: [
              { type: "Headline", data: { text: "맥 성능 최대 가속", size: "md" },
                motion: { preset: "fadeUp", enterAt: 120, duration: 18 } },
              { type: "Stack",
                layout: { direction: "row", gap: 28, align: "center" },
                children: [
                  { type: "CheckMark", data: { label: "M1", variant: "accent" },
                    motion: { preset: "fadeUp", enterAt: 150, duration: 14 } },
                  { type: "CheckMark", data: { label: "M2", variant: "accent" },
                    motion: { preset: "fadeUp", enterAt: 165, duration: 14 } },
                  { type: "CheckMark", data: { label: "M4", variant: "accent" },
                    motion: { preset: "fadeUp", enterAt: 180, duration: 14 } },
                ] },
              { type: "BodyText", data: { text: "맥북 사용자를 위한 전용 가속 도구" },
                motion: { preset: "fadeUp", enterAt: 222, duration: 18 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "표준급 vLLM · 맥 전용 MLX" },
        motion: { preset: "fadeUp", enterAt: 280, duration: 20 } },
    ],
  }],
};
scenes[31].phase = "B";
scenes[31].hero_frame_ms = 8500;

// ──────────────────────────────────────────────────────────────
// scene-32 — MLX 최대 + vLLM+MLX 합작 (338f, 11.3s)
// ──────────────────────────────────────────────────────────────
scenes[32].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "두 도구 결합 합작" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 72, maxWidth: 1400, variant: "arrow" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "gear-line", size: 150, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "vLLM", size: "md" },
                motion: { preset: "fadeUp", enterAt: 30, duration: 15 } },
              { type: "BodyText", data: { text: "똑똑한 배분 기능" },
                motion: { preset: "fadeUp", enterAt: 48, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "rocket-line", size: 150, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 87, duration: 22 } },
              { type: "Headline", data: { text: "MLX", size: "md" },
                motion: { preset: "fadeUp", enterAt: 117, duration: 15 } },
              { type: "BodyText", data: { text: "맥 성능 최적화" },
                motion: { preset: "fadeUp", enterAt: 135, duration: 15 } },
            ],
          },
        ],
      },
      { type: "Headline", data: { text: "올해 등장한 합작 도구", size: "md" },
        motion: { preset: "fadeUp", enterAt: 195, duration: 20 } },
      { type: "FooterCaption", data: { text: "두 강점을 하나로 묶은 조합" },
        motion: { preset: "fadeUp", enterAt: 255, duration: 20 } },
    ],
  }],
};
scenes[32].phase = "B";
scenes[32].hero_frame_ms = 8500;

// ──────────────────────────────────────────────────────────────
// scene-33 — Ollama 설명 (349f, 11.6s)
// ──────────────────────────────────────────────────────────────
scenes[33].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "Ollama · 간편 실행 도구" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1280, gap: 28, padding: "40px 56px" },
        data: { variant: "border-accent" },
        children: [
          {
            type: "Stack",
            layout: { direction: "row", gap: 44, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "terminal-line", size: 170, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              {
                type: "Stack", layout: { direction: "column", gap: 14, align: "start" },
                children: [
                  { type: "Headline", data: { text: "명령어 한 줄로 AI 구동", size: "md" },
                    motion: { preset: "fadeUp", enterAt: 42, duration: 18 } },
                  { type: "BodyText", data: { text: "설치 한 번 · 실행 한 번 · 터미널 한 줄" },
                    motion: { preset: "fadeUp", enterAt: 141, duration: 18 } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "Stack",
        layout: { direction: "row", gap: 20, align: "center", justify: "center" },
        children: [
          { type: "Badge", data: { text: "초보자 맞춤" },
            motion: { preset: "fadeUp", enterAt: 195, duration: 14 } },
          { type: "Badge", data: { text: "설정 불필요" },
            motion: { preset: "fadeUp", enterAt: 210, duration: 14 } },
          { type: "Badge", data: { text: "로컬 구동" },
            motion: { preset: "fadeUp", enterAt: 225, duration: 14 } },
        ],
      },
      { type: "FooterCaption", data: { text: "기술 설정 없이 바로 시작" },
        motion: { preset: "fadeUp", enterAt: 270, duration: 20 } },
    ],
  }],
};
scenes[33].phase = "B";
scenes[33].hero_frame_ms = 9000;

// ──────────────────────────────────────────────────────────────
// scene-34 — 3도구 역할 정리 + 레고 비유 (278f, 9.3s)
// ──────────────────────────────────────────────────────────────
scenes[34].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1600, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "3종 도구 역할 정리" } },
      {
        type: "Grid",
        layout: { columns: 3, gap: 56, maxWidth: 1500 },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "terminal-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 20 } },
              { type: "Headline", data: { text: "Ollama", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 15 } },
              { type: "BodyText", data: { text: "간편 시작" },
                motion: { preset: "fadeUp", enterAt: 40, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "gear-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 78, duration: 20 } },
              { type: "Headline", data: { text: "vLLM", size: "md" },
                motion: { preset: "fadeUp", enterAt: 100, duration: 15 } },
              { type: "BodyText", data: { text: "본격 배치" },
                motion: { preset: "fadeUp", enterAt: 118, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "rocket-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 144, duration: 20 } },
              { type: "Headline", data: { text: "MLX", size: "md" },
                motion: { preset: "fadeUp", enterAt: 166, duration: 15 } },
              { type: "BodyText", data: { text: "맥 성능 가속" },
                motion: { preset: "fadeUp", enterAt: 184, duration: 15 } },
            ],
          },
        ],
      },
      {
        type: "Stack",
        layout: { direction: "row", gap: 20, align: "center", justify: "center" },
        children: [
          { type: "SvgAsset", data: { asset_id: "puzzle-piece-line", size: 60, drawMode: true, tint: "accent" },
            motion: { preset: "scaleIn", enterAt: 213, duration: 15 } },
          { type: "Headline", data: { text: "레고처럼 조합", size: "md" },
            motion: { preset: "fadeUp", enterAt: 220, duration: 18 } },
        ],
      },
    ],
  }],
};
scenes[34].phase = "B";
scenes[34].hero_frame_ms = 8000;

// ──────────────────────────────────────────────────────────────
// scene-35 — 이미 재설계 완료. phase/hero_frame_ms 만 추가.
// ──────────────────────────────────────────────────────────────
scenes[35].phase = "B";
scenes[35].hero_frame_ms = 7500;

// ──────────────────────────────────────────────────────────────
// scene-36 — 로컬 무료/오프라인 + 기밀 분석 (271f, 9.0s)
// ──────────────────────────────────────────────────────────────
scenes[36].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "로컬 실행 · 새 가능성" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 72, maxWidth: 1400, variant: "vs" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 18, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "laptop-line", size: 140, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "CheckMark", data: { label: "무료", variant: "accent" },
                motion: { preset: "fadeUp", enterAt: 30, duration: 14 } },
              { type: "CheckMark", data: { label: "오프라인 구동", variant: "accent" },
                motion: { preset: "fadeUp", enterAt: 63, duration: 14 } },
              { type: "CheckMark", data: { label: "개인 소유", variant: "accent" },
                motion: { preset: "fadeUp", enterAt: 102, duration: 14 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 18, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "lock-line", size: 140, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 183, duration: 22 } },
              { type: "Headline", data: { text: "회사 기밀 분석", size: "md" },
                motion: { preset: "fadeUp", enterAt: 207, duration: 18 } },
              { type: "BodyText", data: { text: "외부 전송 없이 내부 처리" },
                motion: { preset: "fadeUp", enterAt: 225, duration: 18 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "내 컴퓨터 안에서 모두 처리" },
        motion: { preset: "fadeUp", enterAt: 240, duration: 20 } },
    ],
  }],
};
scenes[36].phase = "B";
scenes[36].hero_frame_ms = 7800;

// ──────────────────────────────────────────────────────────────
// scene-37 — 보안 고민 + 구독료 부담 + 1인 사업자 타겟 (313f, 10.4s)
// ──────────────────────────────────────────────────────────────
scenes[37].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center", justify: "center" },
    children: [
      { type: "Kicker", data: { text: "두 가지 현실 고민" } },
      {
        type: "Grid",
        layout: { columns: 2, gap: 64, maxWidth: 1400 },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "cloud-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "외부 서버 찜찜", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 18 } },
              { type: "BodyText", data: { text: "기밀 문서 전송 거부감" },
                motion: { preset: "fadeUp", enterAt: 42, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "coin-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 78, duration: 22 } },
              { type: "Headline", data: { text: "매달 구독료 부담", size: "md" },
                motion: { preset: "fadeUp", enterAt: 102, duration: 18 } },
              { type: "BodyText", data: { text: "1인 사업자 누적 지출" },
                motion: { preset: "fadeUp", enterAt: 120, duration: 15 } },
            ],
          },
        ],
      },
      {
        type: "Stack",
        layout: { direction: "row", gap: 20, align: "center", justify: "center" },
        children: [
          { type: "SvgAsset", data: { asset_id: "target-line", size: 60, drawMode: true, tint: "accent" },
            motion: { preset: "scaleIn", enterAt: 156, duration: 15 } },
          { type: "Headline", data: { text: "로컬 AI가 풀어줄 영역", size: "md" },
            motion: { preset: "fadeUp", enterAt: 163, duration: 20 } },
        ],
      },
      { type: "FooterCaption", data: { text: "의미 있는 변화의 시작점" },
        motion: { preset: "fadeUp", enterAt: 249, duration: 20 } },
    ],
  }],
};
scenes[37].phase = "B";
scenes[37].hero_frame_ms = 8500;

fs.writeFileSync(FILE, JSON.stringify(scenes, null, 2));
console.log("✓ scene-28~37 재설계 완료 (9씬 수정, 1씬 메타만 업데이트)");
console.log("  scenes:", scenes.length, "· with stack_root:", scenes.filter(s=>s.stack_root).length);
for (const i of [28,29,30,31,32,33,34,35,36,37]) {
  const s = scenes[i];
  console.log("  scene-" + i, "phase:" + s.phase, "hero_frame_ms:" + s.hero_frame_ms);
}
