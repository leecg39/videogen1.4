// anxious-04 — "사과만 하고, 자격만 붙이고, 제대로 시도조차 하지 않죠."
// 의도: 3가지 방어 증상을 나열. 각자 다른 색/다른 타이밍으로 stagger. 대각선 배치로 사각 나열 회피.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const AMBER = "#ffbe5c";
const CORAL = "#ff7a7a";
const INK = "#08060D";

const ITEMS = [
  { ko: "사과만 하고", en: "I'M SORRY", tag: "#01", color: CORAL, xFactor: 0.18, yFactor: 0.28 },
  { ko: "자격만 붙이고", en: "BUT, MAYBE...", tag: "#02", color: AMBER, xFactor: 0.44, yFactor: 0.48 },
  { ko: "시도조차 안 하고", en: "SKIP", tag: "#03", color: MINT, xFactor: 0.70, yFactor: 0.30 },
];

export const AnxiousScene04: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.08], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const footerOp = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/coding-frustrated-developer.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.4) saturate(0.2)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(8,6,13,0.45) 0%, rgba(8,6,13,0.97) 78%)" }} />

      {/* Kicker */}
      <div style={{ position: "absolute", left: 160, top: 130, display: "flex", alignItems: "center", gap: 18, opacity: kickerOp }}>
        <span style={{ width: 42, height: 1, background: CORAL, opacity: 0.7 }} />
        <span style={{ fontSize: 18, letterSpacing: "0.4em", color: CORAL, fontWeight: 600 }}>SYMPTOMS · 3</span>
      </div>

      <div style={{ position: "absolute", left: 160, top: 190, fontSize: 48, fontWeight: 300, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.015em" }}>
        불안한 모델의 <span style={{ fontWeight: 700, color: "#fff" }}>세 가지 방어</span>
      </div>

      {/* 대각선 나열 */}
      {ITEMS.map((it, i) => {
        const start = 26 + i * 24;
        const pop = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 140 }, from: 0, to: 1 });
        const op = interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp" });
        const x = 200 + it.xFactor * 1400;
        const y = 360 + it.yFactor * 400;
        return (
          <div
            key={it.en}
            style={{
              position: "absolute",
              left: x, top: y,
              opacity: op,
              transform: `scale(${pop})`,
              transformOrigin: "left top",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16, color: it.color, letterSpacing: "0.3em", fontWeight: 700 }}>{it.tag}</span>
                <span style={{ width: 22, height: 1, background: it.color, opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: 56, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05 }}>{it.ko}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: it.color, letterSpacing: "0.28em", opacity: 0.78, fontStyle: "italic" }}>"{it.en}"</div>
            </div>
          </div>
        );
      })}

      {/* 연결 점선 (대각) */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        <path
          d="M 460 500 Q 780 680 1220 600 Q 1500 540 1700 460"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 10"
        />
      </svg>

      {/* 하단 footer */}
      <div style={{ position: "absolute", left: 160, bottom: 200, opacity: footerOp, fontSize: 22, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
        → 이건 게으름이 아닙니다.
      </div>
    </AbsoluteFill>
  );
};
