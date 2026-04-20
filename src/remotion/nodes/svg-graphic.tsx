// SvgGraphic Node — Claude가 직접 그린 커스텀 SVG를 렌더링
// data.elements[]에 SVG 요소(path, circle, rect, line, text 등)를 정의
// 씬 의미에 맞는 일러스트, 다이어그램, 개념 그래픽을 자유롭게 표현

import React from "react";
import { interpolate, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { useScenePalette } from "../common/theme";

// ---------------------------------------------------------------------------
// SVG Element Types
// ---------------------------------------------------------------------------

interface SvgElement {
  /** SVG 요소 유형 */
  tag: "path" | "circle" | "rect" | "line" | "ellipse" | "polygon" | "polyline" | "text" | "g";
  /** SVG 속성 (d, cx, cy, r, x, y, width, height, points 등) */
  attrs?: Record<string, string | number>;
  /** 스타일 오버라이드 */
  style?: React.CSSProperties;
  /** 텍스트 내용 (tag=text일 때) */
  text?: string;
  /** 자식 요소 (tag=g일 때 그룹핑) */
  children?: SvgElement[];
  /** stagger 애니메이션 순서 (0-based) */
  staggerIndex?: number;
  /** 테마 색상 참조: "accent" | "accentBright" | "accentGlow" | "text" | "muted" | "surface" */
  themeColor?: string;
}

// ---------------------------------------------------------------------------
// Theme color resolver
// ---------------------------------------------------------------------------

function resolveColor(
  themeColor: string | undefined,
  palette: ReturnType<typeof useScenePalette>,
  fallback: string,
): string {
  if (!themeColor) return fallback;
  const map: Record<string, string> = {
    accent: palette.accent,
    accentBright: palette.accentBright,
    accentGlow: palette.accentGlow,
    accentTint: palette.accentTint,
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.5)",
    surface: "rgba(255,255,255,0.08)",
  };
  return map[themeColor] ?? fallback;
}

// ---------------------------------------------------------------------------
// Recursive SVG element renderer
// ---------------------------------------------------------------------------

