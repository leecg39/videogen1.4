import fs from "fs";
import path from "path";

export interface AssetManifestEntry {
  name: string;
  path: string;
  type: "brand-logo" | "icon" | "background" | "character";
  format: "svg" | "png" | "jpg" | "webp" | "avif" | "gif";
  keywords: string[];
}

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
]);

const KEYWORD_MAP: Record<string, string[]> = {
  anthropic: ["ai", "claude", "anthropic", "llm"],
  openai: ["ai", "openai", "gpt", "chatgpt"],
  google: ["ai", "google", "gemini"],
  gemini: ["ai", "google", "gemini"],
  figma: ["design", "figma", "ui"],
  nextjs: ["nextjs", "react", "framework"],
  github: ["github", "git", "code"],
  typescript: ["typescript", "ts", "language"],
  javascript: ["javascript", "js", "language"],
  python: ["python", "py", "language"],
  supabase: ["supabase", "database", "backend"],
  notion: ["notion", "productivity", "notes"],
  youtube: ["youtube", "video", "google"],
  instagram: ["instagram", "social", "meta"],
  threads: ["threads", "social", "meta"],
  gmail: ["gmail", "email", "google"],
};

export function scanAssets(publicDir: string): AssetManifestEntry[] {
  const assetsDir = path.join(publicDir, "assets");
  const results: AssetManifestEntry[] = [];

  function walk(dir: string, basePath: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;

      const nameWithoutExt = path.basename(entry.name, ext);
      const format = (
        ext === ".jpeg" ? "jpg" : ext.slice(1)
      ) as AssetManifestEntry["format"];

      let type: AssetManifestEntry["type"] = "icon";
      if (relPath.includes("characters/")) type = "character";
      else if (relPath.includes("BG/") || relPath.includes("background"))
        type = "background";
      else if (ext === ".svg" || ext === ".png") type = "brand-logo";

      const keywords =
        KEYWORD_MAP[nameWithoutExt.toLowerCase()] || [nameWithoutExt.toLowerCase()];

      results.push({ name: nameWithoutExt, path: `assets/${relPath}`, type, format, keywords });
    }
  }

  walk(assetsDir, "");
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function writeManifest() {
  const publicDir = path.join(process.cwd(), "public");
  const manifest = scanAssets(publicDir);
  const outPath = path.join(publicDir, "assets", "manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} entries to ${outPath}`);
}
