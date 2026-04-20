// scene-68 — "시장 경쟁 더 뜨거워지고 있다 · 결국 하나의 그림으로 수렴"
// 의도: 두 개의 축 (로컬 vs 클라우드) 이 경쟁→수렴→공존 의 3 상태로 진행. 시간축 있는 힘 흐름도.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene68: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const phase1 = interpolate(frame, [20, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase2 = interpolate(frame, [70, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase3 = interpolate(frame, [130, 190], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 두 원이 거리에서 가까워지다가 교집합 형성
  const leftX = interpolate(phase2, [0, 1], [350, 700]);
  const rightX = interpolate(phase2, [0, 1], [1250, 900]);
  const circleOpacity = phase1;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #08091a 0%, #10143a 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity: headerOpacity }}>
        <div style={{ fontSize: 20, color: "#c8a8ff", letterSpacing: "0.45em", fontWeight: 700 }}>CONVERGENCE · 수렴</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          결국 <span style={{ color: "#c8a8ff" }}>하나의 그림</span>으로 수렴한다
        </div>
      </div>

      {/* 중앙: 두 원의 움직임 */}
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, height: 500 }}>
        <svg width="100%" height="100%" viewBox="0 0 1920 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="local68" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#7dffb0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7dffb0" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="cloud68" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#8fd5ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8fd5ff" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx={leftX} cy="250" r="220" fill="url(#local68)" stroke="#7dffb0" strokeWidth="3" opacity={circleOpacity} />
          <circle cx={rightX} cy="250" r="220" fill="url(#cloud68)" stroke="#8fd5ff" strokeWidth="3" opacity={circleOpacity} />

          {/* 레이블 */}
          <text x={leftX} y="140" textAnchor="middle" fill="#7dffb0" fontSize="28" fontWeight="700" fontFamily="Space Grotesk" opacity={phase1}>LOCAL AI</text>
          <text x={leftX} y="265" textAnchor="middle" fill="#fff" fontSize="44" fontWeight="900" fontFamily="Space Grotesk" opacity={phase1}>간단한 일</text>
          <text x={leftX} y="310" textAnchor="middle" fill="#a8e6c8" fontSize="18" fontFamily="Space Grotesk" opacity={phase1}>빠름 · 프라이버시</text>

          <text x={rightX} y="140" textAnchor="middle" fill="#8fd5ff" fontSize="28" fontWeight="700" fontFamily="Space Grotesk" opacity={phase1}>CLOUD AI</text>
          <text x={rightX} y="265" textAnchor="middle" fill="#fff" fontSize="44" fontWeight="900" fontFamily="Space Grotesk" opacity={phase1}>복잡한 일</text>
          <text x={rightX} y="310" textAnchor="middle" fill="#b2e4ff" fontSize="18" fontFamily="Space Grotesk" opacity={phase1}>성능 · 최신</text>

          {/* 교집합 영역 */}
          {phase2 > 0.1 && (
            <g opacity={phase2 * 0.7}>
              <ellipse cx="960" cy="250" rx="140" ry="180" fill="#c8a8ff" fillOpacity="0.3" stroke="#c8a8ff" strokeWidth="2" strokeDasharray="6 4" />
              <text x="960" y="260" textAnchor="middle" fill="#c8a8ff" fontSize="24" fontWeight="700" fontFamily="Space Grotesk">상황 골라쓰기</text>
            </g>
          )}
        </svg>
      </div>

      {/* 하단: phase 3 — 결론 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center", opacity: phase3 }}>
        <div style={{ display: "inline-block", padding: "18px 36px", background: "rgba(200,168,255,0.12)", border: "1px solid #c8a8ff", borderRadius: 12 }}>
          <div style={{ fontSize: 34, color: "#fff", fontWeight: 700 }}>
            경쟁 → 수렴 → <span style={{ color: "#c8a8ff", fontWeight: 900 }}>공존</span>
          </div>
        </div>
      </div>

      {/* Phase 인디케이터 */}
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          { t: "경쟁", active: phase1 > 0.2 },
          { t: "수렴", active: phase2 > 0.2 },
          { t: "공존", active: phase3 > 0.2 },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: p.active ? 1 : 0.3 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.active ? "#c8a8ff" : "#5a5068" }} />
            <span style={{ fontSize: 20, color: p.active ? "#fff" : "#8fa5c7", fontWeight: 600, letterSpacing: "0.2em" }}>{p.t}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
