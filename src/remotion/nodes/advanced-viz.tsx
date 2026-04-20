// Phase 4: Advanced Visualization Nodes — AreaChart, AnimatedTimeline, LineChart
// 고급 데이터 시각화 + 시간 기반 내러티브 노드
import React from "react";
import { interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { SvgIcon } from "../common/SvgIcons";

// ---------------------------------------------------------------------------
// AreaChart — 영역 차트, 좌→우 커튼 리빌
// data: { points: number[], labels?: string[], title?, fillColor?, lineColor? }
// ---------------------------------------------------------------------------
export const AreaChartRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 30;
  const localFrame = Math.max(0, frame - enterAt);

  const points: number[] = d.points ?? [20, 45, 30, 70, 55, 85, 60, 90];
  const labels: string[] = d.labels ?? [];
  const maxVal = Math.max(...points, 1);

  const chartW = 700;
  const chartH = 300;
  const padTop = 20;
  const padBot = 40;
  const plotH = chartH - padTop - padBot;

  // 포인트 좌표 계산
  const coords = points.map((val, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * chartW,
    y: padTop + plotH - (val / maxVal) * plotH,
  }));

  // 영역 path
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${chartW} ${chartH - padBot} L 0 ${chartH - padBot} Z`;

  // 리빌 클립
  const revealClip = interpolate(localFrame, [0, dur], [0, chartW], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fillColor = d.fillColor ?? P.accentBright;
  const lineColor = d.lineColor ?? P.accentBright;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      opacity,
      ...(node.style as React.CSSProperties),
    }}>
      {d.title && (
        <span style={{
          fontFamily: T.font, fontSize: 22, fontWeight: 600,
          color: T.textSecondary, textAlign: "center",
        }}>
          {d.title}
        </span>
      )}
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        <defs>
          <clipPath id={`area-clip-${node.id}`}>
            <rect x={0} y={0} width={revealClip} height={chartH} />
          </clipPath>
          <linearGradient id={`area-grad-${node.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* 그리드 라인 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i}
            x1={0} y1={padTop + plotH * (1 - pct)} x2={chartW} y2={padTop + plotH * (1 - pct)}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />
        ))}

        <g clipPath={`url(#area-clip-${node.id})`}>
          {/* 영역 */}
          <path d={areaPath} fill={`url(#area-grad-${node.id})`} />

          {/* 라인 */}
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${P.accentGlow})` }}
          />

          {/* 데이터 포인트 */}
          {coords.map((c, i) => {
            const pointFrame = localFrame - (i / points.length) * dur * 0.8;
            if (pointFrame < 0) return null;
            return (
              <circle key={i} cx={c.x} cy={c.y} r={5}
                fill={lineColor} stroke="#000" strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 4px ${P.accentGlow})` }}
              />
            );
          })}
        </g>

        {/* X축 라벨 */}
        {labels.map((label, i) => (
          <text key={i}
            x={coords[i]?.x ?? 0} y={chartH - 8}
            textAnchor="middle"
            fill={T.textMuted}
            fontSize={14}
            fontFamily={T.font}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LineChart — 다중 라인 차트
// data: { series: [{ label, points: number[], color? }], labels?: string[], title? }
// ---------------------------------------------------------------------------
export const LineChartRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 30;
  const localFrame = Math.max(0, frame - enterAt);

  const series: Array<{ label: string; points: number[]; color?: string }> = d.series ?? [];
  const labels: string[] = d.labels ?? [];
  const allPoints = series.flatMap(s => s.points);
  const maxVal = Math.max(...allPoints, 1);

  const chartW = 700;
  const chartH = 300;
  const padTop = 20;
  const padBot = 50;
  const plotH = chartH - padTop - padBot;

  const defaultColors = [P.accentBright, T.success, T.warning, T.info];

  const revealClip = interpolate(localFrame, [0, dur], [0, chartW], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      opacity,
      ...(node.style as React.CSSProperties),
    }}>
      {d.title && (
        <span style={{
          fontFamily: T.font, fontSize: 22, fontWeight: 600,
          color: T.textSecondary,
        }}>
          {d.title}
        </span>
      )}

      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        <defs>
          <clipPath id={`line-clip-${node.id}`}>
            <rect x={0} y={0} width={revealClip} height={chartH} />
          </clipPath>
        </defs>

        {/* 그리드 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i}
            x1={0} y1={padTop + plotH * (1 - pct)} x2={chartW} y2={padTop + plotH * (1 - pct)}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />
        ))}

        <g clipPath={`url(#line-clip-${node.id})`}>
          {series.map((s, si) => {
            const color = s.color ?? defaultColors[si % defaultColors.length];
            const coords = s.points.map((val, i) => ({
              x: (i / Math.max(s.points.length - 1, 1)) * chartW,
              y: padTop + plotH - (val / maxVal) * plotH,
            }));
            const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

            return (
              <g key={si}>
                <path d={pathD} fill="none" stroke={color} strokeWidth={3}
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
                />
                {coords.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={4}
                    fill={color} stroke="#000" strokeWidth={1.5}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* X축 라벨 */}
        {labels.map((label, i) => {
          const maxPts = Math.max(...series.map(s => s.points.length), 1);
          const x = (i / Math.max(maxPts - 1, 1)) * chartW;
          return (
            <text key={i} x={x} y={chartH - 8}
              textAnchor="middle" fill={T.textMuted}
              fontSize={14} fontFamily={T.font}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* 범례 */}
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3,
                backgroundColor: s.color ?? defaultColors[i % defaultColors.length],
              }} />
              <span style={{
                fontFamily: T.font, fontSize: 16, color: T.textSecondary,
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// AnimatedTimeline — 진행선이 그려지며 마일스톤 팝업
// data: { steps: [{ label, icon?, desc? }], direction?: "horizontal"|"vertical" }
// ---------------------------------------------------------------------------
export const AnimatedTimelineRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 40;
  const localFrame = Math.max(0, frame - enterAt);

  const steps: Array<{ label: string; icon?: string; desc?: string; enterAt?: number }> = d.steps ?? [];
  const isVertical = d.direction === "vertical";
  // 자막 타이밍 싱크: data.stepEnterAts 배열이 있으면 각 스텝의 절대 enterAt으로 사용
  // 없으면 기존 내부 계산 (dur 기반 균등 분배)
  const stepEnterAts: number[] | undefined = d.stepEnterAts;

  return (
    <div style={{
      display: "flex",
      flexDirection: isVertical ? "column" : "row",
      alignItems: isVertical ? "center" : "flex-end",
      justifyContent: "center",
      gap: 0,
      width: "100%",
      maxWidth: isVertical ? 900 : 1100,
      ...(node.style as React.CSSProperties),
    }}>
      {steps.map((step, i) => {
        // 우선순위: step.enterAt > stepEnterAts[i] > 자동 계산
        const absoluteStepEnter = step.enterAt ?? stepEnterAts?.[i];
        const stepDelay = absoluteStepEnter != null
          ? Math.max(0, absoluteStepEnter - enterAt)  // 절대→상대 변환
          : (i / steps.length) * dur * 0.7;
        const stepLocal = Math.max(0, localFrame - stepDelay);

        // 마일스톤 등장
        const dotScale = spring({
          frame: stepLocal,
          fps,
          config: { damping: 10, stiffness: 180, mass: 0.4 },
        });

        // 라인 드로잉 (다음 스텝까지)
        const lineProgress = i < steps.length - 1
          ? interpolate(stepLocal, [5, 15], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            })
          : 0;

        const labelOpacity = interpolate(stepLocal, [3, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const isActive = stepLocal > 0;

        if (isVertical) {
          return (
            <div key={i} style={{ display: "flex", gap: 28 }}>
              {/* 타임라인 트랙 */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                width: 56,
              }}>
                {/* 마일스톤 점 */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: isActive
                    ? `linear-gradient(135deg, ${P.accent}, ${P.accentBright})`
                    : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isActive ? P.accentBright : "rgba(255,255,255,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: `scale(${dotScale})`,
                  boxShadow: isActive ? `0 0 16px ${P.accentGlow}` : "none",
                  flexShrink: 0,
                }}>
                  {step.icon ? (
                    <SvgIcon name={step.icon} size={22} color="#FFF" />
                  ) : (
                    <span style={{ fontFamily: T.font, fontSize: 22, fontWeight: 800, color: "#FFF" }}>
                      {i + 1}
                    </span>
                  )}
                </div>
                {/* 연결선 */}
                {i < steps.length - 1 && (
                  <div style={{
                    width: 3, height: 70,
                    background: `linear-gradient(to bottom, ${P.accentBright}, transparent)`,
                    borderRadius: 2,
                    clipPath: `inset(0 0 ${100 - lineProgress}% 0)`,
                  }} />
                )}
              </div>
              {/* 콘텐츠 */}
              <div style={{
                opacity: labelOpacity,
                paddingBottom: 24,
              }}>
                <div style={{
                  fontFamily: T.font, fontSize: 38, fontWeight: 700,
                  color: T.textPrimary, lineHeight: 1.3,
                }}>
                  {step.label}
                </div>
                {step.desc && (
                  <div style={{
                    fontFamily: T.font, fontSize: 26, color: T.textSecondary,
                    marginTop: 8, lineHeight: 1.4,
                  }}>
                    {step.desc}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Horizontal
        return (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            flex: 1, position: "relative",
          }}>
            {/* 라벨 */}
            <div style={{
              opacity: labelOpacity,
              textAlign: "center",
              marginBottom: 12,
            }}>
              <div style={{
                fontFamily: T.font, fontSize: 20, fontWeight: 700,
                color: T.textPrimary, lineHeight: 1.3,
                wordBreak: "keep-all",
              }}>
                {step.label}
              </div>
              {step.desc && (
                <div style={{
                  fontFamily: T.font, fontSize: 15, color: T.textSecondary,
                  marginTop: 4,
                }}>
                  {step.desc}
                </div>
              )}
            </div>

            {/* 트랙 (점 + 라인) */}
            <div style={{
              display: "flex", alignItems: "center", width: "100%",
            }}>
              {/* 마일스톤 점 */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isActive
                  ? `linear-gradient(135deg, ${P.accent}, ${P.accentBright})`
                  : "rgba(255,255,255,0.08)",
                border: `2px solid ${isActive ? P.accentBright : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${dotScale})`,
                boxShadow: isActive ? `0 0 12px ${P.accentGlow}` : "none",
                flexShrink: 0,
                zIndex: 1,
              }}>
                <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: "#FFF" }}>
                  {i + 1}
                </span>
              </div>
              {/* 연결선 */}
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: `linear-gradient(to right, ${P.accentBright}, ${P.accentBright}40)`,
                  clipPath: `inset(0 ${100 - lineProgress}% 0 0)`,
                }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PieChart — 파이/도넛 차트
// data: { segments: [{ label, value, color? }], donut?, title? }
// ---------------------------------------------------------------------------
export const PieChartRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 30;
  const localFrame = Math.max(0, frame - enterAt);

  const segments: Array<{ label: string; value: number; color?: string }> = d.segments ?? [];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const donut = d.donut !== false;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const innerR = donut ? outerR * 0.55 : 0;

  const defaultColors = [P.accentBright, T.success, T.warning, T.info, P.accentDim, "#FF6B6B"];

  // 전체 리빌 진행률
  const revealProgress = interpolate(localFrame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 각 세그먼트의 arc path 생성
  let currentAngle = -Math.PI / 2; // 12시 방향부터

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      opacity,
      ...(node.style as React.CSSProperties),
    }}>
      {d.title && (
        <span style={{
          fontFamily: T.font, fontSize: 22, fontWeight: 600, color: T.textSecondary,
        }}>
          {d.title}
        </span>
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const angle = (seg.value / total) * Math.PI * 2 * revealProgress;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle = endAngle;

          const color = seg.color ?? defaultColors[i % defaultColors.length];

          // Arc path
          const x1 = cx + outerR * Math.cos(startAngle);
          const y1 = cy + outerR * Math.sin(startAngle);
          const x2 = cx + outerR * Math.cos(endAngle);
          const y2 = cy + outerR * Math.sin(endAngle);
          const largeArc = angle > Math.PI ? 1 : 0;

          let pathD: string;
          if (donut) {
            const ix1 = cx + innerR * Math.cos(startAngle);
            const iy1 = cy + innerR * Math.sin(startAngle);
            const ix2 = cx + innerR * Math.cos(endAngle);
            const iy2 = cy + innerR * Math.sin(endAngle);
            pathD = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
          } else {
            pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          }

          return (
            <path key={i} d={pathD} fill={color}
              stroke="rgba(0,0,0,0.3)" strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
            />
          );
        })}
      </svg>

      {/* 범례 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center",
      }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              backgroundColor: seg.color ?? defaultColors[i % defaultColors.length],
            }} />
            <span style={{ fontFamily: T.font, fontSize: 16, color: T.textSecondary }}>
              {seg.label}
            </span>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.textPrimary }}>
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
