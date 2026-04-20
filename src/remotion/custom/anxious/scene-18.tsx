// anxious-18 — "게으름이 아니라 불안이 문제다." (재정리)
// 의도: 거대 대비. 좌 "게으름" 취소 / 우 "불안" 강조. 굵은 대비 타이포.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene18: React.FC<NodeProps> = ({ frame }) => {
  const __bgOp = interpolate(frame, [0, 36], [0, 0.09], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const leftY = interpolate(frame, [0, 24], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const strike = interpolate(frame, [28, 62], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const rightOp = interpolate(frame, [70, 110], [0, 1], { extrapolateRight: "clamp" });
  const rightY = interpolate(frame, [70, 110], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const glow = interpolate(frame, [100, 150], [0, 0.8], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(57,255,20,0.06) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/artificial-intelligence-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.45) saturate(0.4)" }}
        volume={0}
      />
      <div style={{ position: "absolute", left: "50%", top: 150, transform: "translate(-50%, 0)", fontSize: 17, letterSpacing: "0.5em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        THE RE-FRAME
      </div>

      {/* 좌측: 게으름 (취소) */}
      <div style={{ position: "absolute", left: 140, top: 340, width: 820, opacity: leftOp, transform: `translateY(${leftY}px)` }}>
        <div style={{ fontSize: 18, letterSpacing: "0.35em", color: "rgba(255,255,255,0.45)", marginBottom: 18, fontWeight: 600 }}>NOT THIS ↓</div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ fontSize: 170, fontWeight: 900, color: "rgba(255,255,255,0.38)", letterSpacing: "-0.04em", lineHeight: 0.95 }}>게으름</span>
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: "50%",
            height: 8,
            background: CORAL,
            boxShadow: `0 0 20px ${CORAL}`,
            transform: `scaleX(${strike}) rotate(-5deg)`,
            transformOrigin: "left center",
          }} />
        </div>
        <div style={{ marginTop: 14, fontSize: 22, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
          "이 모델, 오늘따라 일을 안 한다"
        </div>
      </div>

      {/* 우측: 불안 (진실) */}
      <div style={{ position: "absolute", right: 140, top: 300, width: 820, opacity: rightOp, transform: `translateY(${rightY}px)`, textAlign: "right" }}>
        <div style={{ fontSize: 18, letterSpacing: "0.35em", color: MINT, marginBottom: 18, fontWeight: 700 }}>BUT THIS ↓</div>
        <div style={{ fontSize: 220, fontWeight: 900, color: MINT, letterSpacing: "-0.045em", lineHeight: 0.92, textShadow: `0 0 ${glow * 50}px rgba(57,255,20,${glow * 0.6})` }}>
          불안
        </div>
        <div style={{ marginTop: 14, fontSize: 28, color: "rgba(255,255,255,0.85)", fontWeight: 500, letterSpacing: "-0.01em" }}>
          이 모델, 오늘따라 <span style={{ color: MINT, fontWeight: 700 }}>겁을 먹었다</span>.
        </div>
      </div>

      {/* 중앙 연결: 같지 않다 */}
      <div style={{ position: "absolute", left: "50%", top: 690, transform: "translate(-50%, 0)", fontSize: 56, fontWeight: 300, color: "rgba(255,255,255,0.2)", letterSpacing: "-0.02em" }}>
        ≠
      </div>
    </AbsoluteFill>
  );
};
