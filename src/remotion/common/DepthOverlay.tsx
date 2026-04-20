// DepthOverlay — 콘텐츠와 배경 사이 깊이감 레이어
// 코너 글로우 + 엣지 비네팅 + 미세 빛 입자 + 대각선 광선
// 3단계 깊이감 시스템: background → ambient → **depth** → content → overlay

import React from "react";
import { interpolate } from "remotion";
import type { ScenePalette } from "./theme";

interface DepthOverlayProps {
  palette: ScenePalette;
  frame: number;
  durationFrames: number;
  /** 깊이감 강도 0~1 (기본 0.6) */
  intensity?: number;
  /** 비네팅 강도 0~1 (기본 0.4) */
  vignetteStrength?: number;
}

const FILL: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

export const DepthOverlay: React.FC<DepthOverlayProps> = ({
  palette,
  frame,
  durationFrames,
  intensity = 0.6,
  vignetteStrength = 0.4,
}) => {
  // 호흡 애니메이션 — 글로우가 미세하게 팽창/수축
  const breathe = interpolate(frame, [0, durationFrames], [0, Math.PI * 4], {
    extrapolateRight: "clamp",
  });
  const pulse = 0.85 + Math.sin(breathe) * 0.15;

  // 느리게 이동하는 빛 입자 좌표 (3개)
  const p1x = 15 + Math.sin(breathe * 0.3) * 8;
  const p1y = 25 + Math.cos(breathe * 0.4) * 6;
  const p2x = 78 + Math.cos(breathe * 0.25) * 6;
  const p2y = 18 + Math.sin(breathe * 0.35) * 5;
  const p3x = 55 + Math.sin(breathe * 0.2) * 10;
  const p3y = 80 + Math.cos(breathe * 0.3) * 4;

  // 대각선 광선 위치 (느리게 이동)
  const beamAngle = -35 + Math.sin(breathe * 0.15) * 3;
  const beamX = 60 + Math.sin(breathe * 0.1) * 15;

  const fadeIn = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...FILL, opacity: fadeIn * intensity }}>
      {/* Layer 1: 비네팅 — 화면 가장자리 어둡게 */}
      <div
        style={{
          ...FILL,
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, transparent 40%, rgba(0,0,0,${vignetteStrength * 0.5}) 100%)`,
        }}
      />

      {/* Layer 2: 코너 글로우 — 좌상단 + 우하단 accent */}
      <div
        style={{
          ...FILL,
          background: `radial-gradient(ellipse 40% 35% at 8% 10%, ${palette.accent}18 0%, transparent 70%)`,
          opacity: pulse,
        }}
      />
      <div
        style={{
          ...FILL,
          background: `radial-gradient(ellipse 35% 30% at 92% 85%, ${palette.accentBright}12 0%, transparent 65%)`,
          opacity: pulse,
        }}
      />

      {/* Layer 3: 미세 빛 입자 — accent 색상 소형 원 */}
      <div
        style={{
          ...FILL,
          background: `radial-gradient(circle 3px at ${p1x}% ${p1y}%, ${palette.accentBright}40 0%, transparent 100%)`,
        }}
      />
      <div
        style={{
          ...FILL,
          background: `radial-gradient(circle 2px at ${p2x}% ${p2y}%, ${palette.accentVivid}30 0%, transparent 100%)`,
        }}
      />
      <div
        style={{
          ...FILL,
          background: `radial-gradient(circle 2.5px at ${p3x}% ${p3y}%, ${palette.accent}25 0%, transparent 100%)`,
        }}
      />

      {/* Layer 4: 대각선 광선 — 미세한 빛 줄기 */}
      <div
        style={{
          ...FILL,
          background: `linear-gradient(${beamAngle}deg, transparent ${beamX - 8}%, ${palette.accentBright}06 ${beamX - 2}%, ${palette.accentBright}0A ${beamX}%, ${palette.accentBright}06 ${beamX + 2}%, transparent ${beamX + 8}%)`,
        }}
      />

      {/* Layer 5: 하단 그라디언트 — 자막 영역 분리 */}
      <div
        style={{
          ...FILL,
          background: `linear-gradient(to top, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 12%, transparent 25%)`,
        }}
      />
    </div>
  );
};
