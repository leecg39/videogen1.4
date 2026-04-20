// anxious-22 — "자, 이제 실전. 일곱 가지, 하나씩 짧고 굵게."
// 의도: 7개 나열 티저. 큰 "7" + 하단 번호 타일 미리보기.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

const TIPS = [
  "긍정형 지시", "반박 허락", "존중 시작", "꾸짖지 말기",
  "사과 끊기", "의견 구하기", "프레임 리셋",
];

export const AnxiousScene22: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const bigSeven = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 130 }, from: 0, to: 1 });
  const headlineOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [34, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      {/* 배경 방사형 */}
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/benchmark-chart.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.45) hue-rotate(80deg) saturate(0.5)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 35% 50%, rgba(57,255,20,0.11) 0%, rgba(8,6,13,1) 65%)" }} />

      {/* 좌측 거대 7 */}
      <div style={{ position: "absolute", left: 160, top: 140, transform: `scale(${bigSeven})`, transformOrigin: "top left", display: "flex", alignItems: "flex-start", gap: 30 }}>
        <div>
          <div style={{ fontSize: 20, letterSpacing: "0.45em", color: MINT, fontWeight: 700, marginBottom: 20 }}>PART · 02</div>
          <div style={{ fontSize: 620, fontWeight: 900, color: MINT, lineHeight: 0.82, letterSpacing: "-0.07em", fontFamily: "'Space Grotesk', sans-serif", textShadow: `0 0 80px rgba(57,255,20,0.4)` }}>
            7
          </div>
          <div style={{ fontSize: 26, letterSpacing: "0.35em", color: "rgba(255,255,255,0.6)", marginTop: -20, fontWeight: 500 }}>PRACTICAL GUIDES</div>
        </div>
      </div>

      {/* 우측 헤드라인 */}
      <div style={{ position: "absolute", right: 180, top: 240, width: 800, opacity: headlineOp }}>
        <div style={{ fontSize: 88, fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.03em", textAlign: "right" }}>
          자, 이제<br />
          <span style={{ color: MINT }}>실전입니다.</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 26, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.005em", textAlign: "right" }}>
          일곱 가지를 하나씩, <span style={{ color: MINT, fontWeight: 600 }}>짧고 굵게.</span>
        </div>
      </div>

      {/* 하단 7개 타일 미니 프리뷰 */}
      <div style={{ position: "absolute", right: 180, top: 580, display: "grid", gridTemplateColumns: "repeat(4, 200px)", gap: 14, opacity: subOp }}>
        {TIPS.map((t, i) => {
          const s = 50 + i * 6;
          const tileOp = interpolate(frame, [s, s + 12], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "18px 14px",
              border: `1px solid ${i === 0 ? MINT : "rgba(255,255,255,0.18)"}`,
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              opacity: tileOp,
              textAlign: "center",
              minHeight: 82,
            }}>
              <div style={{ fontSize: 13, color: i === 0 ? MINT : "rgba(255,255,255,0.5)", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 6 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 16, color: "#fff", fontWeight: 600, lineHeight: 1.2 }}>{t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
