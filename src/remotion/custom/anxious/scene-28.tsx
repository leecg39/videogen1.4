// anxious-28 — 팁 ⑥ 의견을 구하라. 3개 질문 리스트 + "상대 역량 전제".
// 의도: 질문 카드 3장 계단식 배열. 하단 메타 메시지.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

const QUESTIONS = [
  { q: "이 상황에서 당신이라면 어떻게 하시겠어요?", tag: "Q1 · DECISION" },
  { q: "뭐가 빠져 있다고 보세요?", tag: "Q2 · GAP" },
  { q: "어디서 마찰이 생길 것 같아요?", tag: "Q3 · FRICTION" },
];

export const AnxiousScene28: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const stampOp = interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(57,255,20,0.08) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/benchmark-testing-performance-chart.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.4)" }}
        volume={0}
      />
      {/* 좌상 번호 */}
      <div style={{ position: "absolute", left: 160, top: 140, transform: `scale(${numPop})`, transformOrigin: "top left" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.5em", color: MINT, fontWeight: 700, marginBottom: 8 }}>TIP · 06</div>
        <div style={{ fontSize: 210, fontWeight: 900, color: MINT, letterSpacing: "-0.06em", lineHeight: 0.85, textShadow: `0 0 40px rgba(57,255,20,0.3)` }}>06</div>
        <div style={{ marginTop: 14, fontSize: 54, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.05, opacity: titleOp, maxWidth: 500 }}>
          의견을 구하라.
        </div>
      </div>

      {/* 우측 3 questions 계단식 */}
      <div style={{ position: "absolute", right: 160, top: 220, width: 980 }}>
        {QUESTIONS.map((q, i) => {
          const start = 30 + i * 28;
          const pop = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 140 }, from: 0, to: 1 });
          const op = interpolate(frame, [start, start + 20], [0, 1], { extrapolateRight: "clamp" });
          const offsetX = i * -40; // 계단식 들여쓰기
          return (
            <div key={i} style={{
              marginBottom: 30,
              opacity: op,
              transform: `translateX(${offsetX}px) scale(${pop})`,
              transformOrigin: "right center",
            }}>
              <div style={{ padding: "26px 34px", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${MINT}`, borderRadius: 10, boxShadow: `0 0 20px rgba(57,255,20,0.10)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, letterSpacing: "0.35em", color: MINT, fontWeight: 700 }}>{q.tag}</span>
                  <span style={{ flex: 1, height: 1, background: `rgba(57,255,20,0.4)` }} />
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.015em" }}>
                  "{q.q}"
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 stamp */}
      <div style={{ position: "absolute", left: "50%", bottom: 130, transform: "translate(-50%, 0)", opacity: stampOp, display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ width: 52, height: 1, background: MINT }} />
        <span style={{ fontSize: 24, color: "#fff", letterSpacing: "0.08em", fontWeight: 500 }}>
          이 질문들은 <span style={{ color: MINT, fontWeight: 800, letterSpacing: "0.04em" }}>상대의 역량을 전제</span>한다.
        </span>
        <span style={{ width: 52, height: 1, background: MINT }} />
      </div>
    </AbsoluteFill>
  );
};
