// freeform.tsx — Artifacts 급 자유도를 위한 프리미티브
//
// FreeText: 프리셋 없는 순수 스타일 텍스트. data.text + style 전체 허용.
// Absolute: 자식이 style.left/top/right/bottom/width/height/transform 로 자유 배치되는
//           relative 컨테이너. overlay 보다 더 자유로움.
//
// 사용: 레퍼런스 이미지를 픽셀 단위로 재현해야 할 signature 씬에만.
// 일반 씬은 기존 Kicker/ImpactStat/... 유지.

import React from "react";
import type { NodeProps } from "@/types/stack-nodes";
import { useScenePalette } from "../common/theme";

// ---------------------------------------------------------------------------
// FreeText — 프리셋 없는 텍스트
// ---------------------------------------------------------------------------
// data.text: 문자열
// data.color 또는 data.tone: "accent" | "muted" | "danger" | "warning" | "white" | custom hex
// style 전부 허용 (fontSize, fontWeight, letterSpacing, lineHeight, textAlign, fontFamily...)
// ---------------------------------------------------------------------------

export const FreeTextRenderer: React.FC<NodeProps> = ({ node }) => {
  const P = useScenePalette();
  const d = (node.data ?? {}) as Record<string, any>;
  const s = (node.style ?? {}) as Record<string, any>;

  const tone = d.tone ?? d.color;
  let color: string;
  if (tone === "accent") color = P.accentBright;
  else if (tone === "muted") color = "rgba(255,255,255,0.55)";
  else if (tone === "danger") color = "#FF4444";
  else if (tone === "warning") color = "#FFB020";
  else if (tone === "white") color = "#FFFFFF";
  else if (typeof tone === "string" && tone.startsWith("#")) color = tone;
  else color = s.color ?? "#FFFFFF";

  const text = d.text ?? "";
  const hasExplicitSize = s.width != null || s.height != null;

  // 빈 텍스트 + 명시적 크기 → 블록(solid color bar / tile 용도)
  // background 를 명시하지 않았으면 투명 (spacer 용도). 명시했으면 그 색 사용.
  if (text === "" && hasExplicitSize) {
    return (
      <div
        style={{
          width: s.width as any,
          height: s.height as any,
          background: (s.background as string) ?? "transparent",
          border: (s.border as string) ?? "none",
          borderRadius: (s.borderRadius ?? s.radius) as any ?? 0,
          opacity: (s.opacity as number) ?? 1,
          boxShadow: s.boxShadow as string,
          transform: s.transform as string,
        }}
      />
    );
  }

  const fontFamily = s.fontFamily ?? "'Pretendard Variable', Pretendard, 'Newsreader', 'Space Grotesk', sans-serif";
  const fontSize = s.fontSize ?? 28;
  const fontWeight = s.fontWeight ?? 700;
  const letterSpacing = s.letterSpacing ?? "-0.01em";
  const lineHeight = s.lineHeight ?? 1.1;
  const textAlign = s.textAlign ?? "left";
  const textShadow = s.textShadow ?? "none";
  const background = s.background ?? "transparent";
  const padding = s.padding ?? 0;
  const borderRadius = s.borderRadius ?? s.radius ?? 0;
  const textTransform = s.textTransform;
  const textDecoration = s.textDecoration;
  const opacity = s.opacity ?? 1;
  const transform = s.transform;
  // 기본 whiteSpace 를 nowrap 으로 — absolute positioning 에서 자동 줄바꿈 방지.
  // 줄바꿈 필요 시 style.whiteSpace: "pre-wrap" 또는 명시적 width 지정.
  const whiteSpace = s.whiteSpace ?? "nowrap";

  return (
    <span
      style={{
        display: "inline-block",
        color,
        fontFamily,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight,
        textAlign,
        textShadow,
        background,
        padding,
        borderRadius,
        textTransform,
        textDecoration,
        opacity,
        transform,
        whiteSpace,
        wordBreak: "keep-all",
      }}
    >
      {text}
    </span>
  );
};

// ---------------------------------------------------------------------------
// AbsoluteRenderer — 자식 절대 배치 컨테이너
// ---------------------------------------------------------------------------
// 자식의 style.position 은 자동으로 absolute 가 됨.
// 자식은 style.left/top/right/bottom/width/height/transform 로 자유 배치.
// 컨테이너 자체는 layout.width / layout.height 로 크기 지정 (기본 100%/auto).
//
// 주의: 이 렌더러는 StackRenderer의 CONTAINER_TYPES 에 등록되어
//       StackRenderer 가 containerCSS + children 을 처리한다.
//       여기서는 별도 구현 없음 — registry.ts 에서 placeholder 만 두면 됨.
// ---------------------------------------------------------------------------

// Absolute 는 StackRenderer 가 직접 처리 (CONTAINER_TYPES 확장).
// 이 export 는 registry 자리 채우기용.
export const AbsolutePlaceholder: React.FC<NodeProps> = () => null;
