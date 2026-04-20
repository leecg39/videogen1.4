/**
 * measure-sync.ts — Frozen Metric for autoresearch
 * ⚠️ 이 파일은 수정 금지 (Frozen Metric 원칙)
 *
 * 자막-장면 싱크 품질을 0~100 점수로 측정한다.
 *
 * 측정 항목 (5개, 각 20점):
 *   1. timing_accuracy:  scene.start_ms/end_ms가 beat와 일치하는가
 *   2. duration_accuracy: duration_frames가 올바르게 계산되었는가
 *   3. enterAt_coverage:  콘텐츠 노드가 씬 구간에 골고루 분포하는가
 *   4. keyword_match:     enterAt이 자막 키워드 시점과 일치하는가
 *   5. gap_quality:       5초 이상 공백/동시 등장이 없는가
 *
 * 사용법:
 *   npx tsx scripts/autoresearch/measure-sync.ts data/rag3
 *   npx tsx scripts/autoresearch/measure-sync.ts data/rag3 data/saas-fullstack
 */

import * as fs from "fs";
import * as path from "path";

const FPS = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Beat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  text: string;
}

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface MotionDef {
  preset?: string;
  enterAt?: number;
}

interface StackNode {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  motion?: MotionDef;
  children?: StackNode[];
}

