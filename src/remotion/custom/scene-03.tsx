// scene-03 — "뉴스 1. 클로드 코드 몇 분 만에 사용량 바닥. 뜨겁고 화나는 이야기."
// 의도: 뉴스 1 섹션 점등. 섹션 넘버 + 화면 중앙 거대 헤드라인 + 붉은 슬래시 + 하단 터미널.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const RED = "#ff3352";
const AMBER = "#ff6b3d";

export const Scene03: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 20], [0, 0.28], { extrapolateRight: "clamp" });

  // NEWS 01 오프닝 — 왼쪽에서 쏟아짐
  const badgeOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const badgeX = interpolate(frame, [0, 22], [-60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 대형 01 숫자 pop
  const numPop = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 160 }, from: 0.5, to: 1 });

  // 헤드라인 타자기
  const title = "몇 분 만에 사용량 바닥.";
  const charShown = Math.floor(interpolate(frame, [30, 130], [0, title.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cursorOn = Math.floor(frame / 12) % 2 === 0;

  // 서브 카피
  const subIn = interpolate(frame, [150, 180], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const subOp = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });

  // 하단 분노 인디케이터 (불타는 게이지)
  const angerFill = interpolate(frame, [220, 290], [0, 1], { extrapolateRight: "clamp" });
  const angerPulse = 0.6 + 0.4 * Math.abs(Math.sin(frame / 6));

  // diagonal 스트라이프 shift
  const stripeShift = (frame * 2) % 24;

  return (
    <AbsoluteFill style={{ background: "#0c0508", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/terminal-command.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgIn, filter: "blur(2px) hue-rotate(340deg) saturate(1.4) brightness(0.5)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,51,82,0.16) 0%, rgba(12,5,8,0.94) 50%, rgba(12,5,8,0.98) 100%)" }} />

      {/* 좌측 붉은 스트라이프 */}
      <div style={{ position: "absolute", left: 100, top: 100, bottom: 110, width: 42, backgroundImage: `repeating-linear-gradient(135deg, ${RED} 0 8px, transparent 8px 16px)`, backgroundPosition: `0 ${-stripeShift}px`, opacity: 0.8 }} />

      {/* NEWS 01 badge */}
      <div style={{ position: "absolute", top: 130, left: 180, opacity: badgeOp, transform: `translateX(${badgeX}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ fontSize: 22, letterSpacing: "0.48em", color: RED, fontWeight: 800 }}>NEWS</span>
          <span style={{ width: 54, height: 2, background: RED }} />
          <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>뜨겁고 화나는 이야기</span>
        </div>
        <div style={{ fontSize: 260, fontWeight: 900, color: RED, lineHeight: 0.9, marginTop: 4, letterSpacing: "-0.06em", transform: `scale(${numPop})`, transformOrigin: "top left", textShadow: `0 20px 70px ${RED}44`, fontFeatureSettings: "'tnum'" }}>01</div>
      </div>

      {/* 메인 타자기 헤드라인 */}
      <div style={{ position: "absolute", top: 450, left: 180, right: 140 }}>
        <h1 style={{ fontSize: 92, fontWeight: 800, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.02em", margin: 0 }}>
          {title.slice(0, charShown).split("").map((ch, i) => {
            const highlight = "바닥".includes(ch);
            return <span key={i} style={{ color: highlight ? RED : "#fff", textShadow: highlight ? `0 8px 30px ${RED}55` : "none" }}>{ch}</span>;
          })}
          {charShown < title.length && <span style={{ borderLeft: `4px solid ${AMBER}`, marginLeft: 4, opacity: cursorOn ? 1 : 0 }}>&nbsp;</span>}
        </h1>
      </div>

      {/* 서브 카피 — 인용 */}
      <div style={{ position: "absolute", top: 590, left: 180, right: 140, opacity: subOp, transform: `translateY(${subIn}px)` }}>
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.65)", fontStyle: "italic", letterSpacing: "-0.01em" }}>
          개발자들이 터미널에서 쓰는 도구. 단체로 들고 일어났습니다.
        </div>
      </div>

      {/* 분노 게이지 — 바닥 우상향 붉은 바 */}
      <div style={{ position: "absolute", bottom: 160, left: 180, right: 140, display: "flex", alignItems: "center", gap: 20, opacity: interpolate(frame, [210, 240], [0, 1], { extrapolateRight: "clamp" }) }}>
        <span style={{ fontSize: 14, letterSpacing: "0.4em", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>RAGE LEVEL</span>
        <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", borderRadius: 2 }}>
          <div style={{ position: "absolute", inset: 0, width: `${angerFill * 92}%`, background: `linear-gradient(90deg, ${AMBER} 0%, ${RED} 100%)`, boxShadow: `0 0 24px ${RED}88`, opacity: angerPulse }} />
          {[0.3, 0.6, 0.92].map((p) => (
            <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100}%`, width: 1, background: "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <span style={{ fontSize: 26, fontWeight: 900, color: RED, fontFeatureSettings: "'tnum'", minWidth: 60, textAlign: "right" }}>{Math.round(angerFill * 92)}</span>
      </div>
    </AbsoluteFill>
  );
};
