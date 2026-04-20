// scene-12 — "한적 20% vs 피크 40%" 같은 작업 2배 소비
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene12: React.FC<NodeProps> = ({ frame }) => {
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const off = interpolate(frame, [20, 80], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const peak = interpolate(frame, [50, 130], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #110610 0%, #0a0608 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 90, left: 140, opacity: headerOpacity }}>
        <div style={{ fontSize: 20, color: "#ffbe5c", letterSpacing: "0.4em", fontWeight: 700 }}>SAME TASK · DIFFERENT TIMES</div>
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 10 }}>같은 작업, <span style={{ color: "#ff6b8a" }}>2배</span> 소비</div>
      </div>

      <div style={{ position: "absolute", top: 320, left: 160, right: 160 }}>
        {/* off-peak */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 28, color: "#7dffb0", letterSpacing: "0.2em", fontWeight: 700 }}>한적 · OFF-PEAK (02:00)</span>
            <span style={{ fontSize: 44, color: "#7dffb0", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>{Math.round(off)}%</span>
          </div>
          <div style={{ height: 60, background: "rgba(125,255,176,0.08)", border: "1px solid rgba(125,255,176,0.3)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${off}%`, height: "100%", background: "linear-gradient(90deg, #7dffb0 0%, #5ebf8a 100%)" }} />
          </div>
        </div>

        {/* peak */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 28, color: "#ff6b8a", letterSpacing: "0.2em", fontWeight: 700 }}>피크 · PEAK (15:30)</span>
            <span style={{ fontSize: 44, color: "#ff6b8a", fontWeight: 900, fontFeatureSettings: "'tnum'" }}>{Math.round(peak)}%</span>
          </div>
          <div style={{ height: 60, background: "rgba(255,107,138,0.08)", border: "1px solid rgba(255,107,138,0.3)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${peak}%`, height: "100%", background: "linear-gradient(90deg, #ffbe5c 0%, #ff3b5c 100%)" }} />
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 68, color: "#fff", fontWeight: 900, letterSpacing: "-0.01em" }}>
          <span style={{ color: "#7dffb0" }}>20%</span> → <span style={{ color: "#ff3b5c" }}>40%</span>
        </div>
        <div style={{ fontSize: 22, color: "#a89dc3", marginTop: 6, fontStyle: "italic" }}>피크 시간에는 토큰이 2배 소모 · 더 빨리 바닥</div>
      </div>
    </AbsoluteFill>
  );
};
