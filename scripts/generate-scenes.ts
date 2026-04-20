/**
 * generate-scenes.ts
 *
 * 전체 파이프라인 Step 1: 의미 청킹 → 씬 설계 → JSON 출력
 *
 * SRT 자막 분석 기반 34개 씬을 정의하고,
 * stack-composer를 통해 각 씬의 stack_root를 자동 생성합니다.
 *
 * Usage:
 *   npx tsx scripts/generate-scenes.ts
 */

import * as fs from "fs";
import * as path from "path";
import { composeStackTree, resetRecentTemplates, type ComposeInput } from "../src/services/stack-composer";

// ---------------------------------------------------------------------------
// SRT Parser
// ---------------------------------------------------------------------------

interface SubtitleEntry {
  startTime: number; // seconds
  endTime: number;
  text: string;
}

function parseSRT(srtPath: string): SubtitleEntry[] {
  if (!fs.existsSync(srtPath)) return [];
  const raw = fs.readFileSync(srtPath, "utf-8");
  const blocks = raw.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) return null;
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) return null;
    const startTime = +timeMatch[1]*3600 + +timeMatch[2]*60 + +timeMatch[3] + +timeMatch[4]/1000;
    const endTime = +timeMatch[5]*3600 + +timeMatch[6]*60 + +timeMatch[7] + +timeMatch[8]/1000;
    const text = lines.slice(2).join(" ");
    return { startTime, endTime, text };
  }).filter((e): e is SubtitleEntry => e !== null);
}

// ---------------------------------------------------------------------------

const FPS = 30;
const BASE = path.resolve(__dirname, "..");
const OUT_SCENES = path.join(BASE, "data/rag-intro/scenes-v2.json");
const OUT_RENDER = path.join(BASE, "data/rag-intro/render-props-v2.json");

// ---------------------------------------------------------------------------
// Beat Definitions — SRT 의미 분석 기반 34개 씬
// ---------------------------------------------------------------------------

interface BeatDef {
  start_ms: number;
  end_ms: number;
  layout_family: string;
  intent: string;
  tone: string;
  evidence_type: string;
  density: number;
  headline: string;
  supporting: string | null;
  kicker: string | null;
  footer: string | null;
  emphasis: string[];
  icons: string[];
}

