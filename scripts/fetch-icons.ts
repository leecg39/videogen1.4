/**
 * fetch-icons.ts — 씬 키워드 기반 아이콘 다운로드
 *
 * 사용법: npx tsx scripts/fetch-icons.ts data/{projectId}/scenes-v2.json
 *
 * 소스:
 *   1. Iconify API (200,000+ 아이콘, 무료)
 *   2. Lucide (로컬 npm 패키지)
 *   3. Simple Icons (브랜드 로고, CDN)
 *
 * 출력:
 *   public/icons/{projectId}/*.svg
 *   public/icons/{projectId}/manifest.json
 */

import fs from "fs";
import path from "path";
import https from "https";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const ICONIFY_API = "https://api.iconify.design";
const SIMPLE_ICONS_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons";
const PREFERRED_SETS = ["mdi", "lucide", "ph", "tabler", "carbon"]; // 선호 아이콘 세트 순서

// 한국어 키워드 → 영문 검색어 매핑
const KEYWORD_MAP: Record<string, string> = {
  // 기술
  "논문": "paper", "연구": "research", "과학": "science", "실험": "experiment",
  "코드": "code", "코딩": "coding", "프로그래밍": "programming",
  "AI": "artificial-intelligence", "인공지능": "robot",
  "자동": "automation", "자동화": "automation",
  "보안": "security", "방어": "shield", "차단": "block",
  "승인": "check-circle", "검사": "search", "심사": "review",
  "에이전트": "bot", "도구": "tool", "도구들": "tools",
  "플랫폼": "platform", "생태계": "ecosystem",
  "데이터": "database", "분석": "analytics", "통계": "chart",
  "비용": "money", "비싸": "dollar", "저렴": "discount",
  "음성": "microphone", "인식": "scan", "언어": "language",
  "디자인": "design", "레이아웃": "layout", "색상": "palette",
  "스킬": "skill", "학습": "learn", "개선": "improvement",
  "규칙": "rule", "게임": "game", "위반": "warning",
  "속도": "speed", "빠른": "fast", "성능": "performance",
  "기억": "memory", "맥락": "context",
  "경험": "experience", "노하우": "knowledge",
  "자율": "autonomous", "자율성": "freedom",
  "방향": "compass", "목적": "target",
  "사장": "shop", "가게": "store", "창업": "startup",
  "질문": "question", "문제": "puzzle",
  "팀": "team", "협업": "collaboration",
  "서류": "document", "파일": "file",
  "터미널": "terminal", "명령어": "command",

  // 브랜드 (Simple Icons)
  "클로드": "anthropic", "엔트로픽": "anthropic",
  "네이처": "nature", "깃허브": "github", "GitHub": "github",
  "구글": "google", "아마존": "amazon",
  "파이썬": "python", "리액트": "react",
  "DuckDB": "duckdb",
};

// 브랜드명 → Simple Icons 슬러그
const BRAND_SLUGS: Record<string, string> = {
  "anthropic": "anthropic", "github": "github", "google": "google",
  "amazon": "amazon", "python": "python", "react": "react",
  "openai": "openai", "meta": "meta", "apple": "apple",
};

// ─────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        res.resume();
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

// ─────────────────────────────────────────────
// Iconify search + download
// ─────────────────────────────────────────────

async function searchIconify(query: string): Promise<string | null> {
  try {
    const url = `${ICONIFY_API}/search?query=${encodeURIComponent(query)}&limit=20`;
    const data = JSON.parse(await httpGet(url));
    if (!data.icons || data.icons.length === 0) return null;

    // 선호 세트 우선 선택
    for (const pref of PREFERRED_SETS) {
      const match = data.icons.find((id: string) => id.startsWith(pref + ":"));
      if (match) return match;
    }
    return data.icons[0];
  } catch {
    return null;
  }
}

