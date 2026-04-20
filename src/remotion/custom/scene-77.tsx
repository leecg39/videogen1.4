// scene-77 — 엔딩 "다음에 또 만나요" 랩장 사인오프
// 의도: 극도의 미니멀. 중앙 손글씨 사인 + 아래 별 떨어지는 배경 + 호흡 같은 페이드. 4.7초 짧은 씬.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene77: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const lineDraw = interpolate(frame, [0, 84], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const signOpacity = interpolate(frame, [18, 60], [0, 1], { extrapolateRight: "clamp" });
  const outroFade = interpolate(frame, [108, 143], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + Math.sin(frame / 14) * 0.015;

  const stars = Array.from({ length: 28 }).map((_, i) => ({
    left: (i * 137) % 1920,
    delay: (i * 7) % 70,
    speed: 0.6 + ((i * 13) % 40) / 100,
  }));

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, #121528 0%, #05070f 85%)", fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden", opacity: outroFade }}>
      {/* 떨어지는 별들 */}
      {stars.map((s, i) => {
        const progress = ((frame - s.delay) * s.speed * 8) % 1200;
        const y = progress - 100;
        const starOpacity = interpolate(y, [-100, 0, 900, 1080], [0, 1, 1, 0]);
        return (
          <div key={i} style={{ position: "absolute", left: s.left, top: y, width: 2, height: 2, background: "#fff", borderRadius: "50%", opacity: starOpacity, boxShadow: "0 0 4px rgba(255,255,255,0.8)" }} />
        );
      })}

      {/* 중앙 사인 (SVG path draw) */}
      <div style={{ position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center", transform: `translateY(-50%) scale(${breathe})` }}>
        <svg width={760} height={180} viewBox="0 0 760 180" style={{ display: "block", margin: "0 auto" }}>
          <defs>
            <linearGradient id="signGrad77" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#8fd5ff" />
              <stop offset="100%" stopColor="#c8a8ff" />
            </linearGradient>
          </defs>
          {/* 필기체 느낌의 사인 path */}
          <path
            d="M 60 100 Q 100 40 160 90 T 260 90 Q 300 60 340 100 Q 380 140 420 90 T 520 100 Q 580 50 640 110 Q 680 140 720 90"
            stroke="url(#signGrad77)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1200"
            strokeDashoffset={(1 - lineDraw) * 1200}
          />
        </svg>
        <div style={{ fontSize: 88, fontWeight: 300, color: "#fff", letterSpacing: "-0.01em", marginTop: 24, fontFamily: "'Playfair Display', serif", fontStyle: "italic", opacity: signOpacity }}>
          다음에 또 만나요
        </div>
      </div>

      {/* 하단 서명 */}
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center", opacity: signOpacity }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "10px 28px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8fd5ff", boxShadow: "0 0 10px #8fd5ff" }} />
          <span style={{ fontSize: 22, letterSpacing: "0.5em", color: "#c5d7f0", fontWeight: 600 }}>바이브랩스 · 랩장</span>
        </div>
      </div>

      {/* 위 작은 프리뷰 톱 바 */}
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 20, letterSpacing: "0.6em", color: "#5a6d96" }}>VIBE NEWS · 04 / 07</div>
      </div>
    </AbsoluteFill>
  );
};
