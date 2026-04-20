// scene-38 — "뉴스 1 문제 + 뉴스 2 해답 = 엮인다"
// 의도: 두 섹션을 퍼즐 조각처럼 결합. 좌 문제 · 우 해법 · 중앙 lock together 애니.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene38: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const leftIn = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, from: -200, to: 0 });
  const rightIn = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 100 }, from: 200, to: 0 });
  const clickFrame = 72;
  const shake = frame >= clickFrame && frame < clickFrame + 12 ? Math.sin((frame - clickFrame) * 2) * 6 : 0;
  const connectionOpacity = interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #0a0f1f 0%, #141a30 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: "#c8a8ff", letterSpacing: "0.45em", fontWeight: 700 }}>CONNECT · 엮인다</div>
        <div style={{ fontSize: 50, color: "#fff", fontWeight: 800, marginTop: 12 }}>
          뉴스 1 문제 <span style={{ color: "#c8a8ff" }}>⨯</span> 뉴스 2 해답
        </div>
      </div>

      {/* 좌측 퍼즐: 문제 */}
      <div style={{ position: "absolute", top: 320, left: 0, transform: `translateX(${leftIn + shake}px)`, width: 720 }}>
        <div style={{ padding: "40px 48px 40px 60px", background: "linear-gradient(100deg, rgba(255,107,138,0.15) 0%, rgba(255,107,138,0.04) 100%)", border: "1px solid rgba(255,107,138,0.4)", borderRadius: "0 20px 20px 0", position: "relative", minHeight: 380 }}>
          {/* 퍼즐 돌기 (우측) */}
          <div style={{ position: "absolute", right: -48, top: "50%", transform: "translateY(-50%)", width: 96, height: 160, background: "linear-gradient(100deg, rgba(255,107,138,0.15) 0%, rgba(255,107,138,0.04) 100%)", border: "1px solid rgba(255,107,138,0.4)", borderLeft: "none", borderRadius: "0 80px 80px 0", zIndex: 2 }} />

          <div style={{ fontSize: 22, color: "#ff6b8a", letterSpacing: "0.35em", fontWeight: 700 }}>NEWS 01 · 문제</div>
          <div style={{ fontSize: 58, fontWeight: 900, color: "#fff", marginTop: 18, lineHeight: 1.1 }}>
            토큰이 <span style={{ color: "#ff6b8a" }}>폭주</span>한다
          </div>
          <div style={{ fontSize: 22, color: "#f0a0b8", marginTop: 18, lineHeight: 1.4 }}>
            · 3월 이벤트 종료 · 피크타임 중복 · 캐시 버그
          </div>
          <div style={{ fontSize: 44, color: "#ff3b5c", marginTop: 24, fontWeight: 800, fontFeatureSettings: "'tnum'" }}>19분 &middot; 87% 손실</div>
        </div>
      </div>

      {/* 우측 퍼즐: 해답 */}
      <div style={{ position: "absolute", top: 320, right: 0, transform: `translateX(${-rightIn}px)`, width: 720 }}>
        <div style={{ padding: "40px 60px 40px 96px", background: "linear-gradient(260deg, rgba(125,255,176,0.15) 0%, rgba(125,255,176,0.04) 100%)", border: "1px solid rgba(125,255,176,0.4)", borderRadius: "20px 0 0 20px", position: "relative", minHeight: 380 }}>
          {/* 퍼즐 홈 (좌측) */}
          <div style={{ position: "absolute", left: -2, top: "50%", transform: "translateY(-50%)", width: 96, height: 160, background: "#0a0f1f", border: "1px solid rgba(125,255,176,0.4)", borderRight: "1px solid #0a0f1f", borderRadius: "0 80px 80px 0" }} />

          <div style={{ fontSize: 22, color: "#7dffb0", letterSpacing: "0.35em", fontWeight: 700, textAlign: "right" }}>NEWS 02 · 해답</div>
          <div style={{ fontSize: 58, fontWeight: 900, color: "#fff", marginTop: 18, lineHeight: 1.1, textAlign: "right" }}>
            내 <span style={{ color: "#7dffb0" }}>맥북</span>에서 직접
          </div>
          <div style={{ fontSize: 22, color: "#a8e6c8", marginTop: 18, lineHeight: 1.4, textAlign: "right" }}>
            · Gemma 4 오픈웨이트 · 무료 · 프라이버시
          </div>
          <div style={{ fontSize: 44, color: "#7dffb0", marginTop: 24, fontWeight: 800, fontFeatureSettings: "'tnum'", textAlign: "right" }}>
            80&mdash;90% 대체 가능
          </div>
        </div>
      </div>

      {/* 중앙 lock 스파크 */}
      <div style={{ position: "absolute", top: 485, left: "50%", transform: "translateX(-50%)", opacity: connectionOpacity }}>
        <svg width="140" height="140" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="6" fill="#c8a8ff" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const x2 = 30 + 24 * Math.cos((angle * Math.PI) / 180);
            const y2 = 30 + 24 * Math.sin((angle * Math.PI) / 180);
            return <line key={angle} x1="30" y1="30" x2={x2} y2={y2} stroke="#c8a8ff" strokeWidth="2" opacity={0.7} />;
          })}
        </svg>
      </div>

      {/* 하단 결론 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center", opacity: connectionOpacity }}>
        <div style={{ display: "inline-block", padding: "14px 32px", background: "rgba(200,168,255,0.12)", border: "1px solid #c8a8ff", borderRadius: 999 }}>
          <div style={{ fontSize: 28, color: "#fff", fontWeight: 700 }}>
            토큰 문제 신경 쓰였던 분 → <span style={{ color: "#c8a8ff" }}>선택지 확장</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
