#!/usr/bin/env tsx
// scripts/svg-forge.ts — SVG Forge CLI
//
// 명령:
//   --seed                  초기 50개 핵심 concept 을 Claude CLI 로 생성
//   --add <concept>         특정 concept 하나 생성 (id 는 자동 kebab-case)
//   --project <pid>         해당 프로젝트의 scenes-v2 에서 누락 asset_id 계산 후 생성
//   --list                  index.json 요약 출력
//   --compile               public/svg-library/assets/*.svg 를 src/remotion/svg-library.generated.tsx 로 컴파일
//   --style-check           저장된 SVG 전체를 검증 (validate-svg-library-style.js 와 동일)
//   --dry-run               Claude 호출 없이 시뮬레이션
//   --force                 이미 존재하는 id 도 덮어쓰기
//
// 환경변수:
//   CLAUDE_BIN              claude CLI 경로 (기본 "claude")
//   SVG_FORGE_MODEL         모델 (기본 claude-sonnet-4-6)
//   SVG_FORGE_MAX_CONCURRENCY  (기본 3)

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  ensureLibraryPaths,
  loadIndex,
  saveIndex,
  registerAsset,
  assetSvgPath,
  findById,
  assetIdSet,
  type SvgAssetEntry,
} from "../src/services/svg-library";
import { sanitizeSvg, validateSavedSvg } from "../src/services/svg-sanitize";

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MODEL = process.env.SVG_FORGE_MODEL || "claude-sonnet-4-6";
const MAX_CONC = Math.max(1, Number(process.env.SVG_FORGE_MAX_CONCURRENCY || 3));

// ---------------------------------------------------------------------------
// Seed concept list (50 — line-art ready)
// ---------------------------------------------------------------------------
const SEED: Array<{ concept: string; category: SvgAssetEntry["category"]; keywords: string[]; note?: string }> = [
  // object (31)
  { concept: "notebook",   category: "object", keywords: ["수첩", "노트", "메모", "기록", "notebook"] },
  { concept: "monitor",    category: "object", keywords: ["모니터", "화면", "디스플레이", "monitor", "screen"] },
  { concept: "laptop",     category: "object", keywords: ["노트북", "랩탑", "laptop"] },
  { concept: "cloud",      category: "object", keywords: ["클라우드", "서버", "cloud"] },
  { concept: "globe",      category: "object", keywords: ["지구", "글로브", "웹", "인터넷", "globe", "web"] },
  { concept: "folder",     category: "object", keywords: ["폴더", "디렉토리", "folder"] },
  { concept: "lock",       category: "object", keywords: ["잠금", "보안", "자물쇠", "lock", "secure"] },
  { concept: "key",        category: "object", keywords: ["키", "열쇠", "비밀번호", "key"] },
  { concept: "server",     category: "object", keywords: ["서버", "기계", "server", "rack"] },
  { concept: "database",   category: "object", keywords: ["데이터베이스", "DB", "저장소", "database"] },
  { concept: "terminal",   category: "object", keywords: ["터미널", "콘솔", "CLI", "terminal", "shell"] },
  { concept: "gear",       category: "object", keywords: ["톱니", "설정", "기어", "gear", "settings"] },
  { concept: "document",   category: "object", keywords: ["문서", "페이지", "document", "file"] },
  { concept: "chart-up",   category: "object", keywords: ["상승", "증가", "성장", "up trend"] },
  { concept: "chart-down", category: "object", keywords: ["하락", "감소", "down trend"] },
  { concept: "bar-chart",  category: "object", keywords: ["막대", "바차트", "bar chart"] },
  { concept: "pie-chart",  category: "object", keywords: ["파이", "비율", "pie chart"] },
  { concept: "ring-chart", category: "object", keywords: ["도넛", "링차트", "ring"] },
  { concept: "calendar",   category: "object", keywords: ["달력", "일정", "calendar"] },
  { concept: "clock",      category: "object", keywords: ["시계", "시간", "clock", "time"] },
  { concept: "hourglass",  category: "object", keywords: ["모래시계", "시간", "hourglass"] },
  { concept: "coin",       category: "object", keywords: ["동전", "돈", "비용", "coin", "money"] },
  { concept: "shield",     category: "object", keywords: ["방패", "보호", "보안", "shield", "protect"] },
  { concept: "briefcase",  category: "object", keywords: ["가방", "비즈니스", "업무", "briefcase"] },
  { concept: "tool",       category: "object", keywords: ["도구", "스패너", "tool", "wrench"] },
  { concept: "rocket",     category: "object", keywords: ["로켓", "출시", "발사", "rocket", "launch"] },
  { concept: "lightbulb",  category: "object", keywords: ["전구", "아이디어", "bulb", "idea"] },
  { concept: "brain",      category: "object", keywords: ["뇌", "생각", "사고", "brain", "think"] },
  { concept: "eye",        category: "object", keywords: ["눈", "관찰", "시선", "eye", "watch"] },
  { concept: "hand",       category: "object", keywords: ["손", "제스처", "hand"] },
  { concept: "target",     category: "object", keywords: ["과녁", "목표", "target", "goal"] },

  // concept (12)
  { concept: "arrow-right",    category: "concept", keywords: ["화살표", "진행", "right arrow"] },
  { concept: "arrow-curve",    category: "concept", keywords: ["곡선 화살표", "전환", "curve arrow"] },
  { concept: "refresh-loop",   category: "concept", keywords: ["순환", "반복", "loop", "refresh"] },
  { concept: "branching",      category: "concept", keywords: ["분기", "갈래", "branch", "split"] },
  { concept: "merge",          category: "concept", keywords: ["합치기", "병합", "merge"] },
  { concept: "layers",         category: "concept", keywords: ["레이어", "층", "layer", "stack"] },
  { concept: "pulse-wave",     category: "concept", keywords: ["펄스", "파동", "wave", "pulse"] },
  { concept: "spark",          category: "concept", keywords: ["스파크", "영감", "spark"] },
  { concept: "connection",     category: "concept", keywords: ["연결", "링크", "connection", "link"] },
  { concept: "network-nodes",  category: "concept", keywords: ["네트워크", "노드", "network"] },
  { concept: "plus-grid",      category: "concept", keywords: ["격자", "그리드", "grid"] },
  { concept: "zigzag-path",    category: "concept", keywords: ["지그재그", "경로", "zigzag"] },

  // metaphor (7)
  { concept: "weight-scale",   category: "metaphor", keywords: ["저울", "균형", "balance", "scale"] },
  { concept: "puzzle-piece",   category: "metaphor", keywords: ["퍼즐", "조각", "puzzle"] },
  { concept: "ladder",         category: "metaphor", keywords: ["사다리", "성장", "ladder"] },
  { concept: "bridge",         category: "metaphor", keywords: ["다리", "연결", "bridge"] },
  { concept: "door-open",      category: "metaphor", keywords: ["문", "오픈", "door", "open"] },
  { concept: "flag",           category: "metaphor", keywords: ["깃발", "목적지", "flag", "milestone"] },
  { concept: "compass",        category: "metaphor", keywords: ["나침반", "방향", "compass"] },
];

