// Render full frame-by-frame PNG sequence for 0417-테스트.
// Output: output/sequence/frame_XXXXX.png (pad to 5 digits)
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = JSON.parse(
  fs.readFileSync("data/0417-테스트/render-props-v2.json", "utf8")
);

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
console.log(`Composition: ${composition.durationInFrames}f @ ${composition.fps}fps`);

const outDir = "output/sequence";
if (fs.existsSync(outDir)) {
  console.log(`cleaning old ${outDir} ...`);
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const t1 = Date.now();
let lastLog = t1;
await renderFrames({
  composition,
  serveUrl: bundleLocation,
  inputProps: props,
  outputDir: outDir,
  imageFormat: "png",
  concurrency: 8,
  onFrameUpdate: (n, _fp, progress) => {
    const now = Date.now();
    if (now - lastLog > 3000) {
      const rate = n / ((now - t1) / 1000);
      const left = (composition.durationInFrames - n) / Math.max(rate, 1);
      console.log(`  frame ${n}/${composition.durationInFrames}  ${rate.toFixed(1)}fps  ETA ${Math.ceil(left)}s`);
      lastLog = now;
    }
  },
  frameRange: [0, composition.durationInFrames - 1],
});
const dt = ((Date.now() - t1) / 1000).toFixed(1);
console.log(`✅ sequence rendered · ${composition.durationInFrames} PNGs · ${dt}s`);
