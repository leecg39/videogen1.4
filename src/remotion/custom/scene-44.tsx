// scene-44 — "Opus 4.6 · 최대 30분 전담 에이전트 작업"
// 원칙 B: ImpactStat + Pill + FooterCaption import + 시간 카운트다운 클럭.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

export const Scene44: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  // 30분 타이머 진행 — 프레임 대비 스윕
  const arcProgress = interpolate(frame, [20, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const activeMinutes = Math.floor(arcProgress * 30);
  const headerOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  // 원호 path 계산
  const startAngle = -90;
  const endAngle = -90 + arcProgress * 360;
  const largeArc = arcProgress > 0.5 ? 1 : 0;
  const arcEndX = 200 + 160 * Math.cos((endAngle * Math.PI) / 180);
  const arcEndY = 200 + 160 * Math.sin((endAngle * Math.PI) / 180);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 25% 40%, #14081e 0%, #06030a 85%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 140, opacity: headerOpacity }}>
        <D type="Kicker" data={{ text: "OPUS 4.6 · PREMIUM AGENT", color: "#c8a8ff" }} frame={frame} durationFrames={durationFrames} />
        <div style={{ fontSize: 54, color: "#fff", fontWeight: 800, marginTop: 12 }}>
          최상급 AI 가 <span style={{ color: "#c8a8ff" }}>전담</span>으로 붙는다
        </div>
      </div>

      {/* 좌측: 원형 타이머 */}
      <div style={{ position: "absolute", top: 280, left: 140, width: 460, height: 460, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width="400" height="400" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="arc44" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#c8a8ff" />
              <stop offset="100%" stopColor="#7dffb0" />
            </linearGradient>
          </defs>
          {/* 배경 원 */}
          <circle cx="200" cy="200" r="160" stroke="rgba(200,168,255,0.15)" strokeWidth="26" fill="none" />
          {/* 진행 원호 */}
          <path
            d={`M 200 40 A 160 160 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`}
            stroke="url(#arc44)"
            strokeWidth="26"
            fill="none"
            strokeLinecap="round"
          />
          {/* 내부 숫자 */}
          <text
            x="200"
            y="190"
            textAnchor="middle"
            fill="#fff"
            fontSize="160"
            fontWeight="900"
            fontFamily="Space Grotesk"
            style={{ fontFeatureSettings: "'tnum'" }}
          >
            {activeMinutes}
          </text>
          <text x="200" y="240" textAnchor="middle" fill="#c8a8ff" fontSize="28" fontWeight="600" fontFamily="Space Grotesk" letterSpacing="0.3em">MIN · / 30</text>
        </svg>
        <div style={{ marginTop: 10 }}>
          <D type="Pill" data={{ text: "작업 진행 중 · Agent running", color: "#c8a8ff" }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>

      {/* 우측: stat 리스트 */}
      <div style={{ position: "absolute", top: 300, right: 140, width: 760, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ padding: "20px 26px", background: "rgba(200,168,255,0.06)", borderLeft: "4px solid #c8a8ff", borderRadius: 4 }}>
          <D type="ImpactStat" data={{ value: "30", suffix: "분", label: "최대 작업 시간 · 단일 터미널 프롬프트", accentColor: "#c8a8ff" }} frame={frame} durationFrames={durationFrames} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[
            { label: "면밀한 기획서", desc: "리포 구조 + 의존 맵 + 플랜" },
            { label: "내 터미널 해방", desc: "즉시 다른 작업 가능" },
            { label: "동시 리서치", desc: "브라우저로 참고 자료 검색" },
            { label: "웹 코멘트", desc: "기획서 특정 부분 직접 지적" },
          ].map((item, i) => {
            const delay = 50 + i * 14;
            const enter = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)`, padding: "18px 20px", background: "rgba(143,213,255,0.06)", border: "1px solid rgba(143,213,255,0.18)", borderRadius: 10 }}>
                <div style={{ fontSize: 26, color: "#fff", fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 18, color: "#8fa5c7", marginTop: 4 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10 }}>
          <D type="FooterCaption" data={{ text: "/ultraplan 단 한 줄로 — 모든 heavy lifting 은 클라우드가" }} frame={frame} durationFrames={durationFrames} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
