import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"]);

function scanImages(dir: string, basePath = ""): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        results.push(...scanImages(path.join(dir, entry.name), relPath));
      } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
        results.push(relPath);
      }
    }
  } catch {
    // ignore permission errors
  }
  return results;
}

export async function GET() {
  const images = scanImages(PUBLIC_DIR);
  return NextResponse.json(images.sort());
}
