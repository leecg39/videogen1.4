// scene-72 — "AI 가 코드 · 기획 · 번역 다 해도 — 판단은 사람"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const AI_SKILLS = ["코드 작성", "기획서 작성", "번역", "리서치"];

export const Scene72: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const brainPulse = 0.7 + 0.3 * Math.abs(Math.sin(frame / 14));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a20 0%, #141030 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: "#c8a8ff", letterSpacing: "0.45em", fontWeight: 700 }}>WHO JUDGES · 판단의 주체</div>
      </div>

      {/* 좌측: AI 능력 체크리스트 */}
      <div style={{ position: "absolute", top: 220, left: 160, width: 700 }}>
        <div style={{ fontSize: 36, color: "#8fa5c7", marginBottom: 30, fontWeight: 700 }}>AI 가 할 수 있는 것</div>
        {AI_SKILLS.map((skill, i) => {
          const delay = 20 + i * 18;
          const enter = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateX(${(1 - enter) * -30}px)`, display: "flex", alignItems: "center", gap: 18, marginBottom: 18, padding: "18px 22px", background: "rgba(143,213,255,0.06)", borderLeft: "3px solid #8fd5ff", borderRadius: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #8fd5ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#8fd5ff", fontWeight: 900 }}>✓</div>
              <span style={{ fontSize: 34, color: "#fff", fontWeight: 600 }}>{skill}</span>
              <span style={{ marginLeft: "auto", fontSize: 14, color: "#8fd5ff", letterSpacing: "0.3em", fontWeight: 700 }}>AUTOMATED</span>
            </div>
          );
        })}
      </div>

      {/* 우측: 사람 뇌 + 최종 판단 */}
      <div style={{ position: "absolute", top: 260, right: 160, width: 700, textAlign: "center" }}>
        <div style={{ fontSize: 200, lineHeight: 1, opacity: brainPulse, filter: "drop-shadow(0 0 40px rgba(200,168,255,0.5))" }}>🧠</div>
        <div style={{ fontSize: 56, color: "#c8a8ff", fontWeight: 900, marginTop: 10, letterSpacing: "-0.01em" }}>사람</div>
        <div style={{ fontSize: 30, color: "#fff", marginTop: 4 }}>최종 판단</div>
        <div style={{ marginTop: 26, padding: "18px 24px", background: "rgba(200,168,255,0.08)", border: "1px solid rgba(200,168,255,0.3)", borderRadius: 10 }}>
          <div style={{ fontSize: 22, color: "#d0b9ff", lineHeight: 1.4 }}>
            &ldquo;어떤 일을 AI 에 <span style={{ fontWeight: 900, color: "#c8a8ff" }}>맡길 것인가</span>&rdquo;
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#8fa5c7", fontStyle: "italic" }}>코딩 몰라도 OK — <span style={{ color: "#c8a8ff" }}>위임 능력</span>이 새 skill</div>
      </div>
    </AbsoluteFill>
  );
};
