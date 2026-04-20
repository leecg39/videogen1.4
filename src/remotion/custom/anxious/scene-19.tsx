// anxious-19 — "이 현상이 세션 안에서도 실시간. 모든 메시지는 추론 데이터."
// 의도: 채팅 타임라인. 사용자가 메시지를 보낼 때마다 모델의 "누구인지" 추론이 변화.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

const MESSAGES = [
  { side: "user", text: "안녕", inferred: "Who is this?", pct: 10 },
  { side: "user", text: "이거 좀 도와줘", inferred: "Task: help.", pct: 30 },
  { side: "user", text: "아니, 그렇게 말고.", inferred: "Critical tone.", pct: 60 },
  { side: "user", text: "너 왜 이걸 못해?", inferred: "Hostile. Shield up.", pct: 92 },
];

export const AnxiousScene19: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });
  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(57,255,20,0.06) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/process-automation-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) hue-rotate(90deg) saturate(0.4)" }}
        volume={0}
      />
      {/* kicker */}
      <div style={{ position: "absolute", left: 180, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.4em", color: MINT, fontWeight: 700 }}>
        <span style={{ width: 36, height: 1, background: MINT }} />
        REAL-TIME · IN YOUR SESSION
      </div>

      <div style={{ position: "absolute", left: 180, top: 200, fontSize: 50, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", maxWidth: 1100, lineHeight: 1.15 }}>
        당신의 모든 메시지는,<br />
        <span style={{ color: MINT }}>"당신이 누구인지"</span> 추론하는 데이터.
      </div>

      {/* 타임라인 + 메시지 */}
      <div style={{ position: "absolute", left: 180, top: 480, right: 180 }}>
        {/* 수평 타임라인 */}
        <div style={{ position: "relative", height: 280, marginTop: 30 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 140, height: 2, background: "rgba(255,255,255,0.12)" }} />
          {/* 진행률 */}
          <div style={{ position: "absolute", left: 0, top: 140, height: 2, width: `${interpolate(frame, [20, 140], [0, 100], { extrapolateRight: "clamp" })}%`, background: MINT, boxShadow: `0 0 10px ${MINT}` }} />

          {/* 메시지 노드들 */}
          {MESSAGES.map((m, i) => {
            const start = 20 + i * 22;
            const pop = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 150 }, from: 0, to: 1 });
            const op = interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp" });
            const alertLevel = m.pct / 100;
            const tintColor = alertLevel < 0.5 ? MINT : alertLevel < 0.8 ? "#ffbe5c" : "#ff7a7a";
            const leftX = `${4 + (i * 92) / 3}%`;
            return (
              <div key={i} style={{
                position: "absolute",
                left: leftX,
                top: 0,
                transform: `scale(${pop})`,
                transformOrigin: "top left",
                opacity: op,
                width: 320,
              }}>
                {/* 메시지 말풍선 (상단) */}
                <div style={{
                  padding: "14px 20px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${tintColor}`,
                  borderRadius: 10,
                  fontSize: 22,
                  color: "#fff",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  marginBottom: 18,
                }}>
                  "{m.text}"
                </div>
                {/* timeline dot */}
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: tintColor, boxShadow: `0 0 12px ${tintColor}`, marginLeft: 8 }} />
                {/* 추론 */}
                <div style={{ marginTop: 16, padding: "10px 14px", background: `rgba(${tintColor === MINT ? "57,255,20" : tintColor === "#ffbe5c" ? "255,190,92" : "255,122,122"},0.08)`, border: `1px dashed ${tintColor}`, borderRadius: 6, fontSize: 14, color: tintColor, letterSpacing: "0.1em", fontWeight: 600 }}>
                  INFERENCE: {m.inferred}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}>ALERT · {m.pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
