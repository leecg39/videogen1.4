import * as fs from "fs";
import * as path from "path";

const projectId = process.argv[2];
if (!projectId) { console.error("Usage: npx tsx scripts/auto-scene-split.ts <projectId>"); process.exit(1); }

const dataDir = path.join(process.cwd(), "data", projectId);
const beats: any[] = JSON.parse(fs.readFileSync(path.join(dataDir, "beats.json"), "utf-8"));
const FPS = 30;

// Auto scene splitting heuristic:
// Group beats into scenes of ~15-30 seconds each
const TARGET_SCENE_MS = 20000; // 20 second target
const MIN_SCENE_MS = 8000;     // min 8 seconds
const MAX_SCENE_MS = 40000;    // max 40 seconds

interface ChunkScene {
  scene_index: number;
  srt_range: [number, number];
  start_ms: number;
  end_ms: number;
  duration_s: number;
  subtitle_count: number;
  text: string;
}

const scenes: ChunkScene[] = [];
let sceneStart = 0;
let sceneStartMs = beats[0].start_ms;
let sceneText: string[] = [];

for (let i = 0; i < beats.length; i++) {
  sceneText.push(beats[i].text);
  const elapsed = beats[i].end_ms - sceneStartMs;
  const isLast = i === beats.length - 1;
  const nextElapsed = !isLast ? beats[i + 1].end_ms - sceneStartMs : 0;

  // Split conditions
  const shouldSplit =
    isLast ||
    (elapsed >= TARGET_SCENE_MS && elapsed >= MIN_SCENE_MS) ||
    (nextElapsed > MAX_SCENE_MS);

  if (shouldSplit) {
    scenes.push({
      scene_index: scenes.length,
      srt_range: [sceneStart, i],
      start_ms: sceneStartMs,
      end_ms: beats[i].end_ms,
      duration_s: Math.round((beats[i].end_ms - sceneStartMs) / 1000 * 10) / 10,
      subtitle_count: i - sceneStart + 1,
      text: sceneText.join(" "),
    });
    if (!isLast) {
      sceneStart = i + 1;
      sceneStartMs = beats[i + 1].start_ms;
      sceneText = [];
    }
  }
}

// Save chunks.json
fs.writeFileSync(path.join(dataDir, "chunks.json"), JSON.stringify(scenes, null, 2));

// Generate scenes-v2.json
function pickIcons(text: string): string[] {
  const iconMap: [RegExp, string][] = [
    [/AI|인공지능|모델/, "brain"],
    [/코드|코딩|개발/, "code"],
    [/설계|아키텍처|구조/, "layers"],
    [/가치|핵심|중요/, "sparkles"],
    [/경고|주의|위험/, "alertTriangle"],
    [/철학|사상|생각/, "lightbulb"],
    [/노동|임금|월급/, "briefcase"],
    [/도구|기술|기계/, "tool"],
    [/사람|인간|개발자/, "users"],
    [/질문|물음/, "helpCircle"],
    [/검색|찾/, "search"],
    [/비교|대비|반면/, "gitCompare"],
    [/목록|리스트|정리/, "list"],
    [/시간|기간|날/, "clock"],
    [/돈|비용|가격|단가/, "dollarSign"],
    [/보호|방어|해자/, "shield"],
    [/성장|축적|쌓/, "trendingUp"],
    [/관계|신뢰|팀/, "heart"],
  ];
  const icons: string[] = [];
  for (const [re, icon] of iconMap) {
    if (re.test(text) && icons.length < 2) icons.push(icon);
  }
  if (icons.length === 0) icons.push("sparkles");
  return icons;
}

function extractHeadline(text: string): string {
  const sentences = text.split(/[.?!]\s*/);
  const first = sentences[0] || text;
  if (first.length <= 25) return first;
  const truncated = first.slice(0, 25);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 10 ? truncated.slice(0, lastSpace) : truncated;
}

function guessIntent(text: string): string {
  if (/예를 들|예시/.test(text)) return "example";
  if (/비교|반면/.test(text)) return "compare";
  if (/첫째|둘째|셋째/.test(text)) return "list";
  if (/중요|핵심|특히/.test(text)) return "emphasize";
  if (/정의|란\s|이란/.test(text)) return "define";
  return "explain";
}

function guessLayout(intent: string, density: number): string {
  switch (intent) {
    case "compare": return "split-2col";
    case "list": return density > 3 ? "grid-4x3" : "stacked-vertical";
    case "example": return "spotlight-case";
    case "emphasize": return "hero-center";
    case "define": return "radial-focus";
    default: return "stacked-vertical";
  }
}

const scenesV2 = scenes.map((chunk, idx) => {
  const durationMs = chunk.end_ms - chunk.start_ms;
  const durationFrames = Math.round((durationMs / 1000) * FPS);
  const sceneBeats = beats.filter(b => b.start_ms >= chunk.start_ms && b.end_ms <= chunk.end_ms + 100);
  const subtitles = sceneBeats.map(b => ({
    startTime: (b.start_ms - chunk.start_ms) / 1000,
    endTime: (b.end_ms - chunk.start_ms) / 1000,
    text: b.text,
  }));

  const fullText = chunk.text;
  const intent = sceneBeats.length > 0 ? sceneBeats[0].semantic.intent : guessIntent(fullText);
  const tone = sceneBeats.length > 0 ? sceneBeats[0].semantic.tone : "neutral";
  const evidenceType = sceneBeats.length > 0 ? sceneBeats[0].semantic.evidence_type : "statement";
  const emphasisTokens = sceneBeats.length > 0
    ? sceneBeats[0].semantic.emphasis_tokens
    : fullText.split(/\s+/).filter((t: string) => t.length > 2).slice(0, 5);
  const density = Math.min(5, Math.max(1, Math.ceil(chunk.subtitle_count / 3)));

  const layoutFamily = guessLayout(intent, density);
  const icons = pickIcons(fullText);
  const headline = extractHeadline(fullText);

  return {
    id: `scene-${idx}`,
    project_id: projectId,
    beat_index: idx,
    layout_family: layoutFamily,
    start_ms: chunk.start_ms,
    end_ms: chunk.end_ms,
    duration_frames: durationFrames,
    components: [],
    copy_layers: {
      kicker: idx === 0 ? "INTRO" : null,
      headline,
      supporting: null,
      footer_caption: null,
    },
    motion: { entrance: "fadeUp", emphasis: null, exit: null, duration_ms: durationMs },
    assets: { svg_icons: icons, chart_type: null, chart_data: null },
    chunk_metadata: {
      intent, tone, evidence_type: evidenceType,
      emphasis_tokens: emphasisTokens, density,
      beat_count: sceneBeats.length,
    },
    subtitles,
    narration: fullText,
  };
});

fs.writeFileSync(path.join(dataDir, "scenes-v2.json"), JSON.stringify(scenesV2, null, 2));

// Update project.json
const projPath = path.join(dataDir, "project.json");
const proj = JSON.parse(fs.readFileSync(projPath, "utf-8"));
proj.status = "scened";
proj.updated_at = new Date().toISOString();
fs.writeFileSync(projPath, JSON.stringify(proj, null, 2));

// Summary
const totalMs = scenes[scenes.length - 1].end_ms;
const mins = Math.floor(totalMs / 60000);
const secs = Math.floor((totalMs % 60000) / 1000);
console.log(`✓ ${scenes.length}개 씬 자동 생성 (${mins}분 ${secs}초)`);
scenes.forEach(s => console.log(`  씬 ${s.scene_index}: ${s.duration_s}초, ${s.subtitle_count}개 자막`));
