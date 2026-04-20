// anxious-24 — 팁 ② 반박해도 된다. 거대 따옴표 + 허락 한 줄.
// 의도: 핵심 "한 줄"의 무게감. 중앙 큰 문장 + 하단 메타 설명.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene24: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });

  // 따옴표
  const lqOp = interpolate(frame, [30, 60], [0, 0.3], { extrapolateRight: "clamp" });
  const rqOp = interpolate(frame, [100, 130], [0, 0.3], { extrapolateRight: "clamp" });

  // 본 문장
  const TEXT = "더 나은 관점이 보이면 반박해 주세요.";
  const charStart = 40;
  const charPerFrame = 1.2;
  const visible = Math.min(TEXT.length, Math.max(0, (frame - charStart) * charPerFrame));

  const antiOp = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });
  const footerOp = interpolate(frame, [200, 240], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(57,255,20,0.10) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/server-room-data-center-dark.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.42) hue-rotate(80deg) saturate(0.45)" }}
        volume={0}
      />
      {/* 좌상 번호 */}
      <div style={{ position: "absolute", left: 140, top: 140, transform: `scale(${numPop})`, transformOrigin: "top left", display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontSize: 14, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>TIP</span>
        <span style={{ fontSize: 180, fontWeight: 900, color: MINT, letterSpacing: "-0.05em", lineHeight: 0.85, textShadow: `0 0 40px rgba(57,255,20,0.3)` }}>02</span>
        <span style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>— 반박 허락</span>
      </div>

      {/* 큰 따옴표 열고 */}
      <div style={{ position: "absolute", left: 180, top: 300, fontSize: 320, color: MINT, lineHeight: 0.8, fontFamily: "'Georgia', serif", opacity: lqOp }}>"</div>

      {/* 중앙 본 문장 */}
      <div style={{ position: "absolute", left: 280, right: 280, top: 440, textAlign: "center" }}>
        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.32, letterSpacing: "-0.02em", color: "#fff" }}>
          {TEXT.slice(0, Math.floor(visible))}
          {visible < TEXT.length && <span style={{ color: MINT, opacity: 0.7 }}>▋</span>}
        </div>
      </div>

      {/* 큰 따옴표 닫기 */}
      <div style={{ position: "absolute", right: 180, top: 620, fontSize: 320, color: MINT, lineHeight: 0.3, fontFamily: "'Georgia', serif", opacity: rqOp }}>"</div>

      {/* anti-sycophancy 명시 */}
      <div style={{ position: "absolute", left: "50%", top: 780, transform: "translate(-50%, 0)", opacity: antiOp, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ padding: "12px 26px", border: `1px solid rgba(255,255,255,0.3)`, borderRadius: 999, fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.72)" }}>DEFAULT: 순응</div>
        <span style={{ fontSize: 24, color: MINT }}>→</span>
        <div style={{ padding: "12px 26px", background: `rgba(57,255,20,0.1)`, border: `1.5px solid ${MINT}`, borderRadius: 999, fontSize: 18, letterSpacing: "0.3em", color: MINT, fontWeight: 700 }}>OVERRIDE: 반박 가능</div>
      </div>

      {/* footer */}
      <div style={{ position: "absolute", left: "50%", bottom: 140, transform: "translate(-50%, 0)", opacity: footerOp, fontSize: 22, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>
        한 줄이 없으면, 클로드는 <span style={{ color: MINT, fontWeight: 600 }}>작가가 아닌 필경사</span>가 된다.
      </div>
    </AbsoluteFill>
  );
};
