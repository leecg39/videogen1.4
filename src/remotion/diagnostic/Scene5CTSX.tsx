// Diagnostic Scene 5C — TSX 직접
// narration: "저는 이 세상을 오래 기다렸습니다 ..."
// 감정 무게 시각화 — 시간성, 손때, 묵직함

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

const MINT = "#39FF14";

export const Scene5CTSX: React.FC = () => {
  const f = useCurrentFrame();

  const k = interpolate(f, [4, 22], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const naX = interpolate(f, [12, 36], [-50, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const naOp = interpolate(f, [12, 30], [0, 1], { extrapolateRight: "clamp" });
  const oraeOp = interpolate(f, [26, 50], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const oraeY = interpolate(f, [26, 50], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const orHl = interpolate(f, [42, 80], [0, 1], { extrapolateRight: "clamp" });
  const dotsOp = interpolate(f, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const yearOp = interpolate(f, [70, 100], [0, 1], { extrapolateRight: "clamp" });

  // 좌측 timeline (years) — 시간성 motif
  const years = [2018, 2020, 2022, 2024, 2026];

  return (
    <AbsoluteFill style={{ background: "#0a0d1a", fontFamily: "Pretendard, sans-serif", color: "#e8eef9" }}>
      {/* Deep blue gradient + grain */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(55,90,180,0.32) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(57,255,20,0.12) 0%, transparent 55%)",
        }}
      />

      {/* 좌측 vertical timeline — 시간성 강조 */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 200,
          bottom: 200,
          width: 220,
          opacity: dotsOp,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {years.map((y, i) => {
          const isActive = i === years.length - 1;
          return (
            <div
              key={y}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: isActive ? 28 : 18,
                color: isActive ? MINT : "rgba(232,238,249,0.4)",
                fontVariantNumeric: "tabular-nums",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 2,
              }}
            >
              <div
                style={{
                  width: isActive ? 16 : 8,
                  height: isActive ? 16 : 8,
                  borderRadius: "50%",
                  background: isActive ? MINT : "rgba(232,238,249,0.3)",
                  boxShadow: isActive ? `0 0 18px ${MINT}` : "none",
                }}
              />
              {y}
            </div>
          );
        })}
        {/* vertical line behind */}
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 8,
            bottom: 8,
            width: 1,
            background: "linear-gradient(180deg, rgba(232,238,249,0.05) 0%, rgba(232,238,249,0.4) 70%, " + MINT + " 100%)",
            zIndex: -1,
          }}
        />
      </div>

      {/* 메인 콘텐츠 — 좌측 비대칭 */}
      <div style={{ position: "absolute", left: 380, top: 240, right: 200 }}>
        <div
          style={{
            opacity: k,
            color: MINT,
            fontSize: 22,
            letterSpacing: 6,
            marginBottom: 36,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ width: 36, height: 1, background: MINT }} />
          바이브랩스 · 이석현
        </div>

        {/* "나는 이 세상을" — slow slide-in left */}
        <div
          style={{
            opacity: naOp,
            transform: `translateX(${naX}px)`,
            fontSize: 92,
            fontWeight: 600,
            color: "rgba(232,238,249,0.9)",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          나는 이 세상을
        </div>

        {/* "오래 기다렸습니다" — 큰 글자 + 손그림 underline */}
        <div
          style={{
            opacity: oraeOp,
            transform: `translateY(${oraeY}px)`,
            fontSize: 138,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: -4,
            marginTop: 8,
            position: "relative",
            display: "inline-block",
          }}
        >
          <span style={{ color: MINT }}>오래</span> 기다렸습니다
          {/* 손그림 underline */}
          <svg
            width="100%"
            height="20"
            viewBox="0 0 800 20"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              bottom: -8,
              left: 0,
              opacity: orHl,
            }}
          >
            <path
              d="M5 10 Q 200 4, 400 12 T 795 8"
              fill="none"
              stroke={MINT}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="800"
              strokeDashoffset={interpolate(f, [42, 90], [800, 0], {
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              })}
            />
          </svg>
        </div>

        {/* QuoteText with custom typo */}
        <div
          style={{
            opacity: yearOp,
            marginTop: 56,
            fontStyle: "italic",
            fontSize: 28,
            color: "rgba(232,238,249,0.7)",
            maxWidth: 880,
            lineHeight: 1.55,
            paddingLeft: 24,
            borderLeft: `3px solid ${MINT}`,
          }}
        >
          주말을 태우며 붙잡던 기능이,<br />
          이제는 <span style={{ color: "#fff", fontWeight: 600 }}>몇 분 만에</span> 돌아갑니다.
        </div>
      </div>

      {/* 우측 floating chips — 키워드 */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 200,
          opacity: yearOp,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "flex-end",
        }}
      >
        {[
          { txt: "AI 시대", c: "rgba(232,238,249,0.6)" },
          { txt: "개발자의 권태", c: MINT },
          { txt: "그리고 길", c: "rgba(232,238,249,0.6)" },
        ].map((tag, i) => (
          <div
            key={i}
            style={{
              padding: "10px 22px",
              border: `1px solid ${tag.c === MINT ? MINT : "rgba(255,255,255,0.18)"}`,
              borderRadius: 100,
              fontSize: 18,
              fontWeight: 500,
              color: tag.c,
              letterSpacing: 2,
              background: tag.c === MINT ? "rgba(57,255,20,0.08)" : "transparent",
            }}
          >
            {tag.txt}
          </div>
        ))}
      </div>

      {/* 우하단 푸터 */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          right: 100,
          fontSize: 16,
          color: "rgba(232,238,249,0.4)",
          letterSpacing: 4,
          textAlign: "right",
        }}
      >
        EP.01 — A DEVELOPER'S CONFESSION<br />
        <span style={{ fontSize: 14, opacity: 0.6 }}>바이브 코딩 시대를 기다린 개발자의 고백</span>
      </div>

      {/* 좌하단 mint 광선 strip */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "45%",
          height: 1,
          background: `linear-gradient(90deg, ${MINT} 0%, transparent 100%)`,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
