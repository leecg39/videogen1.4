// SfxAudio — 효과음 wrapper. data: { src, startFrame?, volume? }
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const SfxAudioRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const rawSrc: string | undefined = d.src;
  if (!rawSrc) return null;
  const src = rawSrc.startsWith("http") ? rawSrc : staticFile(rawSrc);
  const startFrame: number = d.startFrame ?? d.from ?? 0;
  const volume: number = d.volume ?? 0.6;

  return (
    <Sequence from={startFrame}>
      <Audio src={src} volume={volume} pauseWhenBuffering />
    </Sequence>
  );
};
