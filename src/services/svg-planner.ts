// svg-planner.ts — beat 의 narration 에서 SVG 스케치 후보 concept 추출
//
// 역할:
//   1. 한글 narration 텍스트를 훑어 svg-library 의 keywords 와 매칭
//   2. 매칭된 concept → asset_id 를 beat.svg_needs 에 기록
//   3. 라이브러리에 없으면 pending_forge: true 로 표시 (svg-forge --project 가 수집)
//
// 출력 스키마:
//   svg_needs: [
//     { concept: "cloud", asset_id: "cloud-line", role: "focal", pending_forge: false, rationale: "matched keyword 클라우드" },
//     { concept: "gpt-6", role: "focal", pending_forge: true, rationale: "no match in library" }
//   ]

import { findByConcept, findByKeywords, listAssets, type SvgAssetEntry } from "./svg-library";

export interface SvgNeed {
  concept: string;
  asset_id?: string;
  role: "focal" | "support" | "accent";
  style: "line-art" | "duotone" | "filled";
  pending_forge: boolean;
  rationale?: string;
}

export interface BeatLite {
  beat_index: number;
  text: string;
  semantic?: {
    emphasis_tokens?: string[];
    [k: string]: unknown;
  };
  svg_needs?: SvgNeed[];
}

// 기본 stop word — 보편 조사/어미 제거 후 명사만 남김
const STOP_WORDS = new Set([
  "있", "없", "하", "되", "그리고", "하지만", "그런데", "그래서", "근데",
  "저는", "제가", "저도", "우리", "우리는", "지금", "이제", "아주", "정말",
  "그", "이", "저", "것", "수", "때", "분", "말", "거", "쯤", "뭐", "왜",
  "더", "좀", "건", "걸", "게", "게이", "된다", "된다고", "보세요", "봐요",
  "그럼", "그러면", "그냥", "잠깐", "그래", "음", "자", "한번", "한 번",
  "오늘", "내일", "어제", "여기", "거기", "저기", "좀",
]);

/**
 * narration 에서 핵심 명사 token 추출 (휴리스틱).
 * 한글의 경우 조사/어미를 간략히 떼어내고, 2~6자 범위의 단어만 유지.
 */
function extractKoreanTokens(text: string): string[] {
  const cleaned = text.replace(/[.,!?"'\[\]()…·]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  for (const p of parts) {
    if (STOP_WORDS.has(p)) continue;
    if (p.length < 2 || p.length > 8) continue;
    // 조사 간략 제거 — 마지막 1~2자 중 "은/는/이/가/을/를/의/에/와/과/도" 떨어냄
    let word = p;
    const particleRe = /(은|는|이|가|을|를|의|에|와|과|도|으로|로|이나|한테|에서|까지|부터)$/;
    word = word.replace(particleRe, "");
    if (word.length < 2) continue;
    if (STOP_WORDS.has(word)) continue;
    tokens.push(word);
  }
  return tokens;
}

/**
 * beat 하나에서 최대 3개의 concept 추출.
 */
export function planSvgNeedsForBeat(beat: BeatLite, maxNeeds = 3): SvgNeed[] {
  const tokens = new Set<string>();
  extractKoreanTokens(beat.text).forEach((t) => tokens.add(t));
  if (Array.isArray(beat.semantic?.emphasis_tokens)) {
    beat.semantic!.emphasis_tokens!.forEach((t) => tokens.add(String(t)));
  }

  // 토큰별 best match
  const collected: SvgNeed[] = [];
  const seenIds = new Set<string>();
  const pendingSet = new Set<string>();

  for (const token of tokens) {
    if (collected.length >= maxNeeds) break;
    const matches = findByConcept(token);
    if (matches.length) {
      const m = matches[0];
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      collected.push({
        concept: m.concept,
        asset_id: m.id,
        role: collected.length === 0 ? "focal" : "support",
        style: m.style,
        pending_forge: false,
        rationale: `matched "${token}" → ${m.id}`,
      });
    } else {
      // 후보 누락 → forge 대기 목록
      if (token.length >= 2 && token.length <= 10 && !pendingSet.has(token)) {
        pendingSet.add(token);
      }
    }
  }

  // 라이브러리 매칭 부족 시 pending_forge 로 채움
  for (const token of pendingSet) {
    if (collected.length >= maxNeeds) break;
    collected.push({
      concept: token,
      role: collected.length === 0 ? "focal" : "support",
      style: "line-art",
      pending_forge: true,
      rationale: "no library match (forge candidate)",
    });
  }

  return collected;
}

/**
 * beats[] 전체에 svg_needs 를 주입하고 신규 beats 반환 (순수 함수).
 */
export function planSvgNeedsForBeats<B extends BeatLite>(beats: B[], maxNeeds = 3): B[] {
  return beats.map((b) => ({
    ...b,
    svg_needs: planSvgNeedsForBeat(b, maxNeeds),
  }));
}

/**
 * 프로젝트 단위: 모든 pending_forge concept 를 집합으로 반환.
 */
export function collectPendingConcepts<B extends BeatLite>(beats: B[]): string[] {
  const s = new Set<string>();
  for (const b of beats) {
    for (const n of b.svg_needs ?? []) {
      if (n.pending_forge && n.concept) s.add(n.concept);
    }
  }
  return [...s];
}

/**
 * 라이브러리 커버리지 리포트.
 */
export function libraryCoverageReport<B extends BeatLite>(beats: B[]): {
  totalNeeds: number;
  covered: number;
  pending: number;
  coverage_pct: number;
} {
  let total = 0, covered = 0, pending = 0;
  for (const b of beats) {
    for (const n of b.svg_needs ?? []) {
      total++;
      if (n.pending_forge) pending++;
      else covered++;
    }
  }
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { totalNeeds: total, covered, pending, coverage_pct: Number(pct.toFixed(1)) };
}

export function _internal_extractTokens(text: string): string[] {
  return extractKoreanTokens(text);
}
