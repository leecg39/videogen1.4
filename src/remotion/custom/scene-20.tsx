// scene-20 — "쓰지 마세요 / 기다리세요 는 답이 아니다" 단호한 반박
// 의도: 금지 픽토그램 + 취소선 + "NO" 워터마크. "이건 해결 아니다" 강한 경고.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene20: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const stampAppear = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stampRotate = interpolate(frame, [20, 45], [-30, -12]);
  const lineDraw = interpolate(frame, [56, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const conclusion = interpolate(frame, [120, 160], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #1a0810 0%, #080406 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 배경 경고 스트라이프 */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(-45deg, transparent 0, transparent 60px, rgba(255,59,59,0.06) 60px, rgba(255,59,59,0.06) 80px)", opacity: 0.8 }} />

      {/* 상단 */}
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 22, color: "#ff6b3d", letterSpacing: "0.4em", fontWeight: 700 }}>NOT A SOLUTION · 해결 아님</div>
      </div>

      {/* 중앙: 인용구 with 취소선 */}
      <div style={{ position: "absolute", top: 200, left: 140, right: 140 }}>
        <div style={{ fontSize: 56, color: "#c5d7f0", fontWeight: 600, lineHeight: 1.3, fontStyle: "italic", position: "relative" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <span>&ldquo;몇 시간 후에 쓰세요&rdquo;</span>
            <div style={{ position: "absolute", top: "50%", left: 0, height: 4, width: `${lineDraw * 100}%`, background: "#ff3b3b", transform: "translateY(-50%)", transformOrigin: "left" }} />
          </div>
        </div>
        <div style={{ fontSize: 56, color: "#c5d7f0", fontWeight: 600, lineHeight: 1.3, fontStyle: "italic", marginTop: 20 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <span>&ldquo;그냥 좀 기다리세요&rdquo;</span>
            <div style={{ position: "absolute", top: "50%", left: 0, height: 4, width: `${lineDraw * 100}%`, background: "#ff3b3b", transform: "translateY(-50%)", transformOrigin: "left" }} />
          </div>
        </div>
      </div>

      {/* NO 스탬프 */}
      <div style={{ position: "absolute", top: 300, right: 200, transform: `scale(${stampAppear}) rotate(${stampRotate}deg)`, opacity: stampAppear }}>
        <div style={{ padding: "24px 60px", border: "8px solid #ff3b3b", borderRadius: 8, background: "rgba(255,59,59,0.08)" }}>
          <div style={{ fontSize: 120, fontWeight: 900, color: "#ff3b3b", lineHeight: 0.9, letterSpacing: "0.1em" }}>NO.</div>
          <div style={{ fontSize: 18, color: "#ff3b3b", letterSpacing: "0.4em", fontWeight: 700, marginTop: 4 }}>NOT A FIX</div>
        </div>
      </div>

      {/* 금지 아이콘 */}
      <div style={{ position: "absolute", top: 540, left: "50%", transform: "translateX(-50%)", opacity: stampAppear }}>
        <svg width="180" height="180" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#ff3b3b" strokeWidth="6" />
          <line x1="22" y1="22" x2="78" y2="78" stroke="#ff3b3b" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>

      {/* 하단 결론 */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center", opacity: conclusion }}>
        <div style={{ fontSize: 42, color: "#fff", fontWeight: 700, lineHeight: 1.3 }}>
          <span style={{ color: "#ffbe5c" }}>마감</span> 있는 프로젝트라면 — 도구가 <span style={{ color: "#ff3b3b", fontWeight: 900 }}>멈출 수 있다</span>는 걸 염두에
        </div>
        <div style={{ fontSize: 24, color: "#8fa5c7", marginTop: 12, fontStyle: "italic" }}>
          해결 아니면 — 대안이 필요하다
        </div>
      </div>
    </AbsoluteFill>
  );
};
