// scene-25 — "Gemma 4 크기 4종 · 가장 작은 건 23억 파라미터 (뇌세포 비유)"
// 의도: 네 개 사이즈(2.3B / 7B / 12B / 31B) 를 네 개 "뇌" 일러스트로 차등 표현. 하단 "노트북에서 돌린다" 콜아웃.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const MODELS = [
  { size: "2.3B", label: "작은 뇌", scale: 0.35, color: "#7dffb0", note: "노트북에서 바로" },
  { size: "7B", label: "중간", scale: 0.55, color: "#8fd5ff", note: "개인 워크스테이션" },
  { size: "12B", label: "강한", scale: 0.75, color: "#c8a8ff", note: "서버급" },
  { size: "31B", label: "최강", scale: 1.0, color: "#ffbe5c", note: "수학 89 · 코딩 80" },
];

function BrainIcon({ scale, color }: { scale: number; color: string }) {
  // 파라미터 수에 비례한 뇌 네트워크 노드/엣지 수
  const nodeCount = Math.max(6, Math.floor(scale * 20));
  const baseRadius = 80 * scale + 40;
  const nodes = Array.from({ length: nodeCount }).map((_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2;
    const r = baseRadius * (0.6 + 0.4 * Math.sin(i * 7.13));
    return { x: 100 + Math.cos(angle) * r, y: 100 + Math.sin(angle) * r };
  });
  return (
    <svg width="220" height="220" viewBox="0 0 200 200">
      {nodes.map((n, i) => {
        return nodes.slice(i + 1).map((m, j) => {
          const dist = Math.hypot(n.x - m.x, n.y - m.y);
          if (dist > 60) return null;
          return <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={color} strokeWidth="0.6" opacity="0.5" />;
        });
      })}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={3 + scale * 2} fill={color} opacity={0.9} />
      ))}
      {/* 중심 노드 */}
      <circle cx="100" cy="100" r={6 + scale * 6} fill={color} />
    </svg>
  );
}

export const Scene25: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #08121e 0%, #030712 90%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      {/* 상단 헤더 */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#8fd5ff", letterSpacing: "0.4em", fontWeight: 700 }}>GEMMA 4 · 4 SIZES</div>
        <div style={{ fontSize: 56, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          <span style={{ color: "#8fd5ff" }}>뇌세포</span>를 골라서 가져간다
        </div>
      </div>

      {/* 4개 모델 가로 배열 — 크기 비례 */}
      <div style={{ position: "absolute", top: 300, left: 120, right: 120, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
        {MODELS.map((m, i) => {
          const delay = 26 + i * 16;
          const enter = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 110 }, from: 0, to: 1 });
          const y = interpolate(enter, [0, 1], [80, 0]);
          return (
            <div key={i} style={{ transform: `translateY(${y}px)`, opacity: enter, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ transform: `scale(${m.scale})` }}>
                <BrainIcon scale={m.scale} color={m.color} />
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, color: m.color, fontFeatureSettings: "'tnum'", lineHeight: 1 }}>{m.size}</div>
              <div style={{ fontSize: 18, color: "#8fa5c7", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 16, color: "#6a7da0", textAlign: "center", maxWidth: 200 }}>{m.note}</div>
            </div>
          );
        })}
      </div>

      {/* 좌하단 콜아웃 — 2.3B 뇌 강조 */}
      <div style={{ position: "absolute", bottom: 110, left: 150, padding: "18px 24px", background: "rgba(125,255,176,0.08)", border: "1px solid rgba(125,255,176,0.4)", borderRadius: 12, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ fontSize: 36 }}>💻</div>
        <div>
          <div style={{ fontSize: 16, color: "#7dffb0", letterSpacing: "0.3em", fontWeight: 700 }}>SMALLEST · 가장 작은 뇌</div>
          <div style={{ fontSize: 26, color: "#fff", marginTop: 4 }}>
            <span style={{ fontWeight: 800 }}>23억 파라미터</span> · 보통 노트북에서 <span style={{ color: "#7dffb0", fontWeight: 700 }}>쉽게 실행</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
