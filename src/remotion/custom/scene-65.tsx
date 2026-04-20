// scene-65 — "시장 한 주도 조용할 날이 없다" — 주간 업데이트 drumbeat
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const WEEKS = [
  { w: "W-3", event: "Claude Opus 4.6", color: "#c8a8ff" },
  { w: "W-2", event: "Sora 포기 발표", color: "#ff6b3d" },
  { w: "W-1", event: "Gemma 4 공개", color: "#7dffb0" },
  { w: "W+0", event: "울트라 플랜 · 토큰 이슈", color: "#ffbe5c" },
  { w: "W+1?", event: "GPT6 루머", color: "#ff3b5c" },
];

export const Scene65: React.FC<NodeProps> = ({ frame }) => {
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #0a0a1a 0%, #141428 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 80, left: 140, opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#ffbe5c", letterSpacing: "0.45em", fontWeight: 700 }}>AI MARKET PULSE</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>한 주도 <span style={{ color: "#ffbe5c" }}>조용할 날</span>이 없다</div>
      </div>

      {/* 5주 drumbeat */}
      <div style={{ position: "absolute", top: 280, left: 140, right: 140 }}>
        {/* 타임축 */}
        <svg width="100%" height="120" viewBox="0 0 1640 120">
          <line x1="40" y1="60" x2="1600" y2="60" stroke="#4a5068" strokeWidth="2" />
          {WEEKS.map((w, i) => {
            const x = 80 + i * 370;
            const appearFrame = 30 + i * 16;
            const enter = interpolate(frame, [appearFrame, appearFrame + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <g key={i} transform={`translate(${x}, 0)`} opacity={enter}>
                <circle cx="0" cy="60" r="14" fill={w.color} />
                <line x1="0" y1="46" x2="0" y2="20" stroke={w.color} strokeWidth="2" />
                <text x="0" y="12" textAnchor="middle" fill={w.color} fontSize="14" letterSpacing="0.2em" fontWeight="700" fontFamily="Space Grotesk">{w.w}</text>
              </g>
            );
          })}
        </svg>

        {/* 각 주 설명 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginTop: 40 }}>
          {WEEKS.map((w, i) => {
            const appearFrame = 48 + i * 16;
            const enter = interpolate(frame, [appearFrame, appearFrame + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 30}px)`, padding: "18px 16px", background: `${w.color}14`, borderTop: `3px solid ${w.color}`, borderRadius: "0 0 8px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 20, color: w.color, fontWeight: 700, letterSpacing: "0.2em" }}>{w.w}</div>
                <div style={{ fontSize: 22, color: "#fff", marginTop: 6, fontWeight: 600, lineHeight: 1.25 }}>{w.event}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 30, color: "#c5d7f0" }}>
          이번 주만 <span style={{ color: "#ffbe5c", fontWeight: 900 }}>5건</span> · 내주도 또 새로운 뉴스
        </div>
      </div>
    </AbsoluteFill>
  );
};
