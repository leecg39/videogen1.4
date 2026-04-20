// scene-19 — "코딩 흐름 끊김 — 다시 잡기까지 시간"
// 의도: 웨이브 flow 라인이 중간에 끊김. 재시작 cost 시각화.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene19: React.FC<NodeProps> = ({ frame }) => {
  const lineDraw = interpolate(frame, [0, 80], [0, 1200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breakFlash = frame >= 60 && frame < 66 ? 1 : 0;
  const costShow = interpolate(frame, [80, 130], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #06080e 0%, #0e1018 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#ffbe5c", letterSpacing: "0.4em", fontWeight: 700 }}>FLOW STATE · 몰입</div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 800, marginTop: 10 }}>끊기면 — <span style={{ color: "#ff6b8a" }}>다시 잡기까지</span></div>
      </div>

      {/* 웨이브 라인 끊김 */}
      <svg style={{ position: "absolute", top: 280, left: 0, right: 0, width: "100%", height: 400 }} viewBox="0 0 1920 400">
        {breakFlash > 0 && <rect x="920" y="0" width="200" height="400" fill="rgba(255,107,138,0.3)" />}

        <defs>
          <linearGradient id="wave19" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#7dffb0" />
            <stop offset="45%" stopColor="#ffbe5c" />
            <stop offset="50%" stopColor="#ff3b5c" />
            <stop offset="55%" stopColor="#8fa5c7" />
            <stop offset="100%" stopColor="#8fa5c7" />
          </linearGradient>
        </defs>

        {/* 흐르는 코딩 flow (끊김 전) */}
        <path
          d="M 120 200 Q 260 120 400 200 T 680 200 T 960 200"
          stroke="#7dffb0"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="1200"
          strokeDashoffset={Math.max(0, 1200 - lineDraw)}
        />

        {/* 끊김 X */}
        <g transform="translate(960, 200)" opacity={lineDraw > 500 ? 1 : 0}>
          <line x1="-40" y1="-40" x2="40" y2="40" stroke="#ff3b5c" strokeWidth="8" strokeLinecap="round" />
          <line x1="40" y1="-40" x2="-40" y2="40" stroke="#ff3b5c" strokeWidth="8" strokeLinecap="round" />
          <text x="0" y="-70" textAnchor="middle" fill="#ff3b5c" fontSize="24" fontWeight="900" fontFamily="Space Grotesk" letterSpacing="0.2em">LIMIT REACHED</text>
        </g>

        {/* 재시작 영역 (회색) */}
        <path
          d="M 1040 200 Q 1180 160 1320 180 Q 1460 200 1600 200 T 1800 200"
          stroke="#4a5068"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8 8"
          opacity={Math.max(0, (lineDraw - 800) / 400)}
        />
      </svg>

      {/* 비용 비교 */}
      <div style={{ position: "absolute", bottom: 130, left: 160, right: 160, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: costShow }}>
        <div>
          <div style={{ fontSize: 18, color: "#7dffb0", letterSpacing: "0.3em" }}>COST TO FLOW</div>
          <div style={{ fontSize: 64, color: "#7dffb0", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>~25min</div>
          <div style={{ fontSize: 18, color: "#a8e6c8" }}>연구 평균 · 재집중 시간</div>
        </div>

        <div style={{ fontSize: 40, color: "#ffbe5c" }}>× 매번 &rarr;</div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, color: "#ff6b8a", letterSpacing: "0.3em" }}>DAILY LOSS</div>
          <div style={{ fontSize: 64, color: "#ff3b5c", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>2~3h</div>
          <div style={{ fontSize: 18, color: "#f0a0b8" }}>한도 터지는 날 · 생산성 추락</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
