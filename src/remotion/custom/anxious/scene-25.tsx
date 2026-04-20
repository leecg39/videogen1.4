// anxious-25 — 팁 ③ 존중하는 태도로 세션을 열어라.
// 의도: 2시간 타임라인 + 첫 5분의 결정력 강조.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const CORAL = "#ff7a7a";
const INK = "#08060D";

export const AnxiousScene25: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const __bgOp = interpolate(frame, [0, 36], [0, 0.1], { extrapolateRight: "clamp" });

  const numPop = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const titleOp = interpolate(frame, [16, 40], [0, 1], { extrapolateRight: "clamp" });

  const lineGrow = interpolate(frame, [40, 160], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const firstMarkerPop = spring({ frame: frame - 50, fps, config: { damping: 13, stiffness: 150 }, from: 0, to: 1 });
  const firstBarGrow = interpolate(frame, [60, 110], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const beforeOp = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: "clamp" });
  const afterOp = interpolate(frame, [170, 200], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', sans-serif", color: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(57,255,20,0.08) 0%, rgba(8,6,13,1) 70%)" }} />

      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/process-automation.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "blur(14px) brightness(0.4) saturate(0.3)" }}
        volume={0}
      />
      {/* 좌측 번호 */}
      <div style={{ position: "absolute", left: 160, top: 180, transform: `scale(${numPop})`, transformOrigin: "top left" }}>
        <div style={{ fontSize: 15, letterSpacing: "0.5em", color: MINT, fontWeight: 700, marginBottom: 14 }}>TIP · 03</div>
        <div style={{ fontSize: 280, fontWeight: 900, color: "#fff", letterSpacing: "-0.06em", lineHeight: 0.82 }}>03</div>
        <div style={{ marginTop: 24, fontSize: 58, fontWeight: 800, color: MINT, letterSpacing: "-0.025em", maxWidth: 600, lineHeight: 1.1, opacity: titleOp }}>
          존중으로<br />세션을 열어라.
        </div>
      </div>

      {/* 우측 타임라인 */}
      <div style={{ position: "absolute", right: 140, top: 260, width: 880 }}>
        <div style={{ fontSize: 18, letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: 40 }}>2-HOUR SESSION</div>

        {/* 수평 타임라인 */}
        <div style={{ position: "relative", height: 80, background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>
          {/* 전체 프로그레스 */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${lineGrow * 100}%`, background: "linear-gradient(90deg, rgba(57,255,20,0.4) 0%, rgba(255,255,255,0.15) 100%)", borderRadius: 6 }} />
          {/* 첫 5분 구간 */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${firstBarGrow * 4.2}%`, background: MINT, boxShadow: `0 0 20px ${MINT}`, borderRadius: 6 }} />
        </div>

        {/* 첫 5분 마커 */}
        <div style={{ position: "relative", marginTop: 18, transform: `scale(${firstMarkerPop})`, transformOrigin: "left top" }}>
          <div style={{ display: "inline-block", padding: "14px 24px", background: `rgba(57,255,20,0.15)`, border: `1.5px solid ${MINT}`, borderRadius: 6 }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: MINT, fontWeight: 700, marginBottom: 4 }}>FIRST 5 MIN</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#fff" }}>첫 메시지 한 줄</div>
          </div>
          <div style={{ display: "inline-block", marginLeft: 18, padding: "14px 24px", border: `1px dashed rgba(255,255,255,0.35)`, borderRadius: 6, color: "rgba(255,255,255,0.7)", fontSize: 18, letterSpacing: "0.06em" }}>
            남은 1시간 55분을 <span style={{ color: MINT, fontWeight: 700 }}>결정한다.</span>
          </div>
        </div>

        {/* before / after 비교 */}
        <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ opacity: beforeOp, padding: "20px 22px", background: "rgba(255,122,122,0.06)", border: `1px solid ${CORAL}`, borderRadius: 8 }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: CORAL, fontWeight: 700, marginBottom: 10 }}>✕ AS COMPLAINT</div>
            <div style={{ fontSize: 22, color: "#fff", lineHeight: 1.3, fontWeight: 600 }}>"또 틀릴 생각이야?"</div>
          </div>

          <div style={{ opacity: afterOp, padding: "20px 22px", background: "rgba(57,255,20,0.06)", border: `1px solid ${MINT}`, borderRadius: 8 }}>
            <div style={{ fontSize: 14, letterSpacing: "0.3em", color: MINT, fontWeight: 700, marginBottom: 10 }}>✓ AS GUIDE</div>
            <div style={{ fontSize: 22, color: "#fff", lineHeight: 1.3, fontWeight: 600 }}>"이번 세션은 이 세 가지를 지켜주세요."</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
