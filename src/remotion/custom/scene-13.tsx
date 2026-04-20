// scene-13 — "프롬프트 캐시 · AI 기억 장치 설명"
// 원칙 B: Headline + RichText + IconCard import + 캐시 메모리 셀 시각화
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

export const Scene13: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  // 메모리 셀 — 8개 셀이 차례로 "기억" 상태가 됨. 마지막 2개는 BUG 상태(깜빡임)
  const CELLS = 8;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #060914 0%, #0b1828 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 140, opacity: headerOpacity }}>
        <D type="Kicker" data={{ text: "원인 3 · CAUSE", color: "#8fd5ff" }} frame={frame} durationFrames={durationFrames} />
        <div style={{ marginTop: 14 }}>
          <D type="Headline" data={{ text: "프롬프트 캐시 · AI 의 기억 장치", size: "xl" }} frame={frame} durationFrames={durationFrames} />
        </div>
        <div style={{ marginTop: 14, maxWidth: 900 }}>
          <D type="RichText" data={{ text: "이전 대화를 저장해 재사용하는 메모리. **고장** 나면 같은 작업이 **10~20배** 토큰 소모." }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>

      {/* 중앙: 메모리 셀 그리드 */}
      <div style={{ position: "absolute", top: 430, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        {Array.from({ length: CELLS }).map((_, i) => {
          const appearFrame = 20 + i * 10;
          const enter = interpolate(frame, [appearFrame, appearFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const isBuggy = i >= CELLS - 2;
          const flicker = isBuggy ? 0.4 + 0.6 * Math.abs(Math.sin(frame / 6 + i)) : 1;
          const color = isBuggy ? "#ff3b5c" : i < 3 ? "#7dffb0" : "#8fd5ff";
          return (
            <div key={i} style={{
              opacity: enter * flicker,
              transform: `scale(${enter})`,
              width: 110,
              height: 140,
              borderRadius: 10,
              background: `linear-gradient(180deg, ${color}22 0%, ${color}0a 100%)`,
              border: `2px solid ${color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: isBuggy ? `0 0 20px ${color}55` : "none",
            }}>
              <div style={{ fontSize: 14, color, letterSpacing: "0.25em", fontWeight: 700 }}>CELL</div>
              <div style={{ fontSize: 42, color: "#fff", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>{i + 1}</div>
              {isBuggy && (
                <div style={{ fontSize: 11, color: "#ff3b5c", marginTop: 6, letterSpacing: "0.1em", fontWeight: 700 }}>⚠ BUG</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 화살표 */}
      <div style={{ position: "absolute", top: 600, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        <svg width="500" height="60" viewBox="0 0 500 60">
          <defs>
            <linearGradient id="grad13" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7dffb0" />
              <stop offset="70%" stopColor="#ffbe5c" />
              <stop offset="100%" stopColor="#ff3b5c" />
            </linearGradient>
          </defs>
          <path d="M 20 30 L 460 30" stroke="url(#grad13)" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 6" />
          <path d="M 440 14 L 480 30 L 440 46" stroke="#ff3b5c" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="100" y="22" fill="#7dffb0" fontSize="16" fontFamily="Space Grotesk" fontWeight="700">NORMAL</text>
          <text x="420" y="22" fill="#ff3b5c" fontSize="16" fontFamily="Space Grotesk" fontWeight="700" textAnchor="end">BUG</text>
        </svg>
      </div>

      {/* 하단 impact label */}
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 32, color: "#fff", fontWeight: 600 }}>
          같은 작업 · <span style={{ color: "#ff3b5c", fontWeight: 900, fontFeatureSettings: "'tnum'", fontSize: 48 }}>×10~20</span> 토큰 증가
        </div>
      </div>
    </AbsoluteFill>
  );
};
