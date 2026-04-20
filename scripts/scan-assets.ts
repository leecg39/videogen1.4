#!/usr/bin/env npx tsx
/**
 * scan-assets.ts
 *
 * public/assets/ 폴더의 이미지/GIF 파일을 스캔하여
 * public/assets/manifest.json을 생성합니다.
 *
 * Claude가 /vg-assets 스킬을 통해 이 스크립트 결과를 보강하거나,
 * 직접 manifest.json을 생성할 때 기초 데이터로 사용합니다.
 *
 * Usage:
 *   npx tsx scripts/scan-assets.ts [--dir public/assets]
 *
 * 출력:
 *   public/assets/manifest.json
 */

import * as fs from "fs";
import * as path from "path";

const ASSET_DIR = process.argv[2] || "public/assets";
const MANIFEST_PATH = path.join(ASSET_DIR, "manifest.json");
const SUPPORTED_EXT = new Set([".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"]);

interface AssetEntry {
  file: string;         // relative to public/, e.g. "assets/thinking.gif"
  filename: string;     // e.g. "thinking.gif"
  type: "gif" | "image";
  tags: string[];       // auto-generated from filename, refined by Claude
  category?: string;    // optional grouping
  alt?: string;         // accessibility description
}

function slugToWords(slug: string): string[] {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function scanDir(dir: string, baseDir: string): AssetEntry[] {
  const entries: AssetEntry[] = [];

  if (!fs.existsSync(dir)) {
    console.log(`📁 디렉토리 생성: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return entries;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      entries.push(...scanDir(fullPath, baseDir));
      continue;
    }

    const ext = path.extname(item.name).toLowerCase();
    if (!SUPPORTED_EXT.has(ext)) continue;
    if (item.name === "manifest.json") continue;

    const relativePath = path.relative("public", fullPath);
    const nameWithoutExt = path.basename(item.name, ext);
    const category = path.relative(baseDir, dir);

    entries.push({
      file: relativePath,
      filename: item.name,
      type: ext === ".gif" ? "gif" : "image",
      tags: slugToWords(nameWithoutExt),
      category: category && category !== "." ? category : undefined,
      alt: nameWithoutExt.replace(/[-_]/g, " "),
    });
  }

  return entries;
}

function main() {
  // Load existing manifest to preserve manually added tags
  let existing: AssetEntry[] = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
      console.log(`📋 기존 manifest 로드: ${existing.length}개 항목`);
    } catch {
      existing = [];
    }
  }

  const existingMap = new Map(existing.map(e => [e.file, e]));

  // Scan directory
  const scanned = scanDir(ASSET_DIR, ASSET_DIR);
  console.log(`🔍 스캔 완료: ${scanned.length}개 파일 발견`);

  // Merge: keep existing tags if file already in manifest
  const merged: AssetEntry[] = scanned.map(entry => {
    const prev = existingMap.get(entry.file);
    if (prev) {
      return {
        ...entry,
        tags: prev.tags.length > 0 ? prev.tags : entry.tags,
        category: prev.category || entry.category,
        alt: prev.alt || entry.alt,
      };
    }
    return entry;
  });

  // Detect removed files
  const scannedFiles = new Set(scanned.map(e => e.file));
  const removed = existing.filter(e => !scannedFiles.has(e.file));
  if (removed.length > 0) {
    console.log(`🗑️  제거된 파일: ${removed.map(r => r.filename).join(", ")}`);
  }

  // Count new files
  const newFiles = merged.filter(e => !existingMap.has(e.file));
  if (newFiles.length > 0) {
    console.log(`✨ 새 파일: ${newFiles.map(n => n.filename).join(", ")}`);
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(merged, null, 2));
  console.log(`\n✅ manifest 저장: ${MANIFEST_PATH} (${merged.length}개 항목)`);

  // Summary
  const gifCount = merged.filter(e => e.type === "gif").length;
  const imgCount = merged.filter(e => e.type === "image").length;
  const needsTags = merged.filter(e => e.tags.length <= 2).length;
  console.log(`   GIF: ${gifCount}개, 이미지: ${imgCount}개`);
  if (needsTags > 0) {
    console.log(`   ⚠️  태그 보강 필요: ${needsTags}개 (Claude /vg-assets로 보강 가능)`);
  }
}

main();
