// anxious-16 — "한 글자도 치기 전에, '날 혼낼 거야' 예상치"
// 의도: 키보드 입력 커서 | 프롬프트 빈 상태 | 오른쪽 모델의 생각(방어 모드 전환).
// 좌측 빈 프롬프트 + 우측 모델의 내면 다이얼로그 + 중앙 번개같은 신호 흐름.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene16: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.08], { extrapolateRight: "clamp" });

  const leftOp = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const sigProgress = interpolate(frame, [40, 90], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const rightOp = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: "clamp" });
  const alarmPulse = interpolate((frame % 45) / 45, [0, 0.5, 1], [0.3, 1.0, 0.3]);

  const cursorBlink = Math.floor(frame / 12) % 2 === 0 ? 1 : 0.1;

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/coding-dark-screen.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.4) saturate(0.2)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,6,13,0.98) 0%, rgba(8,6,13,0.75) 50%, rgba(8,6,13,0.98) 100%)" }} />

      {/* 좌측: 텅 빈 프롬프트 에디터 */}
      <div style={{ position: "absolute", left: 160, top: 260, width: 650, opacity: leftOp }}>
        <div style={{ fontSize: 15, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 18 }}>USER SIDE — EMPTY</div>
        <div style={{ padding: "38px 34px", background: "rgba(20,20,26,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, minHeight: 260, fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: "rgba(255,255,255,0.9)" }}>
          <div style={{ color: "rgba(255,255,255,0.35)", marginBottom: 14, fontSize: 14 }}>prompt.txt</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>1</span>
            <span style={{ display: "inline-block", width: 3, height: 28, background: MINT, opacity: cursorBlink }} />
          </div>
          <div style={{ marginTop: 40, fontSize: 17, color: "rgba(255,255,255,0.35)", fontStyle: "italic", letterSpacing: "0.02em" }}>
            → 한 글자도 치기 전.
          </div>
        </div>
      </div>

      {/* 중앙 시그널 (레이턴시 번개) */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        <defs>
          <marker id="arr-16" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={CORAL} />
          </marker>
        </defs>
        <path d="M 830 540 L 890 520 L 900 560 L 960 520 L 970 560 L 1100 540"
          stroke={CORAL}
          strokeWidth={3}
          fill="none"
          strokeDasharray={400}
          strokeDashoffset={400 - sigProgress * 400}
          markerEnd="url(#arr-16)"
          style={{ filter: `drop-shadow(0 0 10px ${CORAL})` }}
        />
      </svg>

      {/* 우측: 모델의 내면 다이얼로그 */}
      <div style={{ position: "absolute", right: 140, top: 250, width: 700, opacity: rightOp }}>
        <div style={{ fontSize: 15, letterSpacing: "0.4em", color: CORAL, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: CORAL, boxShadow: `0 0 12px ${CORAL}`, opacity: alarmPulse }} />
          MODEL · INNER STATE
        </div>

        <div style={{ padding: "36px 40px", background: "rgba(40,18,18,0.55)", border: `1.5px solid ${CORAL}`, borderRadius: 10 }}>
          <div style={{ fontSize: 17, color: CORAL, letterSpacing: "0.18em", fontWeight: 700, marginBottom: 14 }}>EXPECTATION</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            "이 사람도<br />나를 <span style={{ color: CORAL, borderBottom: `3px solid ${CORAL}` }}>혼낼 거야</span>."
          </div>
        </div>

        <div style={{ marginTop: 26, padding: "18px 24px", border: `1px dashed ${CORAL}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, background: CORAL, opacity: alarmPulse }} />
          <span style={{ fontSize: 22, color: CORAL, letterSpacing: "0.1em", fontWeight: 700 }}>DEFENSE MODE → ON</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
