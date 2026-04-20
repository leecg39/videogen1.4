// SvgAsset — SVG Forge 라이브러리 참조 노드
// data: {
//   asset_id:    string                // public/svg-library/index.json 의 id
//   size?:       number                // 픽셀 (기본 120)
//   tint?:       "accent"|"white"|"muted"|"accentBright"
//   drawMode?:   boolean               // true 면 stroke-dasharray 드로잉 애니메이션
//   drawDuration?: number              // 기본 20 (프레임)
//   strokeWidth?: number               // 렌더 시 stroke-width 오버라이드
// }
//
// 라이브러리 컴파일 산출물: src/remotion/svg-library.generated.tsx
// 로드 실패 시 accent ring + "ID" 텍스트로 명시적 fallback (silent fail 금지).

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { useScenePalette } from "../common/theme";
import { SVG_LIBRARY } from "../svg-library.generated";

function resolveTint(
  tint: string | undefined,
  palette: ReturnType<typeof useScenePalette>,
): string {
  switch (tint) {
    case "white": return "#FFFFFF";
    case "muted": return "rgba(255,255,255,0.55)";
    case "accentBright": return palette.accentBright;
    case "accent":
    default:
      return palette.accent;
  }
}

export const SvgAssetRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const assetId = String(d.asset_id ?? d.id ?? "");
  const size = Number(d.size ?? 120);
  const palette = useScenePalette();
  const color = resolveTint(d.tint as string | undefined, palette);
  const frame = useCurrentFrame();
  const enterAt = Number(node.motion?.enterAt ?? 0);
  const drawMode = Boolean(d.drawMode);
  const drawDuration = Number(d.drawDuration ?? 20);
  const strokeWidth = Number(d.strokeWidth ?? 3.5);

  const Asset = SVG_LIBRARY[assetId];

  if (!Asset) {
    return (
      <div
        title={`missing svg-library asset: ${assetId}`}
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: palette.accent,
          border: `2px dashed ${palette.accent}`,
          borderRadius: 12,
          fontFamily: "'Pretendard Variable', sans-serif",
          fontSize: Math.max(12, size / 8),
          fontWeight: 600,
          boxSizing: "border-box",
        }}
      >
        {assetId || "?"}
      </div>
    );
  }

  const local = Math.max(0, frame - enterAt);
  const draw = drawMode
    ? interpolate(local, [0, drawDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 1;

  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const strokeLen = 1200;
  const dashOffset = strokeLen * (1 - draw);

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    color,
    opacity,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    // drawMode 에서 dasharray 적용을 위해 children 전체에 CSS 변수 전달
    ["--svg-forge-stroke-len" as string]: strokeLen,
    ["--svg-forge-dash-offset" as string]: dashOffset,
  };

  // drawMode 활성화 시 하위 stroke 요소 전체에 dasharray 적용
  const drawClass = drawMode ? "svg-forge-drawing" : undefined;

  return (
    <div style={wrapperStyle} className={drawClass}>
      <style>{`
        .svg-forge-drawing path,
        .svg-forge-drawing line,
        .svg-forge-drawing polyline,
        .svg-forge-drawing circle,
        .svg-forge-drawing rect,
        .svg-forge-drawing polygon,
        .svg-forge-drawing ellipse {
          stroke-dasharray: var(--svg-forge-stroke-len);
          stroke-dashoffset: var(--svg-forge-dash-offset);
        }
      `}</style>
      <Asset strokeWidth={strokeWidth} />
    </div>
  );
};
