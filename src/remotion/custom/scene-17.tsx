// scene-17 — "한도 불투명 — 얼마 남았는지 알 수 없다"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene17: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const questionPulse = 0.7 + 0.3 * Math.abs(Math.sin(frame / 14));
  const dashOffset = (frame * 2) % 40;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a14 0%, #1a1a24 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#c8a8ff", letterSpacing: "0.4em", fontWeight: 700 }}>USER PAIN · 가장 큰 불만</div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          <span style={{ color: "#c8a8ff" }}>얼마 남았는지</span> 알 수 없다
        </div>
      </div>

      {/* 거대한 물음표 게이지 */}
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, textAlign: "center", transform: "translateY(-50%)" }}>
        <div style={{ fontSize: 420, fontWeight: 900, color: "#c8a8ff", lineHeight: 0.9, opacity: questionPulse, textShadow: "0 20px 100px rgba(200,168,255,0.4)" }}>?</div>
      </div>

      {/* 가려진 게이지 */}
      <div style={{ position: "absolute", bottom: 260, left: 160, right: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 20, color: "#8fa5c7", letterSpacing: "0.2em" }}>MONTHLY QUOTA</span>
          <span style={{ fontSize: 24, color: "#c8a8ff", fontWeight: 700 }}>??? / ???</span>
        </div>
        <div style={{ height: 30, background: "rgba(255,255,255,0.04)", borderRadius: 15, border: "2px dashed rgba(200,168,255,0.5)", overflow: "hidden", position: "relative" }}>
          <svg width="100%" height="30" style={{ position: "absolute", inset: 0 }}>
            <pattern id="question17" width="40" height="30" patternUnits="userSpaceOnUse" patternTransform={`translate(${-dashOffset} 0)`}>
              <text x="20" y="22" textAnchor="middle" fill="#c8a8ff" fontSize="16" opacity="0.4">?</text>
            </pattern>
            <rect width="100%" height="100%" fill="url(#question17)" />
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 14, color: "#5a5068" }}>
          <span>사용자가 알 수 있는 것: 0</span>
          <span>예측 가능성: 0</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#d0b9ff", fontStyle: "italic", lineHeight: 1.4 }}>
          &ldquo;투명성 없는 토큰 사용량은 <span style={{ color: "#ff6b8a", fontWeight: 900 }}>말이 안 된다</span>&rdquo;
        </div>
        <div style={{ fontSize: 16, color: "#8fa5c7", marginTop: 8 }}>— 레딧 사용자</div>
      </div>
    </AbsoluteFill>
  );
};
