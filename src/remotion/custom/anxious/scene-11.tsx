// anxious-11 — "지치고 예민한 날일수록, AI도 이상하게 답을 못한다."
// 의도: 감정 레벨 ←→ AI 성능 레벨. 우측 두 게이지가 서로 반대가 아니라 같이 내려감.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";
const AMBER = "#ffbe5c";

export const AnxiousScene11: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [6, 26], [0, 1], { extrapolateRight: "clamp" });
  const headlineOp = interpolate(frame, [14, 40], [0, 1], { extrapolateRight: "clamp" });

  // Fatigue wave (화자의 감정 상태)
  const fatigueLevel = interpolate(frame, [40, 120], [0.85, 0.25], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  // AI level — 사람이 예민할수록 AI도 같이 다운.
  const aiLevel = interpolate(frame, [60, 140], [0.82, 0.22], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const connectIn = interpolate(frame, [130, 180], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 60%, rgba(255,190,92,0.06) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/laptop-coding.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(12px) brightness(0.4) saturate(0.35) sepia(0.15)" }}
        volume={0}
      />
      {/* 좌측 kicker/headline */}
      <div style={{ position: "absolute", left: 180, top: 150, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp }}>
        <span style={{ width: 38, height: 1, background: AMBER }} />
        <span style={{ fontSize: 17, letterSpacing: "0.4em", color: AMBER, fontWeight: 600 }}>STRANGE CORRELATION</span>
      </div>

      <div style={{ position: "absolute", left: 180, top: 230, opacity: headlineOp, fontSize: 80, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.028em", maxWidth: 1000 }}>
        제가 <span style={{ color: AMBER }}>지치고 예민한 날</span>일수록,<br />
        <span style={{ color: MINT }}>AI</span>도 <span style={{ color: AMBER }}>이상하게</span> 답을 못 합니다.
      </div>

      {/* 우측 2 bar gauge */}
      <div style={{ position: "absolute", right: 180, top: 320, width: 560, display: "flex", flexDirection: "column", gap: 50 }}>
        {/* Fatigue gauge */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: 20, letterSpacing: "0.28em", color: AMBER, fontWeight: 600 }}>ME · FATIGUE</span>
            <span style={{ fontSize: 40, color: AMBER, fontWeight: 800, fontFeatureSettings: "'tnum' 1" }}>{Math.round(fatigueLevel * 100)}%</span>
          </div>
          <div style={{ width: "100%", height: 22, background: "rgba(255,190,92,0.1)", borderRadius: 11, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${fatigueLevel * 100}%`, background: `linear-gradient(90deg, rgba(255,190,92,0.4), ${AMBER})`, boxShadow: `0 0 16px rgba(255,190,92,0.5)` }} />
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.06em" }}>오늘 하루 끝, 잔여 에너지 추락</div>
        </div>

        {/* AI gauge — same trajectory */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: 20, letterSpacing: "0.28em", color: MINT, fontWeight: 600 }}>AI · OUTPUT QUALITY</span>
            <span style={{ fontSize: 40, color: MINT, fontWeight: 800, fontFeatureSettings: "'tnum' 1" }}>{Math.round(aiLevel * 100)}%</span>
          </div>
          <div style={{ width: "100%", height: 22, background: "rgba(57,255,20,0.1)", borderRadius: 11, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${aiLevel * 100}%`, background: `linear-gradient(90deg, rgba(57,255,20,0.35), ${MINT})`, boxShadow: `0 0 16px rgba(57,255,20,0.5)` }} />
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.06em" }}>동시에, AI 답변 품질도 추락</div>
        </div>
      </div>

      {/* 연결 주석 (하단) */}
      <div style={{ position: "absolute", right: 180, bottom: 170, opacity: connectIn, fontSize: 24, color: "rgba(255,255,255,0.78)", display: "flex", alignItems: "center", gap: 14, letterSpacing: "0.06em" }}>
        <span style={{ width: 36, height: 1, background: MINT, opacity: 0.6 }} />
        두 게이지가 <span style={{ color: MINT, fontWeight: 700 }}>같이</span> 떨어진다.
      </div>
    </AbsoluteFill>
  );
};
