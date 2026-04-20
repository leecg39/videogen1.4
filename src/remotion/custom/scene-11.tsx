// scene-11 — "둘째 원인. 피크 시간대 같은 작업이 2배. 엔트로픽이 피크 요금 2배 인상."
// 의도: ② 번호 + 24시간 라디얼 히트맵. 피크 구간 빨갛게 2배 하이라이트.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const RED = "#ff3352";
const AMBER = "#ff9b3d";

export const Scene11: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.12], { extrapolateRight: "clamp" });

  const badgePop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 150 }, from: 0.5, to: 1 });
  const badgeOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 클럭 등장
  const clockIn = interpolate(frame, [50, 90], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const clockOp = interpolate(frame, [50, 90], [0, 1], { extrapolateRight: "clamp" });

  // peak 구간 하이라이트 progress
  const peakGrow = interpolate(frame, [90, 170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 2x 뱃지
  const twoX = spring({ frame: frame - 170, fps, config: { damping: 10, stiffness: 180 }, from: 0.5, to: 1 });
  const twoXOp = interpolate(frame, [170, 200], [0, 1], { extrapolateRight: "clamp" });
  const twoXPulse = 0.9 + 0.1 * Math.abs(Math.sin(frame / 8));

  // 서브 카드 영수증
  const recIn = interpolate(frame, [210, 250], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const recOp = interpolate(frame, [210, 250], [0, 1], { extrapolateRight: "clamp" });

  // 시계 세그먼트 — 피크 = 9~18시
  const segments = Array.from({ length: 24 }, (_, h) => {
    const isPeak = h >= 9 && h < 18;
    const startA = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const endA = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2;
    return { h, isPeak, startA, endA };
  });

  const CX = 200, CY = 200, RO = 170, RI = 130;

  function arcPath(startA: number, endA: number, ro: number, ri: number) {
    const x1 = CX + Math.cos(startA) * ro;
    const y1 = CY + Math.sin(startA) * ro;
    const x2 = CX + Math.cos(endA) * ro;
    const y2 = CY + Math.sin(endA) * ro;
    const x3 = CX + Math.cos(endA) * ri;
    const y3 = CY + Math.sin(endA) * ri;
    const x4 = CX + Math.cos(startA) * ri;
    const y4 = CY + Math.sin(startA) * ri;
    return `M ${x1} ${y1} A ${ro} ${ro} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 0 0 ${x4} ${y4} Z`;
  }

  return (
    <AbsoluteFill style={{ background: "#08060a", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(255,51,82,0.1) 0%, rgba(8,6,10,0.98) 60%)", opacity: bgIn + 0.85 }} />

      {/* Step 뱃지 */}
      <div style={{ position: "absolute", top: 120, left: 140, opacity: badgeOp, transform: `scale(${badgePop})`, transformOrigin: "top left", display: "flex", alignItems: "baseline", gap: 24 }}>
        <span style={{ fontSize: 180, fontWeight: 900, color: RED, lineHeight: 0.85, letterSpacing: "-0.04em", fontFeatureSettings: "'tnum'", textShadow: `0 12px 40px ${RED}44` }}>②</span>
        <div>
          <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>CAUSE · 둘째 원인</div>
          <div style={{ fontSize: 44, color: "#fff", fontWeight: 700, letterSpacing: "-0.01em" }}>피크 시간대 <span style={{ color: RED }}>요금 2배</span></div>
        </div>
      </div>

      {/* 24h 라디얼 */}
      <div style={{ position: "absolute", top: 320, left: 140, opacity: clockOp, transform: `translateY(${clockIn}px)` }}>
        <svg viewBox="0 0 400 400" width="400" height="400">
          {/* 배경 세그먼트 */}
          {segments.map((s) => (
            <path key={`bg-${s.h}`} d={arcPath(s.startA, s.endA, RO - 2, RI + 2)} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
          ))}
          {/* 피크 하이라이트 */}
          {segments.filter((s) => s.isPeak).slice(0, Math.ceil(peakGrow * 9)).map((s) => (
            <path key={`peak-${s.h}`} d={arcPath(s.startA, s.endA, RO - 2, RI + 2)} fill={RED} opacity={0.85} style={{ filter: `drop-shadow(0 0 10px ${RED}99)` }} />
          ))}
          {/* 시간 레이블 */}
          {[0, 6, 12, 18].map((h) => {
            const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
            const tx = CX + Math.cos(a) * (RO + 24);
            const ty = CY + Math.sin(a) * (RO + 24);
            return <text key={h} x={tx} y={ty + 5} textAnchor="middle" fontSize={20} fill="rgba(255,255,255,0.55)" fontFamily="'JetBrains Mono'" fontWeight={700}>{String(h).padStart(2, "0")}</text>;
          })}
          {/* 중앙 라벨 */}
          <text x={CX} y={CY - 10} textAnchor="middle" fontSize={16} fill="rgba(255,255,255,0.45)" style={{ letterSpacing: "0.25em" }} fontWeight={700}>PEAK HOURS</text>
          <text x={CX} y={CY + 26} textAnchor="middle" fontSize={44} fill={RED} fontWeight={900} fontFamily="'Space Grotesk'" style={{ letterSpacing: "-0.02em" }}>09 — 18</text>
          <text x={CX} y={CY + 54} textAnchor="middle" fontSize={15} fill="rgba(255,255,255,0.5)" style={{ letterSpacing: "0.3em" }}>KST</text>
        </svg>
      </div>

      {/* 우측 2x 뱃지 + 영수증 */}
      <div style={{ position: "absolute", top: 310, right: 140, width: 520 }}>
        <div style={{ textAlign: "center", opacity: twoXOp, transform: `scale(${twoX * twoXPulse})`, transformOrigin: "center" }}>
          <div style={{ fontSize: 18, letterSpacing: "0.45em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>SAME TASK · COST</div>
          <div style={{ fontSize: 280, fontWeight: 900, color: RED, lineHeight: 0.85, letterSpacing: "-0.05em", fontFeatureSettings: "'tnum'", textShadow: `0 20px 60px ${RED}55` }}>
            ×2
          </div>
          <div style={{ fontSize: 24, color: "#fff", letterSpacing: "-0.01em", marginTop: 4 }}>같은 작업, <span style={{ color: RED, fontWeight: 700 }}>사용량은 2배.</span></div>
        </div>

        <div style={{ marginTop: 24, padding: "20px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, opacity: recOp, transform: `translateY(${recIn}px)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", fontFamily: "'JetBrains Mono'", marginBottom: 8 }}>
            <span>03:00 AM</span>
            <span style={{ color: MINT }}>x1 BASE</span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", fontFamily: "'JetBrains Mono'" }}>
            <span>14:00 PM</span>
            <span style={{ color: RED, fontWeight: 800 }}>x2 PEAK</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
