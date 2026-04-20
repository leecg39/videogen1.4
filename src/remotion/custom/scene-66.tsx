// scene-66 — "답답해하는 사이 — 로컬 AI 가 치고 올라왔다"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene66: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const cloudFall = interpolate(frame, [20, 100], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const localRise = interpolate(frame, [40, 130], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #0a0614 0%, #1a1224 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 80, left: 140 }}>
        <div style={{ fontSize: 20, color: "#7dffb0", letterSpacing: "0.4em", fontWeight: 700 }}>MARKET TWIST · 시장 역전</div>
        <div style={{ fontSize: 52, color: "#fff", fontWeight: 800, marginTop: 10 }}>답답해하는 사이 — <span style={{ color: "#7dffb0" }}>로컬이 치고 올라왔다</span></div>
      </div>

      {/* 두 축 비교 라인 그래프 */}
      <svg style={{ position: "absolute", top: 260, left: 120, width: "90%", height: 540 }} viewBox="0 0 1680 540">
        {/* 축 */}
        <line x1="80" y1="480" x2="1600" y2="480" stroke="#4a5068" strokeWidth="2" />
        <line x1="80" y1="40" x2="80" y2="480" stroke="#4a5068" strokeWidth="2" />

        {/* 타임 라벨 */}
        {["2020", "2022", "2024", "2026"].map((t, i) => (
          <text key={i} x={80 + i * 500} y="510" fill="#8fa5c7" fontSize="16" fontFamily="Space Grotesk">{t}</text>
        ))}

        {/* Cloud (점차 정체/하락) */}
        <defs>
          <linearGradient id="cloud66" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff6b8a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff6b8a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="local66" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7dffb0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7dffb0" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={`M 80 340 Q 300 280 550 240 Q 800 200 1050 220 Q 1300 260 1600 ${300 + cloudFall}`} stroke="#ff6b8a" strokeWidth="5" fill="none" />
        <path d={`M 80 340 Q 300 280 550 240 Q 800 200 1050 220 Q 1300 260 1600 ${300 + cloudFall} L 1600 480 L 80 480 Z`} fill="url(#cloud66)" />

        <path d={`M 80 440 Q 300 430 550 410 Q 800 380 1050 320 Q 1300 240 1600 ${160 - localRise}`} stroke="#7dffb0" strokeWidth="5" fill="none" />
        <path d={`M 80 440 Q 300 430 550 410 Q 800 380 1050 320 Q 1300 240 1600 ${160 - localRise} L 1600 480 L 80 480 Z`} fill="url(#local66)" />

        {/* 라벨 */}
        <text x="1500" y={310 + cloudFall} fill="#ff6b8a" fontSize="22" fontWeight="700" textAnchor="end" fontFamily="Space Grotesk">Cloud AI · 정체</text>
        <text x="1500" y={160 - localRise - 10} fill="#7dffb0" fontSize="22" fontWeight="700" textAnchor="end" fontFamily="Space Grotesk">Local AI · 급상승 ↑</text>

        {/* 교차점 마커 */}
        <circle cx="1050" cy="270" r="10" fill="#ffbe5c" />
        <text x="1040" y="250" textAnchor="end" fill="#ffbe5c" fontSize="16" fontWeight="700" fontFamily="Space Grotesk">2024 · 교차점</text>
      </svg>

      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#c5d7f0", fontStyle: "italic" }}>
          클라우드가 답답할 때 — <span style={{ color: "#7dffb0", fontWeight: 900 }}>로컬이 답</span>이 된다
        </div>
      </div>
    </AbsoluteFill>
  );
};
