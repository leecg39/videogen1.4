// anxious-08 — 영상 약속. 30년 코드 배지 + 이 영상이 제공할 것 + 프롬프트 3줄 변화 티저.
// 의도: 시청 유지. 좌측 프로필 박스 + 중앙 약속 + 우측 "첫 3줄" 미니 에디터 프리뷰.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing, OffthreadVideo, staticFile } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MINT = "#39FF14";
const INK = "#08060D";

export const AnxiousScene08: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 40], [0, 0.10], { extrapolateRight: "clamp" });

  const leftIn = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 110 }, from: 0, to: 1 });
  const centerOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const centerY = interpolate(frame, [20, 50], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const editorOp = interpolate(frame, [54, 94], [0, 1], { extrapolateRight: "clamp" });
  const editorX = interpolate(frame, [54, 94], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const line3Op = interpolate(frame, [130, 160], [0, 1], { extrapolateRight: "clamp" });

  const cursorBlink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: INK, fontFamily: "'Pretendard', 'Space Grotesk', sans-serif", color: "#fff", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/coding-programming.mp4")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgOp, filter: "blur(12px) brightness(0.5) hue-rotate(100deg) saturate(0.4)" }}
        volume={0}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,6,13,0.95) 0%, rgba(8,6,13,0.70) 50%, rgba(8,6,13,0.95) 100%)" }} />

      {/* 좌측 30년 배지 */}
      <div style={{ position: "absolute", left: 180, top: 260, transform: `scale(${leftIn})`, transformOrigin: "left center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 16, letterSpacing: "0.46em", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>TRANSLATOR</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 220, fontWeight: 900, letterSpacing: "-0.05em", color: MINT, lineHeight: 0.9, textShadow: `0 0 40px rgba(57,255,20,0.4)` }}>30</span>
            <span style={{ fontSize: 60, fontWeight: 600, color: "#fff" }}>년</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.85)", lineHeight: 1.4, maxWidth: 420 }}>
            코드를 만진 제가<br />
            <span style={{ color: MINT, fontWeight: 700 }}>실전으로 번역해 드립니다.</span>
          </div>
        </div>
      </div>

      {/* 중앙 디바이더 */}
      <div style={{ position: "absolute", left: 820, top: 200, bottom: 200, width: 1, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0) 100%)" }} />

      {/* 우측 "첫 3줄" 에디터 */}
      <div style={{
        position: "absolute",
        right: 180, top: 220,
        width: 800,
        opacity: editorOp,
        transform: `translateX(${editorX}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 20, fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>prompt.txt — claude</span>
        </div>

        <div style={{ padding: "32px 36px", background: "rgba(20,20,28,0.75)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, fontFamily: "'JetBrains Mono', 'Consolas', monospace", fontSize: 22, lineHeight: 1.9 }}>
          <div style={{ display: "flex", gap: 18, color: "rgba(255,255,255,0.85)" }}>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>1</span>
            <span>안녕, 클로드.</span>
          </div>
          <div style={{ display: "flex", gap: 18, color: "rgba(255,255,255,0.85)" }}>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>2</span>
            <span>오늘은 이 문제를 함께 풀어보자.</span>
          </div>
          <div style={{ display: "flex", gap: 18, color: MINT, fontWeight: 600, opacity: line3Op }}>
            <span style={{ color: "rgba(57,255,20,0.6)" }}>3</span>
            <span>더 나은 관점이 보이면 반박해도 돼.{cursorBlink ? "▋" : " "}</span>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 18, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textAlign: "right" }}>
          이 <span style={{ color: MINT, fontWeight: 700 }}>3줄</span>이 바뀝니다 →
        </div>
      </div>

      {/* 상단 kicker */}
      <div style={{ position: "absolute", left: "50%", top: 130, transform: "translate(-50%,0)", fontSize: 17, letterSpacing: "0.5em", color: "rgba(255,255,255,0.5)", opacity: centerOp, fontWeight: 600 }}>
        WHAT YOU'LL GET
      </div>
    </AbsoluteFill>
  );
};
