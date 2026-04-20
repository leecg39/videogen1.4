// anxious-35 — 마무리 CTA. "반박해도 된다" 실험 + 구독/좋아요 + 사인오프.
// 의도: 좌측 실험 지시 카드 + 우측 CTA 아이콘 + 중앙 아래 signature.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene35: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.10], { extrapolateRight: "clamp" });

  const kickerOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });
  const taskOp = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: "clamp" });
  const taskScale = interpolate(frame, [20, 60], [0.95, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const cursorBlink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.1;

  const likeIn = spring({ frame: frame - 140, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });
  const subIn = spring({ frame: frame - 170, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });
  const bellIn = spring({ frame: frame - 200, fps, config: { damping: 14, stiffness: 140 }, from: 0, to: 1 });

  const sigOp = interpolate(frame, [240, 290], [0, 1], { extrapolateRight: "clamp" });
  const thanksOp = interpolate(frame, [310, 360], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/futuristic-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(14px) brightness(0.45) hue-rotate(80deg) saturate(0.5)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 65%, rgba(8,6,13,0.75) 0%, rgba(8,6,13,0.98) 80%)" }} />

      {/* 상단 kicker */}
      <div style={{ position: "absolute", left: 160, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: kickerOp, fontSize: 17, letterSpacing: "0.45em", color: MINT, fontWeight: 700 }}>
        <span style={{ width: 38, height: 1, background: MINT }} />
        TRY THIS TODAY
      </div>

      {/* 중앙 실험 카드 */}
      <div style={{ position: "absolute", left: 160, top: 220, right: 160, opacity: taskOp, transform: `scale(${taskScale})`, transformOrigin: "center top" }}>
        <div style={{ padding: "44px 52px", background: "rgba(20,20,28,0.75)", border: `1.5px solid ${MINT}`, borderRadius: 14, boxShadow: `0 0 40px rgba(57,255,20,0.2)` }}>
          <div style={{ fontSize: 16, letterSpacing: "0.38em", color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 16 }}>NEXT CLAUDE SESSION · LINE 1</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, color: "#fff", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>&gt; </span>
            <span>"더 나은 관점이 보이면 </span>
            <span style={{ color: MINT, fontWeight: 700, textShadow: `0 0 14px ${MINT}` }}>반박해 주세요</span>
            <span>."</span>
            <span style={{ marginLeft: 8, color: MINT, opacity: cursorBlink }}>▋</span>
          </div>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 32, height: 1, background: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>
              단 한 줄로 다음 두 시간이 달라집니다.
            </span>
          </div>
        </div>
      </div>

      {/* CTA 3 아이콘 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 60 }}>
        {/* Like */}
        <div style={{ transform: `scale(${likeIn})`, textAlign: "center" }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid ${MINT}`, background: "rgba(57,255,20,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: `0 0 24px rgba(57,255,20,0.3)` }}>
            <svg width={54} height={54} viewBox="0 0 24 24" fill={MINT} stroke={MINT} strokeWidth={1}>
              <path d="M7 22V11M2 13v7a2 2 0 002 2h14.5a2 2 0 002-1.5l1.5-7A1 1 0 0021 12h-6V5a3 3 0 00-3-3l-4 10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ marginTop: 14, fontSize: 20, letterSpacing: "0.2em", color: "#fff", fontWeight: 700 }}>LIKE</div>
          <div style={{ fontSize: 13, letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)" }}>좋아요</div>
        </div>
        {/* Subscribe */}
        <div style={{ transform: `scale(${subIn})`, textAlign: "center" }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid ${MINT}`, background: MINT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: `0 0 36px rgba(57,255,20,0.6)` }}>
            <svg width={54} height={54} viewBox="0 0 24 24" fill={INK} stroke={INK} strokeWidth={2}>
              <polygon points="8 5 19 12 8 19 8 5" />
            </svg>
          </div>
          <div style={{ marginTop: 14, fontSize: 20, letterSpacing: "0.2em", color: MINT, fontWeight: 800 }}>SUBSCRIBE</div>
          <div style={{ fontSize: 13, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)" }}>구독</div>
        </div>
        {/* Bell */}
        <div style={{ transform: `scale(${bellIn})`, textAlign: "center" }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid ${MINT}`, background: "rgba(57,255,20,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: `0 0 24px rgba(57,255,20,0.3)` }}>
            <svg width={54} height={54} viewBox="0 0 24 24" fill={MINT} stroke={MINT} strokeWidth={1}>
              <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ marginTop: 14, fontSize: 20, letterSpacing: "0.2em", color: "#fff", fontWeight: 700 }}>BELL</div>
          <div style={{ fontSize: 13, letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)" }}>알림</div>
        </div>
      </div>

      {/* 하단 signature */}
      <div style={{ position: "absolute", left: "50%", bottom: 200, transform: "translate(-50%, 0)", opacity: sigOp, textAlign: "center" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.5em", color: MINT, fontWeight: 700, marginBottom: 8 }}>VIBELABS</div>
        <div style={{ fontSize: 46, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          바이브랩스의 <span style={{ color: MINT }}>랩장</span>이었습니다.
        </div>
      </div>

      <div style={{ position: "absolute", left: "50%", bottom: 150, transform: "translate(-50%, 0)", opacity: thanksOp, fontSize: 22, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3em" }}>
        감사합니다.
      </div>
    </AbsoluteFill>
  );
};
