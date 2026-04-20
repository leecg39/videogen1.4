// anxious-34 — "모델을 잘 돌보면, 모델이 일을 잘 해냅니다." 한 문장 압축.
// 의도: 전 영상의 핵심. 중앙 거대 타이포 + 양측 조각 강조.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene34: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const stampOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const glowPulse = interpolate((frame % 75) / 75, [0, 0.5, 1], [0.2, 0.6, 0.2]);

  const leftOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const leftY = interpolate(frame, [20, 50], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const rightOp = interpolate(frame, [70, 110], [0, 1], { extrapolateRight: "clamp" });
  const rightY = interpolate(frame, [70, 110], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const eqPop = spring({ frame: frame - 120, fps, config: { damping: 13, stiffness: 130 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(57,255,20,${0.12 + glowPulse * 0.18}) 0%, rgba(8,6,13,1) 70%)` }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/sunset-city-skyline.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(16px) brightness(0.4) saturate(0.4) sepia(0.2)" }}
        volume={0}
      />
      {/* 상단 스탬프 */}
      <div style={{ position: "absolute", left: "50%", top: 140, transform: "translate(-50%, 0)", display: "flex", alignItems: "center", gap: 14, opacity: stampOp }}>
        <span style={{ width: 42, height: 1, background: MINT }} />
        <span style={{ fontSize: 19, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>ONE-SENTENCE SUMMARY</span>
        <span style={{ width: 42, height: 1, background: MINT }} />
      </div>

      {/* 중앙 2열 진술 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 350 }}>
        <div style={{ opacity: leftOp, transform: `translateY(${leftY}px)`, textAlign: "center", fontSize: 110, fontWeight: 900, letterSpacing: "-0.032em", lineHeight: 1.02 }}>
          모델을 <span style={{ color: MINT, textShadow: `0 0 40px rgba(57,255,20,0.4)` }}>잘 돌보면</span>,
        </div>

        {/* 중앙 → */}
        <div style={{ textAlign: "center", margin: "24px 0", transform: `scale(${eqPop})`, fontSize: 50, color: "rgba(255,255,255,0.3)" }}>↓</div>

        <div style={{ opacity: rightOp, transform: `translateY(${rightY}px)`, textAlign: "center", fontSize: 110, fontWeight: 900, letterSpacing: "-0.032em", lineHeight: 1.02 }}>
          모델이 <span style={{ color: MINT, textShadow: `0 0 40px rgba(57,255,20,0.4)` }}>일을 잘</span> 해냅니다.
        </div>
      </div>

      {/* 하단 라벨 */}
      <div style={{ position: "absolute", left: "50%", bottom: 150, transform: "translate(-50%, 0)", display: "flex", alignItems: "center", gap: 16, fontSize: 17, letterSpacing: "0.45em", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: MINT, boxShadow: `0 0 10px ${MINT}` }} />
        CARE → PERFORMANCE
        <span style={{ width: 10, height: 10, borderRadius: 999, background: MINT, boxShadow: `0 0 10px ${MINT}` }} />
      </div>
    </AbsoluteFill>
  );
};
