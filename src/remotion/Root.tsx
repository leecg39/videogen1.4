// @TASK P0-T0.2 - Remotion 루트 컴포지션
// @SPEC specs/shared/types.yaml

import React from "react";
import type { ComponentType } from "react";
import { Composition, staticFile } from "remotion";
import { continueRender, delayRender } from "remotion";
import type { Scene } from "@/types";
import type { MainCompositionProps } from "./Composition";
import { MainComposition } from "./Composition";
import { getTypography, type StylePack } from "./common/theme";
import { Scene5ATSX } from "./diagnostic/Scene5ATSX";
import { Scene5BTSX } from "./diagnostic/Scene5BTSX";
import { Scene5CTSX } from "./diagnostic/Scene5CTSX";

// ---------------------------------------------------------------------------
// Font Loading — delayRender 패턴으로 스타일시트 로딩
// ---------------------------------------------------------------------------

function loadStylesheet(url: string): void {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const handle = delayRender();
  const el = document.createElement("link");
  el.rel = "stylesheet";
  el.href = url;
  el.onload = () => continueRender(handle);
  el.onerror = () => continueRender(handle);
  document.head.appendChild(el);
}

// Pretendard 폰트 (즉시 로딩)
loadStylesheet(
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
);

function loadGoogleFonts(stylePack: StylePack = "dark-neon") {
  const typo = getTypography(stylePack);
  if (typo.googleFontsUrl) loadStylesheet(typo.googleFontsUrl);
}

// ---------------------------------------------------------------------------
// Remotion Root
// ---------------------------------------------------------------------------

const defaultScenes: Scene[] = [];

// Remotion Composition Props 제약(Record<string, unknown>)을 위한 캐스트.
const TypedMainComposition = MainComposition as unknown as ComponentType<
  Record<string, unknown>
>;

const calculateDuration = (scenes: Scene[]): number => {
  if (!scenes || scenes.length === 0) return 300;
  return scenes.reduce((sum, s) => sum + s.duration_frames, 0);
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={TypedMainComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          { scenes: defaultScenes } as unknown as Record<string, unknown>
        }
        calculateMetadata={async ({ props }) => {
          const p = props as unknown as MainCompositionProps;
          // render.stylePack 가 우선, 없으면 props.stylePack, 없으면 dark-neon
          const resolvedStylePack = p.render?.stylePack ?? p.stylePack ?? "dark-neon";
          loadGoogleFonts(resolvedStylePack);
          return {
            durationInFrames: calculateDuration(p.scenes),
            fps: p.render?.fps ?? 30,
            width: p.render?.width ?? 1920,
            height: p.render?.height ?? 1080,
          };
        }}
      />
      {/* Diagnostic compositions — Phase 5 DSL vs TSX 비교 */}
      <Composition
        id="Diag5ATSX"
        component={Scene5ATSX}
        durationInFrames={370}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Diag5BTSX"
        component={Scene5BTSX}
        durationInFrames={269}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Diag5CTSX"
        component={Scene5CTSX}
        durationInFrames={405}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

export type { MainCompositionProps };
