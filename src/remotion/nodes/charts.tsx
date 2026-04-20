// Chart Nodes: ProgressBar, CompareBars, MiniBarChart
import React from "react";
import { interpolate, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { SvgIcon } from "../common/SvgIcons";

export const ProgressBarRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const value = d.value ?? 50;
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);
  const progress = Math.min(1, localFrame / dur) * value;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6, width: "80%", alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      {d.label && (
        <span style={{ fontFamily: T.font, fontSize: 19, color: T.textSecondary, textAlign: "center" }}>
          {d.label}
        </span>
      )}
      <div style={{
        width: "100%", height: 17, borderRadius: 10,
        backgroundColor: T.bgSurface, overflow: "hidden",
      }}>
        <div style={{
          width: `${progress}%`, height: "100%", borderRadius: 10,
          backgroundColor: P.accentBright,
          boxShadow: `0 0 8px ${P.accentGlow}`,
        }} />
      </div>
    </div>
  );
};

export const CompareBarsRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const items: Array<{ label: string; value: number; subtitle?: string; icon?: string }> = d.items ?? [];
  const unit = d.unit ?? "";
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  // stagger: 각 바가 순차적으로 등장
  const staggerDelay = 6; // 프레임 간격

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 40, width: "100%", maxWidth: node.layout?.maxWidth ?? 1200, alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      {items.map((item, i) => {
        const itemLocal = Math.max(0, localFrame - i * staggerDelay);
        const barProgress = Math.min(1, itemLocal / dur);
        const barWidth = (item.value / maxVal) * 100 * barProgress;

        // 행 등장 opacity
        const rowOpacity = interpolate(itemLocal, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        // 행 등장 Y 이동
        const rowTy = interpolate(itemLocal, [0, 10], [16, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: rowOpacity,
              transform: `translateY(${rowTy}px)`,
            }}
          >
            {/* 아이콘 원형 배지 */}
            {item.icon && (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: `2px solid ${P.accentBright}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <SvgIcon name={item.icon} size={22} color={P.accentBright} />
              </div>
            )}

            {/* 라벨 */}
            <span style={{
              fontFamily: T.font,
              fontSize: 28,
              fontWeight: 600,
              color: T.textPrimary,
              minWidth: 120,
              flexShrink: 0,
            }}>
              {item.label}
            </span>

            {/* 바 */}
            <div style={{
              flex: 1,
              height: 52,
              borderRadius: 26,
              backgroundColor: T.bgSurface,
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                width: `${barWidth}%`,
                height: "100%",
                borderRadius: 26,
                background: i === 0
                  ? `linear-gradient(90deg, ${P.accentBright}cc, ${P.accentBright})`
                  : `linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.35))`,
                boxShadow: i === 0
                  ? `0 0 12px ${P.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : "none",
                transition: "width 0.1s ease-out",
              }} />
            </div>

            {/* 숫자 값 */}
            <span style={{
              fontFamily: T.font,
              fontSize: 32,
              fontWeight: 700,
              minWidth: 70,
              textAlign: "right",
              color: T.textPrimary,
              flexShrink: 0,
            }}>
              {Math.round(item.value * barProgress)}{unit}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const MiniBarChartRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const items: Array<{ label: string; value: number }> = d.items ?? [];
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 15;
  const localFrame = Math.max(0, frame - enterAt);
  const progress = Math.min(1, localFrame / dur);

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-end", justifyContent: "center",
      height: 220, alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const barH = (item.value / maxVal) * 190 * progress;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 44, height: barH, borderRadius: 6,
              backgroundColor: isLast ? P.accentBright : T.textMuted,
            }} />
            <span style={{ fontFamily: T.font, fontSize: 18, color: T.textMuted }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};
