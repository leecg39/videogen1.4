// Diagram Nodes v2: VennDiagram, FunnelDiagram, PyramidDiagram, MatrixQuadrant
// 미니멀 SVG 기반 도식화 — 다크 테마 + 네온 악센트

import React from "react";
import { interpolate, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function staggerOpacity(localFrame: number, index: number, delay: number, dur: number): number {
  const f = Math.max(0, localFrame - index * delay);
  return interpolate(f, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function staggerScale(localFrame: number, index: number, delay: number, dur: number): number {
  const f = Math.max(0, localFrame - index * delay);
  return interpolate(f, [0, dur], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });
}

// ---------------------------------------------------------------------------
// VennDiagram
// 2~3개 집합의 교집합/차이를 보여주는 벤 다이어그램
// data: { sets: [{ label, color? }], intersectionLabel? }
// ---------------------------------------------------------------------------

export const VennDiagramRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const sets: Array<{ label: string; color?: string }> = d.sets ?? [
    { label: "A" },
    { label: "B" },
  ];
  const intersectionLabel: string = d.intersectionLabel ?? "";
  const count = Math.min(3, sets.length);

  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const W = 420;
  const H = 300;
  const R = count === 2 ? 100 : 85;
  const OFFSET = count === 2 ? 65 : 55;

  // 원 위치 계산
  const positions = count === 2
    ? [
        { cx: W / 2 - OFFSET, cy: H / 2 },
        { cx: W / 2 + OFFSET, cy: H / 2 },
      ]
    : [
        { cx: W / 2, cy: H / 2 - OFFSET * 0.7 },
        { cx: W / 2 - OFFSET, cy: H / 2 + OFFSET * 0.5 },
        { cx: W / 2 + OFFSET, cy: H / 2 + OFFSET * 0.5 },
      ];

  const COLORS = [P.accentBright, "#E040FB", "#7C4DFF"];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          {positions.map((_, i) => (
            <radialGradient key={`g-${i}`} id={`venn-g-${i}`}>
              <stop offset="0%" stopColor={sets[i]?.color ?? COLORS[i % COLORS.length]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={sets[i]?.color ?? COLORS[i % COLORS.length]} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>

        {/* 원 */}
        {positions.map((pos, i) => {
          const op = staggerOpacity(localFrame, i, 6, dur);
          const sc = staggerScale(localFrame, i, 6, dur);
          return (
            <g key={i} style={{ opacity: op }}>
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={R * sc}
                fill={`url(#venn-g-${i})`}
                stroke={sets[i]?.color ?? COLORS[i % COLORS.length]}
                strokeWidth={2}
                strokeOpacity={0.6}
              />
              {/* 라벨 — 원의 바깥쪽 방향 */}
              <text
                x={pos.cx + (pos.cx - W / 2) * 0.5}
                y={pos.cy + (pos.cy - H / 2) * 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={sets[i]?.color ?? COLORS[i % COLORS.length]}
                fontFamily={T.font}
                fontSize={16}
                fontWeight={700}
                style={{ opacity: op }}
              >
                {sets[i]?.label ?? ""}
              </text>
            </g>
          );
        })}

        {/* 교집합 라벨 */}
        {intersectionLabel && (
          <text
            x={W / 2}
            y={count === 2 ? H / 2 : H / 2 + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontFamily={T.font}
            fontSize={14}
            fontWeight={600}
            style={{ opacity: staggerOpacity(localFrame, count, 6, dur) }}
          >
            {intersectionLabel}
          </text>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FunnelDiagram
// 단계별 축소 퍼널 — 전환/파이프라인 시각화
// data: { stages: [{ label, value?, subtitle? }] }
// ---------------------------------------------------------------------------

export const FunnelDiagramRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const stages: Array<{ label: string; value?: number; subtitle?: string }> = d.stages ?? [
    { label: "Stage 1" },
    { label: "Stage 2" },
    { label: "Stage 3" },
  ];
  const count = stages.length;

  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const W = 500;
  const stageH = 52;
  const GAP = 6;
  const H = count * stageH + (count - 1) * GAP + 20;
  const minWidth = 120;
  const maxWidth = W - 40;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {stages.map((stage, i) => {
          const op = staggerOpacity(localFrame, i, 5, dur);
          const ratio = 1 - (i / Math.max(1, count - 1)) * 0.6;
          const w = minWidth + (maxWidth - minWidth) * ratio;
          const x = (W - w) / 2;
          const y = 10 + i * (stageH + GAP);
          const brightness = 1 - i * 0.12;

          return (
            <g key={i} style={{ opacity: op }}>
              {/* 사다리꼴 (trapezoid) */}
              <rect
                x={x}
                y={y}
                width={w}
                height={stageH}
                rx={10}
                fill={P.accentBright}
                fillOpacity={0.12 + brightness * 0.15}
                stroke={P.accentBright}
                strokeWidth={1.5}
                strokeOpacity={0.3 + brightness * 0.3}
              />
              {/* 라벨 */}
              <text
                x={W / 2}
                y={y + stageH / 2 - (stage.subtitle ? 6 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontFamily={T.font}
                fontSize={17}
                fontWeight={700}
              >
                {stage.label}
              </text>
              {stage.subtitle && (
                <text
                  x={W / 2}
                  y={y + stageH / 2 + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={T.textMuted}
                  fontFamily={T.font}
                  fontSize={12}
                >
                  {stage.subtitle}
                </text>
              )}
              {/* 값 (오른쪽) */}
              {stage.value != null && (
                <text
                  x={x + w - 16}
                  y={y + stageH / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={P.accentBright}
                  fontFamily={T.font}
                  fontSize={15}
                  fontWeight={700}
                >
                  {stage.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PyramidDiagram
// 계층/우선순위 피라미드
// data: { layers: [{ label, description? }] }  — 위(꼭대기)부터 아래 순서
// ---------------------------------------------------------------------------

export const PyramidDiagramRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const layers: Array<{ label: string; description?: string }> = d.layers ?? [
    { label: "Top" },
    { label: "Middle" },
    { label: "Bottom" },
  ];
  const count = layers.length;

  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const W = 460;
  const H = 340;
  const PY_TOP = 20;
  const PY_BOTTOM = H - 20;
  const PY_HEIGHT = PY_BOTTOM - PY_TOP;
  const layerH = PY_HEIGHT / count;

  // 피라미드 너비 비율: 꼭대기 좁고 아래 넓음
  const topWidth = 60;
  const bottomWidth = W - 60;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {layers.map((layer, i) => {
          // 아래부터 등장 (역순 stagger)
          const op = staggerOpacity(localFrame, count - 1 - i, 5, dur);

          const y1 = PY_TOP + i * layerH;
          const y2 = PY_TOP + (i + 1) * layerH;
          const ratio1 = i / count;
          const ratio2 = (i + 1) / count;
          const w1 = topWidth + (bottomWidth - topWidth) * ratio1;
          const w2 = topWidth + (bottomWidth - topWidth) * ratio2;
          const x1L = (W - w1) / 2;
          const x1R = (W + w1) / 2;
          const x2L = (W - w2) / 2;
          const x2R = (W + w2) / 2;

          const brightness = 0.8 - i * 0.1;
          const midY = (y1 + y2) / 2;

          return (
            <g key={i} style={{ opacity: op }}>
              {/* 사다리꼴 레이어 */}
              <path
                d={`M${x1L},${y1} L${x1R},${y1} L${x2R},${y2} L${x2L},${y2} Z`}
                fill={P.accentBright}
                fillOpacity={0.08 + brightness * 0.18}
                stroke={P.accentBright}
                strokeWidth={1.2}
                strokeOpacity={0.25 + brightness * 0.25}
              />
              {/* 라벨 */}
              <text
                x={W / 2}
                y={midY - (layer.description ? 7 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontFamily={T.font}
                fontSize={i === 0 ? 18 : 16}
                fontWeight={i === 0 ? 800 : 600}
              >
                {layer.label}
              </text>
              {layer.description && (
                <text
                  x={W / 2}
                  y={midY + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={T.textMuted}
                  fontFamily={T.font}
                  fontSize={12}
                >
                  {layer.description}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MatrixQuadrant
// 2x2 매트릭스 (4분면) — 분류/의사결정 프레임워크
// data: { xAxis: { low, high }, yAxis: { low, high },
//         quadrants: [{ label, items?, icon? }]  — TL, TR, BL, BR 순서 }
// ---------------------------------------------------------------------------

export const MatrixQuadrantRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const xAxis = d.xAxis ?? { low: "", high: "" };
  const yAxis = d.yAxis ?? { low: "", high: "" };
  const quadrants: Array<{ label: string; items?: string[]; icon?: string; highlight?: boolean }> =
    d.quadrants ?? [
      { label: "Q1" },
      { label: "Q2" },
      { label: "Q3" },
      { label: "Q4" },
    ];

  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const W = 480;
  const H = 380;
  const PAD = 50;
  const INNER_W = W - PAD * 2;
  const INNER_H = H - PAD * 2;
  const HALF_W = INNER_W / 2;
  const HALF_H = INNER_H / 2;
  const GAP = 6;

  // 축 등장
  const axisOp = staggerOpacity(localFrame, 0, 0, 10);

  // 사분면 위치: TL, TR, BL, BR
  const qPositions = [
    { x: PAD, y: PAD },
    { x: PAD + HALF_W + GAP, y: PAD },
    { x: PAD, y: PAD + HALF_H + GAP },
    { x: PAD + HALF_W + GAP, y: PAD + HALF_H + GAP },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center",
      ...(node.style as React.CSSProperties),
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* 축 라인 */}
        <g style={{ opacity: axisOp }}>
          {/* 수직 축 */}
          <line
            x1={W / 2} y1={PAD - 10} x2={W / 2} y2={H - PAD + 10}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
          />
          {/* 수평 축 */}
          <line
            x1={PAD - 10} y1={H / 2} x2={W - PAD + 10} y2={H / 2}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
          />
          {/* X축 라벨 */}
          {xAxis.low && (
            <text x={PAD} y={H / 2 + 20} fill={T.textMuted} fontFamily={T.font} fontSize={11} textAnchor="start">
              {xAxis.low}
            </text>
          )}
          {xAxis.high && (
            <text x={W - PAD} y={H / 2 + 20} fill={T.textMuted} fontFamily={T.font} fontSize={11} textAnchor="end">
              {xAxis.high}
            </text>
          )}
          {/* Y축 라벨 */}
          {yAxis.high && (
            <text x={PAD - 8} y={PAD} fill={T.textMuted} fontFamily={T.font} fontSize={11} textAnchor="end" dominantBaseline="middle">
              {yAxis.high}
            </text>
          )}
          {yAxis.low && (
            <text x={PAD - 8} y={H - PAD} fill={T.textMuted} fontFamily={T.font} fontSize={11} textAnchor="end" dominantBaseline="middle">
              {yAxis.low}
            </text>
          )}
        </g>

        {/* 4분면 */}
        {quadrants.slice(0, 4).map((q, i) => {
          const op = staggerOpacity(localFrame, i + 1, 5, dur);
          const pos = qPositions[i];
          const qW = HALF_W - GAP;
          const qH = HALF_H - GAP;
          const isHighlight = q.highlight ?? false;

          return (
            <g key={i} style={{ opacity: op }}>
              {/* 배경 */}
              <rect
                x={pos.x}
                y={pos.y}
                width={qW}
                height={qH}
                rx={12}
                fill={isHighlight ? P.accentBright : "rgba(255,255,255,0.04)"}
                fillOpacity={isHighlight ? 0.15 : 1}
                stroke={isHighlight ? P.accentBright : "rgba(255,255,255,0.1)"}
                strokeWidth={isHighlight ? 2 : 1}
              />
              {/* 라벨 */}
              <text
                x={pos.x + qW / 2}
                y={pos.y + qH / 2 - (q.items?.length ? 10 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHighlight ? P.accentBright : "#FFFFFF"}
                fontFamily={T.font}
                fontSize={15}
                fontWeight={isHighlight ? 800 : 600}
              >
                {q.label}
              </text>
              {/* 아이템 리스트 */}
              {q.items?.slice(0, 3).map((item, j) => (
                <text
                  key={j}
                  x={pos.x + qW / 2}
                  y={pos.y + qH / 2 + 10 + j * 16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={T.textMuted}
                  fontFamily={T.font}
                  fontSize={11}
                >
                  {item}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
