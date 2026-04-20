#!/usr/bin/env node
// _redesign-38-47-batch2.mjs — scene-38~47 2차 배치 재설계 (수동 authoring)
// 10개 씬 각각 고유 stack_root. pattern builder 함수 없음. narration 직접 반영.
// 1차 배치와 shape 중복 회피 (shape 09ef663d/25691e5b 주의).

import fs from "node:fs";

const FILE = "data/vibe-news-0407/scenes-v2.json";
const scenes = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ──────────────────────────────────────────────────────────────
// scene-38 — 완전 대체 어려움, 80~90% 로컬 전략 (333f, 11.1s)
// ──────────────────────────────────────────────────────────────
scenes[38].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "현실적 전략 분배" } },
      {
        type: "Split",
        layout: { ratio: [4, 1], gap: 72, maxWidth: 1500, variant: "gap" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "ImpactStat", data: { value: "80~90", suffix: "%", label: "로컬 처리", size: "xl" },
                motion: { preset: "popNumber", enterAt: 0, duration: 24 } },
              { type: "ProgressBar", data: { value: 85, label: "개인 AI 커버리지" },
                motion: { preset: "fadeUp", enterAt: 57, duration: 24 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 12, align: "center" },
            children: [
              { type: "ImpactStat", data: { value: "10~20", suffix: "%", label: "유료 클라우드", size: "sm" },
                motion: { preset: "popNumber", enterAt: 153, duration: 20 } },
              { type: "Badge", data: { text: "특수 케이스" },
                motion: { preset: "fadeUp", enterAt: 180, duration: 14 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "완전 대체 아닌 지능적 분배" },
        motion: { preset: "fadeUp", enterAt: 273, duration: 20 } },
    ],
  }],
};
scenes[38].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-39 — 뉴스1 토큰 이슈 + 뉴스3 울트라 플랜 브릿지 (369f, 12.3s)
// ──────────────────────────────────────────────────────────────
scenes[39].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "뉴스 1 ↔ 뉴스 3 연결고리" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1360, gap: 28, padding: "36px 48px" },
        data: { variant: "border-accent" },
        children: [
          { type: "Headline", data: { text: "클로드 코드 울트라 플랜", size: "md" },
            motion: { preset: "fadeUp", enterAt: 120, duration: 20 } },
          {
            type: "Stack",
            layout: { direction: "row", gap: 36, align: "center", justify: "center" },
            children: [
              { type: "Stack",
                layout: { direction: "column", gap: 10, align: "center" },
                children: [
                  { type: "SvgAsset", data: { asset_id: "cloud-line", size: 110, drawMode: true, tint: "accent" },
                    motion: { preset: "scaleIn", enterAt: 189, duration: 22 } },
                  { type: "BodyText", data: { text: "기획 = 클라우드" },
                    motion: { preset: "fadeUp", enterAt: 210, duration: 15 } },
                ] },
              { type: "SvgAsset", data: { asset_id: "arrow-right-line", size: 60, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 230, duration: 12 } },
              { type: "Stack",
                layout: { direction: "column", gap: 10, align: "center" },
                children: [
                  { type: "SvgAsset", data: { asset_id: "laptop-line", size: 110, drawMode: true, tint: "accent" },
                    motion: { preset: "scaleIn", enterAt: 270, duration: 22 } },
                  { type: "BodyText", data: { text: "실행 = 내 컴퓨터" },
                    motion: { preset: "fadeUp", enterAt: 291, duration: 15 } },
                ] },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "토큰 소진 걱정 없이 새 선택지" },
        motion: { preset: "fadeUp", enterAt: 330, duration: 20 } },
    ],
  }],
};
scenes[39].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-40 — 클라우드 AI 반격 + ultraplan 소개 (263f, 8.8s)
// ──────────────────────────────────────────────────────────────
scenes[40].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1400, align: "center" },
    children: [
      { type: "Kicker", data: { text: "클라우드 AI 신기능" } },
      {
        type: "Stack",
        layout: { direction: "row", gap: 56, align: "center", justify: "center" },
        children: [
          { type: "DevIcon", data: { name: "ClaudeAI", size: 170 },
            motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
          { type: "SvgAsset", data: { asset_id: "spark-line", size: 90, drawMode: true, tint: "accent" },
            motion: { preset: "scaleIn", enterAt: 48, duration: 20 } },
        ],
      },
      { type: "Headline", data: { text: "/ultraplan", size: "xl" },
        motion: { preset: "fadeUp", enterAt: 100, duration: 22 } },
      { type: "FooterCaption", data: { text: "개념은 간단하고 실용적" },
        motion: { preset: "fadeUp", enterAt: 210, duration: 20 } },
    ],
  }],
};
scenes[40].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-41 — 기존 방식: 터미널 기획 (261f, 8.7s)
// ──────────────────────────────────────────────────────────────
scenes[41].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1400, align: "center" },
    children: [
      { type: "Kicker", data: { text: "기존 작업 방식" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1200, gap: 16, padding: "36px 48px" },
        data: { variant: "filled-muted" },
        children: [
          {
            type: "Stack",
            layout: { direction: "row", gap: 20, align: "center", justify: "start" },
            children: [
              { type: "SvgAsset", data: { asset_id: "terminal-line", size: 60, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 16 } },
              { type: "Headline", data: { text: "터미널에서 기획 요청", size: "md" },
                motion: { preset: "fadeUp", enterAt: 20, duration: 18 } },
            ],
          },
          { type: "BodyText", data: { text: "\"이 프로젝트 어떻게 만들면 좋을까?\"" },
            motion: { preset: "fadeUp", enterAt: 51, duration: 18 } },
        ],
      },
      { type: "FooterCaption", data: { text: "AI 가 터미널에서 직접 기획 수행" },
        motion: { preset: "fadeUp", enterAt: 186, duration: 20 } },
    ],
  }],
};
scenes[41].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-42 — 대기 시간 문제 → 클라우드 전환 (270f, 9.0s)
// ──────────────────────────────────────────────────────────────
scenes[42].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "문제점 → 해결책" } },
      {
        type: "Split",
        layout: { ratio: [1, 1], gap: 80, maxWidth: 1500, variant: "arrow" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "hourglass-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "대기 시간 발생", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 18 } },
              { type: "BodyText", data: { text: "터미널 사용 불가" },
                motion: { preset: "fadeUp", enterAt: 78, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "cloud-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 150, duration: 22 } },
              { type: "Headline", data: { text: "추론을 클라우드로", size: "md" },
                motion: { preset: "fadeUp", enterAt: 189, duration: 18 } },
              { type: "BodyText", data: { text: "울트라 플랜 전략" },
                motion: { preset: "fadeUp", enterAt: 207, duration: 15 } },
            ],
          },
        ],
      },
    ],
  }],
};
scenes[42].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-43 — /ultraplan 명령어 + 예시 프롬프트 (345f, 11.5s)
// ──────────────────────────────────────────────────────────────
scenes[43].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "명령어 사용 예시" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1320, gap: 20, padding: "40px 56px" },
        data: { variant: "border-accent" },
        children: [
          {
            type: "Stack", layout: { direction: "row", gap: 24, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "terminal-line", size: 80, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 18 } },
              { type: "Headline", data: { text: "/ultraplan", size: "md" },
                motion: { preset: "fadeUp", enterAt: 30, duration: 18 } },
            ],
          },
          { type: "BodyText", data: { text: "인증 시스템을 세션 방식에서 JWT 로 바꿔줘" },
            motion: { preset: "fadeUp", enterAt: 150, duration: 22 } },
        ],
      },
      {
        type: "Stack",
        layout: { direction: "row", gap: 20, align: "center", justify: "center" },
        children: [
          { type: "SvgAsset", data: { asset_id: "arrow-right-line", size: 60, drawMode: true, tint: "accent" },
            motion: { preset: "scaleIn", enterAt: 252, duration: 14 } },
          { type: "Headline", data: { text: "터미널 즉시 해방", size: "md" },
            motion: { preset: "fadeUp", enterAt: 265, duration: 18 } },
        ],
      },
      { type: "FooterCaption", data: { text: "작업 중단 없이 AI 가 병렬 진행" },
        motion: { preset: "fadeUp", enterAt: 310, duration: 20 } },
    ],
  }],
};
scenes[43].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-44 — AI 클라우드 병렬 작업 플로우 (255f, 8.5s)
// ──────────────────────────────────────────────────────────────
scenes[44].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 40, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "클라우드 AI 병렬 작업" } },
      {
        type: "FlowDiagram",
        data: {
          steps: [
            { label: "프로젝트 파악", icon: "eye-line" },
            { label: "파일 관계 정리", icon: "network-nodes-line" },
            { label: "실행 순서 설계", icon: "branching-line" },
          ],
          variant: "box-chain",
        },
        layout: { maxWidth: 1400 },
        motion: { preset: "fadeUp", enterAt: 0, duration: 24 },
      },
      { type: "FooterCaption", data: { text: "예외 상황까지 세부 검토" },
        motion: { preset: "fadeUp", enterAt: 186, duration: 20 } },
    ],
  }],
};
scenes[44].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-45 — Opus 4.6 30분 면밀 기획 (384f, 12.8s)
// ──────────────────────────────────────────────────────────────
scenes[45].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "전담 AI 사양" } },
      {
        type: "Split",
        layout: { ratio: [3, 5], gap: 72, maxWidth: 1500, variant: "line" },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 16, align: "center" },
            children: [
              { type: "ImpactStat", data: { value: "30", suffix: "분", label: "면밀 기획", size: "xl" },
                motion: { preset: "popNumber", enterAt: 0, duration: 24 } },
              { type: "Badge", data: { text: "집중 작업" },
                motion: { preset: "fadeUp", enterAt: 84, duration: 14 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "start" },
            children: [
              { type: "Headline", data: { text: "Opus 4.6 최상급 AI 전담", size: "md" },
                motion: { preset: "fadeUp", enterAt: 132, duration: 20 } },
              { type: "BulletList",
                data: { items: ["클라우드 전담 작업", "터미널 자유", "웹 리서치 분리"], variant: "check" },
                motion: { preset: "fadeUp", enterAt: 258, duration: 22 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "두 기능 완전 분리된 작업 구조" },
        motion: { preset: "fadeUp", enterAt: 330, duration: 20 } },
    ],
  }],
};
scenes[45].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-46 — 터미널 + 웹 병렬 사용 (297f, 9.9s)
// ──────────────────────────────────────────────────────────────
scenes[46].stack_root = {
  type: "SceneRoot",
  layout: { gap: 36, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 36, maxWidth: 1500, align: "center" },
    children: [
      { type: "Kicker", data: { text: "작업 병행 구조" } },
      {
        type: "Grid",
        layout: { columns: 2, gap: 56, maxWidth: 1400 },
        children: [
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "terminal-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 22 } },
              { type: "Headline", data: { text: "터미널 계속 작동", size: "md" },
                motion: { preset: "fadeUp", enterAt: 24, duration: 18 } },
              { type: "BodyText", data: { text: "기존 작업 중단 없음" },
                motion: { preset: "fadeUp", enterAt: 51, duration: 15 } },
            ],
          },
          {
            type: "Stack", layout: { direction: "column", gap: 14, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "globe-line", size: 130, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 126, duration: 22 } },
              { type: "Headline", data: { text: "웹에서 리서치", size: "md" },
                motion: { preset: "fadeUp", enterAt: 180, duration: 18 } },
              { type: "BodyText", data: { text: "기획서 브라우저 오픈" },
                motion: { preset: "fadeUp", enterAt: 207, duration: 15 } },
            ],
          },
        ],
      },
      { type: "FooterCaption", data: { text: "완성된 기획서 브라우저 자동 표시" },
        motion: { preset: "fadeUp", enterAt: 249, duration: 20 } },
    ],
  }],
};
scenes[46].phase = "B";

