// scene-75 — "오늘의 바이브 뉴스 여기까지입니다"
// 의도: 엔드 크레딧 시작. 4 개 섹션 요약 roll + 브랜드 사인.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const SUMMARY = [
  { n: "01", label: "클로드 코드 사용량 바닥", color: "#ff6b3d" },
  { n: "02", label: "맥북 로컬 AI 부상", color: "#7dffb0" },
  { n: "03", label: "울트라 플랜 · 기획 위임", color: "#8fd5ff" },
  { n: "04", label: "GPT6 4/14 루머", color: "#c8a8ff" },
];

export const Scene75: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const closeOpacity = interpolate(frame, [0, 26], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050711 0%, #0a0e1c 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      {/* 배경 별 — 조용한 마무리 */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = (i * 131) % 1920;
        const y = (i * 211) % 1080;
        const twinkle = 0.3 + 0.5 * Math.abs(Math.sin((frame + i * 30) / 40));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: twinkle }} />;
      })}

      {/* 상단 closing */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity: closeOpacity }}>
        <div style={{ fontSize: 24, color: "#7dffb0", letterSpacing: "0.5em", fontWeight: 700 }}>THAT'S ALL FOR TODAY</div>
        <div style={{ fontSize: 46, color: "#fff", marginTop: 12, fontWeight: 700 }}>
          오늘의 <span style={{ color: "#7dffb0" }}>바이브 뉴스</span> 요약
        </div>
      </div>

      {/* 4 개 요약 카드 roll-in */}
      <div style={{ position: "absolute", top: 280, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 14, padding: "0 200px" }}>
        {SUMMARY.map((item, i) => {
          const delay = 20 + i * 16;
          const enter = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              opacity: enter,
              transform: `translateX(${(1 - enter) * -60}px)`,
              padding: "24px 30px",
              background: `linear-gradient(90deg, ${item.color}11 0%, transparent 85%)`,
              borderLeft: `6px solid ${item.color}`,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}>
              <div style={{ fontSize: 68, fontWeight: 900, color: item.color, fontFeatureSettings: "'tnum'", lineHeight: 0.9, minWidth: 120 }}>{item.n}</div>
              <div style={{ fontSize: 40, color: "#fff", fontWeight: 600 }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* 하단 브랜드 */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "14px 28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999 }}>
          <span style={{ fontSize: 14, letterSpacing: "0.5em", color: "#7dffb0", fontWeight: 700 }}>VIBE LABS</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#7dffb0" }} />
          <span style={{ fontSize: 14, letterSpacing: "0.3em", color: "#c5d7f0" }}>랩장 &middot; weekly news</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
