/**
 * subtitle-splitter — 한 줄 한도 의미 단위 자막 분할
 *
 * 한 SRT/beat 텍스트를 받아 여러 단위로 나누되, 항상 의미 단위로만 자른다.
 *
 * 분할 우선순위 (각 단계에서 max 이하면 멈춤):
 *   1. 문장부호 (. ! ? …)
 *   2. 쉼표 (,)
 *   3. 접속사 (그런데/하지만/그래서/그리고/그러니까/오히려/심지어/정확히는/그러면/그래도/따라서)
 *   4. 절 종결 어미 (~때/~면/~지만/~니까/~면서/~라서/~해서/~되면/~고/~며/~여)
 *
 * 4단계까지 했는데도 max 초과인 구절은 **그대로 둔다 (자연 wrap 허용)**.
 * 어절 단위 강제 분할은 절대 하지 않는다 — "가면," 같은 무의미 파편 방지.
 *
 * 시간은 글자 수 비례로 분배.
 */

export interface SubtitleEntry {
  startTime: number; // seconds, relative to scene start
  endTime: number;
  text: string;
}

const DEFAULT_MAX_CHARS = 30;

const CONJ = new Set([
  "그런데", "하지만", "그래서", "그리고", "그러니까",
  "오히려", "심지어", "정확히는", "그러면", "그래도", "따라서",
]);

const CLAUSE_END_WORDS = [
  "때", "면", "지만", "니까", "면서", "라서", "해서", "되면",
  "고", "며", "여", "되어",
];

function splitBySentence(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitByComma(text: string): string[] {
  return text
    .split(/(?<=,)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitByConjunction(text: string): string[] {
  // 공백 + 접속사 + 공백 패턴 앞에서 자르기
  const pattern = new RegExp(
    `(?<=\\s)(${Array.from(CONJ).join("|")})(?=\\s)`,
    "g"
  );
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push(m.index);
  }
  if (matches.length === 0) return [text];

  const out: string[] = [];
  let prev = 0;
  for (const start of matches) {
    const left = text.slice(prev, start).trim();
    if (left) out.push(left);
    prev = start;
  }
  const tail = text.slice(prev).trim();
  if (tail) out.push(tail);
  return out;
}

function splitByClauseEnd(text: string): string[] {
  // 공백 위치를 스캔하면서 직전 어절이 절 종결 어미로 끝나는지 확인
  const parts: string[] = [];
  let cursor = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== " ") continue;
    const prefix = text.slice(cursor, i);
    const trimmed = prefix.trim();
    if (trimmed.length < 6) continue; // 너무 짧으면 자르지 않음
    if (CLAUSE_END_WORDS.some((w) => trimmed.endsWith(w))) {
      parts.push(trimmed);
      cursor = i + 1;
    }
  }
  const tail = text.slice(cursor).trim();
  if (tail) parts.push(tail);
  if (parts.length === 0) return [text];
  // 너무 짧은 조각은 다음과 합치기
  const merged: string[] = [];
  for (const p of parts) {
    if (merged.length > 0 && (merged[merged.length - 1].length < 10 || p.length < 10)) {
      merged[merged.length - 1] = merged[merged.length - 1] + " " + p;
    } else {
      merged.push(p);
    }
  }
  return merged;
}

/**
 * 텍스트를 의미 단위로 분할. max 이하로 만들기 위해 4단계까지 시도하고,
 * 그래도 긴 구절은 그대로 반환 (자연 wrap 허용).
 */
export function splitSubtitleText(
  text: string,
  maxChars: number = DEFAULT_MAX_CHARS
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Level 1: 문장부호
  let pieces = splitBySentence(trimmed);
  if (pieces.every((p) => p.length <= maxChars)) return pieces;

  // Level 2: 쉼표
  let next: string[] = [];
  for (const p of pieces) {
    if (p.length <= maxChars) next.push(p);
    else next.push(...splitByComma(p));
  }
  pieces = next;
  if (pieces.every((p) => p.length <= maxChars)) return pieces;

  // Level 3: 접속사
  next = [];
  for (const p of pieces) {
    if (p.length <= maxChars) next.push(p);
    else next.push(...splitByConjunction(p));
  }
  pieces = next;
  if (pieces.every((p) => p.length <= maxChars)) return pieces;

  // Level 4: 절 종결 어미 — 그래도 긴 건 그대로 (2줄 wrap 허용)
  next = [];
  for (const p of pieces) {
    if (p.length <= maxChars) next.push(p);
    else next.push(...splitByClauseEnd(p));
  }
  return next;
}

/**
 * 텍스트를 분할하고 시간을 글자 수 비례로 분배하여 SubtitleEntry[]를 반환.
 *
 * @param text   원본 자막 텍스트
 * @param startMs  텍스트의 글로벌 시작 시각 (ms)
 * @param endMs    텍스트의 글로벌 종료 시각 (ms)
 * @param sceneStartMs  씬의 글로벌 시작 시각 (ms) — 상대 시간 계산용
 * @param maxChars  한 줄 목표 글자 수 (기본 30)
 */
export function buildSubtitleEntries(
  text: string,
  startMs: number,
  endMs: number,
  sceneStartMs: number,
  maxChars: number = DEFAULT_MAX_CHARS
): SubtitleEntry[] {
  const pieces = splitSubtitleText(text, maxChars);
  if (pieces.length === 0) return [];

  const totalChars = pieces.reduce((s, p) => s + p.length, 0) || 1;
  const duration = endMs - startMs;
  const out: SubtitleEntry[] = [];
  let cum = 0;
  for (let i = 0; i < pieces.length; i++) {
    const share = pieces[i].length / totalChars;
    const segDur = duration * share;
    const cs = startMs + cum;
    const ce = i === pieces.length - 1 ? endMs : startMs + cum + segDur;
    out.push({
      startTime: Math.round(((cs - sceneStartMs) / 1000) * 1000) / 1000,
      endTime: Math.round(((ce - sceneStartMs) / 1000) * 1000) / 1000,
      text: pieces[i],
    });
    cum += segDur;
  }
  return out;
}
