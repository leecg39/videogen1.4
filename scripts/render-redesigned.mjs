// Render only the redesigned scenes (19/39/49/69 → 1-indexed 020/040/050/070)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = JSON.parse(
  fs.readFileSync("data/0417-테스트/render-props-v2.json", "utf8")
);
const frames = fs
  .readFileSync("/tmp/redesign_frames.txt", "utf8")
  .trim()
  .split(",")
  .map(Number);
const labels = fs
  .readFileSync("/tmp/redesign_labels.txt", "utf8")
  .trim()
  .split(",");

console.log("Bundling...");
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

const outDir = "output/key-frames";
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const label = labels[i];
  const outPath = path.join(outDir, `${label}.png`);
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
console.log(`✅ redesigned scenes rendered`);
