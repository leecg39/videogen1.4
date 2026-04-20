// scene-10 — "첫째 원인. 3월 말 사용량 이벤트 종료. 넉넉했는데 갑자기 절반."
// 의도: 세 가지 원인 중 ① 제시. 달력 메타포 + 바닥으로 절반 내려가는 라인 차트.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const AMBER = "#ff9b3d";

export const Scene10: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.1], { extrapolateRight: "clamp" });

  // Step indicator 팝
  const badgePop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 150 }, from: 0.5, to: 1 });
  const badgeOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 헤드라인
  const headIn = interpolate(frame, [18, 50], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const headOp = interpolate(frame, [18, 50], [0, 1], { extrapolateRight: "clamp" });

  // 차트 경로
  const pathProgress = interpolate(frame, [50, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 첫 8포인트는 높이 유지 (100%), 9번째부터 drop → 50%
  const points = Array.from({ length: 14 }, (_, i) => {
    const x = 60 + (i / 13) * 600;
    const isMarch = i < 9;
    const y = isMarch ? 60 + Math.sin(i * 0.7) * 12 : 150 + Math.sin(i * 0.7) * 8;
    return { x, y, isMarch };
  });

  // drop 라인 visible 개수
  const visible = Math.round(pathProgress * 14);
  const pathD = points.slice(0, visible).map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const filledD = pathD + (visible > 0 ? ` L ${points[visible - 1]?.x ?? 60} 240 L 60 240 Z` : "");

  // 절반 화살표
  const halfIn = interpolate(frame, [180, 220], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#08060a", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(57,255,20,0.08) 0%, rgba(8,6,10,0.98) 60%)", opacity: bgIn + 0.85 }} />

      {/* Step 뱃지 */}
      <div style={{ position: "absolute", top: 120, left: 140, opacity: badgeOp, transform: `scale(${badgePop})`, transformOrigin: "top left", display: "flex", alignItems: "baseline", gap: 24 }}>
        <span style={{ fontSize: 180, fontWeight: 900, color: MINT, lineHeight: 0.85, letterSpacing: "-0.04em", fontFeatureSettings: "'tnum'", textShadow: `0 12px 40px ${MINT}33` }}>①</span>
        <div>
          <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>CAUSE · 첫째 원인</div>
          <div style={{ fontSize: 44, color: "#fff", fontWeight: 700, letterSpacing: "-0.01em" }}>3월 말 <span style={{ color: MINT }}>이벤트 종료</span></div>
        </div>
      </div>

      {/* 달력 타임라인 */}
      <div style={{ position: "absolute", top: 320, left: 140, right: 140, opacity: headOp, transform: `translateY(${headIn}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 18, fontFamily: "'JetBrains Mono', monospace" }}>
          <span>MAR</span>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
          <span style={{ color: AMBER }}>APR · 종료</span>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
          <span>NOW</span>
        </div>

        {/* SVG 차트 */}
        <svg viewBox="0 0 720 280" width="100%" height="280" style={{ display: "block" }}>
          {/* 수평 점선 기준선 (100% / 50%) */}
          <line x1={60} x2={660} y1={60} y2={60} stroke={MINT} strokeWidth={1} strokeDasharray="4 6" opacity={0.35} />
          <line x1={60} x2={660} y1={150} y2={150} stroke={AMBER} strokeWidth={1} strokeDasharray="4 6" opacity={0.35} />
          <text x={662} y={66} fontSize={14} fill={MINT} fontFamily="'JetBrains Mono'" style={{ letterSpacing: "0.1em" }}>100%</text>
          <text x={662} y={156} fontSize={14} fill={AMBER} fontFamily="'JetBrains Mono'" style={{ letterSpacing: "0.1em" }}>50%</text>

          {/* cliff 수직선 (이벤트 종료 지점) */}
          <line x1={396} x2={396} y1={50} y2={250} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 4" />
          <text x={398} y={245} fontSize={13} fill="rgba(255,255,255,0.6)" fontFamily="'JetBrains Mono'" style={{ letterSpacing: "0.1em" }}>EVENT END</text>

          {/* fill area */}
          <path d={filledD} fill={`url(#grad10)`} opacity={0.25} />
          <defs>
            <linearGradient id="grad10" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={MINT} stopOpacity={0.8} />
              <stop offset="50%" stopColor={AMBER} stopOpacity={0.4} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* line */}
          <path d={pathD} stroke={MINT} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${MINT}99)` }} />

          {/* dots */}
          {points.slice(0, visible).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill={p.isMarch ? MINT : AMBER} />
          ))}
        </svg>
      </div>

      {/* 우측 절반 화살표 + 라벨 */}
      <div style={{ position: "absolute", right: 140, bottom: 180, textAlign: "right", opacity: halfIn }}>
        <div style={{ fontSize: 14, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 700, marginBottom: 6 }}>IMPACT</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: AMBER, lineHeight: 0.9, fontFeatureSettings: "'tnum'", letterSpacing: "-0.04em", textShadow: `0 16px 50px ${AMBER}44` }}>
          −50%
        </div>
        <div style={{ fontSize: 22, color: "#fff", marginTop: 6 }}>갑자기 <span style={{ color: AMBER, fontWeight: 700 }}>절반</span>으로.</div>
      </div>
    </AbsoluteFill>
  );
};