interface Scene {
  id: string;
  beat_index: number;
  start_ms: number;
  end_ms: number;
  duration_frames: number;
  stack_root?: StackNode;
  subtitles?: Subtitle[];
  narration?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const HEADER_TYPES = new Set([
  "Badge", "Icon", "Kicker", "Headline", "Divider", "AccentRing",
]);

function collectMotionNodes(node: StackNode): StackNode[] {
  const result: StackNode[] = [];
  function walk(n: StackNode) {
    if (n.motion?.enterAt !== undefined) result.push(n);
    if (n.children) n.children.forEach(walk);
  }
  if (node.children) node.children.forEach(walk);
  return result;
}

function extractNodeText(node: StackNode): string {
  const parts: string[] = [];
  function collect(n: StackNode) {
    const d = (n.data ?? {}) as Record<string, unknown>;
    for (const key of ["text", "title", "body", "label", "desc", "step"]) {
      if (typeof d[key] === "string") parts.push(d[key] as string);
    }
    if (d.value !== undefined) parts.push(String(d.value));
    if (Array.isArray(d.items)) {
      for (const item of d.items) {
        if (typeof item === "string") parts.push(item);
        else if (item?.label) parts.push(item.label);
        else if (item?.title) parts.push(item.title);
      }
    }
    if (n.children) n.children.forEach(collect);
  }
  collect(node);
  return parts.join(" ");
}

function extractKeywords(text: string): string[] {
  const clean = text
    .replace(/\n/g, " ")
    .replace(/[✕✓→↑↓↗=•·\-–—|:;,.\[\](){}'"「」『』""''/\\]/g, " ");
  return [...new Set(clean.split(/\s+/).filter(t => t.length >= 2))];
}

// ---------------------------------------------------------------------------
// Metric 1: Timing Accuracy (20pts)
// scene.start_ms/end_ms가 beats에서 유래한 값과 일치하는가
// ---------------------------------------------------------------------------
function measureTimingAccuracy(scenes: Scene[], beats: Beat[]): number {
  if (beats.length === 0) return 20; // beats 없으면 skip (만점 처리)

  let correct = 0;
  let total = 0;

  for (const scene of scenes) {
    const beat = beats.find(b => b.beat_index === scene.beat_index);
    if (!beat) continue;
    total += 2; // start + end 각각 체크
    if (Math.abs(scene.start_ms - beat.start_ms) <= 50) correct++;
    if (Math.abs(scene.end_ms - beat.end_ms) <= 50) correct++;
  }

  if (total === 0) return 20;
  return Math.round((correct / total) * 20 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Metric 2: Duration Accuracy (20pts)
// duration_frames = round((end_ms - start_ms) / 1000 * 30) ± transition
// ---------------------------------------------------------------------------
function measureDurationAccuracy(scenes: Scene[]): number {
  let correct = 0;
  let total = 0;

  for (const scene of scenes) {
    const expected = Math.round(((scene.end_ms - scene.start_ms) / 1000) * FPS);
    total++;
    // transition compensation: 최대 25프레임 차이 허용
    const diff = Math.abs(scene.duration_frames - expected);
    if (diff <= 25) {
      correct += 1 - (diff / 25) * 0.3; // 정확할수록 높은 점수
    }
  }

  if (total === 0) return 20;
  return Math.round((correct / total) * 20 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Metric 3: enterAt Coverage (20pts)
// 콘텐츠 노드가 씬 구간 전체에 골고루 분포하는가
// ---------------------------------------------------------------------------
function measureEnterAtCoverage(scenes: Scene[]): number {
  let totalScore = 0;
  let totalScenes = 0;

  for (const scene of scenes) {
    if (!scene.stack_root) continue;
    const nodes = collectMotionNodes(scene.stack_root);
    const contentNodes = nodes.filter(n => !HEADER_TYPES.has(n.type));
    if (contentNodes.length < 2) continue;

    totalScenes++;
    const dur = scene.duration_frames;
    const enterAts = contentNodes.map(n => n.motion!.enterAt!).sort((a, b) => a - b);

    // 이상적 분포: 15%~80% 구간에 균등 분포
    const idealStart = dur * 0.15;
    const idealEnd = dur * 0.80;
    const idealRange = idealEnd - idealStart;
    const idealStep = idealRange / (enterAts.length - 1 || 1);

    let coverageScore = 0;

    // (a) 실제 범위가 이상적 범위에 가까운가 (50%)
    const actualRange = enterAts[enterAts.length - 1] - enterAts[0];
    const rangeCoverage = Math.min(1, actualRange / idealRange);
    coverageScore += rangeCoverage * 0.5;

    // (b) 분포 균일성 — 인접 간격의 표준편차가 작은가 (30%)
    if (enterAts.length >= 3) {
      const gaps: number[] = [];
      for (let i = 1; i < enterAts.length; i++) {
        gaps.push(enterAts[i] - enterAts[i - 1]);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length;
      const cv = avgGap > 0 ? Math.sqrt(variance) / avgGap : 1; // coefficient of variation
      const uniformity = Math.max(0, 1 - cv);
      coverageScore += uniformity * 0.3;
    } else {
      coverageScore += 0.15;
    }

    // (c) 첫 콘텐츠 노드가 너무 늦거나 마지막이 너무 빠르지 않은가 (20%)
    const firstOk = enterAts[0] >= idealStart * 0.5 && enterAts[0] <= idealStart * 2;
    const lastOk = enterAts[enterAts.length - 1] >= idealEnd * 0.6;
    coverageScore += (firstOk ? 0.1 : 0) + (lastOk ? 0.1 : 0);

    totalScore += coverageScore;
  }

  if (totalScenes === 0) return 15;
  return Math.round((totalScore / totalScenes) * 20 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Metric 4: Keyword Match (20pts)
// enterAt이 자막 키워드 시점과 일치하는가
// ---------------------------------------------------------------------------
function measureKeywordMatch(scenes: Scene[]): number {
  let totalNodes = 0;
  let matchedNodes = 0;
  let timingAccuracy = 0;

  for (const scene of scenes) {
    if (!scene.stack_root || !scene.subtitles || scene.subtitles.length === 0) continue;

    const nodes = collectMotionNodes(scene.stack_root);
    const contentNodes = nodes.filter(n => !HEADER_TYPES.has(n.type));
    const sceneStartSec = scene.start_ms / 1000;

    for (const node of contentNodes) {
      const nodeText = extractNodeText(node);
      const keywords = extractKeywords(nodeText);
      if (keywords.length === 0) continue;

      totalNodes++;

      // 최적 자막 매칭 찾기
      let bestScore = 0;
      let bestSubIdx = -1;
      for (let si = 0; si < scene.subtitles.length; si++) {
        let score = 0;
        for (const kw of keywords) {
          if (scene.subtitles[si].text.includes(kw)) score += kw.length;
        }
        if (score > bestScore) {
          bestScore = score;
          bestSubIdx = si;
        }
      }

      if (bestScore >= 2 && bestSubIdx >= 0) {
        matchedNodes++;

        // enterAt이 매칭된 자막 시점과 얼마나 가까운가
        // subtitles.startTime이 절대 시간이면 sceneStart를 빼고, 상대 시간이면 그대로 사용
        const rawStart = scene.subtitles[bestSubIdx].startTime;
        const isRelative = rawStart < (scene.end_ms - scene.start_ms) / 1000 + 1;
        const subFrame = Math.round((isRelative ? rawStart : rawStart - sceneStartSec) * FPS);
        const enterAt = node.motion?.enterAt ?? 0;
        const timingDiff = Math.abs(enterAt - subFrame);
        // 1초(30프레임) 이내면 정확, 2초 이내면 부분 점수
        timingAccuracy += timingDiff <= 30 ? 1 : timingDiff <= 60 ? 0.5 : 0.1;
      }
    }
  }

  if (totalNodes === 0) return 15;

  // 매칭률 (50%) + 타이밍 정확도 (50%)
  const matchRate = matchedNodes / totalNodes;
  const accuracyRate = matchedNodes > 0 ? timingAccuracy / matchedNodes : 0;
  const score = (matchRate * 0.5 + accuracyRate * 0.5) * 20;

  return Math.round(score * 100) / 100;
}

// ---------------------------------------------------------------------------
// Metric 5: Gap Quality (20pts)
// 5초 이상 공백이나 동시 등장이 없는가
// ---------------------------------------------------------------------------
function measureGapQuality(scenes: Scene[]): number {
  let totalScenes = 0;
  let goodScenes = 0;

  for (const scene of scenes) {
    if (!scene.stack_root) continue;
    const nodes = collectMotionNodes(scene.stack_root);
    if (nodes.length < 2) continue;

    totalScenes++;
    const dur = scene.duration_frames;
    const enterAts = nodes.map(n => n.motion!.enterAt!).sort((a, b) => a - b);

    let penalties = 0;

    // (a) 5초(150프레임) 이상 공백 페널티
    for (let i = 1; i < enterAts.length; i++) {
      const gap = enterAts[i] - enterAts[i - 1];
      if (gap > 150) penalties += 0.3;
      else if (gap > 90) penalties += 0.1; // 3초 이상도 약간 감점
    }

    // (b) 마지막 노드 이후 40% 이상 빈 구간
    const deadTail = dur - enterAts[enterAts.length - 1];
    if (deadTail > dur * 0.4) penalties += 0.3;
    else if (deadTail > dur * 0.3) penalties += 0.1;

    // (c) 동시 등장 (같은 프레임) 페널티
    const duplicates = enterAts.length - new Set(enterAts).size;
    penalties += duplicates * 0.15;

    // (d) 0프레임 이하 enterAt 페널티 (헤더 제외)
    const contentNodes = nodes.filter(n => !HEADER_TYPES.has(n.type));
    const negativeEnterAt = contentNodes.filter(n => (n.motion?.enterAt ?? 0) < 0).length;
    penalties += negativeEnterAt * 0.2;

    goodScenes += Math.max(0, 1 - penalties);
  }

  if (totalScenes === 0) return 15;
  return Math.round((goodScenes / totalScenes) * 20 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function measureProject(projectDir: string): {
  timing: number;
  duration: number;
  coverage: number;
  keyword: number;
  gap: number;
  total: number;
} {
  const scenesPath = path.join(projectDir, "scenes-v2.json");
  const beatsPath = path.join(projectDir, "beats.json");

  if (!fs.existsSync(scenesPath)) {
    console.error(`  ❌ scenes-v2.json not found in ${projectDir}`);
    return { timing: 0, duration: 0, coverage: 0, keyword: 0, gap: 0, total: 0 };
  }

  const raw = fs.readFileSync(scenesPath, "utf-8");
  const parsed = JSON.parse(raw);
  const scenes: Scene[] = Array.isArray(parsed) ? parsed : parsed.scenes ?? [];

  let beats: Beat[] = [];
  if (fs.existsSync(beatsPath)) {
    beats = JSON.parse(fs.readFileSync(beatsPath, "utf-8"));
  }

  const timing = measureTimingAccuracy(scenes, beats);
  const duration = measureDurationAccuracy(scenes);
  const coverage = measureEnterAtCoverage(scenes);
  const keyword = measureKeywordMatch(scenes);
  const gap = measureGapQuality(scenes);
  const total = Math.round((timing + duration + coverage + keyword + gap) * 100) / 100;

  return { timing, duration, coverage, keyword, gap, total };
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: npx tsx scripts/autoresearch/measure-sync.ts <projectDir> [projectDir2 ...]");
  process.exit(1);
}

let grandTotal = 0;
const results: { project: string; scores: ReturnType<typeof measureProject> }[] = [];

for (const dir of args) {
  const projectName = path.basename(dir);
  const scores = measureProject(dir);
  results.push({ project: projectName, scores });
  grandTotal += scores.total;
}

// Output
console.log("\n=== Sync Quality Report ===");
console.log("─".repeat(70));
console.log(
  "project".padEnd(20) +
  "timing".padStart(8) +
  "duration".padStart(10) +
  "coverage".padStart(10) +
  "keyword".padStart(10) +
  "gap".padStart(8) +
  "TOTAL".padStart(8)
);
console.log("─".repeat(70));

for (const r of results) {
  const s = r.scores;
  console.log(
    r.project.padEnd(20) +
    s.timing.toFixed(1).padStart(8) +
    s.duration.toFixed(1).padStart(10) +
    s.coverage.toFixed(1).padStart(10) +
    s.keyword.toFixed(1).padStart(10) +
    s.gap.toFixed(1).padStart(8) +
    s.total.toFixed(1).padStart(8)
  );
}

console.log("─".repeat(70));
const avgTotal = grandTotal / results.length;
console.log(`sync_score: ${avgTotal.toFixed(2)}`);
