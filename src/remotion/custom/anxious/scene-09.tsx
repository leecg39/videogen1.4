// anxious-09 — "안녕하세요, 바이브랩스의 공심입니다."
// 의도: 자기소개 카드. 좌측 큰 VIBELABS 로고 타이포 + 우측 "공심" 닉네임.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene09: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const brand = "VIBELABS";
  const charDelay = 4;
  const charStart = 6;

  const nickIn = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });
  const nickOp = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: "clamp" });

  const dividerY = spring({ frame: frame - 24, fps, config: { damping: 25, stiffness: 80 }, from: 0, to: 1 });

  const helloOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  const pulseRing = interpolate((frame % 90) / 90, [0, 0.5, 1], [0.0, 0.5, 0.0]);

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      {/* 배경 패턴 */}
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/team-office.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.3)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 70%, rgba(57,255,20,0.08) 0%, rgba(8,6,13,1) 60%)" }} />
      {/* 희미한 그리드 */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.04 }} width={1920} height={1080}>
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={1920} y2={i * 60} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 34 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={1080} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>

      {/* 중앙 녹색 원 (라이브 포인트) */}
      <div style={{ position: "absolute", left: "50%", top: 270, transform: "translate(-50%, 0)" }}>
        <div style={{ position: "relative", width: 40, height: 40 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: MINT, boxShadow: `0 0 20px ${MINT}` }} />
          <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: `2px solid ${MINT}`, opacity: pulseRing, transform: `scale(${1 + pulseRing * 0.4})` }} />
        </div>
      </div>

      {/* Hello 인사 */}
      <div style={{ position: "absolute", left: "50%", top: 350, transform: "translate(-50%,0)", fontSize: 28, letterSpacing: "0.35em", color: "rgba(255,255,255,0.55)", opacity: helloOp, fontWeight: 500 }}>
        안녕하세요
      </div>

      {/* VIBELABS 큰 타이포 - 글자별 stagger */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", display: "flex", justifyContent: "center", gap: 2 }}>
        {brand.split("").map((c, i) => {
          const s = charStart + i * charDelay;
          const op = interpolate(frame, [s, s + 14], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [s, s + 14], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <span key={i} style={{
              display: "inline-block",
              fontSize: 180,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#fff",
              opacity: op,
              transform: `translateY(${y}px)`,
              lineHeight: 1,
            }}>{c}</span>
          );
        })}
      </div>

      {/* 가로 디바이더 */}
      <div style={{ position: "absolute", left: "50%", top: 680, transform: `translate(-50%,0) scaleX(${dividerY})`, transformOrigin: "center", width: 280, height: 2, background: MINT, boxShadow: `0 0 16px ${MINT}` }} />

      {/* 우측 "공심" 닉네임 */}
      <div style={{ position: "absolute", left: "50%", top: 720, transform: `translate(-50%,0) scale(${nickIn})`, opacity: nickOp, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 16, letterSpacing: "0.4em", color: MINT, fontWeight: 700 }}>HOST</div>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>랩장 <span style={{ color: MINT }}>·</span> Labjang</div>
      </div>
    </AbsoluteFill>
  );
};
