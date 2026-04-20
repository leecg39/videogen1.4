// StackRenderer - 재귀적 스택 노드 트리 렌더러
// enterAt 기반 개별 애니메이션 타이밍

import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import type { StackNode, LayoutProps } from "@/types/stack-nodes";
import { NODE_REGISTRY, CONTAINER_TYPES } from "../nodes/registry";
import type { MotionPreset } from "./MotionWrapper";
import { SceneThemeContext, getPaletteForScene, useScenePalette } from "./theme";
import { ScatterLayoutRenderer } from "../nodes/ScatterLayout";

interface StackRendererProps {
  node: StackNode;
  frame: number;
  durationFrames: number;
  subtitles?: Array<{ startTime: number; endTime: number; text: string }>;
  sceneStartSec?: number;
  nodeIndex?: number;
  totalSiblings?: number;
  sceneIndex?: number;
  /** 부모 노드 타입 (SceneRoot 직계 자식 판별용) */
  parentType?: string;
}

// ---------------------------------------------------------------------------
// Motion: enterAt 기반 개별 애니메이션
// ---------------------------------------------------------------------------

function computeMotionStyle(
  preset: string,
  localFrame: number,
  duration: number,
  fps: number,
): React.CSSProperties {
  const d = Math.max(duration, 1);
  const ease = { easing: Easing.out(Easing.cubic) };
  const clampOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    ...ease,
  };

  switch (preset) {
    case "fadeUp": {
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      const ty = interpolate(localFrame, [0, d], [24, 0], clampOpts);
      return { opacity, transform: `translateY(${ty}px)` };
    }
    case "popNumber":
    case "popBadge": {
      const scale = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 120, mass: 0.8 },
      });
      const opacity = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        ...ease,
      });
      return { opacity, transform: `scale(${scale})` };
    }
    case "staggerChildren":
    case "fadeIn": {
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity };
    }
    case "drawConnector":
    case "wipeBar": {
      const progress = spring({
        frame: localFrame,
        fps,
        config: { damping: 15, stiffness: 80, mass: 0.6 },
      });
      const opacity = interpolate(localFrame, [0, Math.min(d, 8)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return {
        transform: `scaleX(${progress})`,
        transformOrigin: "left center",
        opacity,
      };
    }
    case "slideSplit": {
      const tx = interpolate(localFrame, [0, d], [-40, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `translateX(${tx}px)` };
    }
    case "slideRight": {
      const tx = interpolate(localFrame, [0, d], [40, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `translateX(${tx}px)` };
    }
    case "revealMask": {
      const clip = interpolate(localFrame, [0, d], [0, 100], clampOpts);
      return { clipPath: `inset(0 ${100 - clip}% 0 0)` };
    }
    case "countUp": {
      const opacity = interpolate(localFrame, [0, 8], [0, 1], clampOpts);
      return { opacity };
    }
    case "pulseAccent": {
      const easeInOut = { easing: Easing.inOut(Easing.sin) };
      const scale = interpolate(localFrame, [0, 15, 30], [1, 1.04, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        ...easeInOut,
      });
      return { transform: `scale(${scale})` };
    }
    case "scaleIn": {
      const sc = interpolate(localFrame, [0, d], [0.8, 1], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `scale(${sc})` };
    }
    case "blurIn": {
      const blur = interpolate(localFrame, [0, d], [10, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, filter: `blur(${blur}px)` };
    }
    case "bounceUp": {
      const ty = spring({
        frame: localFrame,
        fps,
        config: { damping: 10, stiffness: 150, mass: 0.6 },
      });
      const opacity = interpolate(localFrame, [0, 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { opacity, transform: `translateY(${(1 - ty) * 30}px)` };
    }
    case "typewriter": {
      const clip = interpolate(localFrame, [0, d], [0, 100], clampOpts);
      return { clipPath: `inset(0 ${100 - clip}% 0 0)` };
    }

    // ─── 새 프리셋: 풍부한 트랜지션 ───

    case "rotateIn": {
      const rotation = interpolate(localFrame, [0, d], [-8, 0], clampOpts);
      const sc = interpolate(localFrame, [0, d], [0.85, 1], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `rotate(${rotation}deg) scale(${sc})` };
    }
    case "zoomBlur": {
      const sc = interpolate(localFrame, [0, d], [1.3, 1], clampOpts);
      const blur = interpolate(localFrame, [0, d], [6, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `scale(${sc})`, filter: `blur(${blur}px)` };
    }
    case "dropIn": {
      const ty = spring({
        frame: localFrame,
        fps,
        config: { damping: 8, stiffness: 200, mass: 0.5 },
      });
      const opacity = interpolate(localFrame, [0, 4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { opacity, transform: `translateY(${(1 - ty) * -60}px)` };
    }
    case "flipUp": {
      const rotX = interpolate(localFrame, [0, d], [90, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d * 0.5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return {
        opacity,
        transform: `perspective(800px) rotateX(${rotX}deg)`,
        transformOrigin: "bottom center",
      };
    }
    case "expandCenter": {
      const sc = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.7 },
      });
      const opacity = interpolate(localFrame, [0, 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { opacity, transform: `scale(${sc})`, transformOrigin: "center center" };
    }
    case "slideReveal": {
      const clip = interpolate(localFrame, [0, d], [100, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d * 0.3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { opacity, clipPath: `inset(0 0 ${clip}% 0)` };
    }
    case "swoopLeft": {
      const tx = interpolate(localFrame, [0, d], [80, 0], clampOpts);
      const rotation = interpolate(localFrame, [0, d], [6, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `translateX(${tx}px) rotate(${rotation}deg)` };
    }
    case "swoopRight": {
      const tx = interpolate(localFrame, [0, d], [-80, 0], clampOpts);
      const rotation = interpolate(localFrame, [0, d], [-6, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `translateX(${tx}px) rotate(${rotation}deg)` };
    }
    case "elasticPop": {
      const sc = spring({
        frame: localFrame,
        fps,
        config: { damping: 6, stiffness: 180, mass: 0.4 },
      });
      const opacity = interpolate(localFrame, [0, 4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { opacity, transform: `scale(${sc})` };
    }
    case "riseRotate": {
      const ty = interpolate(localFrame, [0, d], [40, 0], clampOpts);
      const rotation = interpolate(localFrame, [0, d], [4, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      return { opacity, transform: `translateY(${ty}px) rotate(${rotation}deg)` };
    }
    case "glowIn": {
      const opacity = interpolate(localFrame, [0, d], [0, 1], clampOpts);
      const glow = interpolate(localFrame, [0, d, d * 2], [0, 20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return {
        opacity,
        filter: `drop-shadow(0 0 ${glow}px rgba(57, 255, 20, 0.6))`,
      };
    }
    case "splitReveal": {
      const clipL = interpolate(localFrame, [0, d], [50, 0], clampOpts);
      const clipR = interpolate(localFrame, [0, d], [50, 0], clampOpts);
      return { clipPath: `inset(0 ${clipR}% 0 ${clipL}%)` };
    }

    // ─── Phase 1: 강조/임팩트 프리셋 ───

    case "shakeIn": {
      // 좌우 진동 후 안착 (경고/위험 강조)
      const opacity = interpolate(localFrame, [0, 4], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      const shakeD = Math.min(d, 18);
      const progress = Math.min(localFrame / shakeD, 1);
      const decay = 1 - progress;
      const tx = decay * 8 * Math.sin(localFrame * 2.5);
      return { opacity, transform: `translateX(${tx}px)` };
    }
    case "impactPop": {
      // 거대 숫자/통계용 — 크게 튀어나왔다 안착
      const sc = spring({
        frame: localFrame,
        fps,
        config: { damping: 7, stiffness: 200, mass: 0.5 },
      });
      const opacity = interpolate(localFrame, [0, 3], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      return { opacity, transform: `scale(${sc})`, transformOrigin: "center center" };
    }
    case "wipeRight": {
      // 좌→우 하이라이트 마커 효과
      const clip = interpolate(localFrame, [0, d], [100, 0], clampOpts);
      const opacity = interpolate(localFrame, [0, d * 0.2], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      return { opacity, clipPath: `inset(0 ${clip}% 0 0)` };
    }
    case "stampIn": {
      // 도장 찍듯 — 큰 스케일에서 1로 빠르게 수렴 + 약한 흔들림
      const sc = spring({
        frame: localFrame,
        fps,
        config: { damping: 10, stiffness: 300, mass: 0.3 },
      });
      const opacity = interpolate(localFrame, [0, 2], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      const startScale = 2.5;
      const finalScale = 1 + (startScale - 1) * (1 - sc);
      return { opacity, transform: `scale(${finalScale})`, transformOrigin: "center center" };
    }
    case "revealUp": {
      // 아래에서 위로 clipPath 드러남 (차트/그래프에 적합)
      const clip = interpolate(localFrame, [0, d], [100, 0], clampOpts);
      return { clipPath: `inset(${clip}% 0 0 0)` };
    }

    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Emphasis: 등장 완료 후 반복 재생되는 강조 애니메이션
// ---------------------------------------------------------------------------

function computeEmphasisStyle(
  preset: string,
  loopFrame: number,
  cycle: number,
): React.CSSProperties {
  // loopFrame은 entrance 완료 후부터의 프레임
  const t = (loopFrame % cycle) / cycle; // 0~1 사이클 진행률
  const sin = Math.sin(t * Math.PI * 2);
  const cos = Math.cos(t * Math.PI * 2);
  const halfSin = Math.sin(t * Math.PI); // 0→1→0 반파

  switch (preset) {
    // ─── 떠다니기 (카드, 아이콘에 적합) ───
    case "float": {
      const ty = sin * 6;
      return { transform: `translateY(${ty}px)` };
    }
    case "floatRotate": {
      const ty = sin * 5;
      const rot = sin * 2;
      return { transform: `translateY(${ty}px) rotate(${rot}deg)` };
    }

    // ─── 맥박/숨쉬기 (강조 텍스트, 아이콘에 적합) ───
    case "pulse": {
      const scale = 1 + halfSin * 0.04;
      return { transform: `scale(${scale})` };
    }
    case "breathe": {
      const scale = 1 + sin * 0.025;
      const opacity = 0.85 + halfSin * 0.15;
      return { transform: `scale(${scale})`, opacity };
    }
    case "heartbeat": {
      // 두 번 뛰는 심박 패턴
      const t2 = t * 4;
      const beat1 = t2 < 1 ? Math.sin(t2 * Math.PI) * 0.08 : 0;
      const beat2 = (t2 > 1.2 && t2 < 2.2) ? Math.sin((t2 - 1.2) * Math.PI) * 0.05 : 0;
      const scale = 1 + beat1 + beat2;
      return { transform: `scale(${scale})` };
    }

    // ─── 반짝임/글로우 (배지, 숫자, 강조에 적합) ───
    case "shimmer": {
      const glow = 8 + halfSin * 12;
      return { filter: `drop-shadow(0 0 ${glow}px rgba(57, 255, 20, 0.5))` };
    }
    case "glowPulse": {
      const glow = 4 + halfSin * 16;
      const brightness = 1 + halfSin * 0.15;
      return {
        filter: `drop-shadow(0 0 ${glow}px rgba(57, 255, 20, 0.6)) brightness(${brightness})`,
      };
    }
    case "colorShift": {
      // hue-rotate로 색상 시프트
      const hue = sin * 20;
      return { filter: `hue-rotate(${hue}deg)` };
    }

    // ─── 흔들기 (주의 환기, 경고에 적합) ───
    case "wiggle": {
      const rot = sin * 3;
      return { transform: `rotate(${rot}deg)` };
    }
    case "shake": {
      const tx = sin * 2;
      const ty = cos * 1.5;
      return { transform: `translate(${tx}px, ${ty}px)` };
    }
    case "wobble": {
      const rot = sin * 2;
      const skew = sin * 1;
      return { transform: `rotate(${rot}deg) skewX(${skew}deg)` };
    }

    // ─── 회전 (아이콘, 로딩에 적합) ───
    case "spin": {
      const deg = t * 360;
      return { transform: `rotate(${deg}deg)` };
    }
    case "spinSlow": {
      const deg = t * 360;
      return { transform: `rotate(${deg}deg)`, opacity: 0.9 + halfSin * 0.1 };
    }

    // ─── 바운스 (CTA, 버튼, 강조에 적합) ───
    case "bounce": {
      // 탄성 바운스: 빠르게 올라갔다 내려옴
      const bounce = Math.abs(sin) * 8;
      return { transform: `translateY(-${bounce}px)` };
    }
    case "jelly": {
      const sx = 1 + sin * 0.03;
      const sy = 1 - sin * 0.03;
      return { transform: `scaleX(${sx}) scaleY(${sy})` };
    }

    // ─── 그라데이션/스윕 (텍스트, 배경에 적합) ───
    case "gradientSweep": {
      const pos = t * 200 - 50;
      return {
        backgroundImage: `linear-gradient(90deg, transparent ${pos - 30}%, rgba(57,255,20,0.15) ${pos}%, transparent ${pos + 30}%)`,
        backgroundSize: "200% 100%",
      };
    }

    // ─── 틸트 (카드에 적합) ───
    case "tilt3d": {
      const rx = sin * 3;
      const ry = cos * 3;
      return { transform: `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)` };
    }
    case "cardHover": {
      const ty = sin * 4;
      const shadow = 10 + halfSin * 15;
      return {
        transform: `translateY(${ty}px)`,
        boxShadow: `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3)`,
      };
    }

    // ─── 테두리 (FrameBox, 카드에 적합) ───
    case "borderGlow": {
      const glow = 2 + halfSin * 4;
      return { boxShadow: `0 0 ${glow}px rgba(57, 255, 20, 0.4), inset 0 0 ${glow}px rgba(57, 255, 20, 0.1)` };
    }

    // ─── Phase 1: 강화된 강조 프리셋 ───

    case "radarPing": {
      // 레이더 핑 — 빠르게 확장하는 링 + 페이드아웃 반복
      const ringScale = 1 + halfSin * 0.15;
      const ringOpacity = 0.6 + (1 - halfSin) * 0.4;
      return {
        transform: `scale(${ringScale})`,
        opacity: ringOpacity,
        boxShadow: `0 0 ${8 + halfSin * 20}px rgba(153, 69, 255, 0.5)`,
      };
    }
    case "dangerPulse": {
      // 위험 강조 — 빨간 글로우 펄스
      const glow = 4 + halfSin * 14;
      return {
        filter: `drop-shadow(0 0 ${glow}px rgba(239, 68, 68, 0.6))`,
        transform: `scale(${1 + halfSin * 0.02})`,
      };
    }
    case "successGlow": {
      // 성공/확인 강조 — 초록 글로우
      const glow = 4 + halfSin * 12;
      return {
        filter: `drop-shadow(0 0 ${glow}px rgba(34, 197, 94, 0.5))`,
      };
    }
    case "typewriterBlink": {
      // 커서 깜빡임 효과 (코드/터미널 텍스트에 적합)
      const blink = t < 0.5 ? 1 : 0;
      return { borderRight: `2px solid rgba(255,255,255,${blink})` };
    }
    case "numberTick": {
      // 숫자 틱 — 미세한 위아래 떨림 (살아있는 데이터 느낌)
      const ty = sin * 1.5;
      const brightness = 1 + halfSin * 0.08;
      return { transform: `translateY(${ty}px)`, filter: `brightness(${brightness})` };
    }

    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Container CSS from layout props
// ---------------------------------------------------------------------------

function getContainerCSS(node: StackNode): React.CSSProperties {
  const L = node.layout ?? {};
  const S = node.style ?? {};

  switch (node.type) {
    case "SceneRoot":
      // Viewport 1080 기준, top/bottom padding 을 balanced 로 (140/160) 처리해
      // SubtitleBar safe zone(≥140) 을 bottom 에 두면서 content center 를
      // viewport center 근방에 맞춘다. 기존 "60/100/140" 은 top-heavy bug.
      // v1.1 round 4 버그3: position:"relative" 추가 — 자식 Absolute 컨테이너가
      // SceneRoot border box 기준으로 배치되도록 (padding 뚫기 가능).
      return {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: cssAlign(L.align ?? "center"),
        justifyContent: cssJustify(L.justify ?? "center"),
        width: "100%",
        height: "100%",
        flex: 1,
        gap: L.gap ?? 24,
        padding: L.padding ?? "140px 120px 160px",
        textAlign: (L.align === "start" ? "left" : L.align === "end" ? "right" : "center") as React.CSSProperties["textAlign"],
        wordBreak: "keep-all" as const,
        overflowWrap: "break-word" as const,
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    case "Stack": {
      // v1.1 round 4 버그2: align:"start" 가 textAlign 에 반영 안 됨 + justify 기본
      // center 가 "수직 중앙 강제" 로 느껴짐. Phase 5 진단 5-A/5-C 참고.
      // L.align 이 지정되면 textAlign + justify 기본값 모두 일치 fallback.
      const align = L.align ?? "center";
      const justifyFallback = L.justify ?? align;
      const textAlignFromAlign = align === "start" ? "left" : align === "end" ? "right" : "center";
      return {
        display: "flex",
        flexDirection: L.direction === "row" ? "row" : "column",
        alignItems: cssAlign(align),
        justifyContent: cssJustify(justifyFallback),
        gap: L.gap ?? 16,
        flexWrap: L.wrap ? "wrap" : "nowrap",
        textAlign: textAlignFromAlign as React.CSSProperties["textAlign"],
        width: L.width ?? "100%",
        maxWidth: L.maxWidth ?? "100%",
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    }
    case "Grid": {
      const cols = L.columns ?? 2;
      return {
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: L.gap ?? 28,
        justifyContent: "center",
        justifyItems: "center",
        alignItems: "stretch",
        alignSelf: "stretch",
        width: L.width ?? "100%",
        maxWidth: L.maxWidth ?? 1200,
        margin: "0 auto",
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    }
    case "Split": {
      return {
        display: "flex",
        flexDirection: "row" as const,
        alignItems: "stretch",
        justifyContent: "center",
        gap: L.gap ?? 40,
        width: L.width ?? "100%",
        maxWidth: L.maxWidth ?? 1100,
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    }
    case "Overlay":
      return {
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    case "FrameBox": {
      // FrameBox width: 명시적 지정 없으면 width를 설정하지 않음
      // ⚠ fit-content를 사용하면 flex stretch를 무시하므로 절대 사용 금지

      // ── FrameBox variant 시스템 ──
      // filled-muted(기본) | border-neutral | border-accent | glass | neo
      const fbVariant = (node.data?.variant ?? L.variant ?? "filled-muted") as string;

      let border: string;
      let background: string;
      let boxShadow: string;

      switch (fbVariant) {
        case "border-neutral":
          border = "1.5px solid rgba(255, 255, 255, 0.2)";
          background = "transparent";
          boxShadow = "none";
          break;
        case "border-accent":
          border = `2px solid ${(S.borderColor as string) || "rgba(153, 69, 255, 0.5)"}`;
          background = "rgba(153, 69, 255, 0.04)";
          boxShadow = "0 0 16px rgba(153, 69, 255, 0.15)";
          break;
        case "glass":
          border = "1px solid rgba(255, 255, 255, 0.12)";
          background = "rgba(255, 255, 255, 0.04)";
          boxShadow = "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)";
          break;
        case "filled-muted":
        default: {
          // 기본: 기존 로직 (border 유효성 보정)
          const DEFAULT_BORDER = `1px solid rgba(255, 255, 255, 0.25)`;
          let validBorder = (S.border as string) ?? DEFAULT_BORDER;
          if (validBorder && (
            validBorder.includes("var(") ||
            !/^\d/.test(validBorder) ||
            !validBorder.includes("solid")
          )) {
            validBorder = DEFAULT_BORDER;
          }
          border = validBorder;
          background = (S.background as string) ?? "rgba(255, 255, 255, 0.06)";
          boxShadow = (S.boxShadow as string) ?? "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)";
          break;
        }
      }

      const baseStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: L.gap ?? 16,
        padding: L.padding ?? 24,
        border,
        borderRadius: (S.radius as number) ?? 16,
        background,
        maxWidth: L.maxWidth ?? "100%",
        height: "100%",
        boxSizing: "border-box" as const,
        boxShadow,
      };

      // width는 명시적으로 지정된 경우에만 설정
      if (L.width) {
        baseStyle.width = L.width;
      }

      return {
        ...baseStyle,
        ...(S as React.CSSProperties),
      };
    }
    case "AnchorBox": {
      const anchorCSS = anchorToCSS(
        L.anchor ?? "bottom-center",
        L.offsetX ?? 0,
        L.offsetY ?? 0,
      );
      return {
        position: "absolute",
        ...anchorCSS,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: L.gap ?? 8,
        ...(S as React.CSSProperties),
      };
    }
    case "SafeArea":
      return {
        paddingTop: L.paddingTop ?? 80,
        paddingBottom: L.paddingBottom ?? 120,
        paddingLeft: L.paddingLeft ?? 120,
        paddingRight: L.paddingRight ?? 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    case "Absolute":
      // v1.1 round 4 버그3 수정: position:"absolute" + inset:0 으로 SceneRoot padding
      // 을 뚫는다. 기존 position:"relative" 는 SceneRoot content box 에 갇혀 있어
      // anchor "top-right" 가 우상단 끝이 아닌 padding 안쪽에 찍혔음 (Phase 5 진단).
      // parent (SceneRoot) 가 position:"relative" 이므로 SceneRoot border box 기준 배치.
      // pointer-events:"none" 으로 장식 overlay 가 다른 콘텐츠 인터랙션 방해 안 함.
      return {
        position: "absolute",
        inset: 0,
        width: L.width ?? "100%",
        height: L.height ?? "100%",
        maxWidth: L.maxWidth ?? 1920,
        overflow: "visible",
        pointerEvents: "none" as const,
        boxSizing: "border-box" as const,
        ...(S as React.CSSProperties),
      };
    default:
      return {};
  }
}

function cssAlign(a: string): string {
  const m: Record<string, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
    baseline: "baseline",
  };
  return m[a] ?? "center";
}

function cssJustify(j: string): string {
  const m: Record<string, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    "space-between": "space-between",
    "space-around": "space-around",
  };
  return m[j] ?? "center";
}

function anchorToCSS(
  anchor: string,
  ox: number,
  oy: number,
): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    "top-left": { top: oy, left: ox },
    "top-center": {
      top: oy,
      left: "50%",
      transform: `translateX(calc(-50% + ${ox}px))`,
    },
    "top-right": { top: oy, right: -ox },
    "center-left": {
      top: "50%",
      left: ox,
      transform: `translateY(calc(-50% + ${oy}px))`,
    },
    center: {
      top: "50%",
      left: "50%",
      transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`,
    },
    "center-right": {
      top: "50%",
      right: -ox,
      transform: `translateY(calc(-50% + ${oy}px))`,
    },
    "bottom-left": { bottom: -oy, left: ox },
    "bottom-center": {
      bottom: -oy,
      left: "50%",
      transform: `translateX(calc(-50% + ${ox}px))`,
    },
    "bottom-right": { bottom: -oy, right: -ox },
  };
  return map[anchor] ?? map["center"];
}

// ---------------------------------------------------------------------------
// Split Variant Divider — 패널 사이 시각적 분리 요소
// variant: "gap"(기본) | "line" | "arrow" | "vs" | "diagonal"
// ---------------------------------------------------------------------------

function SplitDivider({
  variant,
  accentColor,
  accentGlow,
  frame,
  enterAt = 0,
}: {
  variant: string;
  accentColor: string;
  accentGlow: string;
  frame: number;
  enterAt?: number;
}): React.ReactElement | null {
  const localFrame = Math.max(0, frame - enterAt);
  const fadeIn = Math.min(1, localFrame / 12);

  switch (variant) {
    case "line":
      return (
        <div style={{
          width: 2,
          alignSelf: "stretch",
          background: `linear-gradient(to bottom, transparent 5%, ${accentColor}60 30%, ${accentColor}80 50%, ${accentColor}60 70%, transparent 95%)`,
          opacity: fadeIn,
          flexShrink: 0,
          boxShadow: `0 0 8px ${accentGlow}`,
        }} />
      );

    case "arrow":
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: fadeIn,
          width: 48,
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M8 18 L24 18 M20 12 L26 18 L20 24"
              stroke={accentColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${accentGlow})` }}
            />
          </svg>
        </div>
      );

    case "vs":
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: fadeIn,
          width: 56,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 20px ${accentGlow}`,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
              fontSize: 18,
              fontWeight: 900,
              color: "#FFF",
              letterSpacing: "0.05em",
            }}>
              VS
            </span>
          </div>
        </div>
      );

    case "diagonal":
      return (
        <div style={{
          width: 3,
          alignSelf: "stretch",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          opacity: fadeIn,
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(160deg, transparent 20%, ${accentColor}70 45%, ${accentColor}90 50%, ${accentColor}70 55%, transparent 80%)`,
            boxShadow: `0 0 12px ${accentGlow}`,
          }} />
        </div>
      );

    case "gap":
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Recursive Renderer
// ---------------------------------------------------------------------------

const RenderNode: React.FC<StackRendererProps> = ({
  node,
  frame,
  durationFrames,
  subtitles,
  sceneStartSec = 0,
  nodeIndex = 0,
  totalSiblings = 1,
  parentType,
}) => {
  const { fps } = useVideoConfig();
  const palette = useScenePalette();

  // visible === false → 이 노드와 모든 하위 노드 렌더링 스킵
  if (node.visible === false) return null;

  const isContainer = CONTAINER_TYPES.has(node.type);
  const isOverlay = node.type === "Overlay";

  // Use node's explicit enterAt if defined; otherwise keep 0 (instant)
  // sync-enterAt.ts handles subtitle timing in JSON — no dynamic override here
  const enterAt = node.motion?.enterAt ?? 0;

  const motionDuration = node.motion?.duration ?? 15;
  // Kicker는 항상 정적 — entrance/emphasis 모션 무시 (매 씬 흔들림 방지)
  const isKicker = node.type === "Kicker";
  const preset = isKicker ? "" : (node.motion?.preset ?? "");
  const emphasisPreset = isKicker ? "" : (node.motion?.emphasis ?? "");
  const emphasisCycle = node.motion?.emphasisCycle ?? 60;
  const localFrame = frame - enterAt;

  // entrance 모션
  const entranceStyle = preset
    ? computeMotionStyle(preset, Math.max(0, localFrame), motionDuration, fps)
    : {};

  // emphasis 모션 (entrance 완료 후 루프 재생)
  const entranceDone = localFrame > motionDuration;
  const emphasisStyle = (emphasisPreset && entranceDone)
    ? computeEmphasisStyle(emphasisPreset, localFrame - motionDuration, emphasisCycle)
    : {};

  // 합성: entrance가 진행 중이면 entrance만, 완료 후에는 emphasis 합침
  const motionStyle = entranceDone
    ? { ...entranceStyle, ...emphasisStyle }
    : entranceStyle;

  // ScatterLayout: position:absolute 기반 산재 배치 컨테이너
  if (node.type === "ScatterLayout") {
    return (
      <ScatterLayoutRenderer
        node={node}
        frame={frame}
        durationFrames={durationFrames}
        renderChild={(child, i) => (
          <RenderNode
            key={child.id}
            node={child}
            frame={frame}
            durationFrames={durationFrames}
            subtitles={subtitles}
            sceneStartSec={sceneStartSec}
            nodeIndex={i}
            totalSiblings={node.children?.length ?? 1}
          />
        )}
      />
    );
  }

  // Container nodes
  if (isContainer) {
    const containerCSS = getContainerCSS(node);
    const children = node.children ?? [];

    const isSplit = node.type === "Split";
    const splitRatios = isSplit ? (node.layout?.ratio ?? [1, 1]) : [];
    const isRowStack = node.type === "Stack" && (node.layout?.direction === "row");
    const isAbsoluteContainer = node.type === "Absolute";

    const renderedChildren = children.map((child, i) => {
      const childNode = (
        <RenderNode
          key={child.id}
          node={child}
          frame={frame}
          durationFrames={durationFrames}
          subtitles={subtitles}
          sceneStartSec={sceneStartSec}
          nodeIndex={i}
          totalSiblings={children.length}
          parentType={node.type}
        />
      );

      if (isSplit) {
        const ratio = splitRatios[i] ?? 1;
        return (
          <div
            key={child.id}
            style={{
              flex: `${ratio} 1 0%`,
              minWidth: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",  // 자식 FrameBox가 100% 너비로 채움
              justifyContent: "center",
            }}
          >
            {childNode}
          </div>
        );
      }

      // Absolute 컨테이너: 자식의 style.left/top/width/height/transform 그대로 사용.
      // 외곽 wrapper 가 position:absolute + 좌표를 전담 — 내부 RenderNode 로 전달된
      // child 의 position/left/top 은 strip (double-absolute 방지).
      if (isAbsoluteContainer) {
        const childStyle = (child.style ?? {}) as Record<string, unknown>;
        // child.style 에서 positioning 속성 제거 후 재렌더 (내부 요소는 natural flow)
        const strippedChild = {
          ...child,
          style: Object.fromEntries(
            Object.entries(childStyle).filter(
              ([k]) => !["position", "left", "top", "right", "bottom", "zIndex"].includes(k)
            )
          ),
        };
        const strippedNode = (
          <RenderNode
            key={child.id}
            node={strippedChild as any}
            frame={frame}
            durationFrames={durationFrames}
            subtitles={subtitles}
            sceneStartSec={sceneStartSec}
            nodeIndex={i}
            totalSiblings={children.length}
            parentType={node.type}
          />
        );
        return (
          <div
            key={child.id}
            style={{
              position: "absolute",
              left: childStyle.left as any,
              top: childStyle.top as any,
              right: childStyle.right as any,
              bottom: childStyle.bottom as any,
              width: childStyle.width as any,
              height: childStyle.height as any,
              zIndex: (childStyle.zIndex as any) ?? 1,
              // block display + max-content → 자식 자연 크기 유지
              display: (childStyle.display as any) ?? "block",
              textAlign: (childStyle.textAlign as any),
            }}
          >
            {strippedNode}
          </div>
        );
      }

      // Row Stack: flex wrapper — 자동 보정 로직 포함
      if (isRowStack) {
        // baseline 정렬 row 에서는 leaf 텍스트 노드를 wrapper 없이 직접 배치
        // (wrapper flex-column 이 baseline 축을 깨뜨림)
        const isBaselineRow = node.layout?.align === "baseline";
        const isLeafText =
          !CONTAINER_TYPES.has(child.type) &&
          (child.type === "FreeText" ||
            child.type === "Kicker" ||
            child.type === "FooterCaption" ||
            child.type === "Headline" ||
            child.type === "BodyText" ||
            child.type === "MarkerHighlight" ||
            child.type === "Badge");
        if (isBaselineRow && isLeafText) {
          return <React.Fragment key={child.id}>{childNode}</React.Fragment>;
        }

        const childStyle = (child.style ?? {}) as Record<string, unknown>;
        const CONNECTOR = new Set(["ArrowConnector", "LineConnector"]);
        const FIXED_LEAF = new Set([
          "ArrowConnector", "LineConnector", "Icon", "Badge", "Pill",
          "Divider", "Kicker", "FooterCaption",
        ]);

        // ── 프로세스 플로우 감지: FrameBox + ArrowConnector 패턴 ──
        const hasArrows = children.some((c) => c.type === "ArrowConnector");
        const siblingCards = children.filter((c) => !CONNECTOR.has(c.type) && CONTAINER_TYPES.has(c.type));
        const isProcessFlow = hasArrows && siblingCards.length >= 2;

        const isConnector = CONNECTOR.has(child.type);
        const isFixed =
          FIXED_LEAF.has(child.type) ||
          childStyle.flexShrink === 0;
        const isChildContainer = CONTAINER_TYPES.has(child.type);

        let flex: string;
        let alignSelf: string = "stretch";

        // ── Icon+Text 타임라인 행 감지: Icon + Stack(col) 패턴 (화살표 없음) ──
        const hasIcon = children.some((c) => c.type === "Icon");
        const hasTextStack = children.some((c) => c.type === "Stack" && (c.layout?.direction !== "row"));
        const isTimelineRow = hasIcon && hasTextStack && !hasArrows;

        if (isProcessFlow) {
          // 프로세스 플로우: 카드는 균등 분배, 화살표는 고정+수직가운데
          if (isConnector) {
            flex = "0 0 auto";
            alignSelf = "center";
          } else {
            flex = "1 1 0%";  // 균등 분배 → 같은 너비
          }
        } else if (isTimelineRow) {
          // Icon+Text 행: 모든 자식이 자연 크기 → justify:center로 그룹 가운데 정렬
          flex = "0 0 auto";
          alignSelf = "center";
        } else {
          // 일반 row: 기존 로직
          flex = isFixed ? "0 0 auto" : isChildContainer ? "1 1 0%" : "0 1 auto";
        }

        return (
          <div
            key={child.id}
            style={{
              flex,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: alignSelf === "center" ? "center" : "stretch",
              justifyContent: "center",
              alignSelf,
            }}
          >
            {childNode}
          </div>
        );
      }

      // Grid: no wrapper — CSS Grid align-items:stretch handles equal height

      return childNode;
    });

    // Split variant: 패널 사이 디바이더 삽입
    const splitVariant = isSplit ? (node.data?.variant ?? node.layout?.variant ?? "gap") : "gap";
    const splitChildren = (isSplit && splitVariant !== "gap")
      ? renderedChildren.reduce<React.ReactNode[]>((acc, child, i) => {
          if (i > 0) {
            acc.push(
              <SplitDivider
                key={`divider-${i}`}
                variant={splitVariant}
                accentColor={palette.accentBright}
                accentGlow={palette.accentGlow}
                frame={frame}
                enterAt={node.motion?.enterAt ?? 0}
              />
            );
          }
          acc.push(child);
          return acc;
        }, [])
      : renderedChildren;

    const content = isOverlay ? (
      <div data-node-id={node.id} style={containerCSS}>
        {splitChildren.map((child, i) => (
          <div
            key={i}
            style={
              i === 0
                ? { position: "absolute", inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }
                : {
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }
            }
          >
            {child}
          </div>
        ))}
      </div>
    ) : (
      <div data-node-id={node.id} style={containerCSS}>{splitChildren}</div>
    );

    if (preset) {
      return (
        <div
          style={{
            ...motionStyle,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content}
        </div>
      );
    }

    // ── 컨테이너 auto-sync: motion preset이 없으면
    //    첫 자식의 enterAt까지 투명화하여 "빈 박스가 먼저 보이는" 문제 방지 ──
    // FrameBox/Stack/Grid/Split 등에 명시적 motion이 없을 때,
    // 가장 일찍 나타나는 자식의 enterAt에 맞춰 컨테이너도 함께 페이드인
    const earliestChildEnterAt = children.reduce((min, c) => {
      const cEnterAt = c.motion?.enterAt ?? 0;
      return cEnterAt < min ? cEnterAt : min;
    }, Infinity);

    if (Number.isFinite(earliestChildEnterAt) && earliestChildEnterAt > 0) {
      const containerFadeIn = Math.max(0, Math.min(1, (frame - earliestChildEnterAt + 6) / 12));
      return (
        <div style={{ opacity: containerFadeIn, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {content}
        </div>
      );
    }

    return content;
  }

  // Leaf nodes
  const Component = NODE_REGISTRY[node.type];
  if (!Component) {
    return (
      <div
        data-node-id={node.id}
        style={{
          color: "#FF4444",
          fontFamily: "Inter",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Unknown: {node.type}
      </div>
    );
  }

  // absolute 위치 노드: 모션 래퍼에서 position을 처리하고 내부에선 제거
  const nodeStyle = (node.style ?? {}) as Record<string, unknown>;
  const isAbsolute = nodeStyle.position === "absolute";
  let renderNode = node;
  if (isAbsolute && preset) {
    const { position, ...restStyle } = nodeStyle;
    renderNode = { ...node, style: restStyle };
  }

  const rendered = (
    <Component node={renderNode} frame={frame} durationFrames={durationFrames} />
  );

  // leaf layout 치수: node.layout에 명시된 width/height/maxWidth를 래퍼에 적용
  const leafLayout = node.layout ?? {};
  const leafWidth = leafLayout.width;
  const leafHeight = leafLayout.height;
  const leafMaxWidth = leafLayout.maxWidth;

  if (preset) {
    if (isAbsolute) {
      return (
        <div
          data-node-id={node.id}
          style={{
            ...motionStyle,
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {rendered}
        </div>
      );
    }
    return (
      <div
        data-node-id={node.id}
        style={{
          ...motionStyle,
          width: leafWidth ?? "100%",
          height: leafHeight,
          maxWidth: leafMaxWidth,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {rendered}
      </div>
    );
  }

  // layout 치수가 있으면 실제 박스로 래핑, 없으면 display:contents 유지
  const hasLeafDims = leafWidth != null || leafHeight != null || leafMaxWidth != null;
  if (hasLeafDims) {
    return (
      <div
        data-node-id={node.id}
        style={{ width: leafWidth, height: leafHeight, maxWidth: leafMaxWidth }}
      >
        {rendered}
      </div>
    );
  }

  return <div data-node-id={node.id} style={{ display: "contents" }}>{rendered}</div>;
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const StackRenderer: React.FC<StackRendererProps> = ({
  node,
  frame,
  durationFrames,
  subtitles,
  sceneStartSec,
  sceneIndex,
}) => {
  const palette = getPaletteForScene(sceneIndex ?? 0);
  return (
    <SceneThemeContext.Provider value={palette}>
      <RenderNode
        node={node}
        frame={frame}
        durationFrames={durationFrames}
        subtitles={subtitles}
        sceneStartSec={sceneStartSec}
        nodeIndex={0}
        totalSiblings={1}
      />
    </SceneThemeContext.Provider>
  );
};
