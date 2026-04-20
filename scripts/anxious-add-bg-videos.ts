#!/usr/bin/env npx tsx
/**
 * anxious-add-bg-videos.ts
 *
 * 22개 씬 TSX에 의도별 BG 비디오를 일괄 추가한다.
 * - import에 OffthreadVideo, staticFile, interpolate 추가
 * - bgOp interpolate 변수 추가
 * - AbsoluteFill 직후 OffthreadVideo 삽입
 */
import * as fs from "fs";
import * as path from "path";

// 씬별 BG 비디오 + 필터 매핑 (의도에 맞는 톤)
const MAP: Record<string, { video: string; filter: string; opacity: number }> = {
  "06": { video: "news-broadcast-studio-dark.mp4", filter: "blur(14px) brightness(0.4) saturate(0.4)", opacity: 0.10 },
  "07": { video: "AI-technology.mp4", filter: "blur(16px) brightness(0.42) hue-rotate(80deg) saturate(0.5)", opacity: 0.09 },
  "09": { video: "team-office.mp4", filter: "blur(14px) brightness(0.4) saturate(0.3)", opacity: 0.10 },
  "11": { video: "laptop-coding.mp4", filter: "blur(12px) brightness(0.4) saturate(0.35) sepia(0.15)", opacity: 0.10 },
  "12": { video: "cloud-computing.mp4", filter: "blur(16px) brightness(0.45) hue-rotate(120deg) saturate(0.4)", opacity: 0.10 },
  "13": { video: "server-data-center.mp4", filter: "blur(14px) brightness(0.4) hue-rotate(-30deg) saturate(0.5)", opacity: 0.10 },
  "15": { video: "terminal-command.mp4", filter: "blur(10px) brightness(0.45) saturate(0.4) hue-rotate(-20deg)", opacity: 0.12 },
  "17": { video: "coding-programming-frustrated-developer.mp4", filter: "blur(14px) brightness(0.4) saturate(0.3) hue-rotate(-15deg)", opacity: 0.10 },
  "18": { video: "artificial-intelligence-technology.mp4", filter: "blur(14px) brightness(0.45) saturate(0.4)", opacity: 0.09 },
  "19": { video: "process-automation-technology.mp4", filter: "blur(14px) brightness(0.4) hue-rotate(90deg) saturate(0.4)", opacity: 0.10 },
  "20": { video: "corporate-technology.mp4", filter: "blur(14px) brightness(0.4) saturate(0.3)", opacity: 0.10 },
  "22": { video: "benchmark-chart.mp4", filter: "blur(14px) brightness(0.45) hue-rotate(80deg) saturate(0.5)", opacity: 0.10 },
  "23": { video: "laptop-home-office.mp4", filter: "blur(14px) brightness(0.4) saturate(0.3)", opacity: 0.10 },
  "24": { video: "server-room-data-center-dark.mp4", filter: "blur(14px) brightness(0.42) hue-rotate(80deg) saturate(0.45)", opacity: 0.10 },
  "25": { video: "process-automation.mp4", filter: "blur(14px) brightness(0.4) saturate(0.3)", opacity: 0.10 },
  "26": { video: "server-room.mp4", filter: "blur(14px) brightness(0.38) hue-rotate(-15deg) saturate(0.4)", opacity: 0.09 },
  "27": { video: "server-room-data-center.mp4", filter: "blur(14px) brightness(0.4) hue-rotate(80deg) saturate(0.4)", opacity: 0.09 },
  "28": { video: "benchmark-testing-performance-chart.mp4", filter: "blur(14px) brightness(0.4) saturate(0.4)", opacity: 0.10 },
  "29": { video: "artificial-intelligence-technology-futur.mp4", filter: "blur(14px) brightness(0.45) hue-rotate(80deg) saturate(0.5)", opacity: 0.10 },
  "30": { video: "benchmark-performance-testing.mp4", filter: "blur(14px) brightness(0.4) saturate(0.35)", opacity: 0.10 },
  "31": { video: "process-automation-pipeline-technology.mp4", filter: "blur(16px) brightness(0.45) hue-rotate(80deg) saturate(0.5)", opacity: 0.10 },
  "32": { video: "cloud-computing.mp4", filter: "blur(16px) brightness(0.42) hue-rotate(80deg) saturate(0.45)", opacity: 0.10 },
  "34": { video: "sunset-city-skyline.mp4", filter: "blur(16px) brightness(0.4) saturate(0.4) sepia(0.2)", opacity: 0.10 },
};

let modified = 0;
for (const [num, cfg] of Object.entries(MAP)) {
  const file = `src/remotion/custom/anxious/scene-${num}.tsx`;
  if (!fs.existsSync(file)) {
    console.log(`✗ skip ${file} (not found)`);
    continue;
  }
  let src = fs.readFileSync(file, "utf-8");

  // 이미 OffthreadVideo가 있으면 skip
  if (src.includes("OffthreadVideo")) {
    console.log(`◯ skip scene-${num} (already has video)`);
    continue;
  }

  // 1) import 라인에 OffthreadVideo, staticFile 추가
  // 패턴: import { ... } from "remotion";
  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*"remotion";/,
    (_match, names) => {
      const items = names.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (!items.includes("OffthreadVideo")) items.push("OffthreadVideo");
      if (!items.includes("staticFile")) items.push("staticFile");
      return `import { ${items.join(", ")} } from "remotion";`;
    }
  );

  // 2) bgOp 변수 삽입 (export const ... 첫 줄 아래)
  // 패턴: const { fps } = useVideoConfig(); 가 있는 줄 다음, 또는 export const Comp = ... ({ frame ... }) => { 다음 줄
  const bgOpDecl = `\n  const __bgOp = interpolate(frame, [0, 36], [0, ${cfg.opacity}], { extrapolateRight: "clamp" });`;

  if (src.includes("const { fps } = useVideoConfig();")) {
    src = src.replace(
      "const { fps } = useVideoConfig();",
      `const { fps } = useVideoConfig();${bgOpDecl}`
    );
  } else {
    // useVideoConfig 가 없는 경우 (드물게)
    src = src.replace(
      /(export const \w+Scene\d+: React\.FC<NodeProps> = \(\{\s*frame[^}]*\}\)\s*=>\s*\{)/,
      `$1${bgOpDecl}`
    );
  }

  // 3) <AbsoluteFill 다음 라인에 OffthreadVideo 삽입
  const videoTag = `      <OffthreadVideo
        src={staticFile("videos/vibe-news-0407/${cfg.video}")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: __bgOp, filter: "${cfg.filter}" }}
        volume={0}
      />
`;

  // <AbsoluteFill ... > 다음 첫 라인에 삽입
  src = src.replace(
    /(<AbsoluteFill\s+style=\{[^}]+\}[^>]*>(?:[\s\S]+?)(?:\}>)?\s*\n)/,
    (match) => match + videoTag
  );

  fs.writeFileSync(file, src);
  console.log(`✓ scene-${num} ← ${cfg.video}`);
  modified++;
}

console.log(`\n✅ ${modified} scenes updated`);