// ---------------------------------------------------------------------------
// Claude CLI wrapper — single concept
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You produce a single minimal line-art SVG for a concept library.
Hard constraints:
- Only return the <svg> element (no prose, no markdown fence, no backticks).
- viewBox="0 0 120 120" exactly.
- Every stroke uses stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none".
- Max 8 primitive shapes (path/line/circle/rect/polyline/polygon/ellipse). No text, no gradient, no filter, no image.
- Composition should read clearly at 160x160 px on a dark background.
- One single iconic sketch, not multiple composed objects.`;

function concept2id(concept: string): string {
  return concept
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-line";
}

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p", prompt,
      "--append-system-prompt", SYSTEM_PROMPT,
      "--model", MODEL,
      "--output-format", "text",
    ];
    const proc = spawn(CLAUDE_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    proc.stdout.on("data", (c) => (out += c.toString()));
    proc.stderr.on("data", (c) => (err += c.toString()));
    proc.on("error", (e) => reject(e));
    proc.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${err.slice(0, 200)}`));
      } else {
        resolve(out);
      }
    });
  });
}

async function forgeConcept(spec: {
  concept: string;
  category: SvgAssetEntry["category"];
  keywords: string[];
  note?: string;
  force?: boolean;
  dry?: boolean;
}): Promise<{ id: string; ok: boolean; reason?: string; warnings: string[] }> {
  const id = concept2id(spec.concept);
  const existing = findById(id);
  if (existing && !spec.force) {
    return { id, ok: true, reason: "already-exists", warnings: [] };
  }

  const prompt = `Draw concept: "${spec.concept}". Category: ${spec.category}. Keywords: ${spec.keywords.join(", ")}. ${spec.note ?? ""}`.trim();

  if (spec.dry) {
    return { id, ok: true, reason: "dry-run", warnings: ["(dry-run skipped Claude)"] };
  }

  let raw: string;
  try {
    raw = await runClaude(prompt);
  } catch (e) {
    return { id, ok: false, reason: `claude-error: ${(e as Error).message}`, warnings: [] };
  }

  const san = sanitizeSvg(raw, spec.concept);
  if (!san.ok) {
    return { id, ok: false, reason: `sanitize: ${san.errors.join("; ")}`, warnings: san.warnings };
  }

  const entry: SvgAssetEntry = {
    id,
    concept: spec.concept,
    keywords: spec.keywords,
    category: spec.category,
    style: "line-art",
    view_box: "0 0 120 120",
    stroke_count: san.strokeCount,
    source: "claude-forge",
    license: "project-custom",
    created_at: new Date().toISOString().slice(0, 10),
    note: spec.note,
  };
  registerAsset(entry, san.svg);
  return { id, ok: true, warnings: san.warnings };
}

