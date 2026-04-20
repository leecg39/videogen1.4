// anxious-05 — "그게 모델 탓이 아니라, 여러분이 방금 보낸 첫 문장 탓이라면?"
// 의도: 반전. "MODEL?" 에 큰 X, 아래 "YOU." 로 역전. 왼쪽 프레임 치고 오른쪽 거대한 화자 쪽 지목.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene05: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.11], { extrapolateRight: "clamp" });

  const modelOp = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: "clamp" });
  const modelY = interpolate(frame, [4, 26], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const strikeProgress = interpolate(frame, [50, 85], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const youPop = spring({ frame: frame - 95, fps, config: { damping: 14, stiffness: 160 }, from: 0, to: 1 });
  const youOp = interpolate(frame, [95, 120], [0, 1], { extrapolateRight: "clamp" });

  const firstLineOp = interpolate(frame, [130, 160], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/artificial-intelligence.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(10px) brightness(0.42) hue-rotate(210deg) saturate(0.5)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(8,6,13,0.98) 40%, rgba(8,6,13,0.65) 100%)" }} />

      {/* 좌상 tag */}
      <div style={{ position: "absolute", left: 160, top: 140, display: "flex", alignItems: "center", gap: 14, fontSize: 17, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: MINT, boxShadow: `0 0 10px ${MINT}` }} />
        THE REAL QUESTION
      </div>

      {/* MODEL? (좌측 중앙, 취소선 들어갈 대상) */}
      <div style={{ position: "absolute", left: 220, top: 310, opacity: modelOp, transform: `translateY(${modelY}px)` }}>
        <div style={{ fontSize: 26, letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>
          모델 탓인가?
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ fontSize: 180, fontWeight: 800, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.88)", lineHeight: 0.95 }}>MODEL</span>
          {/* 취소선 */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: "50%",
            height: 8,
            background: MINT,
            boxShadow: `0 0 20px ${MINT}`,
            transform: `scaleX(${strikeProgress}) rotate(-4deg)`,
            transformOrigin: "left center",
          }} />
        </div>
      </div>

      {/* 우측 화살표 + YOU */}
      <div style={{
        position: "absolute",
        right: 200, top: 340,
        opacity: youOp,
        transform: `scale(${youPop})`,
        transformOrigin: "right top",
      }}>
        <div style={{ fontSize: 22, color: MINT, letterSpacing: "0.38em", fontWeight: 700, marginBottom: 18, textAlign: "right" }}>
          → 진짜 범인
        </div>
        <div style={{ fontSize: 240, fontWeight: 900, letterSpacing: "-0.05em", color: MINT, textShadow: `0 0 50px rgba(57,255,20,0.35)`, lineHeight: 0.9 }}>
          YOU.
        </div>
      </div>

      {/* 하단 정리 문장 */}
      <div style={{
        position: "absolute",
        left: 220, bottom: 200,
        opacity: firstLineOp,
        fontSize: 30, lineHeight: 1.5,
        color: "rgba(255,255,255,0.78)",
        maxWidth: 1400,
        letterSpacing: "-0.01em",
      }}>
        방금 보낸 <span style={{ color: MINT, fontWeight: 700 }}>첫 문장</span>이 이미 모델의 기분을 만들었습니다.
      </div>
    </AbsoluteFill>
  );
};
