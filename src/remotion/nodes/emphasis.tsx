// Phase 1: Emphasis Nodes — MarkerHighlight, DualToneText
// 텍스트를 시각 요소로 만드는 강조 노드들
import React from "react";
import { interpolate, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";

// ---------------------------------------------------------------------------
// MarkerHighlight — 형광펜이 좌→우로 그려지는 텍스트 강조
// data: {
//   text: string,
//   highlightColor?: string,
//   highlightOpacity?: number,
//   fontSize?: number,
//   emphasisRange?: [number, number],   // char 인덱스 [start, end) — 특정 구간만 highlight
//   emphasisText?: string,               // 문자열 매칭 — 매칭된 구간만 highlight
// }
// v1.1 round 4 버그4: 다단어 중 일부만 highlight 지원 (Phase 5 진단 5-B).
// 기존은 text 전체에 bar → "핵심 키워드" 강조 불가.
// ---------------------------------------------------------------------------
export const MarkerHighlightRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  // 하이라이트 바 진행률
  const highlightProgress = interpolate(localFrame, [0, dur], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const highlightColor = d.highlightColor ?? P.accent;
  const highlightOpacity = d.highlightOpacity ?? 0.25;
  const fontSize = d.fontSize ?? 48;
  const text: string = d.text ?? "";

  // emphasisRange 우선, 없으면 emphasisText 로 위치 찾기.
  let range: [number, number] | null = null;
  if (Array.isArray(d.emphasisRange) && d.emphasisRange.length === 2) {
    const [s, e] = d.emphasisRange as [number, number];
    if (Number.isFinite(s) && Number.isFinite(e) && s >= 0 && e > s && e <= text.length) {
      range = [s, e];
    }
  } else if (typeof d.emphasisText === "string" && d.emphasisText.length > 0) {
    const idx = text.indexOf(d.emphasisText);
    if (idx >= 0) range = [idx, idx + d.emphasisText.length];
  }

  // range 없으면 기존 동작 (전체 하이라이트)
  if (!range) {
    return (
      <div style={{
        position: "relative",
        display: "inline-block",
        fontFamily: T.font,
        fontSize,
        fontWeight: 700,
        color: T.textPrimary,
        lineHeight: 1.3,
        textAlign: "center",
        ...(node.style as React.CSSProperties),
      }}>
        <div style={{
          position: "absolute",
          bottom: "8%",
          left: 0,
          width: `${highlightProgress}%`,
          height: "35%",
          backgroundColor: highlightColor,
          opacity: highlightOpacity,
          borderRadius: 4,
          transform: "rotate(-1deg)",
          transformOrigin: "left center",
          zIndex: 0,
        }} />
        <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
      </div>
    );
  }

  // range 있음: prefix / highlighted / suffix 3 분할.
  const [rs, re] = range;
  const prefix = text.slice(0, rs);
  const highlighted = text.slice(rs, re);
  const suffix = text.slice(re);

  return (
    <div style={{
      display: "inline-block",
      fontFamily: T.font,
      fontSize,
      fontWeight: 700,
      color: T.textPrimary,
      lineHeight: 1.3,
      textAlign: "center",
      ...(node.style as React.CSSProperties),
    }}>
      <span>{prefix}</span>
      <span style={{
        position: "relative",
        display: "inline-block",
        padding: "0 0.05em",
      }}>
        <span style={{
          position: "absolute",
          bottom: "8%",
          left: 0,
          width: `${highlightProgress}%`,
          height: "35%",
          backgroundColor: highlightColor,
          opacity: highlightOpacity,
          borderRadius: 4,
          transform: "rotate(-1deg)",
          transformOrigin: "left center",
          zIndex: 0,
        }} />
        <span style={{ position: "relative", zIndex: 1 }}>{highlighted}</span>
      </span>
      <span>{suffix}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DualToneText — 핵심 키워드만 크게 + 악센트 색으로 분리된 텍스트
// data: { segments: [{ text, tone?: "accent"|"muted"|"large" }] }
// ---------------------------------------------------------------------------
export const DualToneTextRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const segments: Array<{ text: string; tone?: string }> = d.segments ?? [];
  const baseFontSize = d.fontSize ?? 36;

  return (
    <div style={{
      fontFamily: T.font,
      fontSize: baseFontSize,
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "center",
      color: T.textSecondary,
      ...(node.style as React.CSSProperties),
    }}>
      {segments.map((seg, i) => {
        const isAccent = seg.tone === "accent";
        const isLarge = seg.tone === "large";
        const isMuted = seg.tone === "muted";

        return (
          <span
            key={i}
            style={{
              color: isAccent || isLarge ? P.accentBright : isMuted ? T.textMuted : T.textSecondary,
              fontWeight: isAccent ? 800 : isLarge ? 900 : isMuted ? 400 : 500,
              fontSize: isLarge ? baseFontSize * 1.6 : isAccent ? baseFontSize * 1.15 : baseFontSize,
              display: "inline",
              textShadow: (isAccent || isLarge) ? `0 0 20px ${P.accentGlow}` : "none",
              letterSpacing: isLarge ? "-0.03em" : undefined,
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </div>
  );
};
