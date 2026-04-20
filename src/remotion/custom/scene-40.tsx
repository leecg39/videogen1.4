// scene-40 — "개념은 간단하다 — 클로드한테 기획을 물으면"
// 의도: 대화형 UI 미리보기. 좌 사용자 질문 말풍선 + 우 AI 사고중 말풍선. 원칙 B 실험: DSL 노드 import 대신 전면 JSX.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene40: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerSlide = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, from: -40, to: 0 });
  const bubble1 = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 110 }, from: 0, to: 1 });
  const bubble2 = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 100 }, from: 0, to: 1 });
  const thinkingDots = Math.floor(frame / 8) % 4;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #0a0e1c 0%, #0f1530 100%)", fontFamily: "'Pretendard', 'Space Grotesk', sans-serif" }}>
      {/* 상단 브랜드 배지 */}
      <div style={{ position: "absolute", top: 90, left: 140, transform: `translateY(${headerSlide}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "10px 20px", background: "rgba(143,213,255,0.08)", border: "1px solid rgba(143,213,255,0.3)", borderRadius: 999 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#8fd5ff", boxShadow: "0 0 10px #8fd5ff" }} />
          <span style={{ fontSize: 16, letterSpacing: "0.4em", color: "#8fd5ff", fontWeight: 700 }}>CLAUDE CODE · 기존 플로우</span>
        </div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 800, marginTop: 16, lineHeight: 1.1 }}>
          개념은 간단하다
        </div>
        <div style={{ fontSize: 26, color: "#8fa5c7", marginTop: 8 }}>
          기획을 물으면 — AI 가 터미널에서 <span style={{ color: "#ffbe5c" }}>생각하고</span> 답한다
        </div>
      </div>

      {/* 대화 영역 — 사용자 질문 */}
      <div style={{ position: "absolute", top: 360, left: 140, maxWidth: 900, opacity: bubble1, transform: `scale(${0.95 + bubble1 * 0.05})`, transformOrigin: "left top" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg, #ffbe5c 0%, #ff8f5a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🧑‍💻</div>
          <div>
            <div style={{ fontSize: 18, color: "#a89dc3", marginBottom: 6, letterSpacing: "0.15em" }}>USER · 질문</div>
            <div style={{ padding: "20px 28px", background: "rgba(255,190,92,0.1)", borderLeft: "4px solid #ffbe5c", borderRadius: "2px 16px 16px 16px", fontSize: 30, color: "#fff", lineHeight: 1.4, maxWidth: 780 }}>
              이 프로젝트 어떻게 <span style={{ color: "#ffbe5c", fontWeight: 700 }}>만들면 좋을까?</span>
              <br />
              어떻게 기획해볼까?
            </div>
          </div>
        </div>
      </div>

      {/* AI 응답 버블 (사고중) */}
      <div style={{ position: "absolute", top: 640, right: 140, maxWidth: 900, opacity: bubble2, transform: `scale(${0.95 + bubble2 * 0.05})`, transformOrigin: "right top" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "flex-end" }}>
          <div>
            <div style={{ fontSize: 18, color: "#a89dc3", marginBottom: 6, letterSpacing: "0.15em", textAlign: "right" }}>CLAUDE · 터미널에서 사고중</div>
            <div style={{ padding: "20px 28px", background: "rgba(143,213,255,0.1)", borderRight: "4px solid #8fd5ff", borderRadius: "16px 2px 16px 16px", fontSize: 26, color: "#c5d7f0", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, maxWidth: 780 }}>
              <div style={{ color: "#8fd5ff" }}>&gt; analyzing repo structure...</div>
              <div style={{ color: "#8fd5ff" }}>&gt; mapping dependencies...</div>
              <div style={{ color: "#ffbe5c" }}>&gt; drafting spec outline{".".repeat(thinkingDots)}</div>
            </div>
            <div style={{ fontSize: 16, color: "#ff6b8a", marginTop: 10, textAlign: "right", fontStyle: "italic" }}>
              * 사고 중엔 터미널 사용 불가 — 다음 씬에서 해결책
            </div>
          </div>
          <div style={{ width: 54, height: 54, borderRadius: 10, background: "linear-gradient(135deg, #8fd5ff 0%, #c8a8ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, color: "#0a0e1c", fontWeight: 800 }}>AI</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
