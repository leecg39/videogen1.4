#!/usr/bin/env node
// validate-label-quality.js — HARD GATE: 라벨/텍스트 품질 강제
//
// 배경: 2026-04-17 세션에서 mass realizer 가 extract_phrases()[0] 결과를
// Kicker/Badge/focal.label/BodyText 에 동시 주입하여 35+ 씬이 DUP_PHRASE 실패.
// 예: scene-039 "현실적으로" 가 Kicker 와 Badge 에 중복, narration 무관.
//
// 검증 규칙:
//   (1) 씬 내 동일 텍스트(정규화) 2회 이상 반복 금지 (Kicker, Badge, focal.label, FooterCaption 등)
//   (2) 라벨 텍스트는 의미있는 명사구여야 함
//       - 조사로 끝나는 금지어 블랙리스트 (은/는/이/가/을/를/에/에서/으로 etc.)
//       - ≤ 2자 한글 기능어 금지 (그냥/물론/그런/나도/우리는 부분)
//   (3) Kicker.text === focal.data.label 동일 금지
//   (4) support 노드의 text 가 focal.label 과 정확히 같으면 FAIL (meta-redundancy)
//
// 위반 시 exit 1. postprocess.sh ⑥-d 로 삽입.

const fs = require("fs");

// 조사/어미 끝나는 패턴 — 명사구가 아니고 narration 첫 phrase 를 잘라 넣은 신호
const PARTICLE_ENDINGS = [
  "은", "는", "이", "가", "을", "를", "에", "에서", "으로", "로",
  "와", "과", "도", "만", "까지", "부터", "처럼", "보다", "같이",
  "의", "부터", "께서",
];

// 기능어 / 접속사 / 부사 — 의미 없는 라벨 신호
const FUNCTION_WORDS = new Set([
  "그리고", "그런데", "그러나", "하지만", "또는", "또한",
  "그냥", "물론", "그런", "이런", "저런", "어떤",
  "나도", "저도", "우리는", "우리", "저는", "제가",
  "사람이", "사람은", "사람들",
  "지금", "아직", "이미", "벌써",
  "가장", "가지", "어떻", "왜", "무엇",
  "오늘", "어제", "내일",
  "정말", "진짜", "확실", "정확한", "번역까지",
  "예전", "지난",
]);

