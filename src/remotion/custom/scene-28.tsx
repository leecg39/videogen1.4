// scene-28 — "Claude Sonnet 비교 + MLX 가속 3~4배"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene28: React.FC<NodeProps> = ({ frame }) => {
  const a = interpolate(frame, [20, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const b = interpolate(frame, [40, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const c = interpolate(frame, [70, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #061018 0%, #0f1a28 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140 }}>
        <div style={{ fontSize: 20, color: "#8fd5ff", letterSpacing: "0.4em", fontWeight: 700 }}>COMMUNITY BENCHMARK</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>Claude Sonnet <span style={{ color: "#8fd5ff" }}>vs</span> Gemma 4 (+MLX)</div>
      </div>

      {/* 3 모델 수평 바 */}
      <div style={{ position: "absolute", top: 280, left: 160, right: 160 }}>
        {[
          { label: "Claude Sonnet (paid)", score: 90, color: "#c8a8ff", fill: a, note: "클라우드 유료" },
          { label: "Gemma 4 31B (local)", score: 78, color: "#7dffb0", fill: b, note: "맥북 로컬" },
          { label: "Gemma 4 + MLX (local)", score: 93, color: "#ffbe5c", fill: c, note: "+ Apple Silicon 가속", highlight: true },
        ].map((m, i) => (
          <div key={i} style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 28, color: "#fff", fontWeight: 700 }}>{m.label}</span>
              <span style={{ fontSize: 48, color: m.color, fontWeight: 900, fontFeatureSettings: "'tnum'" }}>{Math.round(m.score * m.fill)}</span>
            </div>
            <div style={{ height: m.highlight ? 32 : 24, background: `${m.color}18`, borderRadius: 8, overflow: "hidden", border: m.highlight ? `2px solid ${m.color}` : "none" }}>
              <div style={{ width: `${m.score * m.fill}%`, height: "100%", background: `linear-gradient(90deg, ${m.color}88 0%, ${m.color} 100%)` }} />
            </div>
            <div style={{ fontSize: 16, color: `${m.color}aa`, marginTop: 4 }}>{m.note}</div>
          </div>
        ))}
      </div>

      {/* 하단 결과 */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", opacity: c }}>
        <div style={{ fontSize: 36, color: "#fff", fontWeight: 700 }}>
          속도 <span style={{ color: "#ffbe5c", fontWeight: 900, fontFeatureSettings: "'tnum'", fontSize: 52 }}>×3~4배</span> 빨라졌다
        </div>
      </div>
    </AbsoluteFill>
  );
};
