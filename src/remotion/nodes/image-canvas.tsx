// ImageCanvas — 전체 화면 이미지 + Ken Burns / zoom-to / pan-to 키프레임 보간
//
// inner box 의 종횡비를 이미지 종횡비와 일치시켜 object-fit 크롭이 발생하지 않는다.
// → 커서 좌표가 수학적으로 정확히 이미지 좌표와 일치한다.
import React from "react";
import { staticFile, interpolate, Easing, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { computeImageRect } from "../common/image-rect";

interface Keyframe {
  frame: number;
  /** 0~1 정규화된 포커스 좌표 (이미지 중심점) */
  x: number;
  y: number;
  scale: number;
}

export const ImageCanvasRenderer: React.FC<NodeProps> = ({
  node,
  frame,
  durationFrames,
}) => {
  const { width: compW, height: compH } = useVideoConfig();
  const d = node.data ?? {};
  const rawSrc: string | undefined = d.src;
  if (!rawSrc) return null;
  const src = rawSrc.startsWith("http") ? rawSrc : staticFile(rawSrc);
  const imageAspect: number = d.imageAspect ?? 16 / 9;

  // 기본 keyframes — 없으면 약한 Ken Burns
  const keyframes: Keyframe[] =
    Array.isArray(d.keyframes) && d.keyframes.length >= 2
      ? d.keyframes
      : [
          { frame: 0, x: 0.5, y: 0.5, scale: 1.02 },
          { frame: durationFrames, x: 0.5, y: 0.5, scale: 1.1 },
        ];

  const frames = keyframes.map((k) => k.frame);
  const xs = keyframes.map((k) => k.x);
  const ys = keyframes.map((k) => k.y);
  const scales = keyframes.map((k) => k.scale);

  const easing = Easing.bezier(0.2, 0.6, 0.2, 1);
  const x = interpolate(frame, frames, xs, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  const y = interpolate(frame, frames, ys, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  const scale = interpolate(frame, frames, scales, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

  const frame3d = d.frame3d !== false;
  const radius = d.radius ?? (frame3d ? 24 : 0);
  const basePadding: number = d.basePadding ?? (frame3d ? 48 : 0);

  // 이미지 종횡비에 딱 맞춘 inner box — 크롭 없음
  const { innerW, innerH, offsetX, offsetY } = computeImageRect(
    compW,
    compH,
    imageAspect,
    basePadding
  );

  // 이미지 종횡비와 박스 종횡비가 일치하므로 선형 매핑. 포커스 (x,y) 를 중앙으로 보내는 translate.
  const translateX = (0.5 - x) * 100;
  const translateY = (0.5 - y) * 100;

  const outerBg: string =
    d.outerBg ??
    (frame3d
      ? "radial-gradient(ellipse at center, #0f0f14 0%, #05060a 100%)"
      : "#000000");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: outerBg,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: innerW,
          height: innerH,
          borderRadius: radius,
          overflow: "hidden",
          boxShadow: frame3d
            ? "0 50px 100px rgba(0,0,0,0.55), 0 20px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)"
            : "none",
          background: "#ffffff",
        }}
      >
        <img
          src={src}
          alt={d.alt ?? ""}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
};
