#!/usr/bin/env node
// validate-node-uniqueness.js — HARD GATE: 시각 템플릿-loop 탐지
//
// 배경: 2026-04-17 세션에서 SvgGraphic "warning triangle" 이 5개 씬(14/21/29/39/67/73)
// 에서 동일 모양으로 재사용됨. realizer fallback 이 narration 과 무관하게 경고삼각형
// 기본값을 찍어낸 결과. 사용자 지적: "매번 같은 삼각형 경고".
//
// 검증 규칙:
//   (1) SvgGraphic elements 조합 해시 — 동일 해시 3회 이상 = FAIL
//   (2) CompareBars items.length < 3 인 씬이 3개 이상 = FAIL (2-bar 약한 BAR_DUP)
//   (3) warning-triangle 패턴 탐지 (viewBox "0 0 120 120" + path 3~4개) — 경고 키워드
//       없는 narration 에서 2회 이상 = FAIL
//
// postprocess.sh ⑥-e 로 삽입.

const fs = require("fs");
const crypto = require("crypto");

const WARNING_KEYWORDS = [
  "경고", "위험", "주의", "조심", "버그", "고장", "오류", "실패",
  "문제", "사고", "장애", "결함", "위반",
];

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn));
}

function svgSignature(node) {
  if (node.type !== "SvgGraphic") return null;
  const d = node.data || {};
  const vb = d.viewBox || "";
  const els = Array.isArray(d.elements) ? d.elements : [];
  // 각 element 의 tag + 기본 구조만 해시 (attrs 좌표 등은 무시)
  const sig = {
    vb,
    w: d.width,
    h: d.height,
    els: els.map((e) => ({
      tag: e.tag,
      // path 의 경우 M,L,Z 구조 정도만
      d_len: e?.attrs?.d ? String(e.attrs.d).length : 0,
    })),
  };
  return crypto
    .createHash("md5")
    .update(JSON.stringify(sig))
    .digest("hex")
    .slice(0, 10);
}

function isWarningTriangle(node) {
  if (node.type !== "SvgGraphic") return false;
  const d = node.data || {};
  const els = Array.isArray(d.elements) ? d.elements : [];
  // warning triangle 신호: viewBox 정방형 근처 + path 1~3개 + 내부 "!" line/circle
  const hasTriangle = els.some((e) => {
    if (e.tag !== "path" && e.tag !== "polygon") return false;
    const da = e?.attrs?.d || "";
    const pts = e?.attrs?.points || "";
    // 삼각형 polygon 또는 M...L...L...Z 3점
    return /^M[\s\d.]+L[\s\d.]+L[\s\d.]+(?:Z|L)/.test(da) || (pts && pts.split(" ").length >= 3);
  });
  const hasBang = els.some((e) => e.tag === "line" || (e.tag === "circle" && e?.attrs?.r && Number(e.attrs.r) <= 10));
  return hasTriangle && hasBang;
}

function hasWarningNarration(narration) {
  if (!narration) return false;
  const n = String(narration);
  return WARNING_KEYWORDS.some((k) => n.includes(k));
}

function collectNodes(root, type) {
  const out = [];
  walk(root, (n) => {
    if (n.type === type) out.push(n);
  });
  return out;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-node-uniqueness.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));

  const failures = [];
  const warnings = [];

  // (1) SvgGraphic 해시 반복
  const svgHashMap = new Map();
  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    walk(sc.stack_root, (n) => {
      if (n.type === "SvgGraphic") {
        const h = svgSignature(n);
        if (!h) return;
        if (!svgHashMap.has(h)) svgHashMap.set(h, []);
        svgHashMap.get(h).push(sc.id);
      }
    });
  }
  for (const [h, ids] of svgHashMap) {
    if (ids.length >= 3) {
      failures.push(
        `[node:svg-duplicate] 동일 SvgGraphic 시그니처 (${h}) 가 ${ids.length}개 씬에서 반복 — ${ids.slice(0, 6).join(", ")}${ids.length > 6 ? " ..." : ""}. ` +
          `realizer fallback template-loop 의심. 씬별 고유 SVG 설계 필요.`
      );
    }
  }

  // (2) CompareBars items < 3 인 씬 카운트
  const weakBarScenes = [];
  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    const bars = collectNodes(sc.stack_root, "CompareBars");
    for (const b of bars) {
      const items = b?.data?.items || [];
      if (items.length < 3) {
        weakBarScenes.push(`${sc.id}(${items.length})`);
        break;
      }
    }
  }
  if (weakBarScenes.length >= 3) {
    failures.push(
      `[node:weak-compareBar] items < 3 인 CompareBars 씬 ${weakBarScenes.length}개. ` +
        `2-bar CompareBars 는 시각적으로 약함. items ≥ 3 으로 author 또는 VerticalBars/DataTable 로 교체. ` +
        `${weakBarScenes.slice(0, 6).join(", ")}${weakBarScenes.length > 6 ? " ..." : ""}`
    );
  } else if (weakBarScenes.length > 0) {
    warnings.push(`[node:weak-compareBar] 2-bar CompareBars ${weakBarScenes.length}개 씬.`);
  }

  // (3) warning-triangle narration 미스매치
  const warningMisuse = [];
  const warningAll = [];
  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    let hasWarning = false;
    walk(sc.stack_root, (n) => {
      if (isWarningTriangle(n)) hasWarning = true;
    });
    if (hasWarning) {
      warningAll.push(sc.id);
      if (!hasWarningNarration(sc.narration)) {
        warningMisuse.push(sc.id);
      }
    }
  }
  if (warningMisuse.length >= 2) {
    failures.push(
      `[node:warning-misuse] SvgGraphic warning-triangle 이 경고 키워드 없는 narration 씬 ${warningMisuse.length}개에 사용 — ` +
        `${warningMisuse.slice(0, 6).join(", ")}${warningMisuse.length > 6 ? " ..." : ""}. ` +
        `warning triangle 은 narration 에 [${WARNING_KEYWORDS.slice(0, 6).join("/")}] 등 경고 키워드 명시된 씬에만 사용.`
    );
  } else if (warningMisuse.length > 0) {
    warnings.push(
      `[node:warning-misuse] ${warningMisuse.length}개 씬에 부적절한 warning triangle.`
    );
  }
  if (warningAll.length > 2) {
    warnings.push(
      `[node:warning-overuse] warning triangle 총 ${warningAll.length}회 사용. 레퍼런스는 ≤2회 권장.`
    );
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 node uniqueness 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  고유 SvgGraphic 시그니처: ${svgHashMap.size}`);
  console.log(`  2-bar CompareBars 씬: ${weakBarScenes.length}`);
  console.log(`  warning triangle 총 사용: ${warningAll.length}`);
  console.log(`  warning triangle narration 미스매치: ${warningMisuse.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ node uniqueness 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 node uniqueness 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: 씬별 고유 SVG 설계 + CompareBars items ≥ 3 + warning triangle 은 경고 narration 씬에만."
  );
  process.exit(1);
}

main();
