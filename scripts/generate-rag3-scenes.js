#!/usr/bin/env node
/**
 * RAG3 프로젝트 scenes-v2.json 생성
 * SRT 파싱 → 21개 씬 의미 청킹 → scenes-v2.json
 */
const fs = require("fs");

// SRT 파서
function parseSRT(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return null;
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) return null;
    const startTime = +timeMatch[1]*3600 + +timeMatch[2]*60 + +timeMatch[3] + +timeMatch[4]/1000;
    const endTime = +timeMatch[5]*3600 + +timeMatch[6]*60 + +timeMatch[7] + +timeMatch[8]/1000;
    const text2 = lines.slice(2).join(' ').trim();
    return { startTime, endTime, text: text2 };
  }).filter(Boolean);
}

const srt = parseSRT(fs.readFileSync("input/RAG3.srt", "utf-8"));

// 21개 씬 정의 (SRT 인덱스 범위, 1-based)
const beats = [
  { srtRange: [1,2], intent: "introduce", tone: "dramatic", kicker: "INTRO", headline: "RAG, 왜 실패하는가?", icons: ["brain","sparkles"], emphasis: ["RAG"] },
  { srtRange: [3,10], intent: "emphasize", tone: "questioning", kicker: "문제 인식", headline: "문서 안에 답이 있는데\nAI가 못 찾는다?", icons: ["help-circle","alert-triangle"], emphasis: ["엉뚱","못 찾거나"] },
  { srtRange: [11,13], intent: "define", tone: "confident", kicker: "오늘의 주제", headline: "RAG 실패 원인과 해결법", icons: ["target","search"], emphasis: ["실패","작동"] },
  { srtRange: [14,21], intent: "define", tone: "neutral", kicker: "첫 번째 관문", headline: "청킹: 문서를\n작은 조각으로 자르기", icons: ["layers","file-text"], emphasis: ["청킹","조각"], chartData: [{label:"100만 토큰 모델",value:80},{label:"수천 개 문서",value:20}] },
  { srtRange: [22,27], intent: "emphasize", tone: "analytical", kicker: "핵심 포인트", headline: "필요한 부분만\n정확히 꺼내 쓰는 것", icons: ["target","zap"], emphasis: ["필요한","정확히"] },
  { srtRange: [28,35], intent: "compare", tone: "analytical", kicker: "크기 딜레마", headline: "너무 잘게 vs 너무 크게", icons: ["alert-triangle","layers"], emphasis: ["문맥","잡음","설계 문제"], compare: {left:"너무 잘게 → 문맥 깨짐",right:"너무 크게 → 잡음 섞임"} },
  { srtRange: [36,39], intent: "list", tone: "neutral", kicker: "전략이 다르다", headline: "문서별 청킹 전략", icons: ["file-text","play"], emphasis: ["기술 문서","영상 대본"], items: ["기술 문서 → 제목/소제목 단위","영상 대본 → 장면 전환 단위"] },
  { srtRange: [40,51], intent: "explain", tone: "neutral", kicker: "오버랩 기법", headline: "퍼즐 조각처럼\n앞뒤를 겹쳐라", icons: ["layers","alert-triangle"], emphasis: ["오버랩","겹쳐"], chartData: [{label:"효과적",value:60},{label:"비용 증가",value:40}] },
  { srtRange: [52,62], intent: "warn", tone: "dramatic", kicker: "두 번째 관문", headline: "검색이 엉뚱할 때\n청킹부터 고치지 마라", icons: ["search","alert-triangle"], emphasis: ["검색","데이터 지옥"] },
  { srtRange: [63,72], intent: "list", tone: "analytical", kicker: "원인 진단 ①②", headline: "질문이 모호하거나\n임베딩이 안 맞거나", icons: ["help-circle","globe"], emphasis: ["질문","임베딩"], items: ["① 질문이 너무 짧거나 모호","② 한국어 + 영어 중심 모델"] },
  { srtRange: [73,80], intent: "list", tone: "analytical", kicker: "원인 진단 ③④", headline: "청킹 반쪽이거나\n검색 설정이 부실하거나", icons: ["layers","settings"], emphasis: ["청킹","Top-K"], items: ["③ 청킹/오버랩 문제","④ 하이브리드 검색, 리랭킹 누락"] },
  { srtRange: [81,85], intent: "process", tone: "confident", kicker: "빠른 진단법", headline: "상위 5개 청크를\n직접 눈으로 읽어라", icons: ["search","check-circle"], emphasis: ["상위 5개","원인 분류"], items: ["주제가 다르면 → 임베딩/질문","문맥이 찢기면 → 청킹","순서가 밀리면 → 리랭킹/Top-K"] },
  { srtRange: [86,98], intent: "list", tone: "confident", kicker: "실무 RAG 실패", headline: "4가지로 나뉜다", icons: ["alert-triangle","shield"], emphasis: ["4가지"], items: ["① 청킹 잘못","② 임베딩 불일치","③ 검색 부정확","④ 생성 환각"] },
  { srtRange: [99,114], intent: "compare", tone: "dramatic", kicker: "검색 vs 생성", headline: "엉뚱한 재료인가\n이상한 조리인가", icons: ["search","chef-hat"], emphasis: ["검색","생성","디버깅"], compare: {left:"검색 문제 = 엉뚱한 재료",right:"생성 문제 = 이상한 조리"} },
  { srtRange: [115,129], intent: "warn", tone: "questioning", kicker: "좋은 질문의 힘", headline: "RAG는 마법상자가\n절대 아니다", icons: ["lightbulb","alert-triangle"], emphasis: ["마법상자","좋은 질문"], items: ["✕ AI에 대해 알려줘","✕ 요즘 트렌드는?","✓ 독서 메모에서 시간관리 연결 글감 5개"] },
  { srtRange: [130,138], intent: "list", tone: "confident", kicker: "질문 3요소", headline: "주제 + 관점 + 결과 형태", icons: ["target","lightbulb"], emphasis: ["주제","관점","결과 형태"], items: ["1. 주제: 뭘 찾을 건지","2. 관점: 어떤 각도에서 볼 건지","3. 결과 형태: 어떤 모양으로 받을지"] },
  { srtRange: [139,145], intent: "process", tone: "analytical", kicker: "평가 기준", headline: "세 가지만 체크하세요", icons: ["check-circle","target"], emphasis: ["평가","기준"], items: ["① 독립적으로 뜻이 통하는가?","② 답의 근거가 한 청크 안에 있는가?","③ 장면 전환이 청크 경계와 일치하는가?"] },
  { srtRange: [146,150], intent: "define", tone: "confident", kicker: "2단계 평가", headline: "검색 평가와\n생성 평가를 분리하라", icons: ["search","check-circle"], emphasis: ["검색평가","생성평가"], compare: {left:"검색: 맞는 근거를 가져왔는가?",right:"생성: 근거를 제대로 써서 답했는가?"} },
  { srtRange: [151,157], intent: "summarize", tone: "confident", kicker: "5문장 정리", headline: "오늘 핵심", icons: ["star","book-open"], emphasis: ["핵심"], items: ["① 청킹은 설계 문제","② 검색 엉뚱하면 원인부터 분류","③ RAG 실패는 4가지","④ 좋은 질문에는 3요소","⑤ 검색+생성 분리 평가"] },
  { srtRange: [158,160], intent: "impact", tone: "dramatic", kicker: "한 문장", headline: "RAG 튜닝은\n원인 분류부터 시작한다", icons: ["zap","target"], emphasis: ["원인 분류"] },
  { srtRange: [161,165], intent: "introduce", tone: "dramatic", kicker: "바이브랩스", headline: "감사합니다", icons: ["star","rocket"], emphasis: ["실습편"] },
];

