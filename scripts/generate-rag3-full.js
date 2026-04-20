#!/usr/bin/env node
/**
 * RAG3 프로젝트 — SRT → scenes-v2.json + render-props-v2.json 완전 생성
 * 처음부터 새로 만드는 통합 스크립트
 */
const fs = require("fs");
const path = require("path");

// ─── SRT 파서 ───
function parseSRT(text) {
  const blocks = text.trim().replace(/^\uFEFF/, '').split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return null;
    const m = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!m) return null;
    const startTime = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
    const endTime = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000;
    const text2 = lines.slice(2).join(' ').trim();
    return { startTime, endTime, text: text2 };
  }).filter(Boolean);
}

const srt = parseSRT(fs.readFileSync("input/RAG3.srt", "utf-8"));
console.log(`✅ SRT 파싱: ${srt.length}개 자막, ${(srt[srt.length-1].endTime/60).toFixed(1)}분`);

// ─── 21개 비트 정의 ───
const beats = [
  { srtRange:[1,2], intent:"introduce", tone:"dramatic", kicker:"INTRO", headline:"RAG, 왜 실패하는가?", icons:["brain","sparkles"], emphasis:["RAG"] },
  { srtRange:[3,10], intent:"emphasize", tone:"questioning", kicker:"문제 인식", headline:"문서 안에 답이 있는데\nAI가 못 찾는다?", icons:["help-circle","file-text"], emphasis:["엉뚱","못 찾거나"] },
  { srtRange:[11,13], intent:"define", tone:"confident", kicker:"오늘의 주제", headline:"RAG 실패 원인과 해결법", icons:["target","search"], emphasis:["실패","작동"] },
  { srtRange:[14,21], intent:"define", tone:"neutral", kicker:"첫 번째 관문", headline:"청킹: 문서를\n작은 조각으로 자르기", icons:["layers","file-text"], emphasis:["청킹","조각"] },
  { srtRange:[22,27], intent:"emphasize", tone:"analytical", kicker:"핵심 포인트", headline:"필요한 부분만\n정확히 꺼내 쓰는 것", icons:["target","zap"], emphasis:["필요한","정확히"] },
  { srtRange:[28,35], intent:"compare", tone:"analytical", kicker:"크기 딜레마", headline:"너무 잘게 vs 너무 크게", icons:["alert-triangle","layers"], emphasis:["문맥","잡음","설계 문제"] },
  { srtRange:[36,39], intent:"list", tone:"neutral", kicker:"전략이 다르다", headline:"문서별 청킹 전략", icons:["file-text","play"], emphasis:["기술 문서","영상 대본"] },
  { srtRange:[40,51], intent:"explain", tone:"neutral", kicker:"오버랩 기법", headline:"퍼즐 조각처럼\n앞뒤를 겹쳐라", icons:["layers","alert-triangle"], emphasis:["오버랩","겹쳐"] },
  { srtRange:[52,62], intent:"warn", tone:"dramatic", kicker:"두 번째 관문", headline:"검색이 엉뚱할 때\n청킹부터 고치지 마라", icons:["search","alert-triangle"], emphasis:["검색","데이터 지옥"] },
  { srtRange:[63,72], intent:"list", tone:"analytical", kicker:"원인 진단 ①②", headline:"질문이 모호하거나\n임베딩이 안 맞거나", icons:["help-circle","globe"], emphasis:["질문","임베딩"] },
  { srtRange:[73,78], intent:"list", tone:"analytical", kicker:"원인 진단 ③④", headline:"청킹 반쪽이거나\n검색 설정이 부실하거나", icons:["layers","settings"], emphasis:["청킹","Top-K"] },
  { srtRange:[79,85], intent:"process", tone:"confident", kicker:"빠른 진단법", headline:"상위 5개 청크를\n직접 눈으로 읽어라", icons:["search","check-circle"], emphasis:["상위 5개","원인 분류"] },
  { srtRange:[86,98], intent:"list", tone:"confident", kicker:"실무 RAG 실패", headline:"4가지로 나뉜다", icons:["alert-triangle","shield"], emphasis:["4가지"] },
  { srtRange:[99,114], intent:"compare", tone:"dramatic", kicker:"검색 vs 생성", headline:"엉뚱한 재료인가\n이상한 조리인가", icons:["search","chef-hat"], emphasis:["검색","생성","디버깅"] },
  { srtRange:[115,129], intent:"warn", tone:"questioning", kicker:"좋은 질문의 힘", headline:"RAG는 마법상자가\n절대 아니다", icons:["lightbulb","alert-triangle"], emphasis:["마법상자","좋은 질문"] },
  { srtRange:[130,138], intent:"list", tone:"confident", kicker:"질문 3요소", headline:"주제 + 관점 + 결과 형태", icons:["target","lightbulb"], emphasis:["주제","관점","결과 형태"] },
  { srtRange:[139,145], intent:"process", tone:"analytical", kicker:"평가 기준", headline:"세 가지만 체크하세요", icons:["check-circle","target"], emphasis:["평가","기준"] },
  { srtRange:[146,150], intent:"define", tone:"confident", kicker:"2단계 평가", headline:"검색 평가와\n생성 평가를 분리하라", icons:["search","check-circle"], emphasis:["검색평가","생성평가"] },
  { srtRange:[151,157], intent:"summarize", tone:"confident", kicker:"5문장 정리", headline:"오늘 핵심", icons:["star","book-open"], emphasis:["핵심"] },
  { srtRange:[158,160], intent:"impact", tone:"dramatic", kicker:"한 문장", headline:"RAG 튜닝은\n원인 분류부터 시작한다", icons:["zap","target"], emphasis:["원인 분류"] },
  { srtRange:[161,165], intent:"introduce", tone:"dramatic", kicker:"바이브랩스", headline:"감사합니다", icons:["star","rocket"], emphasis:["실습편"] },
];