function normalize(text) {
  if (!text || typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ");
}

function endsWithParticle(text) {
  const t = normalize(text);
  if (t.length < 2) return false;
  for (const p of PARTICLE_ENDINGS) {
    if (t.endsWith(p) && t.length - p.length <= 3) return true;
  }
  return false;
}

function isFunctionWord(text) {
  const t = normalize(text);
  if (FUNCTION_WORDS.has(t)) return true;
  // 조사 떼어낸 어간이 기능어인지
  for (const p of PARTICLE_ENDINGS) {
    if (t.endsWith(p)) {
      const stem = t.slice(0, -p.length);
      if (FUNCTION_WORDS.has(stem)) return true;
    }
  }
  return false;
}

function collectTextNodes(node, scene, path = []) {
  const out = [];
  if (!node || typeof node !== "object") return out;

  const loc = [...path, node.type || "?"].join(">");
  const d = node.data || {};

  // Kicker / FooterCaption / Badge / Headline / BodyText / QuoteText / MarkerHighlight / FreeText
  if (["Kicker", "FooterCaption", "Badge", "Headline", "BodyText", "QuoteText", "MarkerHighlight", "DualToneText", "FreeText"].includes(node.type)) {
    const t = normalize(d.text);
    if (t) out.push({ text: t, nodeType: node.type, role: "text", loc });
  }

  // ImpactStat / AnimatedCounter / NumberCircle — value + label
  if (["ImpactStat", "AnimatedCounter", "NumberCircle"].includes(node.type)) {
    const lb = normalize(d.label);
    if (lb) out.push({ text: lb, nodeType: node.type, role: "label", loc });
  }

  // RingChart / PieChart / ProgressBar — label
  if (["RingChart", "PieChart", "ProgressBar"].includes(node.type)) {
    const lb = normalize(d.label || d.title);
    if (lb) out.push({ text: lb, nodeType: node.type, role: "label", loc });
  }

  // VersusCard — leftLabel / rightLabel / leftValue / rightValue
  if (node.type === "VersusCard") {
    ["leftLabel", "rightLabel", "leftValue", "rightValue"].forEach((k) => {
      const t = normalize(d[k]);
      if (t) out.push({ text: t, nodeType: node.type, role: k, loc });
    });
  }

  // CompareBars / VerticalBars — items[].label
  if (["CompareBars", "VerticalBars"].includes(node.type) && Array.isArray(d.items)) {
    d.items.forEach((it, i) => {
      const t = normalize(it?.label);
      if (t) out.push({ text: t, nodeType: node.type, role: `item${i}`, loc });
    });
  }

  // BulletList / CheckMark / EmojiIconList
  if (node.type === "BulletList" && Array.isArray(d.items)) {
    d.items.forEach((it, i) => {
      const t = typeof it === "string" ? it : normalize(it?.text);
      const tt = normalize(t);
      if (tt) out.push({ text: tt, nodeType: node.type, role: `bullet${i}`, loc });
    });
  }
  if (node.type === "CheckMark") {
    const t = normalize(d.label);
    if (t) out.push({ text: t, nodeType: node.type, role: "label", loc });
  }

  // FlowDiagram / AnimatedTimeline / CycleDiagram — steps[].label
  if (["FlowDiagram", "AnimatedTimeline", "CycleDiagram"].includes(node.type)) {
    const steps = d.steps || [];
    steps.forEach((s, i) => {
      const t = normalize(s?.label);
      if (t) out.push({ text: t, nodeType: node.type, role: `step${i}`, loc });
      const ds = normalize(s?.desc);
      if (ds) out.push({ text: ds, nodeType: node.type, role: `step${i}-desc`, loc });
    });
    const cl = normalize(d.centerLabel);
    if (cl) out.push({ text: cl, nodeType: node.type, role: "center", loc });
  }

  // DevIcon / ImageAsset — name / label
  if (node.type === "DevIcon") {
    const lb = normalize(d.label);
    if (lb) out.push({ text: lb, nodeType: node.type, role: "label", loc });
  }
  if (node.type === "ImageAsset") {
    const lb = normalize(d.label || d.caption);
    if (lb) out.push({ text: lb, nodeType: node.type, role: "label", loc });
  }

  // children 재귀
  const kids = node.children || [];
  if (Array.isArray(kids)) {
    kids.forEach((c) => out.push(...collectTextNodes(c, scene, [...path, node.type || "?"])));
  }

  return out;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-label-quality.js <scenes-v2.json>");
    process.exit(2);
  }
  const scenes = JSON.parse(fs.readFileSync(file, "utf8"));

  const failures = [];
  const warnings = [];
  const scenesWithDup = [];
  const scenesWithParticle = [];
  const scenesWithFunction = [];

  for (const sc of scenes) {
    if (!sc.stack_root) continue;
    const texts = collectTextNodes(sc.stack_root, sc);
    if (texts.length === 0) continue;

    // (1) 씬 내 동일 텍스트 2회 이상
    const counts = new Map();
    for (const t of texts) {
      const key = t.text;
      if (!counts.has(key)) counts.set(key, []);
      counts.get(key).push(t);
    }
    const dupTexts = [];
    for (const [text, instances] of counts) {
      if (instances.length >= 2) {
        dupTexts.push({ text, n: instances.length, where: instances.map((i) => `${i.nodeType}.${i.role}`) });
      }
    }
    if (dupTexts.length > 0) {
      scenesWithDup.push({ id: sc.id, dups: dupTexts });
    }

    // (2-a) Kicker / Badge / focal.label 등 핵심 라벨의 조사-끝남 또는 기능어 검사
    // (단, BulletList items, ChatBubble messages 같은 긴 문장은 예외)
    const LABEL_ROLES = new Set([
      "text", // Kicker/Badge/Headline/FooterCaption/MarkerHighlight
      "label", // ImpactStat/RingChart/DevIcon
      "leftLabel", "rightLabel", "leftValue", "rightValue",
      "center",
    ]);
    const partViolations = [];
    const funcViolations = [];
    for (const t of texts) {
      if (!LABEL_ROLES.has(t.role)) continue;
      // step* role 는 flow label 이므로 완화
      if (t.role.startsWith("step") && !t.role.endsWith("-desc")) continue;
      // Kicker/Badge/FreeText/ImpactStat.label 등 명사 강제
      if (["Kicker", "Badge", "FreeText", "ImpactStat", "RingChart", "PieChart"].includes(t.nodeType) || t.role.includes("Label") || t.role === "center") {
        if (isFunctionWord(t.text)) {
          funcViolations.push(`${t.nodeType}.${t.role}="${t.text}"`);
        } else if (endsWithParticle(t.text) && t.text.length <= 6) {
          partViolations.push(`${t.nodeType}.${t.role}="${t.text}"`);
        }
      }
    }
    if (funcViolations.length > 0) {
      scenesWithFunction.push({ id: sc.id, items: funcViolations });
    }
    if (partViolations.length >= 2) {
      scenesWithParticle.push({ id: sc.id, items: partViolations });
    }
  }

  // FAIL 조건
  if (scenesWithDup.length > 0) {
    failures.push(
      `[label:duplicate] 씬 내 동일 텍스트 반복 ${scenesWithDup.length}개 씬. ` +
        `각 씬의 Kicker/Badge/focal.label/FooterCaption 이 같은 단어를 공유. ` +
        `(예: ${scenesWithDup.slice(0, 3).map((s) => `${s.id}:"${s.dups[0].text}"(×${s.dups[0].n}, ${s.dups[0].where.join("|")})`).join(", ")}${scenesWithDup.length > 3 ? " ..." : ""})`
    );
  }
  if (scenesWithFunction.length >= 5) {
    failures.push(
      `[label:function-word] 기능어(그리고/물론/그냥 등)를 focal.label / Kicker 에 ${scenesWithFunction.length}개 씬이 사용. ` +
        `라벨은 의미있는 명사구여야 함. extract_phrases()[0] 맹목 주입 의심. ` +
        `(예: ${scenesWithFunction.slice(0, 3).map((s) => `${s.id}:${s.items[0]}`).join(", ")})`
    );
  } else if (scenesWithFunction.length > 0) {
    warnings.push(
      `[label:function-word] ${scenesWithFunction.length}개 씬에 기능어 라벨. (예: ${scenesWithFunction.slice(0, 2).map((s) => `${s.id}:${s.items[0]}`).join(", ")})`
    );
  }
  if (scenesWithParticle.length >= 5) {
    failures.push(
      `[label:particle-ending] 조사로 끝나는 짧은 라벨 ${scenesWithParticle.length}개 씬 (씬당 ≥2개). ` +
        `명사구가 아닌 narration 첫 음절 절단 신호. ` +
        `(예: ${scenesWithParticle.slice(0, 3).map((s) => `${s.id}:${s.items[0]}`).join(", ")})`
    );
  } else if (scenesWithParticle.length > 0) {
    warnings.push(
      `[label:particle-ending] ${scenesWithParticle.length}개 씬에 조사 끝 라벨.`
    );
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 label quality 검증");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  중복 텍스트 있는 씬: ${scenesWithDup.length}`);
  console.log(`  기능어 라벨 씬: ${scenesWithFunction.length}`);
  console.log(`  조사 끝 라벨 씬: ${scenesWithParticle.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`⚠️  ${warnings.length}개 경고:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ label quality 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 label quality 위반:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log(
    "해결: Kicker / Badge / focal.label 은 서로 다른 의미있는 명사구로 authoring. narration 첫 단어 복사 금지."
  );
  process.exit(1);
}

main();
