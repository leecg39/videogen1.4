// scene-06 — "대화 1번에 10% 날아감. 질문 1번에 21% → 100% 된 증언."
// 의도: 구체 수치 충격 2발. 좌측 거대 10% + 우측 점프 21→100 시퀀스.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const RED = "#ff3352";
const AMBER = "#ff9b3d";

export const Scene06: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 24], [0, 0.12], { extrapolateRight: "clamp" });

  const n1 = Math.round(interpolate(frame, [14, 64], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const n1Pop = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 160 }, from: 0.5, to: 1 });

  const divGrow = interpolate(frame, [70, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const n2Start = Math.round(interpolate(frame, [110, 160], [0, 21], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const n2Jump = interpolate(frame, [170, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const n2End = Math.round(interpolate(frame, [200, 240], [21, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }));

  const shock = interpolate(frame, [200, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shockDecay = interpolate(frame, [220, 260], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = n2Jump > 0 ? (Math.sin(frame * 2) * 3 * shockDecay) : 0;

  return (
    <AbsoluteFill style={{ background: "#0a0608", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,6,8,0.98) 0%, rgba(10,6,8,1) 100%)", opacity: bgIn + 0.85 }} />

      <div style={{ position: "absolute", top: 120, left: 140, right: 140, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <span style={{ fontSize: 18, letterSpacing: "0.4em", color: RED, fontWeight: 800 }}>CASE REPORTS</span>
          <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>사용자 증언 2건</span>
        </div>
        <span style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>vibe-labs.members</span>
      </div>

      <div style={{ position: "absolute", top: 230, left: 140, width: 650, transform: `translateY(${shake}px)` }}>
        <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>CASE 01 · 한 번의 대화</div>
        <div style={{ fontSize: 240, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.05em", marginTop: 10, fontFeatureSettings: "'tnum'", color: AMBER, textShadow: `0 20px 70px ${AMBER}44`, transform: `scale(${n1Pop})`, transformOrigin: "top left" }}>
          {n1}<span style={{ fontSize: 100, marginLeft: 8, color: "#fff", fontWeight: 700 }}>%</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 28, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em" }}>
          대화 한 번에 토큰이 <span style={{ color: AMBER, fontWeight: 700 }}>날아갔다</span>.
        </div>
      </div>

      <div style={{ position: "absolute", top: 260, bottom: 180, left: "50%", width: 1, background: "rgba(255,255,255,0.14)", transform: `scaleY(${divGrow})`, transformOrigin: "top" }} />
      <div style={{ position: "absolute", top: "54%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", fontWeight: 700, background: "#0a0608", padding: "4px 14px", opacity: divGrow }}>그리고</div>

      <div style={{ position: "absolute", top: 230, right: 100, width: 680 }}>
        <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>CASE 02 · 질문 한 번</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 10 }}>
          <div style={{ fontSize: 110, fontWeight: 800, color: "rgba(255,255,255,0.35)", fontFeatureSettings: "'tnum'", letterSpacing: "-0.03em" }}>
            {n2Start}<span style={{ fontSize: 48, marginLeft: 4 }}>%</span>
          </div>
          <div style={{ position: "relative", width: 80, opacity: n2Jump }}>
            <svg viewBox="0 0 80 30" width="80" height="30">
              <path d="M 2 15 L 70 15" stroke={RED} strokeWidth="4" strokeLinecap="round" />
              <path d="M 60 6 L 78 15 L 60 24" stroke={RED} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 240, fontWeight: 900, color: RED, fontFeatureSettings: "'tnum'", letterSpacing: "-0.05em", lineHeight: 0.9, textShadow: `0 0 ${shock * 40}px ${RED}`, transform: `scale(${1 + shock * 0.06})`, transformOrigin: "center" }}>
            {n2End}<span style={{ fontSize: 100, marginLeft: 8, color: "#fff" }}>%</span>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 26, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em" }}>
          <span style={{ color: RED, fontWeight: 700 }}>21 → 100.</span> 질문 한 번에 한도가 꽉 찼다는 증언.
        </div>
      </div>
    </AbsoluteFill>
  );
};
