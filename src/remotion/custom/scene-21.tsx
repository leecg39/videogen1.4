// scene-21 — "마감 있는 프로젝트 — 도구가 멈출 수 있다"
// 의도: 까맣게 꺼지는 스크린 + 마감 달력에 데드라인 blood red. 위험 경고 분위기.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene21: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const deadOpacity = interpolate(frame, [40, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const warnBlink = 0.5 + 0.5 * Math.abs(Math.sin(frame / 10));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #100604 0%, #06030a 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 22, color: "#ff6b3d", letterSpacing: "0.45em", fontWeight: 700, opacity: warnBlink }}>⚠ WARNING · 경고</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          <span style={{ color: "#ff3b3b" }}>마감</span> 있는 프로젝트?
        </div>
      </div>

      {/* 좌측: 꺼진 노트북 일러스트 */}
      <div style={{ position: "absolute", top: 280, left: 160, width: 540, height: 420 }}>
        <div style={{ width: "100%", height: 320, background: "linear-gradient(180deg, #1a1815 0%, #0a0908 100%)", border: "2px solid #3a2f2a", borderRadius: "14px 14px 4px 4px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 20, background: "#000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, color: "#ff3b3b", letterSpacing: "0.4em", fontFamily: "'JetBrains Mono', monospace", opacity: deadOpacity }}>⏻ PROCESS TERMINATED</div>
            <div style={{ fontSize: 48, color: "#ff3b3b", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", opacity: deadOpacity }}>claude: limit</div>
            <div style={{ fontSize: 16, color: "#666", fontFamily: "'JetBrains Mono', monospace", opacity: deadOpacity * 0.6 }}>retry in ~6h</div>
          </div>
        </div>
        <div style={{ width: "110%", height: 16, background: "#2a2420", marginLeft: "-5%", borderRadius: "0 0 24px 24px" }} />
        <div style={{ marginTop: 30, fontSize: 20, color: "#b88a74", fontStyle: "italic", textAlign: "center" }}>도구가 멈추면 — 기다리는 것밖에 없다</div>
      </div>

      {/* 우측: 데드라인 달력 */}
      <div style={{ position: "absolute", top: 280, right: 160, width: 580 }}>
        <div style={{ padding: "30px 36px", background: "linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(255,107,61,0.05) 100%)", border: "2px solid rgba(255,59,59,0.5)", borderRadius: 14 }}>
          <div style={{ fontSize: 18, color: "#ff6b3d", letterSpacing: "0.4em", fontWeight: 700 }}>DEADLINE · 마감</div>
          <div style={{ fontSize: 88, fontWeight: 900, color: "#ff3b3b", lineHeight: 1, fontFeatureSettings: "'tnum'", marginTop: 8, textShadow: "0 10px 40px rgba(255,59,59,0.3)" }}>
            D-3
          </div>
          <div style={{ fontSize: 22, color: "#ffbe9a", marginTop: 6 }}>클라이언트 납품일</div>

          <div style={{ marginTop: 30, padding: "18px 20px", background: "rgba(0,0,0,0.3)", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#ff8f5a" }}>
            <div>08:00 → claude code 기획</div>
            <div style={{ color: "#ff3b3b", textDecoration: "line-through" }}>09:15 → limit reached</div>
            <div style={{ color: "#666" }}>15:00 → (대기중...)</div>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: "16px 22px", background: "rgba(255,190,92,0.1)", borderLeft: "4px solid #ffbe5c", borderRadius: 4 }}>
          <div style={{ fontSize: 24, color: "#ffbe5c", fontWeight: 700, lineHeight: 1.3 }}>
            <span style={{ fontWeight: 900 }}>대비책 필수</span> — 도구 의존도 낮추기
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
