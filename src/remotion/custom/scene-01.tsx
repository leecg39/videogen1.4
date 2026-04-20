// scene-01 — "클로드 코드 토큰 고갈 + 내 맥북 로컬 AI 가 유료 클라우드를 이겼다"
// 의도: 오늘의 뉴스 티저 2건. 좌/우 대비 스플릿이 아니라, 대형 번호 + 스파인 타이포로 프리뷰 느낌.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const AMBER = "#ffbe5c";

export const Scene01: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.14], { extrapolateRight: "clamp" });

  // 오른쪽 "ON AIR" 고정 띠
  const bannerIn = interpolate(frame, [0, 22], [-60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 상단 kicker
  const kickerOp = interpolate(frame, [6, 30], [0, 1], { extrapolateRight: "clamp" });

  // Headline 1 — "몇 분 만에 사용량 바닥"
  const h1In = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 100 }, from: 60, to: 0 });
  const h1Op = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  // 번호 "01" 팝인
  const n1Pop = spring({ frame: frame - 20, fps, config: { damping: 10, stiffness: 180 }, from: 0, to: 1 });

  // Headline 2 — "맥북 로컬 AI > 유료 클라우드"
  const h2In = spring({ frame: frame - 180, fps, config: { damping: 18, stiffness: 100 }, from: 60, to: 0 });
  const h2Op = interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp" });
  const n2Pop = spring({ frame: frame - 190, fps, config: { damping: 10, stiffness: 180 }, from: 0, to: 1 });

  // 좌측 런닝 바
  const track = interpolate(frame, [20, 350], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#060608", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/AI-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgIn, filter: "blur(3px) brightness(0.4) hue-rotate(60deg)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(6,6,8,0.98) 30%, rgba(6,6,8,0.80) 100%)" }} />

      {/* 좌측 TIME track */}
      <div style={{ position: "absolute", left: 80, top: 140, bottom: 140, width: 2, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ position: "absolute", top: 0, left: -1, width: 4, background: MINT, boxShadow: `0 0 16px ${MINT}`, height: `${track * 100}%` }} />
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} style={{ position: "absolute", top: `${p * 100}%`, left: -6, width: 14, height: 2, background: "rgba(255,255,255,0.18)" }} />
        ))}
      </div>

      {/* 상단 kicker */}
      <div style={{ position: "absolute", top: 110, left: 160, display: "flex", gap: 24, alignItems: "center", opacity: kickerOp }}>
        <span style={{ fontSize: 18, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>TODAY'S BRIEF</span>
        <span style={{ width: 38, height: 1, background: "rgba(255,255,255,0.3)" }} />
        <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)" }}>오늘의 바이브 뉴스</span>
      </div>

      {/* 우상단 ON AIR */}
      <div style={{ position: "absolute", top: 100, right: 140, padding: "14px 26px", border: `2px solid ${MINT}`, borderRadius: 4, transform: `translateY(${bannerIn}px)`, boxShadow: `0 0 40px ${MINT}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: MINT, boxShadow: `0 0 12px ${MINT}`, opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 8)) }} />
          <span style={{ fontSize: 22, letterSpacing: "0.4em", color: MINT, fontWeight: 800 }}>ON AIR</span>
        </div>
      </div>

      {/* Headline 01 */}
      <div style={{ position: "absolute", top: 210, left: 200, right: 160, opacity: h1Op, transform: `translateY(${h1In}px)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
          <div style={{ fontSize: 168, fontWeight: 900, lineHeight: 0.85, color: MINT, letterSpacing: "-0.04em", transform: `scale(${n1Pop})`, transformOrigin: "top left", fontFeatureSettings: "'tnum'", textShadow: `0 16px 50px ${MINT}33` }}>01</div>
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "rgba(255,255,255,0.4)", marginBottom: 16, fontWeight: 700 }}>NEWS · DEVS 분노</div>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              클로드 코드, <span style={{ color: MINT }}>몇 분 만에</span>
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              토큰 한도 바닥.
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 18, fontStyle: "italic" }}>&ldquo;저도 해당이 되고요&rdquo;</div>
          </div>
        </div>
      </div>

      {/* divider */}
      <div style={{ position: "absolute", top: 560, left: 200, right: 160, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.25) 0%, transparent 100%)", opacity: h2Op }} />

      {/* Headline 02 */}
      <div style={{ position: "absolute", top: 610, left: 200, right: 160, opacity: h2Op, transform: `translateY(${h2In}px)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
          <div style={{ fontSize: 168, fontWeight: 900, lineHeight: 0.85, color: AMBER, letterSpacing: "-0.04em", transform: `scale(${n2Pop})`, transformOrigin: "top left", fontFeatureSettings: "'tnum'", textShadow: `0 16px 50px ${AMBER}33` }}>02</div>
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "rgba(255,255,255,0.4)", marginBottom: 16, fontWeight: 700 }}>NEWS · 로컬 AI 승리</div>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              맥북에서 돌린 AI 가
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              <span style={{ color: AMBER }}>유료 클라우드</span> 이겼다.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
