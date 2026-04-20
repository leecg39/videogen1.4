// scene-69 — "수첩 vs 컴퓨터" 비유 · 상황에 맞게 골라쓰는 AI 시대
// 의도: 좌측 손으로 그린 수첩 일러스트, 우측 얇은 라인 아트 노트북. 중간 ↔ 흔들리는 선택 화살표. 포근한 beige 계열.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene69: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const notebookSlide = spring({ frame, fps, config: { damping: 16, stiffness: 90 }, from: -80, to: 0 });
  const laptopSlide = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 90 }, from: 80, to: 0 });
  const swingAngle = Math.sin(frame / 24) * 12;
  const taglineOpacity = interpolate(frame, [60, 96], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #f4ecd8 0%, #e3d8bf 55%, #d4c39f 100%)", fontFamily: "'Playfair Display', 'Baskerville', serif", overflow: "hidden" }}>
      {/* 종이 질감 노이즈 (점 패턴) */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}>
        <filter id="noise69">
          <feTurbulence baseFrequency="0.8" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.4 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise69)" />
      </svg>

      {/* 상단 인용구 */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontFamily: "'Playfair Display', serif", color: "#3a2f1e", fontStyle: "italic", fontSize: 34 }}>
        &ldquo;간단한 메모는 수첩에, 중요한 문서는 컴퓨터로&rdquo;
      </div>

      {/* 좌측: 수첩 */}
      <div style={{ position: "absolute", left: 220, top: 280, transform: `translateX(${notebookSlide}px) rotate(-6deg)`, width: 420 }}>
        <div style={{ background: "#f8f1dc", border: "2px solid #6d5836", borderRadius: "6px 2px 2px 20px", padding: "28px 24px 40px 56px", boxShadow: "20px 20px 0 rgba(58,47,30,0.12)", position: "relative" }}>
          {/* 링 제본 구멍 */}
          <div style={{ position: "absolute", left: 16, top: 32, bottom: 32, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: "#3a2f1e", border: "2px solid #8b6f42" }} />
            ))}
          </div>
          {/* 줄 + 손글씨 */}
          <div style={{ fontFamily: "'Caveat', 'Kalam', cursive", fontSize: 38, color: "#3a2f1e", lineHeight: 1.8, borderBottom: "1px dashed rgba(58,47,30,0.3)" }}>
            할 일
          </div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: "#5b4525", lineHeight: 2, marginTop: 12 }}>
            · 우유 사기<br />· 3시 전화<br />· 커피 내리기
          </div>
        </div>
        <div style={{ marginTop: 28, textAlign: "center", fontSize: 22, letterSpacing: "0.4em", color: "#6d5836", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>간단한 일 · 로컬 AI</div>
      </div>

      {/* 중앙 스윙 화살표 */}
      <div style={{ position: "absolute", top: 440, left: "50%", transform: `translateX(-50%) rotate(${swingAngle}deg)`, transformOrigin: "center bottom" }}>
        <svg width={180} height={120} viewBox="0 0 100 80">
          <path d="M 10 40 Q 20 20 35 35 Q 50 50 65 35 Q 80 20 90 40" stroke="#6d5836" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 80 30 L 92 40 L 80 50" stroke="#6d5836" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20 30 L 8 40 L 20 50" stroke="#6d5836" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ textAlign: "center", fontFamily: "'Caveat', cursive", fontSize: 30, color: "#6d5836", marginTop: -8 }}>
          골라 쓰기
        </div>
      </div>

      {/* 우측: 노트북 */}
      <div style={{ position: "absolute", right: 220, top: 300, transform: `translateX(${laptopSlide}px) rotate(4deg)`, width: 460 }}>
        <div style={{ background: "#2a2620", borderRadius: "12px 12px 4px 4px", padding: "16px", boxShadow: "-18px 22px 0 rgba(58,47,30,0.15)" }}>
          <div style={{ background: "#1a1815", padding: "24px 28px", minHeight: 240, fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#7ed6a8", lineHeight: 1.7 }}>
            <div style={{ color: "#78b4ff" }}>&gt; analyze spec.md</div>
            <div style={{ color: "#a5b3c7" }}>resolving dependencies...</div>
            <div style={{ color: "#a5b3c7" }}>compiling architecture...</div>
            <div style={{ color: "#ffcc6b", marginTop: 10 }}>✓ 20k-line spec generated</div>
            <div style={{ color: "#7ed6a8" }}>ready for review.</div>
          </div>
        </div>
        {/* 스탠드 */}
        <div style={{ width: "110%", height: 14, background: "#2a2620", marginLeft: "-5%", marginTop: 2, borderRadius: "0 0 20px 20px" }} />
        <div style={{ marginTop: 28, textAlign: "center", fontSize: 22, letterSpacing: "0.4em", color: "#6d5836", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>복잡한 일 · 클라우드 AI</div>
      </div>

      {/* 하단 헤드라인 */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center", opacity: taglineOpacity, fontFamily: "'Playfair Display', serif" }}>
        <div style={{ fontSize: 60, color: "#3a2f1e", fontWeight: 700 }}>AI 도 이제 <span style={{ fontStyle: "italic", color: "#8b5a2b" }}>상황에 따라</span> 고른다</div>
      </div>
    </AbsoluteFill>
  );
};
