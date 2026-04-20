// scene-35 — "인터넷 없이도 AI 실행 — 비행기 모드 메타포"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene35: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const planeX = interpolate(frame, [10, 140], [-200, 2200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wifiOpacity = interpolate(frame, [30, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const airmode = interpolate(frame, [60, 100], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a1630 0%, #061020 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#8fd5ff", letterSpacing: "0.4em", fontWeight: 700 }}>OFFLINE · 인터넷 없이도</div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 800, marginTop: 10 }}>오프라인으로 <span style={{ color: "#7dffb0" }}>직접</span></div>
      </div>

      {/* 비행기 */}
      <svg style={{ position: "absolute", top: 280, left: 0, width: "100%", height: 300 }} viewBox="0 0 2200 300">
        <path d={`M ${planeX - 60} 150 L ${planeX + 80} 140 L ${planeX + 90} 160 L ${planeX} 170 Z`} fill="#8fd5ff" />
        <path d={`M ${planeX + 20} 110 L ${planeX + 40} 80 L ${planeX + 70} 140 Z`} fill="#8fd5ff" />
        <path d={`M ${planeX + 20} 190 L ${planeX + 40} 220 L ${planeX + 70} 160 Z`} fill="#8fd5ff" />
        {/* 궤적 */}
        <line x1={-100} y1={158} x2={planeX} y2={158} stroke="rgba(143,213,255,0.3)" strokeWidth="2" strokeDasharray="6 6" />
      </svg>

      {/* 중앙: wifi off → airmode on */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 60 }}>
          <div style={{ textAlign: "center", opacity: wifiOpacity }}>
            <svg width="140" height="140" viewBox="0 0 100 100">
              <path d="M 10 40 Q 50 10 90 40" stroke="#8fd5ff" strokeWidth="5" fill="none" />
              <path d="M 24 54 Q 50 32 76 54" stroke="#8fd5ff" strokeWidth="5" fill="none" />
              <path d="M 38 68 Q 50 56 62 68" stroke="#8fd5ff" strokeWidth="5" fill="none" />
              <circle cx="50" cy="80" r="6" fill="#8fd5ff" />
            </svg>
            <div style={{ fontSize: 22, color: "#8fd5ff", marginTop: 8, letterSpacing: "0.3em", fontWeight: 700 }}>ONLINE</div>
          </div>

          <div style={{ fontSize: 60, color: "#ffbe5c" }}>→</div>

          <div style={{ textAlign: "center", opacity: airmode }}>
            <svg width="140" height="140" viewBox="0 0 100 100">
              <path d="M 50 20 L 55 45 L 80 55 L 55 55 L 55 85 L 50 80 L 45 85 L 45 55 L 20 55 L 45 45 Z" fill="#ffbe5c" />
            </svg>
            <div style={{ fontSize: 22, color: "#ffbe5c", marginTop: 8, letterSpacing: "0.3em", fontWeight: 700 }}>AIRPLANE MODE</div>
          </div>
        </div>
      </div>

      {/* 하단 메시지 */}
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 40, color: "#fff", fontWeight: 700 }}>
          무료 · <span style={{ color: "#7dffb0", fontWeight: 900 }}>인터넷 없이</span> · 내 노트북
        </div>
      </div>
    </AbsoluteFill>
  );
};
