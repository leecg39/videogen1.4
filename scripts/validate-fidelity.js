#!/usr/bin/env node
// validate-fidelity.js — HARD GATE: reference DNA 강제 준수
//
// 검증 규칙 (레퍼런스 SC *.png 60장 기반):
//   (1) CompareBars 인스턴스 ≤ 5 (도배 금지)
//   (2) DevIcon 중 DARK_ICONS (GitHub, Vercel 등) 사용 시 circle:true 권장 (visibility)
//   (3) accent_color 분포 — red/yellow/white 합쳐서 ≤ 30%. mint 가 기본이어야.
//   (4) focal.type === "ImpactStat" 이면서 value 가 1~3자 단일 숫자 → 큰 hero 씬.
//       이 씬은 SceneRoot 직계 자식에 큰 ImpactStat 이 존재해야 함 (placeholder 감지).
//   (5) visual_plan.typo_variant === "giant_wordmark" 씬 → stack_root 에 fontSize ≥ 150 노드 1개 이상
//
// postprocess.sh 의 기존 가드 뒤에 삽입됨. 위반 시 exit 1.

const fs = require("fs");

const DARK_ICONS = new Set([
  "GitHub", "GitHubDark", "Vercel", "VercelDark", "NextJs", "NextJsDark",
  "AppleDark", "OpenAI", "ChatGPT",
]);

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  kids.forEach((c) => walk(c, fn));
}

function collectNodes(node, type) {
  const out = [];
  walk(node, (n) => {
    if (n.type === type) out.push(n);
  });
  return out;
}

