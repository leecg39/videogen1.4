#!/usr/bin/env node
// validate-subtitle-visual-dedup.js — Scene Grammar v1.2 픽셀 게이트 P3
//
// 규칙:
//   - 씬의 subtitles[].text concat 과 stack_root 내 모든 data.text / data.label / data.value
//     concat 사이의 유사도(Levenshtein similarity) 가 > 0.6 이면 FAIL.
//   - vibe-news-0407 "다음에 또 만나요" 완전 동일 / "75K★" ↔ "7만 5천 개" 사례 7건 차단.
//
// Usage:
//   node scripts/validate-subtitle-visual-dedup.js <scenes-v2.json> [--scene N] [--threshold 0.5] [--mode strict]
//
// v1.2.3 변경:
//   - 임계치 0.6 → 0.5 (감사 7건 중 4건 → 나머지 3건도 포착 시도)
//   - --mode strict: 노드 핵심 token (수치/명사) 이 자막에 등장하면 FAIL 병행 판정
//     (예: node "75K Github Stars" 의 "75K" ↔ 자막 "7만 5천 개" 수치 매칭)
//
// exit 0: pass | exit 1: fail | exit 2: usage error

const fs = require("fs");

const DEFAULT_THRESHOLD = 0.5;

function parseArgs(argv) {
  const args = { positional: [], scene: null, threshold: DEFAULT_THRESHOLD, mode: "default" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--scene") args.scene = parseInt(argv[++i], 10);
    else if (a === "--threshold") args.threshold = parseFloat(argv[++i]);
    else if (a === "--mode") args.mode = argv[++i];
    else args.positional.push(a);
  }
  return args;
}

// "75K" / "7만 5천" / "75000" 등 수치 토큰 추출
// 한글 숫자 단위 (만/억) 포함
// v1.2.3: 단위 없는 1~2자리 숫자(예 "6", "30")는 false positive 방지차 skip. 3자리+ 또는 단위 포함만.
function extractNumericTokens(text) {
  if (typeof text !== "string") return [];
  const tokens = new Set();
  const re = /\d+(?:[.,]\d+)*(?:\s*[KMBkmb%천만억]+)?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tok = m[0].toLowerCase().replace(/\s+/g, "");
    const hasUnit = /[kmb%천만억]/i.test(tok);
    const digitsOnly = tok.replace(/[^\d]/g, "");
    if (!hasUnit && digitsOnly.length < 3) continue; // 1~2자리 단위 없는 숫자 skip
    tokens.add(tok);
  }
  return Array.from(tokens);
}

// 한국어 숫자 (만/억) → 정규화 수치로 근사 변환
function koreanNumericToAbs(text) {
  if (typeof text !== "string") return null;
  // e.g. "7만 5천" → 75000, "75K" → 75000, "1억" → 100000000
  const cleaned = text.replace(/[ ,]/g, "");
  let m;
  if ((m = cleaned.match(/^(\d+)([KkMmBb])$/))) {
    const mult = { K: 1e3, k: 1e3, M: 1e6, m: 1e6, B: 1e9, b: 1e9 }[m[2]];
    return Number(m[1]) * mult;
  }
  if ((m = cleaned.match(/^(\d+)만(?:(\d+)천)?$/))) {
    return Number(m[1]) * 10000 + (m[2] ? Number(m[2]) * 1000 : 0);
  }
  if ((m = cleaned.match(/^(\d+)억$/))) return Number(m[1]) * 1e8;
  if (/^\d+$/.test(cleaned)) return Number(cleaned);
  return null;
}

// 두 수치 토큰이 같은 의미 수치인지 (상대오차 < 0.1)
function numericTokenMatch(a, b) {
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const na = koreanNumericToAbs(a), nb = koreanNumericToAbs(b);
  if (na == null || nb == null) return false;
  if (na === 0 || nb === 0) return na === nb;
  return Math.abs(na - nb) / Math.max(na, nb) < 0.1;
}

