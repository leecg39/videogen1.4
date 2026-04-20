// SceneShell - 모든 씬의 공통 래퍼
// 검정 배경 + 콘텐츠 영역 (상단 ~75%) + 캐릭터 오버레이 + 하단 자막 바

import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { Scene } from "@/types";
import { Gif } from "@remotion/gif";
import { SubtitleBar } from "./SubtitleBar";
import { getStylePackConfig, type StylePack, type AmbientConfig, getPaletteForScene } from "./theme";
import { SceneBackgroundLayer } from "./SceneBackground";
import { AmbientBackground } from "./AmbientBackground";
import { DepthOverlay } from "./DepthOverlay";
import { TypographyContext } from "./typography";

interface SceneShellProps {
  scene: Scene;
  frame: number;
  children: React.ReactNode;
  /** 콘텐츠 영역 padding 오버라이드 */
  contentPadding?: string;
  /** data-testid */
  testId?: string;
  /** 스타일 팩 선택 (기본: dark-neon) */
  stylePack?: StylePack;
  /** 씬 인덱스 (팔레트 로테이션용) */
  sceneIndex?: number;
}

/** stack_root에서 캐릭터 AnchorBox를 추출 (있으면) */
function extractCharacter(stackRoot: any): {
  src: string; maxHeight: number; position: string;
  bubble?: string; enterAt: number; duration: number;
} | null {
  if (!stackRoot?.children) return null;
  for (let i = stackRoot.children.length - 1; i >= 0; i--) {
    const child = stackRoot.children[i];
    if (child.type !== "AnchorBox") continue;
    // Find ImageAsset with characters/ in src
    const findChar = (node: any): any => {
      if (node.type === "ImageAsset" && node.data?.src?.includes("characters/")) return node;
      if (node.children) {
        for (const c of node.children) {
          const found = findChar(c);
          if (found) return found;
        }
      }
      return null;
    };
    const charNode = findChar(child);
    if (!charNode) continue;

    // Find ChatBubble for speech bubble
    const findBubble = (node: any): string | undefined => {
      if (node.type === "ChatBubble" && node.data?.text) return node.data.text;
      if (node.children) {
        for (const c of node.children) {
          const found = findBubble(c);
          if (found) return found;
        }
      }
      return undefined;
    };

    const anchor = child.layout?.anchor ?? "bottomRight";
    const position = anchor.includes("Left") ? "left" : "right";

    return {
      src: charNode.data.src,
      maxHeight: 360,
      position,
      bubble: findBubble(child),
      enterAt: child.motion?.enterAt ?? 30,
      duration: child.motion?.duration ?? 20,
    };
  }
  return null;
}

/** 캐릭터 AnchorBox 와 SfxAudio 를 stack_root 에서 제거한 tree 반환 */
export function removeCharacterFromTree(stackRoot: any): any {
  if (!stackRoot?.children) return stackRoot;
  const filtered = stackRoot.children.filter((child: any) => {
    if (child.type === "SfxAudio") return false;
    if (child.type !== "AnchorBox") return true;
    const json = JSON.stringify(child);
    return !json.includes("characters/");
  });
  return { ...stackRoot, children: filtered };
}

