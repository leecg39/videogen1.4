// scene-00 — "안녕하세요 바이브랩스 랩장입니다. 화요일. AI 는 쉬지 않는다."
// 의도: 인트로 선언. 정체성 각인 + 달리는 에너지. 글자별 boot-up + 요일 인디케이터 + mint 뱃지.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const BG = "#050505";

export const Scene00: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 40], [0, 0.22], { extrapolateRight: "clamp" });
  const barScale = spring({ frame, fps, config: { damping: 22, stiffness: 130 }, from: 0, to: 1 });

  const word = "VIBELABS";
  const charDelay = 6;
  const charStart = 12;

  const badgeIn = interpolate(frame, [30, 54], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const badgeY = interpolate(frame, [30, 54], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const titleIn = interpolate(frame, [70, 100], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const titleOp = interpolate(frame, [70, 100], [0, 1], { extrapolateRight: "clamp" });
  const emphasis = interpolate(frame, [108, 130], [0, 1], { extrapolateRight: "clamp" });

  const dashShift = (frame * 6) % 40;

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/AI-technology.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOpacity, filter: "blur(2px) hue-rotate(85deg) saturate(1.8) brightness(0.55)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(57,255,20,0.09) 0%, rgba(5,5,5,0.96) 58%)" }} />

      <div style={{ position: "absolute", left: 120, top: 140, bottom: 180, width: 3, background: MINT, boxShadow: `0 0 28px ${MINT}`, transform: `scaleY(${barScale})`, transformOrigin: "top" }} />

      <div style={{ position: "absolute", top: 140, left: 168, display: "flex", alignItems: "baseline", gap: 18, opacity: badgeIn, transform: `translateY(${badgeY}px)` }}>
        <span style={{ fontSize: 18, letterSpacing: "0.5em", color: MINT, fontWeight: 700 }}>LAB · 001</span>
        <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.38)" }}>BROADCAST</span>
      </div>

      <div style={{ position: "absolute", top: 196, left: 168, display: "flex", gap: 4 }}>
        {word.split("").map((ch, i) => {
          const start = charStart + i * charDelay;
          const op = interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sh = interpolate(frame, [start, start + 14], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <span key={i} style={{ fontSize: 104, fontWeight: 800, letterSpacing: "-0.04em", color: i >= 4 ? MINT : "#fff", opacity: op, transform: `translateY(${sh}px)`, textShadow: i >= 4 ? `0 8px 40px ${MINT}66` : "none", lineHeight: 1 }}>{ch}</span>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 338, left: 168, display: "flex", gap: 28, opacity: interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" }) }}>
        {days.map((d) => {
          const active = d === "TUE";
          return (
            <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? MINT : "rgba(255,255,255,0.2)", boxShadow: active ? `0 0 18px ${MINT}` : "none" }} />
              <span style={{ fontSize: 15, letterSpacing: "0.2em", color: active ? MINT : "rgba(255,255,255,0.32)", fontWeight: active ? 700 : 500 }}>{d}</span>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 480, left: 168, right: 160, opacity: titleOp, transform: `translateY(${titleIn}px)` }}>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em", marginBottom: 18 }}>오늘도</div>
        <div style={{ fontSize: 128, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
          <span>AI는 </span>
          <span style={{ color: MINT, textShadow: `0 14px 40px ${MINT}44`, display: "inline-block", transform: `scale(${1 + emphasis * 0.04})`, transformOrigin: "left" }}>쉬지 않는다.</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 168, right: 160, bottom: 165, display: "flex", alignItems: "center", gap: 24, opacity: interpolate(frame, [130, 160], [0, 1], { extrapolateRight: "clamp" }) }}>
        <span style={{ fontSize: 16, letterSpacing: "0.4em", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>TRACK RUNNING</span>
        <div style={{ flex: 1, height: 2, backgroundImage: `repeating-linear-gradient(90deg, ${MINT} 0 14px, transparent 14px 26px)`, backgroundPosition: `${-dashShift}px 0` }} />
        <span style={{ fontSize: 16, letterSpacing: "0.3em", color: MINT, fontWeight: 700 }}>LIVE</span>
      </div>

      <div style={{ position: "absolute", top: 150, right: 168, textAlign: "right", opacity: badgeIn }}>
        <div style={{ fontSize: 18, letterSpacing: "0.35em", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>04 / 07</div>
        <div style={{ fontSize: 46, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>화요일</div>
      </div>
    </AbsoluteFill>
  );
};
