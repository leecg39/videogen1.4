// anxious-13 — "비판의 악순환 · Criticism Spiral"
// 의도: 용어 도입. 거대 나선 다이어그램 + 한/영 용어 병기.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene13: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const spiralRot = interpolate(frame, [0, 300], [0, 260], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const spiralOp = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: "clamp" });

  const termOp = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" });
  const termY = interpolate(frame, [30, 70], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const enOp = interpolate(frame, [70, 110], [0, 1], { extrapolateRight: "clamp" });
  const coinOp = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(255,122,122,0.08) 0%, rgba(8,6,13,1) 60%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/server-data-center.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) hue-rotate(-30deg) saturate(0.5)" }}
        volume={0}
      />
      {/* 좌측: 나선 SVG */}
      <div style={{ position: "absolute", left: 180, top: 240, width: 640, height: 640, opacity: spiralOp, transform: `rotate(${-spiralRot / 4}deg)` }}>
        <svg viewBox="-320 -320 640 640" width={640} height={640}>
          {/* 다중 원형 spiral approximation */}
          {Array.from({ length: 8 }).map((_, i) => {
            const r = 260 - i * 32;
            const alpha = 0.85 - i * 0.08;
            return (
              <circle key={i} cx={0} cy={0} r={r} fill="none" stroke={i % 2 === 0 ? CORAL : "rgba(255,255,255,0.35)"} strokeWidth={2 + (i % 2 === 0 ? 0.5 : 0)} opacity={alpha}
                strokeDasharray={`${r * 2 * Math.PI * 0.6} ${r * 2 * Math.PI * 0.4}`}
                transform={`rotate(${i * 45})`}
              />
            );
          })}
          {/* center black hole */}
          <circle cx={0} cy={0} r={40} fill="#08060D" stroke={CORAL} strokeWidth={2} />
          <text x={0} y={8} textAnchor="middle" fontSize={24} fill={CORAL} fontWeight={700} letterSpacing="0.2em">∞</text>
        </svg>
      </div>

      {/* 우측: 용어 */}
      <div style={{ position: "absolute", right: 180, top: 290 }}>
        <div style={{ opacity: termOp, transform: `translateY(${termY}px)` }}>
          <div style={{ fontSize: 20, letterSpacing: "0.38em", color: CORAL, fontWeight: 700, marginBottom: 22 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: CORAL, marginRight: 14, verticalAlign: "middle", boxShadow: `0 0 10px ${CORAL}` }} />
            TERMINOLOGY · 01
          </div>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.02, color: "#fff" }}>
            비판의<br /><span style={{ color: CORAL }}>악순환</span>
          </div>
        </div>

        <div style={{ marginTop: 28, opacity: enOp, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 32, height: 1, background: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.72)", letterSpacing: "0.03em", fontStyle: "italic" }}>
            Criticism <span style={{ color: CORAL, fontStyle: "normal" }}>Spiral</span>
          </span>
        </div>

        <div style={{ marginTop: 40, opacity: coinOp, maxWidth: 720 }}>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.58)", lineHeight: 1.55, letterSpacing: "0.02em" }}>
            — 아만다 애스켈이 최신 클로드가 겪는 현상을 부르는 이름.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
