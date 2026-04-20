// anxious-30 — "예의 = 절반. 진짜 핵심은 따로."
// 의도: 반쯤 채워진 게이지. 예의 50%. 오른쪽 빈 쪽에 "진짜 핵심 ↓" 티저.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene30: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const summaryOp = interpolate(frame, [16, 46], [0, 1], { extrapolateRight: "clamp" });

  const gaugeProgress = interpolate(frame, [40, 120], [0, 0.5], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const gaugeLabelOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });

  const teaserOp = interpolate(frame, [150, 190], [0, 1], { extrapolateRight: "clamp" });
  const teaserY = interpolate(frame, [150, 190], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(57,255,20,0.06) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/benchmark-performance-testing.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.35)" }}
        volume={0}
      />
      {/* 상단 오해 */}
      <div style={{ position: "absolute", left: 160, top: 150, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        <span style={{ width: 38, height: 1, background: "rgba(255,255,255,0.4)" }} />
        THE MISREAD
      </div>

      <div style={{ position: "absolute", left: 160, top: 220, width: 1600, opacity: summaryOp, fontSize: 50, fontWeight: 500, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
        "결국 <span style={{ color: MINT, fontWeight: 800 }}>예의 바르게</span> 쓰라는 거네?"
      </div>

      {/* 큰 50% 게이지 */}
      <div style={{ position: "absolute", left: 160, top: 450, right: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>당신이 들고 가는 것</span>
          <span style={{ fontSize: 18, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>0% · · · 100%</span>
        </div>
        <div style={{ position: "relative", height: 80, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${gaugeProgress * 100}%`, background: `linear-gradient(90deg, rgba(57,255,20,0.3) 0%, ${MINT} 100%)`, boxShadow: `0 0 30px rgba(57,255,20,0.4)` }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "rgba(255,255,255,0.35)" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-110%, -50%)", fontSize: 38, fontWeight: 900, color: MINT, letterSpacing: "-0.02em", opacity: gaugeLabelOp }}>
            50%
          </div>
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 22, color: MINT, letterSpacing: "0.1em", fontWeight: 600 }}>← 예의만 가져간 경우</span>
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", fontWeight: 500 }}>진짜 핵심은 절반 남음 →</span>
        </div>
      </div>

      {/* 하단 teaser */}
      <div style={{ position: "absolute", left: "50%", bottom: 170, transform: `translate(-50%, 0) translateY(${teaserY}px)`, opacity: teaserOp, fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", textAlign: "center" }}>
        진짜 핵심은 <span style={{ color: MINT }}>이겁니다 ↓</span>
      </div>
    </AbsoluteFill>
  );
};
