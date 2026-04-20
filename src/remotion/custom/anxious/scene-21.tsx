// anxious-21 — "프롬프트는 모델이 일할 작업 환경. 겁먹은 주니어 = 겁먹은 모델."
// 의도: Split 대비. 좌측 주니어 개발자 메타포 + 우측 모델의 거울상.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene21: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 36], [0, 0.09], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const quoteOp = interpolate(frame, [16, 46], [0, 1], { extrapolateRight: "clamp" });

  const leftOp = interpolate(frame, [50, 100], [0, 1], { extrapolateRight: "clamp" });
  const leftX = interpolate(frame, [50, 100], [-30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const rightOp = interpolate(frame, [90, 140], [0, 1], { extrapolateRight: "clamp" });
  const rightX = interpolate(frame, [90, 140], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const equalsIn = spring({ frame: frame - 130, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/corporate-meeting-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.4) saturate(0.2)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(8,6,13,0.55) 0%, rgba(8,6,13,0.98) 70%)" }} />

      {/* 상단 kicker + quote */}
      <div style={{ position: "absolute", left: "50%", top: 130, transform: "translate(-50%,0)", display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.45em", color: MINT, fontWeight: 700 }}>
        <span style={{ width: 32, height: 1, background: MINT }} />
        THE METAPHOR
        <span style={{ width: 32, height: 1, background: MINT }} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontSize: 42, fontWeight: 500, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.015em", opacity: quoteOp }}>
        "프롬프트는 모델이 일할 <span style={{ color: MINT, fontWeight: 800 }}>작업 환경</span>이다."
      </div>

      {/* Split 좌우 */}
      {/* 좌측: 겁먹은 주니어 */}
      <div style={{ position: "absolute", left: 180, top: 420, width: 680, opacity: leftOp, transform: `translateX(${leftX}px)` }}>
        <div style={{ fontSize: 14, letterSpacing: "0.4em", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: 16 }}>SIDE A — HUMAN</div>
        <div style={{ padding: "44px 40px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.22)", borderRadius: 10 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            겁먹은 주니어는<br />좋은 코드를 <span style={{ color: "#ff7a7a" }}>못 씁니다.</span>
          </div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", fontStyle: "italic", letterSpacing: "0.03em" }}>
            — 30년 개발 현장에서 수백 번 확인
          </div>
        </div>
      </div>

      {/* 중앙: = */}
      <div style={{ position: "absolute", left: "50%", top: 590, transform: `translate(-50%, 0) scale(${equalsIn})`, fontSize: 120, fontWeight: 300, color: MINT, lineHeight: 1, textShadow: `0 0 30px rgba(57,255,20,0.4)` }}>
        =
      </div>

      {/* 우측: 겁먹은 모델 */}
      <div style={{ position: "absolute", right: 180, top: 420, width: 680, opacity: rightOp, transform: `translateX(${rightX}px)` }}>
        <div style={{ fontSize: 14, letterSpacing: "0.4em", color: MINT, fontWeight: 700, marginBottom: 16, textAlign: "right" }}>SIDE B — MODEL</div>
        <div style={{ padding: "44px 40px", background: "rgba(57,255,20,0.05)", border: `1.5px solid ${MINT}`, borderRadius: 10, boxShadow: `0 0 30px rgba(57,255,20,0.12)` }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            겁먹은 모델도<br /><span style={{ color: MINT }}>마찬가지입니다.</span>
          </div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", fontStyle: "italic", letterSpacing: "0.03em" }}>
            — 불안한 에이전트는 사과로 토큰을 소진
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