const RenderSvgElement: React.FC<{
  el: SvgElement;
  frame: number;
  enterAt: number;
  staggerDelay: number;
  palette: ReturnType<typeof useScenePalette>;
}> = ({ el, frame, enterAt, staggerDelay, palette }) => {
  // stagger 애니메이션
  const idx = el.staggerIndex ?? 0;
  const itemEnter = enterAt + idx * staggerDelay;
  const localFrame = Math.max(0, frame - itemEnter);
  const drawDuration = 18; // 그리기 애니메이션 길이 (프레임)

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Path/line/polyline: stroke-dashoffset 드로잉 애니메이션
  const drawProgress = interpolate(localFrame, [0, drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // rect/circle: 스케일 + 투명도 애니메이션
  const shapeScale = interpolate(localFrame, [0, 12], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });

  // fill이 명시적으로 지정된 경우 themeColor로 덮어쓰지 않음
  // themeColor는 fill이 없을 때만 fill에, 항상 stroke에 적용
  const explicitFill = el.attrs?.fill as string | undefined;
  const hasFillAttr = explicitFill !== undefined;
  const fillColor = el.themeColor && !hasFillAttr
    ? resolveColor(el.themeColor, palette, "none")
    : undefined;
  // stroke: themeColor가 있으면 항상 적용
  const strokeColor = el.themeColor
    ? resolveColor(el.themeColor, palette, el.attrs?.stroke as string ?? "none")
    : undefined;

  // path/line/polyline은 항상 stroke 적용 (fill이 아닌 stroke로 그리는 요소)
  const isStrokeElement = ['path', 'line', 'polyline'].includes(el.tag);
  const baseAttrs: Record<string, any> = {
    ...el.attrs,
    ...(fillColor && !isStrokeElement ? { fill: fillColor } : {}),
    ...(strokeColor ? { stroke: strokeColor } : {}),
    ...(isStrokeElement && !el.attrs?.fill ? { fill: "none" } : {}),
  };

  // Path/line: stroke-dasharray 드로잉 효과 + 글로우 트레일
  const strokeLen = 1200; // 충분히 긴 dash 길이
  const dashOffset = strokeLen * (1 - drawProgress);
  // 글로우 트레일: 드로잉 진행 중일 때 강렬한 네온 글로우
  const isDrawing = drawProgress > 0.01 && drawProgress < 0.95;
  // 진행 중반에 가장 밝고 시작/끝은 약하게 — 벨 커브
  const glowIntensity = isDrawing ? Math.sin(drawProgress * Math.PI) : 0;
  const trailGlow = glowIntensity > 0.05
    ? `drop-shadow(0 0 ${12 + glowIntensity * 24}px ${palette.accentBright}) drop-shadow(0 0 ${4 + glowIntensity * 12}px #fff) drop-shadow(0 0 ${20 + glowIntensity * 30}px ${palette.accent}80)`
    : undefined;
  const drawStyle: React.CSSProperties = {
    ...el.style,
    opacity,
    strokeDasharray: strokeLen,
    strokeDashoffset: dashOffset,
    filter: trailGlow,
  };

  // rect/circle: 스케일 팝 효과 (transform-origin: center)
  const cx = Number(baseAttrs.cx ?? (Number(baseAttrs.x ?? 0) + Number(baseAttrs.width ?? 0) / 2));
  const cy = Number(baseAttrs.cy ?? (Number(baseAttrs.y ?? 0) + Number(baseAttrs.height ?? 0) / 2));
  const shapeStyle = {
    ...el.style,
    opacity,
    transform: `translate(${cx}px, ${cy}px) scale(${shapeScale}) translate(${-cx}px, ${-cy}px)`,
  };

  // 텍스트: 단순 opacity + 살짝 위로
  const textY = interpolate(localFrame, [0, 10], [6, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const textStyle = {
    ...el.style,
    opacity,
    transform: `translateY(${textY}px)`,
  };

  switch (el.tag) {
    case "path":
      return <path {...baseAttrs} style={drawStyle} />;
    case "line":
      return <line {...baseAttrs} style={drawStyle} />;
    case "polyline":
      return <polyline {...baseAttrs} style={drawStyle} />;
    case "circle":
      return <circle {...baseAttrs} style={shapeStyle} />;
    case "rect":
      return <rect {...baseAttrs} style={shapeStyle} />;
    case "ellipse":
      return <ellipse {...baseAttrs} style={shapeStyle} />;
    case "polygon":
      return <polygon {...baseAttrs} style={shapeStyle} />;
    case "text": {
      const fontFam = "'Pretendard Variable', Pretendard, -apple-system, sans-serif";
      // text 요소는 fill이 없으면 기본 white (검정 배경에서 보이도록)
      if (!baseAttrs.fill) baseAttrs.fill = "#FFFFFF";
      const rawText = el.text ?? "";
      const fs = Number(el.attrs?.fontSize) || 16;
      // 한글 기준 대략 폭 계산: fontSize * 0.6 per char
      const maxCharsPerLine = el.attrs?.maxCharsPerLine
        ? Number(el.attrs.maxCharsPerLine)
        : undefined;

      // \n 또는 maxCharsPerLine 기준으로 줄 분할
      let lines: string[];
      if (rawText.includes("\n")) {
        lines = rawText.split("\n");
      } else if (maxCharsPerLine && rawText.length > maxCharsPerLine) {
        lines = [];
        for (let ci = 0; ci < rawText.length; ci += maxCharsPerLine) {
          lines.push(rawText.slice(ci, ci + maxCharsPerLine));
        }
      } else {
        lines = [rawText];
      }

      const textAttrs: Record<string, any> = { ...baseAttrs, style: textStyle };
      if (lines.length === 1) {
        return <text {...textAttrs} fontFamily={fontFam}>{lines[0]}</text>;
      }
      const baseY = Number(baseAttrs.y) || 0;
      const lineHeight = fs * 1.3;
      const startY = baseY - ((lines.length - 1) * lineHeight) / 2;
      return (
        <text {...textAttrs} fontFamily={fontFam} y={undefined}>
          {lines.map((line, li) => (
            <tspan
              key={li}
              x={baseAttrs.x}
              y={startY + li * lineHeight}
              textAnchor={baseAttrs.textAnchor}
            >
              {line}
            </tspan>
          ))}
        </text>
      );
    }
    case "g":
      return (
        <g {...baseAttrs} style={{ ...el.style, opacity }}>
          {(el.children ?? []).map((child, i) => (
            <RenderSvgElement
              key={i}
              el={child}
              frame={frame}
              enterAt={enterAt}
              staggerDelay={staggerDelay}
              palette={palette}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Main Renderer
// ---------------------------------------------------------------------------

export const SvgGraphicRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();

  // SVG 캔버스 설정
  const viewBox = d.viewBox ?? "0 0 400 300";
  const width = d.width ?? 400;
  const height = d.height ?? 300;
  const elements: SvgElement[] = d.elements ?? [];
  const staggerDelay = d.staggerDelay ?? 4;
  const glow = d.glow ?? false;

  const enterAt = node.motion?.enterAt ?? 0;

  // display: inline-block 로 SVG 자연 크기 보장 (flex 사용 시 축소 위험)
  return (
    <div
      style={{
        display: "inline-block",
        lineHeight: 0,
        filter: glow ? `drop-shadow(0 0 16px ${P.accentGlow})` : undefined,
        ...(node.style as React.CSSProperties),
      }}
    >
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {elements.map((el, i) => (
          <RenderSvgElement
            key={i}
            el={{ ...el, staggerIndex: el.staggerIndex ?? i }}
            frame={frame}
            enterAt={enterAt}
            staggerDelay={staggerDelay}
            palette={P}
          />
        ))}
      </svg>
    </div>
  );
};
