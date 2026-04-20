// beat-director.ts — narration 텍스트에서 scene directing 메타데이터 추출
//
// vg-chunk SKILL.md Step 3 의 scene_role / semantic_shape / merge_hint /
// visual_weight / energy / focal_candidate / subline_candidate / support_candidates /
// neighbor relationship 을 휴리스틱으로 생성한다.
//
// 트리거 키워드 테이블(SKILL.md Step 3 상단) 을 그대로 반영.
// 한글 조사/어미를 의식한 간단 파서.

export type SceneRole =
  | "declaration"
  | "comparison"
  | "escalation"
  | "evidence"
  | "sequence"
  | "payoff"
  | "pause"
  | "metaphor"
  | "cluster"
  | "support";

export type SemanticShape =
  | "contrast"
  | "flow"
  | "cluster"
  | "metric"
  | "hierarchy"
  | "transformation"
  | "symbol"
  | "evidence"
  | "summary";

export type MergeHint = "standalone" | "merge_prev" | "merge_next" | "candidate_for_merge" | "support_only";

export type VisualWeight = "low" | "medium" | "high";
export type Energy = "calm" | "neutral" | "sharp" | "explosive";

export interface BeatIn {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  text: string;
  semantic?: {
    intent?: string;
    tone?: string;
    evidence_type?: string;
    emphasis_tokens?: string[];
    density?: number;
    brand_keywords?: string[];
    visual_keywords?: string[];
  };
}

export interface BeatDirection {
  role: SceneRole;
  semantic_shape: SemanticShape;
  merge_hint: MergeHint;
  visual_weight: VisualWeight;
  energy: Energy;
  focal_candidate: string | null;
  subline_candidate: string | null;
  support_candidates: string[];
  contrast_with_prev: boolean;
  continues_motif: boolean;
  should_break_rhythm: boolean;
}

// ---------------------------------------------------------------------------
// Trigger keyword tables (from SKILL.md Step 3)
// ---------------------------------------------------------------------------

const NUMBER_RE = /\d+(?:\.\d+)?\s*(?:%|퍼센트|배|달러|원|시간|분|초|개|명|년|월|회|건)/;
const COMPARISON_KW = ["반면", "반대로", "A와 B", "대신", "똑같다", "vs", "대비", "비교"];
const TRANSFORMATION_KW = ["이전에는", "지금은", "예전엔", "바뀌었다", "현재는", "전엔", "이제는"];
const SEQUENCE_KW = ["먼저", "그다음", "이후", "마지막으로", "단계", "첫 번째", "둘째는", "셋째는"];
const TIMELINE_KW = ["초기", "중반", "최근", "지금", "과거", "미래", "2024", "2025", "2026", "1분기", "2분기"];
const DECLARATION_QUOTE_KW = ["라고 말했", "핵심은", "한마디로", "바로", "말씀드리면", "즉"];
const CLUSTER_KW = ["첫째", "둘째", "셋째", "넷째", "세 가지", "네 가지", "다섯 가지", "주요", "핵심"];
const CHECK_KW = ["확인해야", "체크", "조건", "준비", "꼭 지켜", "필수", "갖춰야"];
const IO_KW = ["넣으면", "거치고", "결과로", "출력", "입력", "처리", "받아서", "나오는"];
const PROBLEM_SOLUTION_KW = ["문제는", "하지만", "해법은", "그래서 필요한", "해결책", "대응"];
const MYTH_KW = ["많이들 착각", "사실은", "오해", "알고 보면", "실은"];
const DODONT_KW = ["하지 말고", "대신", "좋은 방법", "피해야", "권장", "비추"];
const CAUSE_KW = ["때문에", "그래서", "결국", "원인", "이유는", "덕분에"];
const LANDSCAPE_KW = ["판도", "지도", "생태계", "어디쯤", "시장", "구도"];
const PAUSE_KW = ["이제", "다음은", "그 전에", "정리하면", "자", "넘어가서"];
const PERSONA_KW = ["기획자", "PM", "개발자", "디자이너", "창업자", "사용자", "고객"];
const EMOTION_KW = ["답답", "고민", "막막", "흥미", "신기", "충격", "놀랐", "기뻤", "속상"];
const PAYOFF_KW = ["결론은", "결국", "핵심은", "그래서", "마무리", "한 문장으로"];
const ESCALATION_KW = ["급증", "폭발", "급등", "급락", "치솟", "두 배", "세 배", "네 배", "열 배", "엄청"];
const METAPHOR_KW = ["마치", "처럼", "같은", "같이", "비유하면", "비유적"];
const WARNING_KW = ["경고", "위험", "주의", "조심", "버그", "고장", "오류", "실패", "문제"];

