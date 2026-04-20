// anxious-15 — 부정 담론 3개 (말풍선)
// "토큰 제한 때문에 못 쓰겠다 / 이번 버전 바보가 됐다 / 왜 이걸 못하냐"
// 의도: 3개 실제 댓글형 말풍선. 비대칭 위치, 다른 폰트 웨이트/글씨체.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const CORAL = "#ff7a7a";
const AMBER = "#ffbe5c";
const INK = "#08060D";

const COMMENTS = [
  { text: "토큰 제한 때문에 못 쓰겠다", handle: "@dev_angry", score: "↑ 3.2k", xPercent: 0.10, yPercent: 0.18, rot: -2, color: CORAL, fontSize: 48 },
  { text: "이번 버전 바보가 됐네", handle: "@ai_watcher", score: "↑ 5.8k", xPercent: 0.54, yPercent: 0.42, rot: 1.5, color: AMBER, fontSize: 54 },
  { text: "왜 이걸 못하냐?", handle: "@frustrated", score: "↑ 9.4k", xPercent: 0.18, yPercent: 0.66, rot: -1, color: CORAL, fontSize: 62 },
];

export const AnxiousScene15: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.12], { extrapolateRight: "clamp" });
  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,122,122,0.06) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/terminal-command.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(10px) brightness(0.45) saturate(0.4) hue-rotate(-20deg)" }}
        volume={0}
      />
      {/* 우상단 kicker */}
      <div style={{ position: "absolute", right: 200, top: 130, display: "flex", alignItems: "center", gap: 12, opacity: kickerOp, fontSize: 17, letterSpacing: "0.4em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        ACTUAL COMMENTS · INTERNET
        <span style={{ width: 36, height: 1, background: CORAL }} />
      </div>

      {/* 3 말풍선 */}
      {COMMENTS.map((c, i) => {
        const start = 16 + i * 30;
        const pop = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 130 }, from: 0, to: 1 });
        const op = interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp" });
        const x = 200 + c.xPercent * 1520;
        const y = 200 + c.yPercent * 700;
        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            transform: `rotate(${c.rot}deg) scale(${pop})`,
            transformOrigin: "left top",
            opacity: op,
          }}>
            {/* 말풍선 */}
            <div style={{
              position: "relative",
              padding: "30px 40px",
              background: "rgba(22,18,26,0.92)",
              border: `2px solid ${c.color}`,
              borderRadius: 18,
              boxShadow: `0 0 30px rgba(255,122,122,0.2)`,
              maxWidth: 720,
            }}>
              <div style={{
                fontSize: c.fontSize,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
              }}>
                "{c.text}"
              </div>
              {/* handle + score */}
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, letterSpacing: "0.08em" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{c.handle}</span>
                <span style={{ color: c.color, fontWeight: 700 }}>{c.score}</span>
              </div>
              {/* tail */}
              <div style={{
                position: "absolute",
                left: 60,
                bottom: -18,
                width: 0,
                height: 0,
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: `18px solid ${c.color}`,
              }} />
            </div>
          </div>
        );
      })}

      {/* 하단 밴드 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontSize: 22, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
        모델이 이 모든 것을 <span style={{ color: CORAL, fontWeight: 700 }}>흡수합니다.</span>
      </div>
    </AbsoluteFill>
  );
};
