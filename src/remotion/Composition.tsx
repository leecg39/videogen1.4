// Remotion 메인 컴포지션 — TransitionSeries + 풍부한 씬 전환

import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { Scene, TransitionType, RenderSettings } from "@/types";
import { SceneRenderer } from "./common/SceneRenderer";
import { T } from "./common/theme";
import type { StylePack } from "./common/theme";

export interface MainCompositionProps {
  scenes: Scene[];
  audioSrc?: string;
  stylePack?: StylePack;
  /** 선택: 런타임 override. Root.tsx calculateMetadata 가 읽는다. */
  render?: RenderSettings;
}

// ---------------------------------------------------------------------------
// Transition 프레젠테이션 선택
// ---------------------------------------------------------------------------

const DEFAULT_TRANSITION_FRAMES = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPresentation(type: TransitionType): any {
  switch (type) {
    case "crossfade":
      return fade({ shouldFadeOutExitingScene: true });
    case "slide-left":
      return slide({ direction: "from-right" });
    case "slide-right":
      return slide({ direction: "from-left" });
    case "slide-up":
      return slide({ direction: "from-bottom" });
    case "slide-down":
      return slide({ direction: "from-top" });
    case "wipe-right":
      return wipe({ direction: "from-left" });
    case "wipe-down":
      return wipe({ direction: "from-top-left" });
    case "zoom-in":
    case "zoom-out":
    case "iris":
    case "blur-through":
      return fade({ shouldFadeOutExitingScene: true });
    case "none":
      return fade();
    default:
      return fade({ shouldFadeOutExitingScene: true });
  }
}

function getTiming(type: TransitionType, durationFrames: number) {
  switch (type) {
    case "slide-left":
    case "slide-right":
    case "slide-up":
    case "slide-down":
      return springTiming({
        config: { damping: 15, stiffness: 80, mass: 0.8 },
        durationInFrames: durationFrames,
      });
    case "wipe-right":
    case "wipe-down":
      return linearTiming({
        durationInFrames: durationFrames,
        easing: Easing.inOut(Easing.cubic),
      });
    default:
      return linearTiming({
        durationInFrames: durationFrames,
        easing: Easing.inOut(Easing.quad),
      });
  }
}

// ---------------------------------------------------------------------------
// 씬 단위 래퍼 — exit 애니메이션 + zoom 효과
// ---------------------------------------------------------------------------

const SCENE_EXIT_FRAMES = 12;

const SceneWithEffects: React.FC<{
  scene: Scene;
  transitionType: TransitionType;
  transitionDuration: number;
}> = ({ scene, transitionType, transitionDuration }) => {
  const frame = useCurrentFrame();
  const dur = scene.duration_frames;

  // Exit animation: 마지막 프레임에서 fade-out + slight zoom
  const exitStart = dur - SCENE_EXIT_FRAMES;
  const exitProgress = interpolate(frame, [exitStart, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  // zoom-in / zoom-out 전용 효과
  let zoomScale = 1;
  if (transitionType === "zoom-in") {
    zoomScale = interpolate(frame, [exitStart, dur], [1, 1.08], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
  } else if (transitionType === "zoom-out") {
    zoomScale = interpolate(frame, [exitStart, dur], [1, 0.92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
  }

  // blur-through 효과
  let blurAmount = 0;
  if (transitionType === "blur-through") {
    blurAmount = interpolate(frame, [exitStart, dur], [0, 8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
  }

  // Entrance: 처음 몇 프레임에서 blur 해제 (blur-through 이전 씬 전환용)
  const entranceBlur = interpolate(frame, [0, 10], [4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const combinedBlur = blurAmount + (transitionType === "blur-through" ? 0 : entranceBlur);
  const filterStyle = combinedBlur > 0.1 ? `blur(${combinedBlur}px)` : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
          filter: filterStyle,
          willChange: "transform, filter",
        }}
      >
        <SceneRenderer scene={scene} frame={frame} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 자동 전환 유형 결정 (씬 의도 기반)
// ---------------------------------------------------------------------------

const TRANSITION_CYCLE: TransitionType[] = [
  "crossfade",
  "slide-right",
  "wipe-right",
  "crossfade",
  "zoom-in",
  "slide-up",
  "blur-through",
  "crossfade",
  "wipe-down",
  "slide-left",
  "zoom-out",
  "crossfade",
];

function autoSelectTransition(
  scene: Scene,
  nextScene: Scene | undefined,
  index: number,
): { type: TransitionType; durationFrames: number } {
  // 씬에 명시적 transition이 있으면 사용
  if (scene.transition) {
    return {
      type: scene.transition.type,
      durationFrames: scene.transition.durationFrames ?? DEFAULT_TRANSITION_FRAMES,
    };
  }

  // 마지막 씬은 전환 없음
  if (!nextScene) {
    return { type: "none", durationFrames: 0 };
  }

  // intent 기반 전환 선택
  const intent = scene.chunk_metadata?.intent;
  const nextIntent = nextScene.chunk_metadata?.intent;

  // 챕터 전환 (큰 시간 갭) → 더 극적인 전환
  const gap = nextScene.start_ms - scene.end_ms;
  if (gap > 500) {
    // 챕터 브레이크: zoom 또는 wipe
    const dramatic: TransitionType[] = ["zoom-in", "wipe-right", "slide-up", "blur-through"];
    return {
      type: dramatic[index % dramatic.length],
      durationFrames: 24,
    };
  }

  // compare/contrast → slide split
  if (intent === "compare" || nextIntent === "compare") {
    return { type: "slide-right", durationFrames: 20 };
  }

  // emphasize → zoom
  if (intent === "emphasize" || nextIntent === "emphasize") {
    return { type: "zoom-in", durationFrames: 18 };
  }

  // list 계열 → 빠른 crossfade
  if (intent === "list" || nextIntent === "list") {
    return { type: "crossfade", durationFrames: 15 };
  }

  // 기본: 순환 패턴 사용
  return {
    type: TRANSITION_CYCLE[index % TRANSITION_CYCLE.length],
    durationFrames: DEFAULT_TRANSITION_FRAMES,
  };
}

// ---------------------------------------------------------------------------
// Main Composition
// ---------------------------------------------------------------------------

export const MainComposition: React.FC<MainCompositionProps> = ({
  scenes,
  audioSrc,
}) => {
  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: T.textAccent,
            fontFamily: "Inter, sans-serif",
            fontSize: 32,
          }}
        >
          No scenes loaded
        </span>
      </AbsoluteFill>
    );
  }

  // 각 씬의 전환 설정 미리 계산
  const transitions = scenes.map((scene, i) =>
    autoSelectTransition(scene, scenes[i + 1], i),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      <TransitionSeries>
        {scenes.map((scene, i) => {
          const tr = transitions[i];
          const elements: React.ReactNode[] = [];

          // 씬 시퀀스
          elements.push(
            <TransitionSeries.Sequence
              key={`seq-${scene.id}`}
              durationInFrames={scene.duration_frames}
            >
              <SceneWithEffects
                scene={scene}
                transitionType={tr.type}
                transitionDuration={tr.durationFrames}
              />
            </TransitionSeries.Sequence>,
          );

          // 다음 씬이 있고 전환이 none이 아니면 Transition 삽입
          if (i < scenes.length - 1 && tr.type !== "none" && tr.durationFrames > 0) {
            elements.push(
              <TransitionSeries.Transition
                key={`tr-${scene.id}`}
                presentation={getPresentation(tr.type)}
                timing={getTiming(tr.type, tr.durationFrames)}
              />,
            );
          }

          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
