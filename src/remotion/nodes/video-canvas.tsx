// VideoCanvas — 전체 화면 비디오 + Ken Burns / zoom-to / pan-to 키프레임 보간
//
// ImageCanvas 의 영상 버전. inner box 의 종횡비를 비디오 종횡비와 일치시켜
// object-fit 크롭이 발생하지 않으므로 커서 좌표가 수학적으로 정확히 비디오 좌표와 일치한다.
//
// data.startFrom: 원본 비디오의 재생 시작 지점(ms). OffthreadVideo 는 frame 단위를
// 받으므로 fps 로 변환한다.
// data.muted: 기본 true. segment.keepOriginalAudio === true 일 때만 false.
import React from "react";
import { OffthreadVideo, staticFile, interpolate, Easing, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { computeImageRect } from "../common/image-rect";

interface Keyframe {
  frame: number;
  /** 0~1 정규화된 포커스 좌표 (비디오 중심점) */
  x: number;
  y: number;
  scale: number;
}

export const VideoCanvasRenderer: React.FC<NodeProps> = ({
  node,
  frame,
  durationFrames,
}) => {
  const { width: compW, height: compH, fps } = useVideoConfig();
  const d = node.data ?? {};
  const rawSrc: string | undefined = d.src;
  if (!rawSrc) return null;
  const src = rawSrc.startsWith("http") ? rawSrc : staticFile(rawSrc);

  // mediaAspect = videoWidth / videoHeight. imageAspect 는 구 이름 fallback.
  const mediaAspect: number = d.mediaAspect ?? d.imageAspect ?? 16 / 9;

  // 기본 keyframes — 없으면 약한 Ken Burns
  const keyframes: Keyframe[] =
    Array.isArray(d.keyframes) && d.keyframes.length >= 2
      ? d.keyframes
      : [
          { frame: 0, x: 0.5, y: 0.5, scale: 1.0 },
          { frame: durationFrames, x: 0.5, y: 0.5, scale: 1.04 },
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

  // 비디오 종횡비에 딱 맞춘 inner box — 크롭 없음
  const { innerW, innerH, offsetX, offsetY } = computeImageRect(
    compW,
    compH,
    mediaAspect,
    basePadding
  );

  // 비디오 종횡비와 박스 종횡비가 일치하므로 선형 매핑.
  const translateX = (0.5 - x) * 100;
  const translateY = (0.5 - y) * 100;

  const outerBg: string =
    d.outerBg ??
    (frame3d
      ? "radial-gradient(ellipse at center, #0f0f14 0%, #05060a 100%)"
      : "#000000");

  // OffthreadVideo.startFrom 은 frame 단위. segment 의 startFromMs 를 변환.
  const startFromMs: number = d.startFrom ?? 0;
  const startFromFrames = Math.max(0, Math.round((startFromMs * fps) / 1000));
  const muted: boolean = d.muted ?? true;
  const playbackRate: number = d.playbackRate ?? 1;

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
          background: "#000000",
        }}
      >
        <OffthreadVideo
          src={src}
          startFrom={startFromFrames}
          playbackRate={playbackRate}
          volume={muted ? 0 : 1}
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
