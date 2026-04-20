// anxious-03 — "어떤 날은 어이없을 만큼 소심해집니다."
// 의도: 02의 대비쌍. 같은 모델이 하강/움츠러듦. 우측 하단 TIMID 카드 + 회색 화살표 아래로.
// 컬러: 민트 제거 → amber/grey 톤으로 "소심"을 표현.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const AMBER = "#ffbe5c";
const INK = "#08060D";

export const AnxiousScene03: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const bgOp = interpolate(frame, [0, 40], [0, 0.10], { extrapolateRight: "clamp" });
  const dayLabelOp = interpolate(frame, [4, 24], [0, 1], { extrapolateRight: "clamp" });

  const arrowProgress = interpolate(frame, [12, 56], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const timidPop = spring({ frame: frame - 44, fps, config: { damping: 16, stiffness: 110 }, from: 0, to: 1 });

  // 움츠러듦: 처음 1.0 → 점차 0.85 로 쪼그라듦
  const shrink = interpolate(frame, [50, 110], [1.05, 0.9], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });

  const narrOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/laptop-computer-home-office-dark.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(8px) brightness(0.35) saturate(0.3) sepia(0.2)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 65% 65%, rgba(30,18,6,0.38) 0%, rgba(8,6,13,0.98) 74%)" }} />

      {/* 우측 day label */}
      <div style={{ position: "absolute", right: 160, top: 130, display: "flex", alignItems: "center", gap: 14, opacity: dayLabelOp }}>
        <span style={{ fontSize: 17, letterSpacing: "0.42em", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>DAY · B</span>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: AMBER, opacity: 0.6 }} />
      </div>

      {/* 중앙 배지 — SAME MODEL (02와 동일 position, 연결감) */}
      <div style={{ position: "absolute", left: "50%", top: 260, transform: "translate(-50%, 0)", opacity: 0.7 }}>
        <div style={{ padding: "12px 36px", border: `1px solid rgba(255,255,255,0.25)`, borderRadius: 999, fontSize: 16, letterSpacing: "0.4em", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
          SAME&nbsp;&nbsp;MODEL
        </div>
      </div>

      {/* 하강 화살표 */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
        <defs>
          <marker id="arrow-dn-03" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={AMBER} />
          </marker>
        </defs>
        <path
          d="M 980 320 Q 1180 500 1380 760"
          stroke={AMBER}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={600 - arrowProgress * 600}
          markerEnd="url(#arrow-dn-03)"
          opacity={0.75}
          style={{ filter: `drop-shadow(0 0 6px rgba(255,190,92,0.45))` }}
        />
      </svg>

      {/* TIMID 카드 (우하) */}
      <div style={{
        position: "absolute",
        right: 280, top: 580,
        transform: `scale(${timidPop * shrink})`,
        transformOrigin: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid rgba(255,190,92,0.55)`, background: "rgba(30,18,6,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 56, color: AMBER, opacity: 0.85 }}>...</div>
          </div>
          <div style={{ fontSize: 46, fontWeight: 600, color: AMBER, letterSpacing: "-0.02em", opacity: 0.9 }}>소심</div>
          <div style={{ fontSize: 14, letterSpacing: "0.38em", color: "rgba(255,255,255,0.38)" }}>ANOTHER DAY</div>
        </div>
      </div>

      {/* 좌하 어이없음 캡션 */}
      <div style={{
        position: "absolute",
        left: 200, bottom: 280,
        fontSize: 34, lineHeight: 1.35,
        color: "rgba(255,255,255,0.72)",
        opacity: narrOp,
        letterSpacing: "-0.01em",
        fontWeight: 400,
        maxWidth: 620,
      }}>
        어이없을 만큼<br />
        <span style={{ color: AMBER, fontWeight: 700, fontSize: 56 }}>움츠러든다.</span>
      </div>
    </AbsoluteFill>
  );
};
