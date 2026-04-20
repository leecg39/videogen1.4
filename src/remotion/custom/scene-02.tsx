// scene-02 — "그리고 울트라 플랜 + GPT6 다음 주 소문. 바로 들어가겠습니다."
// 의도: 뉴스 3/4 티저. 카드 두 개가 좌우 비대칭으로 등장하고 하단에 "바로 들어가자" 프롬프트.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const VIOLET = "#b180ff";

export const Scene02: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 24], [0, 0.16], { extrapolateRight: "clamp" });

  // 상단 kicker
  const kickerOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const kickerX = interpolate(frame, [0, 18], [-24, 0], { extrapolateRight: "clamp" });

  // 카드 1 — ULTRA (왼쪽 위)
  const c1In = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 110 }, from: 50, to: 0 });
  const c1Op = interpolate(frame, [10, 36], [0, 1], { extrapolateRight: "clamp" });

  // 카드 2 — GPT6 (오른쪽 아래)
  const c2In = spring({ frame: frame - 90, fps, config: { damping: 16, stiffness: 110 }, from: 50, to: 0 });
  const c2Op = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });

  // 프롬프트 "바로 들어가겠습니다"
  const pIn = interpolate(frame, [200, 230], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pOp = interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" });

  // 터미널 커서 blink
  const cursorOn = Math.floor(frame / 14) % 2 === 0;

  // 번호 pop
  const n1Pop = spring({ frame: frame - 22, fps, config: { damping: 10, stiffness: 180 }, from: 0.7, to: 1 });
  const n2Pop = spring({ frame: frame - 100, fps, config: { damping: 10, stiffness: 180 }, from: 0.7, to: 1 });

  return (
    <AbsoluteFill style={{ background: "#060608", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/AI-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgIn, filter: "blur(4px) brightness(0.38) saturate(0.6)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 80%, rgba(177,128,255,0.06) 0%, rgba(6,6,8,0.98) 60%)" }} />

      {/* 상단 kicker */}
      <div style={{ position: "absolute", top: 120, left: 160, display: "flex", gap: 20, alignItems: "center", opacity: kickerOp, transform: `translateX(${kickerX}px)` }}>
        <span style={{ fontSize: 18, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>STILL ON BRIEF</span>
        <span style={{ width: 40, height: 1, background: "rgba(255,255,255,0.3)" }} />
        <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)" }}>남은 두 가지</span>
      </div>

      {/* 카드 1: ULTRA */}
      <div style={{ position: "absolute", top: 220, left: 160, width: 880, opacity: c1Op, transform: `translateY(${c1In}px)`, padding: 42, background: "rgba(57,255,20,0.04)", border: `1px solid rgba(57,255,20,0.45)`, borderRadius: 8, boxShadow: "0 30px 80px rgba(57,255,20,0.08)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
          <div style={{ fontSize: 112, fontWeight: 900, color: MINT, lineHeight: 0.85, transform: `scale(${n1Pop})`, transformOrigin: "top left", fontFeatureSettings: "'tnum'" }}>03</div>
          <div style={{ flex: 1, paddingTop: 14 }}>
            <div style={{ fontSize: 16, letterSpacing: "0.4em", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 10 }}>NEW · 클로드 코드 플랜</div>
            <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
              <span style={{ color: MINT, fontStyle: "italic", marginRight: 14 }}>ULTRA</span>
              <span>플랜 소개</span>
            </div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>한도 걱정 없이 쓰려는 사람들을 위한 최상위 티어.</div>
          </div>
        </div>
      </div>

      {/* 카드 2: GPT6 루머 */}
      <div style={{ position: "absolute", top: 500, left: 420, width: 920, opacity: c2Op, transform: `translateY(${c2In}px)`, padding: 42, background: "rgba(177,128,255,0.04)", border: `1px dashed rgba(177,128,255,0.5)`, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
          <div style={{ fontSize: 112, fontWeight: 900, color: VIOLET, lineHeight: 0.85, transform: `scale(${n2Pop})`, transformOrigin: "top left", fontFeatureSettings: "'tnum'" }}>04</div>
          <div style={{ flex: 1, paddingTop: 14 }}>
            <div style={{ fontSize: 16, letterSpacing: "0.4em", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 10 }}>
              RUMOR · 출처 미확인
            </div>
            <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
              <span style={{ color: VIOLET }}>GPT6</span>, 다음 주?
            </div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>공식 발표 전 업계 루머를 짚어봅니다.</div>
          </div>
        </div>
      </div>

      {/* 하단 터미널 프롬프트 */}
      <div style={{ position: "absolute", bottom: 150, left: 160, display: "flex", alignItems: "center", gap: 16, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", opacity: pOp, transform: `translateY(${pIn}px)` }}>
        <span style={{ fontSize: 26, color: MINT, fontWeight: 700 }}>&gt;</span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>cd ./news</span>
        <span style={{ fontSize: 26, color: MINT, fontWeight: 700 }}>&amp;&amp;</span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>./start</span>
        <span style={{ display: "inline-block", width: 14, height: 26, background: MINT, opacity: cursorOn ? 1 : 0, marginLeft: 6 }} />
      </div>
    </AbsoluteFill>
  );
};
