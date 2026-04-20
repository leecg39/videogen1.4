// anxious-02 — "분명 똑같은 모델인데, 어떤 날은 클로드가 천재 같고,"
// 의도: 대비 셋업. 중앙 "SAME MODEL" 라벨 + 좌측 하늘로 올라가는 "천재" 화살표.
// 03과 대비쌍(03은 하강/어두움). 공중에 떠 있는 GENIUS 체크.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene02: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 36], [0, 0.12], { extrapolateRight: "clamp" });

  const badgeIn = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 140 }, from: 0, to: 1 });
  const modelTextOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const modelTextY = interpolate(frame, [10, 30], [18, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const arrowProgress = interpolate(frame, [28, 70], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const geniusPop = spring({ frame: frame - 50, fps, config: { damping: 11, stiffness: 170 }, from: 0, to: 1 });
  const geniusGlow = interpolate(frame, [50, 90, 130], [0.0, 1.0, 0.85], { extrapolateRight: "clamp" });

  const dayLabelOp = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/futuristic-technology-abstract.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(12px) brightness(0.5) saturate(0.6) hue-rotate(150deg)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 90%, rgba(8,6,13,0.60) 0%, rgba(8,6,13,0.98) 80%)" }} />

      {/* 중앙 고정 "SAME MODEL" badge */}
      <div style={{ position: "absolute", left: "50%", top: 640, transform: `translate(-50%, 0) scale(${badgeIn})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ padding: "16px 44px", border: `1.5px solid rgba(255,255,255,0.4)`, borderRadius: 999, fontSize: 20, letterSpacing: "0.4em", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
          SAME&nbsp;&nbsp;MODEL
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", opacity: modelTextOp, transform: `translateY(${modelTextY}px)` }}>
          분명 똑같은 모델인데
        </div>
      </div>

      {/* 좌측 상단 화살표 위로 올라가는 경로 */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        <defs>
          <marker id="arrow-up-02" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={MINT} />
          </marker>
        </defs>
        <path
          d="M 900 660 Q 700 520 520 300"
          stroke={MINT}
          strokeWidth={3}
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={600 - arrowProgress * 600}
          markerEnd="url(#arrow-up-02)"
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 12px ${MINT})` }}
        />
      </svg>

      {/* GENIUS 카드 (좌상) */}
      <div style={{
        position: "absolute",
        left: 300, top: 200,
        transform: `scale(${geniusPop})`,
        transformOrigin: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", border: `3px solid ${MINT}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px rgba(57,255,20,${geniusGlow * 0.5})` }}>
            <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: 54, fontWeight: 700, color: MINT, letterSpacing: "-0.02em", textShadow: `0 0 20px rgba(57,255,20,${geniusGlow * 0.4})` }}>천재</div>
          <div style={{ fontSize: 16, letterSpacing: "0.38em", color: "rgba(255,255,255,0.55)" }}>A DAY</div>
        </div>
      </div>

      {/* 우측에 희미한 물음표 — 반대편 예고 */}
      <div style={{ position: "absolute", right: 280, top: 560, fontSize: 260, color: "rgba(255,255,255,0.04)", fontWeight: 900, lineHeight: 1 }}>
        ?
      </div>

      {/* 좌측 dayLabel */}
      <div style={{ position: "absolute", left: 160, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: dayLabelOp }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: MINT, boxShadow: `0 0 10px ${MINT}` }} />
        <span style={{ fontSize: 17, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>DAY · A</span>
      </div>
    </AbsoluteFill>
  );
};
