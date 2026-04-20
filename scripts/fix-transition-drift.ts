/**
 * fix-transition-drift.ts -- TransitionSeries 오버랩으로 인한 누적 드리프트 보정
 *
 * 문제:
 *   TransitionSeries에서 transition은 두 씬이 겹치는 구간이다.
 *   즉, transition.durationFrames만큼 다음 씬이 앞당겨진다.
 *   50씬 × 평균 20프레임 = 1000프레임(33초) 누적 드리프트 발생.
 *   결과: 오디오와 비주얼이 심각하게 어긋남.
 *
 * 해결:
 *   각 씬의 duration_frames에 해당 씬의 transition.durationFrames를 더한다.
 *   이렇게 하면 TransitionSeries가 오버랩을 빼도 원래 오디오 타이밍과 일치.
 *
 * 사용법:
 *   npx tsx scripts/fix-transition-drift.ts data/{id}/scenes-v2.json
 */

import * as fs from "fs";

const FPS = 30;

interface Scene {
  id: string;
  start_ms: number;
  end_ms: number;
  duration_frames: number;
  transition?: { type: string; durationFrames?: number };
  [key: string]: any;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/fix-transition-drift.ts data/{id}/scenes-v2.json");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
// Support both plain array and { scenes: [...] } wrapper
const scenes: Scene[] = Array.isArray(raw) ? raw : raw.scenes ?? [];

let totalCorrected = 0;

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const tr = scene.transition;

  // 항상 start_ms/end_ms에서 재계산 (멱등)
  const baseDuration = Math.round(((scene.end_ms - scene.start_ms) / 1000) * FPS);

  // 마지막 씬은 트랜지션 없음
  const isLast = i === scenes.length - 1;

  if (tr && tr.type !== "none" && tr.durationFrames && tr.durationFrames > 0) {
    // 명시적 transition 필드가 있으면 그 값 사용
    const corrected = baseDuration + tr.durationFrames;
    if (scene.duration_frames !== corrected) {
      totalCorrected++;
    }
    scene.duration_frames = corrected;
  } else if (!isLast && !(tr && tr.type === "none")) {
    // transition 필드가 없어도, 마지막 씬이 아니고 type이 "none"이 아니면
    // Composition.tsx autoSelectTransition()이 기본 20프레임 트랜지션을 적용하므로 보상
    const DEFAULT_TRANSITION_FRAMES = 20;
    const corrected = baseDuration + DEFAULT_TRANSITION_FRAMES;
    if (scene.duration_frames !== corrected) {
      totalCorrected++;
    }
    scene.duration_frames = corrected;
  } else {
    // 마지막 씬: 트랜지션 없음
    if (scene.duration_frames !== baseDuration) {
      totalCorrected++;
    }
    scene.duration_frames = baseDuration;
  }
}

const output = Array.isArray(raw) ? scenes : { ...raw, scenes };
fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

console.log(`✅ fix-transition-drift: ${totalCorrected}개 씬 duration 재계산 (멱등)`);
console.log(`   start_ms/end_ms 기준 baseDuration + transition 보정`);
