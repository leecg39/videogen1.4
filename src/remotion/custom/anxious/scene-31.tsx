// anxious-31 — "여러분의 프롬프트는, 모델을 위해 조성하는 작업 환경입니다."
// 의도: 거대 선언. 중앙 대형 타이포. 메인 축 진술.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene31: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const ringRot = interpolate(frame, [0, 300], [0, 40], { extrapolateRight: "clamp" });

  const stampOp = interpolate(frame, [4, 28], [0, 1], { extrapolateRight: "clamp" });

  const promptOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const promptY = interpolate(frame, [20, 50], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const envOp = interpolate(frame, [60, 100], [0, 1], { extrapolateRight: "clamp" });
  const envScale = interpolate(frame, [60, 100], [0.92, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const subOp = interpolate(frame, [130, 170], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(57,255,20,0.14) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/process-automation-pipeline-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(16px) brightness(0.45) hue-rotate(80deg) saturate(0.5)" }}
        volume={0}
      />
      {/* 배경 회전 링 */}
      <svg style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) rotate(${ringRot}deg)` }} width={1400} height={1400} viewBox="-700 -700 1400 1400">
        <circle cx={0} cy={0} r={600} fill="none" stroke={MINT} strokeWidth={1} opacity={0.18} strokeDasharray="18 28" />
        <circle cx={0} cy={0} r={460} fill="none" stroke={MINT} strokeWidth={1} opacity={0.12} strokeDasharray="8 18" />
      </svg>

      {/* 스탬프 */}
      <div style={{ position: "absolute", left: "50%", top: 150, transform: "translate(-50%, 0)", opacity: stampOp, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 14, height: 14, borderRadius: 999, background: MINT, boxShadow: `0 0 14px ${MINT}` }} />
        <span style={{ fontSize: 18, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>THE CORE</span>
        <span style={{ width: 14, height: 14, borderRadius: 999, background: MINT, boxShadow: `0 0 14px ${MINT}` }} />
      </div>

      {/* 중앙 타이포 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 340, textAlign: "center" }}>
        <div style={{ opacity: promptOp, transform: `translateY(${promptY}px)`, fontSize: 68, fontWeight: 400, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
          여러분의 <span style={{ color: MINT, fontWeight: 700 }}>프롬프트</span>는,
        </div>
        <div style={{ marginTop: 28, opacity: envOp, transform: `scale(${envScale})`, fontSize: 150, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          <span style={{ color: "#fff" }}>모델의 </span>
          <span style={{ color: MINT, textShadow: `0 0 40px rgba(57,255,20,0.45)` }}>작업 환경</span>
          <span style={{ color: "#fff" }}>이다.</span>
        </div>
      </div>

      {/* 하단 sub */}
      <div style={{ position: "absolute", left: "50%", bottom: 170, transform: "translate(-50%, 0)", opacity: subOp, fontSize: 22, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Your prompt is the model's <span style={{ color: MINT }}>workplace</span>.
      </div>
    </AbsoluteFill>
  );
};
