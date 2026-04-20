// render 78 scene mid-frames using Remotion API (single bundle, many stills).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = JSON.parse(
  fs.readFileSync("data/0417-테스트/render-props-v2.json", "utf8")
);
const frames = fs.readFileSync("/tmp/mid_frames.txt", "utf8").trim().split(",").map(Number);

console.log(`Bundling...`);
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
console.log(`Composition selected: ${composition.durationInFrames}f`);

const outDir = "output/full-frames";
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
  });
  const dt = ((Date.now() - t) / 1000).toFixed(1);
  console.log(`[${i + 1}/${frames.length}] frame ${f} → ${outPath} (${dt}s)`);
}
console.log(`✅ all done`);
