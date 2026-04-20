// scene-36 — "회사 기밀 AI 분석 · 외부 서버 걱정" 프라이버시 메타포
// 의도: 서류 캐비닛 안의 문서가 자물쇠로 잠긴 맥북으로. 외부 서버 연결선이 X 로 차단.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene36: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const lineDraw = interpolate(frame, [30, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const xMark = interpolate(frame, [80, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shieldPop = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #061018 0%, #0a1828 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 22, color: "#7dffb0", letterSpacing: "0.4em", fontWeight: 700 }}>PRIVACY · 기밀 유지</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10, lineHeight: 1.1 }}>
          회사 기밀 — <span style={{ color: "#7dffb0" }}>맥북 안에서만</span>
        </div>
      </div>

      <svg style={{ position: "absolute", top: 280, left: 0, right: 0, width: "100%", height: 540 }} viewBox="0 0 1920 540">
        {/* 좌측: 기밀 서류 캐비닛 */}
        <g transform="translate(200, 80)">
          <rect x="0" y="20" width="240" height="320" rx="8" fill="#2a3a5a" stroke="#5a6d96" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="20" y={40 + i * 70} width="200" height="50" rx="4" fill="#14182a" />
              <rect x="36" y={56 + i * 70} width="160" height="10" fill="#8fa5c7" opacity="0.6" />
              <rect x="36" y={72 + i * 70} width="110" height="8" fill="#8fa5c7" opacity="0.4" />
            </g>
          ))}
          <text x="120" y="12" textAnchor="middle" fill="#8fa5c7" fontSize="16" fontWeight="700" letterSpacing="0.2em">CONFIDENTIAL</text>
        </g>

        {/* 중앙: 흐름 선 */}
        <line x1="460" y1="250" x2="1040" y2="250" stroke="#7dffb0" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${lineDraw * 500} 500`} />

        {/* 우측: 보안 맥북 */}
        <g transform="translate(1040, 80)">
          <rect x="0" y="60" width="400" height="240" rx="14" fill="#1a1f2a" stroke="#7dffb0" strokeWidth="3" />
          <rect x="20" y="80" width="360" height="200" rx="4" fill="#0a1018" />
          <circle cx="200" cy="180" r="54" fill="none" stroke="#7dffb0" strokeWidth="3" />
          <path d="M 178 180 L 194 196 L 222 168" stroke="#7dffb0" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="200" y="244" textAnchor="middle" fill="#7dffb0" fontSize="14" letterSpacing="0.3em" fontWeight="700">SECURED · LOCAL</text>
          {/* 맥북 베이스 */}
          <rect x="-10" y="300" width="420" height="14" rx="7" fill="#2a3042" />
        </g>

        {/* 외부 서버 연결선 X */}
        <g transform="translate(720, 400)" opacity={xMark}>
          <line x1="40" y1="20" x2="100" y2="80" stroke="#ff3b5c" strokeWidth="5" strokeLinecap="round" />
          <line x1="100" y1="20" x2="40" y2="80" stroke="#ff3b5c" strokeWidth="5" strokeLinecap="round" />
          <text x="70" y="130" textAnchor="middle" fill="#ff3b5c" fontSize="14" fontWeight="700" letterSpacing="0.25em">no external server</text>
        </g>

        {/* 방패 아이콘 */}
        <g transform={`translate(1240, 340) scale(${shieldPop})`} transform-origin="center">
          <path d="M 0 -40 L 40 -20 L 40 20 Q 40 50 0 70 Q -40 50 -40 20 L -40 -20 Z" fill="#7dffb0" />
          <path d="M -14 10 L -4 22 L 18 -4" stroke="#0a1018" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      <div style={{ position: "absolute", bottom: 90, left: 140, right: 140, display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 22, color: "#ffbe5c" }}>💼 1인 사업자 · 구독비 부담 덜기</div>
        <div style={{ fontSize: 22, color: "#7dffb0" }}>🔒 프라이버시 완전 로컬</div>
      </div>
    </AbsoluteFill>
  );
};
