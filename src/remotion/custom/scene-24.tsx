// scene-24 — "Apache 2.0 라이선스 · 무료로 자유 사용"
// 의도: 법률 문서 스타일 + "FREE" 도장. 라이선스 핵심 3문장 bullet.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

const FREEDOMS = [
  { icon: "💰", title: "무료", sub: "licensing fee 0" },
  { icon: "🏢", title: "상업 이용", sub: "회사 제품에 사용 가능" },
  { icon: "🔧", title: "수정·배포", sub: "포크 · 개조 · 재배포 OK" },
  { icon: "🔒", title: "특허 보호", sub: "Apache 특허 조항" },
];

export const Scene24: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const stampRotate = interpolate(frame, [30, 60], [-10, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stampScale = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #f4ecd8 0%, #d9cca9 100%)", fontFamily: "'Playfair Display', 'Cormorant Garamond', serif", color: "#2a2010" }}>
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", opacity: headerOpacity }}>
        <div style={{ fontSize: 18, color: "#8a6b36", letterSpacing: "0.5em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>LICENSE · GEMMA 4</div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#2a2010", lineHeight: 1, marginTop: 14, letterSpacing: "-0.01em", fontFamily: "'Playfair Display', serif" }}>
          Apache 2.0
        </div>
      </div>

      {/* 우측 FREE 스탬프 */}
      <div style={{ position: "absolute", top: 200, right: 200, transform: `rotate(${stampRotate}deg) scale(${stampScale})` }}>
        <div style={{ padding: "24px 40px", border: "8px solid #c9302c", color: "#c9302c", fontSize: 100, fontWeight: 900, letterSpacing: "0.15em", background: "rgba(201,48,44,0.05)", fontFamily: "'Space Grotesk', sans-serif" }}>
          FREE
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 16, color: "#c9302c", letterSpacing: "0.4em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>OPEN WEIGHTS</div>
      </div>

      {/* 중앙 4 freedom 그리드 */}
      <div style={{ position: "absolute", top: 470, left: 160, right: 160, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        {FREEDOMS.map((f, i) => {
          const delay = 30 + i * 12;
          const enter = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 40}px)`, padding: "28px 22px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(42,32,16,0.2)", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 56 }}>{f.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#2a2010", marginTop: 6, fontFamily: "'Playfair Display', serif" }}>{f.title}</div>
              <div style={{ fontSize: 16, color: "#6b5530", marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{f.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", fontSize: 24, color: "#5a4a1a", fontStyle: "italic" }}>
        개인이든 회사든 — 가져다 자유롭게 쓰고 고치고 배포
      </div>
    </AbsoluteFill>
  );
};
