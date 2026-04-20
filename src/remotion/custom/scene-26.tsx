// scene-26 — "Gemma 4 최대 모델 31B · 수학 89% / 코딩 80%"
// 원칙 B 데모: DSL 노드 `ImpactStat`, `CompareBars` 를 TSX 안에서 import. HF 자유도 + 74 노드 자산 보존.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { D } from "./_dsl";

export const Scene26: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const heroSlide = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, from: -60, to: 0 });
  const trophyPop = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 180 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 20% 30%, #0a1424 0%, #050811 85%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 상단 라벨 */}
      <div style={{ position: "absolute", top: 80, left: 140, transform: `translateY(${heroSlide}px)`, opacity: headerOpacity }}>
        <div style={{ fontSize: 22, color: "#7dffb0", letterSpacing: "0.4em", fontWeight: 700 }}>LARGEST MODEL · 31B</div>
        <div style={{ fontSize: 44, color: "#fff", marginTop: 10, fontWeight: 600 }}>오픈 모델 벤치마크 Top 3 진입</div>
      </div>

      {/* 좌측: 거대한 31B stat (DSL ImpactStat 사용 — 원칙 B) */}
      <div style={{ position: "absolute", top: 240, left: 140, width: 700 }}>
        <div style={{ opacity: headerOpacity }}>
          <D type="ImpactStat" data={{ value: "31", suffix: "B", label: "파라미터 · parameters", accentColor: "#7dffb0" }} frame={frame} durationFrames={durationFrames} />
        </div>
        <div style={{ marginTop: 30, padding: "16px 22px", background: "rgba(125,255,176,0.08)", borderLeft: "4px solid #7dffb0", borderRadius: 4, opacity: trophyPop, transform: `scale(${trophyPop})`, transformOrigin: "left center" }}>
          <div style={{ fontSize: 20, color: "#7dffb0", letterSpacing: "0.3em", fontWeight: 700 }}>🏆 TOP 3</div>
          <div style={{ fontSize: 28, color: "#fff", marginTop: 6 }}>세 손가락 안에 드는 오픈 모델 성적</div>
        </div>
      </div>

      {/* 우측: 과목별 점수 — DSL 노드 직접 쓰는 대신 여기서는 고유 바 시각화 */}
      <div style={{ position: "absolute", top: 260, right: 140, width: 680 }}>
        <div style={{ fontSize: 20, color: "#8fd5ff", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 30 }}>BENCHMARK SCORES</div>

        {[
          { subject: "수학 · Math", score: 89, color: "#7dffb0", delay: 36 },
          { subject: "코딩 · Coding", score: 80, color: "#8fd5ff", delay: 60 },
        ].map((b, i) => {
          const fill = interpolate(frame, [b.delay, b.delay + 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span style={{ fontSize: 26, color: "#c5d7f0", fontWeight: 600 }}>{b.subject}</span>
                <span style={{ fontSize: 64, fontWeight: 900, color: b.color, fontFeatureSettings: "'tnum'" }}>{Math.round(b.score * fill)}<span style={{ fontSize: 32, color: "#8fa5c7" }}>%</span></span>
              </div>
              <div style={{ height: 18, background: "rgba(255,255,255,0.06)", borderRadius: 9, overflow: "hidden" }}>
                <div style={{ width: `${b.score * fill}%`, height: "100%", background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`, transition: "width 0.1s" }} />
              </div>
              {/* 100 기준 눈금 */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12, color: "#5a6d96", fontFeatureSettings: "'tnum'" }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 콜아웃 */}
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", opacity: trophyPop }}>
        <div style={{ fontSize: 30, color: "#a8e6c8", fontStyle: "italic" }}>
          <span style={{ color: "#7dffb0", fontWeight: 700 }}>오픈 웨이트</span> 로 최상급 성능. 누구나 다운로드.
        </div>
      </div>
    </AbsoluteFill>
  );
};
