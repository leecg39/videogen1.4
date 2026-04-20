// scene-07 — "또 다른 사람. 100달러 요금제. 원래 8시간 → 이제 1시간."
// 의도: Before/After. 왼쪽 8시간 full clock + 오른쪽 1시간 shrunk clock. 가운데 100달러 지폐 타이틀.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const RED = "#ff3352";
const AMBER = "#ff9b3d";

function Clock({ hours, color, size, labelColor, label }: { hours: number; color: string; size: number; labelColor: string; label: string }) {
  const angle = (hours / 12) * Math.PI * 2 - Math.PI / 2;
  const r = size / 2 - 12;
  const hx = size / 2 + Math.cos(angle) * (r * 0.65);
  const hy = size / 2 + Math.sin(angle) * (r * 0.65);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${hours / 12 * 2 * Math.PI * r} 999`} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
        <line x1={size / 2} y1={size / 2} x2={hx} y2={hy} stroke={color} strokeWidth={5} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={6} fill={color} />
        {[0, 3, 6, 9].map((h) => {
          const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
          const tx = size / 2 + Math.cos(a) * (r - 2);
          const ty = size / 2 + Math.sin(a) * (r - 2);
          return <circle key={h} cx={tx} cy={ty} r={3} fill="rgba(255,255,255,0.4)" />;
        })}
      </svg>
      <div style={{ fontSize: 14, letterSpacing: "0.4em", color: labelColor, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

export const Scene07: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.1], { extrapolateRight: "clamp" });

  // 상단 100달러 배지
  const dollarPop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 140 }, from: 0.7, to: 1 });
  const dollarOp = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" });

  // 왼쪽 8시간 클럭
  const leftIn = interpolate(frame, [30, 70], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const leftOp = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" });

  // 오른쪽 1시간 클럭 (늦게 등장, shrink 효과)
  const rightIn = interpolate(frame, [170, 220], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const rightOp = interpolate(frame, [170, 220], [0, 1], { extrapolateRight: "clamp" });
  const rightShrink = interpolate(frame, [220, 260], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 중앙 화살표 — 오른쪽 등장 후 drawing
  const arrowDraw = interpolate(frame, [130, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#080609", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center top, rgba(57,255,20,0.06) 0%, rgba(8,6,9,0.98) 60%)", opacity: bgIn + 0.85 }} />

      {/* 상단 100달러 배지 */}
      <div style={{ position: "absolute", top: 120, left: "50%", transform: `translateX(-50%) scale(${dollarPop})`, opacity: dollarOp, display: "flex", alignItems: "center", gap: 18, padding: "18px 32px", background: "rgba(57,255,20,0.06)", border: `2px solid ${MINT}`, borderRadius: 4, boxShadow: `0 20px 60px rgba(57,255,20,0.18)` }}>
        <span style={{ fontSize: 14, letterSpacing: "0.5em", color: MINT, fontWeight: 800 }}>CASE 03</span>
        <span style={{ width: 36, height: 1, background: MINT }} />
        <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFeatureSettings: "'tnum'", letterSpacing: "-0.02em" }}>$100</span>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>요금제 사용자</span>
      </div>

      {/* 왼쪽: 8시간 */}
      <div style={{ position: "absolute", top: 270, left: 260, opacity: leftOp, transform: `translateY(${leftIn}px)` }}>
        <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", fontWeight: 700, textAlign: "center", marginBottom: 16 }}>BEFORE · 원래</div>
        <Clock hours={8} color={MINT} size={320} labelColor="rgba(255,255,255,0.7)" label="8 HOURS" />
        <div style={{ fontSize: 110, fontWeight: 900, color: MINT, textAlign: "center", marginTop: 18, fontFeatureSettings: "'tnum'", letterSpacing: "-0.04em", lineHeight: 1 }}>8<span style={{ fontSize: 48, marginLeft: 8, color: "#fff" }}>h</span></div>
      </div>

      {/* 중앙 화살표 */}
      <div style={{ position: "absolute", top: 440, left: "50%", transform: "translateX(-50%)", width: 260, opacity: interpolate(frame, [130, 170], [0, 1], { extrapolateRight: "clamp" }) }}>
        <svg viewBox="0 0 260 60" width="260" height="60">
          <defs>
            <linearGradient id="gr07" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={MINT} />
              <stop offset="100%" stopColor={RED} />
            </linearGradient>
          </defs>
          <path d="M 10 30 L 220 30" stroke="url(#gr07)" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${arrowDraw * 210} 999`} />
          <path d="M 205 14 L 245 30 L 205 46" stroke={RED} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={arrowDraw > 0.8 ? 1 : 0} />
        </svg>
        <div style={{ fontSize: 26, color: RED, fontWeight: 800, textAlign: "center", marginTop: 4, letterSpacing: "-0.01em", opacity: arrowDraw > 0.7 ? 1 : 0 }}>
          −87%
        </div>
      </div>

      {/* 오른쪽: 1시간 */}
      <div style={{ position: "absolute", top: 270, right: 260, opacity: rightOp, transform: `translateY(${rightIn}px) scale(${rightShrink})`, transformOrigin: "center top" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.3em", color: RED, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>AFTER · 이제</div>
        <Clock hours={1} color={RED} size={320} labelColor={RED} label="1 HOUR ONLY" />
        <div style={{ fontSize: 180, fontWeight: 900, color: RED, textAlign: "center", marginTop: 18, fontFeatureSettings: "'tnum'", letterSpacing: "-0.04em", lineHeight: 0.9, textShadow: `0 20px 50px ${RED}66` }}>1<span style={{ fontSize: 68, marginLeft: 8, color: "#fff" }}>h</span></div>
      </div>

      {/* 하단 캡션 */}
      <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", fontSize: 24, color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em", opacity: interpolate(frame, [260, 300], [0, 1], { extrapolateRight: "clamp" }) }}>
        <span style={{ color: "#fff", fontWeight: 700 }}>어느 날부터</span> 한도가 1시간 만에 바닥.
      </div>
    </AbsoluteFill>
  );
};
