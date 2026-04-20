// anxious-32 — 4가지 감지 요소 (어조/신뢰/권한/위협 부재) + Context Engineering 용어.
// 의도: 중앙 Context Engineering 스탬프 + 4 감지 요소 위성 배치.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

const ELEMENTS = [
  { ko: "어조", en: "TONE", angle: -135, label: "발화 리듬" },
  { ko: "신뢰", en: "TRUST", angle: -45, label: "선제적 존중" },
  { ko: "권한", en: "AUTHORITY", angle: 45, label: "입장 취하기" },
  { ko: "위협의 부재", en: "NO THREAT", angle: 135, label: "안전한 공간" },
];

export const AnxiousScene32: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const centerPop = spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 130 }, from: 0, to: 1 });
  const centerPulse = interpolate((frame % 90) / 90, [0, 0.5, 1], [0.4, 1, 0.4]);

  const termOp = interpolate(frame, [180, 230], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(57,255,20,0.10) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/cloud-computing.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(16px) brightness(0.42) hue-rotate(80deg) saturate(0.45)" }}
        volume={0}
      />
      {/* 4 위성 */}
      {ELEMENTS.map((e, i) => {
        const start = 40 + i * 26;
        const pop = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 140 }, from: 0, to: 1 });
        const op = interpolate(frame, [start, start + 22], [0, 1], { extrapolateRight: "clamp" });
        const rad = (e.angle * Math.PI) / 180;
        const r = 380;
        const cx = 960 + Math.cos(rad) * r;
        const cy = 540 + Math.sin(rad) * r;
        // 선 끝점은 중앙 쪽에서 살짝 떨어진 곳
        const lineEndX = 960 + Math.cos(rad) * 130;
        const lineEndY = 540 + Math.sin(rad) * 130;
        return (
          <React.Fragment key={e.en}>
            {/* 연결 선 */}
            <svg style={{ position: "absolute", left: 0, top: 0, opacity: op }} width={1920} height={1080}>
              <line x1={cx} y1={cy} x2={lineEndX} y2={lineEndY} stroke={MINT} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.5} />
            </svg>
            {/* 위성 카드 */}
            <div style={{
              position: "absolute",
              left: cx, top: cy,
              transform: `translate(-50%, -50%) scale(${pop})`,
              opacity: op,
            }}>
              <div style={{ padding: "18px 28px", background: "rgba(57,255,20,0.06)", border: `1.5px solid ${MINT}`, borderRadius: 10, minWidth: 220 }}>
                <div style={{ fontSize: 12, letterSpacing: "0.42em", color: MINT, fontWeight: 700, marginBottom: 6 }}>{e.en}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", marginBottom: 4, lineHeight: 1.1 }}>{e.ko}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>{e.label}</div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* 중앙 스탬프 */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${centerPop})` }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -30, borderRadius: "50%", border: `2px solid ${MINT}`, opacity: centerPulse }} />
          <div style={{ padding: "32px 48px", background: INK, border: `2px solid ${MINT}`, borderRadius: 16, boxShadow: `0 0 60px rgba(57,255,20,0.5)`, textAlign: "center" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.45em", color: MINT, fontWeight: 700, marginBottom: 14 }}>CLAUDE SENSES ALL OF THESE</div>
            <div style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 6 }}>Context</div>
            <div style={{ fontSize: 46, fontWeight: 900, color: MINT, letterSpacing: "-0.025em", lineHeight: 1 }}>Engineering</div>
          </div>
        </div>
      </div>

      {/* 하단 용어 선언 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", opacity: termOp, fontSize: 24, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
        프롬프트 엔지니어링이 아니라 — <span style={{ color: MINT, fontWeight: 700 }}>컨텍스트 엔지니어링</span>의 영역.
      </div>
    </AbsoluteFill>
  );
};
