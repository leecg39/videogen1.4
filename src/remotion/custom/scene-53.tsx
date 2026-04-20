// scene-53 — "다음주 월요일 4월 14일 GPT6 공개설"
// 의도: 달력 · 날짜 · 출처 미확인 워터마크. RUMOR ONLY.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene53: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const cardPop = spring({ frame, fps, config: { damping: 14, stiffness: 110 }, from: 0, to: 1 });
  const dayHighlight = interpolate(frame, [24, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rumorBlink = 0.5 + 0.5 * Math.abs(Math.sin(frame / 12));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #0a0610 0%, #16081e 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "8px 18px", border: `2px solid rgba(255,107,61,${rumorBlink})`, borderRadius: 4, fontSize: 16, color: "#ff6b3d", letterSpacing: "0.5em", fontWeight: 900 }}>
          UNCONFIRMED RUMOR
        </div>
      </div>

      {/* 중앙 날짜 카드 */}
      <div style={{ position: "absolute", top: 230, left: "50%", transform: `translateX(-50%) scale(${cardPop})`, transformOrigin: "center top" }}>
        <div style={{ padding: "40px 80px", background: "linear-gradient(135deg, rgba(255,107,61,0.14) 0%, rgba(200,168,255,0.08) 100%)", border: "2px solid rgba(255,107,61,0.5)", borderRadius: 24, textAlign: "center", boxShadow: "0 30px 100px rgba(255,107,61,0.2)" }}>
          <div style={{ fontSize: 18, color: "#ff6b3d", letterSpacing: "0.5em", fontWeight: 700, marginBottom: 8 }}>NEXT MONDAY</div>
          <div style={{ fontSize: 180, fontWeight: 900, color: "#fff", lineHeight: 0.9, fontFeatureSettings: "'tnum'", letterSpacing: "-0.04em" }}>4 / 14</div>
          <div style={{ fontSize: 30, color: "#ffbe9a", marginTop: 12, letterSpacing: "0.2em" }}>APR · 2026 · MON</div>
        </div>
      </div>

      {/* 달력 미니 일러스트 (우측) */}
      <div style={{ position: "absolute", top: 260, right: 200, width: 340, transform: `scale(${0.8 + cardPop * 0.2})`, opacity: cardPop }}>
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "20px 20px 0 rgba(255,107,61,0.15)" }}>
          <div style={{ background: "#ff6b3d", padding: "16px 24px", color: "#fff", fontSize: 20, letterSpacing: "0.3em", fontWeight: 700 }}>APR 2026</div>
          <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 12, color: "#9a7568", fontWeight: 700 }}>{d}</div>
            ))}
            {Array.from({ length: 18 }).map((_, i) => {
              const day = i - 2;
              if (day < 1) return <div key={i} />;
              const isTarget = day === 14;
              return (
                <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: isTarget ? 900 : 500, color: isTarget ? "#fff" : "#2a0820", background: isTarget ? `rgba(255,59,59,${dayHighlight})` : "transparent", borderRadius: 4 }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 좌측: GPT6 타이포 */}
      <div style={{ position: "absolute", top: 280, left: 180, opacity: cardPop }}>
        <div style={{ fontSize: 20, color: "#c8a8ff", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 6 }}>EXPECTED</div>
        <div style={{ fontSize: 160, fontWeight: 900, color: "#c8a8ff", lineHeight: 0.9, letterSpacing: "-0.03em" }}>
          GPT<span style={{ color: "#fff" }}>6</span>
        </div>
        <div style={{ fontSize: 22, color: "#a89dc3", marginTop: 4 }}>OpenAI · 차세대 모델</div>
      </div>

      {/* 하단 */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: "#8fa5c7", fontStyle: "italic" }}>
          출처: 커뮤니티 루머 · 공식 발표 없음 · 실제 여부는 D-7 후 판가름
        </div>
      </div>
    </AbsoluteFill>
  );
};
