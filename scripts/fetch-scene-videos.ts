#!/usr/bin/env npx tsx
/**
 * fetch-scene-videos.ts
 *
 * scenes-v2.json의 각 씬에서 video_queries를 읽어
 * Pexels API로 비디오를 검색/다운로드합니다.
 *
 * Usage:
 *   npx tsx scripts/fetch-scene-videos.ts data/{projectId}/scenes-v2.json
 *
 * 환경변수:
 *   PEXELS_API_KEY - Pexels API 키 (없으면 스킵)
 *
 * 각 씬의 assets.video_queries 배열을 읽어:
 *   1. Pexels에서 검색 (HD 720p+ MP4 우선)
 *   2. public/videos/{projectId}/ 에 다운로드
 *   3. assets.videos[] 에 로컬 경로 기록
 */

import * as fs from "fs";
import * as path from "path";
import https from "https";

const scenesPath = process.argv[2];
if (!scenesPath) {
  console.error("Usage: npx tsx scripts/fetch-scene-videos.ts <scenes-v2.json>");
  process.exit(1);
}

const PEXELS_KEY = process.env.PEXELS_API_KEY || "";

interface VideoQuery {
  query: string;
  orientation?: string;
  minDuration?: number;
}

interface VideoResult {
  localPath: string;   // relative to public/, e.g. "videos/proj1/city-aerial.mp4"
  source: string;      // "pexels"
  query: string;
  credit: string;
  durationSec: number;
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, headers).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString()}`)));
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

async function searchPexelsVideo(
  query: string,
  orientation: string = "landscape",
  minDuration: number = 5,
): Promise<{ url: string; credit: string; durationSec: number } | null> {
  if (!PEXELS_KEY) return null;

  const params = new URLSearchParams({
    query,
    per_page: "5",
    orientation,
  });

  try {
    const apiUrl = `https://api.pexels.com/videos/search?${params}`;
    const data = await httpGet(apiUrl, {
      Authorization: PEXELS_KEY,
    });
    const json = JSON.parse(data.toString());

    if (!json.videos || json.videos.length === 0) return null;

    // Pick the first video with duration >= minDuration, fallback to first
    const video = json.videos.find((v: any) => v.duration >= minDuration) || json.videos[0];

    // Select HD (720p+) MP4 file
    const files = video.video_files || [];
    const hdFile =
      files.find((f: any) => f.quality === "hd" && f.file_type === "video/mp4" && f.height >= 720) ||
      files.find((f: any) => f.quality === "hd" && f.file_type === "video/mp4") ||
      files.find((f: any) => f.file_type === "video/mp4") ||
      files[0];

    if (!hdFile?.link) return null;

    return {
      url: hdFile.link,
      credit: `Video by ${video.user?.name || "Unknown"} on Pexels`,
      durationSec: video.duration || 10,
    };
  } catch (e) {
    console.warn(`  ⚠️ Pexels search failed for "${query}":`, (e as Error).message);
  }
  return null;
}

async function downloadFile(url: string, destPath: string): Promise<boolean> {
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
  const videoDir = path.join("public", "videos", projectId);

  let totalDownloaded = 0;
  let totalSkipped = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const assets = scene.assets ?? {};
    const queries: VideoQuery[] = assets.video_queries ?? [];

    if (queries.length === 0) continue;

    console.log(`\nScene ${i}: ${queries.length} video queries`);

    const videos: VideoResult[] = assets.videos ?? [];

    for (const vq of queries) {
      const filename = sanitizeFilename(vq.query);
      const localRelPath = `videos/${projectId}/${filename}.mp4`;
      const localAbsPath = path.join("public", localRelPath);

      // Skip if already downloaded
      if (fs.existsSync(localAbsPath)) {
        console.log(`  ✓ Already exists: ${localRelPath}`);
        if (!videos.some((v) => v.localPath === localRelPath)) {
          videos.push({
            localPath: localRelPath,
            source: "cached",
            query: vq.query,
            credit: "",
            durationSec: 0,
          });
        }
        totalSkipped++;
        continue;
      }

      // Search Pexels
      const result = await searchPexelsVideo(
        vq.query,
        vq.orientation || "landscape",
        vq.minDuration || 5,
      );

      if (result) {
        console.log(`  ⬇️  Downloading: ${vq.query}...`);
        const ok = await downloadFile(result.url, localAbsPath);
        if (ok) {
          const sizeMB = (fs.statSync(localAbsPath).size / (1024 * 1024)).toFixed(1);
          console.log(`  ✅ Downloaded: ${localRelPath} (${sizeMB}MB, ${result.durationSec}s, ${result.credit})`);
          videos.push({
            localPath: localRelPath,
            source: "pexels",
            query: vq.query,
            credit: result.credit,
            durationSec: result.durationSec,
          });
          totalDownloaded++;
        }
      } else {
        console.log(`  ⏭️  No API key or no result: "${vq.query}"`);
        videos.push({
          localPath: "",
          source: "placeholder",
          query: vq.query,
          credit: "",
          durationSec: 0,
        });
      }
    }

    // Write back videos to scene assets
    if (!scene.assets) scene.assets = {};
    scene.assets.videos = videos;
  }

  // Save
  fs.writeFileSync(scenesPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ 완료: ${totalDownloaded}개 다운로드, ${totalSkipped}개 캐시 사용`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
