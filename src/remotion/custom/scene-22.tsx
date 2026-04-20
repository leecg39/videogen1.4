// scene-22 — "내 맥북이 클라우드를 이겼다" · 뉴스 2 전환 · 승리 선언
// 의도: 좌측 맥북(승자, 네온 mint) ↔ 우측 클라우드 타워(패배, 퇴색). 가운데 균열 + trophy.
// 배경 영상은 laptop-coding 저opacity 로 맥북 쪽에만 피드.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene22: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const leftSlide = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 110 }, from: -160, to: 0 });
  const rightFade = interpolate(frame, [0, 36], [1, 0.35], { extrapolateRight: "clamp" });
  const trophyDrop = spring({ frame: frame - 28, fps, config: { damping: 10, stiffness: 180 }, from: -120, to: 0 });
  const headlineGrow = interpolate(frame, [48, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#04060d", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 좌측 절반 — 맥북 무대 */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at 30% 40%, rgba(93,255,176,0.12) 0%, rgba(4,6,13,0.95) 75%)" }}>
        <OffthreadVideo src={staticFile("videos/vibe-news-0407/laptop-coding.mp4")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} volume={0} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,6,13,0.3), rgba(4,6,13,0.75))" }} />

        {/* 브랜드 배지 */}
        <div style={{ position: "absolute", top: 120, left: 120, display: "flex", alignItems: "center", gap: 14, transform: `translateX(${leftSlide}px)` }}>
          <div style={{ width: 10, height: 42, background: "#5dffb0" }} />
          <span style={{ fontSize: 22, color: "#5dffb0", letterSpacing: "0.36em", fontWeight: 700 }}>LOCAL · ON YOUR MAC</span>
        </div>

        <div style={{ position: "absolute", left: 120, top: 260, transform: `translateX(${leftSlide}px)` }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", lineHeight: 1.05 }}>Gemma 4</div>
          <div style={{ fontSize: 36, color: "#5dffb0", marginTop: 8 }}>M-시리즈 맥북에서 로컬 실행</div>
        </div>

        {/* 승리 뱃지 */}
        <div style={{ position: "absolute", left: 120, bottom: 220, transform: `translateY(${trophyDrop}px)`, display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={80} height={80} viewBox="0 0 24 24"><path fill="#ffd166" d="M12 2L15 8l6 1l-4.5 4.5L18 20l-6-3l-6 3l1.5-6.5L3 9l6-1z" /></svg>
          <div>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#5dffb0", lineHeight: 1 }}>WINS</div>
            <div style={{ fontSize: 24, color: "#a9e8c8", marginTop: 4 }}>무료 · 프라이버시 · 속도</div>
          </div>
        </div>
      </div>

      {/* 우측 절반 — 퇴색한 클라우드 */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", opacity: rightFade, filter: "grayscale(0.6)" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(200deg, rgba(110,100,130,0.18) 0%, rgba(4,6,13,0.95) 70%)" }} />

        <div style={{ position: "absolute", top: 120, right: 120, textAlign: "right" }}>
          <div style={{ fontSize: 22, color: "#7e7592", letterSpacing: "0.36em", fontWeight: 700 }}>CLOUD · 월 구독</div>
        </div>

        {/* 클라우드 타워 SVG */}
        <svg style={{ position: "absolute", top: 240, right: 160, width: 460, height: 420 }} viewBox="0 0 200 200">
          <rect x="60" y="80" width="80" height="100" fill="#3a3347" stroke="#5a5068" strokeWidth="1" />
          <rect x="65" y="90" width="70" height="8" fill="#4a4356" />
          <rect x="65" y="105" width="70" height="8" fill="#4a4356" />
          <rect x="65" y="120" width="70" height="8" fill="#4a4356" />
          <rect x="65" y="135" width="70" height="8" fill="#4a4356" />
          <rect x="65" y="150" width="70" height="8" fill="#4a4356" />
          <circle cx="100" cy="60" r="30" fill="#2a2436" />
          <path d="M 75 60 Q 75 45 90 42 Q 95 30 110 35 Q 125 32 125 50 Q 135 55 130 70 Q 120 72 75 70 Z" fill="#4a4356" />
        </svg>

        <div style={{ position: "absolute", right: 120, bottom: 220, textAlign: "right" }}>
          <div style={{ fontSize: 48, color: "#7e7592", lineHeight: 1.1, fontWeight: 600 }}>비싸고 · 기밀 걱정</div>
        </div>
      </div>

      {/* 중앙 경계 + 헤드라인 */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: "49.5%", width: 3, background: "linear-gradient(180deg, transparent 0%, #5dffb0 20%, #5dffb0 80%, transparent 100%)", boxShadow: "0 0 30px rgba(93,255,176,0.5)" }} />

      {/* 하단 선언 */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", opacity: headlineGrow }}>
        <div style={{ fontSize: 28, color: "#8fe0b8", letterSpacing: "0.4em", marginBottom: 12 }}>NEWS 02</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#fff" }}>
          내 맥북이 클라우드를 <span style={{ color: "#5dffb0" }}>이겼다</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
