// scene-09 — "레딧/Github 불만 쏟아짐. 해외 뉴스도. 원인 뭘까? 세 가지가 겹쳤다."
// 의도: 확산 증거 + 원인 분해 예고. 왼쪽 소셜 피드 리스트 + 오른쪽 거대한 "3?" 뱃지.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const RED = "#ff3352";

const FEED = [
  { platform: "Reddit", title: "Claude Code burned my tokens in 19 min", up: "3.2k", badge: "HOT" },
  { platform: "GitHub", title: "Issue #4821 · unexpected rate limit reset", up: "872", badge: "OPEN" },
  { platform: "TechCrunch", title: "\"사용량 바닥\" — 개발자들의 집단 분노", up: "NEWS", badge: "기사" },
  { platform: "Reddit", title: "I paid $200, got 1 hour. WTH?", up: "1.8k", badge: "HOT" },
  { platform: "Hacker News", title: "Anthropic rate limit silently halved?", up: "540", badge: "TOP" },
];

export const Scene09: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.12], { extrapolateRight: "clamp" });

  // 좌측 피드
  const feedKickerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 우측 "3" 카드
  const threeIn = spring({ frame: frame - 190, fps, config: { damping: 14, stiffness: 120 }, from: 80, to: 0 });
  const threeOp = interpolate(frame, [190, 230], [0, 1], { extrapolateRight: "clamp" });
  const threePulse = 0.85 + 0.15 * Math.abs(Math.sin(frame / 10));

  return (
    <AbsoluteFill style={{ background: "#070609", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(95deg, rgba(7,6,9,1) 50%, rgba(255,51,82,0.1) 100%)", opacity: bgIn + 0.85 }} />

      {/* 좌측 Kicker */}
      <div style={{ position: "absolute", top: 120, left: 130, opacity: feedKickerOp }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 18, letterSpacing: "0.4em", color: RED, fontWeight: 800 }}>VIRAL · SOCIAL</span>
          <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>불만 피드</span>
        </div>
      </div>

      {/* 좌측 피드 */}
      <div style={{ position: "absolute", top: 190, left: 130, width: 780 }}>
        {FEED.map((it, i) => {
          const start = 20 + i * 24;
          const op = interpolate(frame, [start, start + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [start, start + 16], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const pColor = it.platform === "Reddit" ? "#ff6b3d" : it.platform === "GitHub" ? "#b180ff" : it.platform === "TechCrunch" ? "#39ffb0" : "#ffc85c";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 22px", marginBottom: 12, background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${pColor}`, opacity: op, transform: `translateX(${x}px)` }}>
              <span style={{ fontSize: 13, letterSpacing: "0.3em", color: pColor, fontWeight: 800, width: 120, flexShrink: 0 }}>{it.platform.toUpperCase()}</span>
              <span style={{ flex: 1, fontSize: 22, color: "#fff", letterSpacing: "-0.01em" }}>{it.title}</span>
              <span style={{ fontSize: 12, letterSpacing: "0.2em", color: RED, fontWeight: 800, padding: "4px 10px", border: `1px solid ${RED}`, borderRadius: 2 }}>{it.badge}</span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", fontFamily: "'JetBrains Mono', monospace", width: 68, textAlign: "right" }}>▲{it.up}</span>
            </div>
          );
        })}
      </div>

      {/* 우측 — 원인 세 가지 */}
      <div style={{ position: "absolute", top: 220, right: 110, width: 420, opacity: threeOp, transform: `translateY(${threeIn}px)` }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>ROOT CAUSE</div>
          <div style={{ fontSize: 30, color: "#fff", marginTop: 6, letterSpacing: "-0.01em" }}>정체는 무엇?</div>
        </div>
        <div style={{ marginTop: 30, position: "relative", padding: 36, border: `2px dashed ${MINT}`, borderRadius: 8, background: "rgba(57,255,20,0.04)" }}>
          <div style={{ fontSize: 360, fontWeight: 900, color: MINT, lineHeight: 0.82, letterSpacing: "-0.06em", textAlign: "center", fontFeatureSettings: "'tnum'", textShadow: `0 20px 70px ${MINT}44`, transform: `scale(${threePulse})`, transformOrigin: "center" }}>
            3
          </div>
          <div style={{ fontSize: 22, color: "#fff", textAlign: "center", marginTop: 10, letterSpacing: "-0.01em" }}>가지가 <span style={{ color: MINT, fontWeight: 700 }}>겹쳤다</span>.</div>
        </div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
          <span>① 이벤트 종료</span>
          <span>② 피크 요금</span>
          <span>③ 캐시 이슈</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