// strict 모드: 노드의 수치 토큰이 자막의 수치 토큰과 매칭되면 FAIL
function strictTokenViolations(nodeTexts, subtitleTexts) {
  const subsTokens = new Set();
  for (const s of subtitleTexts) for (const t of extractNumericTokens(s)) subsTokens.add(t);
  const violations = [];
  for (const n of nodeTexts) {
    const nodeTokens = extractNumericTokens(n);
    for (const nt of nodeTokens) {
      for (const st of subsTokens) {
        if (numericTokenMatch(nt, st)) violations.push({ node: n, nodeToken: nt, subToken: st });
      }
    }
  }
  return violations;
}

function normalize(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function collectNodeTexts(node, out = []) {
  if (!node || typeof node !== "object") return out;
  const d = node.data || {};
  for (const key of ["text", "label", "value", "suffix", "title", "body", "heading", "subtitle"]) {
    if (typeof d[key] === "string") out.push(d[key]);
  }
  if (Array.isArray(d.items)) {
    for (const it of d.items) {
      if (typeof it === "string") out.push(it);
      else if (it && typeof it === "object") {
        if (typeof it.text === "string") out.push(it.text);
        if (typeof it.label === "string") out.push(it.label);
        if (typeof it.value === "string") out.push(it.value);
      }
    }
  }
  if (Array.isArray(d.segments)) {
    for (const s of d.segments) if (s && typeof s.text === "string") out.push(s.text);
  }
  if (Array.isArray(node.children)) for (const c of node.children) collectNodeTexts(c, out);
  return out;
}

function checkScene(scene, threshold, mode) {
  const subs = (scene.subtitles || []).map((s) => s.text).filter(Boolean);
  const nodeTexts = scene.stack_root ? collectNodeTexts(scene.stack_root) : [];

  const subtitleNorm = normalize(subs.join(" "));
  const visualNorm = normalize(nodeTexts.join(" "));
  const wholeSim = similarity(subtitleNorm, visualNorm);

  const violations = [];
  for (const nt of nodeTexts) {
    const n = normalize(nt);
    if (n.length < 4) continue;
    for (const s of subs) {
      const sn = normalize(s);
      if (sn.length < 4) continue;
      const sim = similarity(n, sn);
      if (sim > threshold) violations.push({ kind: "sim", node: nt, subtitle: s, sim: sim.toFixed(3) });
    }
  }

  // strict 모드: 수치 토큰 교차 매칭
  if (mode === "strict") {
    const tokenViolations = strictTokenViolations(nodeTexts, subs);
    for (const tv of tokenViolations) {
      violations.push({ kind: "token", node: tv.node, nodeToken: tv.nodeToken, subToken: tv.subToken });
    }
  }

  return { wholeSim, violations };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.positional.length === 0) {
    console.error("Usage: node validate-subtitle-visual-dedup.js <scenes-v2.json> [--scene N]");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(args.positional[0], "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const targets = args.scene != null ? [scenes[args.scene]].filter(Boolean) : scenes;

  let failed = 0;
  for (const scene of targets) {
    if (!scene || !scene.stack_root) continue;
    if (!scene.subtitles || scene.subtitles.length === 0) {
      console.log(`ℹ️  [INFO] ${scene.id}: subtitles 없음 — skip`);
      continue;
    }
    const r = checkScene(scene, args.threshold, args.mode);
    if (r.violations.length > 0) {
      failed++;
      console.error(`❌ [FAIL:subtitle-visual-dedup] ${scene.id} 중복 ${r.violations.length}건 (whole sim=${r.wholeSim.toFixed(3)})`);
      for (const v of r.violations.slice(0, 3)) {
        if (v.kind === "sim") console.error(`  node="${v.node}" ↔ subtitle="${v.subtitle}" (sim=${v.sim})`);
        else console.error(`  node-token="${v.nodeToken}" ↔ sub-token="${v.subToken}" (in "${v.node}")`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n❌ [FAIL] 총 ${failed}개 씬 자막-시각 텍스트 중복 (임계 ${args.threshold}, mode=${args.mode}).`);
    process.exit(1);
  }
  console.log(`✅ [PASS:subtitle-visual-dedup] ${targets.length}개 씬 중복 없음 (임계 ${args.threshold}, mode=${args.mode}).`);
}

main();