// ---------------------------------------------------------------------------
// Compile generated.tsx from assets/*.svg
// ---------------------------------------------------------------------------
function compileGenerated(): { count: number; output: string } {
  ensureLibraryPaths();
  const idx = loadIndex();
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED by scripts/svg-forge.ts --compile — DO NOT EDIT BY HAND.");
  lines.push("// Re-run: npx tsx scripts/svg-forge.ts --compile");
  lines.push("");
  lines.push('import React from "react";');
  lines.push("");
  lines.push("export interface SvgLibraryChildProps {");
  lines.push("  strokeWidth?: number;");
  lines.push("}");
  lines.push("");
  lines.push("export const SVG_LIBRARY: Record<string, React.FC<SvgLibraryChildProps>> = {");
  let count = 0;
  for (const a of idx.assets) {
    const p = assetSvgPath(a.id);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    const inner = extractInnerPrimitives(raw);
    if (!inner) continue;
    const jsx = inner
      .replace(/stroke-width="[^"]*"/g, 'strokeWidth={strokeWidth ?? 3.5}')
      .replace(/stroke-linecap="/g, 'strokeLinecap="')
      .replace(/stroke-linejoin="/g, 'strokeLinejoin="')
      .replace(/stroke-dasharray="/g, 'strokeDasharray="')
      .replace(/fill-rule="/g, 'fillRule="')
      .replace(/clip-rule="/g, 'clipRule="')
      .replace(/<!--[\s\S]*?-->/g, "");
    const key = JSON.stringify(a.id);
    lines.push(`  ${key}: ({ strokeWidth }) => (`);
    lines.push(`    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" width="100%" height="100%" aria-hidden="true">`);
    lines.push(jsx.trim());
    lines.push(`    </svg>`);
    lines.push(`  ),`);
    count++;
  }
  lines.push("};");
  lines.push("");
  const output = lines.join("\n");
  const outPath = path.resolve(process.cwd(), "src", "remotion", "svg-library.generated.tsx");
  fs.writeFileSync(outPath, output);
  return { count, output: outPath };
}

function extractInnerPrimitives(svgRaw: string): string | null {
  const openRe = /<svg\b[^>]*>/i;
  const closeRe = /<\/svg>/i;
  const m = svgRaw.match(openRe);
  const c = svgRaw.match(closeRe);
  if (!m || !c) return null;
  const inner = svgRaw.slice(m.index! + m[0].length, svgRaw.lastIndexOf("</svg>"));
  return inner;
}

// ---------------------------------------------------------------------------
// Style check
// ---------------------------------------------------------------------------
function styleCheckAll(): { total: number; ok: number; bad: Array<{ id: string; reasons: string[] }> } {
  const idx = loadIndex();
  const bad: Array<{ id: string; reasons: string[] }> = [];
  let ok = 0;
  for (const a of idx.assets) {
    const p = assetSvgPath(a.id);
    if (!fs.existsSync(p)) { bad.push({ id: a.id, reasons: ["file-missing"] }); continue; }
    const raw = fs.readFileSync(p, "utf8");
    const v = validateSavedSvg(raw);
    if (v.ok) ok++;
    else bad.push({ id: a.id, reasons: v.reasons });
  }
  return { total: idx.assets.length, ok, bad };
}

// ---------------------------------------------------------------------------
// CLI dispatcher
// ---------------------------------------------------------------------------
function parseArgs() {
  const a = process.argv.slice(2);
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < a.length; i++) {
    const t = a[i];
    if (t.startsWith("--")) {
      const k = t.slice(2);
      const n = a[i + 1];
      if (n && !n.startsWith("--")) { args[k] = n; i++; }
      else args[k] = true;
    }
  }
  return args;
}

async function concurrentRun<T, R>(items: T[], worker: (x: T) => Promise<R>, limit: number): Promise<R[]> {
  const results: R[] = [];
  const queue = items.slice();
  const pool: Promise<void>[] = [];
  const spawn = async () => {
    while (queue.length) {
      const it = queue.shift()!;
      results.push(await worker(it));
    }
  };
  for (let i = 0; i < Math.min(limit, items.length); i++) pool.push(spawn());
  await Promise.all(pool);
  return results;
}

async function main() {
  ensureLibraryPaths();
  const args = parseArgs();

  if (args.list) {
    const idx = loadIndex();
    console.log(`\nsvg-library — ${idx.assets.length} assets\n`);
    for (const a of idx.assets) {
      console.log(`  ${a.id.padEnd(24)} · ${a.category.padEnd(10)} · keywords: ${a.keywords.slice(0,4).join(", ")}`);
    }
    return;
  }

  if (args["style-check"]) {
    const r = styleCheckAll();
    console.log(`style-check: ${r.ok}/${r.total} ok, ${r.bad.length} bad`);
    for (const b of r.bad) console.log(`  ✗ ${b.id}: ${b.reasons.join("; ")}`);
    process.exit(r.bad.length === 0 ? 0 : 1);
  }

  if (args.compile) {
    const r = compileGenerated();
    console.log(`✓ compiled ${r.count} assets → ${r.output}`);
    return;
  }

  const dry = Boolean(args["dry-run"]);
  const force = Boolean(args.force);

  let targets: Array<{ concept: string; category: SvgAssetEntry["category"]; keywords: string[]; note?: string }> = [];

  if (args.seed) {
    targets = SEED;
  } else if (typeof args.add === "string") {
    targets = [{ concept: args.add, category: "object", keywords: [args.add] }];
  } else if (typeof args.project === "string") {
    const pid = args.project;
    const scenesPath = path.join("data", pid, "scenes-v2.json");
    const beatsPath = path.join("data", pid, "beats.json");
    const concepts = new Set<string>();
    if (fs.existsSync(scenesPath)) {
      const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
      const arr = Array.isArray(scenes) ? scenes : scenes.scenes ?? [];
      for (const sc of arr) {
        walk(sc.stack_root, (n) => {
          if (n.type === "SvgAsset" || n.type === "IconCard" || n.type === "NumberCircle") {
            const id = n.data?.asset_id ?? n.data?.icon_asset_id;
            if (typeof id === "string") concepts.add(id);
          }
        });
      }
    }
    if (fs.existsSync(beatsPath)) {
      const beats = JSON.parse(fs.readFileSync(beatsPath, "utf8"));
      for (const b of beats) {
        const needs = b.svg_needs ?? [];
        for (const n of needs) {
          if (n.pending_forge && typeof n.concept === "string") concepts.add(n.concept);
        }
      }
    }
    const known = assetIdSet();
    const missing = [...concepts].filter((c) => !known.has(c) && !known.has(concept2id(c)));
    if (missing.length === 0) {
      console.log(`✓ project ${pid}: all referenced SVG assets already in library.`);
      return;
    }
    console.log(`project ${pid} missing assets: ${missing.join(", ")}`);
    targets = missing.map((c) => ({ concept: c.replace(/-line$/, ""), category: "object", keywords: [c] }));
  } else {
    console.log(`Usage:
  svg-forge --seed [--force] [--dry-run]
  svg-forge --add <concept>
  svg-forge --project <projectId>
  svg-forge --list
  svg-forge --compile
  svg-forge --style-check`);
    process.exit(2);
  }

  console.log(`forging ${targets.length} concepts (model=${MODEL}, concurrency=${MAX_CONC}, dry=${dry}, force=${force})`);
  const results = await concurrentRun(targets, async (t) => {
    const r = await forgeConcept({ ...t, force, dry });
    const tag = r.ok ? (r.reason ?? "ok") : "FAIL";
    console.log(`  [${tag}] ${r.id}${r.reason && r.ok && r.reason !== "ok" ? ` (${r.reason})` : ""}${r.reason && !r.ok ? `: ${r.reason}` : ""}`);
    if (r.warnings.length) r.warnings.forEach((w) => console.log(`      ⚠ ${w}`));
    return r;
  }, MAX_CONC);

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`\n${ok}/${results.length} ok, ${fail} failed.`);

  // Auto compile after any successful forge
  if (ok > 0 && !dry) {
    const c = compileGenerated();
    console.log(`✓ compiled ${c.count} assets to ${c.output}`);
  }

  process.exit(fail > 0 ? 1 : 0);
}

function walk(node: any, fn: (n: any) => void) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children ?? [];
  if (Array.isArray(kids)) kids.forEach((c: any) => walk(c, fn));
}

main().catch((e) => { console.error(e); process.exit(1); });
