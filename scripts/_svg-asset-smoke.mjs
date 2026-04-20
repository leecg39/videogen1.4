// Smoke: render a single scene containing SvgAsset via standalone render-props.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";

const props = {
  scenes: [
    {
      id: "svg-smoke",
      project_id: "svg-smoke",
      beat_index: 0,
      layout_family: "hero-center",
      start_ms: 0,
      end_ms: 3000,
      duration_frames: 90,
      subtitles: [],
      narration: "",
      motion: { entrance: "fadeUp" },
      stack_root: {
        type: "SceneRoot",
        layout: { gap: 40, padding: "60px 100px 140px", align: "center", justify: "center" },
        children: [
          {
            type: "Stack",
            layout: { direction: "column", gap: 36, maxWidth: 900, align: "center", justify: "center" },
            children: [
              { type: "Kicker", data: { text: "SVG Forge · Smoke Test" } },
              {
                type: "Grid",
                layout: { columns: 4, gap: 28, maxWidth: 900 },
                children: [
                  { type: "SvgAsset", data: { asset_id: "notebook-line", size: 140, drawMode: true }, motion: { enterAt: 0, duration: 20 } },
                  { type: "SvgAsset", data: { asset_id: "cloud-line", size: 140, drawMode: true }, motion: { enterAt: 5, duration: 20 } },
                  { type: "SvgAsset", data: { asset_id: "brain-line", size: 140, drawMode: true }, motion: { enterAt: 10, duration: 20 } },
                  { type: "SvgAsset", data: { asset_id: "rocket-line", size: 140, drawMode: true }, motion: { enterAt: 15, duration: 20 } },
                ],
              },
              { type: "FooterCaption", data: { text: "notebook · cloud · brain · rocket" }, motion: { preset: "fadeUp", enterAt: 60, duration: 15 } },
            ],
          },
        ],
      },
    },
  ],
};

console.log("Bundling...");
const bundleLocation = await bundle({
  entryPoint: path.resolve("src/remotion/index.ts"),
  webpackOverride: (c) => c,
});
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: "MainComposition",
  inputProps: props,
});
fs.mkdirSync("output/svg-library-preview", { recursive: true });
await renderStill({
  composition,
  serveUrl: bundleLocation,
  output: "output/svg-library-preview/_smoke.png",
  frame: 80,
  inputProps: props,
  imageFormat: "png",
  overwrite: true,
});
console.log("✓ smoke still → output/svg-library-preview/_smoke.png");
