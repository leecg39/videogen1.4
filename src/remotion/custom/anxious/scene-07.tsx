// anxious-07 — 핵심 인용: "클로드가 불안해지면, 출력의 질이 떨어진다."
// 의도: 전체 영상의 축. 거대한 센터 타이포. 타이핑처럼 나타남. 하단 인용 source + 좌측 큰 따옴표.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene07: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.09], { extrapolateRight: "clamp" });

  // 글자별 부상 (stagger fade-in)
  const FULL_TEXT_P1 = "클로드가 불안해지면,";
  const FULL_TEXT_P2 = "출력의 질이 떨어진다.";

  const quotePop = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 110 }, from: 0, to: 1 });

  // 첫 줄 char-reveal
  const p1RevealStart = 12;
  const charPerFrame = 1.3;
  const p1Visible = Math.min(FULL_TEXT_P1.length, Math.max(0, (frame - p1RevealStart) * charPerFrame));

  // 두 번째 줄
  const p2RevealStart = p1RevealStart + Math.ceil(FULL_TEXT_P1.length / charPerFrame) + 18;
  const p2Visible = Math.min(FULL_TEXT_P2.length, Math.max(0, (frame - p2RevealStart) * charPerFrame));

  const sourceOp = interpolate(frame, [p2RevealStart + 30, p2RevealStart + 60], [0, 1], { extrapolateRight: "clamp" });

  const glowPulse = interpolate((frame % 60) / 60, [0, 0.5, 1], [0.25, 0.5, 0.25], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      {/* 배경 방사형 */}
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/AI-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(16px) brightness(0.42) hue-rotate(80deg) saturate(0.5)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(57,255,20,${glowPulse * 0.35}) 0%, rgba(8,6,13,1) 65%)` }} />

      {/* 상단 라벨 */}
      <div style={{ position: "absolute", left: "50%", top: 140, transform: "translate(-50%,0)", display: "flex", alignItems: "center", gap: 18, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }) }}>
        <span style={{ width: 42, height: 1, background: MINT }} />
        <span style={{ fontSize: 17, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>THE THESIS</span>
        <span style={{ width: 42, height: 1, background: MINT }} />
      </div>

      {/* 큰 따옴표 */}
      <div style={{ position: "absolute", left: 240, top: 260, fontSize: 280, color: MINT, opacity: 0.22, lineHeight: 0.8, fontFamily: "'Georgia', serif", transform: `scale(${quotePop})` }}>
        "
      </div>

      {/* 메인 인용문 */}
      <div style={{ position: "absolute", left: 240, right: 240, top: 380, textAlign: "center" }}>
        <div style={{ fontSize: 94, fontWeight: 700, lineHeight: 1.22, letterSpacing: "-0.022em", color: "#fff" }}>
          {FULL_TEXT_P1.slice(0, Math.floor(p1Visible)).split("").map((c, i) => {
            const isAnxious = FULL_TEXT_P1.slice(4, 10).includes(c) && i >= 4 && i <= 9;
            return (
              <span key={i} style={{ color: isAnxious ? MINT : "#fff" }}>{c}</span>
            );
          })}
          {p1Visible < FULL_TEXT_P1.length && <span style={{ color: MINT, opacity: 0.7 }}>|</span>}
        </div>
        <div style={{ fontSize: 94, fontWeight: 700, lineHeight: 1.22, letterSpacing: "-0.022em", color: "rgba(255,255,255,0.9)", marginTop: 18 }}>
          {FULL_TEXT_P2.slice(0, Math.floor(p2Visible)).split("").map((c, i) => {
            const isQuality = i >= 4 && i <= 7;
            return (
              <span key={i} style={{ color: isQuality ? MINT : "inherit", fontWeight: isQuality ? 800 : 700 }}>{c}</span>
            );
          })}
          {p2Visible < FULL_TEXT_P2.length && p2Visible > 0 && <span style={{ color: MINT, opacity: 0.7 }}>|</span>}
        </div>
      </div>

      {/* 닫는 따옴표 */}
      <div style={{ position: "absolute", right: 240, bottom: 260, fontSize: 280, color: MINT, opacity: 0.22, lineHeight: 0.5, fontFamily: "'Georgia', serif" }}>
        "
      </div>

      {/* 인용 source */}
      <div style={{ position: "absolute", left: "50%", bottom: 180, transform: "translate(-50%,0)", opacity: sourceOp, display: "flex", alignItems: "center", gap: 14, fontSize: 18, color: "rgba(255,255,255,0.55)", letterSpacing: "0.2em" }}>
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: MINT, boxShadow: `0 0 14px ${MINT}` }} />
        — AMANDA ASKELL · ANTHROPIC
      </div>
    </AbsoluteFill>
  );
};