// scenes-v2.json 생성
const scenes = beats.map((beat, idx) => {
  const subs = srt.slice(beat.srtRange[0] - 1, beat.srtRange[1]);
  const startMs = Math.round(subs[0].startTime * 1000);
  const endMs = Math.round(subs[subs.length - 1].endTime * 1000);
  const durationFrames = Math.round((endMs - startMs) / 1000 * 30);
  const narration = subs.map(s => s.text).join(' ');

  return {
    id: `scene-${idx}`,
    project_id: "rag3",
    beat_index: idx,
    layout_family: "hero-center",
    start_ms: startMs,
    end_ms: endMs,
    duration_frames: durationFrames,
    components: [],
    copy_layers: {
      kicker: beat.kicker,
      headline: beat.headline,
      supporting: null,
      footer_caption: null,
    },
    motion: {
      entrance: "fadeUp",
      emphasis: null,
      exit: null,
      duration_ms: endMs - startMs,
    },
    assets: {
      svg_icons: beat.icons,
      chart_type: beat.chartData ? "compareBars" : null,
      chart_data: beat.chartData || null,
    },
    chunk_metadata: {
      intent: beat.intent,
      tone: beat.tone,
      evidence_type: beat.items ? "list" : beat.compare ? "comparison" : "statement",
      emphasis_tokens: beat.emphasis,
      density: Math.min(5, Math.max(1, Math.ceil(subs.length / 3))),
      beat_count: 1,
      ...(beat.items ? { list_items: beat.items } : {}),
      ...(beat.compare ? { compare: beat.compare } : {}),
    },
    subtitles: subs.map(s => ({
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.text,
    })),
    narration,
    stack_root: null,
  };
});

fs.writeFileSync("data/rag3/scenes-v2.json", JSON.stringify(scenes, null, 2));
console.log(`✅ ${scenes.length}개 씬 생성 완료`);
scenes.forEach(s => {
  const dur = (s.duration_frames / 30).toFixed(0);
  const ts = Math.floor(s.start_ms/1000/60) + ':' + String(Math.floor(s.start_ms/1000%60)).padStart(2,'0');
  console.log(`  beat ${s.beat_index} (${ts}, ${dur}s): [${s.chunk_metadata.intent}] ${s.copy_layers.headline.replace(/\n/g,' ')}`);
});
