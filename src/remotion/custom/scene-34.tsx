// scene-34 — "레고 블록 메타포 — AI 도구 조합 자유"
// 의도: 실제 레고 블록 애니 조립. 3개가 1개로 결합.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene34: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const block1 = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 120 }, from: -600, to: 0 });
  const block2 = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 120 }, from: 600, to: 0 });
  const block3 = spring({ frame: frame - 54, fps, config: { damping: 14, stiffness: 120 }, from: -400, to: 0 });
  const assembled = interpolate(frame, [80, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #0a0e1e 0%, #14182a 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 24, color: "#ffbe5c", letterSpacing: "0.5em", fontWeight: 700 }}>LEGO METAPHOR</div>
        <div style={{ fontSize: 60, color: "#fff", fontWeight: 900, marginTop: 12 }}>조합 자유</div>
      </div>

      {/* 3 블록 조립 */}
      <svg style={{ position: "absolute", top: 280, left: 0, right: 0, width: "100%", height: 500 }} viewBox="0 0 1920 500">
        {/* block 1: 빨강 */}
        <g transform={`translate(${460 + block1}, 160)`}>
          <rect x="0" y="40" width="240" height="80" rx="8" fill="#ff6b8a" />
          {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 80} cy={32} r="18" fill="#ff6b8a" />)}
          <text x="120" y="90" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="900">vLLM</text>
        </g>
        {/* block 2: 파랑 */}
        <g transform={`translate(${840 + block2}, 160)`}>
          <rect x="0" y="40" width="240" height="80" rx="8" fill="#8fd5ff" />
          {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 80} cy={32} r="18" fill="#8fd5ff" />)}
          <text x="120" y="90" textAnchor="middle" fill="#0a0e1e" fontSize="28" fontWeight="900">MLX</text>
        </g>
        {/* block 3: 노랑 */}
        <g transform={`translate(${1220 + block3}, 160)`}>
          <rect x="0" y="40" width="240" height="80" rx="8" fill="#ffbe5c" />
          {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 80} cy={32} r="18" fill="#ffbe5c" />)}
          <text x="120" y="90" textAnchor="middle" fill="#0a0e1e" fontSize="28" fontWeight="900">Ollama</text>
        </g>

        {/* 조립 후 결합 블록 (fade in) */}
        {assembled > 0 && (
          <g opacity={assembled} transform="translate(580, 320)">
            <rect x="0" y="40" width="760" height="100" rx="10" fill="url(#combined34)" />
            <defs>
              <linearGradient id="combined34" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#ff6b8a" />
                <stop offset="50%" stopColor="#8fd5ff" />
                <stop offset="100%" stopColor="#ffbe5c" />
              </linearGradient>
            </defs>
            {Array.from({ length: 9 }).map((_, i) => (
              <circle key={i} cx={50 + i * 85} cy={32} r="20" fill={i < 3 ? "#ff6b8a" : i < 6 ? "#8fd5ff" : "#ffbe5c"} />
            ))}
            <text x="380" y="104" textAnchor="middle" fill="#fff" fontSize="40" fontWeight="900">맥북 AI 서빙 완성</text>
          </g>
        )}
      </svg>

      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#c5d7f0" }}>
          상황에 맞게 <span style={{ color: "#ffbe5c", fontWeight: 900 }}>원하는 조합</span>으로 — 필요한 만큼만
        </div>
      </div>
    </AbsoluteFill>
  );
};
