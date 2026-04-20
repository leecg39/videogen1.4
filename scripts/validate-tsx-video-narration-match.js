#!/usr/bin/env node
// validate-tsx-video-narration-match.js — R8 (d) P10 재정의.
//
// 원래 validate-background-coverage.js 는 scene.background.video 필드만 검사 → OBSOLETE.
// 재정의: TSX 파일 내 `<OffthreadVideo src=...>` 를 스캔, 해당 영상이 narration 주제와
// 의미상 매칭되는지 24 키워드 룰로 검증.
//
// 실패: aesthetic-only 배경 (scene-22 방송 스튜디오 같은 무관 매칭) 차단.
//
// 사용: node scripts/validate-tsx-video-narration-match.js <scenes-v2.json>

const fs = require("fs");
const path = require("path");

// R5 에서 사용한 24 키워드 → video 매핑. narration-side 매칭도 동일한 키를 사용.
const VIDEO_KEYWORDS = {
  "terminal-command.mp4": [/터미널|command|CLI|코드 입력|코드를 쓰|터미널에서/, /\/ultraplan/],
  "benchmark-chart.mp4": [/벤치마크|성능.*비교|점수.*비교|benchmark/],
  "benchmark-performance-testing.mp4": [/벤치마크|성능|테스트/],
  "coding-frustrated-developer.mp4": [/코딩.*막혔|무한.*반복|코딩.*좌절|frustrat/],
  "coding-programming.mp4": [/코드 작성|코드를 짜|프로그래밍|코딩/],
  "coding-dark-screen.mp4": [/코딩|다크.*화면|어두운.*스크린/],
  "news-broadcast-studio-dark.mp4": [/뉴스|브로드캐스트|배달해|생업|방송/],
  "laptop-coding.mp4": [/맥북|M1|M2|M4|애플 실리콘|laptop.*coding/],
  "laptop-computer-home-office-dark.mp4": [/맥북|laptop.*dark|home.*office.*dark/],
  "laptop-home-office.mp4": [/홈오피스|재택|집에서/],
  "data-visualization.mp4": [/데이터|시각화|그래프|차트|수치|파라미터/],
  "cloud-computing.mp4": [/클라우드|cloud|원격/],
  "server-room.mp4": [/서버|인프라/],
  "server-room-data-center.mp4": [/서버룸|데이터센터|server.*room/],
  "process-automation.mp4": [/자동화|pipeline|파이프라인|워크플로우|자동으로|반복.*일/],
  "process-automation-pipeline-technology.mp4": [/자동화|파이프라인|워크플로우/],
  "business-meeting.mp4": [/회의|미팅|팀 회의|meeting/],
  "corporate-office-technology.mp4": [/기업|enterprise|corporate|엔터프라이즈/],
  "team-office.mp4": [/사무실|office|오피스|팀/],
  "sunset-city-skyline.mp4": [/도시|스카이라인|노을|야경|일몰/],
  "futuristic-technology.mp4": [/미래|futuristic|공상/],
  "futuristic-technology-abstract.mp4": [/미래|추상|abstract/],
  "artificial-intelligence-technology.mp4": [/AI 기술|인공지능 기술/],
  "AI-technology.mp4": [/AI|인공지능|모델|GPT|클로드|claude|Gemini|gpt|ai|엔트로픽/],
};

function extractVideoSrcs(src) {
  // <OffthreadVideo src={staticFile("videos/.../xxx.mp4")} .../>
  // or <OffthreadVideo src="https://..." ...>
  const results = [];
  const regex = /<OffthreadVideo[^>]*src=\{?\s*(?:staticFile\(\s*)?["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    results.push(m[1]);
  }
  return results;
}

function filenameFromSrc(srcPath) {
  return path.basename(srcPath);
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/validate-tsx-video-narration-match.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`tsx-video-narration-match 검증 (원칙 C · P10 재정의)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const issues = [];
  let tsxChecked = 0;
  let videoUsed = 0;

  for (const s of scenes) {
    const root = s.stack_root;
    if (!(root?.type === "SceneRoot" && root.children?.[0]?.type === "TSX")) continue;
    const comp = root.children[0]?.data?.component;
    const tsxFile = path.join("src/remotion/custom", `${comp}.tsx`);
    if (!fs.existsSync(tsxFile)) continue;
    tsxChecked++;
    const src = fs.readFileSync(tsxFile, "utf8");
    const srcs = extractVideoSrcs(src);
    if (srcs.length === 0) continue;
    videoUsed++;

    for (const vsrc of srcs) {
      const fname = filenameFromSrc(vsrc);
      const narr = s.narration || "";
      const rules = VIDEO_KEYWORDS[fname];
      if (!rules) {
        issues.push({ id: s.id, comp, fname, reason: "unknown video (키워드 룰 없음)" });
        continue;
      }
      const matched = rules.some((re) => re.test(narr));
      if (!matched) {
        issues.push({ id: s.id, comp, fname, reason: "narration 미매칭 (aesthetic-only 의심)", narrExcerpt: narr.slice(0, 50) });
      }
    }
  }

  console.log(`  TSX 씬: ${tsxChecked}  ·  video 사용 씬: ${videoUsed}  ·  위반: ${issues.length}`);

  if (issues.length > 0) {
    for (const it of issues) {
      console.log(`❌ [FAIL:tsx-video-narration-match] ${it.id} ${it.comp} uses ${it.fname} — ${it.reason}${it.narrExcerpt ? ` / narr: "${it.narrExcerpt}..."` : ""}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("✅ [PASS] 모든 TSX 씬 내 OffthreadVideo 는 narration 과 의미 매칭.");
}

main();