const BEATS: BeatDef[] = [
  // === Part 1: 인트로 (0 ~ 33.42s) ===
  {
    start_ms: 0, end_ms: 9350,
    layout_family: "hero-center",
    intent: "introduce", tone: "dramatic", evidence_type: "none", density: 2,
    headline: "RAG에 대해\n이야기해 보겠습니다",
    supporting: null, kicker: "INTRO", footer: null,
    emphasis: ["RAG"], icons: ["brain", "sparkles"],
  },
  {
    start_ms: 9350, end_ms: 22440,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "casual", evidence_type: "definition", density: 3,
    headline: "Retrieval Augmented\nGeneration",
    supporting: "Retrieval → 검색\nAugmented → 증강\nGeneration → 생성",
    kicker: "RAG란?", footer: null,
    emphasis: ["Retrieval", "Augmented", "Generation"],
    icons: ["search", "zap", "sparkles"],
  },
  {
    start_ms: 22440, end_ms: 33420,
    layout_family: "hero-center",
    intent: "emphasize", tone: "confident", evidence_type: "quote", density: 1,
    headline: "오늘 영상을 끝까지 보시면\nRAG를 설명할 수 있게 됩니다",
    supporting: null, kicker: null, footer: null,
    emphasis: ["RAG", "설명"], icons: ["target"],
  },

  // === Part 2: 요리사 비유 (33.42 ~ 79.34s) ===
  {
    start_ms: 33420, end_ms: 53340,
    layout_family: "stacked-vertical",
    intent: "compare", tone: "storytelling", evidence_type: "example", density: 3,
    headline: "기억만으로 요리하는 셰프",
    supporting: "레시피 없이 기억에만 의존\n기억이 흐릿하면 즉흥 조리\n가끔 이상한 결과물",
    kicker: null, footer: null,
    emphasis: ["기억", "즉흥"], icons: ["chef-hat", "alert-triangle"],
  },
  {
    start_ms: 53340, end_ms: 66700,
    layout_family: "split-2col",
    intent: "compare", tone: "dramatic", evidence_type: "example", density: 3,
    headline: "일반 AI vs RAG",
    supporting: "기억만으로 요리\n레시피를 참조하며 요리\n부정확할 수 있음\n외부 지식 활용",
    kicker: "핵심 차이", footer: null,
    emphasis: ["일반 AI", "RAG"], icons: ["chef-hat", "book-open"],
  },
  {
    start_ms: 66700, end_ms: 79340,
    layout_family: "stacked-vertical",
    intent: "compare", tone: "confident", evidence_type: "example", density: 3,
    headline: "냉장고를 먼저 확인하는 셰프",
    supporting: "재료부터 확인\n있는 재료로 요리\n엉터리 확률 ↓",
    kicker: "이것이 RAG", footer: null,
    emphasis: ["냉장고", "재료"], icons: ["refrigerator", "check-circle"],
  },

  // === Part 3: RAG 핵심 구조 (79.34 ~ 101.64s) ===
  {
    start_ms: 79340, end_ms: 94180,
    layout_family: "process-horizontal",
    intent: "list", tone: "authoritative", evidence_type: "definition", density: 5,
    headline: "RAG의 핵심 3단계",
    supporting: "질문 입력\n관련 자료 검색\n답변 생성",
    kicker: "핵심 구조", footer: null,
    emphasis: ["질문", "검색", "생성"], icons: ["help-circle", "search", "sparkles"],
  },
  {
    start_ms: 94180, end_ms: 101640,
    layout_family: "quote-highlight",
    intent: "emphasize", tone: "conversational", evidence_type: "quote", density: 2,
    headline: "기억나는 대로 말해봐 ✕\n자료 보고 대답해 ✓",
    supporting: null, kicker: null, footer: null,
    emphasis: ["자료 보고 대답해"], icons: ["quote"],
  },

  // === Part 4: RAG를 쓰는 이유 (101.64 ~ 159.89s) ===
  {
    start_ms: 101640, end_ms: 127760,
    layout_family: "grid-4x3",
    intent: "list", tone: "educational", evidence_type: "example", density: 4,
    headline: "RAG를 쓰는 이유",
    supporting: "내부 문서 답변 가능\n최신 정보 활용",
    kicker: "이유 1 & 2", footer: null,
    emphasis: ["내부 문서", "최신 정보"], icons: ["file-text", "clock"],
  },
  {
    start_ms: 127760, end_ms: 146220,
    layout_family: "stacked-vertical",
    intent: "warn", tone: "educational", evidence_type: "definition", density: 3,
    headline: "환각이 줄어듭니다",
    supporting: "근거 자료로 헛소리 확률 ↓\n완전 제거는 불가\n맥락 오해 시 여전히 오류",
    kicker: "이유 3", footer: null,
    emphasis: ["환각", "줄여준다"], icons: ["alert-triangle", "shield"],
  },
  {
    start_ms: 146220, end_ms: 159890,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "confident", evidence_type: "example", density: 3,
    headline: "답의 근거를 추적 가능",
    supporting: "참고한 문서 / 문단 추적\n신뢰도 확인",
    kicker: "이유 4", footer: null,
    emphasis: ["근거", "추적"], icons: ["target", "file-text"],
  },

  // === Part 5: 검색 품질 (159.89 ~ 185.09s) ===
  {
    start_ms: 159890, end_ms: 185090,
    layout_family: "stacked-vertical",
    intent: "emphasize", tone: "dramatic", evidence_type: "quote", density: 2,
    headline: "RAG의 성패는\n검색 품질이 결정한다",
    supporting: null, kicker: null, footer: null,
    emphasis: ["검색 품질"], icons: ["search", "target"],
  },

  // === Part 6: 청킹 (185.09 ~ 275.59s) ===
  {
    start_ms: 185090, end_ms: 200970,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "definition", density: 3,
    headline: "문서를 작은 조각으로 나누기",
    supporting: "통째로 검색 불가\n작은 조각으로 분할\n= 청킹(Chunking)",
    kicker: "청킹", footer: null,
    emphasis: ["청킹", "Chunking"], icons: ["layers", "file-text"],
  },
  {
    start_ms: 200970, end_ms: 220000,
    layout_family: "stacked-vertical",
    intent: "compare", tone: "storytelling", evidence_type: "example", density: 3,
    headline: "피자 자르기 비유",
    supporting: "너무 잘게 → 토핑 유실\n너무 크게 → 불필요 내용 혼합\n적당하게 → 한 조각에 의미 보존",
    kicker: null, footer: null,
    emphasis: ["적당하게"], icons: ["layers", "check-circle"],
  },
  {
    start_ms: 220000, end_ms: 235760,
    layout_family: "process-horizontal",
    intent: "list", tone: "educational", evidence_type: "definition", density: 4,
    headline: "청킹의 3가지 방법",
    supporting: "문장 단위\n문단 단위\n토큰 수 기준",
    kicker: "나누는 방식", footer: null,
    emphasis: ["문장", "문단", "토큰"], icons: ["file-text", "layers", "code"],
  },
  {
    start_ms: 235760, end_ms: 255850,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "example", density: 3,
    headline: "오버랩:\n앞뒤를 겹쳐서 자르기",
    supporting: "칼같이 자르면 문맥 손실\n겹침 → 핵심 의미 보존\n검색 품질 향상",
    kicker: "핵심 기법", footer: null,
    emphasis: ["오버랩"], icons: ["layers", "zap"],
  },
  {
    start_ms: 255850, end_ms: 275590,
    layout_family: "stacked-vertical",
    intent: "emphasize", tone: "educational", evidence_type: "none", density: 2,
    headline: "첫 버전은\n문단 기반 청킹 + 오버랩",
    supporting: "AI 없이 알고리즘으로 처리 가능\nAI 사용 시 비용↑ 속도↓",
    kicker: "실전 조언", footer: null,
    emphasis: ["문단 기반", "오버랩"], icons: ["lightbulb", "settings"],
  },

  // === Part 7: 임베딩 (275.59 ~ 349.43s) ===
  {
    start_ms: 275590, end_ms: 300320,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "definition", density: 3,
    headline: "텍스트를 숫자(벡터)로 변환",
    supporting: "글자는 완전히 다르지만\n의미는 같은 문장 → 같은 벡터\n= 임베딩",
    kicker: "임베딩이란?", footer: null,
    emphasis: ["임베딩", "벡터"], icons: ["code", "sparkles"],
  },
  {
    start_ms: 300320, end_ms: 320310,
    layout_family: "split-2col",
    intent: "compare", tone: "storytelling", evidence_type: "example", density: 3,
    headline: "지도에 좌표를 찍는 것과 같다",
    supporting: "뜻이 비슷 → 가까운 좌표\n의미가 다름 → 먼 좌표\n글자가 달라도 의미가 같으면 근접\n완전 다른 주제면 멀리",
    kicker: "비유", footer: null,
    emphasis: ["가깝게", "멀리"], icons: ["globe", "target"],
  },
  {
    start_ms: 320310, end_ms: 349430,
    layout_family: "stacked-vertical",
    intent: "emphasize", tone: "authoritative", evidence_type: "definition", density: 3,
    headline: "임베딩은 답변이 아닌\n검색 준비 작업",
    supporting: "문서 → 벡터, 질문 → 벡터\n비슷한 조각 검색 가능\n최신 모델: 3072차원",
    kicker: "핵심 포인트", footer: null,
    emphasis: ["준비 작업", "3072차원"], icons: ["database", "trending-up"],
  },

  // === Part 8: 벡터 검색 (349.43 ~ 417.15s) ===
  {
    start_ms: 349430, end_ms: 368260,
    layout_family: "stacked-vertical",
    intent: "list", tone: "educational", evidence_type: "definition", density: 3,
    headline: "벡터를 비교하여\n유사한 조각 찾기",
    supporting: "질문 → 벡터 변환\n저장된 조각과 비교\n코사인 유사도로 점수화",
    kicker: "벡터 검색", footer: null,
    emphasis: ["코사인 유사도"], icons: ["search", "target", "zap"],
  },
  {
    start_ms: 368260, end_ms: 389910,
    layout_family: "stacked-vertical",
    intent: "warn", tone: "educational", evidence_type: "example", density: 2,
    headline: "벡터 검색은 후보 선별 기술",
    supporting: "가장 가까운 조각 ≠ 정답\n후보를 골라내는 것일 뿐",
    kicker: "주의", footer: null,
    emphasis: ["후보", "정답 아님"], icons: ["alert-triangle", "search"],
  },
  {
    start_ms: 389910, end_ms: 417150,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "definition", density: 3,
    headline: "Top-K:\n상위 여러 개를 함께 가져오기",
    supporting: "하나로 부족할 수 있음\n여러 조각 → 포괄적 답변\n보통 3~5개, 최대 10~20개",
    kicker: "Top-K", footer: null,
    emphasis: ["Top-K", "3~5개"], icons: ["layers", "trending-up"],
  },

  // === Part 9: 리랭킹 (417.15 ~ 476.82s) ===
  {
    start_ms: 417150, end_ms: 450220,
    layout_family: "split-2col",
    intent: "compare", tone: "storytelling", evidence_type: "example", density: 3,
    headline: "리랭킹: 후보를 다시 심사",
    supporting: "벡터 검색 = 예선전\n리랭킹 = 결승전\n빠르게 후보 수집\n정밀 재심사",
    kicker: "2단계 구조", footer: null,
    emphasis: ["리랭킹", "예선전", "결승전"], icons: ["search", "star"],
  },
  {
    start_ms: 450220, end_ms: 476820,
    layout_family: "stacked-vertical",
    intent: "list", tone: "educational", evidence_type: "definition", density: 4,
    headline: "리랭킹 오해 바로잡기",
    supporting: "벡터 수정 아님\n질문마다 일회성 재채점\n데이터 적으면 불필요\n비슷한 문서 많을 때 효과적",
    kicker: "오해 주의", footer: null,
    emphasis: ["일회성", "필수 아님"], icons: ["alert-triangle", "settings"],
  },

  // === Part 10: 하이브리드 검색 (476.82 ~ 530.92s) ===
  {
    start_ms: 476820, end_ms: 508450,
    layout_family: "split-2col",
    intent: "compare", tone: "educational", evidence_type: "definition", density: 4,
    headline: "하이브리드 검색",
    supporting: "벡터: 의미 기반 검색\n키워드: 정확한 단어 검색\n표현 달라도 의미 유사 → 벡터 강점\n고유명사/법률용어 → 키워드 강점",
    kicker: "두 방식 결합", footer: null,
    emphasis: ["하이브리드"], icons: ["search", "code"],
  },
  {
    start_ms: 508450, end_ms: 530920,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "example", density: 3,
    headline: "한국어에서 특히 중요한\n하이브리드 검색",
    supporting: "조사/어미 변화가 심함\n퇴사 ≠ 퇴사를 ≠ 퇴사 이후\n벡터 + 키워드 병행이 필수",
    kicker: "한국어 특수성", footer: null,
    emphasis: ["한국어", "조사"], icons: ["globe", "code"],
  },

  // === Part 11: GraphRAG (530.92 ~ 605.23s) ===
  {
    start_ms: 530920, end_ms: 560340,
    layout_family: "stacked-vertical",
    intent: "explain", tone: "educational", evidence_type: "example", density: 3,
    headline: "복잡한 관계 질문에는\nGraphRAG",
    supporting: "A → B 프로젝트 영향?\nB → C 부서 연결?\n단순 검색으로는 불가능",
    kicker: "고급 개념", footer: null,
    emphasis: ["GraphRAG"], icons: ["brain", "users"],
  },
  {
    start_ms: 560340, end_ms: 591600,
    layout_family: "split-2col",
    intent: "compare", tone: "storytelling", evidence_type: "example", density: 3,
    headline: "일반 RAG vs GraphRAG",
    supporting: "책갈피 독서법\n관계도 독서법\n비슷한 문단을 빨리 검색\n연결 관계 파악에 강함",
    kicker: "비유", footer: null,
    emphasis: ["책갈피", "관계도"], icons: ["book-open", "users"],
  },
  {
    start_ms: 591600, end_ms: 605230,
    layout_family: "process-horizontal",
    intent: "list", tone: "educational", evidence_type: "none", density: 2,
    headline: "학습 순서 추천",
    supporting: "일반 RAG\n하이브리드 검색\nGraphRAG",
    kicker: "학습 로드맵", footer: null,
    emphasis: ["RAG", "하이브리드", "GraphRAG"], icons: ["book-open", "search", "users"],
  },

  // === Part 12: 전체 구조 & 마무리 (605.23 ~ 688.46s) ===
  {
    start_ms: 605230, end_ms: 634360,
    layout_family: "process-horizontal",
    intent: "list", tone: "authoritative", evidence_type: "definition", density: 5,
    headline: "RAG 구현 5가지 부품",
    supporting: "문서 전처리\n청킹\n임베딩\n질의 검색\n답변 생성",
    kicker: "전체 구조", footer: null,
    emphasis: ["5가지"], icons: ["file-text", "layers", "code", "search", "sparkles"],
  },
  {
    start_ms: 634360, end_ms: 650550,
    layout_family: "grid-4x3",
    intent: "list", tone: "educational", evidence_type: "example", density: 4,
    headline: "기술 스택",
    supporting: "Python\nPostgreSQL + pgVector\n임베딩 모델\nLLM 답변 생성",
    kicker: "최소 배관도", footer: null,
    emphasis: ["Python", "pgVector", "LLM"], icons: ["code", "database", "sparkles", "brain"],
  },
  {
    start_ms: 650550, end_ms: 671040,
    layout_family: "stacked-vertical",
    intent: "summarize", tone: "authoritative", evidence_type: "definition", density: 5,
    headline: "오늘 배운 내용 정리",
    supporting: "RAG = 자료 검색 후 답변\n청킹 = 의미 단위 분할\n임베딩 = 텍스트 → 벡터\n벡터 검색 = 후보 추출\n리랭킹 = 정밀 재심사",
    kicker: "5문장 정리", footer: null,
    emphasis: ["RAG", "청킹", "임베딩", "벡터 검색"],
    icons: ["check-circle", "layers", "code", "search", "star"],
  },
  {
    start_ms: 671040, end_ms: 688460,
    layout_family: "hero-center",
    intent: "introduce", tone: "friendly", evidence_type: "none", density: 1,
    headline: "감사합니다",
    supporting: null, kicker: "바이브랩스", footer: null,
    emphasis: ["바이브랩스"], icons: ["star", "users"],
  },
];

