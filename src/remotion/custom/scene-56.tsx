// scene-56 — "200만 토큰 컨텍스트 · 책 15권 분량"
// 의도: 화면 오른쪽에 책 15권이 stack 으로 쌓이는 애니. 좌측에 "2,000,000" 숫자 카운트업.
// 텍스트 대신 책의 물리적 부피 = 토큰 부피로 시각 메타포.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene56: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const countUp = Math.floor(interpolate(frame, [16, 130], [0, 2000000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));

  // 15 권 책이 차례로 쌓임
  const BOOK_COUNT = 15;
  const COLORS = ["#7dffb0", "#8fd5ff", "#c8a8ff", "#ffbe5c", "#ff8fb0", "#90e8d5", "#d5b590"];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #1a1308 0%, #0a0810 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 140 }}>
        <div style={{ fontSize: 22, color: "#ffbe5c", letterSpacing: "0.45em", fontWeight: 700 }}>CONTEXT · 컨텍스트 윈도우</div>
        <div style={{ fontSize: 46, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          한 번에 <span style={{ color: "#ffbe5c" }}>책 15권</span> 분량을 읽는다
        </div>
      </div>

      {/* 좌측: 거대 숫자 */}
      <div style={{ position: "absolute", top: 280, left: 140, width: 900 }}>
        <div style={{ fontSize: 24, color: "#ffbe5c", letterSpacing: "0.3em", fontWeight: 700 }}>TOKENS</div>
        <div style={{ fontSize: 260, fontWeight: 900, color: "#ffbe5c", lineHeight: 0.9, fontFeatureSettings: "'tnum'", textShadow: "0 20px 90px rgba(255,190,92,0.3)", letterSpacing: "-0.03em" }}>
          {countUp.toLocaleString()}
        </div>
        <div style={{ fontSize: 28, color: "#d9c694", marginTop: 6 }}>
          &asymp; 대략 <span style={{ color: "#fff", fontWeight: 700 }}>300만 단어</span> / 책 15권
        </div>
      </div>

      {/* 우측: 책 스택 일러스트 */}
      <div style={{ position: "absolute", top: 180, right: 160, width: 420, height: 740, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-start", alignItems: "center", gap: 3 }}>
        {Array.from({ length: BOOK_COUNT }).map((_, i) => {
          const appearFrame = 20 + i * 8;
          const enter = interpolate(frame, [appearFrame, appearFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const slideX = interpolate(enter, [0, 1], [400, 0]);
          const bookWidth = 260 + ((i * 31) % 60);
          const bookColor = COLORS[i % COLORS.length];
          const tilt = ((i * 7) % 10) - 5;
          return (
            <div key={i} style={{
              transform: `translateX(${slideX}px) rotate(${tilt}deg)`,
              opacity: enter,
              width: bookWidth,
              height: 32,
              background: `linear-gradient(180deg, ${bookColor} 0%, ${bookColor}dd 100%)`,
              borderRadius: "4px 4px 2px 2px",
              border: `1px solid ${bookColor}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 20,
              color: "#1a1308",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "'Playfair Display', serif",
              boxShadow: `2px 3px 0 ${bookColor}55`,
              position: "relative",
            }}>
              <span>VOL. {BOOK_COUNT - i}</span>
              <span style={{ position: "absolute", right: 14, fontSize: 10, opacity: 0.7 }}>·</span>
            </div>
          );
        })}
      </div>

      {/* 하단 비교 */}
      <div style={{ position: "absolute", bottom: 100, left: 140, right: 140, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 18, color: "#8fa5c7", letterSpacing: "0.3em", marginBottom: 4 }}>GPT-5.4 (지금)</div>
          <div style={{ fontSize: 48, color: "#8fa5c7", fontWeight: 700, fontFeatureSettings: "'tnum'" }}>~200K</div>
          <div style={{ fontSize: 16, color: "#5a6d96" }}>책 1.5권</div>
        </div>
        <div style={{ fontSize: 30, color: "#ffbe5c" }}>→ 약 <span style={{ fontWeight: 800 }}>10배 확장</span></div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, color: "#ffbe5c", letterSpacing: "0.3em", marginBottom: 4 }}>GPT-6 (루머)</div>
          <div style={{ fontSize: 48, color: "#ffbe5c", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>2,000,000</div>
          <div style={{ fontSize: 16, color: "#d9c694" }}>책 15권</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
