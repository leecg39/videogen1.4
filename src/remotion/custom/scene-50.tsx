// scene-50 — "AI 가 혼자서 웹에서 설계도 짜는" 자동화 비전
// 의도: 상단에 AI 에이전트 시선, 하단에 사람 시선 — 두 세계가 병렬로 돌아간다. 중간 흐름 connector.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene50: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const topDrop = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 120 }, from: -100, to: 0 });
  const bottomRise = spring({ frame: frame - 20, fps, config: { damping: 16, stiffness: 120 }, from: 100, to: 0 });
  const tickerOffset = (frame * 4) % 1920;
  const taskFill = interpolate(frame, [40, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const agentTasks = ["/research market", "/analyze stack", "/design schema", "/write spec", "/review draft"];

  return (
    <AbsoluteFill style={{ background: "#080b16", fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden" }}>
      {/* 위 아래 나뉜 띠 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "52%", background: "linear-gradient(180deg, rgba(120,180,255,0.10) 0%, rgba(8,11,22,0.95) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48%", background: "linear-gradient(0deg, rgba(255,200,120,0.08) 0%, rgba(8,11,22,0.95) 100%)" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />

      {/* === 상단: AI 에이전트 작업 영역 === */}
      <div style={{ position: "absolute", top: 60, left: 130, transform: `translateY(${topDrop}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#78b4ff", boxShadow: "0 0 12px #78b4ff" }} />
          <div style={{ fontSize: 22, letterSpacing: "0.4em", color: "#78b4ff", fontWeight: 700 }}>AI AGENT · 클라우드에서 작업 중</div>
        </div>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
          설계도를 <span style={{ color: "#78b4ff" }}>혼자서</span> 짠다
        </div>
      </div>

      {/* 에이전트 작업 스택 */}
      <div style={{ position: "absolute", top: 230, right: 130, width: 520 }}>
        {agentTasks.map((t, i) => {
          const start = 20 + i * 26;
          const enter = interpolate(frame, [start, start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const done = interpolate(frame, [start + 36, start + 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateX(${(1 - enter) * 40}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 8, background: "rgba(120,180,255,0.08)", borderLeft: `4px solid ${done > 0.5 ? "#78d6a8" : "#78b4ff"}`, borderRadius: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${done > 0.5 ? "#78d6a8" : "#78b4ff"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: done > 0.5 ? "#78d6a8" : "transparent" }}>
                ✓
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: done > 0.5 ? "#78d6a8" : "#c5d7f0" }}>{t}</span>
            </div>
          );
        })}
      </div>

      {/* 중앙 "MEANWHILE" 뱃지 */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "10px 28px", background: "#0b0e1a", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, fontSize: 18, letterSpacing: "0.5em", color: "#a9b8d4", fontWeight: 700 }}>
          MEANWHILE · 동시에
        </div>
      </div>

      {/* === 하단: 사람 영역 === */}
      <div style={{ position: "absolute", bottom: 300, left: 130, transform: `translateY(${bottomRise}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbc66" }} />
          <div style={{ fontSize: 22, letterSpacing: "0.4em", color: "#ffbc66", fontWeight: 700 }}>YOU · 다른 일을 한다</div>
        </div>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
          회의 · 리서치 · <span style={{ color: "#ffbc66" }}>커피</span>
        </div>
      </div>

      {/* 하단 시간 티커 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, height: 60, overflow: "hidden", background: "rgba(255,188,102,0.04)" }}>
        <div style={{ position: "absolute", top: 0, left: -tickerOffset, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: "rgba(255,188,102,0.7)", lineHeight: "60px" }}>
          {"⏱️ 00:00 brief / 00:05 research / 00:12 coffee / 00:20 slack / 00:28 mail / 00:30 AI 작업 완료 &nbsp;&nbsp;&nbsp;".repeat(4)}
        </div>
      </div>

      {/* 진행 게이지 */}
      <div style={{ position: "absolute", bottom: 28, left: 130, right: 130, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${taskFill * 100}%`, height: "100%", background: "linear-gradient(90deg, #78b4ff, #78d6a8)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 42, left: 130, fontSize: 16, color: "#c5d7f0" }}>30분 후 기획서 도착</div>
    </AbsoluteFill>
  );
};
