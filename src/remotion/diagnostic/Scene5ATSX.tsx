// Diagnostic Scene 5A — TSX 직접 버전
// 동일 narration: "오늘의 4 뉴스 예고편" — DSL 우회, React 자유 표현.
// scene-grammar.md 새 룰 적용: 노드 7-9 / 시각 요소 8+ / 이징 3+ / 좌측 거대 focal / 깊이감

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

const NEWS_ITEMS = [
  "클로드 코드 토큰 바닥 사태",
  "맥북 로컬 AI · 유료 클라우드 제압",
  "울트라 플랜 · 클라우드 반격",
  "GPT-6 루머 · 4월 14일 공개설",
];

const MINT = "#39FF14";

export const Scene5ATSX: React.FC = () => {
  const f = useCurrentFrame();

  // 이징 4종 — Section 5 다양성
  const kicker = interpolate(f, [4, 22], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const big01Scale = interpolate(f, [10, 40], [0.6, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const big01Op = interpolate(f, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const title = interpolate(f, [22, 44], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const titleY = interpolate(f, [22, 44], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const tag = interpolate(f, [38, 56], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const tagY = interpolate(f, [38, 56], [-20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 배경 SVG 회로 — 시각 요소 보강
  const ringRot = interpolate(f, [0, 200], [0, 30], { extrapolateRight: "clamp" });
  const grainOp = interpolate(f, [0, 60], [0, 0.18], { extrapolateRight: "clamp" });

  // 4 뉴스 stagger (이징 5번째 — back.out 유사)
  const items = NEWS_ITEMS.map((_, i) => {
    const start = 30 + i * 10;
    const op = interpolate(f, [start, start + 18], [0, 1], { extrapolateRight: "clamp" });
    const x = interpolate(f, [start, start + 22], [40, 0], {
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    return { op, x };
  });

  return (
    <AbsoluteFill style={{ background: "#08060D", fontFamily: "Pretendard, sans-serif" }}>
      {/* Ambient noise-glow 흉내 — radial mint+violet */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(57,255,20,0.18) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.22) 0%, transparent 55%)",
        }}
      />

      {/* 우상단 거대 회전 링 — 깊이감 배경 */}
      <svg
        width={760}
        height={760}
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: -180,
          right: -180,
          transform: `rotate(${ringRot}deg)`,
          opacity: 0.35,
        }}
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke={MINT} strokeWidth="0.3" strokeDasharray="2 1" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={MINT} strokeWidth="0.2" opacity={0.6} />
        <circle cx="50" cy="50" r="32" fill="none" stroke={MINT} strokeWidth="0.4" />
        <path d="M55 18 L40 52 L52 52 L45 82 L62 46 L50 46 Z" fill={MINT} opacity={0.5} />
      </svg>

      {/* 좌하단 그리드 라인 — 비대칭 깊이 */}
      <svg
        width={500}
        height={300}
        viewBox="0 0 500 300"
        style={{ position: "absolute", bottom: -30, left: -30, opacity: 0.18 }}
      >
        <line x1="0" y1="120" x2="500" y2="120" stroke={MINT} strokeWidth="0.5" />
        <line x1="0" y1="180" x2="500" y2="180" stroke="#fff" strokeWidth="0.3" opacity="0.4" />
        <line x1="120" y1="0" x2="120" y2="300" stroke="#fff" strokeWidth="0.3" opacity="0.3" />
      </svg>

      {/* 좌측 컬럼 — 거대 01 focal */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 280,
          width: 600,
          opacity: big01Op,
          transform: `scale(${big01Scale})`,
          transformOrigin: "left top",
        }}
      >
        <div
          style={{
            opacity: kicker,
            color: MINT,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 4,
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          오늘의 예고편
        </div>
        <div
          style={{
            fontSize: 360,
            lineHeight: 0.85,
            fontWeight: 800,
            color: "#fff",
            background: `linear-gradient(135deg, #fff 0%, ${MINT} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -8,
          }}
        >
          01
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.55)",
            marginTop: 8,
            letterSpacing: 2,
          }}
        >
          지금 가장 뜨거운
        </div>
      </div>

      {/* 우측 컬럼 — 4 뉴스 list */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 240,
          width: 760,
        }}
      >
        <div
          style={{
            opacity: title,
            transform: `translateY(${titleY}px)`,
            fontSize: 84,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.05,
            marginBottom: 8,
          }}
        >
          오늘의 <span style={{ color: MINT }}>4 뉴스</span>
        </div>
        <div
          style={{
            opacity: tag,
            transform: `translateY(${tagY}px)`,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(57,255,20,0.12)",
            border: `1px solid ${MINT}`,
            color: MINT,
            padding: "8px 18px",
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 2,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: MINT,
              boxShadow: `0 0 12px ${MINT}`,
            }}
          />
          4 NEWS · 12분 18초
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {NEWS_ITEMS.map((txt, i) => (
            <div
              key={i}
              style={{
                opacity: items[i].op,
                transform: `translateX(${items[i].x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: i === 0 ? MINT : "rgba(255,255,255,0.35)",
                  fontVariantNumeric: "tabular-nums",
                  width: 72,
                  textAlign: "right",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  width: 1,
                  height: 36,
                  background: i === 0 ? MINT : "rgba(255,255,255,0.2)",
                }}
              />
              <div
                style={{
                  fontSize: 28,
                  fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {txt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grain overlay */}
      <AbsoluteFill
        style={{
          opacity: grainOp,
          background:
            "radial-gradient(circle at 30% 70%, rgba(124,58,237,0.18) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* 우하단 푸터 */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 120,
          fontSize: 18,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 3,
        }}
      >
        한 편으로 정리합니다 →
      </div>
    </AbsoluteFill>
  );
};
