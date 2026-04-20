// scene-60 — "OpenAI가 조용히 있기 힘들다 · Sora 포기 후 AI 집중"
// 의도: 시장 압력 메타포. 거대한 OpenAI 로고 + 점증하는 하단 경고 스트라이프 + "Sora 떠남" 슬래시 표시.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene60: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const logoSpin = spring({ frame, fps, config: { damping: 18, stiffness: 80 }, from: 0, to: 1 });
  const soraSlash = interpolate(frame, [34, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pressureFill = interpolate(frame, [48, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stackOpacity = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: "clamp" });

  const competitors = ["Claude Code · 울트라플랜", "Gemma 4 · 로컬 AI", "Github · 개발자 점유"];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 70% 30%, #1a0d0a 0%, #080508 80%)", fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden" }}>
      {/* 배경 격자 pressure */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }} viewBox="0 0 1920 1080">
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 96 + i * 96;
          return <line key={i} x1={x} y1={0} x2={x} y2={1080} stroke="#ff6b3d" strokeWidth={0.5} opacity={0.3} />;
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const y = 90 + i * 90;
          return <line key={i} x1={0} y1={y} x2={1920} y2={y} stroke="#ff6b3d" strokeWidth={0.5} opacity={0.2} />;
        })}
      </svg>

      {/* 좌측: OpenAI 로고 (cog 모양 + OAI 텍스트) */}
      <div style={{ position: "absolute", left: 120, top: 200, transform: `scale(${logoSpin}) rotate(${(1 - logoSpin) * 180}deg)`, opacity: logoSpin, transformOrigin: "center" }}>
        <svg width={460} height={460} viewBox="0 0 100 100">
          <g fill="none" stroke="#fff" strokeWidth="2">
            {Array.from({ length: 6 }).map((_, i) => (
              <path key={i} d="M 50 15 A 35 35 0 0 1 80 65" transform={`rotate(${i * 60} 50 50)`} opacity={0.85} />
            ))}
          </g>
          <circle cx="50" cy="50" r="8" fill="#ff6b3d" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 120, top: 680, fontSize: 36, color: "#ff6b3d", letterSpacing: "0.3em", fontWeight: 800 }}>OPEN&shy;AI</div>
      <div style={{ position: "absolute", left: 120, top: 720, fontSize: 22, color: "#d6a18a" }}>압력 받는 시장 리더</div>

      {/* 우측: 경쟁사 쌓아올리기 */}
      <div style={{ position: "absolute", right: 120, top: 190, width: 700, opacity: stackOpacity }}>
        <div style={{ fontSize: 22, color: "#ffb69a", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 18 }}>COMPETITORS · 조용히 놔두지 않는 상대</div>
        {competitors.map((c, i) => {
          const start = 90 + i * 18;
          const enter = interpolate(frame, [start, start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ transform: `translateY(${(1 - enter) * 60}px)`, opacity: enter, padding: "24px 28px", marginBottom: 12, background: "linear-gradient(90deg, rgba(255,107,61,0.12), rgba(255,107,61,0.03))", borderLeft: "4px solid #ff6b3d", fontSize: 32, color: "#fff", fontWeight: 600 }}>
              {c}
            </div>
          );
        })}
      </div>

      {/* 중앙: Sora 슬래시 */}
      <div style={{ position: "absolute", left: "38%", top: 130, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", padding: "8px 24px", fontSize: 30, color: "#777", border: "2px solid #555", borderRadius: 8 }}>
          Sora
          <div style={{ position: "absolute", left: -8, right: -8, top: "50%", height: 4, background: "#ff3b3b", transform: `translateY(-50%) scaleX(${soraSlash})`, transformOrigin: "left" }} />
        </div>
        <span style={{ fontSize: 22, color: "#a58a80" }}>서비스 포기 → AI 본진 집중</span>
      </div>

      {/* 하단 압력 게이지 */}
      <div style={{ position: "absolute", bottom: 130, left: 120, right: 120 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 20, color: "#ffb69a", letterSpacing: "0.3em" }}>MARKET PRESSURE</span>
          <span style={{ fontSize: 20, color: "#ff6b3d", fontFeatureSettings: "'tnum'", fontWeight: 700 }}>{Math.round(pressureFill * 100)}%</span>
        </div>
        <div style={{ height: 18, background: "rgba(255,107,61,0.1)", borderRadius: 9, overflow: "hidden", position: "relative" }}>
          <div style={{ width: `${pressureFill * 100}%`, height: "100%", background: "linear-gradient(90deg, #ffb347, #ff3b3b)", transition: "width 0.1s" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 34, fontWeight: 700, color: "#fff" }}>
          GPT6 공개 루머 → <span style={{ color: "#ff6b3d" }}>4월 14일 D-day</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
