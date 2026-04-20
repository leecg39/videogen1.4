import { buildSubtitleEntries } from "./subtitle-splitter";

export interface SceneBlockBeat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  text: string;
  semantic: {
    intent: string;
    tone: string;
    evidence_type: string;
    emphasis_tokens: string[];
    density: number;
  };
  shot_plan?: {
    shot_type?: string;
    [key: string]: unknown;
  };
}

export interface SceneBlock {
  scene_index: number;
  beat_range: [number, number];
  beats: SceneBlockBeat[];
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  duration_ms: number;
  duration_frames: number;
  beat_count: number;
  text: string;
  subtitles: Array<{ startTime: number; endTime: number; text: string }>;
}

const FPS = 30;
const TARGET_SCENE_MS = 8500;
const MIN_SCENE_MS = 5500;
const MAX_SCENE_MS = 14000;
const MIN_BEATS_PER_SCENE = 2;
const MAX_BEATS_PER_SCENE = 4;

const CONNECTOR_PREFIXES = [
  "그런데",
  "하지만",
  "다만",
  "또",
  "또한",
  "그리고",
  "즉",
  "다시 말해",
  "예를 들어",
  "예컨대",
  "한편",
  "반면",
  "결국",
  "그래서",
  "바로 여기서",
  "문제는",
];

const STRONG_START_PREFIXES = [
  "핵심은",
  "중요한 건",
  "정리하면",
  "결론적으로",
  "첫째",
  "둘째",
  "셋째",
  "이제",
  "다음은",
];

const STOPWORDS = new Set([
  "그리고",
  "그러나",
  "하지만",
  "그래서",
  "이제",
  "정말",
  "아주",
  "그냥",
  "이번",
  "또한",
  "에서",
  "으로",
  "이다",
  "입니다",
  "있습니다",
  "하는",
  "하는데",
  "있는",
  "하게",
  "대한",
]);

function startsWithAny(text: string, prefixes: string[]): boolean {
  const normalized = text.trim();
  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

function extractKeywords(text: string): string[] {
  return text
    .split(/[\s,./!?()[\]{}"'`~:;|+-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOPWORDS.has(token))
    .slice(0, 8);
}

function hasKeywordOverlap(current: SceneBlockBeat[], next: SceneBlockBeat): boolean {
  const currentKeywords = new Set(
    current.flatMap((beat) => extractKeywords(beat.text))
  );
  return extractKeywords(next.text).some((kw) => currentKeywords.has(kw));
}

function isConnectorBeat(beat: SceneBlockBeat): boolean {
  return beat.text.trim().length <= 18 && startsWithAny(beat.text, CONNECTOR_PREFIXES);
}

function isContinuationBeat(beat: SceneBlockBeat): boolean {
  return (
    isConnectorBeat(beat) ||
    startsWithAny(beat.text, CONNECTOR_PREFIXES) ||
    beat.text.trim().length <= 28
  );
}

function isStrongStandaloneBeat(beat: SceneBlockBeat): boolean {
  const duration = beat.end_ms - beat.start_ms;
  return (
    duration >= 4500 &&
    (beat.semantic.intent === "compare" ||
      beat.semantic.intent === "emphasize" ||
      beat.semantic.evidence_type === "statistic" ||
      beat.semantic.evidence_type === "quote")
  );
}

function isStrongStarter(beat: SceneBlockBeat): boolean {
  return (
    startsWithAny(beat.text, STRONG_START_PREFIXES) ||
    (beat.semantic.intent === "transition" && /다음|넘어가|이어서/.test(beat.text)) ||
    beat.semantic.intent === "compare" ||
    beat.semantic.intent === "list" ||
    beat.semantic.intent === "sequence"
  );
}

function buildSceneBlock(sceneIndex: number, beats: SceneBlockBeat[]): SceneBlock {
  const first = beats[0];
  const last = beats[beats.length - 1];

  return {
    scene_index: sceneIndex,
    beat_range: [first.beat_index, last.beat_index],
    beats,
    start_ms: first.start_ms,
    end_ms: last.end_ms,
    start_frame: first.start_frame,
    end_frame: last.end_frame,
    duration_ms: last.end_ms - first.start_ms,
    duration_frames: Math.round(((last.end_ms - first.start_ms) / 1000) * FPS),
    beat_count: beats.length,
    text: beats.map((beat) => beat.text.trim()).join(" ").trim(),
    subtitles: beats.flatMap((beat) =>
      buildSubtitleEntries(beat.text, beat.start_ms, beat.end_ms, first.start_ms),
    ),
  };
}

function shouldSplitScene(current: SceneBlockBeat[], next: SceneBlockBeat): boolean {
  const block = buildSceneBlock(0, current);
  const nextDuration = next.end_ms - block.start_ms;

  if (current.length === 0) return false;
  if (current.length >= MAX_BEATS_PER_SCENE) return true;
  if (nextDuration > MAX_SCENE_MS) return true;
  if (current.length < MIN_BEATS_PER_SCENE) return false;
  if (block.duration_ms < MIN_SCENE_MS) return false;
  if (isConnectorBeat(next)) return false;

  const sameIntent = current.some((beat) => beat.semantic.intent === next.semantic.intent);
  const related = hasKeywordOverlap(current, next) || sameIntent;

  if (
    next.semantic.intent === "transition" &&
    block.duration_ms >= MIN_SCENE_MS
  ) {
    return true;
  }

  if (isContinuationBeat(next) && related) return false;

  if (
    current.length === 1 &&
    isStrongStandaloneBeat(current[0]) &&
    !isContinuationBeat(next)
  ) {
    return true;
  }

  if (block.duration_ms >= TARGET_SCENE_MS && isStrongStarter(next)) return true;
  if (block.duration_ms >= TARGET_SCENE_MS && !related) return true;

  return false;
}

export function groupBeatsIntoSceneBlocks(beats: SceneBlockBeat[]): SceneBlock[] {
  if (beats.length === 0) return [];

  const blocks: SceneBlock[] = [];
  let cursor: SceneBlockBeat[] = [];

  for (const beat of beats) {
    if (cursor.length === 0) {
      cursor.push(beat);
      continue;
    }

    if (shouldSplitScene(cursor, beat)) {
      blocks.push(buildSceneBlock(blocks.length, cursor));
      cursor = [beat];
      continue;
    }

    cursor.push(beat);
  }

  if (cursor.length > 0) {
    blocks.push(buildSceneBlock(blocks.length, cursor));
  }

  return blocks;
}