/** 트리에서 SfxAudio 노드만 수집 (어느 깊이든) */
export function collectSfxNodes(node: any): Array<{ id: string; src: string; startFrame: number; volume: number }> {
  const out: Array<{ id: string; src: string; startFrame: number; volume: number }> = [];
  function walk(n: any) {
    if (!n || typeof n !== "object") return;
    if (n.type === "SfxAudio") {
      const d = n.data ?? {};
      if (d.src) {
        out.push({
          id: n.id ?? `sfx-${out.length}`,
          src: d.src,
          startFrame: d.startFrame ?? d.from ?? 0,
          volume: d.volume ?? 0.6,
        });
      }
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
  }
  walk(node);
  return out;
}

export const SceneShell: React.FC<SceneShellProps> = ({
  scene,
  frame,
  children,
  contentPadding = "60px 100px 160px",
  testId,
  stylePack,
  sceneIndex = 0,
}) => {
  const { colors: theme, typography, ambient: ambientBase } = getStylePackConfig(stylePack);
  const ambientConfig: AmbientConfig = {
    ...ambientBase,
    ...(scene.ambient?.preset && { preset: scene.ambient.preset }),
    ...(scene.ambient?.tintColor && { tintColor: scene.ambient.tintColor }),
    ...(scene.ambient?.opacity != null && { opacity: scene.ambient.opacity }),
  };
  const character = extractCharacter(scene.stack_root);
  const sfxNodes = collectSfxNodes(scene.stack_root);
  const localFrame = character ? Math.max(0, frame - character.enterAt) : 0;
  const charProgress = character ? Math.min(1, localFrame / Math.max(1, character.duration)) : 0;
  const bubbleProgress = character?.bubble ? Math.min(1, Math.max(0, (localFrame - 10) / 15)) : 0;

  return (
    <AbsoluteFill
      data-testid={testId}
      style={{ backgroundColor: theme.bgBase }}
    >
      {/* 배경 스크린샷 레이어 (있을 때만) */}
      {scene.background && (
        <SceneBackgroundLayer
          config={scene.background}
          frame={frame}
          durationFrames={scene.duration_frames}
        />
      )}

      {!scene.background && ambientConfig.preset !== "none" && (
        <AmbientBackground
          config={ambientConfig}
          accentColor={theme.accent}
          frame={frame}
          durationFrames={scene.duration_frames}
        />
      )}

      {/* 깊이감 레이어 — 배경과 콘텐츠 사이 */}
      <DepthOverlay
        palette={getPaletteForScene(sceneIndex)}
        frame={frame}
        durationFrames={scene.duration_frames}
        intensity={scene.background ? 0.4 : 0.6}
        vignetteStrength={scene.background ? 0.3 : 0.4}
      />

      {/* 콘텐츠 영역 (TypographyContext 제공) */}
      <TypographyContext.Provider value={typography}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: contentPadding,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </TypographyContext.Provider>

      {/* 캐릭터 오버레이 — 콘텐츠 밖, 화면 가장자리에 절대 배치 */}
      {character && charProgress > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            [character.position]: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            opacity: charProgress,
            transform: `translateY(${(1 - charProgress) * 30}px)`,
            zIndex: 5,
          }}
        >
          {/* 말풍선 */}
          {character.bubble && bubbleProgress > 0 && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 16,
                padding: "8px 16px",
                maxWidth: 180,
                textAlign: "center",
                opacity: bubbleProgress,
                transform: `scale(${0.8 + bubbleProgress * 0.2})`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
              >
                {character.bubble}
              </span>
            </div>
          )}
          {/* 캐릭터 이미지 */}
          {character.src.endsWith(".gif") ? (
            <Gif
              src={staticFile(character.src)}
              height={character.maxHeight}
              fit="contain"
              style={{ maxHeight: character.maxHeight }}
            />
          ) : (
            <img
              src={staticFile(character.src)}
              alt="character"
              style={{
                maxHeight: character.maxHeight,
                objectFit: "contain",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
              }}
            />
          )}
        </div>
      )}

      {/* SFX 오디오 트랙 — stack_root 에서 수집해 Shell 레벨에 직접 마운트 */}
      {sfxNodes.map((sfx) => (
        <Sequence key={sfx.id} from={sfx.startFrame}>
          <Audio
            src={sfx.src.startsWith("http") ? sfx.src : staticFile(sfx.src)}
            volume={sfx.volume}
          />
        </Sequence>
      ))}

      {/* 자막 바 */}
      <SubtitleBar
        text={scene.narration ?? ""}
        subtitles={scene.subtitles}
        frame={frame}
        sceneStartSec={scene.start_ms / 1000}
        mode={scene.shot_plan?.caption_mode ?? "bottom-bar"}
      />
    </AbsoluteFill>
  );
};
