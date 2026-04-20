// anxious-12 — "우연일까요. 아닙니다. 구조적인 이유. 7가지 가이드 정리."
// 의도: 전환 씬. 좌측 "우연?" X, 우측 "구조적" 체크. 하단 7 dot 행렬 티저.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene12: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const qOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const xProgress = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const aOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const aY = interpolate(frame, [60, 90], [26, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const structuralOp = interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" });
  const sevenOp = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });

  const seven = Array.from({ length: 7 });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(57,255,20,0.08) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/cloud-computing.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(16px) brightness(0.45) hue-rotate(120deg) saturate(0.4)" }}
        volume={0}
      />
      {/* 좌측: 우연? (X) */}
      <div style={{ position: "absolute", left: 200, top: 260, width: 700, opacity: qOp }}>
        <div style={{ fontSize: 20, letterSpacing: "0.35em", color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 22 }}>COINCIDENCE?</div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ fontSize: 170, fontWeight: 900, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.04em" }}>우연?</span>
          <svg style={{ position: "absolute", top: -10, left: 0, right: 0 }} width={600} height={280} viewBox="0 0 600 280">
            <line x1={30} y1={40} x2={570} y2={240} stroke={MINT} strokeWidth={9}
              strokeDasharray={800}
              strokeDashoffset={800 - xProgress * 800}
              style={{ filter: `drop-shadow(0 0 14px ${MINT})` }}
            />
            <line x1={570} y1={40} x2={30} y2={240} stroke={MINT} strokeWidth={9}
              strokeDasharray={800}
              strokeDashoffset={800 - Math.max(0, xProgress - 0.3) / 0.7 * 800}
              style={{ filter: `drop-shadow(0 0 14px ${MINT})` }}
            />
          </svg>
        </div>
        <div style={{ marginTop: 20, fontSize: 30, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em", opacity: aOp, transform: `translateY(${aY}px)` }}>
          아닙니다.
        </div>
      </div>

      {/* 우측: 구조적 이유 (check) */}
      <div style={{ position: "absolute", right: 200, top: 280, width: 640, opacity: structuralOp }}>
        <div style={{ fontSize: 20, letterSpacing: "0.35em", color: MINT, fontWeight: 700, marginBottom: 22 }}>STRUCTURAL REASON</div>
        <div style={{ fontSize: 98, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          구조적인<br />
          <span style={{ color: MINT }}>이유가 있습니다.</span>
        </div>
      </div>

      {/* 하단 7 dot 행렬 + 티저 */}
      <div style={{ position: "absolute", left: "50%", bottom: 180, transform: "translate(-50%, 0)", opacity: sevenOp, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 14, letterSpacing: "0.42em", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>7 PRACTICAL GUIDES · NEXT UP</div>
        <div style={{ display: "flex", gap: 18 }}>
          {seven.map((_, i) => {
            const s = 160 + i * 5;
            const op = interpolate(frame, [s, s + 10], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: MINT, opacity: op * 0.7, boxShadow: `0 0 10px rgba(57,255,20,${op * 0.5})` }} />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
