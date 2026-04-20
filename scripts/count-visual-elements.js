#!/usr/bin/env node
// count-visual-elements.js — Section 9 노드별 시각요소 가중치 검증
//
// 가중치 표:
//   ImpactStat/AnimatedCounter/StatNumber/NumberCircle = 3
//   IconCard/StatCard/CompareCard/ProcessStepCard/WarningCard = 4
//   VersusCard = 5
//   CompareBars/VerticalBars/RingChart/PieChart/ProgressBar = 3
//   FlowDiagram/AnimatedTimeline/CycleDiagram/VennDiagram/FunnelDiagram/PyramidDiagram/MatrixQuadrant = 4
//   BulletList = 3 (기본) + items.length 1추가
//   DevIcon/SvgAsset = 2
//   SvgGraphic = min(5, elements.length)
//   ImageAsset/VideoClip = 2
//   Headline/MarkerHighlight/DualToneText = 1 + emphasis tokens 0.5
//   Kicker/Badge/Pill = 1
//   BodyText/QuoteText/RichText = 1
//   FooterCaption/Divider = 0.5
//   기타 = 1
//
// 기준: 씬당 시각 요소 합산 ≥ 6 권장 (8-10 이상이 이상적).
//        < 3 이면 "sparse" 경고. < 4 인 씬이 25% 초과면 fail.
//
// postprocess ⑥-zf 로 삽입.

const fs = require("fs");

const WEIGHTS = {
  ImpactStat: 3, AnimatedCounter: 3, StatNumber: 3, NumberCircle: 3,
  IconCard: 4, StatCard: 4, CompareCard: 4, ProcessStepCard: 4, WarningCard: 4,
  VersusCard: 5,
  CompareBars: 3, VerticalBars: 3, RingChart: 3, PieChart: 3, ProgressBar: 3,
  FlowDiagram: 4, AnimatedTimeline: 4, CycleDiagram: 4, VennDiagram: 4,
  FunnelDiagram: 4, PyramidDiagram: 4, MatrixQuadrant: 4, SplitRevealCard: 4,
  ScaleComparison: 4, DataTable: 4, StructuredDiagram: 4,
  TerminalBlock: 3, ChatBubble: 3, PhoneMockup: 3, MonitorMockup: 3,
  AreaChart: 3, LineChart: 3, WaffleChart: 3, PictogramRow: 3,
  BulletList: 3,
  DevIcon: 2, SvgAsset: 2, Icon: 2,
  ImageAsset: 2, VideoClip: 2,
  Headline: 1, MarkerHighlight: 1, DualToneText: 1,
  Kicker: 1, Badge: 1, Pill: 1,
  BodyText: 1, QuoteText: 1, RichText: 1, FreeText: 1,
  FooterCaption: 0.5, Divider: 0.5,
  CheckMark: 1,
  ArrowConnector: 0.5, LineConnector: 0.5,
  SvgGraphic: 0, // computed from elements
};

const CONTAINERS = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "Absolute", "FrameBox",
  "Overlay", "AnchorBox", "SafeArea", "ScatterLayout", "Cluster", "Bento",
  "RowStack", "ColumnStack", "Flex", "FlexBox", "VerticalStack", "HorizontalStack",
]);

const DECOR = new Set(["AccentGlow", "AccentRing", "AmbientBackground", "Backplate", "Spacer", "NoiseTexture", "Gradient"]);

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function countForScene(sc) {
  if (!sc.stack_root) return 0;
  let sum = 0;
  walk(sc.stack_root, (n) => {
    if (!n.type) return;
    if (CONTAINERS.has(n.type) || DECOR.has(n.type)) return;
    let w = WEIGHTS[n.type] ?? 1;
    if (n.type === "SvgGraphic") {
      const els = n.data?.elements?.length ?? 0;
      w = Math.min(5, Math.max(1, els));
    }
    if (n.type === "BulletList") {
      w = 3 + Math.min(3, (n.data?.items?.length ?? 0));
    }
    if ((n.type === "Headline" || n.type === "MarkerHighlight") && n.data?.emphasis?.length) {
      w += 0.5 * Math.min(2, n.data.emphasis.length);
    }
    sum += w;
  });
  return sum;
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node count-visual-elements.js <scenes-v2.json>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];
  const counts = scenes.map((s) => ({ id: s.id, count: countForScene(s) }));
  const sparse = counts.filter((c) => c.count < 4);
  const dense = counts.filter((c) => c.count >= 8);
  const sparsePct = scenes.length > 0 ? (sparse.length / scenes.length) * 100 : 0;
  const avg = counts.reduce((a, b) => a + b.count, 0) / Math.max(1, counts.length);

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔍 visual-elements 검증 (씬당 합산 ≥4 권장 / ≥8 이상적)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  평균: ${avg.toFixed(1)}  sparse(<4): ${sparse.length} (${sparsePct.toFixed(1)}%)  dense(≥8): ${dense.length}`);
  if (sparsePct > 25) {
    console.log("");
    console.log(`❌ [FAIL] sparse 씬 비율 ${sparsePct.toFixed(1)}% > 25%:`);
    sparse.slice(0, 10).forEach((s) => console.log(`  - ${s.id} count=${s.count}`));
    console.log("");
    console.log("해결: 희박 씬에 support 노드 추가 또는 인접 씬과 병합.");
    process.exit(1);
  }
  console.log("");
  console.log("✅ visual-elements 통과.");
  process.exit(0);
}

main();