// ---------------------------------------------------------------------------
// Scene Builder
// ---------------------------------------------------------------------------

function buildScenes(allSubtitles: SubtitleEntry[]): any[] {
  resetRecentTemplates();

  return BEATS.map((beat, idx) => {
    const durationMs = beat.end_ms - beat.start_ms;
    const durationFrames = Math.round((durationMs / 1000) * FPS);

    const composeInput: ComposeInput = {
      layout_family: beat.layout_family,
      intent: beat.intent,
      evidence_type: beat.evidence_type,
      tone: beat.tone,
      density: beat.density,
      copy_layers: {
        kicker: beat.kicker,
        headline: beat.headline,
        supporting: beat.supporting,
        footer_caption: beat.footer,
      },
      emphasis_tokens: beat.emphasis,
      svg_icons: beat.icons,
    };

    const stack_root = composeStackTree(composeInput);

    // 이 씬의 시간 범위에 해당하는 자막 필터링
    const startSec = beat.start_ms / 1000;
    const endSec = beat.end_ms / 1000;
    const sceneSubtitles = allSubtitles.filter(
      s => s.startTime >= startSec - 0.1 && s.startTime < endSec
    );
    const narration = sceneSubtitles.map(s => s.text).join(" ");

    return {
      id: `scene-${idx}`,
      project_id: "rag-intro",
      beat_index: idx,
      layout_family: beat.layout_family,
      start_ms: beat.start_ms,
      end_ms: beat.end_ms,
      duration_frames: durationFrames,
      components: [],
      copy_layers: {
        kicker: beat.kicker,
        headline: beat.headline,
        supporting: beat.supporting,
        footer_caption: beat.footer,
      },
      motion: {
        entrance: "fadeUp",
        emphasis: null,
        exit: null,
        duration_ms: durationMs,
      },
      assets: {
        svg_icons: beat.icons,
        chart_type: null,
        chart_data: null,
      },
      chunk_metadata: {
        intent: beat.intent,
        tone: beat.tone,
        evidence_type: beat.evidence_type,
        emphasis_tokens: beat.emphasis,
        density: beat.density,
        beat_count: 1,
      },
      subtitles: sceneSubtitles,
      narration,
      stack_root,
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`\n=== Generating ${BEATS.length} scenes ===\n`);

  const SRT_PATH = path.join(BASE, "input/자막.srt");
  const allSubtitles = parseSRT(SRT_PATH);
  console.log(`Parsed ${allSubtitles.length} subtitle entries from SRT`);

  const scenes = buildScenes(allSubtitles);

  // 총 시간 확인
  const totalMs = BEATS[BEATS.length - 1].end_ms;
  const totalFrames = scenes.reduce((sum: number, s: any) => sum + s.duration_frames, 0);
  console.log(`Total duration: ${(totalMs / 1000).toFixed(1)}s (${totalFrames} frames)`);

  // scenes-v2.json 저장
  fs.writeFileSync(OUT_SCENES, JSON.stringify(scenes, null, 2), "utf-8");
  console.log(`Saved: ${OUT_SCENES}`);

  // render-props-v2.json 저장
  const renderProps = { scenes };
  fs.writeFileSync(OUT_RENDER, JSON.stringify(renderProps, null, 2), "utf-8");
  console.log(`Saved: ${OUT_RENDER}`);

  // 씬별 요약 출력
  console.log("\n--- Scene Summary ---");
  for (const scene of scenes) {
    const dur = ((scene.end_ms - scene.start_ms) / 1000).toFixed(1);
    const rootType = scene.stack_root?.children?.[0]?.type ?? "?";
    console.log(`  ${scene.id} [${dur}s] ${scene.copy_layers.headline.replace(/\n/g, " | ")} → ${rootType}`);
  }
}

main();
