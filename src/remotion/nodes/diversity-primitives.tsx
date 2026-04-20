// diversity-primitives.tsx — 레퍼런스 60장 분석 기반 신규 프리미티브 5개
//
// 1. BrowserMockup    — SC 37~39 (브라우저 chrome + placeholder UI)
// 2. EmojiIconList    — SC 28, 41, 48 (이모지 + 라벨 행 스택)
// 3. BrandSatellite   — SC 26 (중앙 인물 + 주변 브랜드 pill)
// 4. VerticalBars     — SC 60 (수직 듀얼 바)
// 5. DiagonalFlow     — SC 42 (대각선 흐름 ↘)

import React from "react";
import type { NodeProps } from "@/types/stack-nodes";
import { useScenePalette } from "../common/theme";

// ---------------------------------------------------------------------------
// 1. BrowserMockup
// data: { title?, items?: [{label, block?}], showChrome?, accentColor? }
// ---------------------------------------------------------------------------

export const BrowserMockupRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const title = d.title ?? "Unlock Your Potential";
  const width = (d.width as number) ?? 480;
  const height = (d.height as number) ?? 340;

  return (
    <div
      style={{
        width,
        height,
        background: "#0D0C10",
        border: `1.5px solid ${P.accentBright}30`,
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Chrome */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
      </div>
      {/* Body */}
      <div style={{
        flex: 1,
        padding: "30px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 9px)",
      }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Unlock the Power of</div>
        <div style={{ fontSize: 22, color: "#FFF", fontWeight: 800 }}>{title}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 58, height: 58,
              border: "1.5px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 20, height: 20, background: "rgba(255,255,255,0.18)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 16,
          padding: "8px 28px",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 999,
          fontSize: 13, color: "rgba(255,255,255,0.55)",
        }}>
          Get Started Free
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. EmojiIconList
// data: { items: [{emoji, label, desc?, tone?}] }
// ---------------------------------------------------------------------------

export const EmojiIconListRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const items: Array<{ emoji: string; label: string; desc?: string; tone?: string }> =
    d.items ?? [];
  const iconSize = (d.iconSize as number) ?? 44;
  const gap = (d.gap as number) ?? 20;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap, alignItems: "flex-start",
    }}>
      {items.map((it, i) => {
        const color = it.tone === "accent" ? P.accentBright :
                      it.tone === "muted" ? "rgba(255,255,255,0.55)" :
                      "#FFFFFF";
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 18,
          }}>
            <div style={{
              width: iconSize + 16, height: iconSize + 16,
              borderRadius: "50%",
              border: `2px solid ${P.accentBright}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: iconSize,
              lineHeight: 1,
            }}>
              {it.emoji}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
                fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.01em" }}>
                {it.label}
              </span>
              {it.desc && (
                <span style={{ fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
                  fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>
                  {it.desc}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. BrandSatellite
// data: { center: {label, sub?}, satellites: [{label}], radius? }
// ---------------------------------------------------------------------------

export const BrandSatelliteRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const center = d.center ?? { label: "중앙", sub: null };
  const sats: Array<{ label: string }> = d.satellites ?? [];
  const radius = (d.radius as number) ?? 200;
  const centerSize = (d.centerSize as number) ?? 120;

  const count = sats.length;
  const angleStep = (2 * Math.PI) / Math.max(count, 1);
  // 12시 방향부터 시계방향
  const startAngle = -Math.PI / 2;

  const svgSize = radius * 2 + 200;

  return (
    <div style={{
      position: "relative",
      width: svgSize, height: svgSize,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Connection lines */}
      <svg style={{ position: "absolute", inset: 0 }} width={svgSize} height={svgSize}>
        {sats.map((_, i) => {
          const angle = startAngle + angleStep * i;
          const x = svgSize / 2 + Math.cos(angle) * radius;
          const y = svgSize / 2 + Math.sin(angle) * radius;
          return (
            <line
              key={i}
              x1={svgSize / 2} y1={svgSize / 2}
              x2={x} y2={y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {/* Center */}
      <div style={{
        position: "absolute", zIndex: 2,
        width: centerSize, height: centerSize, borderRadius: "50%",
        background: P.accentBright,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 40px ${P.accentGlow}`,
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
          fontSize: 28, fontWeight: 800, color: "#0D0C10", lineHeight: 1,
        }}>
          {center.label}
        </div>
        {center.sub && (
          <div style={{
            marginTop: 4,
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.6)",
          }}>
            {center.sub}
          </div>
        )}
      </div>

      {/* Satellites */}
      {sats.map((s, i) => {
        const angle = startAngle + angleStep * i;
        const x = svgSize / 2 + Math.cos(angle) * radius;
        const y = svgSize / 2 + Math.sin(angle) * radius;
        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            transform: "translate(-50%, -50%)",
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            fontSize: 22, fontWeight: 700, color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}>
            {s.label}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. VerticalBars
// data: { items: [{label, value, tone?, topLabel?}], maxValue?, height? }
// ---------------------------------------------------------------------------

export const VerticalBarsRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const items: Array<{ label: string; value: number; tone?: string; topLabel?: string }> =
    d.items ?? [];
  const maxValue = (d.maxValue as number) ?? 100;
  const h = (d.height as number) ?? 360;
  const barWidth = (d.barWidth as number) ?? 90;
  const gap = (d.gap as number) ?? 36;

  const toneColor = (t?: string) => {
    if (t === "accent") return P.accentBright;
    if (t === "danger") return "#EF4444";
    if (t === "warning") return "#FBBF24";
    if (t === "muted") return "rgba(255,255,255,0.3)";
    return "#FFFFFF";
  };

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap,
    }}>
      {items.map((it, i) => {
        const fillH = (it.value / maxValue) * h;
        const color = toneColor(it.tone);
        return (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            {it.topLabel && (
              <span style={{
                fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
                fontSize: 22, fontWeight: 800, color,
              }}>
                {it.topLabel}
              </span>
            )}
            <div style={{
              position: "relative",
              width: barWidth, height: h,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
            }}>
              <div style={{
                width: "100%", height: fillH,
                background: color,
                borderRadius: "0 0 8px 8px",
                boxShadow: it.tone === "accent" ? `0 0 24px ${P.accentGlow}` : "none",
              }} />
            </div>
            <span style={{
              fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
              fontSize: 22, fontWeight: 700, color: "#FFFFFF",
              marginTop: 4,
            }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. DiagonalFlow
// data: { from: {label, sub?}, to: {label, sub?}, accent? }
// ---------------------------------------------------------------------------

export const DiagonalFlowRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const from = d.from ?? { label: "FROM" };
  const to = d.to ?? { label: "TO" };
  const width = (d.width as number) ?? 800;
  const height = (d.height as number) ?? 400;

  return (
    <div style={{
      position: "relative",
      width, height,
    }}>
      {/* SVG arrow */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
           width={width} height={height}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10"
                  refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill={P.accentBright} />
          </marker>
        </defs>
        <path
          d={`M ${width * 0.25} ${height * 0.25} Q ${width * 0.5} ${height * 0.35} ${width * 0.75} ${height * 0.75}`}
          stroke={P.accentBright}
          strokeWidth={3}
          fill="none"
          strokeDasharray="6 6"
          markerEnd="url(#arrowhead)"
        />
      </svg>

      {/* From (top-left) */}
      <div style={{
        position: "absolute",
        left: `${width * 0.12}px`, top: `${height * 0.1}px`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <div style={{
          padding: "18px 28px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1.5px solid rgba(255,255,255,0.2)",
          fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
          fontSize: 32, fontWeight: 800, color: "#FFF",
        }}>
          {from.label}
        </div>
        {from.sub && (
          <span style={{
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.55)",
          }}>
            {from.sub}
          </span>
        )}
      </div>

      {/* To (bottom-right) */}
      <div style={{
        position: "absolute",
        right: `${width * 0.08}px`, bottom: `${height * 0.1}px`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <div style={{
          padding: "18px 28px",
          borderRadius: 16,
          background: P.accentBright,
          color: "#0D0C10",
          fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
          fontSize: 32, fontWeight: 900,
          boxShadow: `0 0 32px ${P.accentGlow}`,
        }}>
          {to.label}
        </div>
        {to.sub && (
          <span style={{
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            fontSize: 18, fontWeight: 500, color: P.accentBright,
          }}>
            {to.sub}
          </span>
        )}
      </div>
    </div>
  );
};