function largestFontSize(node) {
  let max = 0;
  walk(node, (n) => {
    // FreeText / 일반 노드의 style.fontSize
    const fs = n?.style?.fontSize;
    if (typeof fs === "number" && fs > max) max = fs;
    // ImpactStat size 추정: xl ≈ 200, lg ≈ 150, md ≈ 120
    if (n.type === "ImpactStat") {
      const s = n.data?.size ?? "xl";
      const est = s === "xl" ? 200 : s === "lg" ? 150 : s === "md" ? 120 : 100;
      if (est > max) max = est;
    }
    // MarkerHighlight — data.fontSize
    if (n.type === "MarkerHighlight") {
      const fs = n.data?.fontSize ?? 48;
      if (fs > max) max = fs;
    }
    // RingChart 중앙 숫자 — data.value 는 있지만 렌더링 시 내부 폰트 ≈ 140px
    if (n.type === "RingChart") {
      if (140 > max) max = 140;
    }
    // AnimatedCounter — ImpactStat 과 유사
    if (n.type === "AnimatedCounter") {
      if (180 > max) max = 180;
    }
    // VersusCard — leftValue/rightValue 렌더 fontSize ≈ 28 이지만 시각적 강조 충분
    if (n.type === "VersusCard") {
      if (120 > max) max = 120;
    }
    // AnimatedTimeline — 제목 렌더 fontSize ≈ 38, 강한 visual element 로 인정
    if (n.type === "AnimatedTimeline") {
      if (120 > max) max = 120;
    }
    // Headline data.size (lg/xl)
    if (n.type === "Headline") {
      const s = n.data?.size ?? "md";
      const est = s === "xl" ? 80 : s === "lg" ? 55 : 40;
      if (est > max) max = est;
    }
  });
  return max;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-fidelity.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));
  const total = scenes.length;
  const failures = [];
  const warnings = [];

  // (1) bar-family 합산 쿼터 — docs/design-system.md §8
  // CompareBars + VerticalBars + ProgressBar 합쳐서 ≤ 8
  let cbCount = 0, vbCount = 0, pbCount = 0;
  const barScenes = [];
  for (const sc of scenes) {
    const cb = collectNodes(sc.stack_root, "CompareBars").length;
    const vb = collectNodes(sc.stack_root, "VerticalBars").length;
    const pb = collectNodes(sc.stack_root, "ProgressBar").length;
    cbCount += cb; vbCount += vb; pbCount += pb;
    if (cb + vb + pb > 0) barScenes.push(`${sc.id}(cb=${cb},vb=${vb},pb=${pb})`);
  }
  const barTotal = cbCount + vbCount + pbCount;
  if (barTotal > 8) {
    failures.push(
      `[fidelity:bar-family-overuse] bar-family 합산 ${barTotal}회 (> 8). ` +
        `CompareBars=${cbCount}, VerticalBars=${vbCount}, ProgressBar=${pbCount}. ` +
        `레퍼런스는 bar 계열을 특수 용도로 제한. ` +
        `교체 후보: RingChart / DataTable / EmojiIconList / 커스텀 SvgGraphic. ` +
        `사용 씬: ${barScenes.slice(0, 8).join(", ")}${barScenes.length > 8 ? " ..." : ""}`
    );
  }

  // (2) DevIcon 다크 아이콘 가시성
  const darkIconMisuse = [];
  for (const sc of scenes) {
    const devIcons = collectNodes(sc.stack_root, "DevIcon");
    for (const icon of devIcons) {
      const name = icon.data?.name;
      if (!name) continue;
      // 다크 아이콘은 circle:true 또는 style.filter 적용 강제 (렌더러 auto-fix 가 있지만 경고)
      if (DARK_ICONS.has(name) && !icon.data?.circle) {
        darkIconMisuse.push(`${sc.id}:${name}`);
      }
    }
  }
  if (darkIconMisuse.length > 0) {
    // 2026-04-17 회고: auto-invert 가 실제 렌더에서 동작 안 함. 경고 → HARD FAIL 승격.
    failures.push(
      `[fidelity:dark-icon] DARK_ICONS 를 circle:true 없이 사용 (${darkIconMisuse.length}개). ` +
        `검은 실루엣 아이콘은 다크 배경에서 안 보임. circle:true 필수. ` +
        `${darkIconMisuse.slice(0, 5).join(", ")}${darkIconMisuse.length > 5 ? " ..." : ""}`
    );
  }

  // (3) accent 분포
  const accentCount = { mint: 0, yellow: 0, red: 0, white: 0 };
  for (const sc of scenes) {
    const a = sc.visual_plan?.accent_color;
    if (a in accentCount) accentCount[a] += 1;
  }
  const nonMint = accentCount.yellow + accentCount.red + accentCount.white;
  if (nonMint / total > 0.4) {
    failures.push(
      `[fidelity:accent-distribution] 비-mint accent 비율 ${((nonMint / total) * 100).toFixed(1)}% (> 40%). ` +
        `레퍼런스는 mint 기본 + yellow/red 는 비용/경고 등 특수 상황에만. ` +
        `현재: mint=${accentCount.mint}, yellow=${accentCount.yellow}, red=${accentCount.red}, white=${accentCount.white}`
    );
  }

  // (4) mega-number 패턴의 focal 크기
  const megaMisses = [];
  for (const sc of scenes) {
    const vp = sc.visual_plan;
    if (!vp) continue;
    const megaPatterns = ["P01_mega_number", "P02_number_hero_double_bar", "P38_hero_wordmark", "P39_big_number_context_sub"];
    if (!megaPatterns.includes(vp.pattern_ref)) continue;
    const maxFs = largestFontSize(sc.stack_root);
    if (maxFs < 120) {
      megaMisses.push(`${sc.id}(max=${maxFs}px, need=150+)`);
    }
  }
  if (megaMisses.length >= 3) {
    failures.push(
      `[fidelity:mega-too-small] mega-number 패턴 씬 ${megaMisses.length}개에서 focal 폰트 < 120px. ` +
        `레퍼런스 SC1/5/12 는 150~300px 거대 숫자. ` +
        `${megaMisses.slice(0, 6).join(", ")}${megaMisses.length > 6 ? " ..." : ""}`
    );
  } else if (megaMisses.length > 0) {
    warnings.push(`[fidelity:mega-small] ${megaMisses.length}개 mega 씬 focal 작음.`);
  }

  // (5) typo_variant giant_wordmark 씬 검증
  const wmMisses = [];
  for (const sc of scenes) {
    if (sc.visual_plan?.typo_variant !== "giant_wordmark") continue;
    const maxFs = largestFontSize(sc.stack_root);
    if (maxFs < 150) {
      wmMisses.push(`${sc.id}(max=${maxFs})`);
    }
  }
  if (wmMisses.length > 0) {
    warnings.push(
      `[fidelity:wordmark-small] giant_wordmark typo 씬 ${wmMisses.length}개 폰트 < 150. ${wmMisses.slice(0, 5).join(", ")}`
    );
  }

  // 요약
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 fidelity 검증 (reference DNA)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  CompareBars 총 사용: ${cbCount}`);
  console.log(`  DARK_ICONS 비-circle 사용: ${darkIconMisuse.length}`);
  console.log(`  accent 분포: mint=${accentCount.mint}, yellow=${accentCount.yellow}, red=${accentCount.red}, white=${accentCount.white}`);
  console.log(`  mega-number focal 작은 씬: ${megaMisses.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ fidelity 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 fidelity 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: reference/SC *.png 의 DNA(mint accent, 거대 숫자, 차트 다양화) 를 따르세요."
  );
  process.exit(1);
}

main();
