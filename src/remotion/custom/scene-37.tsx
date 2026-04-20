// scene-37 — "80-90% 로컬 + 10-20% 클라우드" 이중 전략
// 의도: 도넛 차트 (로컬/클라우드 분할) + 양쪽 기능 설명.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene37: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const sweepDeg = interpolate(frame, [20, 110], [0, 306], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const labelFade = interpolate(frame, [90, 130], [0, 1], { extrapolateRight: "clamp" });

  // 원호 계산
  const R = 180, CX = 250, CY = 250;
  const startA = -90;
  const endA = -90 + sweepDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = CX + R * Math.cos(toRad(startA));
  const y1 = CY + R * Math.sin(toRad(startA));
  const x2 = CX + R * Math.cos(toRad(endA));
  const y2 = CY + R * Math.sin(toRad(endA));
  const large = sweepDeg > 180 ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #080e1c 0%, #0f1a30 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 80, left: 140 }}>
        <div style={{ fontSize: 22, color: "#8fd5ff", letterSpacing: "0.45em", fontWeight: 700 }}>HYBRID STRATEGY · 이중 전략</div>
        <div style={{ fontSize: 52, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          <span style={{ color: "#7dffb0" }}>80-90%</span> 로컬 · <span style={{ color: "#c8a8ff" }}>10-20%</span> 클라우드
        </div>
      </div>

      {/* 도넛 차트 */}
      <div style={{ position: "absolute", top: 260, left: 200, width: 500, height: 500 }}>
        <svg width="500" height="500" viewBox="0 0 500 500">
          {/* 배경 원 */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(143,213,255,0.12)" strokeWidth="60" />
          {/* 로컬 부분 (85%) */}
          <path d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`} stroke="#7dffb0" strokeWidth="60" fill="none" strokeLinecap="butt" />
          {/* 클라우드 부분 (15%) */}
          {sweepDeg >= 306 && (
            <path d={`M ${x2} ${y2} A ${R} ${R} 0 0 1 ${CX + R * Math.cos(toRad(270))} ${CY + R * Math.sin(toRad(270))}`} stroke="#c8a8ff" strokeWidth="60" fill="none" strokeLinecap="butt" opacity={interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" })} />
          )}
          {/* 중앙 */}
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize="90"
            fontWeight="900"
            fontFamily="Space Grotesk"
            style={{ fontFeatureSettings: "'tnum'" }}
          >
            85%
          </text>
          <text x={CX} y={CY + 26} textAnchor="middle" fill="#7dffb0" fontSize="20" fontWeight="700" fontFamily="Space Grotesk" letterSpacing="0.3em">LOCAL</text>
        </svg>
      </div>

      {/* 우측 설명 */}
      <div style={{ position: "absolute", top: 300, right: 140, width: 660 }}>
        {/* 로컬 박스 */}
        <div style={{ padding: "24px 28px", background: "rgba(125,255,176,0.08)", borderLeft: "5px solid #7dffb0", borderRadius: 4, marginBottom: 18, opacity: labelFade }}>
          <div style={{ fontSize: 18, color: "#7dffb0", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 6 }}>80-90% LOCAL</div>
          <div style={{ fontSize: 36, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>일상 코딩 · 문서 요약 · 번역 · 질의</div>
          <div style={{ fontSize: 18, color: "#a8e6c8", marginTop: 8 }}>맥북 로컬 실행 · 무료 · 프라이버시</div>
        </div>

        {/* 클라우드 박스 */}
        <div style={{ padding: "24px 28px", background: "rgba(200,168,255,0.08)", borderLeft: "5px solid #c8a8ff", borderRadius: 4, opacity: labelFade }}>
          <div style={{ fontSize: 18, color: "#c8a8ff", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 6 }}>10-20% CLOUD</div>
          <div style={{ fontSize: 36, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>복잡한 기획 · 최상급 reasoning · 장문</div>
          <div style={{ fontSize: 18, color: "#d0b9ff", marginTop: 8 }}>울트라 플랜 · Opus 4.6 · 꼭 필요할 때만</div>
        </div>

        <div style={{ marginTop: 24, padding: "16px 22px", background: "rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 24, color: "#c5d7f0" }}>월 구독료 <span style={{ color: "#7dffb0", fontWeight: 900 }}>대폭 감소</span> · 기밀 유지 <span style={{ color: "#7dffb0", fontWeight: 900 }}>완벽</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
