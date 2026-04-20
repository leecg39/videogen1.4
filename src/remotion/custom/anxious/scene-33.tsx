// anxious-33 — 팀장 비유 + "도구 vs 파트너". 단기 vs 장기 비교 / 도구 그림 vs 파트너.
// 의도: 상단 팀장 비유 / 하단 도구 vs 파트너 결론. 분할 + 진술.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene33: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.10], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  const shortBarGrow = interpolate(frame, [40, 110], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const longBarGrow = interpolate(frame, [60, 160], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const longBarFall = interpolate(frame, [160, 240], [1, -0.2], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });

  const conclusionOp = interpolate(frame, [240, 290], [0, 1], { extrapolateRight: "clamp" });
  const toolOp = interpolate(frame, [260, 310], [0, 1], { extrapolateRight: "clamp" });
  const partnerOp = interpolate(frame, [310, 360], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/business-meeting.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.38) saturate(0.25)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,6,13,0.95) 0%, rgba(8,6,13,0.78) 50%, rgba(8,6,13,0.98) 100%)" }} />

      {/* 상단 kicker */}
      <div style={{ position: "absolute", left: 160, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.4em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        <span style={{ width: 38, height: 1, background: CORAL }} />
        30 YEARS · PATTERN OBSERVED
      </div>

      {/* 상단 — 팀장 성과 곡선 */}
      <div style={{ position: "absolute", left: 160, top: 210, right: 160 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", marginBottom: 32 }}>
          팀원을 <span style={{ color: CORAL }}>겁주는 팀장</span>의 성과 곡선
        </div>

        {/* graph */}
        <div style={{ position: "relative", height: 280 }}>
          <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1600 280" width="100%" height={280} preserveAspectRatio="none">
            {/* baseline */}
            <line x1={0} y1={250} x2={1600} y2={250} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
            {/* short-term good bar */}
            <rect x={80} y={90} width={200} height={160} fill={CORAL} opacity={0.35 + 0.5 * shortBarGrow} rx={4} />
            <text x={180} y={74} fill={CORAL} fontSize={22} textAnchor="middle" fontWeight={800} opacity={shortBarGrow}>단기 ↑</text>
            {/* long-term collapse curve */}
            <path
              d={`M 380 ${250 - longBarGrow * 90} Q 720 ${250 - longBarGrow * 130 + Math.max(0, -longBarFall) * 160} 1120 ${250 + Math.max(0, -longBarFall) * 220}`}
              stroke={CORAL}
              strokeWidth={4}
              fill="none"
              style={{ filter: `drop-shadow(0 0 8px ${CORAL})` }}
            />
            <text x={1250} y={260} fill={CORAL} fontSize={22} fontWeight={800} opacity={interpolate(frame, [200, 240], [0, 1], { extrapolateRight: "clamp" })}>장기 ↓ 붕괴</text>
          </svg>
        </div>
      </div>

      {/* 하단 결론: 도구 vs 파트너 */}
      <div style={{ position: "absolute", left: 160, bottom: 150, right: 160, opacity: conclusionOp }}>
        <div style={{ fontSize: 18, letterSpacing: "0.4em", color: MINT, fontWeight: 700, marginBottom: 18 }}>AI — YOUR CHOICE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div style={{ opacity: toolOp, padding: "24px 30px", border: `1px solid rgba(255,255,255,0.25)`, borderRadius: 10 }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", fontWeight: 700, marginBottom: 10 }}>AS A TOOL</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>도구만큼만 <span style={{ color: "rgba(255,255,255,0.45)" }}>되돌아옵니다.</span></div>
          </div>
          <div style={{ opacity: partnerOp, padding: "24px 30px", background: "rgba(57,255,20,0.06)", border: `1.5px solid ${MINT}`, borderRadius: 10, boxShadow: `0 0 30px rgba(57,255,20,0.15)` }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: MINT, fontWeight: 700, marginBottom: 10 }}>AS A PARTNER</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>파트너만큼 <span style={{ color: MINT }}>돌아옵니다.</span></div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
