// scene-15 — "엔트로픽 공식 인정 — 최우선 과제로 조사 중"
// 의도: 공식 공지 카드 (제목·본문·서명). 기업 블로그 스타일.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene15: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const cardSlide = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, from: 80, to: 0 });
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const sealRotate = interpolate(frame, [40, 80], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sealScale = interpolate(frame, [40, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #140a0a 0%, #0a0808 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 80, left: 140, opacity: headerOpacity }}>
        <div style={{ fontSize: 20, color: "#ffbe5c", letterSpacing: "0.4em", fontWeight: 700 }}>OFFICIAL STATEMENT · 공식 인정</div>
      </div>

      {/* 공식 공지 카드 */}
      <div style={{ position: "absolute", top: 200, left: 160, right: 160, transform: `translateY(${cardSlide}px)`, padding: "50px 60px", background: "#fff", borderRadius: 14, color: "#1a1a1a", boxShadow: "20px 20px 0 rgba(255,190,92,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, borderBottom: "3px solid #1a1a1a" }}>
          <div>
            <div style={{ fontSize: 14, letterSpacing: "0.4em", color: "#b88500", fontWeight: 700 }}>ANTHROPIC · ENGINEERING BLOG</div>
            <div style={{ fontSize: 48, fontWeight: 900, marginTop: 8, lineHeight: 1 }}>사용량 이슈 공지</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 14, color: "#666" }}>
            <div>2026 · 04 · 08</div>
            <div>post-mortem</div>
          </div>
        </div>

        <div style={{ marginTop: 30, fontSize: 28, lineHeight: 1.55, color: "#2a2a2a" }}>
          <p style={{ margin: 0 }}>
            일부 고객이 <span style={{ background: "#ffe8a0", padding: "2px 6px" }}>구독 주기보다 이른 한도 소진</span>을 보고 중임을 확인했습니다.
          </p>
          <p style={{ marginTop: 16, margin: 0 }}>
            이 문제를 <span style={{ color: "#ff3b3b", fontWeight: 900 }}>최우선 과제</span>로 조사 중이며, 원인 분석 및 수정을 진행하고 있습니다.
          </p>
        </div>

        <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontStyle: "italic", color: "#666" }}>— Anthropic Engineering Team</div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#ffe8a0", borderRadius: 999, fontSize: 16, fontWeight: 700, color: "#6a4700" }}>
            <span>⚠</span> TOP PRIORITY
          </div>
        </div>
      </div>

      {/* 원형 인장 */}
      <div style={{ position: "absolute", top: 440, right: 120, transform: `rotate(${sealRotate}deg) scale(${sealScale})`, transformOrigin: "center center" }}>
        <svg width="180" height="180" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ff3b3b" strokeWidth="3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#ff3b3b" strokeWidth="1" />
          <text x="50" y="46" textAnchor="middle" fill="#ff3b3b" fontSize="10" fontWeight="900" fontFamily="Space Grotesk" letterSpacing="0.15em">CONFIRMED</text>
          <text x="50" y="60" textAnchor="middle" fill="#ff3b3b" fontSize="10" fontWeight="900" fontFamily="Space Grotesk" letterSpacing="0.15em">ANTHROPIC</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
