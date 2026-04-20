// scene-70 — "도구는 계속 많아진다 · 기하급수적 오픈소스 트렌드"
// 의도: 상단 시간축에 점점 많아지는 도구 점들. 노드 네트워크가 기하급수적으로 확산. 하단에 "진짜 중요한 건?" 질문.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene70: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const questionOpacity = interpolate(frame, [130, 170], [0, 1], { extrapolateRight: "clamp" });

  // 시간축 위에 기하급수로 늘어나는 점들
  // 시간이 갈수록 새 도구 등장 빈도 증가
  const toolCount = Math.floor(interpolate(frame, [10, 140], [3, 48], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const tools = Array.from({ length: 48 }).map((_, i) => {
    const expGrowth = Math.pow(i / 48, 0.55); // exponential crowd
    const x = 200 + expGrowth * 1600;
    const ySpread = 180 * (0.3 + Math.sin(i * 3.7) * 0.35 + Math.cos(i * 1.9) * 0.35);
    const y = 500 + ySpread;
    const size = 6 + ((i * 13) % 10);
    const visible = i < toolCount;
    const hue = (i * 37) % 360;
    return { x, y, size, visible, hue, i };
  });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a18 0%, #181430 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 헤더 */}
      <div style={{ position: "absolute", top: 90, left: 140, opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#c8a8ff", letterSpacing: "0.4em", fontWeight: 700 }}>EXPONENTIAL FLOOD</div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 800, marginTop: 10, lineHeight: 1.08 }}>
          도구는 <span style={{ color: "#c8a8ff" }}>기하급수</span>로 많아진다
        </div>
      </div>

      {/* 시간축 */}
      <svg style={{ position: "absolute", top: 440, left: 0, width: "100%", height: 360 }} viewBox="0 0 1920 360">
        {/* 축 */}
        <line x1="200" y1="320" x2="1800" y2="320" stroke="#5a5068" strokeWidth="2" />
        {/* 눈금 */}
        {["2020", "2022", "2024", "2026", "2028"].map((y, i) => {
          const x = 200 + i * 400;
          return (
            <g key={y}>
              <line x1={x} y1="315" x2={x} y2="325" stroke="#8fa5c7" strokeWidth="1.5" />
              <text x={x} y="352" textAnchor="middle" fill="#8fa5c7" fontSize="18" fontFamily="'Space Grotesk', sans-serif">{y}</text>
            </g>
          );
        })}

        {/* 도구 점들 */}
        {tools.map((t) => {
          if (!t.visible) return null;
          const appearFrame = 10 + t.i * 2.8;
          const enter = interpolate(frame, [appearFrame, appearFrame + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <circle key={t.i} cx={t.x} cy={t.y} r={t.size * enter} fill={`hsl(${t.hue}, 75%, 65%)`} opacity={enter * 0.85}>
              <animate attributeName="r" values={`${t.size};${t.size * 1.2};${t.size}`} dur="2s" repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* 흐름 선 */}
        <path d="M 200 320 Q 600 310 1000 280 T 1800 120" stroke="url(#grad70)" strokeWidth="3" fill="none" />
        <defs>
          <linearGradient id="grad70" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#5a5068" />
            <stop offset="60%" stopColor="#c8a8ff" />
            <stop offset="100%" stopColor="#ff6b8a" />
          </linearGradient>
        </defs>
      </svg>

      {/* 우측 카운터 */}
      <div style={{ position: "absolute", top: 110, right: 140, textAlign: "right" }}>
        <div style={{ fontSize: 18, color: "#a89dc3", letterSpacing: "0.3em", fontWeight: 700 }}>TOOLS VISIBLE</div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#c8a8ff", lineHeight: 0.9, fontFeatureSettings: "'tnum'" }}>{toolCount.toString().padStart(2, "0")}+</div>
        <div style={{ fontSize: 20, color: "#8fa5c7" }}>&uarr; 새 오픈소스 / 기술</div>
      </div>

      {/* 하단 핵심 질문 */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", opacity: questionOpacity }}>
        <div style={{ fontSize: 40, color: "#ff6b8a", fontWeight: 700, letterSpacing: "0.05em" }}>
          그래서 — <span style={{ fontStyle: "italic", color: "#fff" }}>뭘 시킬 것인가?</span>
        </div>
        <div style={{ fontSize: 22, color: "#8fa5c7", marginTop: 8 }}>도구 수보다 중요한 건 사용자의 판단</div>
      </div>
    </AbsoluteFill>
  );
};
