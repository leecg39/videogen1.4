#!/usr/bin/env npx tsx
/**
 * fetch-scene-images.ts
 *
 * scenes-v2.json의 각 씬에서 image_queries를 읽어
 * Unsplash API로 이미지를 검색/다운로드합니다.
 *
 * Usage:
 *   npx tsx scripts/fetch-scene-images.ts data/{projectId}/scenes-v2.json
 *
 * 환경변수:
 *   UNSPLASH_ACCESS_KEY - Unsplash API 키 (없으면 스킵)
 *
 * 각 씬의 assets.image_queries 배열을 읽어:
 *   1. Unsplash에서 검색 (transparent, illustration 우선)
 *   2. public/images/{projectId}/ 에 다운로드
 *   3. assets.images[] 에 로컬 경로 기록
 */

import * as fs from "fs";
import * as path from "path";
import https from "https";

const scenesPath = process.argv[2];
if (!scenesPath) {
  console.error("Usage: npx tsx scripts/fetch-scene-images.ts <scenes-v2.json>");
  process.exit(1);
}

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

interface ImageQuery {
  query: string;
  style?: "illustration" | "photo" | "icon";
  preferTransparent?: boolean;
}

interface ImageResult {
  localPath: string;   // relative to public/, e.g. "images/rag3/search-concept.jpg"
  source: string;      // "unsplash"
  query: string;
  credit?: string;
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, headers).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

async function searchUnsplash(query: string): Promise<{ url: string; credit: string } | null> {
  if (!UNSPLASH_KEY) return null;

  const params = new URLSearchParams({
    query,
    per_page: "1",
    orientation: "squarish",
    content_filter: "high",
  });

  try {
    const apiUrl = `https://api.unsplash.com/search/photos?${params}`;
    const data = await httpGet(apiUrl, {
      Authorization: `Client-ID ${UNSPLASH_KEY}`,
    });
    const json = JSON.parse(data.toString());
    if (json.results && json.results.length > 0) {
      const photo = json.results[0];
      return {
        url: photo.urls?.regular || photo.urls?.small,
        credit: `Photo by ${photo.user?.name} on Unsplash`,
      };
    }
  } catch (e) {
    console.warn(`  ⚠️ Unsplash search failed for "${query}":`, (e as Error).message);
  }
  return null;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const data = await httpGet(url);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, data);
    return true;
  } catch (e) {
    console.warn(`  ⚠️ Download failed:`, (e as Error).message);
    return false;
  }
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9가-힣-]/g, "-").replace(/-+/g, "-").substring(0, 40);
}

async function main() {
  const raw = fs.readFileSync(scenesPath, "utf-8");
  const data = JSON.parse(raw);
  const scenes: any[] = Array.isArray(data) ? data : data.scenes ?? [];

  // Extract projectId from path: data/{projectId}/scenes-v2.json
  const projectId = scenesPath.split("/").slice(-2, -1)[0] || "default";
  const imgDir = path.join("public", "images", projectId);

  let totalDownloaded = 0;
  let totalSkipped = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const assets = scene.assets ?? {};
    const queries: ImageQuery[] = assets.image_queries ?? [];

    if (queries.length === 0) continue;

    console.log(`\nScene ${i}: ${queries.length} image queries`);

    const images: ImageResult[] = assets.images ?? [];

    for (const iq of queries) {
      const filename = sanitizeFilename(iq.query);
      const ext = "jpg";
      const localRelPath = `images/${projectId}/${filename}.${ext}`;
      const localAbsPath = path.join("public", localRelPath);

      // Skip if already downloaded
      if (fs.existsSync(localAbsPath)) {
        console.log(`  ✓ Already exists: ${localRelPath}`);
        if (!images.some((img) => img.localPath === localRelPath)) {
          images.push({ localPath: localRelPath, source: "cached", query: iq.query });
        }
        totalSkipped++;
        continue;
      }

      // Search Unsplash
      const result = await searchUnsplash(
        `${iq.query} ${iq.style === "illustration" ? "illustration flat" : ""}`
      );

      if (result) {
        const ok = await downloadImage(result.url, localAbsPath);
        if (ok) {
          console.log(`  ✅ Downloaded: ${localRelPath} (${result.credit})`);
          images.push({
            localPath: localRelPath,
            source: "unsplash",
            query: iq.query,
            credit: result.credit,
          });
          totalDownloaded++;
        }
      } else {
        console.log(`  ⏭️  No API key or no result: "${iq.query}" — placeholder will be used`);
        // Record as placeholder so layout knows an image was intended
        images.push({
          localPath: "",
          source: "placeholder",
          query: iq.query,
        });
      }
    }

    // Write back images to scene assets
    if (!scene.assets) scene.assets = {};
    scene.assets.images = images;
  }

  // Save
  fs.writeFileSync(scenesPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ 완료: ${totalDownloaded}개 다운로드, ${totalSkipped}개 캐시 사용`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
