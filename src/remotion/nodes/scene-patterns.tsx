// Phase 3: Scene Pattern Nodes — VersusLayout, SplitReveal, ProgressiveReveal, SpotlightOverlay, NumberCircle, CheckMark
// 씬 레벨 구조 변주 + 마이크로 강조 요소
import React from "react";
import { interpolate, spring, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { SvgIcon } from "../common/SvgIcons";

// ---------------------------------------------------------------------------
// NumberCircle — 원 안에 숫자 (순서/단계 표시)
// data: { number, label?, size?, filled? }
// ---------------------------------------------------------------------------
export const NumberCircleRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const localFrame = Math.max(0, frame - enterAt);

  const size = d.size ?? 100;
  const filled = d.filled !== false;

  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      transform: `scale(${scale})`,
      ...(node.style as React.CSSProperties),
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: filled
          ? `linear-gradient(135deg, ${P.accent}, ${P.accentBright})`
          : "transparent",
        border: filled ? "none" : `3px solid ${P.accentBright}`,
        boxShadow: `0 0 24px ${P.accentGlow}`,
      }}>
        <span style={{
          fontFamily: T.font,
          fontSize: size * 0.45,
          fontWeight: 900,
          color: filled ? "#FFFFFF" : P.accentBright,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {d.number ?? "1"}
        </span>
      </div>
      {d.label && (
        <span style={{
          fontFamily: T.font,
          fontSize: 20,
          fontWeight: 600,
          color: T.textSecondary,
          textAlign: "center",
          maxWidth: size * 2,
        }}>
          {d.label}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CheckMark — 체크 애니메이션 (완료/확인 표시)
// data: { label?, variant?: "success"|"accent", size? }
// ---------------------------------------------------------------------------
export const CheckMarkRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 15;
  const localFrame = Math.max(0, frame - enterAt);

  const size = d.size ?? 64;
  const isSuccess = d.variant === "success";
  const color = isSuccess ? T.success : P.accentBright;
  const glowColor = isSuccess ? T.successGlow : P.accentGlow;

  // 체크마크 stroke 드로잉
  const drawProgress = interpolate(localFrame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 원 테두리 드로잉
  const circleProgress = interpolate(localFrame, [0, dur * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const circlePerimeter = Math.PI * size;
  const checkPathLength = 50;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      ...(node.style as React.CSSProperties),
    }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{
        filter: `drop-shadow(0 0 12px ${glowColor})`,
      }}>
        {/* 원 */}
        <circle
          cx="32" cy="32" r="28"
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circlePerimeter}
          strokeDashoffset={circlePerimeter * (1 - circleProgress)}
          strokeLinecap="round"
        />
        {/* 배경 원 (채워짐) */}
        <circle
          cx="32" cy="32" r="28"
          fill={color}
          opacity={drawProgress * 0.15}
        />
        {/* 체크마크 */}
        <path
          d="M 20 32 L 28 40 L 44 24"
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={checkPathLength}
          strokeDashoffset={checkPathLength * (1 - drawProgress)}
        />
      </svg>
      {d.label && (
        <span style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 600,
          color: T.textPrimary,
          textAlign: "center",
        }}>
          {d.label}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// VersusCard — VS 비교 카드 (좌우 분할 비교)
// data: { leftLabel, rightLabel, leftIcon?, rightIcon?, leftValue?, rightValue? }
// ---------------------------------------------------------------------------
export const VersusCardRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 20;
  const localFrame = Math.max(0, frame - enterAt);

  const leftSlide = interpolate(localFrame, [0, dur], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const rightSlide = interpolate(localFrame, [0, dur], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const vsOpacity = interpolate(localFrame, [dur * 0.3, dur * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sideStyle = (isLeft: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: `1.5px solid rgba(255,255,255,0.12)`,
    transform: `translateX(${isLeft ? leftSlide : rightSlide}px)`,
    opacity,
  });

  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: 20, width: "100%", maxWidth: 900,
      ...(node.style as React.CSSProperties),
    }}>
      {/* Left */}
      <div style={sideStyle(true)}>
        {d.leftIcon && <SvgIcon name={d.leftIcon} size={48} color={T.warning} />}
        {d.leftValue && (
          <span style={{ fontFamily: T.font, fontSize: 28, fontWeight: 900, color: T.warning,
            textAlign: "center", wordBreak: "keep-all", overflowWrap: "break-word", lineHeight: 1.3,
          }}>
            {d.leftValue}
          </span>
        )}
        {d.leftLabel && (
          <span style={{
            fontFamily: T.font, fontSize: 26, fontWeight: 700, color: T.textPrimary,
            textAlign: "center", wordBreak: "keep-all",
          }}>
            {d.leftLabel}
          </span>
        )}
      </div>

      {/* VS 디바이더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: vsOpacity,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg, ${P.accent}, ${P.accentBright})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px ${P.accentGlow}`,
        }}>
          <span style={{
            fontFamily: T.font, fontSize: 20, fontWeight: 900, color: "#FFF",
            letterSpacing: "0.05em",
          }}>
            VS
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={sideStyle(false)}>
        {d.rightIcon && <SvgIcon name={d.rightIcon} size={48} color={P.accentBright} />}
        {d.rightValue && (
          <span style={{ fontFamily: T.font, fontSize: 28, fontWeight: 900, color: P.accentBright,
            textShadow: `0 0 20px ${P.accentGlow}`,
            textAlign: "center", wordBreak: "keep-all", overflowWrap: "break-word", lineHeight: 1.3,
          }}>
            {d.rightValue}
          </span>
        )}
        {d.rightLabel && (
          <span style={{
            fontFamily: T.font, fontSize: 26, fontWeight: 700, color: T.textPrimary,
            textAlign: "center", wordBreak: "keep-all",
          }}>
            {d.rightLabel}
          </span>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SplitRevealCard — Before/After 슬라이더 (하나의 카드 내에서)
// data: { beforeLabel, afterLabel, beforeItems[], afterItems[], dividerPosition? }
// ---------------------------------------------------------------------------
export const SplitRevealCardRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 25;
  const localFrame = Math.max(0, frame - enterAt);

  // 디바이더 애니메이션: 왼쪽에서 최종 위치로
  const dividerTarget = d.dividerPosition ?? 50;
  const dividerPos = interpolate(localFrame, [dur * 0.2, dur * 0.8], [5, dividerTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const beforeItems: string[] = d.beforeItems ?? [];
  const afterItems: string[] = d.afterItems ?? [];

  return (
    <div style={{
      display: "flex", width: "100%", maxWidth: 900,
      borderRadius: 16, overflow: "hidden",
      border: `1.5px solid rgba(255,255,255,0.12)`,
      background: "rgba(255,255,255,0.03)",
      opacity,
      ...(node.style as React.CSSProperties),
    }}>
      {/* Before 영역 */}
      <div style={{
        width: `${dividerPos}%`,
        padding: 24,
        display: "flex", flexDirection: "column", gap: 12,
        borderRight: `3px solid ${P.accentBright}`,
        boxShadow: `inset -4px 0 12px ${P.accentGlow}`,
      }}>
        <span style={{
          fontFamily: T.font, fontSize: 16, fontWeight: 700,
          color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {d.beforeLabel ?? "BEFORE"}
        </span>
        {beforeItems.map((item, i) => (
          <span key={i} style={{
            fontFamily: T.font, fontSize: 22, color: T.textSecondary,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "rgba(239,68,68,0.8)" }}>✕</span> {item}
          </span>
        ))}
      </div>

      {/* After 영역 */}
      <div style={{
        flex: 1,
        padding: 24,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <span style={{
          fontFamily: T.font, fontSize: 16, fontWeight: 700,
          color: P.accentBright, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {d.afterLabel ?? "AFTER"}
        </span>
        {afterItems.map((item, i) => (
          <span key={i} style={{
            fontFamily: T.font, fontSize: 22, color: T.textPrimary, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: P.accentBright }}>✓</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScaleComparison — 원 크기 비교로 규모 시각화
// data: { items: [{ label, value, icon? }], unit? }
// ---------------------------------------------------------------------------
export const ScaleComparisonRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const { fps } = useVideoConfig();
  const enterAt = node.motion?.enterAt ?? 0;
  const dur = node.motion?.duration ?? 25;
  const localFrame = Math.max(0, frame - enterAt);

  const items: Array<{ label: string; value: number; icon?: string }> = d.items ?? [];
  const maxVal = Math.max(...items.map(it => it.value), 1);
  const unit = d.unit ?? "";

  const maxRadius = 200;
  const minRadius = 50;

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 40,
      ...(node.style as React.CSSProperties),
    }}>
      {items.map((item, i) => {
        const ratio = item.value / maxVal;
        const radius = minRadius + (maxRadius - minRadius) * ratio;

        const stagger = i * 8;
        const itemLocal = Math.max(0, localFrame - stagger);
        const sc = spring({
          frame: itemLocal,
          fps,
          config: { damping: 10, stiffness: 120, mass: 0.6 },
        });

        const isMax = item.value === maxVal;

        return (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            transform: `scale(${sc})`,
          }}>
            <div style={{
              width: radius * 2,
              height: radius * 2,
              borderRadius: "50%",
              background: isMax
                ? `radial-gradient(circle, ${P.accentBright}30, ${P.accent}15)`
                : "rgba(255,255,255,0.04)",
              border: `2px solid ${isMax ? P.accentBright : "rgba(255,255,255,0.15)"}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              boxShadow: isMax ? `0 0 30px ${P.accentGlow}` : "none",
            }}>
              <span style={{
                fontFamily: T.font,
                fontSize: Math.max(18, radius * 0.4),
                fontWeight: 900,
                color: isMax ? P.accentBright : T.textPrimary,
              }}>
                {item.value}{unit}
              </span>
            </div>
            <span style={{
              fontFamily: T.font,
              fontSize: 26,
              fontWeight: 600,
              color: isMax ? P.accentBright : T.textSecondary,
              textAlign: "center",
              maxWidth: radius * 3,
            }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
