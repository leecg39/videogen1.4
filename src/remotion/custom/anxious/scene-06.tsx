// anxious-06 — 아만다 애스켈 소개
// 의도: 인용자 프로필. 좌측 대형 원형 실루엣 + 우측 이름/역할/태그.
import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useVideoConfig, Easing, OffthreadVideo } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene06: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const orbitAngle = interpolate(frame, [0, 300], [0, 360], { extrapolateRight: "clamp" });
  const ringScale = spring({ frame: frame - 4, fps, config: { damping: 22, stiffness: 90 }, from: 0, to: 1 });
  const silhouetteOp = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: "clamp" });

  const nameOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
  const nameY = interpolate(frame, [40, 70], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const roleOp = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: "clamp" });
  const orgOp = interpolate(frame, [74, 96], [0, 1], { extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [90, 115], [0, 1], { extrapolateRight: "clamp" });
  const quoteOp = interpolate(frame, [110, 150], [0, 1], { extrapolateRight: "clamp" });

  const ringRotation = interpolate(frame, [0, 300], [0, 50], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      {/* 배경 방사형 글로우 */}
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/news-broadcast-studio-dark.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.4)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 55%, rgba(57,255,20,0.10) 0%, rgba(8,6,13,0.98) 60%)" }} />

      {/* 좌측 대형 원형 포트레이트 */}
      <div style={{ position: "absolute", left: 220, top: 280, width: 420, height: 420, transform: `scale(${ringScale})` }}>
        {/* 외곽 회전 링 */}
        <svg style={{ position: "absolute", inset: 0, transform: `rotate(${ringRotation}deg)` }} viewBox="0 0 420 420">
          <circle cx={210} cy={210} r={200} fill="none" stroke={MINT} strokeWidth={1.5} opacity={0.4} strokeDasharray="8 14" />
          <circle cx={210} cy={10} r={6} fill={MINT} style={{ filter: `drop-shadow(0 0 10px ${MINT})` }} />
        </svg>
        {/* 내부 실루엣 원 */}
        <div style={{ position: "absolute", inset: 40, borderRadius: "50%", background: "linear-gradient(160deg, rgba(57,255,20,0.15) 0%, rgba(30,30,30,0.55) 100%)", boxShadow: `inset 0 0 80px rgba(57,255,20,0.18)`, opacity: silhouetteOp, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* 간단한 얼굴 실루엣 (SVG) */}
          <svg width={180} height={220} viewBox="0 0 180 220" fill="none">
            <circle cx={90} cy={68} r={42} fill="rgba(255,255,255,0.85)" />
            <path d="M 20 220 Q 20 130 90 130 Q 160 130 160 220 Z" fill="rgba(255,255,255,0.78)" />
          </svg>
        </div>
        {/* 이름 배지 */}
        <div style={{ position: "absolute", left: "50%", bottom: -20, transform: "translate(-50%, 50%)", padding: "10px 26px", background: INK, border: `1.5px solid ${MINT}`, borderRadius: 999, fontSize: 14, letterSpacing: "0.4em", color: MINT, fontWeight: 700, boxShadow: `0 0 20px rgba(57,255,20,0.3)` }}>
          INTERVIEWED
        </div>
      </div>

      {/* 우측 프로필 정보 */}
      <div style={{ position: "absolute", left: 760, top: 290 }}>
        <div style={{ opacity: nameOp, transform: `translateY(${nameY}px)` }}>
          <div style={{ fontSize: 26, letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)", marginBottom: 16, fontWeight: 500 }}>AMANDA ASKELL</div>
          <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#fff" }}>아만다 애스켈</div>
        </div>

        <div style={{ marginTop: 30, opacity: roleOp, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ padding: "10px 24px", border: `1px solid ${MINT}`, borderRadius: 4, color: MINT, fontSize: 18, letterSpacing: "0.1em", fontWeight: 600 }}>사내 철학자</div>
          <div style={{ padding: "10px 24px", border: `1px solid rgba(255,255,255,0.35)`, borderRadius: 4, color: "rgba(255,255,255,0.78)", fontSize: 18, letterSpacing: "0.1em", fontWeight: 500 }}>Philosopher-in-Residence</div>
        </div>

        <div style={{ marginTop: 22, opacity: orgOp, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 32, height: 2, background: "rgba(255,255,255,0.4)" }} />
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.85)", fontWeight: 500, letterSpacing: "0.05em" }}>@ Anthropic</span>
        </div>

        <div style={{ marginTop: 60, opacity: tagOp }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", letterSpacing: "0.3em" }}>RECENT INTERVIEW</span>
        </div>

        <div style={{ marginTop: 16, opacity: quoteOp, maxWidth: 900 }}>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "rgba(255,255,255,0.85)", fontWeight: 300, fontStyle: "italic" }}>
            "그녀의 결론은 <span style={{ color: MINT, fontWeight: 600, fontStyle: "normal" }}>단호합니다.</span>"
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
