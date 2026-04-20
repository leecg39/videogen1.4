// scene-23 — "4월 2일 구글 딥마인드 Gemma 4 공개" · 제품 announcement
// 의도: 날짜 타임스탬프 + 중앙 거대한 Gemma 4 타이포 reveal + 딥마인드 서명.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene23: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const dateSlide = spring({ frame, fps, config: { damping: 20, stiffness: 100 }, from: -120, to: 0 });
  const titleReveal = interpolate(frame, [12, 60], [0, 1], { extrapolateRight: "clamp" });
  const titleBlur = interpolate(frame, [12, 60], [18, 0], { extrapolateRight: "clamp" });
  const underlineGrow = interpolate(frame, [48, 84], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [66, 96], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #0b1428 0%, #1e2847 55%, #0b1428 100%)", fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* 배경 오브 (Google colors) */}
      <div style={{ position: "absolute", top: "18%", left: "8%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(66,133,244,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "12%", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,67,53,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", top: "45%", right: "35%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,188,5,0.22) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "30%", left: "30%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,168,83,0.22) 0%, transparent 70%)", filter: "blur(40px)" }} />

      {/* 상단 날짜 스탬프 */}
      <div style={{ position: "absolute", top: 130, left: 140, transform: `translateY(${dateSlide}px)`, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: "#8ba4d4", letterSpacing: "0.3em", fontWeight: 700 }}>APR</div>
          <div style={{ fontSize: 36, color: "#fff", fontWeight: 900, lineHeight: 1, fontFeatureSettings: "'tnum'" }}>02</div>
        </div>
        <div>
          <div style={{ fontSize: 22, color: "#8ba4d4", letterSpacing: "0.3em", fontWeight: 600 }}>GOOGLE DEEPMIND</div>
          <div style={{ fontSize: 32, color: "#fff", marginTop: 6, fontWeight: 600 }}>Open-weights release</div>
        </div>
      </div>

      {/* 중앙 거대 타이포 — Gemma 4 */}
      <div style={{ position: "absolute", top: "42%", left: 0, right: 0, transform: "translateY(-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 360, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", opacity: titleReveal, filter: `blur(${titleBlur}px)`, background: "linear-gradient(135deg, #ffffff 0%, #8ba4d4 50%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Gemma 4
        </div>
        <div style={{ height: 6, background: "linear-gradient(90deg,#4285f4,#ea4335,#fbbc05,#34a853)", margin: "0 auto", marginTop: -10, width: `${underlineGrow * 640}px`, transition: "width 0.3s" }} />
      </div>

      {/* 하단 태그 카드들 */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28, opacity: tagOpacity }}>
        {[
          ["Apache 2.0", "자유 라이선스"],
          ["4 sizes", "2.3B → 31B"],
          ["Open weights", "회사·개인 무료"],
        ].map(([h, s], i) => (
          <div key={i} style={{ padding: "22px 36px", borderRadius: 16, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFeatureSettings: "'tnum'" }}>{h}</div>
            <div style={{ fontSize: 22, color: "#8ba4d4" }}>{s}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
