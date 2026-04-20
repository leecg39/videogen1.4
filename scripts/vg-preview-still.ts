#!/usr/bin/env tsx
/**
 * vg-preview-still — 단일 씬 정적 PNG 추출
 *
 * Section 11 자가 검증 활성화의 전제 도구 (.claude/rules/scene-grammar.md).
 *
 * 사용법:
 *   npx tsx scripts/vg-preview-still.ts {projectId} --scene N [--time hero|start|mid|end]
 *
 * 출력: output/preview/{pid}-scene-{N}-{time}.png
 *
 * hero frame 정의: 씬 내 모든 노드의 (enterAt + duration) 최대값 + 6f 마진.
 * 모션이 다 끝나서 모든 요소가 visible한 첫 정적 프레임.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface MotionLike {
  enterAt?: number;
  duration?: number;
}
interface NodeLike {
  motion?: MotionLike;
  children?: NodeLike[];
}
interface TransitionLike {
  type?: string;
  durationFrames?: number;
}
interface SceneLike {
  id?: string;
  duration_frames?: number;
  start_frame?: number;
  hero_frame_ms?: number;
  stack_root?: NodeLike;
  transition?: TransitionLike;
}

// TransitionSeries 가 transition durationFrames 만큼 앞 씬 마지막과 뒤 씬 처음을
// overlap 시키므로, scene i 의 실제 시작 프레임 = sum(duration[0..i-1]) - sum(transition[0..i-1]).
// v1.1 round 4: sync-render-props 의 autoSelect rotation 도입으로 정확한 보정 필요.
// Composition.tsx 의 autoSelectTransition 이 transition 미지정 시 intent 기반 20f 전후
// transition 을 자동 삽입하므로, 여기서는 DEFAULT 로 20f 가정.
const DEFAULT_TRANSITION_FRAMES = 20;
function transitionOverlap(scene: SceneLike, isLast: boolean): number {
  if (isLast) return 0;
  const t = scene.transition;
  if (t) {
    if (t.type === "none") return 0;
    return t.durationFrames ?? DEFAULT_TRANSITION_FRAMES;
  }
  // autoSelect 위임 — Composition 이 intent 기반으로 15~24f 주입. 평균 20f 추정.
  return DEFAULT_TRANSITION_FRAMES;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  let projectId = "";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[k] = v;
    } else if (!projectId) {
      projectId = a;
    }
  }
  return { projectId, ...args };
}

function findHeroFrame(scene: SceneLike, fps = 30): number {
  if (typeof scene.hero_frame_ms === "number") {
    return Math.round((scene.hero_frame_ms / 1000) * fps);
  }
  let maxEnd = 0;
  function walk(n: NodeLike | undefined) {
    if (!n) return;
    const enterAt = n.motion?.enterAt ?? 0;
    const duration = n.motion?.duration ?? 0;
    const end = enterAt + duration;
    if (end > maxEnd) maxEnd = end;
    (n.children ?? []).forEach(walk);
  }
  walk(scene.stack_root);
  return maxEnd + 6;
}

function computeAbsoluteFrame(
  scenes: SceneLike[],
  sceneIndex: number,
  time: string,
): number {
  const scene = scenes[sceneIndex];
  if (!scene) throw new Error(`scene ${sceneIndex} not found`);
  // v1.1 round 4 regression fix: TransitionSeries overlap 보정.
  const start = scene.start_frame ?? scenes
    .slice(0, sceneIndex)
    .reduce((sum, s, i) => {
      const dur = s.duration_frames ?? 0;
      const overlap = transitionOverlap(s, false);
      return sum + dur - overlap;
    }, 0);
  const dur = scene.duration_frames ?? 90;
  // v1.1 round 4 관찰1 대응: hero 프레임이 다음 씬과의 transition 구간에 걸리면
  // preview 에 두 씬이 겹쳐 보임. transition 시작 전 안전 마진으로 clamp.
  const isLast = sceneIndex === scenes.length - 1;
  const nextTransitionFrames = transitionOverlap(scene, isLast);
  const heroMaxSafe = Math.max(0, dur - nextTransitionFrames - 6);
  let offset: number;
  switch (time) {
    case "start":
      offset = 0;
      break;
    case "mid":
      offset = Math.floor(dur / 2);
      break;
    case "end":
      offset = heroMaxSafe;
      break;
    case "hero":
    default:
      offset = Math.min(findHeroFrame(scene), heroMaxSafe);
      break;
  }
  return start + offset;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.projectId;
  const sceneArg = args.scene;
  const time = (args.time as string) || "hero";

  if (!projectId || !sceneArg) {
    console.error("Usage: vg-preview-still {projectId} --scene N [--time hero|start|mid|end]");
    process.exit(1);
  }
  const sceneIndex = Number(sceneArg);
  if (!Number.isFinite(sceneIndex)) {
    console.error(`--scene must be an integer, got ${sceneArg}`);
    process.exit(1);
  }

  const renderProps = join("data", projectId, "render-props-v2.json");
  if (!existsSync(renderProps)) {
    console.error(`render-props missing: ${renderProps}. run /vg-render postprocess first.`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(renderProps, "utf8"));
  const scenes: SceneLike[] = data.scenes ?? [];
  if (sceneIndex < 0 || sceneIndex >= scenes.length) {
    console.error(`scene index out of range: 0..${scenes.length - 1}`);
    process.exit(1);
  }

  const absoluteFrame = computeAbsoluteFrame(scenes, sceneIndex, time);
  const outDir = join("output", "preview");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${projectId}-scene-${sceneIndex}-${time}.png`);

  console.log(
    `[vg-preview-still] ${projectId} scene=${sceneIndex} time=${time} frame=${absoluteFrame}`,
  );
  console.log(`[vg-preview-still] → ${outPath}`);

  const cmd = [
    "npx",
    "remotion",
    "still",
    "src/remotion/index.ts",
    "MainComposition",
    outPath,
    `--frame=${absoluteFrame}`,
    `--props=${renderProps}`,
  ].join(" ");

  console.log(`[vg-preview-still] ${cmd}`);
  const t0 = Date.now();
  execSync(cmd, { stdio: "inherit" });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[vg-preview-still] done in ${elapsed}s → ${outPath}`);

  const elapsedSec = Number(elapsed);
  if (elapsedSec > 30) {
    console.error(
      `❌ [FAIL:preview:slow] preview took ${elapsedSec}s (>30s HARD GATE — DSL condition ③ violated).`,
    );
    console.error(
      `   Scene grammar v1.1 조건 ③ (preview ≤ 30s) 미통과. DSL 다이어트/노드 단순화 필요.`,
    );
    console.error(
      `   (bypass 없음 — 노드 수 줄이는 것이 유일한 경로.)`,
    );
    process.exit(1);
  }
}

main();
