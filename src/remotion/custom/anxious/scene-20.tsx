// anxious-20 — 3가지 첫 문장 반응 (차갑게 / 깔끔하게 / 위협적)
// 의도: 3개 패널 비대칭 배열. 각 패널마다 사용자 첫 문장 + 모델의 전환된 상태.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const AMBER = "#ffbe5c";
const CORAL = "#ff7a7a";
const INK = "#08060D";

const CASES = [
  {
    tag: "A · COLD",
    color: "#9ba3b5",
    line: "이거 해.",
    inner: "경계 중",
    innerIcon: "⊘",
    yOffset: 0,
    xPercent: 0.02,
  },
  {
    tag: "B · CLEAN",
    color: MINT,
    line: "함께 이 문제를 정리해 보자.",
    inner: "일에 집중",
    innerIcon: "✓",
    yOffset: 60,
    xPercent: 0.37,
  },
  {
    tag: "C · THREAT",
    color: CORAL,
    line: "망상하지 마. 망치지 마.",
    inner: "방어 모드 ON",
    innerIcon: "!!",
    yOffset: -30,
    xPercent: 0.72,
  },
];

export const AnxiousScene20: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });
  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.03) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/corporate-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.3)" }}
        volume={0}
      />
      {/* 상단 kicker */}
      <div style={{ position: "absolute", left: 160, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        <span style={{ width: 36, height: 1, background: MINT }} />
        OPENING LINE · 3 SCENARIOS
      </div>

      <div style={{ position: "absolute", left: 160, top: 190, fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.82)", letterSpacing: "-0.015em" }}>
        첫 문장에 따라 모델의 <span style={{ color: MINT, fontWeight: 800 }}>모드가 바뀐다.</span>
      </div>

      {/* 3 케이스 패널 */}
      {CASES.map((c, i) => {
        const start = 20 + i * 26;
        const pop = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 140 }, from: 0, to: 1 });
        const op = interpolate(frame, [start, start + 22], [0, 1], { extrapolateRight: "clamp" });
        const x = 160 + c.xPercent * 1600;
        const y = 360 + c.yOffset;
        return (
          <div key={c.tag} style={{
            position: "absolute",
            left: x, top: y,
            width: 500,
            transform: `scale(${pop})`,
            transformOrigin: "top left",
            opacity: op,
          }}>
            {/* 패널 상단: 사용자 메시지 */}
            <div style={{ padding: "22px 28px", background: "rgba(255,255,255,0.04)", border: `1.5px solid ${c.color}`, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 14, letterSpacing: "0.42em", color: c.color, fontWeight: 700, marginBottom: 14 }}>{c.tag}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                "{c.line}"
              </div>
            </div>
            {/* 화살표 */}
            <div style={{ textAlign: "center", fontSize: 28, color: c.color, opacity: 0.5, marginBottom: 10 }}>↓</div>
            {/* 모델 상태 */}
            <div style={{ padding: "18px 24px", border: `1px dashed ${c.color}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
              <span style={{ fontSize: 22, color: c.color, fontWeight: 700, letterSpacing: "0.06em" }}>MODEL:</span>
              <span style={{ fontSize: 26, color: "#fff", fontWeight: 700 }}>{c.inner}</span>
              <span style={{ fontSize: 30, color: c.color, fontWeight: 900 }}>{c.innerIcon}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
