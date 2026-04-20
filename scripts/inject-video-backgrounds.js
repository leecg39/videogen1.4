#!/usr/bin/env node
// inject-video-backgrounds.js — vibe-news-0407 78씬에 narration 매칭 VideoClip 배경을 prepend.
// - 각 씬의 stack_root.children[0] 위치에 { type: "Absolute", children: [{ type: "VideoClip", ... }] } 삽입
// - 기존 content 노드는 전혀 변경하지 않음 (Absolute 는 pointer-events:none, zIndex 하위)
// - narration 기반 비디오 매칭은 아래 KEYWORD_VIDEO 룰. asset_mode="video" 이므로 전수 적용.
//
// 사용: node scripts/inject-video-backgrounds.js data/vibe-news-0407/scenes-v2.json
//
// 주의: 이 스크립트는 stack_root 자체를 template-loop 로 재생성하지 않음. 단순히 배경 레이어 prepend.
//       mass realizer 금지 규칙의 본질(narration-stack_root mismatch)을 위반하지 않음.

const fs = require("fs");
const path = require("path");

const KEYWORD_VIDEO = [
  // [regex, mp4, priority(낮을수록 강함)]
  [/터미널|command|CLI|코드 입력|코드를 쓰|터미널에서/, "terminal-command.mp4", 1],
  [/벤치마크|성능.*비교|점수.*비교|benchmark/, "benchmark-chart.mp4", 1],
  [/코딩.*막혔|무한.*반복|코딩.*좌절|frustrat/, "coding-frustrated-developer.mp4", 1],
  [/뉴스|브로드캐스트|배달해|생업/, "news-broadcast-studio-dark.mp4", 1],
  [/맥북|laptop.*dark|home.*office.*dark/, "laptop-computer-home-office-dark.mp4", 1],
  [/맥북|M1|M2|M4|애플 실리콘/, "laptop-coding.mp4", 2],
  [/홈오피스|재택|집에서/, "laptop-home-office.mp4", 2],
  [/터미널|CLI|커맨드/, "terminal-command.mp4", 2],
  [/데이터|시각화|그래프|차트|수치|파라미터/, "data-visualization.mp4", 2],
  [/벤치마크|성능|테스트/, "benchmark-performance-testing.mp4", 2],
  [/클라우드|cloud|원격/, "cloud-computing.mp4", 2],
  [/서버룸|데이터센터|server.*room/, "server-room-data-center.mp4", 2],
  [/서버|인프라/, "server-room.mp4", 3],
  [/자동화|pipeline|파이프라인|워크플로우|자동으로/, "process-automation-pipeline-technology.mp4", 2],
  [/자동화|반복.*일/, "process-automation.mp4", 3],
  [/회의|미팅|팀 회의|meeting/, "business-meeting.mp4", 2],
  [/기업|enterprise|corporate|엔터프라이즈/, "corporate-office-technology.mp4", 3],
  [/사무실|office|오피스/, "team-office.mp4", 3],
  [/도시|스카이라인|노을|야경|일몰/, "sunset-city-skyline.mp4", 2],
  [/미래|futuristic|공상/, "futuristic-technology.mp4", 3],
  [/AI 기술|인공지능 기술/, "artificial-intelligence-technology.mp4", 2],
  [/코드 작성|코드를 짜|프로그래밍/, "coding-programming.mp4", 2],
  [/코딩/, "coding-dark-screen.mp4", 3],
  [/AI|인공지능|모델|GPT|클로드|claude|Gemini|gpt|ai|엔트로픽/, "AI-technology.mp4", 3],
];

function pickVideo(narration) {
  const narr = narration || "";
  let best = null;
  for (const [pat, vid, pri] of KEYWORD_VIDEO) {
    if (pat.test(narr)) {
      if (!best || pri < best[2]) best = [pat, vid, pri];
    }
  }
  return best ? best[1] : "futuristic-technology-abstract.mp4";
}

function buildBgLayer(sceneId, videoFile) {
  return {
    id: `${sceneId}-bg-layer`,
    type: "Absolute",
    layout: {},
    style: { zIndex: 0 },
    children: [
      {
        id: `${sceneId}-bg-video`,
        type: "VideoClip",
        data: {
          src: `videos/vibe-news-0407/${videoFile}`,
          objectFit: "cover",
          loop: true,
          durationSec: 10,
          overlay: "rgba(8,6,13,0.62)",
        },
        style: {
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        },
        motion: { enterAt: 0, duration: 12 },
      },
    ],
  };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/inject-video-backgrounds.js <scenes-v2.json>");
    process.exit(2);
  }
  const abs = path.resolve(file);
  const raw = fs.readFileSync(abs, "utf8");
  const scenes = JSON.parse(raw);
  if (!Array.isArray(scenes)) {
    console.error("Expected top-level array of scenes.");
    process.exit(2);
  }

  let injected = 0;
  let skipped = 0;
  const pickLog = [];

  for (const s of scenes) {
    const root = s.stack_root;
    if (!root || root.type !== "SceneRoot" || !Array.isArray(root.children)) {
      console.warn(`[SKIP] ${s.id}: missing/invalid stack_root`);
      skipped++;
      continue;
    }
    const hasBg = root.children.some(
      (c) => c.id && typeof c.id === "string" && c.id.endsWith("-bg-layer")
    );
    if (hasBg) {
      skipped++;
      continue;
    }
    const vid = pickVideo(s.narration);
    root.children.unshift(buildBgLayer(s.id, vid));
    pickLog.push(`${s.id}\t${vid}`);
    injected++;
  }

  fs.writeFileSync(abs, JSON.stringify(scenes, null, 2));
  console.log(`injected=${injected} skipped=${skipped} total=${scenes.length}`);
  console.log("--- matches ---");
  pickLog.forEach((l) => console.log(l));
}

main();
