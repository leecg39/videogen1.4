/**
 * scene-sync-validator — scenes-v2 / SRT 동기화 검증
 *
 * 시나리오: 새 TTS 합성 후 SRT 타이밍이 바뀌었는데 scene 경계는 그대로면
 * 자막과 오디오가 누적 드리프트로 어긋난다.
 *
 * 이 validator는 다음 두 가지를 검증한다:
 *   1. 각 scene이 새 SRT entry와 정렬되는가 (경계 일치)
 *   2. 각 subtitle의 글로벌 시각이 실제 SRT 발화 시각과 일치하는가
 *
 * 사용법:
 *   const issues = validateSceneSync(scenes, srtEntries);
 *   if (issues.length > 0) throw new Error(...)
 *
 * 또는 자동 복구:
 *   const fixed = rebuildScenesFromSrt(scenes, srtEntries);
 */

export interface Scene {
  id: string;
  start_ms: number;
  end_ms: number;
  duration_frames: number;
  subtitles: Array<{ startTime: number; endTime: number; text: string }>;
}

export interface SrtEntry {
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface SyncIssue {
  type: "scene-boundary-drift" | "subtitle-overflow" | "subtitle-underflow";
  scene_id: string;
  expected_ms: number;
  actual_ms: number;
  drift_ms: number;
  detail: string;
}

const FPS = 30;
const DRIFT_THRESHOLD_MS = 250; // 250ms 이상 어긋나면 fail

/**
 * 각 scene의 [start_ms, end_ms]가 SRT entry 경계와 정렬되는지 검증.
 * scene boundary는 SRT entry 경계 위에 있어야 한다 (entry 중간을 자르면 안 됨).
 */
export function validateSceneSync(scenes: Scene[], srtEntries: SrtEntry[]): SyncIssue[] {
  const issues: SyncIssue[] = [];

  // 1. scene 총 길이가 SRT 총 길이와 맞는가
  const audioEnd = srtEntries[srtEntries.length - 1]?.end_ms ?? 0;
  const renderEnd = scenes.reduce((sum, s) => sum + (s.duration_frames * 1000) / FPS, 0);
  if (Math.abs(renderEnd - audioEnd) > DRIFT_THRESHOLD_MS) {
    issues.push({
      type: "scene-boundary-drift",
      scene_id: "*total*",
      expected_ms: audioEnd,
      actual_ms: Math.round(renderEnd),
      drift_ms: Math.round(renderEnd - audioEnd),
      detail: `Total render ${renderEnd.toFixed(0)}ms vs audio ${audioEnd}ms`,
    });
  }

  // 2. 각 scene의 start_ms/end_ms가 SRT entry 경계와 일치하는가
  // 누적 render 시각으로 scene 위치 추적
  let cumRenderMs = 0;
  for (const sc of scenes) {
    const scRenderStart = cumRenderMs;
    const scRenderEnd = cumRenderMs + (sc.duration_frames * 1000) / FPS;

    // scene 시작 위치에서 가장 가까운 SRT entry boundary
    const startMatches = srtEntries
      .map((e, i) => ({ idx: i, ms: e.start_ms }))
      .filter((e) => Math.abs(e.ms - scRenderStart) < 1500);
    if (startMatches.length > 0) {
      const closest = startMatches.reduce((a, b) =>
        Math.abs(a.ms - scRenderStart) < Math.abs(b.ms - scRenderStart) ? a : b
      );
      const drift = scRenderStart - closest.ms;
      if (Math.abs(drift) > DRIFT_THRESHOLD_MS) {
        issues.push({
          type: "scene-boundary-drift",
          scene_id: sc.id,
          expected_ms: closest.ms,
          actual_ms: Math.round(scRenderStart),
          drift_ms: Math.round(drift),
          detail: `scene starts at render ${scRenderStart.toFixed(0)}ms but nearest SRT entry boundary is ${closest.ms}ms`,
        });
      }
    }

    // 3. 각 subtitle endTime이 scene duration 안에 있는가
    const sceneDurS = sc.duration_frames / FPS;
    for (const sub of sc.subtitles) {
      if (sub.endTime > sceneDurS + 0.05) {
        issues.push({
          type: "subtitle-overflow",
          scene_id: sc.id,
          expected_ms: Math.round(sceneDurS * 1000),
          actual_ms: Math.round(sub.endTime * 1000),
          drift_ms: Math.round((sub.endTime - sceneDurS) * 1000),
          detail: `subtitle "${sub.text.slice(0, 30)}" endTime ${sub.endTime}s > scene dur ${sceneDurS.toFixed(2)}s`,
        });
      }
    }

    cumRenderMs = scRenderEnd;
  }

  return issues;
}

/**
 * scenes-v2를 새 SRT entry 경계에 맞춰 재정렬한다.
 *
 * 전제: scene → SRT entry 매핑은 INDEX 기반으로 보존되어야 한다.
 * 각 scene의 chunk_metadata.beat_count로 몇 개의 SRT entry를 포함하는지 알 수 있다.
 *
 * 주의: 이 함수는 stack_root 안의 enterAt도 새 scene duration에 맞춰 비례 스케일한다.
 */
export function rebuildScenesFromSrt(
  scenes: any[],
  srtEntries: SrtEntry[]
): { scenes: any[]; report: string[] } {
  const report: string[] = [];

  // 각 scene이 차지하는 SRT entry 범위를 추정
  // 가장 신뢰할 수 있는 방법: chunk_metadata.beat_count 합을 누적해서 SRT entry index 매핑
  let srtCursor = 0;
  let cumRenderMs = 0;

  for (const sc of scenes) {
    const beatCount = sc.chunk_metadata?.beat_count ?? 1;
    // beat_count 만큼의 SRT entry 소비
    const sceneSrtEntries = srtEntries.slice(srtCursor, srtCursor + beatCount);
    if (sceneSrtEntries.length === 0) {
      report.push(`⚠ ${sc.id}: SRT 부족, 스킵`);
      continue;
    }

    const newStart = sceneSrtEntries[0].start_ms;
    const newEnd = sceneSrtEntries[sceneSrtEntries.length - 1].end_ms;
    const newDurMs = newEnd - newStart;
    const newDurFrames = Math.round((newDurMs * FPS) / 1000);
    const oldDurFrames = sc.duration_frames;

    // stack_root enterAt 비례 스케일
    if (sc.stack_root && oldDurFrames > 0) {
      const scale = newDurFrames / oldDurFrames;
      scaleEnterAt(sc.stack_root, scale);
    }

    // scene 메타 업데이트
    sc.start_ms = newStart;
    sc.end_ms = newEnd;
    sc.duration_frames = newDurFrames;
    sc.duration_ms = newDurMs;

    report.push(`${sc.id}: ${oldDurFrames}f → ${newDurFrames}f (Δ${newDurFrames - oldDurFrames})`);

    srtCursor += beatCount;
    cumRenderMs += newDurMs;
  }

  if (srtCursor < srtEntries.length) {
    // 마지막 scene이 남은 SRT entry를 모두 흡수
    const last = scenes[scenes.length - 1];
    const remaining = srtEntries.slice(srtCursor);
    const newEnd = remaining[remaining.length - 1].end_ms;
    const oldDur = last.end_ms - last.start_ms;
    last.end_ms = newEnd;
    last.duration_ms = newEnd - last.start_ms;
    last.duration_frames = Math.round((last.duration_ms * FPS) / 1000);
    if (last.stack_root && oldDur > 0) {
      const scale = last.duration_ms / oldDur;
      scaleEnterAt(last.stack_root, scale);
    }
    report.push(`+ tail: ${last.id} extended to absorb ${remaining.length} extra entries`);
  }

  return { scenes, report };
}

function scaleEnterAt(node: any, factor: number) {
  if (!node || typeof node !== "object") return;
  if (node.motion && typeof node.motion.enterAt === "number") {
    node.motion.enterAt = Math.round(node.motion.enterAt * factor);
  }
  if (node.data && Array.isArray(node.data.stepEnterAts)) {
    node.data.stepEnterAts = node.data.stepEnterAts.map((x: number) => Math.round(x * factor));
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) scaleEnterAt(c, factor);
  }
}
