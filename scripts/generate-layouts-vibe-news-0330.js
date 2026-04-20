#!/usr/bin/env node
// generate-layouts-vibe-news-0330.js
// 68개 씬 전체 stack_root 레이아웃 생성

const fs = require('fs');
const path = require('path');

const SCENES_PATH = path.join(__dirname, '../data/vibe-news-0330/scenes-v2.json');
const RENDER_PROPS_PATH = path.join(__dirname, '../data/vibe-news-0330/render-props-v2.json');

const scenes = JSON.parse(fs.readFileSync(SCENES_PATH, 'utf8'));

// Helper: cap enterAt to 80% of duration
function cap(enterAt, duration_frames) {
  return Math.min(enterAt, Math.floor(duration_frames * 0.8));
}

// Helper: subtitle startTime * 30 → frame, capped
function subFrame(sec, duration_frames) {
  return cap(Math.round(sec * 30), duration_frames);
}

// SceneRoot base layout
function sceneRoot(gap, children) {
  return {
    type: 'SceneRoot',
    layout: {
      gap: gap || 24,
      padding: '60px 100px 140px',
      align: 'center',
      justify: 'center'
    },
    children
  };
}

function kicker(text, enterAt, duration) {
  return {
    id: `kicker-${Math.random().toString(36).slice(2,6)}`,
    type: 'Kicker',
    data: { text },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function headline(text, size, emphasisArr, enterAt, duration) {
  const node = {
    id: `hl-${Math.random().toString(36).slice(2,6)}`,
    type: 'Headline',
    data: { text, size: size || 'xl' },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (emphasisArr && emphasisArr.length) node.data.emphasis = emphasisArr;
  return node;
}

function bodyText(text, enterAt, duration) {
  return {
    id: `bt-${Math.random().toString(36).slice(2,6)}`,
    type: 'BodyText',
    data: { text },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function footerCaption(text, enterAt, duration) {
  return {
    id: `fc-${Math.random().toString(36).slice(2,6)}`,
    type: 'FooterCaption',
    data: { text },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function imageAsset(src, shape, caption, enterAt, duration, motionEmphasis) {
  const node = {
    id: `img-${Math.random().toString(36).slice(2,6)}`,
    type: 'ImageAsset',
    data: { src, shape: shape || 'rounded' },
    motion: { preset: 'scaleIn', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (caption) node.data.caption = caption;
  if (motionEmphasis) node.motion.emphasis = motionEmphasis;
  return node;
}

function impactStat(value, suffix, label, enterAt, duration) {
  const node = {
    id: `stat-${Math.random().toString(36).slice(2,6)}`,
    type: 'ImpactStat',
    data: { value },
    motion: { preset: 'impactPop', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (suffix) node.data.suffix = suffix;
  if (label) node.data.label = label;
  return node;
}

function bulletList(items, variant, enterAt, duration) {
  return {
    id: `bl-${Math.random().toString(36).slice(2,6)}`,
    type: 'BulletList',
    data: { items: items.map(i => String(i)), variant: variant || 'check' },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function versusCard(leftLabel, rightLabel, leftValue, rightValue, enterAt, duration) {
  const node = {
    id: `vs-${Math.random().toString(36).slice(2,6)}`,
    type: 'VersusCard',
    data: { leftLabel, rightLabel },
    motion: { preset: 'slideSplit', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (leftValue) node.data.leftValue = leftValue;
  if (rightValue) node.data.rightValue = rightValue;
  return node;
}

function svgGraphic(viewBox, width, height, elements, enableDraw, enableGlow, enterAt, duration, motionEmphasis) {
  const node = {
    id: `svg-${Math.random().toString(36).slice(2,6)}`,
    type: 'SvgGraphic',
    data: {
      viewBox: viewBox || '0 0 600 300',
      width: width || 1100,
      height: height || 500,
      elements,
      enableDraw: enableDraw !== false,
      enableGlow: enableGlow !== false,
      staggerDelay: 5
    },
    motion: { preset: 'blurIn', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (motionEmphasis) node.motion.emphasis = motionEmphasis;
  return node;
}

function pill(text, enterAt, duration) {
  return {
    id: `pill-${Math.random().toString(36).slice(2,6)}`,
    type: 'Pill',
    data: { text },
    motion: { preset: 'popBadge', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function iconCard(icon, title, body, enterAt, duration) {
  return {
    id: `ic-${Math.random().toString(36).slice(2,6)}`,
    type: 'IconCard',
    data: { icon, title, body },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function processStepCard(step, title, description, enterAt, duration) {
  return {
    id: `psc-${Math.random().toString(36).slice(2,6)}`,
    type: 'ProcessStepCard',
    data: { step: String(step), title, description },
    motion: { preset: 'wipeRight', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function quoteText(text, enterAt, duration) {
  return {
    id: `qt-${Math.random().toString(36).slice(2,6)}`,
    type: 'QuoteText',
    data: { text },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function warningCard(title, body, enterAt, duration) {
  return {
    id: `wc-${Math.random().toString(36).slice(2,6)}`,
    type: 'WarningCard',
    data: { title, body },
    motion: { preset: 'shakeIn', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function checkMark(label, variant, enterAt, duration) {
  return {
    id: `ck-${Math.random().toString(36).slice(2,6)}`,
    type: 'CheckMark',
    data: { label, variant: variant || 'accent' },
    motion: { preset: 'popBadge', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function animatedTimeline(steps, direction, enterAt, duration) {
  return {
    id: `at-${Math.random().toString(36).slice(2,6)}`,
    type: 'AnimatedTimeline',
    data: { steps, direction: direction || 'horizontal' },
    motion: { preset: 'wipeRight', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function splitRevealCard(beforeLabel, afterLabel, beforeItems, afterItems, enterAt, duration) {
  return {
    id: `src-${Math.random().toString(36).slice(2,6)}`,
    type: 'SplitRevealCard',
    data: {
      beforeLabel: beforeLabel || '이전',
      afterLabel: afterLabel || '이후',
      beforeItems: beforeItems.map(String),
      afterItems: afterItems.map(String)
    },
    motion: { preset: 'slideSplit', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function animatedCounter(to, suffix, label, enterAt, duration) {
  const node = {
    id: `ac-${Math.random().toString(36).slice(2,6)}`,
    type: 'AnimatedCounter',
    data: { to },
    motion: { preset: 'impactPop', enterAt: cap(enterAt, duration), duration: 15 }
  };
  if (suffix) node.data.suffix = suffix;
  if (label) node.data.label = label;
  return node;
}

function markerHighlight(text, enterAt, duration) {
  return {
    id: `mh-${Math.random().toString(36).slice(2,6)}`,
    type: 'MarkerHighlight',
    data: { text, fontSize: 52 },
    motion: { preset: 'revealUp', enterAt: cap(enterAt, duration), duration: 15 }
  };
}

function stackRow(children, gap, maxWidth, enterAt, duration) {
  return {
    id: `stack-${Math.random().toString(36).slice(2,6)}`,
    type: 'Stack',
    layout: { direction: 'row', gap: gap || 40, maxWidth: maxWidth || 1200, justify: 'center', align: 'center' },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 },
    children
  };
}

function stackCol(children, gap, maxWidth, enterAt, duration) {
  return {
    id: `stack-${Math.random().toString(36).slice(2,6)}`,
    type: 'Stack',
    layout: { direction: 'column', gap: gap || 24, maxWidth: maxWidth || 900, align: 'center' },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 },
    children
  };
}

function grid(columns, children, gap, maxWidth, enterAt, duration) {
  return {
    id: `grid-${Math.random().toString(36).slice(2,6)}`,
    type: 'Grid',
    layout: { columns: columns || 2, gap: gap || 24, maxWidth: maxWidth || 1000 },
    motion: { preset: 'fadeUp', enterAt: cap(enterAt, duration), duration: 15 },
    children
  };
}

function kenBurnsBackground(src, pan) {
  return {
    type: 'image',
    src,
    blur: '10px',
    overlayOpacity: 0.65,
    scale: 1.25,
    pan: pan || { direction: 'right', distance: 30 },
    vignette: 0.5
  };
}

// ── LAYOUT GENERATION ──────────────────────────────────────────────────────

function buildLayout(scene) {
  const d = scene.duration_frames;
  const subs = scene.subtitles || [];
  const meta = scene.chunk_metadata || {};

  // Helper to get subtitle frame
  const sf = (idx) => subs[idx] ? subFrame(subs[idx].startTime, d) : 0;

  switch (scene.id) {

    // ── scene-0: 인트로 인사 ─────────────────────────────────────────────
    case 'scene-0': {
      const bg = kenBurnsBackground('assets/characters/smurf/greeting.png', { direction: 'right', distance: 20 });
      return {
        background: bg,
        stack_root: sceneRoot(28, [
          kicker('바이브랩스 뉴스', 0, d),
          headline('AI 세상은 쉬지 않는다', 'xl', ['AI'], 15, d),
          footerCaption('2026년 3월 30일', cap(sf(1) || 60, d), d)
        ])
      };
    }

    // ── scene-1: 오늘의 뉴스 프리뷰 ──────────────────────────────────────
    case 'scene-1': {
      return {
        stack_root: sceneRoot(24, [
          kicker('오늘의 바이브 뉴스', 0, d),
          headline('3가지 핵심 소식', 'xl', [], 15, d),
          stackCol([
            pill('Mythos — 엔트로픽 AI 유출', sf(1) || 44, d),
            pill('VibeVoice — 음성 AI 오픈소스', sf(2) || 185, d),
          ], 20, 700, sf(1) || 44, d)
        ])
      };
    }

    // ── scene-2: 뉴스 프리뷰 추가 ────────────────────────────────────────
    case 'scene-2': {
      return {
        stack_root: sceneRoot(28, [
          kicker('오늘의 바이브 뉴스', 0, d),
          stackRow([
            impactStat('85K', '★', 'Deep-Live-Cam', 15, d),
            impactStat('17K', '★', '헤르메스 에이전트', cap(80, d), d)
          ], 80, 1000, 15, d),
          footerCaption('스스로 똑똑해지는 AI 비서도 등장', cap(sf(1) || 138, d), d)
        ])
      };
    }

    // ── scene-3: 전환 (짧은 씬, 1.09초) ─────────────────────────────────
    case 'scene-3': {
      return {
        stack_root: sceneRoot(20, [
          markerHighlight('바로 시작합니다', 0, d)
        ])
      };
    }

    // ── scene-4: 뉴스1 헤더 — 엔트로픽 Mythos ────────────────────────────
    case 'scene-4': {
      const bg = kenBurnsBackground('assets/anthropic.svg', { direction: 'left', distance: 25 });
      return {
        background: bg,
        stack_root: sceneRoot(24, [
          kicker('뉴스 1', 0, d),
          headline('엔트로픽 Mythos 유출', 'xl', ['Mythos'], 15, d),
          imageAsset('assets/anthropic.svg', 'rounded', 'Anthropic', sf(1) || 119, d, 'float'),
          footerCaption('차세대 AI 모델의 비밀', cap(sf(1) || 119, d), d)
        ])
      };
    }

    // ── scene-5: 내부 문서 유출 / 3000건 ─────────────────────────────────
    case 'scene-5': {
      const bg5 = kenBurnsBackground('icons/vibe-news-0330/cybersecurity.svg', { direction: 'left', distance: 30 });
      return {
        background: bg5,
        stack_root: sceneRoot(24, [
          kicker('엔트로픽 유출', 0, d),
          headline('내부 문서 3,000건 발견', 'xl', ['3,000건'], 15, d),
          impactStat('3,000', '건', '미공개 자료 유출', sf(2) || 107, d),
          footerCaption('콘텐츠 관리 시스템 취약점', cap(sf(3) || 213, d), d)
        ])
      };
    }

    // ── scene-6: Mythos / 카피바라 ────────────────────────────────────────
    case 'scene-6': {
      return {
        stack_root: sceneRoot(28, [
          kicker('모델명 공개', 0, d),
          headline('Mythos → 제품명: 카피바라', 'xl', ['Mythos', '카피바라'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 80, y: 80, width: 180, height: 140, rx: 16, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 170, y: 148, textAnchor: 'middle', fontSize: 28, fill: '#fff' }, text: '내부 초안', staggerIndex: 1 },
            { tag: 'path', attrs: { d: 'M 270 150 L 340 150', stroke: '#22d3ee', strokeWidth: 2.5, markerEnd: 'url(#arrow)' }, themeColor: 'accent', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 340, y: 80, width: 180, height: 140, rx: 16, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 430, y: 140, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: 'Mythos', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 430, y: 175, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '= 카피바라', staggerIndex: 5 }
          ], true, true, sf(2) || 134, d, 'glowPulse')
        ])
      };
    }

    // ── scene-7: Opus 비교 ─────────────────────────────────────────────
    case 'scene-7': {
      const bg7 = kenBurnsBackground('assets/anthropic.svg', { direction: 'right', distance: 25 });
      return {
        background: bg7,
        stack_root: sceneRoot(28, [
          kicker('성능 비교', 0, d),
          versusCard('Claude Opus', 'Mythos', '최고 등급', '그 위의 새 등급', 15, d),
          footerCaption('지금까지 나온 가장 똑똑한 모델보다 위', cap(sf(2) || 175, d), d)
        ])
      };
    }

    // ── scene-8: 코딩·추론·보안 분야 ─────────────────────────────────────
    case 'scene-8': {
      return {
        stack_root: sceneRoot(24, [
          kicker('강점 분야', 0, d),
          headline('코딩 · 학술 추론 · 사이버 보안', 'xl', ['사이버 보안'], 15, d),
          bulletList(['코딩 능력 대폭 향상', '학술 추론 강화', '사이버 보안 특화'], 'check', sf(1) || 74, d)
        ])
      };
    }

    // ── scene-9: 오퍼스보다 성능 높음 + 보안 앞서 ───────────────────────
    case 'scene-9': {
      const bg9 = kenBurnsBackground('icons/vibe-news-0330/cybersecurity.svg', { direction: 'right', distance: 25 });
      return {
        background: bg9,
        stack_root: sceneRoot(24, [
          kicker('엔트로픽 Mythos', 0, d),
          headline('사이버 보안 — 모든 AI 중 1위', 'xl', ['1위'], 15, d),
          stackRow([
            imageAsset('assets/anthropic.svg', 'rounded', null, sf(1) || 113, d),
            imageAsset('icons/vibe-news-0330/cybersecurity.svg', 'rounded', '사이버 보안', sf(2) || 199, d)
          ], 80, 900, sf(1) || 113, d),
          footerCaption('초안 문서에 명시된 보안 우위', cap(sf(2) || 199, d), d)
        ])
      };
    }

    // ── scene-10: 엔트로픽 반응 — 유출 인정 ─────────────────────────────
    case 'scene-10': {
      const bg = kenBurnsBackground('assets/anthropic.svg', { direction: 'right', distance: 20 });
      return {
        background: bg,
        stack_root: sceneRoot(28, [
          kicker('엔트로픽 공식 반응', 0, d),
          quoteText('"우리가 만든 것 중 가장 뛰어난 모델"', 15, d),
          footerCaption('유출 사실 인정 + 자신감 표명', cap(sf(2) || 141, d), d)
        ])
      };
    }

    // ── scene-11: 신중 공개 + 사이버 방어 기관 ───────────────────────────
    case 'scene-11': {
      return {
        stack_root: sceneRoot(24, [
          kicker('출시 전략', 0, d),
          headline('사이버 방어 기관 우선 접근', 'xl', ['사이버 방어'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'circle', attrs: { cx: 300, cy: 130, r: 55, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 300, y: 120, textAnchor: 'middle', fontSize: 26, fill: '#22d3ee' }, text: 'Mythos', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 300, y: 152, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '출시 미정', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 70, y: 220, width: 160, height: 55, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 1.5 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 150, y: 252, textAnchor: 'middle', fontSize: 22, fill: '#22d3ee' }, text: '사이버 방어 기관', staggerIndex: 4 },
            { tag: 'rect', attrs: { x: 370, y: 220, width: 160, height: 55, rx: 8, fill: 'none', stroke: '#64748b', strokeWidth: 1.5 }, staggerIndex: 5 },
            { tag: 'text', attrs: { x: 450, y: 252, textAnchor: 'middle', fontSize: 22, fill: '#64748b' }, text: '일반 공개 (미정)', staggerIndex: 6 },
            { tag: 'path', attrs: { d: 'M 245 185 L 150 220', stroke: '#22d3ee', strokeWidth: 1.5, strokeDasharray: '6 3' }, themeColor: 'accent', staggerIndex: 7 },
            { tag: 'path', attrs: { d: 'M 355 185 L 450 220', stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '6 3' }, staggerIndex: 8 }
          ], true, true, sf(1) || 73, d)
        ])
      };
    }

    // ── scene-12: AI 성능 경쟁 전문화 ────────────────────────────────────
    case 'scene-12': {
      return {
        stack_root: sceneRoot(28, [
          kicker('왜 중요한가?', 0, d),
          headline('전문화 경쟁 시대 개막', 'xl', ['전문화'], 15, d),
          svgGraphic('0 0 600 300', 1100, 500, [
            { tag: 'circle', attrs: { cx: 120, cy: 150, r: 80, fill: 'none', stroke: '#64748b', strokeWidth: 2 }, staggerIndex: 0 },
            { tag: 'text', attrs: { x: 120, y: 145, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '더 똑똑한', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 120, y: 172, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: 'AI', staggerIndex: 2 },
            { tag: 'circle', attrs: { cx: 480, cy: 150, r: 90, fill: 'none', stroke: '#22d3ee', strokeWidth: 2.5 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 480, y: 142, textAnchor: 'middle', fontSize: 26, fill: '#22d3ee' }, text: '더 전문적인', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 480, y: 172, textAnchor: 'middle', fontSize: 26, fill: '#22d3ee' }, text: 'AI', staggerIndex: 5 },
            { tag: 'path', attrs: { d: 'M 205 150 L 380 150', stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '8 4' }, themeColor: 'accent', staggerIndex: 6 }
          ], true, true, sf(1) || 39, d, 'glowPulse')
        ])
      };
    }

    // ── scene-13: 방어/공격 양측 변화 ────────────────────────────────────
    case 'scene-13': {
      const bg13 = kenBurnsBackground('icons/vibe-news-0330/cybersecurity.svg', { direction: 'left', distance: 20 });
      return {
        background: bg13,
        stack_root: sceneRoot(24, [
          kicker('사이버 보안 AI', 0, d),
          versusCard('방어하는 쪽', '공격하는 쪽', '보안 강화', '위협 증가', 15, d),
          footerCaption('AI 보안 능력 향상의 이중적 의미', cap(sf(2) || 149, d), d)
        ])
      };
    }

    // ── scene-14: 공식 발표 대기 ─────────────────────────────────────────
    case 'scene-14': {
      return {
        stack_root: sceneRoot(24, [
          kicker('엔트로픽 Mythos', 0, d),
          headline('공식 발표를 기다려야', 'xl', [], 15, d),
          footerCaption('유출 단계 — 출시 일정 미확인', cap(sf(1) || 101, d), d)
        ])
      };
    }

    // ── scene-15: 뉴스2 헤더 — VibeVoice ─────────────────────────────────
    case 'scene-15': {
      const bg = kenBurnsBackground('icons/vibe-news-0330/microsoft.svg', { direction: 'left', distance: 25 });
      return {
        background: bg,
        stack_root: sceneRoot(24, [
          kicker('뉴스 2', 0, d),
          headline('마이크로소프트 VibeVoice', 'xl', ['VibeVoice'], 15, d),
          stackRow([
            imageAsset('icons/vibe-news-0330/microsoft.svg', 'rounded', 'Microsoft', sf(1) || 144, d),
            imageAsset('icons/vibe-news-0330/voice.svg', 'rounded', '음성 AI', cap(sf(1) + 30 || 174, d), d)
          ], 60, 900, sf(1) || 144, d),
          footerCaption('긴 분량 음성 처리 기술', cap(sf(1) || 144, d), d)
        ])
      };
    }

    // ── scene-16: VibeVoice 공개 + 27K 스타 ──────────────────────────────
    case 'scene-16': {
      return {
        stack_root: sceneRoot(28, [
          kicker('VibeVoice', 0, d),
          stackRow([
            imageAsset('icons/vibe-news-0330/microsoft.svg', 'rounded', null, 15, d),
            impactStat('27K', '★', 'GitHub 스타', 15, d)
          ], 80, 900, 15, d),
          footerCaption('개발자 커뮤니티 강한 반응', cap(sf(1) || 137, d), d)
        ])
      };
    }

    // ── scene-17: TTS vs ASR ──────────────────────────────────────────────
    case 'scene-17': {
      return {
        stack_root: sceneRoot(28, [
          kicker('VibeVoice 정확히 알기', 0, d),
          versusCard('TTS (글→소리)', 'ASR (소리→글)', '현재 비활성', '현재 공개됨', 15, d),
          footerCaption('개발자 주목 포인트', cap(sf(3) || 213, d), d)
        ])
      };
    }

    // ── scene-18: ASR 공개 / TTS 내려감 ──────────────────────────────────
    case 'scene-18': {
      return {
        stack_root: sceneRoot(24, [
          kicker('현재 공개 상태', 0, d),
          headline('ASR 공개 · TTS 비활성', 'xl', ['ASR'], 15, d),
          bulletList(['ASR: 음성 인식 공개됨', 'TTS: 악용 우려로 내려감', '악용 방지 조치 적용'], 'dot', sf(1) || 132, d),
          footerCaption('Microsoft 보안 정책 반영', cap(sf(3) || 231, d), d)
        ])
      };
    }

    // ── scene-19: Microsoft ReadMe + ASR 핵심 ────────────────────────────
    case 'scene-19': {
      return {
        stack_root: sceneRoot(24, [
          kicker('Microsoft 공식 입장', 0, d),
          imageAsset('icons/vibe-news-0330/microsoft.svg', 'rounded', 'Microsoft', 15, d, 'float'),
          headline('지금 공개된 핵심: ASR', 'xl', ['ASR'], sf(1) || 111, d)
        ])
      };
    }

    // ── scene-20: ASR 정의 — 긴 녹음 정리 ───────────────────────────────
    case 'scene-20': {
      return {
        stack_root: sceneRoot(24, [
          kicker('ASR이란?', 0, d),
          headline('긴 녹음 → 누가 · 언제 · 무엇을', 'xl', ['녹음'], 15, d),
          imageAsset('icons/vibe-news-0330/voice.svg', 'rounded', '음성 인식 AI', sf(1) || 96, d, 'float')
        ])
      };
    }

    // ── scene-21: 60분 오디오 처리 ───────────────────────────────────────
    case 'scene-21': {
      const bg21 = kenBurnsBackground('icons/vibe-news-0330/voice.svg', { direction: 'right', distance: 25 });
      return {
        background: bg21,
        stack_root: sceneRoot(28, [
          kicker('VibeVoice 기능', 0, d),
          impactStat('60', '분', '한 번에 처리', 15, d),
          bulletList(['화자 구분 자동화', '타임스탬프 생성', '발화 내용 구조화'], 'check', sf(1) || 83, d),
          footerCaption('회의록·인터뷰 정리에 실용적', cap(sf(2) || 215, d), d)
        ])
      };
    }

    // ── scene-22: Notion AI 비서 + 기술적 흥미 ───────────────────────────
    case 'scene-22': {
      return {
        stack_root: sceneRoot(24, [
          kicker('개인적 활용 관점', 0, d),
          headline('오픈소스 음성 AI 활용법', 'xl', ['오픈소스'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 50, y: 60, width: 140, height: 180, rx: 12, fill: 'none', stroke: '#64748b', strokeWidth: 1.5 }, staggerIndex: 0 },
            { tag: 'text', attrs: { x: 120, y: 150, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '긴 오디오', staggerIndex: 1 },
            { tag: 'path', attrs: { d: 'M 195 150 L 260 150', stroke: '#22d3ee', strokeWidth: 2, markerEnd: 'url(#arrow)' }, themeColor: 'accent', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 260, y: 60, width: 140, height: 180, rx: 12, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 330, y: 140, textAnchor: 'middle', fontSize: 24, fill: '#22d3ee' }, text: 'VibeVoice', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 330, y: 168, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: 'ASR', staggerIndex: 5 },
            { tag: 'path', attrs: { d: 'M 405 150 L 470 150', stroke: '#22d3ee', strokeWidth: 2, markerEnd: 'url(#arrow)' }, themeColor: 'accent', staggerIndex: 6 },
            { tag: 'rect', attrs: { x: 470, y: 60, width: 140, height: 180, rx: 12, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 7 },
            { tag: 'text', attrs: { x: 540, y: 148, textAnchor: 'middle', fontSize: 22, fill: '#fff' }, text: '구조화 텍스트', staggerIndex: 8 }
          ], true, true, sf(2) || 202, d)
        ])
      };
    }

    // ── scene-23: 7.5Hz 토크나이저 ───────────────────────────────────────
    case 'scene-23': {
      return {
        stack_root: sceneRoot(24, [
          kicker('기술적 혁신', 0, d),
          headline('7.5Hz 저프레임 토크나이저', 'xl', ['7.5Hz'], 15, d),
          imageAsset('icons/vibe-news-0330/voice.svg', 'rounded', 'VibeVoice', sf(1) || 110, d, 'glowPulse'),
          footerCaption('긴 음성 맥락을 더 효율적으로 처리', cap(sf(2) || 266, d), d)
        ])
      };
    }

    // ── scene-24: 긴 대화 한 덩어리 처리 ─────────────────────────────────
    case 'scene-24': {
      return {
        stack_root: sceneRoot(28, [
          kicker('VibeVoice 원리', 0, d),
          headline('1시간 대화를 한 덩어리로', 'xl', ['1시간'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 40, y: 100, width: 520, height: 100, rx: 8, fill: 'none', stroke: '#334155', strokeWidth: 1.5 }, staggerIndex: 0 },
            { tag: 'rect', attrs: { x: 40, y: 100, width: 520, height: 100, rx: 8, fill: '#22d3ee', fillOpacity: 0.15 }, themeColor: 'accent', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 300, y: 145, textAnchor: 'middle', fontSize: 26, fill: '#22d3ee' }, text: '1시간 오디오 — 통째로 처리', staggerIndex: 2 },
            { tag: 'text', attrs: { x: 300, y: 178, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '화자 구분 · 맥락 연결 · 안정적', staggerIndex: 3 }
          ], false, true, sf(1) || 66, d),
          footerCaption('맥락 끊김 없이 안정적 추적', cap(sf(2) || 283, d), d)
        ])
      };
    }

    // ── scene-25: Microsoft 장문 대화 방향 ──────────────────────────────
    case 'scene-25': {
      return {
        stack_root: sceneRoot(24, [
          kicker('Microsoft 전략 방향', 0, d),
          imageAsset('icons/vibe-news-0330/microsoft.svg', 'rounded', 'Microsoft', 15, d),
          headline('짧은 명령 → 장문 대화 AI', 'xl', ['장문 대화'], sf(1) || 100, d),
          footerCaption('회의 · 인터뷰 · 팟캐스트 처리', cap(sf(2) || 250, d), d)
        ])
      };
    }

    // ── scene-26: 90분 TTS + 4명 화자 ───────────────────────────────────
    case 'scene-26': {
      const bg26 = kenBurnsBackground('icons/vibe-news-0330/microsoft.svg', { direction: 'right', distance: 20 });
      return {
        background: bg26,
        stack_root: sceneRoot(28, [
          kicker('VibeVoice 계열 전체', 0, d),
          stackRow([
            impactStat('90', '분', '최대 음성 생성', 15, d),
            impactStat('4', '명', '화자 동시 생성', cap(60, d), d)
          ], 80, 900, 15, d),
          footerCaption('TTS 모델은 현재 비활성화', cap(sf(3) || 284, d), d)
        ])
      };
    }

    // ── scene-27: VibeVoice 활용 분야 ────────────────────────────────────
    case 'scene-27': {
      return {
        stack_root: sceneRoot(24, [
          kicker('실용적 활용', 0, d),
          headline('현재 쓸 수 있는 건 ASR', 'xl', ['ASR'], 15, d),
          bulletList(['교육 콘텐츠 자동 기록', '회의 자동 정리', '인터뷰 구조화', '사내 문서화'], 'check', sf(1) || 108, d),
          footerCaption('Microsoft의 큰 그림이 보이는 프로젝트', cap(sf(3) || 338, d), d)
        ])
      };
    }

    // ── scene-28: AI 긴 대화 시대 ────────────────────────────────────────
    case 'scene-28': {
      return {
        stack_root: sceneRoot(24, [
          kicker('의미', 0, d),
          markerHighlight('긴 대화를 통째로 듣는 AI', 15, d),
          footerCaption('짧은 명령 처리를 넘어서는 전환점', cap(sf(1) || 85, d), d)
        ])
      };
    }

    // ── scene-29: 뉴스3 헤더 — Deep-Live-Cam ─────────────────────────────
    case 'scene-29': {
      const bg = kenBurnsBackground('icons/vibe-news-0330/deep-live-cam.svg', { direction: 'right', distance: 20 });
      return {
        background: bg,
        stack_root: sceneRoot(24, [
          kicker('뉴스 3', 0, d),
          headline('Deep-Live-Cam 별 8만 5천', 'xl', ['8만 5천'], 15, d),
          imageAsset('icons/vibe-news-0330/deep-live-cam.svg', 'rounded', 'Deep-Live-Cam', sf(1) || 161, d, 'float'),
          footerCaption('실시간 얼굴 바꾸기 오픈소스', cap(sf(1) || 161, d), d)
        ])
      };
    }

    // ── scene-30: 오픈소스 85K 스타 ──────────────────────────────────────
    case 'scene-30': {
      const bg30 = kenBurnsBackground('icons/vibe-news-0330/deep-live-cam.svg', { direction: 'left', distance: 25 });
      return {
        background: bg30,
        stack_root: sceneRoot(28, [
          kicker('Deep-Live-Cam', 0, d),
          stackRow([
            imageAsset('icons/vibe-news-0330/deep-live-cam.svg', 'rounded', null, 15, d),
            impactStat('85K', '★', 'GitHub 스타', 15, d)
          ], 80, 900, 15, d),
          footerCaption('오픈소스 프로젝트 대폭발', cap(sf(2) || 134, d), d)
        ])
      };
    }

    // ── scene-31: 얼굴 바꾸는 도구 설명 ─────────────────────────────────
    case 'scene-31': {
      return {
        stack_root: sceneRoot(24, [
          kicker('딥페이크 실시간', 0, d),
          headline('사진 1장으로 웹캠 얼굴 교체', 'xl', ['1장'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'circle', attrs: { cx: 160, cy: 150, r: 75, fill: 'none', stroke: '#64748b', strokeWidth: 2 }, staggerIndex: 0 },
            { tag: 'text', attrs: { x: 160, y: 145, textAnchor: 'middle', fontSize: 26, fill: '#94a3b8' }, text: '진짜 얼굴', staggerIndex: 1 },
            { tag: 'path', attrs: { d: 'M 240 150 L 360 150', stroke: '#f59e0b', strokeWidth: 2.5, strokeDasharray: '8 4' }, staggerIndex: 2 },
            { tag: 'text', attrs: { x: 300, y: 130, textAnchor: 'middle', fontSize: 22, fill: '#f59e0b' }, text: 'AI 교체', staggerIndex: 3 },
            { tag: 'circle', attrs: { cx: 440, cy: 150, r: 75, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 440, y: 145, textAnchor: 'middle', fontSize: 26, fill: '#22d3ee' }, text: '다른 얼굴', staggerIndex: 5 }
          ], true, true, sf(1) || 25, d),
          footerCaption('영상 통화에서 실시간 사칭 가능', cap(sf(3) || 170, d), d)
        ])
      };
    }

    // ── scene-32: GitHub 상위 0.01% ──────────────────────────────────────
    case 'scene-32': {
      return {
        stack_root: sceneRoot(28, [
          kicker('규모 파악', 0, d),
          impactStat('0.01', '%', 'GitHub 상위', 15, d),
          headline('전체 중 가장 주목받는 프로젝트', 'lg', [], sf(1) || 99, d),
          footerCaption('아르스 테크니카, CNN 브라질 등 주요 매체 보도', cap(sf(2) || 225, d), d)
        ])
      };
    }

    // ── scene-33: 기술 상세 — 표정·입모양 ───────────────────────────────
    case 'scene-33': {
      return {
        stack_root: sceneRoot(24, [
          kicker('기술 수준', 0, d),
          headline('표정 · 입모양 · 다중 얼굴', 'xl', ['다중 얼굴'], 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'circle', attrs: { cx: 130, cy: 150, r: 65, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 130, y: 143, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '😊', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 130, y: 196, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '표정 추적', staggerIndex: 2 },
            { tag: 'circle', attrs: { cx: 300, cy: 150, r: 65, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 300, y: 143, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '👄', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 300, y: 196, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '입모양 유지', staggerIndex: 5 },
            { tag: 'circle', attrs: { cx: 470, cy: 150, r: 65, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 6 },
            { tag: 'text', attrs: { x: 470, y: 143, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '👥', staggerIndex: 7 },
            { tag: 'text', attrs: { x: 470, y: 196, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '다중 동시', staggerIndex: 8 }
          ], true, true, sf(1) || 48, d)
        ])
      };
    }

    // ── scene-34: 엔비디아 GPU 필요 + 솔직한 경고 ───────────────────────
    case 'scene-34': {
      return {
        stack_root: sceneRoot(24, [
          kicker('실행 조건', 0, d),
          headline('엔비디아 GPU → 실시간 작동', 'xl', ['GPU'], 15, d),
          footerCaption('그러나 솔직히 말씀드릴 점이 있어요', cap(sf(2) || 119, d), d)
        ])
      };
    }

    // ── scene-35: 악용 가능성 경고 ───────────────────────────────────────
    case 'scene-35': {
      const bg35 = kenBurnsBackground('icons/vibe-news-0330/cybersecurity.svg', { direction: 'right', distance: 20 });
      return {
        background: bg35,
        stack_root: sceneRoot(24, [
          kicker('위험 경고', 0, d),
          warningCard('악용 우려', '사기 · 사칭 · 보이스피싱에 활용 가능'),
          footerCaption('AGPL 라이센스 — 상업적 사용 시 소스 공개 의무', cap(sf(2) || 170, d), d)
        ])
      };
    }

    // ── scene-36: 영상통화 본인확인 시대 끝 ─────────────────────────────
    case 'scene-36': {
      return {
        stack_root: sceneRoot(28, [
          kicker('우리에게 필요한 인식', 0, d),
          markerHighlight('영상통화 = 진짜가 아닐 수 있다', 15, d),
          footerCaption('배포 시 소스 공개 의무 포함', cap(sf(1) || 123, d), d)
        ])
      };
    }

    // ── scene-37: 부모님께 알려드릴 것 ──────────────────────────────────
    case 'scene-37': {
      return {
        stack_root: sceneRoot(24, [
          kicker('핵심 메시지', 0, d),
          quoteText('"영상통화라고 다 진짜 사람이 아닐 수 있다"', 15, d),
          footerCaption('주변에 꼭 알려주세요', cap(sf(1) || 142, d), d)
        ])
      };
    }

    // ── scene-38: 뉴스4 헤더 — 헤르메스 에이전트 ────────────────────────
    case 'scene-38': {
      const bg = kenBurnsBackground('icons/vibe-news-0330/nousresearch.png', { direction: 'left', distance: 20 });
      return {
        background: bg,
        stack_root: sceneRoot(24, [
          kicker('뉴스 4', 0, d),
          headline('헤르메스 에이전트', 'xl', ['헤르메스'], 15, d),
          imageAsset('icons/vibe-news-0330/nousresearch.png', 'rounded', 'NousResearch', sf(1) || 140, d, 'float'),
          footerCaption('쓸수록 똑똑해지는 AI 비서', cap(sf(1) || 140, d), d)
        ])
      };
    }

    // ── scene-39: NousResearch + 17,000 스타 ─────────────────────────────
    case 'scene-39': {
      const bg39 = kenBurnsBackground('icons/vibe-news-0330/nousresearch.png', { direction: 'left', distance: 20 });
      return {
        background: bg39,
        stack_root: sceneRoot(28, [
          kicker('NousResearch', 0, d),
          stackRow([
            imageAsset('icons/vibe-news-0330/nousresearch.png', 'rounded', null, 15, d),
            impactStat('17K', '★', '헤르메스 에이전트', 15, d)
          ], 80, 900, 15, d),
          footerCaption('AI 에이전트 분야 주목작', cap(sf(3) || 214, d), d)
        ])
      };
    }

    // ── scene-40: 쓸수록 똑똑해진다 ─────────────────────────────────────
    case 'scene-40': {
      return {
        stack_root: sceneRoot(24, [
          kicker('헤르메스 에이전트 핵심', 0, d),
          markerHighlight('쓰면 쓸수록 똑똑해진다', 15, d),
          footerCaption('기존 AI: 대화 끝나면 전부 잊어버림', cap(sf(2) || 116, d), d)
        ])
      };
    }

    // ── scene-41: 기억하고 패턴 찾기 ────────────────────────────────────
    case 'scene-41': {
      return {
        stack_root: sceneRoot(24, [
          kicker('헤르메스 vs 일반 AI', 0, d),
          splitRevealCard('기존 AI', '헤르메스 에이전트', ['대화 끝나면 잊음', '매번 같은 설명'], ['한 번 알려주면 기억', '패턴 학습 → 자동 개선'], 15, d),
          footerCaption('한 번 알려주면 계속 기억', cap(sf(4) || 202, d), d)
        ])
      };
    }

    // ── scene-42: 월요일 뉴스 요약 예시 ─────────────────────────────────
    case 'scene-42': {
      return {
        stack_root: sceneRoot(24, [
          kicker('실제 사용 예시', 0, d),
          animatedTimeline([
            { label: '한 번 지시', desc: '경쟁사 뉴스 요약해줘' },
            { label: '초반 허술', desc: '기본 수준 결과' },
            { label: '몇 주 후', desc: '패턴 학습 완료' },
            { label: '자동 최적화', desc: '맞춤형 요약 완성' }
          ], 'horizontal', 15, d),
          footerCaption('시간이 지날수록 더 정교해짐', cap(sf(3) || 241, d), d)
        ])
      };
    }

    // ── scene-43: 텔레그램·디스코드·슬랙 ────────────────────────────────
    case 'scene-43': {
      const bg43 = kenBurnsBackground('icons/vibe-news-0330/telegram.svg', { direction: 'right', distance: 20 });
      return {
        background: bg43,
        stack_root: sceneRoot(24, [
          kicker('연동 메신저', 0, d),
          headline('모든 메신저에서 작동', 'xl', ['모든'], 15, d),
          stackRow([
            imageAsset('icons/vibe-news-0330/telegram.svg', 'circle', '텔레그램', sf(1) || 114, d),
            imageAsset('icons/vibe-news-0330/discord.svg', 'circle', '디스코드', cap(sf(1) + 30 || 144, d), d)
          ], 60, 800, sf(1) || 114, d),
          footerCaption('왓츠앱 · 시그널 · 슬랙도 지원', cap(sf(2) || 266, d), d)
        ])
      };
    }

    // ── scene-44: 40개 도구 내장 + MIT ───────────────────────────────────
    case 'scene-44': {
      return {
        stack_root: sceneRoot(24, [
          kicker('헤르메스 에이전트 기능', 0, d),
          impactStat('40+', '개', '내장 도구', 15, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 40, y: 60, width: 120, height: 90, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 1.5 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 100, y: 100, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '🔍', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 100, y: 135, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '웹 검색', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 200, y: 60, width: 120, height: 90, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 1.5 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 260, y: 100, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '💻', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 260, y: 135, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '코드 실행', staggerIndex: 5 },
            { tag: 'rect', attrs: { x: 360, y: 60, width: 120, height: 90, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 1.5 }, themeColor: 'accent', staggerIndex: 6 },
            { tag: 'text', attrs: { x: 420, y: 100, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '📅', staggerIndex: 7 },
            { tag: 'text', attrs: { x: 420, y: 135, textAnchor: 'middle', fontSize: 20, fill: '#94a3b8' }, text: '일정 관리', staggerIndex: 8 },
            { tag: 'text', attrs: { x: 300, y: 220, textAnchor: 'middle', fontSize: 24, fill: '#22d3ee' }, text: '+ 37개 더 (MIT 라이센스)', staggerIndex: 9 }
          ], true, true, sf(1) || 49, d),
          footerCaption('카카오톡처럼 메시지 보내면 실행', cap(sf(4) || 276, d), d)
        ])
      };
    }

    // ── scene-45: 진짜 나만의 비서 ───────────────────────────────────────
    case 'scene-45': {
      return {
        stack_root: sceneRoot(24, [
          kicker('AI의 변화', 0, d),
          markerHighlight('일회용 → 진짜 비서로', 15, d),
          footerCaption('개인화 AI 시대의 신호탄', cap(sf(1) || 73, d), d)
        ])
      };
    }

    // ── scene-46: 뉴스5 헤더 — 도구 3가지 ───────────────────────────────
    case 'scene-46': {
      return {
        stack_root: sceneRoot(24, [
          kicker('뉴스 5', 0, d),
          headline('눈여겨 볼 오픈소스 도구 3가지', 'xl', ['3가지'], 15, d),
          stackRow([
            pill('Pixel Agents', sf(1) || 78, d),
            pill('last30days', cap(sf(1) + 30 || 108, d), d),
            pill('OpenSeeker', cap(sf(1) + 60 || 138, d), d)
          ], 30, 1100, sf(1) || 78, d)
        ])
      };
    }

    // ── scene-47: Pixel Agents 소개 ──────────────────────────────────────
    case 'scene-47': {
      return {
        stack_root: sceneRoot(24, [
          kicker('도구 1', 0, d),
          headline('Pixel Agents', 'xl', ['Pixel Agents'], 15, d),
          footerCaption('AI 에이전트 픽셀 아트 시각화 도구', cap(sf(2) || 183, d), d)
        ])
      };
    }

    // ── scene-48: Pixel Agents 5K 스타 ───────────────────────────────────
    case 'scene-48': {
      return {
        stack_root: sceneRoot(28, [
          kicker('Pixel Agents', 0, d),
          impactStat('5K', '★', 'GitHub 스타', 15, d),
          headline('AI 에이전트를 게임 캐릭터로', 'lg', ['게임 캐릭터'], sf(1) || 57, d),
          footerCaption('각 에이전트의 행동을 픽셀 아트로 표현', cap(sf(2) || 154, d), d)
        ])
      };
    }

    // ── scene-49: 타자치는 캐릭터 설명 ──────────────────────────────────
    case 'scene-49': {
      return {
        stack_root: sceneRoot(24, [
          kicker('Pixel Agents 시각화', 0, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 60, y: 80, width: 140, height: 140, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 130, y: 145, textAnchor: 'middle', fontSize: 36, fill: '#22d3ee' }, text: '⌨', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 130, y: 200, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '코딩 중', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 250, y: 80, width: 140, height: 140, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 320, y: 145, textAnchor: 'middle', fontSize: 36, fill: '#22d3ee' }, text: '📖', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 320, y: 200, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '파일 읽기', staggerIndex: 5 },
            { tag: 'rect', attrs: { x: 440, y: 80, width: 140, height: 140, rx: 8, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 6 },
            { tag: 'text', attrs: { x: 510, y: 145, textAnchor: 'middle', fontSize: 36, fill: '#22d3ee' }, text: '🔍', staggerIndex: 7 },
            { tag: 'text', attrs: { x: 510, y: 200, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '검색 중', staggerIndex: 8 }
          ], true, true, 15, d)
        ])
      };
    }

    // ── scene-50: AI 팀원 관리 시대 ─────────────────────────────────────
    case 'scene-50': {
      const bg50 = kenBurnsBackground('assets/characters/smurf/surprised.png', { direction: 'right', distance: 20 });
      return {
        background: bg50,
        stack_root: sceneRoot(28, [
          kicker('시대의 변화', 0, d),
          markerHighlight('AI 팀원 관리 시대', 15, d),
          footerCaption('게임 같은 관리 화면 = 시대가 바뀐 것', cap(sf(3) || 278, d), d)
        ])
      };
    }

    // ── scene-51: last30days 소개 ─────────────────────────────────────────
    case 'scene-51': {
      return {
        stack_root: sceneRoot(28, [
          kicker('도구 2', 0, d),
          headline('last30days — 15K★', 'xl', ['last30days'], 15, d),
          bulletList(['레딧 · X · 유튜브', '해커뉴스 · 블루스카이', '예측 시장까지 한꺼번에'], 'dot', sf(2) || 125, d),
          footerCaption('최근 30일 특정 주제 종합 분석', cap(sf(3) || 224, d), d)
        ])
      };
    }

    // ── scene-52: 구글 검색과 차원이 다름 ────────────────────────────────
    case 'scene-52': {
      return {
        stack_root: sceneRoot(24, [
          kicker('last30days 차이점', 0, d),
          versusCard('구글 검색', 'last30days', '링크 나열', '사람 반응 종합', 15, d),
          footerCaption('각 플랫폼 실제 반응까지 정리', cap(sf(2) || 154, d), d)
        ])
      };
    }

    // ── scene-53: OpenSeeker 소개 ─────────────────────────────────────────
    case 'scene-53': {
      return {
        stack_root: sceneRoot(24, [
          kicker('도구 3', 0, d),
          headline('OpenSeeker', 'xl', ['OpenSeeker'], 15, d),
          footerCaption('상하이 교통대학 연구팀 오픈소스 검색 AI', cap(sf(1) || 134, d), d)
        ])
      };
    }

    // ── scene-54: 487개 스타, 11,700 학습데이터 ──────────────────────────
    case 'scene-54': {
      return {
        stack_root: sceneRoot(28, [
          kicker('OpenSeeker 특징', 0, d),
          stackRow([
            impactStat('487', '★', '현재 스타 수', 15, d),
            impactStat('11.7K', '개', '학습 데이터 공개', cap(60, d), d)
          ], 80, 1000, 15, d),
          footerCaption('작지만 완전한 투명성이 주목 이유', cap(sf(1) || 134, d), d)
        ])
      };
    }

    // ── scene-55: 보통은 결과만 보여줌 ──────────────────────────────────
    case 'scene-55': {
      return {
        stack_root: sceneRoot(24, [
          kicker('업계 관행 vs OpenSeeker', 0, d),
          versusCard('일반 검색 AI', 'OpenSeeker', '결과만 공개', '학습 과정까지 공개', 15, d),
          footerCaption('AI 연구 투명성의 새로운 기준', cap(sf(1) || 105, d), d)
        ])
      };
    }

    // ── scene-56: 학습 과정 공개 = 투명성 ────────────────────────────────
    case 'scene-56': {
      return {
        stack_root: sceneRoot(24, [
          kicker('투명성', 0, d),
          checkMark('학습 과정까지 완전 공개', 'accent', 15, d),
          headline('AI 연구 투명성 새 기준', 'lg', ['투명성'], sf(1) || 81, d),
          footerCaption('오늘 뉴스를 쭉 살펴봤는데요', cap(sf(2) || 179, d), d)
        ])
      };
    }

    // ── scene-57: 종합 — AI의 보이지 않는 영향 ──────────────────────────
    case 'scene-57': {
      const bg57 = kenBurnsBackground('assets/anthropic.svg', { direction: 'left', distance: 25 });
      return {
        background: bg57,
        stack_root: sceneRoot(24, [
          kicker('오늘의 통찰', 0, d),
          headline('AI: 보이지 않는 곳에서 힘을 쓴다', 'xl', ['보이지 않는'], 15, d),
          imageAsset('assets/anthropic.svg', 'rounded', 'Mythos — 사이버 보안', sf(2) || 156, d),
          footerCaption('사이버 보안에서 사람을 능가', cap(sf(3) || 206, d), d)
        ])
      };
    }

    // ── scene-58: VibeVoice 60분 회의 기억 ───────────────────────────────
    case 'scene-58': {
      const bg58 = kenBurnsBackground('icons/vibe-news-0330/voice.svg', { direction: 'left', distance: 20 });
      return {
        background: bg58,
        stack_root: sceneRoot(24, [
          kicker('AI가 기억하고 정리한다', 0, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 30, y: 80, width: 540, height: 140, rx: 12, fill: 'none', stroke: '#334155', strokeWidth: 1.5 }, staggerIndex: 0 },
            { tag: 'rect', attrs: { x: 30, y: 80, width: 540, height: 140, rx: 12, fill: '#1e293b', fillOpacity: 0.8 }, staggerIndex: 1 },
            { tag: 'text', attrs: { x: 300, y: 135, textAnchor: 'middle', fontSize: 28, fill: '#22d3ee' }, text: '회의실 60분', staggerIndex: 2 },
            { tag: 'text', attrs: { x: 300, y: 170, textAnchor: 'middle', fontSize: 24, fill: '#94a3b8' }, text: 'AI가 통째로 기억 + 정리', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 300, y: 210, textAnchor: 'middle', fontSize: 22, fill: '#64748b' }, text: 'VibeVoice ASR', staggerIndex: 4 }
          ], false, true, sf(2) || 161, d),
          footerCaption('공격·방어 모두에서 AI 능력 확장', cap(sf(3) || 267, d), d)
        ])
      };
    }

    // ── scene-59: Deep-Live-Cam 신뢰 문제 ────────────────────────────────
    case 'scene-59': {
      return {
        stack_root: sceneRoot(24, [
          kicker('시각적 신뢰의 붕괴', 0, d),
          imageAsset('icons/vibe-news-0330/deep-live-cam.svg', 'rounded', 'Deep-Live-Cam', 15, d),
          headline('눈으로 본 것 = 믿을 수 없다', 'xl', ['믿을 수 없다'], sf(1) || 98, d),
          footerCaption('예전 AI: 만들어주는 도구였음', cap(sf(2) || 223, d), d)
        ])
      };
    }

    // ── scene-60: AI 역할 변화 — 지켜주고 기억해주고 ─────────────────────
    case 'scene-60': {
      const bg60 = kenBurnsBackground('assets/characters/smurf/thinking.png', { direction: 'right', distance: 20 });
      return {
        background: bg60,
        stack_root: sceneRoot(28, [
          kicker('AI 역할의 전환', 0, d),
          splitRevealCard('이전 AI', '지금 AI', ['글 쓰기', '그림 그리기', '코드 짜기'], ['지켜주기', '기억해주기', '판단해주기'], 15, d),
          footerCaption('눈에 보이는 → 눈에 보이지 않는 영역', cap(sf(1) || 86, d), d)
        ])
      };
    }

    // ── scene-61: 보안·기억·진짜가짜 구별 ───────────────────────────────
    case 'scene-61': {
      return {
        stack_root: sceneRoot(24, [
          kicker('AI의 새로운 역할', 0, d),
          svgGraphic('0 0 600 300', 1100, 480, [
            { tag: 'rect', attrs: { x: 40, y: 70, width: 150, height: 160, rx: 12, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 0 },
            { tag: 'text', attrs: { x: 115, y: 148, textAnchor: 'middle', fontSize: 32, fill: '#22d3ee' }, text: '🛡', staggerIndex: 1 },
            { tag: 'text', attrs: { x: 115, y: 210, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '보안', staggerIndex: 2 },
            { tag: 'rect', attrs: { x: 225, y: 70, width: 150, height: 160, rx: 12, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 3 },
            { tag: 'text', attrs: { x: 300, y: 148, textAnchor: 'middle', fontSize: 32, fill: '#22d3ee' }, text: '🧠', staggerIndex: 4 },
            { tag: 'text', attrs: { x: 300, y: 210, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '기억', staggerIndex: 5 },
            { tag: 'rect', attrs: { x: 410, y: 70, width: 150, height: 160, rx: 12, fill: 'none', stroke: '#22d3ee', strokeWidth: 2 }, themeColor: 'accent', staggerIndex: 6 },
            { tag: 'text', attrs: { x: 485, y: 148, textAnchor: 'middle', fontSize: 32, fill: '#22d3ee' }, text: '🔎', staggerIndex: 7 },
            { tag: 'text', attrs: { x: 485, y: 210, textAnchor: 'middle', fontSize: 22, fill: '#94a3b8' }, text: '진위 판별', staggerIndex: 8 }
          ], true, true, 15, d),
          footerCaption('생각해볼 지점이 있어요', cap(sf(1) || 128, d), d)
        ])
      };
    }

    // ── scene-62: 눈에 보이는 일 대신할 때 ──────────────────────────────
    case 'scene-62': {
      return {
        stack_root: sceneRoot(24, [
          kicker('제어 가능성', 0, d),
          headline('눈에 보이는 AI는 제어 가능', 'xl', ['제어 가능'], 15, d),
          footerCaption('마음에 안 들면 안 쓰거나 다시 요청', cap(sf(2) || 176, d), d)
        ])
      };
    }

    // ── scene-63: 보이지 않는 판단 = 신뢰 문제 ──────────────────────────
    case 'scene-63': {
      const bg = kenBurnsBackground('assets/anthropic.svg', { direction: 'right', distance: 15 });
      return {
        background: bg,
        stack_root: sceneRoot(28, [
          kicker('핵심 질문', 0, d),
          markerHighlight('결국 이건 신뢰의 문제', 15, d),
          footerCaption('보이지 않는 AI 판단 — 믿어야 할까 의심해야 할까', cap(sf(2) || 237, d), d)
        ])
      };
    }

    // ── scene-64: 기술 속도 vs 신뢰 쌓는 속도 ────────────────────────────
    case 'scene-64': {
      const bg64 = kenBurnsBackground('assets/characters/smurf/thinking.png', { direction: 'left', distance: 20 });
      return {
        background: bg64,
        stack_root: sceneRoot(28, [
          kicker('미래의 과제', 0, d),
          versusCard('기술 발전 속도', '신뢰 쌓는 속도', '빠르게 가속', '천천히 쌓임', 15, d),
          footerCaption('AI가 더 똑똑해질수록 신뢰 질문도 커짐', cap(sf(1) || 144, d), d)
        ])
      };
    }

    // ── scene-65: 간극을 좁혀가는 과제 ──────────────────────────────────
    case 'scene-65': {
      return {
        stack_root: sceneRoot(24, [
          kicker('앞으로의 과제', 0, d),
          quoteText('"기술과 신뢰의 간극 — 어떻게 좁혀갈까"', 15, d)
        ])
      };
    }

    // ── scene-66: 오늘의 바이브 뉴스 끝 (짧은 씬) ────────────────────────
    case 'scene-66': {
      return {
        stack_root: sceneRoot(20, [
          kicker('바이브 뉴스', 0, d),
          headline('오늘 여기까지', 'xl', [], 15, d)
        ])
      };
    }

    // ── scene-67: 아웃트로 ────────────────────────────────────────────────
    case 'scene-67': {
      const bg = kenBurnsBackground('assets/characters/smurf/thumbsUp.png', { direction: 'left', distance: 20 });
      return {
        background: bg,
        stack_root: sceneRoot(28, [
          kicker('바이브랩스', 0, d),
          headline('매일 저녁 AI 세상 정리', 'xl', ['AI 세상'], 15, d),
          bulletList(['구독과 알림 설정', '바이브가 충만한 하루'], 'check', sf(1) || 94, d),
          footerCaption('내일 또 만나요 감사합니다', cap(sf(3) || 264, d), d)
        ])
      };
    }

    default:
      return {
        stack_root: sceneRoot(24, [
          kicker('바이브 뉴스', 0, d),
          headline(scene.narration ? scene.narration.slice(0, 20) : '...', 'xl', [], 15, d)
        ])
      };
  }
}

// ── Apply layouts ────────────────────────────────────────────────────────────

let applied = 0;
const updated = scenes.map(scene => {
  const layout = buildLayout(scene);
  const newScene = {
    ...scene,
    duration_frames: Math.round((scene.end_ms - scene.start_ms) / 1000 * 30),
    layout_family: layout.background ? 'spotlight-case' : 'hero-center',
    transition: { type: 'none', durationFrames: 0 }
  };

  if (layout.background) {
    newScene.background = layout.background;
  } else {
    delete newScene.background;
  }

  if (layout.stack_root) {
    newScene.stack_root = layout.stack_root;
    applied++;
  }

  return newScene;
});

// ── Validate before write ──────────────────────────────────────────────────────

const VALID_PRESETS = new Set([
  "fadeUp", "popNumber", "popBadge", "staggerChildren", "fadeIn",
  "drawConnector", "wipeBar", "slideSplit", "scaleIn", "blurIn",
  "bounceUp", "rotateIn", "zoomBlur", "dropIn", "flipUp",
  "expandCenter", "slideReveal", "swoopLeft", "swoopRight",
  "elasticPop", "riseRotate", "glowIn", "splitReveal",
  "shakeIn", "impactPop", "wipeRight", "stampIn", "revealUp",
]);

let presetWarnings = 0;
function validateNode(node, sceneId) {
  if (node.motion?.preset && !VALID_PRESETS.has(node.motion.preset)) {
    console.warn(`  ⚠ Unknown preset "${node.motion.preset}" in ${sceneId}/${node.id} → fixed to "fadeUp"`);
    node.motion.preset = "fadeUp";
    presetWarnings++;
  }
  if (node.children) node.children.forEach(c => validateNode(c, sceneId));
}
updated.forEach(s => { if (s.stack_root) validateNode(s.stack_root, s.id); });
if (presetWarnings > 0) console.log(`  ${presetWarnings} unknown presets fixed to fadeUp`);

// ── Atomic write (temp file → rename) ─────────────────────────────────────────

const tmpScenes = SCENES_PATH + '.tmp';
const tmpRender = RENDER_PROPS_PATH + '.tmp';

fs.writeFileSync(tmpScenes, JSON.stringify(updated, null, 2), 'utf8');
fs.renameSync(tmpScenes, SCENES_PATH);
console.log(`✅ scenes-v2.json 업데이트 완료 (${applied}/${scenes.length} 씬 레이아웃 적용)`);

// Sync render-props-v2.json
const renderProps = JSON.parse(fs.readFileSync(RENDER_PROPS_PATH, 'utf8'));
renderProps.scenes = updated;
fs.writeFileSync(tmpRender, JSON.stringify(renderProps, null, 2), 'utf8');
fs.renameSync(tmpRender, RENDER_PROPS_PATH);
console.log(`✅ render-props-v2.json 동기화 완료`);

// Stats
const withBg = updated.filter(s => s.background).length;
const withSvg = updated.filter(s => {
  const r = s.stack_root;
  if (!r) return false;
  const str = JSON.stringify(r);
  return str.includes('"SvgGraphic"');
}).length;
const withImg = updated.filter(s => {
  const r = s.stack_root;
  if (!r) return false;
  const str = JSON.stringify(r);
  return str.includes('"ImageAsset"');
}).length;

console.log(`\n📊 통계:`);
console.log(`  배경 씬: ${withBg}/${updated.length} (${Math.round(withBg/updated.length*100)}%)`);
console.log(`  SvgGraphic 포함: ${withSvg} 씬`);
console.log(`  ImageAsset 포함: ${withImg} 씬`);
