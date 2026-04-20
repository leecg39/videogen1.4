// scene-14 — "10배에서 20배로 뛰어버렸다" 폭증
// 의도: 배경에 치솟는 스파이크 차트, 전경에 화살표로 연결된 "10×" → "20×" 도약. 시스템 폭주 공포.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene14: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const leftDrop = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 140 }, from: 80, to: 0 });
  const arrowGrow = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rightPop = spring({ frame: frame - 48, fps, config: { damping: 10, stiffness: 160 }, from: 0, to: 1 });

  const spikeHeights = [0.32, 0.48, 0.38, 0.55, 0.72, 0.58, 0.82, 0.95, 0.68, 0.85, 0.44, 0.6];

  return (
    <AbsoluteFill style={{ background: "#0a0710", fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden" }}>
      {/* 배경 스파이크 차트 */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }} viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spike14" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffb347" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff3b5c" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {spikeHeights.map((h, i) => {
          const x = i * (1920 / spikeHeights.length);
          const w = (1920 / spikeHeights.length) * 0.62;
          const enter = interpolate(frame, [10 + i * 2, 30 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const localH = h * 720 * enter;
          return <rect key={i} x={x} y={1080 - localH} width={w} height={localH} fill="url(#spike14)" />;
        })}
      </svg>

      {/* 상단 경고 헤더 */}
      <div style={{ position: "absolute", top: 110, left: 130, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff3b5c", animation: "pulse 1s infinite" }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: "#ff6b8a", letterSpacing: "0.4em", textTransform: "uppercase" }}>
          cache corruption · 캐시 버그 발생
        </span>
      </div>

      {/* 중앙: 10× → 20× */}
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
        <div style={{ transform: `translateY(${leftDrop}px)`, textAlign: "center" }}>
          <div style={{ fontSize: 40, color: "#a5b3c7", letterSpacing: "0.18em", marginBottom: 14 }}>PEAK TIME</div>
          <div style={{ fontSize: 280, fontWeight: 900, color: "#ffb347", lineHeight: 0.9, fontFeatureSettings: "'tnum'" }}>
            10<span style={{ fontSize: 160, color: "#7d6e4e" }}>×</span>
          </div>
        </div>

        {/* 화살표 */}
        <svg width={240} height={140} style={{ transform: `scale(${arrowGrow})`, transformOrigin: "center" }}>
          <defs>
            <linearGradient id="arrow14" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ffb347" />
              <stop offset="100%" stopColor="#ff3b5c" />
            </linearGradient>
          </defs>
          <path d="M 20 70 L 180 70" stroke="url(#arrow14)" strokeWidth={14} strokeLinecap="round" />
          <path d="M 150 30 L 220 70 L 150 110" stroke="url(#arrow14)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        <div style={{ transform: `scale(${rightPop})`, textAlign: "center" }}>
          <div style={{ fontSize: 40, color: "#ff6b8a", letterSpacing: "0.18em", marginBottom: 14 }}>BUG EFFECT</div>
          <div style={{ fontSize: 400, fontWeight: 900, color: "#ff3b5c", lineHeight: 0.9, fontFeatureSettings: "'tnum'", textShadow: "0 20px 100px rgba(255,59,92,0.5)" }}>
            20<span style={{ fontSize: 220 }}>×</span>
          </div>
        </div>
      </div>

      {/* 하단 설명 */}
      <div style={{ position: "absolute", bottom: 120, left: 130, right: 130, display: "flex", justifyContent: "space-between", fontSize: 28, color: "#b5c2d4" }}>
        <span>프롬프트 캐시 고장 &rarr; 사용량 폭주</span>
        <span style={{ color: "#7ed6a8" }}>이전 버전 rollback → 정상 복귀 보고</span>
      </div>
    </AbsoluteFill>
  );
};
