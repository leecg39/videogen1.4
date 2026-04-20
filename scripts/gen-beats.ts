/**
 * 범용 beats.json 생성 스크립트
 * Usage: npx tsx scripts/gen-beats.ts {projectId}
 *
 * project.json에서 srt_path를 읽어 SRT를 파싱하고 beats.json을 생성합니다.
 * 어떤 프로젝트든 동일하게 동작합니다.
 */
import { parseSRT } from "../src/services/srt-parser";
import * as fs from "fs";
import * as path from "path";

const projectId = process.argv[2];
if (!projectId) {
  console.error("Usage: npx tsx scripts/gen-beats.ts <projectId>");
  process.exit(1);
}

const dataDir = path.join(process.cwd(), "data", projectId);
const projPath = path.join(dataDir, "project.json");

if (!fs.existsSync(projPath)) {
  console.error(`프로젝트 없음: ${projPath}`);
  process.exit(1);
}

const project = JSON.parse(fs.readFileSync(projPath, "utf-8"));
const srtPath = path.join(dataDir, project.srt_path);

if (!fs.existsSync(srtPath)) {
  console.error(`SRT 없음: ${srtPath}`);
  process.exit(1);
}

const srtContent = fs.readFileSync(srtPath, "utf-8");
const entries = parseSRT(srtContent);

if (entries.length === 0) {
  console.error("SRT 파싱 결과가 비어있습니다");
  process.exit(1);
}

function analyzeSemantics(text: string) {
  let intent = "explain";
  if (/비교|반면|대신|차이|vs|반대/.test(text)) intent = "compare";
  else if (/첫째|둘째|셋째|먼저|다음|또한|그리고/.test(text)) intent = "list";
  else if (/중요|핵심|절대|반드시|꼭|진짜|정말/.test(text)) intent = "emphasize";
  else if (/예를 들|예시|사례|실제로|실험/.test(text)) intent = "example";
  else if (/란\s|이란|뜻은|의미는|정의/.test(text)) intent = "define";

  let tone = "neutral";
  if (/놀라|대단|혁신|혁명/.test(text)) tone = "dramatic";
  else if (/일까|는지|할까|인가/.test(text)) tone = "questioning";
  else if (/확실|분명|당연|틀림없/.test(text)) tone = "confident";
  else if (/분석|데이터|통계|수치|퍼센트|%/.test(text)) tone = "analytical";

  let evidence_type = "statement";
  if (/퍼센트|%|\d+배|\d+억|\d+만/.test(text)) evidence_type = "statistic";
  else if (/말했|라고\s|따르면|주장/.test(text)) evidence_type = "quote";
  else if (/예를 들|사례|실제로/.test(text)) evidence_type = "example";
  else if (/란\s|이란|뜻은|정의/.test(text)) evidence_type = "definition";

  const tokens = text
    .replace(/[^\w가-힣\s]/g, "")
    .split(/\s+/)
    .filter((t: string) => t.length >= 2)
    .slice(0, 5);

  const density = Math.min(5, Math.max(1, Math.ceil(text.length / 15)));

  return { intent, tone, evidence_type, emphasis_tokens: tokens, density };
}

const beats = entries.map((entry, i) => ({
  beat_index: i,
  start_ms: entry.startMs,
  end_ms: entry.endMs,
  start_frame: entry.startFrame,
  end_frame: entry.endFrame,
  text: entry.text,
  semantic: analyzeSemantics(entry.text),
}));

fs.writeFileSync(path.join(dataDir, "beats.json"), JSON.stringify(beats, null, 2));

// Update project status
project.status = "chunked";
project.updated_at = new Date().toISOString();
project.total_duration_ms = entries[entries.length - 1].endMs;
fs.writeFileSync(projPath, JSON.stringify(project, null, 2));

const totalMs = project.total_duration_ms;
const mins = Math.floor(totalMs / 60000);
const secs = Math.floor((totalMs % 60000) / 1000);
console.log(`✅ ${projectId}: ${beats.length} beats (${mins}분 ${secs}초)`);
