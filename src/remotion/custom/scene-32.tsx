// scene-32 — "vLLM + MLX 합작 도구 + Ollama 간편함 = 레고 블록처럼 조립"
// 원칙 B: CompareBars + Badge 2종 import + 블록 조립 일러스트.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

const BLOCKS = [
  { id: "vllm", label: "vLLM", role: "스마트 분배", color: "#7dffb0", x: 140, delay: 16 },
  { id: "mlx", label: "MLX", role: "Apple 가속", color: "#8fd5ff", x: 260, delay: 34 },
  { id: "ollama", label: "Ollama", role: "간편 설치", color: "#ffbe5c", x: 380, delay: 52 },
];

export const Scene32: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const synergy = interpolate(frame, [80, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #080d16 0%, #0d1630 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 140, opacity: headerOpacity }}>
        <D type="Kicker" data={{ text: "COMBINATION · 합작", color: "#c8a8ff" }} frame={frame} durationFrames={durationFrames} />
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 12, lineHeight: 1.1 }}>
          3개 도구를 <span style={{ color: "#c8a8ff" }}>레고 블록</span>처럼 조립
        </div>
      </div>

      {/* 좌측: 레고 블록 3개 쌓기 */}
      <div style={{ position: "absolute", top: 280, left: 140, width: 480, height: 500 }}>
        <svg width="100%" height="100%" viewBox="0 0 500 500">
          {BLOCKS.map((b, i) => {
            const enter = spring({ frame: frame - b.delay, fps, config: { damping: 14, stiffness: 110 }, from: -300, to: 0 });
            const y = 360 - i * 110 + enter;
            return (
              <g key={b.id}>
                <rect x={80} y={y} width={340} height={92} rx={10} fill={b.color} opacity={0.92} />
                {/* 레고 스터드 */}
                {[0, 1, 2, 3].map((s) => (
                  <circle key={s} cx={80 + 50 + s * 80} cy={y + 14} r={12} fill={b.color} stroke={b.color} />
                ))}
                <text x={100} y={y + 50} fill="#0a0e1c" fontSize="36" fontWeight="900" fontFamily="Space Grotesk">{b.label}</text>
                <text x={100} y={y + 78} fill="#0a0e1c" fontSize="18" fontFamily="Space Grotesk" opacity="0.75">{b.role}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 우측: 성능 대비 — DSL CompareBars 사용 (원칙 B) */}
      <div style={{ position: "absolute", top: 260, right: 140, width: 820 }}>
        <div style={{ marginBottom: 22 }}>
          <D type="Kicker" data={{ text: "STACK RESULT · 합친 결과", color: "#7dffb0" }} frame={frame} durationFrames={durationFrames} />
        </div>
        <D type="CompareBars" data={{
          items: [
            { label: "단일 vLLM", value: 45, color: "#7dffb0" },
            { label: "vLLM + MLX", value: 75, color: "#8fd5ff" },
            { label: "vLLM + MLX + Ollama", value: 95, color: "#c8a8ff" },
          ],
          unit: "점",
          max: 100,
        }} frame={frame} durationFrames={durationFrames} />

        <div style={{ marginTop: 30, display: "flex", gap: 12, opacity: synergy }}>
          <D type="Badge" data={{ text: "무료", color: "#7dffb0" }} frame={frame} durationFrames={durationFrames} />
          <D type="Badge" data={{ text: "맥 최적화", color: "#8fd5ff" }} frame={frame} durationFrames={durationFrames} />
          <D type="Badge" data={{ text: "원 커맨드", color: "#ffbe5c" }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>

      {/* 하단 방정식 */}
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", opacity: synergy }}>
        <div style={{ fontSize: 38, color: "#fff", fontWeight: 700, letterSpacing: "0.05em" }}>
          vLLM <span style={{ color: "#c8a8ff" }}>+</span> MLX <span style={{ color: "#c8a8ff" }}>+</span> Ollama <span style={{ color: "#c8a8ff" }}>=</span> <span style={{ color: "#c8a8ff", fontWeight: 900 }}>내 맥북에서 AI 서빙</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
