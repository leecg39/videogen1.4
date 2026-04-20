import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { T } from "./theme";
import type { CaptionMode } from "@/types";

interface SubtitleEntry {
  startTime: number; // seconds
  endTime: number;
  text: string;
}

interface SubtitleBarProps {
  text?: string;
  subtitles?: SubtitleEntry[];
  frame: number;
  /** Scene의 시작 시간(초) — 자막 타이밍을 씬 내 상대 프레임으로 변환 */
  sceneStartSec?: number;
  /** 자막 표시 모드 */
  mode?: CaptionMode;
}

/** 텍스트에서 첫 2-4글자 키워드 추출 */
function extractKeyword(text: string): string {
  const firstWord = text.trim().split(/\s+/)[0] ?? "";
  if (firstWord.length <= 4) return firstWord;
  return firstWord.slice(0, 4);
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({
  text,
  subtitles,
  frame,
  sceneStartSec = 0,
  mode = "bottom-bar",
}) => {
  const { fps } = useVideoConfig();

  if (mode === "inline" || mode === "none") return null;

  // subtitles의 startTime이 씬 내 상대 시간(0부터)이면 sceneStartSec 불필요
  // 절대 시간이면 sceneStartSec 필요 → 자막 데이터가 상대 시간인지 확인 후 결정
  const firstSubStart = subtitles?.[0]?.startTime ?? 0;
  const isRelative = firstSubStart < sceneStartSec * 0.5; // 첫 자막이 씬 시작보다 훨씬 작으면 상대 시간
  const currentTimeSec = isRelative ? frame / fps : sceneStartSec + frame / fps;

  // 시간 기반 자막: 현재 시간에 맞는 자막 찾기
  let displayText = "";
  if (subtitles && subtitles.length > 0) {
    const active = subtitles.find(
      (s) => currentTimeSec >= s.startTime && currentTimeSec < s.endTime,
    );
    displayText = active?.text ?? "";
  } else if (text) {
    displayText = text;
  }

  if (!displayText) return null;

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- punch-word 모드 ---
  if (mode === "punch-word") {
    const keyword = extractKeyword(displayText);
    if (!keyword) return null;
    const punchOpacity = interpolate(frame, [0, 5, 20, 25], [0, 0.6, 0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        data-testid="subtitle-bar"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: T.textPrimary,
            fontFamily: T.font,
            fontSize: 120,
            fontWeight: 900,
            opacity: punchOpacity,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {keyword}
        </span>
      </div>
    );
  }

  // --- side-caption 모드 ---
  if (mode === "side-caption") {
    return (
      <div
        data-testid="subtitle-bar"
        style={{
          position: "absolute",
          left: 40,
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 300,
          zIndex: 10,
          padding: "16px 20px",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 12,
          opacity,
        }}
      >
        <span
          style={{
            color: T.textPrimary,
            fontFamily: T.font,
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.5,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {displayText}
        </span>
      </div>
    );
  }

  // --- bottom-bar 모드 (기본값) ---
  return (
    <div
      data-testid="subtitle-bar"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: "40px 80px 50px",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        opacity,
      }}
    >
      <span
        style={{
          color: T.textPrimary,
          fontFamily: T.font,
          fontSize: 42,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 1400,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        {displayText}
      </span>
    </div>
  );
};
