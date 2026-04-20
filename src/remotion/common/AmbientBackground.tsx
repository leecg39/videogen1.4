// AmbientBackground — 씬 배경이 없을 때 텍스처 깊이감을 제공하는 순수 CSS 레이어
// Video Design OS v1: 4 프리셋 (noise-glow, paper, film-grain, gradient-mesh)

import React from "react";
import { interpolate, Easing } from "remotion";
import type { AmbientConfig } from "./theme";

interface AmbientBackgroundProps {
  config: AmbientConfig;
  accentColor: string;
  frame: number;
  durationFrames: number;
}

const FILL: React.CSSProperties = { position: "absolute", inset: 0 };

// SVG feTurbulence 기반 노이즈 텍스처 (inline data URI, 캐싱)
const noiseCache = new Map<string, string>();
function noiseDataUri(baseFreq: number, octaves: number, opacity: number, seed = 0): string {
  const key = `${baseFreq}-${octaves}-${opacity}-${seed}`;
  const cached = noiseCache.get(key);
  if (cached) return cached;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${baseFreq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/></filter><rect width='400' height='400' filter='url(%23n)' opacity='${opacity}'/></svg>`;
  const result = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  noiseCache.set(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Preset: noise-glow (dark-neon)
// ---------------------------------------------------------------------------
function NoiseGlow({
  config, accentColor, frame, durationFrames,
}: AmbientBackgroundProps): React.ReactElement {
  // 글로우 블룸 위치가 미세하게 흔들림
  const breathe = interpolate(frame, [0, durationFrames], [0, Math.PI * 2], {
    extrapolateRight: "clamp",
  });
  const cx1 = 30 + Math.sin(breathe) * 5;
  const cy1 = 40 + Math.cos(breathe) * 3;
  const cx2 = 70 + Math.cos(breathe * 0.7) * 4;
  const cy2 = 60 + Math.sin(breathe * 0.7) * 3;

  return (
    <>
      {/* Glow bloom 1 */}
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at ${cx1}% ${cy1}%, ${config.tintColor}30 0%, transparent 55%)`,
      }} />
      {/* Glow bloom 2 (보색 시프트) */}
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at ${cx2}% ${cy2}%, ${accentColor}22 0%, transparent 50%)`,
      }} />
      {/* Noise grain */}
      {config.grain && (
        <div style={{
          ...FILL,
          backgroundImage: noiseDataUri(0.85, 4, config.grainIntensity, frame % 3),
          backgroundSize: "400px 400px",
          opacity: config.opacity,
          mixBlendMode: "overlay",
        }} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Preset: paper (editorial)
// ---------------------------------------------------------------------------
function Paper({
  config,
}: AmbientBackgroundProps): React.ReactElement {
  return (
    <>
      {/* 따뜻한 종이 그라데이션 */}
      <div style={{
        ...FILL,
        background: `linear-gradient(175deg, ${config.tintColor}15 0%, ${config.tintColor}08 50%, transparent 100%)`,
      }} />
      {/* 미세 텍스처 */}
      {config.grain && (
        <div style={{
          ...FILL,
          backgroundImage: noiseDataUri(0.65, 3, config.grainIntensity),
          backgroundSize: "400px 400px",
          opacity: config.opacity,
          mixBlendMode: "multiply",
        }} />
      )}
      {/* 비네팅 */}
      <div style={{
        ...FILL,
        background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.06) 100%)",
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Preset: film-grain (documentary)
// ---------------------------------------------------------------------------
function FilmGrain({
  config, frame,
}: AmbientBackgroundProps): React.ReactElement {
  // frame%3으로 시드 순환 → 애니메이티드 그레인 효과
  const seed = frame % 3;
  return (
    <>
      {/* 따뜻한 앰버 오버레이 */}
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at 50% 45%, ${config.tintColor}0D 0%, transparent 65%)`,
      }} />
      {/* 강한 필름 그레인 */}
      {config.grain && (
        <div style={{
          ...FILL,
          backgroundImage: noiseDataUri(0.9, 4, config.grainIntensity, seed),
          backgroundSize: "400px 400px",
          opacity: config.opacity,
          mixBlendMode: "overlay",
        }} />
      )}
      {/* 영화적 비네팅 (더 강하게) */}
      <div style={{
        ...FILL,
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.15) 100%)",
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Preset: gradient-mesh (clean-enterprise)
// ---------------------------------------------------------------------------
function GradientMesh({
  config, accentColor, frame, durationFrames,
}: AmbientBackgroundProps): React.ReactElement {
  const t = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  // 부드럽게 이동하는 3개 메시 포인트
  const p1x = 25 + t * 10;
  const p1y = 30 + t * 8;
  const p2x = 65 - t * 8;
  const p2y = 55 + t * 5;
  const p3x = 50 + Math.sin(t * Math.PI) * 12;
  const p3y = 75 - t * 10;

  return (
    <>
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at ${p1x}% ${p1y}%, ${config.tintColor}0A 0%, transparent 45%)`,
      }} />
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at ${p2x}% ${p2y}%, ${accentColor}08 0%, transparent 40%)`,
      }} />
      <div style={{
        ...FILL,
        background: `radial-gradient(ellipse at ${p3x}% ${p3y}%, ${config.tintColor}06 0%, transparent 50%)`,
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const AmbientBackground: React.FC<AmbientBackgroundProps> = (props) => {
  if (props.config.preset === "none") return null;

  const fadeIn = interpolate(props.frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeIn, pointerEvents: "none" }}>
      {props.config.preset === "noise-glow" && <NoiseGlow {...props} />}
      {props.config.preset === "paper" && <Paper {...props} />}
      {props.config.preset === "film-grain" && <FilmGrain {...props} />}
      {props.config.preset === "gradient-mesh" && <GradientMesh {...props} />}
    </div>
  );
};
