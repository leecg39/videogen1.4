// SceneBackground — 3레이어 배경 시스템 (이미지 + 비디오)
// Layer 0: 배경 이미지/비디오 (블러 + 어둡게 + 스케일 + 패닝 + 비네팅)
// Layer 1: 포커스 하이라이트 (선택적 — 핵심 부분 크롭 확대)
// Layer 2: 출처 라벨 (하단 모서리)

import React from "react";
import { Easing, interpolate, staticFile, OffthreadVideo, Loop, useVideoConfig } from "remotion";
import type { SceneBackground } from "@/types";

interface Props {
  config: SceneBackground;
  frame: number;
  durationFrames: number;
}

function anchorToPosition(
  anchor: string,
  offsetX = 0,
  offsetY = 0,
): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    "top-left": { top: 80 + offsetY, left: 40 + offsetX },
    "top-right": { top: 80 + offsetY, right: 40 - offsetX },
    center: {
      top: "50%",
      left: "50%",
      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
    },
    "bottom-left": { bottom: 180 + offsetY, left: 40 + offsetX },
    "bottom-right": { bottom: 180 + offsetY, right: 40 - offsetX },
  };
  return map[anchor] ?? map["top-right"];
}

// v1.1 round 4 버그6: src 누락 시 검정 fallback 대신 CSS radial gradient 로 대체.
// Phase 5 진단 5-C 참고: background.kind:"image" + src 누락 → 검정 플랫.
const MISSING_SRC_FALLBACK: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(ellipse at 30% 25%, rgba(57, 255, 20, 0.12) 0%, transparent 45%), " +
    "radial-gradient(ellipse at 70% 75%, rgba(124, 77, 255, 0.08) 0%, transparent 50%), " +
    "linear-gradient(180deg, #0a0814 0%, #050307 100%)",
  pointerEvents: "none",
};

export const SceneBackgroundLayer: React.FC<Props> = ({
  config,
  frame,
  durationFrames,
}) => {
  const { fps } = useVideoConfig();

  // v1.1 round 4 버그6: src 누락 시 AmbientBackground 스타일 fallback 렌더.
  // 기존은 staticFile(undefined) 호출로 빈 src 이미지 → 검정 플랫 화면.
  if (!config?.src || typeof config.src !== "string" || config.src.trim() === "") {
    return (
      <div style={MISSING_SRC_FALLBACK} aria-hidden="true" data-fallback="missing-src" />
    );
  }

  // 비디오 여부 판단: 명시적 type 또는 확장자 기반
  const isVideo = config.type === "video" ||
    /\.(mp4|webm|mov)$/i.test(config.src);

  // 비디오/이미지별 기본값 분리
  const {
    src,
    overlayOpacity = isVideo ? 0.6 : 0.55,
    blur = isVideo ? 4 : 10,
    scale = 1.1,
    pan,
    vignette = isVideo ? 0.6 : 0.5,
    focus,
    sourceLabel,
  } = config;

  // Pan animation
  const panDir = pan?.direction ?? "left";
  const panDist = pan?.distance ?? 30;
  const panOffset = interpolate(frame, [0, durationFrames], [0, panDist], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  let panTransform = "";
  switch (panDir) {
    case "left":
      panTransform = `translateX(${-panOffset}px)`;
      break;
    case "right":
      panTransform = `translateX(${panOffset}px)`;
      break;
    case "up":
      panTransform = `translateY(${-panOffset}px)`;
      break;
    case "down":
      panTransform = `translateY(${panOffset}px)`;
      break;
  }

  // Background fade-in
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Focus layer animation
  let focusOpacity = 0;
  let focusScale = 0.9;
  if (focus?.motion) {
    const enterAt = focus.motion.enterAt ?? 15;
    const dur = focus.motion.duration ?? 20;
    const localFrame = Math.max(0, frame - enterAt);
    focusOpacity = interpolate(localFrame, [0, dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    focusScale = interpolate(localFrame, [0, dur], [0.9, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  } else if (focus) {
    focusOpacity = interpolate(frame, [15, 35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    focusScale = interpolate(frame, [15, 35], [0.9, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Source label fade-in (appears after content)
  const labelOpacity = interpolate(
    frame,
    [Math.min(30, durationFrames * 0.15), Math.min(50, durationFrames * 0.25)],
    [0, 0.85],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const mediaSrc = staticFile(src);
  const focusGlow = focus?.glowColor ?? "rgba(57, 255, 20, 0.5)";

  // 비디오 루프 설정
  const videoLoop = config.loop !== false;
  const videoStartFrom = Math.round((config.startFrom ?? 0) * fps);
  const videoPlaybackRate = config.playbackRate ?? 0.7;
  const videoDurationSec = config.durationSec ?? 15;
  const loopDurationFrames = Math.max(1, Math.round(videoDurationSec * fps));

  const mediaStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: `${scale * 100}%`,
    height: `${scale * 100}%`,
    objectFit: "cover" as const,
    transform: `translate(-50%, -50%) ${panTransform}`,
    filter: `blur(${blur}px)`,
    willChange: "transform, filter",
  };

  return (
    <>
      {/* ── Layer 0: 배경 이미지/비디오 ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          opacity: bgOpacity,
        }}
      >
        {/* 미디어: 비디오 또는 이미지 */}
        {isVideo ? (
          videoLoop ? (
            <Loop durationInFrames={loopDurationFrames}>
              <OffthreadVideo
                src={mediaSrc}
                style={mediaStyle}
                volume={0}
                startFrom={videoStartFrom}
                playbackRate={videoPlaybackRate}
              />
            </Loop>
          ) : (
            <OffthreadVideo
              src={mediaSrc}
              style={mediaStyle}
              volume={0}
              startFrom={videoStartFrom}
              playbackRate={videoPlaybackRate}
            />
          )
        ) : (
          <img
            src={mediaSrc}
            alt=""
            style={mediaStyle}
          />
        )}

        {/* 어두운 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />

        {/* 비네팅 */}
        {vignette > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, ${vignette}) 100%)`,
            }}
          />
        )}
      </div>

      {/* ── Layer 1: 포커스 하이라이트 ── */}
      {focus && focusOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            ...anchorToPosition(
              focus.anchor,
              focus.offsetX,
              focus.offsetY,
            ),
            width: focus.width ?? 400,
            overflow: "hidden",
            borderRadius: focus.radius ?? 12,
            border: `2px solid ${focusGlow}`,
            boxShadow: `0 0 20px ${focusGlow}, 0 0 40px ${focusGlow}40`,
            opacity: focusOpacity,
            transform: `scale(${focusScale})`,
            zIndex: 2,
          }}
        >
          <img
            src={mediaSrc}
            alt=""
            style={{
              width: "100%",
              display: "block",
              objectFit: "cover",
              objectPosition: `${focus.crop.x + focus.crop.width / 2}% ${focus.crop.y + focus.crop.height / 2}%`,
            }}
          />
        </div>
      )}

      {/* ── Layer 2: 출처 라벨 ── */}
      {sourceLabel && labelOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 170,
            ...(sourceLabel.position === "bottom-right"
              ? { right: 40 }
              : { left: 40 }),
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 20,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            opacity: labelOpacity,
            zIndex: 8,
          }}
        >
          {sourceLabel.icon && (
            <img
              src={staticFile(sourceLabel.icon)}
              alt=""
              style={{ width: 18, height: 18, borderRadius: 4 }}
            />
          )}
          <span
            style={{
              fontFamily: "Inter, Pretendard, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.7)",
              letterSpacing: "0.02em",
            }}
          >
            {sourceLabel.text}
          </span>
        </div>
      )}
    </>
  );
};
