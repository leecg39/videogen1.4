// Diagnostic Scene 5B — TSX 직접 버전
// narration: "안녕하세요 바이브랩스의 랩장입니다 ... AI 세상은 오늘도 쉬지 않고"
// 인트로 모먼트 — sparse 실패 → 시각 요소 8+ 깊이감 비대칭

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

const MINT = "#39FF14";
const VIOLET = "#7c3aed";

export const Scene5BTSX: React.FC = () => {
  const f = useCurrentFrame();

  const k1 = interpolate(f, [4, 22], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const vibeY = interpolate(f, [12, 36], [80, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const vibeOp = interpolate(f, [12, 30], [0, 1], { extrapolateRight: "clamp" });
  const newsScale = interpolate(f, [22, 50], [0.7, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const newsOp = interpolate(f, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(f, [38, 56], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const subY = interpolate(f, [38, 56], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const dotsOp = interpolate(f, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const ringRot = interpolate(f, [0, 269], [0, 35], { extrapolateRight: "clamp" });
  const cardsBase = interpolate(f, [44, 80], [60, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const cardsOp = interpolate(f, [44, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#08060D", fontFamily: "Pretendard, sans-serif", color: "#fff" }}>
      {/* 멀티 radial glow — depth */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 25% 30%, rgba(124,58,237,0.32) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(57,255,20,0.18) 0%, transparent 55%)`,
        }}
      />

      {/* 좌상단 좌표 grid 모티프 — 시각 요소 1 */}
      <svg
        width="640"
        height="380"
        viewBox="0 0 640 380"
        style={{ position: "absolute", top: 60, left: 60, opacity: 0.18 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="640" y2={i * 50} stroke={MINT} strokeWidth="0.5" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="380" stroke="#fff" strokeWidth="0.3" opacity="0.4" />
        ))}
      </svg>

      {/* 우상단 거대 회전 링 + 화살표 — 시각 요소 2 */}
      <svg
        width="900"
        height="900"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: -260,
          right: -260,
          transform: `rotate(${ringRot}deg)`,
          opacity: 0.4,
        }}
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke={MINT} strokeWidth="0.25" strokeDasharray="3 1.5" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="0.18" opacity="0.5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke={MINT} strokeWidth="0.4" />
        <text x="50" y="14" fontSize="3" fill={MINT} textAnchor="middle" letterSpacing="0.5">VIBE LABS</text>
        <text x="86" y="52" fontSize="2.4" fill="#fff" opacity="0.6">EP.27</text>
      </svg>

      {/* 좌측 hero — VIBE / NEWS vertical stacked */}
      <div style={{ position: "absolute", left: 120, top: 220, width: 900 }}>
        <div
          style={{
            opacity: k1,
            color: MINT,
            fontSize: 22,
            letterSpacing: 6,
            marginBottom: 24,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ width: 40, height: 1, background: MINT }} />
          2026 · 04 · 08 · TUE
        </div>
        <div
          style={{
            opacity: vibeOp,
            transform: `translateY(${vibeY}px)`,
            fontSize: 220,
            lineHeight: 0.85,
            fontWeight: 800,
            letterSpacing: -8,
            color: "#fff",
            marginBottom: -10,
          }}
        >
          바이브
        </div>
        <div
          style={{
            opacity: newsOp,
            transform: `scale(${newsScale})`,
            transformOrigin: "left center",
            fontSize: 220,
            lineHeight: 0.85,
            fontWeight: 800,
            letterSpacing: -8,
            background: `linear-gradient(135deg, ${MINT} 0%, #b6ff7d 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            position: "relative",
          }}
        >
          뉴스
          <span
            style={{
              position: "absolute",
              right: -42,
              bottom: 36,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: MINT,
              boxShadow: `0 0 24px ${MINT}`,
            }}
          />
        </div>
        <div
          style={{
            opacity: subOp,
            transform: `translateY(${subY}px)`,
            fontSize: 32,
            color: "rgba(255,255,255,0.78)",
            fontWeight: 500,
            marginTop: 36,
            letterSpacing: 1,
          }}
        >
          랩장이 직접 정리한 오늘의 AI
        </div>
      </div>

      {/* 우측 floating cards 3장 — 시각 요소 3·4·5 */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 260,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: cardsOp,
          transform: `translateX(${cardsBase}px)`,
        }}
      >
        {[
          { label: "DURATION", val: "12:18", glow: VIOLET },
          { label: "STORIES", val: "4", glow: MINT },
          { label: "FOCUS", val: "Claude · GPT · Local", glow: "#06b6d4" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              padding: "20px 28px",
              minWidth: 320,
              backdropFilter: "blur(8px)",
              transform: `translateY(${(2 - i) * 6}px)`,
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: 4, color: "rgba(255,255,255,0.4)" }}>
              {c.label}
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: c.glow,
                fontVariantNumeric: "tabular-nums",
                marginTop: 4,
              }}
            >
              {c.val}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 episode dots — 4 NEWS preview, 시각 요소 6 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 120,
          opacity: dotsOp,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                width: i === 0 ? 56 : 14,
                height: 14,
                borderRadius: 14,
                background: i === 0 ? MINT : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
              }}
            />
          </React.Fragment>
        ))}
        <span style={{ marginLeft: 18, color: "rgba(255,255,255,0.4)", fontSize: 16, letterSpacing: 3 }}>
          NEWS 01 / 04
        </span>
      </div>

      {/* 우하단 화살표 + footer — 시각 요소 7 */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          right: 100,
          fontSize: 16,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: 4,
        }}
      >
        START →
      </div>

      {/* 좌하단 라이트 스트립 — 시각 요소 8 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "60%",
          height: 2,
          background: `linear-gradient(90deg, ${MINT} 0%, transparent 100%)`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
