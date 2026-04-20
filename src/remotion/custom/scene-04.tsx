// scene-04 — "지난주부터 단체 반발. 바이브랩스 채팅방에도 토큰 이야기 많이 돌았다."
// 의도: 커뮤니티 분노 확산. 날짜 타임라인 + 채팅방 푸시알림 스태킹.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const RED = "#ff3352";

const MESSAGES = [
  { t: "KHW", c: "오늘 토큰 미쳤어요 ㅠㅠ", at: 30, hot: true },
  { t: "mp", c: "저는 한 대화에 10% 날아갔어요", at: 62, hot: true },
  { t: "SJ", c: "맥스 20 쓰는데 체감상 반토막", at: 96, hot: false },
  { t: "RK", c: "이게 한도가 확 줄었나요?", at: 130, hot: false },
  { t: "DEV", c: "레딧에도 난리나던데...", at: 164, hot: true },
  { t: "LAB", c: "이거 한번 다뤄볼게요", at: 200, hot: false },
];

export const Scene04: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 30], [0, 0.12], { extrapolateRight: "clamp" });

  // 좌측 타임라인 — 지난주 화살표
  const timelineIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const arrowGrow = interpolate(frame, [6, 50], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 헤드라인
  const headIn = interpolate(frame, [14, 40], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const headOp = interpolate(frame, [14, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#08060b", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 70%, rgba(255,51,82,0.1) 0%, rgba(8,6,11,0.98) 60%)", opacity: bgIn + 0.85 }} />

      {/* 상단 타임라인 — LAST WEEK → NOW */}
      <div style={{ position: "absolute", top: 130, left: 130, right: 130, display: "flex", alignItems: "center", gap: 18, opacity: timelineIn }}>
        <span style={{ fontSize: 16, letterSpacing: "0.4em", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>LAST WEEK</span>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.12)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: `${arrowGrow * 100}%`, background: `linear-gradient(90deg, rgba(255,255,255,0.3) 0%, ${RED} 100%)` }} />
          {[0.18, 0.42, 0.68].map((p, i) => (
            <div key={i} style={{ position: "absolute", top: -5, left: `${p * 100}%`, width: 10, height: 10, borderRadius: "50%", background: arrowGrow > p ? RED : "rgba(255,255,255,0.3)", boxShadow: arrowGrow > p ? `0 0 14px ${RED}` : "none" }} />
          ))}
        </div>
        <span style={{ fontSize: 16, letterSpacing: "0.4em", color: RED, fontWeight: 800 }}>NOW</span>
      </div>

      {/* 좌측: 거대 헤드라인 */}
      <div style={{ position: "absolute", top: 210, left: 130, width: 850, opacity: headOp, transform: `translateY(${headIn}px)` }}>
        <div style={{ fontSize: 22, color: RED, letterSpacing: "0.4em", fontWeight: 700, marginBottom: 22 }}>COMMUNITY RAGE · 확산 중</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
          <div>단체로 들고</div>
          <div>
            일어<span style={{ color: RED, textShadow: `0 14px 46px ${RED}44` }}>났어요.</span>
          </div>
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", marginTop: 28, lineHeight: 1.4 }}>
          바이브랩스 채팅방에도 토큰 관련 이야기가<br />
          <span style={{ color: "#fff", fontWeight: 600 }}>아주 많이</span> 돌았습니다.
        </div>
      </div>

      {/* 우측: 채팅 스택 */}
      <div style={{ position: "absolute", top: 220, right: 90, width: 560 }}>
        <div style={{ fontSize: 14, letterSpacing: "0.4em", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 16, textAlign: "center" }}>#vibe-labs · 지난주</div>
        {MESSAGES.map((m, i) => {
          const op = interpolate(frame, [m.at, m.at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(frame, [m.at, m.at + 14], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const align = i % 2 === 0 ? "flex-start" : "flex-end";
          return (
            <div key={i} style={{ display: "flex", justifyContent: align, marginBottom: 14, opacity: op, transform: `translateY(${y}px)` }}>
              <div style={{ maxWidth: 460, padding: "14px 20px", background: m.hot ? "rgba(255,51,82,0.12)" : "rgba(255,255,255,0.05)", border: m.hot ? `1px solid ${RED}` : "1px solid rgba(255,255,255,0.12)", borderRadius: 18, borderBottomLeftRadius: i % 2 === 0 ? 4 : 18, borderBottomRightRadius: i % 2 === 0 ? 18 : 4 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, letterSpacing: "0.2em", color: m.hot ? RED : "rgba(255,255,255,0.5)", fontWeight: 800 }}>@{m.t}</span>
                  {m.hot && <span style={{ fontSize: 11, color: RED, fontWeight: 800 }}>● HOT</span>}
                </div>
                <div style={{ fontSize: 20, color: "#fff", letterSpacing: "-0.01em" }}>{m.c}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
