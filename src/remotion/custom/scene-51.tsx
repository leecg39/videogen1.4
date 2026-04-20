// scene-51 — "몇 주 → 30분 획기적 단축"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene51: React.FC<NodeProps> = ({ frame }) => {
  const shrink = interpolate(frame, [30, 120], [1, 0.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #14081e 0%, #05030a 85%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: "#c8a8ff", letterSpacing: "0.5em", fontWeight: 700 }}>COMPRESSION · 시간 압축</div>
        <div style={{ fontSize: 56, color: "#fff", fontWeight: 800, marginTop: 10 }}>몇 주 → <span style={{ color: "#c8a8ff" }}>30분</span></div>
      </div>

      {/* 좌측 — BEFORE */}
      <div style={{ position: "absolute", top: "38%", left: 180, textAlign: "center", transform: "translateY(-50%)" }}>
        <div style={{ fontSize: 18, color: "#8fa5c7", letterSpacing: "0.3em", fontWeight: 700 }}>BEFORE · 기존 방식</div>
        <div style={{ fontSize: 200, fontWeight: 900, color: "#8fa5c7", lineHeight: 0.9, fontFeatureSettings: "'tnum'", letterSpacing: "-0.03em" }}>2~3<span style={{ fontSize: 100 }}>주</span></div>
        <div style={{ marginTop: 20, fontSize: 18, color: "#5a6d96" }}>개발자 미팅 → 기획 → 견적 → 수정 반복</div>
      </div>

      {/* 중앙: 압축 arrow + 비율 */}
      <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <svg width="240" height="180" viewBox="0 0 200 150">
          <defs>
            <linearGradient id="arrow51" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#8fa5c7" />
              <stop offset="100%" stopColor="#c8a8ff" />
            </linearGradient>
          </defs>
          <path d="M 20 75 L 140 75" stroke="url(#arrow51)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 120 35 L 180 75 L 120 115" stroke="url(#arrow51)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 32, color: "#c8a8ff", fontWeight: 900, letterSpacing: "0.05em", fontFeatureSettings: "'tnum'" }}>≈ 100배 빠름</div>
      </div>

      {/* 우측 — AFTER */}
      <div style={{ position: "absolute", top: "38%", right: 180, textAlign: "center", transform: "translateY(-50%)" }}>
        <div style={{ fontSize: 18, color: "#c8a8ff", letterSpacing: "0.3em", fontWeight: 700 }}>NOW · 울트라 플랜</div>
        <div style={{ fontSize: 320, fontWeight: 900, color: "#c8a8ff", lineHeight: 0.9, fontFeatureSettings: "'tnum'", letterSpacing: "-0.04em", textShadow: "0 20px 100px rgba(200,168,255,0.4)" }}>30<span style={{ fontSize: 120 }}>분</span></div>
        <div style={{ marginTop: 20, fontSize: 20, color: "#d0b9ff", fontWeight: 700 }}>/ultraplan 한 줄 · Opus 4.6 전담</div>
      </div>

      {/* 하단 주석 */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: "#8fa5c7", fontStyle: "italic" }}>* 아직 연구 미리보기 단계 · 동작 변경 가능</div>
      </div>
    </AbsoluteFill>
  );
};
