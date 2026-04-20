// anxious-10 — "30년간 개발자 / 작가 / 코치 / 하루 수십 번 AI와 대화"
// 의도: 3가지 역할 칩 가로배열 + 하단 AI 대화 빈도 카운터. 대각 비대칭 배치.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

const ROLES = [
  { ko: "개발자", en: "DEVELOPER", years: "30yrs", color: MINT, yOffset: 0 },
  { ko: "작가", en: "WRITER", years: "— now", color: "#e4e4e4", yOffset: 40 },
  { ko: "코치", en: "COACH", years: "— now", color: "#c5c5c5", yOffset: -30 },
];

export const AnxiousScene10: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 36], [0, 0.10], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [6, 26], [0, 1], { extrapolateRight: "clamp" });

  // AI counter 30~80 상승 애니메이션
  const counterValue = Math.floor(interpolate(frame, [110, 180], [0, 73], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const counterOp = interpolate(frame, [105, 130], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/corporate-office-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(10px) brightness(0.4) saturate(0.35)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,6,13,0.92) 0%, rgba(8,6,13,0.65) 100%)" }} />

      {/* 좌상 kicker */}
      <div style={{ position: "absolute", left: 200, top: 140, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp }}>
        <span style={{ width: 38, height: 1, background: MINT }} />
        <span style={{ fontSize: 17, letterSpacing: "0.45em", color: MINT, fontWeight: 700 }}>WHO IS GONGSIM</span>
      </div>

      {/* 3개 role 대각 나열 */}
      <div style={{ position: "absolute", left: 200, top: 260, width: 1520 }}>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {ROLES.map((r, i) => {
            const start = 20 + i * 22;
            const pop = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 150 }, from: 0, to: 1 });
            const op = interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={r.en} style={{ transform: `translate(0, ${r.yOffset}px) scale(${pop})`, transformOrigin: "left top", opacity: op, flex: "0 1 auto" }}>
                <div style={{ padding: "28px 40px", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${r.color === MINT ? MINT : "rgba(255,255,255,0.2)"}`, borderRadius: 6, minWidth: 340 }}>
                  <div style={{ fontSize: 14, letterSpacing: "0.4em", color: r.color === MINT ? MINT : "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 10 }}>{r.en}</div>
                  <div style={{ fontSize: 80, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{r.ko}</div>
                  <div style={{ marginTop: 12, fontSize: 18, color: r.color === MINT ? MINT : "rgba(255,255,255,0.55)", letterSpacing: "0.15em", fontWeight: 500 }}>{r.years}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 대각 연결선 */}
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        <path d="M 430 420 Q 780 460 880 400 Q 1100 320 1280 360" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="4 10" fill="none" />
      </svg>

      {/* 하단 AI 대화 카운터 */}
      <div style={{ position: "absolute", left: 200, bottom: 150, display: "flex", alignItems: "baseline", gap: 26, opacity: counterOp }}>
        <div style={{ fontSize: 20, letterSpacing: "0.28em", color: "rgba(255,255,255,0.55)" }}>AI 대화 / 하루</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 130, fontWeight: 900, color: MINT, letterSpacing: "-0.04em", lineHeight: 1, fontFeatureSettings: "'tnum' 1", textShadow: `0 0 30px rgba(57,255,20,0.3)` }}>{counterValue}</span>
          <span style={{ fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>+ 회</span>
        </div>
      </div>

      {/* 우하단 캡션 */}
      <div style={{ position: "absolute", right: 200, bottom: 180, fontSize: 22, color: "rgba(255,255,255,0.42)", letterSpacing: "0.12em", textAlign: "right", lineHeight: 1.5 }}>
        하루에도<br />수십 번 AI와 대화합니다.
      </div>
    </AbsoluteFill>
  );
};
