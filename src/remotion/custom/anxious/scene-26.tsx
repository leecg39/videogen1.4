// anxious-26 — 팁 ④ 꾸짖지 마라. 경고 반복 + 사과 ripple.
// 의도: 중앙에 꾸짖는 말, 주변으로 사과 반복이 퍼져나가는 ripple 효과.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene26: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.09], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const scoldIn = spring({ frame: frame - 40, fps, config: { damping: 15, stiffness: 140 }, from: 0, to: 1 });

  // 10개 사과 ripples
  const apologies = Array.from({ length: 10 });

  const footerOp = interpolate(frame, [200, 240], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,122,122,0.13) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/server-room.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.38) hue-rotate(-15deg) saturate(0.4)" }}
        volume={0}
      />
      {/* 우상 번호 */}
      <div style={{ position: "absolute", right: 160, top: 150, transform: `scale(${numPop})`, transformOrigin: "top right", textAlign: "right" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.5em", color: CORAL, fontWeight: 700, marginBottom: 10 }}>TIP · 04</div>
        <div style={{ fontSize: 220, fontWeight: 900, color: CORAL, letterSpacing: "-0.06em", lineHeight: 0.85, textShadow: `0 0 40px rgba(255,122,122,0.3)` }}>04</div>
      </div>

      {/* 좌측 제목 */}
      <div style={{ position: "absolute", left: 160, top: 200, width: 900, opacity: titleOp }}>
        <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: "-0.028em", lineHeight: 1.1, color: "#fff" }}>
          실수했을 때<br />
          <span style={{ color: CORAL }}>꾸짖지 마라.</span>
        </div>
      </div>

      {/* 중앙 꾸짖는 말 */}
      <div style={{ position: "absolute", left: "50%", top: 580, transform: `translate(-50%, 0) scale(${scoldIn})` }}>
        <div style={{ padding: "26px 50px", background: "rgba(40,18,18,0.85)", border: `2px solid ${CORAL}`, borderRadius: 14, boxShadow: `0 0 50px rgba(255,122,122,0.45)` }}>
          <div style={{ fontSize: 50, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em" }}>
            "이 <span style={{ color: CORAL }}>멍청한 봇</span>, 또야?"
          </div>
        </div>
      </div>

      {/* ripple 사과들 (좌/우 배경에 흩뿌리기) */}
      {apologies.map((_, i) => {
        const start = 60 + i * 8;
        const op = interpolate(frame, [start, start + 20, start + 60], [0, 0.5, 0], { extrapolateRight: "clamp" });
        const y = interpolate(frame, [start, start + 80], [0, -150], { extrapolateRight: "clamp" });
        const left = (i % 2 === 0 ? 120 : 1550) + (i * 20) % 200;
        const top = 300 + (i * 60) % 460;
        const rot = (i % 2 === 0 ? -4 : 4) + (i % 3) * 2;
        return (
          <div key={i} style={{
            position: "absolute",
            left, top,
            fontSize: 20,
            color: "rgba(255,122,122,0.45)",
            fontStyle: "italic",
            transform: `rotate(${rot}deg) translateY(${y}px)`,
            opacity: op,
            pointerEvents: "none",
          }}>
            죄송합니다...
          </div>
        );
      })}

      {/* 하단 footer */}
      <div style={{ position: "absolute", left: "50%", bottom: 140, transform: "translate(-50%, 0)", opacity: footerOp, fontSize: 24, color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em", textAlign: "center" }}>
        다음 열 번의 응답이 <span style={{ color: CORAL, fontWeight: 700 }}>전부 사과로</span> 시작될 겁니다.
      </div>
    </AbsoluteFill>
  );
};
