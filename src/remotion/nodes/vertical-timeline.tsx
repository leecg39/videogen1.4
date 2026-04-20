// vertical-timeline.tsx — 시간성 강조 전용 수직 타임라인
//
// Phase 5 진단 (2026-04-17) 에서 식별된 P0 신규 노드.
// 5-C "2018 → 2026" narrative 같은 시간 경과 표현에 특화.
// 기존 AnimatedTimeline(direction:"vertical") 은 마일스톤 프로세스용 — year 라벨 없음.
// VerticalTimeline 은 year 중심 + dot + label/desc 우측 배치.
//
// data: {
//   steps: [{ year: string, label: string, desc?: string, accent?: boolean }],
//   stepEnterAts?: number[],       // 자막 싱크용 절대 프레임
//   align?: "left" | "right",      // year 위치 (기본 left)
//   lineStyle?: "solid" | "dashed",
//   dotSize?: number,              // 기본 28
//   yearSize?: number,             // 기본 42
// }

import React from "react";
import { interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";

type Step = {
  year?: string;
  label: string;
  desc?: string;
  accent?: boolean;
  enterAt?: number;
};

export const VerticalTimelineRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 40;
  const localFrame = Math.max(0, frame - enterAt);

  const steps: Step[] = d.steps ?? [];
  const stepEnterAts: number[] | undefined = d.stepEnterAts;
  const align: "left" | "right" = d.align === "right" ? "right" : "left";
  const lineDashed = d.lineStyle === "dashed";
  const dotSize: number = d.dotSize ?? 28;
  const yearSize: number = d.yearSize ?? 42;
  const lineGap = 20;
  const lineWidth = 2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 0,
        maxWidth: 760,
        width: "100%",
        ...(node.style as React.CSSProperties),
      }}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const absoluteEnter = step.enterAt ?? stepEnterAts?.[i];
        const stepDelay =
          absoluteEnter != null
            ? Math.max(0, absoluteEnter - enterAt)
            : (i / Math.max(1, steps.length)) * dur * 0.65;
        const stepLocal = Math.max(0, localFrame - stepDelay);

        const dotScale = spring({
          frame: stepLocal,
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.4 },
        });
        const opacity = interpolate(stepLocal, [2, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const lineProgress = interpolate(stepLocal, [8, 24], [0, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const isActive = stepLocal > 0;
        const accent = step.accent ?? (i === steps.length - 1);

        const yearColor = accent ? P.accentBright : T.textSecondary;
        const dotFill = isActive
          ? accent
            ? `linear-gradient(135deg, ${P.accent}, ${P.accentBright})`
            : P.accentBright
          : "rgba(255,255,255,0.12)";
        const dotBorder = isActive ? P.accentBright : "rgba(255,255,255,0.18)";
        const dotGlow = accent && isActive ? `0 0 24px ${P.accentGlow}` : "none";

        // year / content 순서 (align 에 따라 좌우)
        const yearEl = step.year ? (
          <div
            style={{
              flex: "0 0 140px",
              textAlign: align === "left" ? "right" : "left",
              fontFamily: T.font,
              fontSize: yearSize,
              fontWeight: 800,
              color: yearColor,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              opacity,
            }}
          >
            {step.year}
          </div>
        ) : null;

        const contentEl = (
          <div
            style={{
              flex: 1,
              textAlign: "left",
              opacity,
              transform: `translateX(${interpolate(stepLocal, [2, 14], [align === "left" ? 12 : -12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 28,
                fontWeight: 700,
                color: T.textPrimary,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {step.label}
            </div>
            {step.desc && (
              <div
                style={{
                  marginTop: 6,
                  fontFamily: T.font,
                  fontSize: 18,
                  fontWeight: 400,
                  color: T.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {step.desc}
              </div>
            )}
          </div>
        );

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 24,
            }}
          >
            {align === "left" && yearEl}

            {/* dot + line column */}
            <div
              style={{
                flex: `0 0 ${dotSize}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                alignSelf: "stretch",
              }}
            >
              {/* dot */}
              <div
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: dotFill,
                  border: `2px solid ${dotBorder}`,
                  transform: `scale(${dotScale})`,
                  boxShadow: dotGlow,
                  flexShrink: 0,
                }}
              />
              {/* connecting line */}
              {!isLast && (
                <div
                  style={{
                    width: lineWidth,
                    flex: 1,
                    minHeight: 40,
                    marginTop: lineGap * 0.4,
                    marginBottom: lineGap * 0.4,
                    background: lineDashed
                      ? `repeating-linear-gradient(to bottom, ${P.accent}, ${P.accent} 4px, transparent 4px, transparent 8px)`
                      : `linear-gradient(to bottom, ${P.accentBright}, ${P.accent})`,
                    opacity: (lineProgress / 100) * 0.85,
                  }}
                />
              )}
            </div>

            {align === "right" && yearEl}

            {contentEl}
          </div>
        );
      })}
    </div>
  );
};
