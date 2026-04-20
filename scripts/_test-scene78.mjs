import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = JSON.parse(fs.readFileSync("data/vibe-news-0407/render-props-v2.json", "utf8"));
// scene 78 hero frame — sum of all durations minus last duration - 6 + hero offset
let abs = 0;
const scenes = props.scenes;
for (let i = 0; i < scenes.length; i++) {
  const d = scenes[i].duration_frames || 90;
  if (i === scenes.length - 1) {
    // middle of the last scene
    abs += Math.floor(d / 2);
    break;
  }
  abs += d;
}
console.log("testing frame:", abs, "of composition total ~23084");

const bundleLocation = await bundle({ entryPoint: path.resolve("src/remotion/index.ts"), webpackOverride: c => c });
const composition = await selectComposition({ serveUrl: bundleLocation, id: "MainComposition", inputProps: props });
console.log("composition duration:", composition.durationInFrames);

await renderStill({
  composition, serveUrl: bundleLocation,
  output: "output/scene78-mid.png",
  frame: abs, inputProps: props, imageFormat: "png", overwrite: true,
});
console.log("done");
