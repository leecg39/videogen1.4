// svg-library.ts — SVG Forge 라이브러리 조회/저장 API
//
// public/svg-library/index.json 과 assets/*.svg 를 관리한다.
// Remotion 렌더러와 CLI (svg-forge), Planner 에서 공유 사용.

import fs from "node:fs";
import path from "node:path";

export interface SvgAssetEntry {
  id: string;                       // kebab-case, unique (e.g. "notebook-line")
  concept: string;                  // 영문 핵심 개념
  keywords: string[];               // 한글/영문 매칭 키워드
  category:
    | "object"
    | "concept"
    | "action"
    | "metaphor"
    | "scene"
    | "brand-support";
  style: "line-art" | "duotone" | "filled";
  view_box: string;                 // e.g. "0 0 120 120"
  stroke_count: number;
  source: "claude-forge" | "manual" | "imported";
  license: string;                  // "project-custom" | "MIT" | ...
  created_at: string;               // ISO date
  preview_only?: boolean;           // true 면 가드/렌더에서 사용 금지
  tags?: string[];                  // 부가 라벨
  note?: string;
}

export interface SvgLibraryIndex {
  version: number;
  description?: string;
  assets: SvgAssetEntry[];
}

const LIB_ROOT = path.resolve(process.cwd(), "public", "svg-library");
const INDEX_PATH = path.join(LIB_ROOT, "index.json");
const ASSETS_DIR = path.join(LIB_ROOT, "assets");

export function ensureLibraryPaths(): void {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(
      INDEX_PATH,
      JSON.stringify({ version: 1, assets: [] }, null, 2),
    );
  }
}

export function loadIndex(): SvgLibraryIndex {
  ensureLibraryPaths();
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as SvgLibraryIndex;
  } catch {
    return { version: 1, assets: [] };
  }
}

export function saveIndex(idx: SvgLibraryIndex): void {
  idx.version = idx.version || 1;
  fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + "\n");
}

export function listAssets(filter?: {
  category?: SvgAssetEntry["category"];
  style?: SvgAssetEntry["style"];
}): SvgAssetEntry[] {
  const { assets } = loadIndex();
  return assets.filter((a) => {
    if (filter?.category && a.category !== filter.category) return false;
    if (filter?.style && a.style !== filter.style) return false;
    return true;
  });
}

export function findById(id: string): SvgAssetEntry | null {
  return loadIndex().assets.find((a) => a.id === id) ?? null;
}

export function assetSvgPath(id: string): string {
  return path.join(ASSETS_DIR, `${id}.svg`);
}

export function readSvgBody(id: string): string | null {
  const p = assetSvgPath(id);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

/** 한글/영문 키워드 매칭. concept / keywords / id 순 점수 */
export function findByConcept(query: string): SvgAssetEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { assets } = loadIndex();
  const scored = assets
    .map((a) => {
      let score = 0;
      if (a.id.toLowerCase() === q) score += 100;
      if (a.concept.toLowerCase() === q) score += 80;
      if (a.keywords.some((k) => k.toLowerCase() === q)) score += 60;
      if (a.id.toLowerCase().includes(q)) score += 20;
      if (a.concept.toLowerCase().includes(q)) score += 15;
      if (a.keywords.some((k) => k.toLowerCase().includes(q))) score += 10;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);
  return scored.map((x) => x.a);
}

export function findByKeywords(keywords: string[], topK = 5): SvgAssetEntry[] {
  const tally = new Map<string, number>();
  for (const kw of keywords) {
    for (const a of findByConcept(kw)) {
      tally.set(a.id, (tally.get(a.id) || 0) + 1);
    }
  }
  const ids = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id]) => id);
  return ids
    .map((id) => findById(id))
    .filter((x): x is SvgAssetEntry => !!x);
}

export function registerAsset(entry: SvgAssetEntry, svgBody: string): void {
  ensureLibraryPaths();
  const idx = loadIndex();
  const existingIdx = idx.assets.findIndex((a) => a.id === entry.id);
  if (existingIdx >= 0) {
    idx.assets[existingIdx] = { ...idx.assets[existingIdx], ...entry };
  } else {
    idx.assets.push(entry);
  }
  fs.writeFileSync(assetSvgPath(entry.id), svgBody);
  saveIndex(idx);
}

export function removeAsset(id: string): boolean {
  const idx = loadIndex();
  const before = idx.assets.length;
  idx.assets = idx.assets.filter((a) => a.id !== id);
  if (idx.assets.length === before) return false;
  const p = assetSvgPath(id);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  saveIndex(idx);
  return true;
}

/** 모든 asset_id 집합 (가드용) */
export function assetIdSet(): Set<string> {
  return new Set(loadIndex().assets.map((a) => a.id));
}
