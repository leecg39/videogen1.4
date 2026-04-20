// scene-31 — "MLX · Apple Silicon 전용 최적화 도구"
// 의도: M1~M4 칩 라인업 시각화 + Apple 특유의 브러쉬드 메탈 느낌. 성능 부스트 스파크.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const CHIPS = [
  { name: "M1", year: 2020, boost: 1.0 },
  { name: "M2", year: 2022, boost: 1.35 },
  { name: "M3", year: 2023, boost: 1.7 },
  { name: "M4", year: 2024, boost: 2.2 },
];

export const Scene31: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(175deg, #0d0d0f 0%, #1c1c22 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 90, left: 140, opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#8fd5ff", letterSpacing: "0.45em", fontWeight: 700 }}>APPLE SILICON ONLY</div>
        <div style={{ fontSize: 60, color: "#fff", fontWeight: 900, marginTop: 10, letterSpacing: "-0.01em" }}>
          MLX · 맥 최적화
        </div>
        <div style={{ fontSize: 22, color: "#a9b8d4", marginTop: 6 }}>Apple Silicon 의 neural engine 최대 활용</div>
      </div>

      {/* 칩 4개 로드맵 */}
      <div style={{ position: "absolute", top: 340, left: 160, right: 160 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {CHIPS.map((c, i) => {
            const delay = 24 + i * 16;
            const enter = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const active = i >= CHIPS.length - 2;
            return (
              <div key={c.name} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 50}px)`, padding: "30px 24px", background: active ? "linear-gradient(135deg, rgba(143,213,255,0.15) 0%, rgba(200,168,255,0.08) 100%)" : "rgba(255,255,255,0.04)", border: active ? "1px solid #8fd5ff" : "1px solid rgba(255,255,255,0.12)", borderRadius: 14, textAlign: "center", boxShadow: active ? "0 20px 60px rgba(143,213,255,0.15)" : "none" }}>
                {/* 칩 SVG */}
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ margin: "0 auto", display: "block" }}>
                  <rect x="20" y="20" width="60" height="60" rx="8" fill={active ? "#8fd5ff" : "#4a5068"} />
                  <rect x="32" y="32" width="36" height="36" rx="3" fill="#1c1c22" />
                  {/* 핀 */}
                  {[0, 1, 2, 3].map((i) => <rect key={i} x={28 + i * 12} y="10" width="4" height="10" fill={active ? "#8fd5ff" : "#4a5068"} />)}
                  {[0, 1, 2, 3].map((i) => <rect key={i} x={28 + i * 12} y="80" width="4" height="10" fill={active ? "#8fd5ff" : "#4a5068"} />)}
                  {[0, 1, 2, 3].map((i) => <rect key={i} x="10" y={28 + i * 12} width="10" height="4" fill={active ? "#8fd5ff" : "#4a5068"} />)}
                  {[0, 1, 2, 3].map((i) => <rect key={i} x="80" y={28 + i * 12} width="10" height="4" fill={active ? "#8fd5ff" : "#4a5068"} />)}
                </svg>
                <div style={{ fontSize: 56, fontWeight: 900, color: active ? "#fff" : "#8fa5c7", marginTop: 12, lineHeight: 1 }}>{c.name}</div>
                <div style={{ fontSize: 16, color: active ? "#8fd5ff" : "#6a7da0", marginTop: 4 }}>{c.year}</div>
                <div style={{ fontSize: 20, color: active ? "#c8a8ff" : "#5a6d96", marginTop: 8, fontFeatureSettings: "'tnum'", fontWeight: 700 }}>{c.boost.toFixed(1)}× boost</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 28, color: "#c5d7f0" }}>M1 ~ M4 맥북 → MLX 로 <span style={{ color: "#8fd5ff", fontWeight: 900 }}>풀 스펙 해방</span></div>
      </div>
    </AbsoluteFill>
  );
};
