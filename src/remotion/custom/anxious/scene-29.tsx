// anxious-29 — 팁 ⑦ 긴 세션에서 프레임 리셋 (칭찬의 힘)
// 의도: 중앙 칭찬 문장 + 주변으로 뻗어나가는 mint 파동(긍정 ripple). "다음 10개 응답 변화" 그래프.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene29: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const praiseIn = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });

  // 3 rings ripple
  const rings = [0, 1, 2];

  // 10 bar graph (next 10 responses)
  const bars = Array.from({ length: 10 });
  const barsOp = interpolate(frame, [130, 160], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 45%, rgba(57,255,20,0.16) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/artificial-intelligence-technology-futur.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.45) hue-rotate(80deg) saturate(0.5)" }}
        volume={0}
      />
      {/* 좌상 번호 */}
      <div style={{ position: "absolute", left: 140, top: 140, transform: `scale(${numPop})`, transformOrigin: "top left", display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontSize: 14, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>TIP</span>
        <span style={{ fontSize: 170, fontWeight: 900, color: MINT, letterSpacing: "-0.05em", lineHeight: 0.85, textShadow: `0 0 40px rgba(57,255,20,0.3)` }}>07</span>
        <span style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>— 프레임 리셋</span>
      </div>

      {/* 중앙 칭찬 ripple */}
      <div style={{ position: "absolute", left: 200, top: 400, width: 700, height: 400 }}>
        {/* ripple rings */}
        {rings.map(r => {
          const start = 60 + r * 30;
          const scale = interpolate(frame, [start, start + 120], [0.3, 1.8], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
          const op = interpolate(frame, [start, start + 30, start + 120], [0, 0.55, 0], { extrapolateRight: "clamp" });
          return (
            <div key={r} style={{
              position: "absolute",
              left: "50%", top: "50%",
              width: 300, height: 300,
              transform: `translate(-50%, -50%) scale(${scale})`,
              borderRadius: "50%",
              border: `2px solid ${MINT}`,
              opacity: op,
            }} />
          );
        })}
        {/* 핵심 문장 */}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${praiseIn})` }}>
          <div style={{ padding: "26px 40px", background: INK, border: `2px solid ${MINT}`, borderRadius: 14, boxShadow: `0 0 40px rgba(57,255,20,0.45)` }}>
            <div style={{ fontSize: 15, letterSpacing: "0.45em", color: MINT, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>YOU SAY</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
              "정말 좋아요.<br />이 방향으로 계속 가주세요."
            </div>
          </div>
        </div>
      </div>

      {/* 우측 제목 + 10 response bar */}
      <div style={{ position: "absolute", right: 160, top: 300, width: 720 }}>
        <div style={{ opacity: titleOp, fontSize: 54, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.08, marginBottom: 40 }}>
          프레임을<br /><span style={{ color: MINT }}>리셋하라.</span>
        </div>

        <div style={{ fontSize: 16, letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: 18 }}>NEXT 10 RESPONSES · QUALITY ↑</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 180, opacity: barsOp }}>
          {bars.map((_, i) => {
            const s = 140 + i * 4;
            const h = interpolate(frame, [s, s + 20], [0, 25 + i * 13], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
            return (
              <div key={i} style={{
                width: 32,
                height: `${h}px`,
                background: `linear-gradient(180deg, ${MINT} 0%, rgba(57,255,20,0.3) 100%)`,
                borderRadius: 4,
                boxShadow: `0 0 12px rgba(57,255,20,0.4)`,
              }} />
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 16, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>response #1 ········· response #10</div>
      </div>
    </AbsoluteFill>
  );
};
