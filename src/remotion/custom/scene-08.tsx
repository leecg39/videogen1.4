// scene-08 — "가장 극단적인 경우는 19분. 5시간 쓸 수 있어야 하는데 19분이다. 심각하죠?"
// 의도: 거대 숫자 19 + 기대값(300분) 컷오프. 숫자가 곤두박질쳐서 19에 멈춘다.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const RED = "#ff3352";
const MINT = "#39FF14";

export const Scene08: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  const bgIn = interpolate(frame, [0, 24], [0, 0.14], { extrapolateRight: "clamp" });

  // 300 → 19 드롭 카운트다운
  const count = Math.round(interpolate(frame, [14, 100], [300, 19], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }));
  const finalLand = spring({ frame: frame - 96, fps, config: { damping: 6, stiffness: 200 }, from: 0, to: 1 });
  const landScale = 1 + finalLand * 0.05;

  // 랜딩 쇼크 (화면 흔들림)
  const shockDecay = interpolate(frame, [100, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = Math.sin(frame * 3) * 5 * shockDecay;

  // 기대값 서브 바
  const barShrink = interpolate(frame, [130, 180], [1, 19 / 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });

  // "이건 심각하죠?" 질문 프롬프트
  const qOp = interpolate(frame, [210, 250], [0, 1], { extrapolateRight: "clamp" });
  const qIn = interpolate(frame, [210, 250], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#0a0608", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: "#fff", overflow: "hidden", transform: `translate(${shake * 0.3}px, ${shake}px)` }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/news-broadcast-studio-dark.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgIn, filter: "blur(3px) brightness(0.32) saturate(0.4) hue-rotate(340deg)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,51,82,0.18) 0%, rgba(10,6,8,0.98) 55%)" }} />

      {/* 상단 라벨 */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 22, letterSpacing: "0.5em", color: RED, fontWeight: 800 }}>THE EXTREME</div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.55)", marginTop: 8, letterSpacing: "-0.01em" }}>가장 극단적인 해외 뉴스</div>
      </div>

      {/* 거대 숫자 */}
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 520, fontWeight: 900, lineHeight: 0.86, color: "#fff", letterSpacing: "-0.06em", fontFeatureSettings: "'tnum'", transform: `scale(${landScale})`, textShadow: `0 0 ${60 * finalLand}px ${RED}, 0 20px 70px rgba(0,0,0,0.8)` }}>
          <span style={{ color: RED }}>{count}</span>
          <span style={{ fontSize: 160, marginLeft: 20, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>분</span>
        </div>
      </div>

      {/* 기대 vs 실제 바 */}
      <div style={{ position: "absolute", bottom: 230, left: 160, right: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 16, letterSpacing: "0.3em", fontWeight: 700 }}>
          <span style={{ color: MINT }}>EXPECTED · 5시간 (300분)</span>
          <span style={{ color: RED }}>REALITY · 19분</span>
        </div>
        <div style={{ position: "relative", height: 22, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          {/* 기대 (회색 bar 전체) */}
          <div style={{ position: "absolute", inset: 0, width: "100%", background: "rgba(255,255,255,0.15)" }} />
          {/* 실제 (붉은 bar 19/300 = 6.3%) */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${barShrink * 100}%`, background: `linear-gradient(90deg, ${RED} 0%, #ff6b3d 100%)`, boxShadow: `0 0 20px ${RED}` }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
          ━ 기대 대비 실제 사용 가능 시간 ━
        </div>
      </div>

      {/* 질문 프롬프트 */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center", opacity: qOp, transform: `translateY(${qIn}px)` }}>
        <div style={{ fontSize: 32, color: "#fff", letterSpacing: "-0.01em", fontStyle: "italic", fontWeight: 500 }}>
          이건 좀 <span style={{ color: RED, fontWeight: 800, fontStyle: "normal" }}>심각하죠?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
