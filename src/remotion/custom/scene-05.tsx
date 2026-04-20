// scene-05 — "돈 내고 정당하게 쓰는데, 사용량이 너무 빨리 바닥. 저는 맥스 10 요금제."
// 의도: 분노 심화 + 요금제 맥락 도입. 영수증/가격표 메타포 + 드롭되는 바.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const AMBER = "#ff9b3d";
const MINT = "#39FF14";

export const Scene05: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.1], { extrapolateRight: "clamp" });

  // 영수증 슬라이드 인
  const receiptIn = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 110 }, from: 80, to: 0 });
  const receiptOp = interpolate(frame, [6, 36], [0, 1], { extrapolateRight: "clamp" });

  // 가격 숫자 counter
  const price = Math.round(interpolate(frame, [38, 78], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  // 바닥으로 떨어지는 토큰 게이지 (100% → 0%)
  const drop = interpolate(frame, [170, 280], [1, 0.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });

  // 서브 텍스트
  const subIn = interpolate(frame, [90, 120], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const subOp = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0a0608", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 40%, rgba(255,155,61,0.1) 0%, rgba(10,6,8,0.98) 60%)", opacity: bgIn + 0.85 }} />

      {/* 상단 Kicker */}
      <div style={{ position: "absolute", top: 120, left: 140, display: "flex", gap: 22, alignItems: "center", opacity: receiptOp }}>
        <span style={{ fontSize: 18, letterSpacing: "0.45em", color: AMBER, fontWeight: 800 }}>PAY & LOSE</span>
        <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.3)" }} />
        <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>돈 내는데 왜 바닥?</span>
      </div>

      {/* 좌측: 영수증 카드 */}
      <div style={{ position: "absolute", top: 200, left: 140, width: 600, padding: 36, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,155,61,0.5)", borderRadius: 6, opacity: receiptOp, transform: `translateY(${receiptIn}px)`, fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)", marginBottom: 14, fontWeight: 700 }}>RECEIPT · 월정액 MAX 10</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>Claude Code · Max 10</span>
          <span style={{ fontSize: 72, fontWeight: 900, color: "#fff", fontFeatureSettings: "'tnum'", letterSpacing: "-0.03em" }}>
            ${price}
          </span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "rgba(255,255,255,0.6)" }}>
          <span>기대: 하루 5~8시간 충분</span>
          <span style={{ color: AMBER }}>✓ PAID</span>
        </div>
        <div style={{ marginTop: 26, padding: "14px 18px", background: "rgba(255,51,82,0.12)", border: "1px solid rgba(255,51,82,0.4)", borderRadius: 4 }}>
          <div style={{ fontSize: 16, color: "#ff6b87", letterSpacing: "0.2em", fontWeight: 700 }}>⚠ 체감</div>
          <div style={{ fontSize: 24, color: "#fff", marginTop: 4 }}>너무 빨리 바닥.</div>
        </div>
      </div>

      {/* 우측: 드롭 게이지 */}
      <div style={{ position: "absolute", top: 200, right: 110, width: 660 }}>
        <div style={{ fontSize: 22, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)", fontWeight: 700, marginBottom: 20 }}>TOKEN POOL</div>
        <div style={{ position: "relative", width: "100%", height: 440, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${drop * 100}%`, background: `linear-gradient(180deg, ${AMBER} 0%, #ff3352 100%)`, transition: "height 0.05s linear", boxShadow: `0 -20px 60px ${AMBER}55 inset` }} />
          {[0.25, 0.5, 0.75].map((p) => (
            <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: "rgba(255,255,255,0.12)" }}>
              <span style={{ position: "absolute", right: 10, top: -10, fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>{p * 100}%</span>
            </div>
          ))}
          <div style={{ position: "absolute", top: 20, left: 20, fontSize: 76, fontWeight: 900, color: drop > 0.2 ? AMBER : "#ff3352", fontFeatureSettings: "'tnum'", letterSpacing: "-0.03em" }}>
            {Math.round(drop * 100)}%
          </div>
        </div>
        <div style={{ marginTop: 22, fontSize: 22, color: "rgba(255,255,255,0.6)", opacity: subOp, transform: `translateY(${subIn}px)` }}>
          쓴 만큼 내고 있는데, <span style={{ color: "#fff", fontWeight: 700 }}>바닥까지 순식간.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