// ─── enterAt 계산 헬퍼 ───
const HEADER_TYPES = new Set(["Kicker","Badge","Headline","Divider","AccentGlow"]);
const TAIL_TYPES = new Set(["FooterCaption","InsightTile"]);

function assignEnterAt(root, durationFrames) {
  const nodes = [];
  function dfs(node) {
    if (node.motion) nodes.push(node);
    if (node.children) node.children.forEach(dfs);
  }
  dfs(root);
  if (nodes.length === 0) return;

  // 고정 시간 기반 (씬 길이와 무관하게 빠르게 채움)
  // 헤더: 0~1.5s, 콘텐츠: 1.5~4s, 테일: 4~6s
  const FPS = 30;
  const headerEndF = Math.min(45, Math.round(durationFrames * 0.25));  // 1.5s or 25%
  const contentEndF = Math.min(120, Math.round(durationFrames * 0.45)); // 4s or 45%
  const tailEndF = Math.min(180, Math.round(durationFrames * 0.55));    // 6s or 55%

  const headers = [];
  const contents = [];
  const tails = [];

  let pastHeaders = false;
  for (const n of nodes) {
    if (!pastHeaders && HEADER_TYPES.has(n.type)) {
      headers.push(n);
    } else {
      pastHeaders = true;
      contents.push(n);
    }
  }
  while (contents.length > 0 && TAIL_TYPES.has(contents[contents.length - 1].type)) {
    tails.unshift(contents.pop());
  }

  function distribute(group, start, end) {
    group.forEach((n, i) => {
      const t = group.length === 1 ? 0 : i / (group.length - 1);
      n.motion.enterAt = Math.round(start + t * (end - start));
    });
  }

  distribute(headers, 0, headerEndF);
  distribute(contents, headers.length > 0 ? headerEndF : 0, contentEndF);
  distribute(tails, tails.length > 0 ? contentEndF : 0, tailEndF);
}

