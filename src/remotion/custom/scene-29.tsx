// scene-29 — "vLLM / MLX / Ollama 용어 정리" 3 개념 레이어
// 의도: 세 개념을 "레스토랑 주방 메타포" 로 쌓인 층으로 시각화.
// vLLM=주방장(효율), MLX=맥 전용 오븐, Ollama=손님 응대 인터페이스. 아래→위로 쌓이는 인포그래픽.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const LAYERS = [
  { name: "Ollama", role: "홀서빙 · 간편 인터페이스", analogy: "주문받고 손님 응대", delay: 80, color: "#ffbe5c", icon: "🍽️" },
  { name: "MLX", role: "Apple Silicon 가속", analogy: "맥 전용 오븐", delay: 50, color: "#8fd5ff", icon: "🔥" },
  { name: "vLLM", role: "토큰 배분 엔진", analogy: "주방장 · 손님 안 기다리게", delay: 20, color: "#7dffb0", icon: "👨‍🍳" },
];

export const Scene29: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0614 0%, #14081c 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 헤더 */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#c8a8ff", letterSpacing: "0.45em", fontWeight: 700 }}>용어 정리 · GLOSSARY</div>
        <div style={{ fontSize: 50, color: "#fff", fontWeight: 800, marginTop: 10 }}>
          주방 메타포로 <span style={{ color: "#c8a8ff" }}>3분 정리</span>
        </div>
      </div>

      {/* 주방 레이어 스택 — 아래에서 위로 쌓임 */}
      <div style={{ position: "absolute", top: 260, left: "50%", transform: "translateX(-50%)", width: 1100, display: "flex", flexDirection: "column", gap: 18 }}>
        {LAYERS.map((layer, i) => {
          const enter = interpolate(frame, [layer.delay, layer.delay + 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(enter, [0, 1], [80, 0]);
          return (
            <div key={layer.name} style={{
              transform: `translateY(${y}px)`,
              opacity: enter,
              display: "grid",
              gridTemplateColumns: "130px 1fr auto",
              alignItems: "center",
              gap: 30,
              padding: "30px 40px",
              background: `linear-gradient(90deg, ${layer.color}18 0%, transparent 80%)`,
              borderLeft: `6px solid ${layer.color}`,
              borderRadius: 8,
              position: "relative",
            }}>
              {/* 아이콘 */}
              <div style={{ width: 100, height: 100, borderRadius: 16, background: `${layer.color}22`, border: `1.5px solid ${layer.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                {layer.icon}
              </div>

              {/* 이름 + 역할 */}
              <div>
                <div style={{ fontSize: 56, fontWeight: 900, color: layer.color, letterSpacing: "-0.01em", lineHeight: 1 }}>{layer.name}</div>
                <div style={{ fontSize: 24, color: "#c5d7f0", marginTop: 6 }}>{layer.role}</div>
              </div>

              {/* 비유 */}
              <div style={{ textAlign: "right", maxWidth: 380 }}>
                <div style={{ fontSize: 14, color: `${layer.color}aa`, letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>ANALOGY</div>
                <div style={{ fontSize: 22, color: "#fff", fontStyle: "italic", lineHeight: 1.35 }}>
                  &ldquo;{layer.analogy}&rdquo;
                </div>
              </div>

              {/* 레이어 번호 */}
              <div style={{ position: "absolute", left: -40, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: layer.color, fontWeight: 900, letterSpacing: "0.2em" }}>
                L{i + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 주석 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 24, color: "#8fa5c7" }}>
          → 합쳐서 쓰면 <span style={{ color: "#7dffb0", fontWeight: 700 }}>내 맥북에서 AI 서빙 끝</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
