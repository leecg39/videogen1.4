// Cursor — 가상 마우스 커서. path 프레임 보간 + 클릭 ripple.
import React from "react";
import { interpolate, Easing, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { computeImageRect } from "../common/image-rect";

interface CursorPoint {
  frame: number;
  /** 0~1 정규화 좌표 (기본: 스크린 기준, imageKeyframes 있으면: 이미지 기준) */
  x: number;
  y: number;
}

interface ClickEvent {
  frame: number;
}

interface ImageKeyframe {
  frame: number;
  x: number;
  y: number;
  scale: number;
}

export const CursorRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const { width, height } = useVideoConfig();
  const d = node.data ?? {};
  const path: CursorPoint[] = Array.isArray(d.path) ? d.path : [];
  const clicks: ClickEvent[] = Array.isArray(d.clicks) ? d.clicks : [];
  const size: number = d.size ?? 56;
  const imageKeyframes: ImageKeyframe[] = Array.isArray(d.imageKeyframes)
    ? d.imageKeyframes
    : [];
  const imageAspect: number = d.imageAspect ?? 16 / 9;
  const basePadding: number = d.basePadding ?? d.imagePadding ?? 48;

  if (path.length === 0) return null;

  // ImageCanvas 와 동일한 rect 계산 — 반드시 일치해야 커서 좌표가 맞음
  const { innerW, innerH, offsetX, offsetY } = computeImageRect(
    width,
    height,
    imageAspect,
    basePadding
  );

  // 이미지 좌표계 (박스와 1:1 선형) → 박스 정규좌표 + Ken Burns scale 투영
  let screenX = (x: number) => x;
  let screenY = (y: number) => y;
  if (imageKeyframes.length >= 2) {
    const kfFrames = imageKeyframes.map((k) => k.frame);
    const fxs = imageKeyframes.map((k) => k.x);
    const fys = imageKeyframes.map((k) => k.y);
    const scales = imageKeyframes.map((k) => k.scale);
    const imgEase = Easing.bezier(0.2, 0.6, 0.2, 1);
    const fx = interpolate(frame, kfFrames, fxs, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: imgEase,
    });
    const fy = interpolate(frame, kfFrames, fys, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: imgEase,
    });
    const s = interpolate(frame, kfFrames, scales, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: imgEase,
    });
    screenX = (px: number) => 0.5 + (px - fx) * s;
    screenY = (py: number) => 0.5 + (py - fy) * s;
  }

  const frames = path.map((p) => p.frame);
  const xs = path.map((p) => offsetX + screenX(p.x) * innerW);
  const ys = path.map((p) => offsetY + screenY(p.y) * innerH);
  const easing = Easing.bezier(0.4, 0, 0.2, 1);
  const cx =
    path.length === 1
      ? xs[0]
      : interpolate(frame, frames, xs, {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing,
        });
  const cy =
    path.length === 1
      ? ys[0]
      : interpolate(frame, frames, ys, {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing,
        });

  // 클릭 ripple (시각 효과) + 포인터(손가락) 커서 전환 윈도우
  const rippleDuration = 18;
  const activeClick = clicks.find(
    (c) => frame >= c.frame && frame <= c.frame + rippleDuration
  );
  const rippleProgress = activeClick
    ? (frame - activeClick.frame) / rippleDuration
    : null;
  const cursorPulse =
    rippleProgress !== null
      ? 1 - Math.min(1, rippleProgress) * 0.18
      : 1;

  // 클릭 직전 ~ 직후 짧은 구간 동안 pointer (손 모양) 커서 표시
  const POINTER_PRE = 8;
  const POINTER_POST = 14;
  const isPointerMode = clicks.some(
    (c) => frame >= c.frame - POINTER_PRE && frame <= c.frame + POINTER_POST
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {rippleProgress !== null && (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            width: size * 2,
            height: size * 2,
            marginLeft: -size,
            marginTop: -size,
            borderRadius: "50%",
            border: "3px solid rgba(140, 250, 200, 0.9)",
            transform: `scale(${0.4 + rippleProgress * 1.6})`,
            opacity: 1 - rippleProgress,
          }}
        />
      )}
      {isPointerMode ? (
        // 포인터(손가락) 커서 — 클릭 전후
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            transform: `translate(-14px, -2px) scale(${cursorPulse})`,
            filter:
              "drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(140,250,200,0.4))",
          }}
        >
          {/* 집게손가락이 위로 뻗은 포인터 핸드 */}
          <path
            d="M14 3 C13 3 12 4 12 5 L12 14 L11 14 L11 10 C11 9 10 8 9 8 C8 8 7 9 7 10 L7 19 C7 24 10 28 15 28 L18 28 C22 28 25 25 25 21 L25 13 C25 12 24 11 23 11 C22 11 21 12 21 13 L21 16 L20 16 L20 10 C20 9 19 8 18 8 C17 8 16 9 16 10 L16 15 L15 15 L15 5 C15 4 14 3 14 3 Z"
            fill="white"
            stroke="#0a0a0a"
            strokeWidth="1.3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // 기본 화살표 커서
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            transform: `translate(-6px, -4px) scale(${cursorPulse})`,
            filter:
              "drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(140,250,200,0.4))",
          }}
        >
          <path
            d="M5 3 L5 24 L11 19 L14.5 27 L17.5 25.5 L14 17.5 L22 17.5 Z"
            fill="white"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};
