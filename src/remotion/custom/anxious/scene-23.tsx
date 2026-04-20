// anxious-23 — 팁 ① 긍정형 지시
// 의도: before/after 두 프롬프트 문장 대비. 위쪽 금지형(X) 아래쪽 긍정형(체크).
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene23: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const badOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
  const badY = interpolate(frame, [40, 70], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const arrowY = interpolate(frame, [80, 110], [0, 80], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const arrowOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const goodOp = interpolate(frame, [115, 150], [0, 1], { extrapolateRight: "clamp" });
  const goodY = interpolate(frame, [115, 150], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const footerOp = interpolate(frame, [170, 210], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(57,255,20,0.08) 0%, rgba(8,6,13,1) 65%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/laptop-home-office.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.3)" }}
        volume={0}
      />
      {/* 좌측 큰 번호 */}
      <div style={{ position: "absolute", left: 160, top: 200, transform: `scale(${numPop})`, transformOrigin: "top left" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.5em", color: MINT, fontWeight: 700, marginBottom: 12 }}>TIP · 01</div>
        <div style={{ fontSize: 320, fontWeight: 900, color: MINT, lineHeight: 0.85, letterSpacing: "-0.06em", textShadow: `0 0 60px rgba(57,255,20,0.35)` }}>
          01
        </div>
      </div>

      {/* 제목 */}
      <div style={{ position: "absolute", left: 160, top: 620, width: 560, opacity: titleOp }}>
        <div style={{ fontSize: 74, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          긍정형으로<br /><span style={{ color: MINT }}>지시하라.</span>
        </div>
      </div>

      {/* 우측 Before/After 카드 */}
      <div style={{ position: "absolute", right: 160, top: 240, width: 820 }}>
        {/* BAD */}
        <div style={{ opacity: badOp, transform: `translateY(${badY}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: CORAL, color: "#fff", fontSize: 20, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</span>
            <span style={{ fontSize: 16, letterSpacing: "0.4em", color: CORAL, fontWeight: 700 }}>DON'T</span>
          </div>
          <div style={{ padding: "30px 34px", background: "rgba(255,122,122,0.07)", border: `1.5px solid ${CORAL}`, borderRadius: 10 }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.015em" }}>
              "긴 문장 <span style={{ color: CORAL, textDecoration: "underline", textDecorationStyle: "wavy" }}>쓰지 마.</span>"
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <div style={{ margin: "22px 0", textAlign: "center", opacity: arrowOp }}>
          <svg width={40} height={50} viewBox="0 0 40 50">
            <path d={`M 20 0 L 20 ${arrowY}`} stroke={MINT} strokeWidth={3} markerEnd="url(#arrow-23)" />
            <defs>
              <marker id="arrow-23" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={MINT} />
              </marker>
            </defs>
          </svg>
        </div>

        {/* GOOD */}
        <div style={{ opacity: goodOp, transform: `translateY(${goodY}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: MINT, color: INK, fontSize: 20, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>
            <span style={{ fontSize: 16, letterSpacing: "0.4em", color: MINT, fontWeight: 700 }}>DO</span>
          </div>
          <div style={{ padding: "30px 34px", background: "rgba(57,255,20,0.07)", border: `1.5px solid ${MINT}`, borderRadius: 10, boxShadow: `0 0 30px rgba(57,255,20,0.18)` }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.015em" }}>
              "짧고 임팩트 있는 문장으로 <span style={{ color: MINT }}>써줘.</span>"
            </div>
          </div>
        </div>
      </div>

      {/* 하단 footer 설명 */}
      <div style={{ position: "absolute", left: 160, bottom: 130, opacity: footerOp, fontSize: 22, color: "rgba(255,255,255,0.65)", letterSpacing: "0.03em", maxWidth: 1600 }}>
        <span style={{ color: CORAL }}>금지형 →</span> 모델을 편집증적 상태로. <span style={{ color: MINT, marginLeft: 20 }}>긍정형 →</span> 달성할 목표를 준다.
      </div>
    </AbsoluteFill>
  );
};
