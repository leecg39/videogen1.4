// scene-52 — "뉴스 4 GPT6 4월 14일 출시설"
// 의도: 달력 페이지 넘어가는 동적 컷. D-Day 카운트다운. 루머 워터마크.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene52: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const calPop = spring({ frame, fps, config: { damping: 14, stiffness: 110 }, from: 0, to: 1 });
  const headlineReveal = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rumorPulse = 0.7 + 0.3 * Math.abs(Math.sin(frame / 16));

  // 달력 날짜 14에 동그라미 치는 애니메이션
  const circleDraw = interpolate(frame, [50, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(155deg, #120410 0%, #2a0820 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 루머 워터마크 대각선 */}
      <div style={{ position: "absolute", top: 80, left: -100, transform: "rotate(-20deg)", fontSize: 380, fontWeight: 900, color: "rgba(255,107,61,0.06)", letterSpacing: "-0.04em", pointerEvents: "none", whiteSpace: "nowrap" }}>
        RUMOR · RUMOR
      </div>

      {/* 좌측: 좌측 상단 라벨 */}
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#ff8f5a", letterSpacing: "0.5em", fontWeight: 700 }}>NEWS 04 · 마지막 소식</div>
        <div style={{ fontSize: 76, color: "#fff", fontWeight: 900, marginTop: 12, lineHeight: 1, opacity: headlineReveal }}>
          GPT&shy;<span style={{ color: "#ff8f5a" }}>6</span>
        </div>
        <div style={{ fontSize: 26, color: "#ffbe9a", marginTop: 4 }}>4월 14일 출시설 — 소문</div>
      </div>

      {/* 중앙: 달력 */}
      <div style={{ position: "absolute", top: 260, left: 140, width: 700, transform: `scale(${calPop})`, transformOrigin: "left top" }}>
        <div style={{ padding: "24px 32px", background: "#fff8f0", borderRadius: "20px 20px 4px 20px", boxShadow: "30px 30px 0 rgba(255,143,90,0.12)" }}>
          {/* 달력 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "2px solid #2a0820" }}>
            <div>
              <div style={{ fontSize: 18, color: "#ff6b3d", letterSpacing: "0.3em", fontWeight: 700 }}>APRIL</div>
              <div style={{ fontSize: 46, color: "#2a0820", fontWeight: 900 }}>2026</div>
            </div>
            <div style={{ fontSize: 16, color: "#9a7568" }}>week 15 · 월요일</div>
          </div>

          {/* 요일 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 14, marginBottom: 6 }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 14, color: i === 0 ? "#ff6b3d" : "#9a7568", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {/* 날짜 (4월 1일 = 수요일 기준. 14일 = 화요일. 여기선 월요일에 하이라이트) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, position: "relative" }}>
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2; // 첫 주 공백
              if (day < 1 || day > 30) return <div key={i} />;
              const isTarget = day === 14;
              return (
                <div key={i} style={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: isTarget ? 900 : 500, color: isTarget ? "#ff6b3d" : "#2a0820", fontFeatureSettings: "'tnum'", position: "relative" }}>
                  {day}
                  {isTarget && (
                    <svg style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)" }} viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="22" stroke="#ff3b3b" strokeWidth="3" fill="none" strokeDasharray="138" strokeDashoffset={(1 - circleDraw) * 138} transform="rotate(-90 25 25)" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측: D-Day + 특징 */}
      <div style={{ position: "absolute", top: 260, right: 140, width: 660 }}>
        <div style={{ padding: 30, border: `2px solid rgba(255,107,61,${rumorPulse})`, borderRadius: 16, background: "rgba(255,107,61,0.06)", marginBottom: 22 }}>
          <div style={{ fontSize: 16, color: "#ffbe9a", letterSpacing: "0.4em", fontWeight: 700 }}>RUMORED D-DAY</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 10 }}>
            <div style={{ fontSize: 180, fontWeight: 900, color: "#ff6b3d", lineHeight: 0.9, fontFeatureSettings: "'tnum'" }}>D-7</div>
            <div style={{ fontSize: 30, color: "#ffbe9a" }}>from Mon 4/7</div>
          </div>
        </div>

        <div style={{ padding: "18px 24px", background: "rgba(255,255,255,0.04)", borderLeft: "4px solid #ff8f5a", borderRadius: 4, opacity: headlineReveal }}>
          <div style={{ fontSize: 18, color: "#ffbe9a", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 8 }}>LEAKED FEATURES · 루머</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 22, color: "#fff", lineHeight: 1.3 }}>
            <div>&middot; 지능 <span style={{ color: "#ff8f5a", fontWeight: 800, fontFeatureSettings: "'tnum'" }}>+40%</span> (vs GPT5.4)</div>
            <div>&middot; 컨텍스트 <span style={{ color: "#ff8f5a", fontWeight: 800, fontFeatureSettings: "'tnum'" }}>200만 토큰</span></div>
            <div>&middot; 에이전트 기능 강화</div>
          </div>
        </div>
      </div>

      {/* 하단 메모 */}
      <div style={{ position: "absolute", bottom: 90, left: 140, right: 140, textAlign: "center", fontSize: 20, color: "#9a7568", fontStyle: "italic" }}>
        * 출처 미확인 · OpenAI 공식 발표 전까지는 소문
      </div>
    </AbsoluteFill>
  );
};
