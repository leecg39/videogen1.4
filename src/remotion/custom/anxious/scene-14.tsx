// anxious-14 — "새 모델 = 이전 모델에 대한 인터넷 담론을 학습. 그런데 부정적."
// 의도: 파이프라인 다이어그램. 인터넷 → 학습 데이터 → 모델. 부정 담론 비중 시각화.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene14: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 36], [0, 0.08], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const headlineOp = interpolate(frame, [12, 42], [0, 1], { extrapolateRight: "clamp" });

  // 파이프라인 3단계
  const stage1In = spring({ frame: frame - 30, fps, config: { damping: 16, stiffness: 120 }, from: 0, to: 1 });
  const arrow1Progress = interpolate(frame, [56, 90], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const stage2In = spring({ frame: frame - 90, fps, config: { damping: 16, stiffness: 120 }, from: 0, to: 1 });
  const arrow2Progress = interpolate(frame, [116, 150], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const stage3In = spring({ frame: frame - 150, fps, config: { damping: 16, stiffness: 120 }, from: 0, to: 1 });

  // 부정 비율 막대 (우하단)
  const negRatio = interpolate(frame, [180, 260], [0, 0.78], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/data-visualization.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.4) hue-rotate(210deg) saturate(0.4)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,6,13,0.98) 0%, rgba(8,6,13,0.85) 50%, rgba(8,6,13,0.98) 100%)" }} />

      {/* 상단 kicker + headline */}
      <div style={{ position: "absolute", left: 200, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp }}>
        <span style={{ width: 38, height: 1, background: CORAL }} />
        <span style={{ fontSize: 17, letterSpacing: "0.4em", color: CORAL, fontWeight: 700 }}>HOW IT WORKS · 01</span>
      </div>

      <div style={{ position: "absolute", left: 200, top: 190, fontSize: 52, fontWeight: 400, color: "rgba(255,255,255,0.82)", letterSpacing: "-0.015em", maxWidth: 1600, opacity: headlineOp }}>
        새 모델은 <span style={{ fontWeight: 800, color: CORAL }}>이전 모델 담론</span>을 학습 데이터로 삼는다.
      </div>

      {/* 파이프라인 (3 stage) */}
      <div style={{ position: "absolute", left: 200, top: 430, right: 200, height: 280, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0 }}>
        {/* Stage 1 — 인터넷 담론 */}
        <div style={{ flex: "0 0 340px", transform: `scale(${stage1In})` }}>
          <div style={{ padding: "30px 28px", border: `1.5px solid rgba(255,255,255,0.22)`, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.35em", color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 10 }}>SOURCE</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>인터넷 담론</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Reddit · Twitter · Forums</div>
          </div>
        </div>

        {/* Arrow 1 */}
        <svg width={220} height={80}>
          <defs>
            <marker id="arr1-14" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.6)" />
            </marker>
          </defs>
          <line x1={10} y1={40} x2={210} y2={40} stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeDasharray={200} strokeDashoffset={200 - arrow1Progress * 200} markerEnd="url(#arr1-14)" />
        </svg>

        {/* Stage 2 — 학습 데이터 */}
        <div style={{ flex: "0 0 340px", transform: `scale(${stage2In})` }}>
          <div style={{ padding: "30px 28px", border: `1.5px solid rgba(255,255,255,0.22)`, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.35em", color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 10 }}>TRAINING DATA</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>학습 코퍼스</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>수백만 토큰의 이전 세대 담론</div>
          </div>
        </div>

        {/* Arrow 2 */}
        <svg width={220} height={80}>
          <defs>
            <marker id="arr2-14" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={MINT} />
            </marker>
          </defs>
          <line x1={10} y1={40} x2={210} y2={40} stroke={MINT} strokeWidth={2.5} strokeDasharray={200} strokeDashoffset={200 - arrow2Progress * 200} markerEnd="url(#arr2-14)" style={{ filter: `drop-shadow(0 0 8px ${MINT})` }} />
        </svg>

        {/* Stage 3 — 새 모델 */}
        <div style={{ flex: "0 0 340px", transform: `scale(${stage3In})` }}>
          <div style={{ padding: "30px 28px", border: `1.5px solid ${MINT}`, borderRadius: 8, background: "rgba(57,255,20,0.06)", boxShadow: `0 0 30px rgba(57,255,20,0.15)` }}>
            <div style={{ fontSize: 14, letterSpacing: "0.35em", color: MINT, fontWeight: 700, marginBottom: 10 }}>NEW MODEL</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>새 클로드</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>과거의 그림자를 품고 태어남</div>
          </div>
        </div>
      </div>

      {/* 하단 부정 비율 막대 */}
      <div style={{ position: "absolute", left: 200, right: 200, bottom: 150 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", letterSpacing: "0.2em" }}>담론 분포</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>negative · neutral · positive</span>
        </div>
        <div style={{ display: "flex", height: 22, borderRadius: 11, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ width: `${negRatio * 100}%`, background: CORAL, boxShadow: `0 0 12px ${CORAL}` }} />
          <div style={{ width: `${(1 - negRatio) * 60}%`, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ width: `${(1 - negRatio) * 40}%`, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 18, color: CORAL, letterSpacing: "0.08em", fontWeight: 600 }}>
          부정 <span style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(negRatio * 100)}%</span> — "대부분 부정적"
        </div>
      </div>
    </AbsoluteFill>
  );
};
