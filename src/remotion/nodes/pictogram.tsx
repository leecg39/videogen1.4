// Phase 2: Pictogram Nodes — WaffleChart, PictogramRow
// 비율/통계를 시각적으로 각인시키는 픽토그램 노드들
import React from "react";
import { interpolate, Easing, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { SvgIcon } from "../common/SvgIcons";

// ---------------------------------------------------------------------------
// WaffleChart — 10×10 격자로 비율 시각화
// data: { value (0-100), label?, filledColor?, emptyColor? }
// ---------------------------------------------------------------------------
export const WaffleChartRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 30;
  const localFrame = Math.max(0, frame - enterAt);

  const value = Math.min(100, Math.max(0, d.value ?? 73));
  const gridSize = d.gridSize ?? 10;
  const totalCells = gridSize * gridSize;
  const filledCount = Math.round((value / 100) * totalCells);

  const cellSize = d.cellSize ?? 28;
  const cellGap = 4;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      ...(node.style as React.CSSProperties),
    }}>
      {/* 격자 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gap: cellGap,
      }}>
        {Array.from({ length: totalCells }).map((_, i) => {
          const isFilled = i < filledCount;
          // 순차적 등장: 각 셀이 2프레임 간격으로 나타남
          const cellDelay = (i / totalCells) * dur * 0.8;
          const cellLocal = Math.max(0, localFrame - cellDelay);
          const cellScale = spring({
            frame: cellLocal,
            fps,
            config: { damping: 15, stiffness: 200, mass: 0.3 },
          });

          return (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 4,
                backgroundColor: isFilled
                  ? (d.filledColor ?? P.accentBright)
                  : (d.emptyColor ?? "rgba(255,255,255,0.06)"),
                transform: `scale(${cellScale})`,
                boxShadow: isFilled ? `0 0 6px ${P.accentGlow}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* 라벨 */}
      {d.label && (
        <div style={{
          display: "flex", alignItems: "baseline", gap: 8,
        }}>
          <span style={{
            fontFamily: T.font,
            fontSize: 48,
            fontWeight: 900,
            color: P.accentBright,
            textShadow: `0 0 20px ${P.accentGlow}`,
          }}>
            {value}%
          </span>
          <span style={{
            fontFamily: T.font,
            fontSize: 22,
            color: T.textSecondary,
          }}>
            {d.label}
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PictogramRow — 아이콘 반복으로 비율 표시 ("5명 중 1명")
// data: { total, highlighted, icon?, label?, highlightColor? }
// ---------------------------------------------------------------------------
export const PictogramRowRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const total = d.total ?? 10;
  const highlighted = d.highlighted ?? 3;
  const iconName = d.icon ?? "users";
  const iconSize = d.iconSize ?? 48;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      ...(node.style as React.CSSProperties),
    }}>
      {/* 아이콘 행 */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const isHighlighted = i < highlighted;
          const stagger = i * 3;
          const itemLocal = Math.max(0, localFrame - stagger);
          const itemScale = spring({
            frame: itemLocal,
            fps,
            config: { damping: 12, stiffness: 150, mass: 0.4 },
          });

          // 강조 아이콘 펄스 — 등장 후 살짝 커졌다 돌아옴
          const highlightPulse = isHighlighted && itemLocal > dur
            ? 1 + Math.sin(((itemLocal - dur) / 30) * Math.PI * 2) * 0.04
            : 1;

          return (
            <div
              key={i}
              style={{
                transform: `scale(${itemScale * highlightPulse})`,
                opacity: isHighlighted ? 1 : 0.25,
                filter: isHighlighted
                  ? `drop-shadow(0 0 8px ${d.highlightColor ?? P.accentGlow})`
                  : "none",
              }}
            >
              <SvgIcon
                name={iconName}
                size={iconSize}
                color={isHighlighted ? (d.highlightColor ?? P.accentBright) : T.textMuted}
              />
            </div>
          );
        })}
      </div>

      {/* 라벨 */}
      {d.label && (
        <span style={{
          fontFamily: T.font,
          fontSize: 24,
          fontWeight: 600,
          color: T.textSecondary,
          textAlign: "center",
        }}>
          <span style={{ color: P.accentBright, fontWeight: 800 }}>{highlighted}</span>
          {" / "}
          <span>{total}</span>
          {" "}
          {d.label}
        </span>
      )}
    </div>
  );
};
