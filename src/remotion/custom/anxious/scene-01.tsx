// anxious-01 — "여러분, 혹시 이런 경험 있으십니까."
// 의도: 인트로 훅. 공감 질문으로 시선 맞추기. 여백 많고 느리게.
// 톤 앵커: reference/SC 10 (⚠️ 지금 느끼시는 그 불편함) + SC 33 (질문 던지기) 교집합.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
  Easing,
} from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";
const MUTED = "rgba(255,255,255,0.42)";

export const AnxiousScene01: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  // 배경 비디오 — 아주 은은하게 (dim blur + hue tint)
  const bgOp = interpolate(frame, [0, 40], [0, 0.14], { extrapolateRight: "clamp" });

  // 좌측 세로선 (민트) — 위에서 아래로 "흘러내리듯"
  const lineGrow = spring({
    frame: frame - 2,
    fps,
    config: { damping: 30, stiffness: 80 },
    from: 0,
    to: 1,
  });

  // Kicker — "당신에게 묻습니다"
  const kickerOp = interpolate(frame, [6, 28], [0, 1], { extrapolateRight: "clamp" });
  const kickerY = interpolate(frame, [6, 28], [14, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // "여러분," — 첫 번째 줄 fadeUp (0.4s)
  const l1Op = interpolate(frame, [12, 38], [0, 1], { extrapolateRight: "clamp" });
  const l1Y = interpolate(frame, [12, 38], [24, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 메인 질문 — "혹시 이런 경험 있으십니까?" (0.8s)
  const l2Op = interpolate(frame, [24, 52], [0, 1], { extrapolateRight: "clamp" });
  const l2Y = interpolate(frame, [24, 52], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const l2Scale = interpolate(frame, [24, 52], [0.96, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 커서 깜빡임 — 40f 부터. 30fps 기준 0.5초 주기.
  const cursorOn = frame >= 40 ? (Math.floor((frame - 40) / 15) % 2 === 0 ? 1 : 0) : 0;

  // 우측 상단 "EP.01" indicator
  const epOp = interpolate(frame, [20, 45], [0, 0.7], { extrapolateRight: "clamp" });

  // 하단 부드러운 글로우 (분위기)
  const glowOp = interpolate(frame, [0, 60], [0, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: INK,
        fontFamily: "'Pretendard', 'Space Grotesk', sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* 배경 비디오 */}
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/coding-dark-screen.mp4")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: bgOp,
          filter: "blur(10px) brightness(0.45) saturate(0.7) hue-rotate(260deg)",
        }}
        volume={0}
      />

      {/* 어두운 비네트 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 40% 45%, rgba(8,6,13,0.55) 0%, rgba(8,6,13,0.96) 72%)",
        }}
      />

      {/* 하단 민트 글로우 */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          bottom: -180,
          height: 360,
          background: "radial-gradient(ellipse at center, rgba(57,255,20,0.18) 0%, rgba(8,6,13,0) 70%)",
          opacity: glowOp,
          filter: "blur(40px)",
        }}
      />

      {/* 좌측 세로선 — "질문이 내려온다" */}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 140,
          width: 2,
          height: 800,
          background: `linear-gradient(180deg, ${MINT} 0%, rgba(57,255,20,0) 100%)`,
          boxShadow: `0 0 28px ${MINT}`,
          transform: `scaleY(${lineGrow})`,
          transformOrigin: "top",
          opacity: 0.85,
        }}
      />

      {/* 우상단 EP indicator */}
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 160,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: epOp,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: MINT,
            boxShadow: `0 0 12px ${MINT}`,
          }}
        />
        <span
          style={{
            fontSize: 18,
            letterSpacing: "0.42em",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 500,
          }}
        >
          EP. 01 · ANXIOUS CLAUDE
        </span>
      </div>

      {/* Kicker */}
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 300,
          opacity: kickerOp,
          transform: `translateY(${kickerY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <span
          style={{
            width: 48,
            height: 1,
            background: MINT,
            opacity: 0.8,
          }}
        />
        <span
          style={{
            fontSize: 22,
            letterSpacing: "0.48em",
            color: MINT,
            fontWeight: 600,
          }}
        >
          당신에게 묻습니다
        </span>
      </div>

      {/* Headline L1 — "여러분," */}
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 410,
          opacity: l1Op,
          transform: `translateY(${l1Y}px)`,
          fontSize: 72,
          fontWeight: 300,
          letterSpacing: "-0.01em",
          color: MUTED,
        }}
      >
        여러분<span style={{ color: MINT, fontWeight: 400 }}>,</span>
      </div>

      {/* Headline L2 — 메인 질문 */}
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 520,
          opacity: l2Op,
          transform: `translateY(${l2Y}px) scale(${l2Scale})`,
          transformOrigin: "left center",
          fontSize: 108,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          color: "#fff",
          maxWidth: 1500,
        }}
      >
        혹시 이런 경험<br />
        있으십니까
        <span
          style={{
            color: MINT,
            fontWeight: 700,
            marginLeft: 4,
          }}
        >
          ?
        </span>
        <span
          style={{
            display: "inline-block",
            marginLeft: 14,
            width: 8,
            height: 84,
            background: MINT,
            verticalAlign: "-14px",
            opacity: cursorOn,
            boxShadow: `0 0 18px ${MINT}`,
          }}
        />
      </div>

      {/* 하단 얇은 footer line — 톤 고정용 */}
      <div
        style={{
          position: "absolute",
          left: 220,
          bottom: 240,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(frame, [40, 70], [0, 0.5], { extrapolateRight: "clamp" }),
          fontSize: 16,
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.3)",
          fontWeight: 500,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.35)" }} />
        <span>VIBELABS · PROMPTING SERIES</span>
      </div>
    </AbsoluteFill>
  );
};
