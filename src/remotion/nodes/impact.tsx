// Phase 2: Impact Nodes — ImpactStat, AnimatedCounter, CalloutArrow
// 핵심 정보를 시청자 뇌에 각인시키는 임팩트 노드들
import React from "react";
import { interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { useTypography, roleToStyle } from "../common/typography";
import { SvgIcon } from "../common/SvgIcons";

// ---------------------------------------------------------------------------
// ImpactStat — 거대 숫자 + 얇은 언더라인 + 맥락 텍스트
// data: { value, suffix?, label?, underlineColor? }
// ---------------------------------------------------------------------------
export const ImpactStatRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const typo = useTypography();
  const statStyle = roleToStyle(typo, typo.roles.stat);
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  // 숫자 스프링
  const numScale = spring({
    frame: localFrame,
    fps,
    config: { damping: 7, stiffness: 200, mass: 0.5 },
  });

  // 언더라인 와이프
  const lineWidth = interpolate(localFrame, [dur * 0.4, dur], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 맥락 텍스트 페이드
  const labelOpacity = interpolate(localFrame, [dur * 0.6, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // size 프롭: "sm"(축소, 컨테이너 내부용) | 기본(xl, 화면 중앙용)
  const sizeMultiplier = d.size === "sm" ? 1.1 : d.size === "md" ? 1.5 : 1.87;
  // v1.1 round 4 버그1: user 가 data.fontSize 나 style.fontSize 로 override 시 존중.
  // Phase 5 진단: 5-A 씬에서 fontSize:220 지정해도 size prop 기반 계산값이 덮어썼음.
  const styleFontSize = (node.style as React.CSSProperties | undefined)?.fontSize;
  const userFontSize = typeof d.fontSize === "number"
    ? d.fontSize
    : typeof styleFontSize === "number"
    ? styleFontSize
    : null;
  const valueFontSize = userFontSize ?? Math.round(typo.roles.stat.fontSize * sizeMultiplier);
  const suffixFontSize = Math.round(valueFontSize * 0.45);
  const valueText = String(d.value ?? "0");
  // 긴 값 자동 축소: 5자 초과 시 추가 30% 축소 (user fontSize 지정 시 skip — 의도 존중)
  const lengthScale = userFontSize == null && valueText.length > 5 ? 0.7 : 1;
  const finalValueSize = Math.round(valueFontSize * lengthScale);
  const finalSuffixSize = Math.round(suffixFontSize * lengthScale);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      maxWidth: "100%",
      ...(node.style as React.CSSProperties),
    }}>
      {/* 거대 숫자 */}
      <div style={{
        display: "flex", alignItems: "baseline", flexWrap: "nowrap",
        justifyContent: "center",
        transform: `scale(${numScale})`,
        transformOrigin: "center bottom",
        maxWidth: "100%",
      }}>
        <span style={{
          ...statStyle,
          fontSize: finalValueSize,
          color: T.textPrimary,
          lineHeight: 0.9,
          textShadow: `0 0 60px ${P.accentGlow}, 0 4px 20px rgba(0,0,0,0.5)`,
          whiteSpace: "nowrap",
        }}>
          {valueText}
        </span>
        {d.suffix && (
          <span style={{
            fontFamily: typo.headingFont,
            fontSize: finalSuffixSize,
            fontWeight: 700,
            color: P.accentBright,
            marginLeft: 6,
            whiteSpace: "nowrap",
          }}>
            {d.suffix}
          </span>
        )}
      </div>

      {/* 얇은 언더라인 */}
      <div style={{
        width: `${lineWidth}%`,
        maxWidth: 300,
        height: 3,
        borderRadius: 2,
        background: `linear-gradient(90deg, transparent, ${d.underlineColor ?? P.accentBright}, transparent)`,
        boxShadow: `0 0 12px ${P.accentGlow}`,
      }} />

      {/* 맥락 텍스트 */}
      {d.label && (
        <span style={{
          ...roleToStyle(typo, typo.roles.caption),
          color: T.textSecondary,
          opacity: labelOpacity,
          textAlign: "center",
          letterSpacing: "0.05em",
        }}>
          {d.label}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// AnimatedCounter — 오도미터처럼 롤링하는 숫자 카운터
// data: { from?, to, suffix?, label?, decimals? }
// ---------------------------------------------------------------------------
export const AnimatedCounterRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 30;
  const localFrame = Math.max(0, frame - enterAt);

  const from = d.from ?? 0;
  const to = d.to ?? 100;
  const decimals = d.decimals ?? 0;

  const progress = interpolate(localFrame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const currentValue = from + (to - from) * progress;
  const displayValue = currentValue.toFixed(decimals);

  // 마지막 자릿수 완료 시 살짝 바운스
  const opacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      opacity,
      ...(node.style as React.CSSProperties),
    }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{
          fontFamily: "'Pretendard Variable', monospace",
          fontSize: d.fontSize ?? 120,
          fontWeight: 900,
          color: T.textPrimary,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textShadow: `0 0 40px ${P.accentGlow}, 0 4px 16px rgba(0,0,0,0.4)`,
          fontVariantNumeric: "tabular-nums",
        }}>
          {displayValue}
        </span>
        {d.suffix && (
          <span style={{
            fontFamily: T.font,
            fontSize: (d.fontSize ?? 120) * 0.35,
            fontWeight: 700,
            color: P.accentVivid,
            marginLeft: 6,
          }}>
            {d.suffix}
          </span>
        )}
      </div>
      {d.label && (
        <span style={{
          fontFamily: T.font,
          fontSize: 22,
          color: T.textSecondary,
          textAlign: "center",
        }}>
          {d.label}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CalloutArrow — 손그림 스타일 화살표 + 주석 텍스트
// data: { text, direction?: "right"|"left"|"up"|"down", curveIntensity? }
// ---------------------------------------------------------------------------
export const CalloutArrowRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const drawProgress = interpolate(localFrame, [0, dur * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const textOpacity = interpolate(localFrame, [dur * 0.5, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dir = d.direction ?? "right";
  const curve = d.curveIntensity ?? 30;

  // 방향별 SVG path
  const paths: Record<string, string> = {
    right: `M 10,50 C ${10 + curve},${50 - curve} ${90 - curve},${50 - curve} 90,50`,
    left: `M 90,50 C ${90 - curve},${50 - curve} ${10 + curve},${50 - curve} 10,50`,
    up: `M 50,90 C ${50 - curve},${90 - curve} ${50 - curve},${10 + curve} 50,10`,
    down: `M 50,10 C ${50 + curve},${10 + curve} ${50 + curve},${90 - curve} 50,90`,
  };

  // 화살표 머리 위치
  const arrowHeads: Record<string, { x: number; y: number; angle: number }> = {
    right: { x: 90, y: 50, angle: 0 },
    left: { x: 10, y: 50, angle: 180 },
    up: { x: 50, y: 10, angle: -90 },
    down: { x: 50, y: 90, angle: 90 },
  };

  const pathD = paths[dir] ?? paths.right;
  const head = arrowHeads[dir] ?? arrowHeads.right;

  // stroke-dasharray 기반 드로잉 애니메이션
  const pathLength = 200;
  const dashOffset = pathLength * (1 - drawProgress);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      ...(node.style as React.CSSProperties),
    }}>
      <svg width="160" height="100" viewBox="0 0 100 100" style={{ overflow: "visible" }}>
        {/* 커브 라인 */}
        <path
          d={pathD}
          fill="none"
          stroke={P.accentBright}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 4px ${P.accentGlow})` }}
        />
        {/* 화살표 머리 */}
        {drawProgress > 0.5 && (
          <polygon
            points="-6,-4 0,0 -6,4"
            fill={P.accentBright}
            transform={`translate(${head.x}, ${head.y}) rotate(${head.angle})`}
            opacity={interpolate(drawProgress, [0.5, 0.8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        )}
      </svg>
      {/* 주석 텍스트 */}
      {d.text && (
        <span style={{
          fontFamily: T.font,
          fontSize: 30,
          fontWeight: 600,
          color: P.accentBright,
          opacity: textOpacity,
          textAlign: "center",
          textShadow: `0 0 8px ${P.accentGlow}`,
        }}>
          {d.text}
        </span>
      )}
    </div>
  );
};
