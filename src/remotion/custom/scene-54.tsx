// scene-54 — "GPT6 vs GPT5.4 — 지능 40% 향상 루머"
// 원칙 B 데모: DSL ImpactStat + CompareBars 을 TSX 안에서 활용. 격차를 시각 구조로 표현.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

export const Scene54: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  const gapGrow = interpolate(frame, [10, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lightningPulse = 0.5 + 0.5 * Math.abs(Math.sin(frame / 10));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a0820 0%, #141030 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 라이트닝 번개 배경 */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 * lightningPulse }} viewBox="0 0 1920 1080">
        <path d="M 400 0 L 480 440 L 420 480 L 550 1080" stroke="#ffbe5c" strokeWidth="3" fill="none" />
        <path d="M 1420 0 L 1350 360 L 1410 400 L 1300 1080" stroke="#ffbe5c" strokeWidth="3" fill="none" />
      </svg>

      {/* 상단 라벨 */}
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#ffbe5c", letterSpacing: "0.4em", fontWeight: 700 }}>RUMORED UPGRADE · GPT6</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          지능 <span style={{ color: "#ffbe5c" }}>+40%</span> (vs 5.4)
        </div>
      </div>

      {/* 좌측: GPT5.4 */}
      <div style={{ position: "absolute", top: 280, left: 140, width: 420, padding: 32, borderRadius: 16, background: "rgba(100,110,130,0.1)", border: "1px solid rgba(100,110,130,0.3)" }}>
        <div style={{ fontSize: 16, color: "#8fa5c7", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 14 }}>PREVIOUS · GPT 5.4</div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#8fa5c7", lineHeight: 0.9, fontFeatureSettings: "'tnum'" }}>100</div>
        <div style={{ fontSize: 16, color: "#5a6d96", letterSpacing: "0.2em", marginTop: 4 }}>BASELINE INDEX</div>

        {/* DSL BulletList 사용 (원칙 B) */}
        <div style={{ marginTop: 26 }}>
          <D type="BulletList" data={{ items: ["수학 · 논리", "코딩 보조", "에이전트 초보"], style: "dash" }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>

      {/* 가로 번개 화살표 */}
      <div style={{ position: "absolute", top: 400, left: 580, right: 580, display: "flex", alignItems: "center", justifyContent: "center", opacity: gapGrow }}>
        <svg width="100%" height={140} viewBox="0 0 300 140">
          <defs>
            <linearGradient id="lightning54" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#8fa5c7" />
              <stop offset="100%" stopColor="#ff6b3d" />
            </linearGradient>
          </defs>
          <path d="M 20 70 L 240 70" stroke="url(#lightning54)" strokeWidth={8} strokeLinecap="round" />
          <path d="M 220 40 L 280 70 L 220 100" stroke="url(#lightning54)" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="150" y="40" textAnchor="middle" fill="#ffbe5c" fontSize={28} fontWeight="900" fontFamily="Space Grotesk">+40%</text>
        </svg>
      </div>

      {/* 우측: GPT6 */}
      <div style={{ position: "absolute", top: 240, right: 140, width: 480, padding: 36, borderRadius: 18, background: "linear-gradient(135deg, rgba(255,190,92,0.15) 0%, rgba(255,107,61,0.1) 100%)", border: "2px solid #ffbe5c", boxShadow: "0 20px 80px rgba(255,190,92,0.25)" }}>
        <div style={{ fontSize: 16, color: "#ffbe5c", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 14 }}>RUMORED · GPT 6</div>
        <div style={{ fontSize: 180, fontWeight: 900, color: "#ffbe5c", lineHeight: 0.9, fontFeatureSettings: "'tnum'", textShadow: "0 12px 40px rgba(255,190,92,0.4)" }}>140</div>
        <div style={{ fontSize: 16, color: "#ffd79a", letterSpacing: "0.2em", marginTop: 4 }}>INDEX · + 40 POINTS</div>

        <div style={{ marginTop: 26 }}>
          <D type="BulletList" data={{ items: ["수학 · 논리 +", "코딩 대폭 향상", "에이전트 기능 강화", "컨텍스트 200만"], style: "check" }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>

      {/* 하단 워터마크 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center", fontSize: 20, color: "#8fa5c7", fontStyle: "italic" }}>
        * 출처 미확인 소문. OpenAI 공식 발표 전.
      </div>
    </AbsoluteFill>
  );
};