async function downloadIconifySvg(iconId: string): Promise<string | null> {
  try {
    // iconId format: "mdi:paper" → "/mdi/paper.svg"
    const [set, name] = iconId.split(":");
    const url = `${ICONIFY_API}/${set}/${name}.svg?width=64&height=64`;
    const svg = await httpGet(url);
    if (svg.startsWith("<svg")) return svg;
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Simple Icons (브랜드 로고)
// ─────────────────────────────────────────────

async function downloadSimpleIcon(slug: string): Promise<string | null> {
  try {
    const url = `${SIMPLE_ICONS_CDN}/${slug}.svg`;
    const svg = await httpGet(url);
    if (svg.startsWith("<svg")) return svg;
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Keyword extraction from narration
// ─────────────────────────────────────────────

function extractKeywords(narration: string): string[] {
  const keywords: string[] = [];

  // KEYWORD_MAP에서 매칭
  for (const [kr, en] of Object.entries(KEYWORD_MAP)) {
    if (narration.includes(kr) && !keywords.includes(en)) {
      keywords.push(en);
    }
  }

  // 영문 단어 추출 (2글자 이상)
  const engWords = narration.match(/[A-Za-z]{2,}/g) || [];
  for (const w of engWords) {
    const lower = w.toLowerCase();
    if (!keywords.includes(lower) && lower.length >= 3) {
      keywords.push(lower);
    }
  }

  return keywords.slice(0, 5); // 씬당 최대 5개
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

interface IconManifestEntry {
  keyword: string;
  file: string;
  source: "iconify" | "simple-icons" | "lucide";
  iconId?: string;
  width: number;
  height: number;
}

async function main() {
  const scenesPath = process.argv[2];
  if (!scenesPath) {
    console.error("Usage: npx tsx scripts/fetch-icons.ts data/{projectId}/scenes-v2.json");
    process.exit(1);
  }

  const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf-8"));
  const projectId = scenes[0]?.project_id;
  if (!projectId) {
    console.error("project_id not found in scenes");
    process.exit(1);
  }

  const outDir = path.join("public", "icons", projectId);
  fs.mkdirSync(outDir, { recursive: true });

  // 기존 manifest 로드
  const manifestPath = path.join(outDir, "manifest.json");
  let manifest: IconManifestEntry[] = [];
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }
  const existingKeywords = new Set(manifest.map((e) => e.keyword));

  // 모든 씬에서 키워드 추출
  const allKeywords = new Set<string>();
  for (const scene of scenes) {
    const narration = scene.narration || "";
    const keywords = extractKeywords(narration);
    for (const kw of keywords) allKeywords.add(kw);
  }

  console.log(`\n🔍 ${allKeywords.size}개 키워드 발견\n`);

  let downloaded = 0;
  let skipped = 0;

  for (const keyword of allKeywords) {
    if (existingKeywords.has(keyword)) {
      skipped++;
      continue;
    }

    const filename = `${keyword.replace(/[^a-z0-9-]/g, "-")}.svg`;
    const filePath = path.join(outDir, filename);

    if (fs.existsSync(filePath)) {
      skipped++;
      continue;
    }

    let svg: string | null = null;
    let source: IconManifestEntry["source"] = "iconify";
    let iconId: string | undefined;

    // 1. 브랜드인지 확인 → Simple Icons
    if (BRAND_SLUGS[keyword]) {
      svg = await downloadSimpleIcon(BRAND_SLUGS[keyword]);
      if (svg) {
        source = "simple-icons";
        console.log(`  ✓ ${keyword} → Simple Icons (${BRAND_SLUGS[keyword]})`);
      }
    }

    // 2. Iconify 검색
    if (!svg) {
      iconId = await searchIconify(keyword) ?? undefined;
      if (iconId) {
        svg = await downloadIconifySvg(iconId);
        if (svg) {
          source = "iconify";
          console.log(`  ✓ ${keyword} → Iconify (${iconId})`);
        }
      }
    }

    if (!svg) {
      console.log(`  ✗ ${keyword} → 아이콘 없음`);
      continue;
    }

    // SVG 저장 — currentColor를 흰색으로 변환 (다크 배경 호환)
    const fixedSvg = svg.replace(/currentColor/g, "#FFFFFF");
    fs.writeFileSync(filePath, fixedSvg);
    manifest.push({
      keyword,
      file: `icons/${projectId}/${filename}`,
      source,
      iconId,
      width: 64,
      height: 64,
    });
    downloaded++;

    // Rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  // manifest 저장
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n📦 완료: ${downloaded}개 다운로드, ${skipped}개 스킵`);
  console.log(`📁 저장 위치: ${outDir}/`);
  console.log(`📋 매니페스트: ${manifestPath}`);
}

main().catch(console.error);
