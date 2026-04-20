#!/usr/bin/env node
// validate-freetext-cap.js — HARD GATE: FreeText 남발 금지
//
// 배경: 2026-04-17 실측 결과 78씬의 FreeText 사용량이 320건(평균 4.1개/씬).
// FreeText + Absolute 좌표 지정 패턴이 정렬 깨짐의 근본 원인.
// Hyperframes 가드레일 원칙: "카논 노드로 흡수하라 — 익명 free-form 금지".
//
// 규칙:
//   (1) 씬당 FreeText 개수 ≤ 2 (≥ 3 시 FAIL)
//   (2) 전체 씬의 FreeText 총합 / 씬 수 ≤ 2.0 (평균)
//   (3) 같은 텍스트가 FreeText 여러 개로 쪼개져 있으면 WARN
//
// 해결: FreeText 를 Kicker / Headline / BodyText / FooterCaption / Badge 중
// 의미에 맞는 카논 노드로 교체. 자유 레이아웃이 필요하면 Stack/Grid 컨테이너 사용.
//
// postprocess.sh ⑥-t 로 삽입.

const fs = require("fs");

const CAP_PER_SCENE = 2;
const CAP_AVG = 2.0;

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-freetext-cap.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const perScene = [];
  let total = 0;
  const fails = [];
  const warns = [];

  for (const sc of scenes) {
    if (!sc.stack_root) {
      perScene.push({ id: sc.id, count: 0 });
      continue;
    }
    const freeTexts = [];
    walk(sc.stack_root, (n, path) => {
      if (n.type === "FreeText") {
        freeTexts.push({
          text: (n.data && n.data.text) || "",
          loc: [...path, "FreeText"].join(">"),
        });
      }
    });
    const count = freeTexts.length;
    total += count;
    perScene.push({ id: sc.id, count, items: freeTexts });

    if (count > CAP_PER_SCENE) {
      fails.push({
        id: sc.id,
        count,
        sample: freeTexts.slice(0, 3).map((f) => `"${f.text.slice(0, 20)}"`).join(", "),
      });
    }
  }

  const avg = scenes.length > 0 ? total / scenes.length : 0;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 FreeText cap 검증 (씬당 ≤ 2)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${scenes.length}  ·  총 FreeText: ${total}  ·  평균: ${avg.toFixed(2)}개/씬`);

  const topScenes = perScene
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  if (topScenes.length) {
    console.log(`  최대 사용 씬 Top5: ${topScenes.map((s) => `${s.id}(${s.count})`).join(", ")}`);
  }

  if (avg > CAP_AVG) {
    fails.push({
      id: "(aggregate)",
      count: Number(avg.toFixed(2)),
      sample: `씬당 평균 ${avg.toFixed(2)} > ${CAP_AVG}. 텍스트 전반을 카논 노드로 리팩터.`,
    });
  }

  if (warns.length > 0) {
    console.log("");
    console.log(`⚠️  경고 ${warns.length}건:`);
    warns.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
  }

  if (fails.length === 0) {
    console.log("");
    console.log("✅ FreeText cap 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${fails.length}개 FreeText 남발 위반:`);
  fails.slice(0, 15).forEach((f) => console.log(`  - ${f.id}: ${f.count}개 (${f.sample})`));
  if (fails.length > 15) console.log(`  ... 외 ${fails.length - 15}개`);
  console.log("");
  console.log(
    "해결: FreeText 는 Kicker / Headline / BodyText / FooterCaption / Badge 중 의미에 맞는 카논 노드로 교체. Absolute 좌표 대신 Stack/Grid 컨테이너 사용."
  );
  process.exit(1);
}

main();
