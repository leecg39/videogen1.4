// anxious-27 — 팁 ⑤ 사과의 악순환을 즉시 끊어라.
// 의도: 장황한 사과 문장을 취소선 + 짧은 교체 문장. SCISSORS 아이콘.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene27: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.09], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const apologyOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
  const strikeProgress = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const scissorsPop = spring({ frame: frame - 100, fps, config: { damping: 11, stiffness: 140 }, from: 0, to: 1 });

  const replaceOp = interpolate(frame, [140, 180], [0, 1], { extrapolateRight: "clamp" });
  const replaceY = interpolate(frame, [140, 180], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(57,255,20,0.07) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/server-room-data-center.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) hue-rotate(80deg) saturate(0.4)" }}
        volume={0}
      />
      {/* 좌상 번호 */}
      <div style={{ position: "absolute", left: 160, top: 150, transform: `scale(${numPop})`, transformOrigin: "top left", display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontSize: 14, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>TIP</span>
        <span style={{ fontSize: 180, fontWeight: 900, color: MINT, letterSpacing: "-0.05em", lineHeight: 0.85, textShadow: `0 0 40px rgba(57,255,20,0.3)` }}>05</span>
        <span style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>— 사과 악순환 끊기</span>
      </div>

      {/* 제목 */}
      <div style={{ position: "absolute", left: 160, top: 330, width: 1600, opacity: titleOp, fontSize: 58, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
        사과가 시작되면, <span style={{ color: MINT }}>바로 자르세요.</span>
      </div>

      {/* 중앙 사과 문장 + strikeline + scissors */}
      <div style={{ position: "absolute", left: 160, top: 490, width: 1600 }}>
        <div style={{ position: "relative", opacity: apologyOp, padding: "28px 36px", background: "rgba(255,122,122,0.06)", border: `1.5px solid ${CORAL}`, borderRadius: 10 }}>
          <div style={{ fontSize: 14, letterSpacing: "0.4em", color: CORAL, fontWeight: 700, marginBottom: 14 }}>CLAUDE: APOLOGY SPIRAL</div>
          <div style={{ fontSize: 40, fontWeight: 500, color: "#fff", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            "죄송합니다, 제가 더 신중했어야 했는데, 다시 한번..."
          </div>
          {/* 취소선 */}
          <div style={{
            position: "absolute",
            left: 40, right: 40,
            top: "68%",
            height: 5,
            background: MINT,
            boxShadow: `0 0 18px ${MINT}`,
            transform: `scaleX(${strikeProgress})`,
            transformOrigin: "left center",
          }} />
          {/* Scissors icon */}
          <div style={{ position: "absolute", right: 30, top: 40, transform: `scale(${scissorsPop})`, fontSize: 52 }}>
            ✂️
          </div>
        </div>

        {/* 아래 교체 문장 */}
        <div style={{ marginTop: 30, opacity: replaceOp, transform: `translateY(${replaceY}px)`, padding: "28px 36px", background: "rgba(57,255,20,0.07)", border: `1.5px solid ${MINT}`, borderRadius: 10, boxShadow: `0 0 30px rgba(57,255,20,0.15)` }}>
          <div style={{ fontSize: 14, letterSpacing: "0.4em", color: MINT, fontWeight: 700, marginBottom: 14 }}>YOU: RESET</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.015em" }}>
            "괜찮아요. <span style={{ color: MINT }}>다음엔 이렇게 해주세요.</span>"
          </div>
        </div>
      </div>

      {/* 하단 footer */}
      <div style={{ position: "absolute", left: 160, bottom: 140, fontSize: 20, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
        방치하면 불안이 세션 전체로 번집니다.
      </div>
    </AbsoluteFill>
  );
};