// 조사/어미 제거 패턴
const PARTICLE_RE = /(은|는|이|가|을|를|의|에|에서|에게|와|과|도|만|까지|부터|으로|로|처럼|보다)$/;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function hasAny(text: string, words: string[]): boolean {
  for (const w of words) if (text.includes(w)) return true;
  return false;
}

function stripParticle(token: string): string {
  let t = token;
  for (let i = 0; i < 2; i++) {
    const m = t.match(PARTICLE_RE);
    if (!m) break;
    t = t.slice(0, t.length - m[0].length);
    if (t.length < 2) break;
  }
  return t;
}

function extractKoreanNouns(text: string): string[] {
  const cleaned = text.replace(/[.,!?"'\[\]()…·「」『』]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const nouns: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (p.length < 2 || p.length > 10) continue;
    const w = stripParticle(p);
    if (w.length < 2) continue;
    // 순수 숫자+단위는 그대로 사용
    if (/^\d+[%배달러원시간분초]/.test(p)) {
      if (!seen.has(p)) { nouns.push(p); seen.add(p); }
      continue;
    }
    // 한글 + 영문 혼합, 숫자 제외 조건
    if (!/^[0-9]+$/.test(w) && !seen.has(w)) {
      nouns.push(w);
      seen.add(w);
    }
  }
  return nouns;
}

function extractNumbers(text: string): string[] {
  const out: string[] = [];
  const re = /(\d+(?:[,\.]\d+)*)\s*(%|퍼센트|배|달러|원|시간|분|초|개|명|년|월|회|건|달|주|개월)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    out.push(m[0].replace(/\s+/g, ""));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Role / shape / merge detection
// ---------------------------------------------------------------------------

export function detectRole(text: string, nextText = ""): SceneRole {
  const full = text;
  const numbers = extractNumbers(full);

  if (hasAny(full, PAUSE_KW) && full.length < 30) return "pause";
  if (hasAny(full, METAPHOR_KW)) return "metaphor";
  if (hasAny(full, DECLARATION_QUOTE_KW)) return "declaration";
  if (hasAny(full, PROBLEM_SOLUTION_KW)) return "declaration";
  if (hasAny(full, PERSONA_KW) && hasAny(full, EMOTION_KW)) return "declaration";
  if (hasAny(full, MYTH_KW) || hasAny(full, DODONT_KW)) return "comparison";
  if (hasAny(full, COMPARISON_KW) || hasAny(full, TRANSFORMATION_KW)) return "comparison";
  if (hasAny(full, CHECK_KW) || hasAny(full, CLUSTER_KW) || hasAny(full, LANDSCAPE_KW)) return "cluster";
  if (hasAny(full, SEQUENCE_KW) || hasAny(full, IO_KW) || hasAny(full, TIMELINE_KW)) return "sequence";
  if (hasAny(full, ESCALATION_KW)) return "escalation";
  if (hasAny(full, PAYOFF_KW)) return "payoff";
  if (hasAny(full, CAUSE_KW) || (numbers.length > 0 && full.length > 20)) return "evidence";
  if (numbers.length > 0 && full.length <= 30) return "payoff";
  if (full.length < 16) return "support";
  return "declaration";
}

/** detectShape 를 감싸 연속 3회 동일 shape 를 자동 rotation */
export function detectShapeWithRotation(
  role: SceneRole,
  text: string,
  recentShapes: SemanticShape[],
): SemanticShape {
  const base = detectShape(role, text);
  const last3 = recentShapes.slice(-3);
  const sameStreak = last3.length >= 2 && last3.every((s) => s === base);
  if (!sameStreak) return base;
  // 2회 연속이면 다양성 확보용 대체 선택
  const ALT: Record<SemanticShape, SemanticShape> = {
    symbol: "summary",
    contrast: "evidence",
    flow: "transformation",
    cluster: "hierarchy",
    metric: "evidence",
    hierarchy: "cluster",
    transformation: "flow",
    evidence: "summary",
    summary: "symbol",
  };
  return ALT[base];
}

export function detectShape(role: SceneRole, text: string): SemanticShape {
  if (hasAny(text, MYTH_KW) || hasAny(text, DODONT_KW) || hasAny(text, COMPARISON_KW)) return "contrast";
  if (hasAny(text, TRANSFORMATION_KW) || hasAny(text, IO_KW)) return "transformation";
  if (hasAny(text, SEQUENCE_KW) || hasAny(text, TIMELINE_KW)) return "flow";
  if (hasAny(text, CLUSTER_KW) || hasAny(text, CHECK_KW)) return "cluster";
  if (hasAny(text, LANDSCAPE_KW)) return "hierarchy";
  if (hasAny(text, METAPHOR_KW)) return "symbol";
  if (hasAny(text, CAUSE_KW)) return "evidence";
  if (hasAny(text, PAUSE_KW) && text.length < 30) return "symbol";
  if (extractNumbers(text).length > 0) return "metric";
  switch (role) {
    case "comparison": return "contrast";
    case "sequence": return "flow";
    case "escalation": return "metric";
    case "cluster": return "cluster";
    case "metaphor": return "symbol";
    case "payoff": return "metric";
    case "pause": return "symbol";
    case "evidence": return "evidence";
    default: return "symbol";
  }
}

export function detectMergeHint(beat: BeatIn, role: SceneRole): MergeHint {
  const duration = (beat.end_ms - beat.start_ms) / 1000;
  if (role === "support") {
    // 짧은 support → 앞뒤 병합 후보, focal 있으면 standalone
    if (duration < 2) return "merge_prev";
    return "candidate_for_merge";
  }
  if (duration < 1.5) return "candidate_for_merge";
  return "standalone";
}

export function detectEnergy(role: SceneRole, text: string): Energy {
  if (hasAny(text, WARNING_KW)) return "sharp";
  if (hasAny(text, ESCALATION_KW)) return "explosive";
  if (role === "payoff" || role === "declaration") return "sharp";
  if (role === "comparison" || role === "evidence") return "sharp";
  if (role === "pause" || role === "support") return "calm";
  if (role === "cluster" || role === "sequence") return "neutral";
  return "neutral";
}

export function detectVisualWeight(role: SceneRole, text: string): VisualWeight {
  if (role === "payoff" || role === "escalation") return "high";
  const hasNum = extractNumbers(text).length > 0;
  if (role === "declaration") return hasNum || text.length >= 18 ? "high" : "medium";
  if (role === "evidence") return hasNum ? "high" : "medium";
  if (role === "comparison" || role === "metaphor") return "high";
  if (role === "cluster") return "medium";
  if (role === "sequence") return "medium";
  if (role === "pause" || role === "support") return "low";
  return "medium";
}

// ---------------------------------------------------------------------------
// Focal / subline / support extraction
// ---------------------------------------------------------------------------

function extractFocalFromNumbers(text: string): string | null {
  const nums = extractNumbers(text);
  if (nums.length === 0) return null;
  // 가장 긴 숫자+단위 조합 선택
  nums.sort((a, b) => b.length - a.length);
  return nums[0];
}

/** 쿼트 내부 / 명사구 / 숫자 우선순위로 focal 추출 */
export function extractFocal(text: string, role: SceneRole): string | null {
  // 1. 숫자가 있고 declaration/payoff/evidence/escalation 이면 숫자 우선
  if (["declaration", "payoff", "evidence", "escalation"].includes(role)) {
    const n = extractFocalFromNumbers(text);
    if (n) return n;
  }
  // 2. 명사구에서 가장 "의미있어 보이는" 것 (길이 3~6자, 명사 특징)
  const nouns = extractKoreanNouns(text);
  if (nouns.length === 0) return text.slice(0, 10).trim() || null;
  // 첫 명사구 중 2~6자 범위 우선
  const ideal = nouns.find((n) => n.length >= 2 && n.length <= 6 && !/\d/.test(n));
  if (ideal) return ideal;
  return nouns[0];
}

export function extractSubline(text: string, focal: string | null, role: SceneRole): string | null {
  if (role === "pause" || role === "support") return null;
  const t = text.replace(/\s+/g, " ").trim();
  // focal 과 다른 문장 단위 chunk 를 뽑는다 (첫 구절)
  const clauses = t.split(/[\.,!?]|(?:\s그리고\s)|(?:\s그런데\s)|(?:\s하지만\s)/);
  for (const c of clauses) {
    const s = c.trim();
    if (!s || s === focal) continue;
    if (s.length >= 6 && s.length <= 40) return s;
  }
  // 18자 이하 전체 문장
  if (t.length <= 30) return t;
  return t.slice(0, 30).trim();
}

export function extractSupports(text: string, focal: string | null, max = 3): string[] {
  const nouns = extractKoreanNouns(text);
  const out: string[] = [];
  for (const n of nouns) {
    if (n === focal) continue;
    if (n.length < 2 || n.length > 8) continue;
    if (out.includes(n)) continue;
    out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Brand / visual keyword enrichment
// ---------------------------------------------------------------------------

const BRAND_TOKENS = new Set<string>([
  "오픈AI", "OpenAI", "openai", "엔트로픽", "Anthropic", "anthropic", "Claude", "클로드",
  "Google", "구글", "Gemini", "제미나이", "DeepMind", "딥마인드",
  "Meta", "메타", "Llama", "라마", "Apple", "애플",
  "Microsoft", "마이크로소프트", "GitHub", "깃허브",
  "Cursor", "커서", "Notion", "노션", "Slack", "슬랙",
  "Tesla", "테슬라", "Nvidia", "엔비디아",
  "ChatGPT", "Copilot", "Sora", "Whisper",
  "Reddit", "레딧", "X", "Twitter", "트위터",
  "Ollama", "울라마", "vLLM", "MLX", "Gemma",
]);

export function detectBrandKeywords(text: string): string[] {
  const out = new Set<string>();
  for (const b of BRAND_TOKENS) {
    if (text.includes(b)) out.add(b);
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Neighbor relationship
// ---------------------------------------------------------------------------

export function detectNeighborRelations(
  prev: BeatIn | null,
  curr: BeatIn,
  recentRoles: SceneRole[],
): Pick<BeatDirection, "contrast_with_prev" | "continues_motif" | "should_break_rhythm"> {
  const prevText = prev?.text ?? "";
  const nowText = curr.text;
  const contrastWithPrev =
    hasAny(nowText, COMPARISON_KW) ||
    hasAny(nowText, TRANSFORMATION_KW) ||
    hasAny(nowText, MYTH_KW) ||
    hasAny(nowText, DODONT_KW);

  // 연속 3개 같은 role → 리듬 break
  const recent3 = recentRoles.slice(-3);
  const sameLast3 = recent3.length === 3 && recent3.every((r) => r === recent3[0]);

  // motif 연속 — 같은 브랜드 / 같은 숫자 단위 반복
  const prevBrands = detectBrandKeywords(prevText);
  const currBrands = detectBrandKeywords(nowText);
  const motifContinues = prevBrands.some((b) => currBrands.includes(b));

  return {
    contrast_with_prev: contrastWithPrev,
    continues_motif: motifContinues,
    should_break_rhythm: sameLast3,
  };
}

// ---------------------------------------------------------------------------
// Top-level: direct a single beat
// ---------------------------------------------------------------------------

export function directBeat(
  beat: BeatIn,
  prev: BeatIn | null,
  recentRoles: SceneRole[],
  recentShapes: SemanticShape[] = [],
): BeatDirection {
  const role = detectRole(beat.text);
  const shape = detectShapeWithRotation(role, beat.text, recentShapes);
  const merge = detectMergeHint(beat, role);
  const energy = detectEnergy(role, beat.text);
  const weight = detectVisualWeight(role, beat.text);
  const focal = extractFocal(beat.text, role);
  const subline = extractSubline(beat.text, focal, role);
  const supports = extractSupports(beat.text, focal, 3);
  const neighbor = detectNeighborRelations(prev, beat, recentRoles);

  return {
    role,
    semantic_shape: shape,
    merge_hint: merge,
    visual_weight: weight,
    energy,
    focal_candidate: focal,
    subline_candidate: subline,
    support_candidates: supports,
    ...neighbor,
  };
}

/** emphasis_tokens / tone / evidence_type / density 재계산 */
export function enrichSemantic(beat: BeatIn, direction: BeatDirection): BeatIn["semantic"] {
  const nums = extractNumbers(beat.text);
  const emphasis = new Set<string>();
  nums.slice(0, 2).forEach((n) => emphasis.add(n));
  if (direction.focal_candidate) emphasis.add(direction.focal_candidate);
  detectBrandKeywords(beat.text).forEach((b) => emphasis.add(b));

  let tone = "neutral";
  if (direction.energy === "explosive" || direction.energy === "sharp") tone = "dramatic";
  if (hasAny(beat.text, WARNING_KW)) tone = "warning";
  if (beat.text.includes("?") || beat.text.endsWith("죠") || beat.text.endsWith("까")) tone = "questioning";
  if (direction.role === "payoff" || direction.role === "declaration") tone = "confident";

  let evidenceType = "statement";
  if (nums.length > 0) evidenceType = "statistic";
  if (hasAny(beat.text, DECLARATION_QUOTE_KW)) evidenceType = "quote";
  if (hasAny(beat.text, METAPHOR_KW)) evidenceType = "example";
  if (beat.text.match(/란\s|이란\s|란 것은|는 것은/)) evidenceType = "definition";

  const wordCount = beat.text.split(/\s+/).filter(Boolean).length;
  const density = Math.min(5, Math.max(1, Math.ceil(wordCount / 5)));

  const brandKeywords = detectBrandKeywords(beat.text);
  const visualKeywords = [...emphasis].slice(0, 5);

  return {
    intent: direction.role, // 과거 intent 필드를 새 role 로 별칭
    tone,
    evidence_type: evidenceType,
    emphasis_tokens: [...emphasis].slice(0, 5),
    density,
    brand_keywords: brandKeywords,
    visual_keywords: visualKeywords,
  };
}

/** beats 배열 전체 enrich */
export function directBeats<B extends BeatIn>(beats: B[]): Array<B & { scene: BeatDirection; semantic: NonNullable<BeatIn["semantic"]> }> {
  const out: Array<B & { scene: BeatDirection; semantic: NonNullable<BeatIn["semantic"]> }> = [];
  const recentRoles: SceneRole[] = [];
  const recentShapes: SemanticShape[] = [];
  let prev: BeatIn | null = null;
  for (const b of beats) {
    const direction = directBeat(b, prev, recentRoles, recentShapes);
    const semantic = enrichSemantic(b, direction) as NonNullable<BeatIn["semantic"]>;
    recentRoles.push(direction.role);
    recentShapes.push(direction.semantic_shape);
    if (recentRoles.length > 8) recentRoles.shift();
    if (recentShapes.length > 8) recentShapes.shift();
    prev = b;
    out.push({ ...b, scene: direction, semantic });
  }
  return out;
}

/** 품질 체크리스트 (SKILL.md 후반부) */
export function qualityCheck<B extends BeatIn & { scene: BeatDirection }>(beats: B[]) {
  const issues: string[] = [];

  // 1. support_only standalone 금지
  const supportStandalone = beats.filter((b) => b.scene.role === "support" && b.scene.merge_hint === "standalone");
  if (supportStandalone.length) issues.push(`support role 이 standalone 인 beat ${supportStandalone.length}건`);

  // 2. 2초 미만 beat 는 merge_prev/merge_next
  const shortBeats = beats.filter((b) => (b.end_ms - b.start_ms) < 2000);
  const shortStandalone = shortBeats.filter((b) => b.scene.merge_hint === "standalone" && !b.scene.focal_candidate);
  if (shortStandalone.length > 5) issues.push(`짧은 beat(<2s) 중 focal 없이 standalone ${shortStandalone.length}건`);

  // 3. energy sharp/explosive 비율 ≥ 20%
  const sharpCount = beats.filter((b) => b.scene.energy === "sharp" || b.scene.energy === "explosive").length;
  const sharpPct = (sharpCount / beats.length) * 100;
  if (sharpPct < 20) issues.push(`energy sharp/explosive 비율 ${sharpPct.toFixed(1)}% < 20%`);

  // 4. visual_weight high 비율 ≥ 20%
  const highCount = beats.filter((b) => b.scene.visual_weight === "high").length;
  const highPct = (highCount / beats.length) * 100;
  if (highPct < 20) issues.push(`visual_weight high 비율 ${highPct.toFixed(1)}% < 20%`);

  // 5. semantic_shape 3연속 동일 금지
  let sameStreak = 1;
  let maxStreak = 1;
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].scene.semantic_shape === beats[i - 1].scene.semantic_shape) sameStreak++;
    else sameStreak = 1;
    if (sameStreak > maxStreak) maxStreak = sameStreak;
  }
  if (maxStreak >= 4) issues.push(`동일 semantic_shape 연속 ${maxStreak}회 (한도 3)`);

  // 6. scene_role 4종 이상
  const uniqueRoles = new Set(beats.map((b) => b.scene.role));
  if (uniqueRoles.size < 4) issues.push(`scene_role 종류 ${uniqueRoles.size}종 < 4`);

  // 7. focal_candidate 채움
  const standaloneNoFocal = beats.filter((b) => b.scene.merge_hint === "standalone" && !b.scene.focal_candidate);
  if (standaloneNoFocal.length > 10) issues.push(`standalone beat 중 focal 없는 것 ${standaloneNoFocal.length}건`);

  return {
    totalBeats: beats.length,
    uniqueRoles: [...uniqueRoles],
    sharpPct: Number(sharpPct.toFixed(1)),
    highPct: Number(highPct.toFixed(1)),
    maxSameShapeStreak: maxStreak,
    issues,
    ok: issues.length === 0,
  };
}
