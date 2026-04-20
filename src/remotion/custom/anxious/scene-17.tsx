// anxious-17 — "자기 방어 → 사과 많고 / 우유부단 / 순응. 영혼 없는 결과."
// 의도: 3가지 증상 태그 + 가운데 "영혼 없다" 대형 낙인.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const CORAL = "#ff7a7a";
const INK = "#08060D";

const SYMPTOMS = [
  { ko: "사과가 많다", en: "OVER-APOLOGIZING", angle: -30, r: 430 },
  { ko: "우유부단하다", en: "INDECISIVE", angle: 0, r: 450 },
  { ko: "틀려도 순응", en: "COMPLIANT", angle: 30, r: 430 },
];

export const AnxiousScene17: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  const centerPop = spring({ frame: frame - 80, fps, config: { damping: 11, stiffness: 110 }, from: 0, to: 1 });
  const centerOp = interpolate(frame, [80, 120], [0, 1], { extrapolateRight: "clamp" });
  const ringPulse = interpolate((frame % 90) / 90, [0, 0.5, 1], [0.2, 0.7, 0.2]);

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 55%, rgba(255,122,122,0.12) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/coding-programming-frustrated-developer.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.3) hue-rotate(-15deg)" }}
        volume={0}
      />
      {/* 상단 kicker */}
      <div style={{ position: "absolute", left: "50%", top: 130, transform: "translate(-50%,0)", display: "flex", alignItems: "center", gap: 14, opacity: kickerOp }}>
        <span style={{ width: 32, height: 1, background: CORAL }} />
        <span style={{ fontSize: 17, letterSpacing: "0.42em", color: CORAL, fontWeight: 700 }}>WHAT YOU GET</span>
        <span style={{ width: 32, height: 1, background: CORAL }} />
      </div>

      {/* 방사형 3개 증상 태그 */}
      {SYMPTOMS.map((s, i) => {
        const start = 20 + i * 24;
        const pop = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 130 }, from: 0, to: 1 });
        const op = interpolate(frame, [start, start + 20], [0, 1], { extrapolateRight: "clamp" });
        const rad = (s.angle * Math.PI) / 180;
        const cx = 960 + Math.sin(rad) * s.r;
        const cy = 540 - Math.cos(rad) * s.r * 0.6 + 80;
        return (
          <div key={s.en} style={{
            position: "absolute",
            left: cx, top: cy,
            transform: `translate(-50%, -50%) scale(${pop})`,
            opacity: op,
          }}>
            <div style={{ padding: "20px 36px", background: "rgba(255,122,122,0.08)", border: `1.5px solid ${CORAL}`, borderRadius: 999, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: CORAL, boxShadow: `0 0 8px ${CORAL}` }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em" }}>{s.ko}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.38em", color: CORAL, fontWeight: 700 }}>{s.en}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 중앙 "영혼 없다" */}
      <div style={{ position: "absolute", left: "50%", top: 540, transform: `translate(-50%, -50%) scale(${centerPop})`, opacity: centerOp, textAlign: "center" }}>
        {/* outer ring */}
        <div style={{ position: "absolute", inset: -40, borderRadius: "50%", border: `3px solid ${CORAL}`, opacity: ringPulse }} />
        <div style={{ padding: "40px 80px", background: INK, border: `2px solid ${CORAL}`, borderRadius: 14, boxShadow: `0 0 50px rgba(255,122,122,0.4)` }}>
          <div style={{ fontSize: 14, letterSpacing: "0.5em", color: CORAL, fontWeight: 700, marginBottom: 14 }}>STAMP</div>
          <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em" }}>
            영혼 <span style={{ color: CORAL, textDecoration: "line-through", textDecorationColor: "#fff" }}>없다</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