// ──────────────────────────────────────────────────────────────
// scene-47 — 기획서 부분 코멘트 기능 (210f, 7.0s)
// ──────────────────────────────────────────────────────────────
scenes[47].stack_root = {
  type: "SceneRoot",
  layout: { gap: 32, padding: "60px 120px 160px", align: "center", justify: "center" },
  children: [{
    type: "Stack",
    layout: { direction: "column", gap: 32, maxWidth: 1400, align: "center" },
    children: [
      { type: "Kicker", data: { text: "브라우저 인터랙션" } },
      {
        type: "FrameBox",
        layout: { maxWidth: 1200, gap: 16, padding: "28px 40px" },
        data: { variant: "border-accent" },
        children: [
          {
            type: "Stack",
            layout: { direction: "row", gap: 20, align: "center" },
            children: [
              { type: "SvgAsset", data: { asset_id: "hand-line", size: 70, drawMode: true, tint: "accent" },
                motion: { preset: "scaleIn", enterAt: 0, duration: 18 } },
              { type: "Headline", data: { text: "특정 부분 코멘트", size: "md" },
                motion: { preset: "fadeUp", enterAt: 63, duration: 18 } },
            ],
          },
          { type: "BodyText", data: { text: "\"이 부분은 좀 다르게 기획하자\"" },
            motion: { preset: "fadeUp", enterAt: 114, duration: 20 } },
        ],
      },
      { type: "FooterCaption", data: { text: "AI 기획에 대한 세부 지적 가능" },
        motion: { preset: "fadeUp", enterAt: 171, duration: 20 } },
    ],
  }],
};
scenes[47].phase = "B";

fs.writeFileSync(FILE, JSON.stringify(scenes, null, 2));
console.log("✓ scene-38~47 재설계 완료 (10 씬)");
for (const i of [38,39,40,41,42,43,44,45,46,47]) {
  const s = scenes[i];
  console.log("  scene-" + i, "phase:" + s.phase);
}