// ─── 씬별 레이아웃 생성 ───
function buildLayout(beat, idx, durationFrames) {
  const M = (preset = "fadeUp", dur = 15) => ({ preset, enterAt: 0, duration: dur });

  switch(idx) {
    // ── Beat 0: 인트로 (Overlay 히어로) ──
    case 0: return {
      id: "sceneroot-0", type: "SceneRoot",
      layout: { padding: "80px 120px 140px", gap: 32 },
      children: [{
        id: "overlay-0", type: "Overlay", layout: {},
        children: [
          { id: "glow-0", type: "AccentGlow", motion: M("pulseAccent", 30) },
          { id: "hero-stack-0", type: "Stack",
            layout: { direction: "column", align: "center", gap: 28, width: "100%" },
            children: [
              { id: "icon-0", type: "Icon", data: { name: "brain", size: 120, glow: true }, motion: M("scaleIn", 20) },
              { id: "hl-0", type: "Headline", data: { text: beat.headline, size: "xl", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 18) },
              { id: "badge-0", type: "Badge", data: { text: "INTRO" }, variant: "accent", motion: M("popBadge", 10) },
            ]
          }
        ]
      }]
    };

    // ── Beat 1: 문제 제기 (FrameBox + BulletList) ──
    case 1: return {
      id: "sceneroot-1", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-1", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-1", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-1", type: "Divider", motion: M("drawConnector", 8) },
        { id: "frame-1", type: "FrameBox",
          layout: { gap: 20, padding: 32, width: "100%", maxWidth: 900 },
          style: { border: "1.5px solid rgba(255,255,255,0.15)", radius: 16 },
          children: [
            { id: "row-1", type: "Stack", layout: { direction: "row", gap: 24, align: "center", width: "100%" },
              children: [
                { id: "icon-1", type: "Icon", data: { name: "help-circle", size: 64 }, motion: M("scaleIn", 12) },
                { id: "bl-1", type: "BulletList", data: { items: ["내 문서를 AI에게 읽히면 똑똑한 답변이 나올 줄 알았는데...", "생각보다 답변이 엉뚱할 때가 많다", "분명히 문서 안에 답이 있는데 AI가 못 찾는다"], bulletStyle: "dash" }, motion: M("fadeUp", 15) }
              ]
            }
          ]
        }
      ]
    };

    // ── Beat 2: 오늘의 주제 (Badge + InsightTile) ──
    case 2: return {
      id: "sceneroot-2", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 24 },
      children: [
        { id: "badge-2", type: "Badge", data: { text: "오늘의 주제" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-2", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-2", type: "Divider", motion: M("drawConnector", 8) },
        { id: "it-2", type: "InsightTile", data: { index: "→", title: "RAG가 왜 실패하는지, 어떻게 해야 제대로 작동하는지 깊이 파헤칩니다" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 3: 청킹 개념 (Split: IconCard + CompareBars) ──
    case 3: return {
      id: "sceneroot-3", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-3", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-3", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-3", type: "Divider", motion: M("drawConnector", 8) },
        { id: "split-3", type: "Split", layout: { gap: 40, width: "100%", maxWidth: 1100, ratio: [1, 1] },
          children: [
            { id: "ic-3", type: "IconCard", data: { icon: "layers", title: "청킹이란?", body: "긴 문서를 작은 조각으로 자르는 일", size: "md" }, motion: M("fadeUp", 15) },
            { id: "right-3", type: "Stack", layout: { direction: "column", gap: 16, width: "100%" },
              children: [
                { id: "bars-3", type: "CompareBars", data: { items: [{ label: "100만 토큰 모델", value: 80 }, { label: "수천 개 문서", value: 100 }], unit: "%" }, motion: M("wipeBar", 20) },
                { id: "bt-3", type: "BodyText", data: { text: "문서가 수백, 수천 개로 늘어나면\n통째로 넣기 불가능", emphasis: ["불가능"] }, motion: M("fadeUp", 12) },
              ]
            }
          ]
        }
      ]
    };

    // ── Beat 4: 청킹 핵심 (QuoteText + InsightTile) ──
    case 4: return {
      id: "sceneroot-4", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 24 },
      children: [
        { id: "badge-4", type: "Badge", data: { text: "핵심 포인트" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-4", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-4", type: "Divider", motion: M("drawConnector", 8) },
        { id: "qt-4", type: "QuoteText", data: { text: "적당한 크기로 잘라서 정말 필요한 부분만 정확히 꺼내 쓰는 것, 그것이 청킹의 핵심" }, motion: M("fadeUp", 18) },
        { id: "it-4", type: "InsightTile", data: { index: "→", title: "중간 내용 누락 방지 + 비용 절감 효과" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 5: 크기 딜레마 (CompareCard + FooterCaption) ──
    case 5: return {
      id: "sceneroot-5", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-5", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-5", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-5", type: "Divider", motion: M("drawConnector", 8) },
        { id: "cc-5", type: "CompareCard", data: {
          left: { icon: "x", title: "너무 잘게", subtitle: "문맥이 깨진다", negative: true },
          right: { icon: "check", title: "너무 크게", subtitle: "잡음이 섞인다", negative: true }
        }, motion: M("slideSplit", 18) },
        { id: "fc-5", type: "FooterCaption", data: { text: "청킹은 정답이 하나인 기술이 아니라 설계 문제" }, motion: M("fadeUp", 12) },
      ]
    };

    // ── Beat 6: 문서별 전략 (Grid 2열 IconCard) ──
    case 6: return {
      id: "sceneroot-6", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-6", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-6", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-6", type: "Divider", motion: M("drawConnector", 8) },
        { id: "grid-6", type: "Grid", layout: { columns: 2, gap: 32, width: "100%", maxWidth: 1000 },
          children: [
            { id: "ic-6a", type: "IconCard", data: { icon: "file-text", title: "기술 문서", body: "제목과 소제목 단위로 분할", size: "md" }, variant: "glass", motion: M("fadeUp", 15) },
            { id: "ic-6b", type: "IconCard", data: { icon: "play", title: "영상 대본", body: "장면 전환 단위로 분할\n오프닝·문제제기·사례·결론", size: "md" }, variant: "glass", motion: M("fadeUp", 15) },
          ]
        }
      ]
    };

    // ── Beat 7: 오버랩 기법 (FrameBox 파이프라인 + WarningCard) ──
    case 7: return {
      id: "sceneroot-7", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-7", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-7", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-7", type: "Divider", motion: M("drawConnector", 8) },
        { id: "row-7", type: "Stack", layout: { direction: "row", gap: 0, align: "center", justify: "center", width: "100%" },
          children: [
            { id: "fb-7a", type: "FrameBox", layout: { padding: 20 }, style: { border: "1.5px solid rgba(255,255,255,0.2)", radius: 12, background: "rgba(139,92,246,0.08)" },
              children: [{ id: "bt-7a", type: "BodyText", data: { text: "조각 A" }, motion: M("fadeUp", 10) }] },
            { id: "fb-7m", type: "FrameBox", layout: { padding: 20 }, style: { border: "2px solid rgba(139,92,246,0.5)", radius: 12, background: "rgba(139,92,246,0.15)" },
              children: [{ id: "bt-7m", type: "BodyText", data: { text: "겹침 영역", emphasis: ["겹침"] }, motion: M("fadeUp", 10) }] },
            { id: "fb-7b", type: "FrameBox", layout: { padding: 20 }, style: { border: "1.5px solid rgba(255,255,255,0.2)", radius: 12, background: "rgba(139,92,246,0.08)" },
              children: [{ id: "bt-7b", type: "BodyText", data: { text: "조각 B" }, motion: M("fadeUp", 10) }] },
          ]
        },
        { id: "wc-7", type: "WarningCard", data: { icon: "alert-triangle", title: "주의", body: "오버랩이 항상 효과적이지 않다. 오히려 인덱싱 비용만 올릴 수 있으므로 문서 특성에 맞춰 테스트 필수" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 8: 검색 관문 (WarningCard + InsightTile) ──
    case 8: return {
      id: "sceneroot-8", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "badge-8", type: "Badge", data: { text: "두 번째 관문" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-8", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-8", type: "Divider", motion: M("drawConnector", 8) },
        { id: "wc-8", type: "WarningCard", data: { icon: "alert-triangle", title: "데이터 지옥 경고", body: "검색이 엉뚱할 때 바로 청킹부터 뜯어고치면 지옥행" }, motion: M("fadeUp", 15) },
        { id: "it-8", type: "InsightTile", data: { index: "→", title: "순서대로 원인을 따져봐야 합니다" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 9: 원인 ①② (Split: 2x ProcessStepCard) ──
    case 9: return {
      id: "sceneroot-9", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-9", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-9", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-9", type: "Divider", motion: M("drawConnector", 8) },
        { id: "split-9", type: "Split", layout: { gap: 36, width: "100%", maxWidth: 1100, ratio: [1, 1] },
          children: [
            { id: "psc-9a", type: "ProcessStepCard", data: { step: "1", icon: "help-circle", title: "질문이 모호", desc: "너무 짧거나 모호하면\n임베딩 자체가 흐릿해진다" }, motion: M("fadeUp", 15) },
            { id: "psc-9b", type: "ProcessStepCard", data: { step: "2", icon: "globe", title: "임베딩 불일치", desc: "한국어 문서에 영어 중심 모델 →\n미묘한 의미 차이 놓침" }, motion: M("fadeUp", 15) },
          ]
        }
      ]
    };

    // ── Beat 10: 원인 ③④ (Stack + RichText) ──
    case 10: return {
      id: "sceneroot-10", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-10", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-10", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-10", type: "Divider", motion: M("drawConnector", 8) },
        { id: "frame-10", type: "FrameBox",
          layout: { gap: 20, padding: 28, width: "100%", maxWidth: 900 },
          style: { border: "1.5px solid rgba(255,255,255,0.15)", radius: 16 },
          children: [
            { id: "bl-10", type: "BulletList", data: { items: ["③ 청킹/오버랩 문제: 관련 내용이 반쪽만 나올 때", "④ 검색 설정 부실: Top-K 너무 적거나 하이브리드 검색·리랭킹 누락"], bulletStyle: "dash" }, motion: M("fadeUp", 15) }
          ]
        },
        { id: "rt-10", type: "RichText", data: { segments: [{ text: "하이브리드 검색 = " }, { text: "벡터", tone: "accent" }, { text: " + " }, { text: "키워드", tone: "accent" }, { text: " 동시 사용" }] }, motion: M("fadeUp", 12) },
      ]
    };

    // ── Beat 11: 빠른 진단법 (BulletList + InsightTile) ──
    case 11: return {
      id: "sceneroot-11", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "badge-11", type: "Badge", data: { text: "빠른 진단법" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-11", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-11", type: "Divider", motion: M("drawConnector", 8) },
        { id: "bl-11", type: "BulletList", data: { items: ["주제가 다르다 → 임베딩이나 질문 문제", "문맥이 찢겨있다 → 청킹 문제", "순서가 밀려있다 → 리랭킹/Top-K 문제"], bulletStyle: "check" }, motion: M("fadeUp", 15) },
        { id: "it-11", type: "InsightTile", data: { index: "→", title: "원인을 먼저 분류해야 삽질 없이 고칠 수 있다" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 12: 실패 4가지 (Grid 2x2 IconCard) ──
    case 12: return {
      id: "sceneroot-12", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-12", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-12", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-12", type: "Divider", motion: M("drawConnector", 8) },
        { id: "grid-12", type: "Grid", layout: { columns: 2, gap: 24, width: "100%", maxWidth: 1100 },
          children: [
            { id: "ic-12a", type: "IconCard", data: { icon: "layers", title: "① 청킹 잘못", body: "너무 잘게/크게, 문맥 경계 틀어짐", size: "sm" }, motion: M("fadeUp", 15) },
            { id: "ic-12b", type: "IconCard", data: { icon: "globe", title: "② 임베딩 불일치", body: "질문과 문서 의미를 가까이 못 둠", size: "sm" }, motion: M("fadeUp", 15) },
            { id: "ic-12c", type: "IconCard", data: { icon: "search", title: "③ 검색 부정확", body: "Top-K, 하이브리드 검색 부실", size: "sm" }, motion: M("fadeUp", 15) },
            { id: "ic-12d", type: "IconCard", data: { icon: "alert-triangle", title: "④ 생성 환각", body: "검색은 잘 됐는데 LLM이 지어냄", size: "sm" }, motion: M("fadeUp", 15) },
          ]
        }
      ]
    };

    // ── Beat 13: 검색 vs 생성 (Split: Icon+Text 양쪽 + InsightTile) ──
    case 13: return {
      id: "sceneroot-13", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-13", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-13", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-13", type: "Divider", motion: M("drawConnector", 8) },
        { id: "split-13", type: "Split", layout: { gap: 40, width: "100%", maxWidth: 1100, ratio: [1, 1] },
          children: [
            { id: "left-13", type: "Stack", layout: { direction: "column", gap: 16, align: "center", width: "100%" },
              children: [
                { id: "icon-13a", type: "Icon", data: { name: "search", size: 64 }, motion: M("scaleIn", 12) },
                { id: "shl-13a", type: "Headline", data: { text: "검색 문제", size: "sm" }, motion: M("fadeUp", 12) },
                { id: "bt-13a", type: "BodyText", data: { text: "요리사에게\n엉뚱한 재료를 준 것" }, motion: M("fadeUp", 12) },
              ]
            },
            { id: "right-13", type: "Stack", layout: { direction: "column", gap: 16, align: "center", width: "100%" },
              children: [
                { id: "icon-13b", type: "Icon", data: { name: "chef-hat", size: 64 }, motion: M("scaleIn", 12) },
                { id: "shl-13b", type: "Headline", data: { text: "생성 문제", size: "sm" }, motion: M("fadeUp", 12) },
                { id: "bt-13b", type: "BodyText", data: { text: "재료는 괜찮은데\n이상하게 조리한 것" }, motion: M("fadeUp", 12) },
              ]
            }
          ]
        },
        { id: "it-13", type: "InsightTile", data: { index: "→", title: "검색인가 생성인가? 이 질문 하나면 디버깅 방향이 완전히 달라진다" }, motion: M("fadeUp", 15) },
      ]
    };

    // ── Beat 14: 좋은 질문 (Split: 나쁜 vs 좋은 질문) ──
    case 14: return {
      id: "sceneroot-14", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "badge-14", type: "Badge", data: { text: "좋은 질문의 힘" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-14", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-14", type: "Divider", motion: M("drawConnector", 8) },
        { id: "split-14", type: "Split", layout: { gap: 36, width: "100%", maxWidth: 1100, ratio: [1, 1] },
          children: [
            { id: "left-14", type: "Stack", layout: { direction: "column", gap: 12, width: "100%" },
              children: [
                { id: "shl-14a", type: "Headline", data: { text: "나쁜 질문 ✕", size: "sm" }, motion: M("fadeUp", 12) },
                { id: "bl-14a", type: "BulletList", data: { items: ["AI에 대해 알려줘", "요즘 트렌드는?", "내 메모를 정리해줘"], bulletStyle: "dash" }, motion: M("fadeUp", 15) },
              ]
            },
            { id: "right-14", type: "Stack", layout: { direction: "column", gap: 12, width: "100%" },
              children: [
                { id: "shl-14b", type: "Headline", data: { text: "좋은 질문 ✓", size: "sm" }, motion: M("fadeUp", 12) },
                { id: "bl-14b", type: "BulletList", data: { items: ["독서 메모 중 시간관리 연결 글감 5개", "IT 동향에서 에이전트+생산성 동시 언급만 묶어줘"], bulletStyle: "check" }, motion: M("fadeUp", 15) },
              ]
            }
          ]
        }
      ]
    };

    // ── Beat 15: 질문 3요소 (Stack row: 3x ProcessStepCard) ──
    case 15: return {
      id: "sceneroot-15", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-15", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-15", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-15", type: "Divider", motion: M("drawConnector", 8) },
        { id: "row-15", type: "Stack", layout: { direction: "row", gap: 24, width: "100%", justify: "center" },
          children: [
            { id: "psc-15a", type: "ProcessStepCard", data: { step: "1", icon: "target", title: "주제", desc: "뭘 찾을 건지" }, motion: M("fadeUp", 15) },
            { id: "psc-15b", type: "ProcessStepCard", data: { step: "2", icon: "lightbulb", title: "관점", desc: "어떤 각도에서" }, motion: M("fadeUp", 15) },
            { id: "psc-15c", type: "ProcessStepCard", data: { step: "3", icon: "star", title: "결과 형태", desc: "어떤 모양으로" }, motion: M("fadeUp", 15) },
          ]
        },
        { id: "fc-15", type: "FooterCaption", data: { text: "세 가지가 들어가면 검색 품질이 올라간다" }, motion: M("fadeUp", 12) },
      ]
    };

    // ── Beat 16: 평가 기준 (BulletList check + ProgressBar) ──
    case 16: return {
      id: "sceneroot-16", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "badge-16", type: "Badge", data: { text: "평가 기준" }, variant: "accent", motion: M("popBadge", 10) },
        { id: "hl-16", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-16", type: "Divider", motion: M("drawConnector", 8) },
        { id: "bl-16", type: "BulletList", data: { items: ["독립적으로 뜻이 통하는가?", "답의 근거가 한 청크 안에 있는가?", "장면 전환이 청크 경계와 일치하는가?"], bulletStyle: "check" }, motion: M("fadeUp", 15) },
        { id: "pb-16", type: "ProgressBar", data: { value: 85, label: "품질 기준 충족률" }, motion: M("wipeBar", 20) },
      ]
    };

    // ── Beat 17: 2단계 평가 (Split: 2x StatCard) ──
    case 17: return {
      id: "sceneroot-17", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 20 },
      children: [
        { id: "kicker-17", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-17", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 15) },
        { id: "div-17", type: "Divider", motion: M("drawConnector", 8) },
        { id: "split-17", type: "Split", layout: { gap: 40, width: "100%", maxWidth: 1000, ratio: [1, 1] },
          children: [
            { id: "sc-17a", type: "StatCard", data: { value: "검색", label: "맞는 근거를 가져왔는가?" }, motion: M("popNumber", 18) },
            { id: "sc-17b", type: "StatCard", data: { value: "생성", label: "근거를 제대로 써서 답했는가?" }, motion: M("popNumber", 18) },
          ]
        },
        { id: "fc-17", type: "FooterCaption", data: { text: "이 두 가지를 분리하면 RAG 품질이 눈에 띄게 좋아진다" }, motion: M("fadeUp", 12) },
      ]
    };

    // ── Beat 18: 5문장 정리 (BulletList check 대형) ──
    case 18: return {
      id: "sceneroot-18", type: "SceneRoot",
      layout: { padding: "60px 120px 140px", gap: 24 },
      children: [
        { id: "kicker-18", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
        { id: "hl-18", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "div-18", type: "Divider", motion: M("drawConnector", 8) },
        { id: "bl-18", type: "BulletList", data: { items: [
          "① 청킹은 설계 문제다",
          "② 검색 엉뚱하면 원인부터 분류하라",
          "③ RAG 실패는 4가지다",
          "④ 좋은 질문에는 3요소가 필요",
          "⑤ 검색+생성 분리해서 평가하라"
        ], bulletStyle: "check" }, motion: M("fadeUp", 18) },
      ]
    };

    // ── Beat 19: 한 문장 기억 (Overlay 히어로) ──
    case 19: return {
      id: "sceneroot-19", type: "SceneRoot",
      layout: { padding: "80px 120px 140px", gap: 32 },
      children: [{
        id: "overlay-19", type: "Overlay", layout: {},
        children: [
          { id: "glow-19", type: "AccentGlow", motion: M("pulseAccent", 30) },
          { id: "hero-19", type: "Stack",
            layout: { direction: "column", align: "center", gap: 24, width: "100%" },
            children: [
              { id: "kicker-19", type: "Kicker", data: { text: beat.kicker }, motion: M("fadeUp", 12) },
              { id: "hl-19", type: "Headline", data: { text: beat.headline, size: "xl", emphasis: beat.emphasis }, style: { maxWidth: 980 }, motion: M("fadeUp", 18) },
              { id: "icon-19", type: "Icon", data: { name: "zap", size: 80, glow: true }, motion: M("scaleIn", 15) },
            ]
          }
        ]
      }]
    };

    // ── Beat 20: 아웃트로 ──
    case 20: return {
      id: "sceneroot-20", type: "SceneRoot",
      layout: { padding: "80px 120px 140px", gap: 28 },
      children: [
        { id: "icon-20", type: "Icon", data: { name: "star", size: 100, glow: true }, motion: M("scaleIn", 18) },
        { id: "hl-20", type: "Headline", data: { text: beat.headline, size: "lg", emphasis: beat.emphasis }, style: { maxWidth: 900 }, motion: M("fadeUp", 15) },
        { id: "bt-20", type: "BodyText", data: { text: "다음 영상: 메모 10~20개로\nRAG 실험 실습편으로 찾아뵙겠습니다", emphasis: ["실습편"] }, motion: M("fadeUp", 15) },
        { id: "badge-20", type: "Badge", data: { text: "바이브랩스" }, variant: "accent", motion: M("popBadge", 10) },
      ]
    };

    default: return { id: `sceneroot-${idx}`, type: "SceneRoot", layout: { padding: "60px 120px 140px", gap: 20 }, children: [] };
  }
}

// ─── scenes-v2.json 생성 ───
const scenes = beats.map((beat, idx) => {
  const subs = srt.slice(beat.srtRange[0] - 1, beat.srtRange[1]);
  const startMs = Math.round(subs[0].startTime * 1000);
  const endMs = Math.round(subs[subs.length - 1].endTime * 1000);
  const durationFrames = Math.round((endMs - startMs) / 1000 * 30);
  const narration = subs.map(s => s.text).join(' ');

  const stackRoot = buildLayout(beat, idx, durationFrames);
  assignEnterAt(stackRoot, durationFrames);

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
      chart_type: null,
      chart_data: null,
    },
    chunk_metadata: {
      intent: beat.intent,
      tone: beat.tone,
      evidence_type: "statement",
      emphasis_tokens: beat.emphasis,
      density: Math.min(5, Math.max(1, Math.ceil(subs.length / 3))),
      beat_count: 1,
    },
    subtitles: subs.map(s => ({ startTime: s.startTime, endTime: s.endTime, text: s.text })),
    narration,
    stack_root: stackRoot,
  };
});

// ─── 파일 저장 ───
const outDir = "data/rag3";
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "scenes-v2.json"), JSON.stringify(scenes, null, 2));
console.log(`✅ ${scenes.length}개 씬 생성 → ${outDir}/scenes-v2.json`);

// render-props-v2.json
const renderProps = { audioFile: "RAG3.mp3", scenes };
fs.writeFileSync(path.join(outDir, "render-props-v2.json"), JSON.stringify(renderProps, null, 2));
console.log(`✅ render-props-v2.json 생성 완료`);

// 요약 출력
scenes.forEach(s => {
  const dur = (s.duration_frames / 30).toFixed(0);
  const ts = Math.floor(s.start_ms/1000/60) + ':' + String(Math.floor(s.start_ms/1000%60)).padStart(2,'0');
  console.log(`  beat ${s.beat_index} (${ts}, ${dur}s): [${s.chunk_metadata.intent}] ${s.copy_layers.headline.replace(/\n/g,' ')}`);
});
