// Media Nodes: VideoClip (full-screen B-roll video)
import React from "react";
import { OffthreadVideo, Loop, staticFile, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const VideoClipRenderer: React.FC<NodeProps> = ({ node, frame, durationFrames }) => {
  const d = node.data ?? {};
  const { fps } = useVideoConfig();

  const rawSrc: string | undefined = d.src;
  const src = rawSrc
    ? rawSrc.startsWith("http") ? rawSrc : staticFile(rawSrc)
    : undefined;
  const objectFit: "cover" | "contain" = d.objectFit ?? "cover";
  const loop: boolean = d.loop ?? true;
  const overlay: string | undefined = d.overlay;
  const startFrom: number = d.startFrom ?? 0;
  const playbackRate: number = d.playbackRate ?? 1;

  // Fade-in animation
  const enterAt: number = node.motion?.enterAt ?? 0;
  const fadeDuration: number = node.motion?.duration ?? 15;
  const localFrame = Math.max(0, frame - enterAt);
  const opacity = Math.min(1, localFrame / Math.max(1, fadeDuration));

  // Loop duration: use video's known duration, or scene duration as fallback
  const videoDurationSec: number = d.durationSec ?? 10;
  const loopDurationFrames = Math.max(1, Math.round(videoDurationSec * fps));

  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          flex: 1,
          backgroundColor: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        <span style={{ color: "#666", fontSize: 18, fontFamily: "sans-serif" }}>
          비디오 없음
        </span>
      </div>
    );
  }

  const videoElement = (
    <OffthreadVideo
      src={src}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit,
      }}
      volume={0}
      startFrom={startFrom}
      playbackRate={playbackRate}
    />
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        flex: 1,
        opacity,
        overflow: "hidden",
      }}
    >
      {loop ? (
        <Loop durationInFrames={loopDurationFrames}>
          {videoElement}
        </Loop>
      ) : (
        videoElement
      )}
      {overlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: overlay,
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
};
