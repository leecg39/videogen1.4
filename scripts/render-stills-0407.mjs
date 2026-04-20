// Render hero stills for vibe-news-0407 (80 scenes).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = JSON.parse(
  fs.readFileSync("data/vibe-news-0407/render-props-v2.json", "utf8")
);
const scenes = props.scenes;
let abs = 0;
const frames = [];
function hero(sc) {
  let m = 0;
  function w(n) { if (!n) return; const e = (n.motion?.enterAt ?? 0) + (n.motion?.duration ?? 0); if (e > m) m = e; (n.children ?? []).forEach(w); }
  w(sc.stack_root);
  return m + 6;
}
for (const sc of scenes) {
  const d = sc.duration_frames || 90;
  frames.push(abs + Math.min(hero(sc), Math.max(0, d - 6)));
  abs += d;
}

console.log(`Bundling... (${frames.length} frames)`);
const t0 = Date.now();
const bundleLocation = await bundle({
  entryPoint: path.resolve("src/remotion/index.ts"),
  webpackOverride: (c) => c,
});
console.log(`Bundle done (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: "MainComposition",
  inputProps: props,
});

const outDir = "output/full-frames-0407";
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const outPath = path.join(outDir, `scene_${String(i + 1).padStart(3, "0")}.png`);
  const t = Date.now();
  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: outPath,
    frame: f,
    inputProps: props,
    imageFormat: "png",
    overwrite: true,
  });
  const dt = ((Date.now() - t) / 1000).toFixed(1);
  console.log(`[${i + 1}/${frames.length}] frame ${f} → ${outPath} (${dt}s)`);
}
console.log("✓ all done");
