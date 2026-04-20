// scene-30 — "GitHub 별 75,000+ · vLLM 사실상 표준"
// 의도: GitHub star counter 가 거대하게 카운트업. 별들이 빗발치듯 쏟아지는 배경 파티클.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene30: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const countUp = Math.floor(interpolate(frame, [12, 120], [0, 75000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const standardBadgeOpacity = interpolate(frame, [130, 170], [0, 1], { extrapolateRight: "clamp" });

  // 별 파티클
  const stars = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: (i * 191) % 1920,
    delay: (i * 11) % 90,
    size: 1 + ((i * 13) % 30) / 10,
    drift: ((i * 37) % 40) - 20,
  }));

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1308 0%, #0a0608 85%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 떨어지는 별들 */}
      {stars.map((s) => {
        const progress = ((frame - s.delay) * 7) % 1400;
        const y = progress - 200;
        const opacity = interpolate(y, [-200, 0, 900, 1100], [0, 1, 1, 0]);
        const x = s.left + Math.sin((frame + s.id) / 30) * s.drift;
        return (
          <svg key={s.id} style={{ position: "absolute", left: x, top: y, opacity }} width={s.size * 10} height={s.size * 10} viewBox="0 0 12 12">
            <path d="M6 0 L7.5 4.5 L12 5 L8.5 8 L9.5 12 L6 9.5 L2.5 12 L3.5 8 L0 5 L4.5 4.5 Z" fill="#ffd166" />
          </svg>
        );
      })}

      {/* 상단 GitHub 브랜드 */}
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "10px 22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999 }}>
          {/* Github logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.58v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.33-1.76-1.33-1.76-1.08-.74.08-.72.08-.72 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.3 3.5 1 .1-.8.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.3.46-2.38 1.22-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23.96-.26 2-.4 3-.4s2.04.14 3 .4c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.76.84 1.22 1.92 1.22 3.22 0 4.6-2.8 5.63-5.47 5.93.43.37.82 1.1.82 2.22v3.28c0 .32.22.69.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
          </svg>
          <span style={{ fontSize: 20, color: "#fff", letterSpacing: "0.3em", fontWeight: 600 }}>GITHUB · vllm-project / vllm</span>
        </div>
      </div>

      {/* 중앙: 카운트업 숫자 */}
      <div style={{ position: "absolute", top: "36%", left: 0, right: 0, textAlign: "center", transform: "translateY(-50%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 30, justifyContent: "center" }}>
          <svg width={140} height={140} viewBox="0 0 24 24"><path fill="#ffd166" stroke="#ff9f1c" strokeWidth="0.6" d="M12 2L15 8.5 22 9.5 17 14.5 18.2 21.5 12 18 5.8 21.5 7 14.5 2 9.5 9 8.5Z" /></svg>
          <div style={{ fontSize: 260, fontWeight: 900, lineHeight: 0.9, color: "#ffd166", fontFeatureSettings: "'tnum'", letterSpacing: "-0.03em", textShadow: "0 20px 80px rgba(255,209,102,0.3)" }}>
            {countUp.toLocaleString()}
          </div>
        </div>
        <div style={{ fontSize: 42, color: "#ffbe5c", marginTop: 8, fontWeight: 600, letterSpacing: "0.18em" }}>GITHUB STARS &nbsp;·&nbsp; vLLM</div>
      </div>

      {/* 하단 standard 뱃지 */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center", opacity: standardBadgeOpacity }}>
        <div style={{ display: "inline-block", padding: "16px 40px", background: "linear-gradient(90deg, rgba(255,209,102,0.15), rgba(255,107,61,0.15))", border: "1px solid rgba(255,209,102,0.4)", borderRadius: 8 }}>
          <div style={{ fontSize: 40, color: "#fff", fontWeight: 700 }}>
            이 분야 &nbsp;<span style={{ color: "#ffd166", fontSize: 52, fontWeight: 900 }}>사실상 표준</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
