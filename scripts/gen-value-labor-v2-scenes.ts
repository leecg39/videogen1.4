#!/usr/bin/env npx tsx
/**
 * value-labor-v2 프로젝트의 scenes-v2.json 생성 스크립트
 * 가치 노동 — 이반 일리치 철학 x AI 시대 개발자 생존 전략 (~11.5분, 50비트)
 */
import * as fs from "fs";
import * as path from "path";

const projectId = "value-labor-v2";
const dataDir = path.join("data", projectId);
const audioSrc = "가치 노동.mp3";

// Load beats & SRT
const beats = JSON.parse(fs.readFileSync(path.join(dataDir, "beats.json"), "utf-8"));
const srtRaw = fs.readFileSync(path.join("input", "가치 노동.srt"), "utf-8");

// Parse SRT
interface SRTEntry { index: number; startMs: number; endMs: number; text: string; }
function parseSRT(content: string): SRTEntry[] {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/).filter(b => b.trim());
  return blocks.map(block => {
    const lines = block.split("\n").filter(l => l.trim());
    if (lines.length < 2) return null;
    const index = parseInt(lines[0]);
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) return null;
    const toMs = (t: string) => {
      const [h, m, rest] = t.split(":");
      const [s, ms] = rest.split(",");
      return +h * 3600000 + +m * 60000 + +s * 1000 + +ms;
    };
    return { index, startMs: toMs(timeMatch[1]), endMs: toMs(timeMatch[2]), text: lines.slice(2).join(" ") };
  }).filter(Boolean) as SRTEntry[];
}

const srtEntries = parseSRT(srtRaw);

// Map SRT entries to beats by time overlap
function getSubtitles(beat: any): any[] {
  return srtEntries
    .filter(e => e.startMs < beat.end_ms && e.endMs > beat.start_ms)
    .map(e => ({
      startTime: Math.max(0, (e.startMs - beat.start_ms) / 1000),
      endTime: (Math.min(e.endMs, beat.end_ms) - beat.start_ms) / 1000,
      text: e.text,
    }));
}

// Helper
let _id = 0;
function uid(p: string) { return `${p}-${++_id}`; }
function resetId() { _id = 0; }

// enterAt stagger helper
function stagger(sceneFrames: number, count: number, startPct = 0.0, endPct = 0.7): number[] {
  const start = Math.round(sceneFrames * startPct);
  const end = Math.round(sceneFrames * endPct);
  const step = count > 1 ? Math.round((end - start) / (count - 1)) : 0;
  return Array.from({ length: count }, (_, i) => start + step * i);
}

// Scene builder types
type N = any;
function node(type: string, data: any = {}, extra: any = {}): N {
  return { id: uid(type.toLowerCase()), type, ...data, ...extra };
}

function sceneRoot(gap: number, padding: number, children: N[]): N {
  return { id: "root", type: "SceneRoot", layout: { gap, padding }, children };
}

// 모션 프리셋 순환
const headlinePresets = ["fadeUp", "zoomBlur", "flipUp", "riseRotate", "blurIn", "swoopLeft"];
const badgePresets = ["popBadge", "elasticPop", "expandCenter", "dropIn", "rotateIn"];
const bodyPresets = ["fadeUp", "slideReveal", "swoopLeft", "riseRotate", "blurIn"];
const iconPresets = ["popBadge", "elasticPop", "expandCenter", "rotateIn", "glowIn", "zoomBlur"];
const cardPresets = ["fadeUp", "swoopLeft", "swoopRight", "flipUp", "riseRotate", "expandCenter"];
const framePresets = ["scaleIn", "expandCenter", "blurIn", "rotateIn", "zoomBlur"];
let _presetCounters: Record<string, number> = {};
function nextPreset(pool: string[], key: string): string {
  if (!_presetCounters[key]) _presetCounters[key] = 0;
  const p = pool[_presetCounters[key]! % pool.length];
  _presetCounters[key]!++;
  return p;
}

function headline(text: string, size: string, emphasis: string[], enterAt: number): N {
  return node("Headline", { data: { text, size, emphasis } }, { motion: { preset: nextPreset(headlinePresets, "h"), enterAt, duration: 15 } });
}

function kicker(text: string, enterAt: number): N {
  return node("Kicker", { data: { text } }, { motion: { preset: "slideReveal", enterAt, duration: 12 } });
}

function badge(text: string, enterAt: number, variant = "accent"): N {
  return node("Badge", { data: { text }, variant }, { motion: { preset: nextPreset(badgePresets, "b"), enterAt, duration: 12 } });
}

function bodyText(text: string, enterAt: number): N {
  return node("BodyText", { data: { text } }, { motion: { preset: nextPreset(bodyPresets, "bt"), enterAt, duration: 12 } });
}

function icon(name: string, size: number, enterAt: number, glow = false, emphasis?: string): N {
  return node("Icon", { data: { name, size, ...(glow ? { glow: true } : {}), ...(emphasis ? { emphasis } : {}) } }, { motion: { preset: nextPreset(iconPresets, "i"), enterAt, duration: 12 } });
}

function divider(enterAt: number): N {
  return node("Divider", {}, { motion: { preset: "splitReveal", enterAt, duration: 14 } });
}

function statNumber(value: string, label: string, enterAt: number): N {
  return node("StatNumber", { data: { value, label } }, { motion: { preset: "expandCenter", enterAt, duration: 20 } });
}

function statCard(value: string, label: string, enterAt: number, variant = "glass"): N {
  return node("StatCard", { data: { value, label }, variant, style: { maxWidth: 300 } }, { motion: { preset: nextPreset(cardPresets, "sc"), enterAt, duration: 18 } });
}

function iconCard(iconName: string, title: string, desc: string, enterAt: number): N {
  return node("IconCard", { data: { icon: iconName, title, description: desc } }, { style: { maxWidth: 280 }, motion: { preset: nextPreset(cardPresets, "ic"), enterAt, duration: 15 } });
}

function processStep(step: number, title: string, desc: string, enterAt: number): N {
  return node("ProcessStepCard", { data: { step, title, description: desc } }, { style: { maxWidth: 320 }, motion: { preset: nextPreset(cardPresets, "ps"), enterAt, duration: 15 } });
}

function insightTile(index: string, title: string, enterAt: number): N {
  return node("InsightTile", { data: { index, title } }, { layout: { maxWidth: 700 }, motion: { preset: "expandCenter", enterAt, duration: 18 } });
}

function imageAsset(src: string, alt: string, enterAt: number, maxH = 120): N {
  return node("ImageAsset", { data: { src, alt, objectFit: "contain", maxHeight: maxH } }, { style: { maxWidth: maxH + 40 }, motion: { preset: "zoomBlur", enterAt, duration: 15 } });
}

function frameBox(children: N[], enterAt: number, extra: any = {}): N {
  return node("FrameBox", { layout: { gap: 12, padding: 24, ...extra }, style: { radius: 16, ...(extra.maxWidth ? { maxWidth: extra.maxWidth } : {}) } }, { motion: { preset: nextPreset(framePresets, "fb"), enterAt, duration: 18 }, children });
}

function stack(dir: string, children: N[], gap = 20, extra: any = {}): N {
  return node("Stack", { layout: { direction: dir, gap, align: "center", justify: "center", ...extra } }, { children });
}

function split(children: N[], ratio = [1, 1], gap = 20): N {
  return node("Split", { layout: { ratio, gap, justify: "center", align: "center" }, style: { maxWidth: 900 } }, { children });
}

function footer(text: string, enterAt: number): N {
  return node("FooterCaption", { data: { text } }, { motion: { preset: "fadeUp", enterAt, duration: 12 } });
}

function bulletList(items: string[], enterAt: number): N {
  return node("BulletList", { data: { items } }, { style: { maxWidth: 700 }, motion: { preset: "fadeUp", enterAt, duration: 18 } });
}

function quoteText(text: string, enterAt: number): N {
  return node("QuoteText", { data: { text } }, { motion: { preset: "fadeIn", enterAt, duration: 18 } });
}

function compareBars(items: { label: string; value: number; subtitle?: string; icon?: string }[], unit: string, enterAt: number): N {
  return node("CompareBars", { data: { items, unit }, style: { maxWidth: 800 } }, { motion: { enterAt, duration: 25 } });
}

function terminalBlock(lines: string[], enterAt: number): N {
  return node("TerminalBlock", { data: { lines }, style: { maxWidth: 700 } }, { motion: { preset: "fadeUp", enterAt, duration: 18 } });
}

function flowDiagram(items: { label: string; icon?: string }[], enterAt: number): N {
  return node("FlowDiagram", { data: { items }, style: { maxWidth: 800 } }, { motion: { preset: "fadeUp", enterAt, duration: 20 } });
}

function timelineStepper(steps: { title: string; description?: string }[], enterAt: number): N {
  return node("TimelineStepper", { data: { steps }, style: { maxWidth: 800 } }, { motion: { preset: "fadeUp", enterAt, duration: 25 } });
}

function warningCard(title: string, description: string, enterAt: number): N {
  return node("WarningCard", { data: { title, description } }, { style: { maxWidth: 700 }, motion: { preset: "dropIn", enterAt, duration: 18 } });
}

// v2 Diagram helpers
function vennDiagram(sets: { label: string; color?: string }[], intersectionLabel: string, enterAt: number): N {
  return node("VennDiagram", { data: { sets, intersectionLabel } }, { style: { maxWidth: 500 }, motion: { enterAt, duration: 25 } });
}

function funnelDiagram(stages: { label: string; value?: number; subtitle?: string }[], enterAt: number): N {
  return node("FunnelDiagram", { data: { stages } }, { style: { maxWidth: 600 }, motion: { enterAt, duration: 25 } });
}

function pyramidDiagram(layers: { label: string; description?: string }[], enterAt: number): N {
  return node("PyramidDiagram", { data: { layers } }, { style: { maxWidth: 540 }, motion: { enterAt, duration: 25 } });
}

function matrixQuadrant(
  xAxis: { low: string; high: string },
  yAxis: { low: string; high: string },
  quadrants: { label: string; items?: string[]; highlight?: boolean }[],
  enterAt: number
): N {
  return node("MatrixQuadrant", { data: { xAxis, yAxis, quadrants } }, { style: { maxWidth: 560 }, motion: { enterAt, duration: 25 } });
}

function svgGraphic(viewBox: string, width: number, height: number, elements: any[], enterAt: number, glow = false): N {
  return node("SvgGraphic", { data: { viewBox, width, height, elements, staggerDelay: 5, glow } }, { motion: { enterAt, duration: 20 } });
}

// Build each scene
function buildScene(beat: any): any {
  resetId();
  const bi = beat.beat_index;
  const dur = beat.end_frame - beat.start_frame;
  const subs = getSubtitles(beat);

  const base = {
    id: `scene-${bi}`,
    project_id: projectId,
    beat_index: bi,
    start_ms: beat.start_ms,
    end_ms: beat.end_ms,
    duration_frames: dur,
    components: [],
    copy_layers: {
      kicker: null,
      headline: beat.text.split(/[.?!]/)[0],
      supporting: null,
      footer_caption: null,
    },
    motion: {
      entrance: "fadeUp",
      emphasis: null,
      exit: null,
      duration_ms: beat.end_ms - beat.start_ms,
    },
    assets: { svg_icons: [], chart_type: null, chart_data: null },
    chunk_metadata: {
      intent: beat.semantic.intent,
      tone: beat.semantic.tone,
      evidence_type: beat.semantic.evidence_type,
      emphasis_tokens: beat.semantic.emphasis_tokens,
      density: beat.semantic.density,
      beat_count: 1,
    },
    subtitles: subs,
    narration: beat.text,
  };

  let layout = "stacked-vertical";
  let root: N;

  switch (bi) {
    // -------------------------------------------------------------------------
    // 0-4: 도입 — 하청 개발사 에피소드
    // -------------------------------------------------------------------------

    case 0: // "오늘 커뮤니티에서 읽은 에피소드 하나를 들려드릴게요"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("TODAY'S STORY", 0),
        headline("하청 개발사의 충격적인 납품", "xl", ["하청 개발사", "충격적인"], 8),
        divider(Math.round(dur * 0.35)),
        bodyText("어떤 회사가 복잡한 사내 시스템 개발을 의뢰했습니다", Math.round(dur * 0.45)),
        footer("견적과 데모를 요청했는데...", Math.round(dur * 0.72)),
      ]);
      break;

    case 1: // "일주일 만에 거의 완성된 제품"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        badge("SURPRISE", 0, "accent"),
        headline("일주일 만에 완성된 제품", "xl", ["일주일"], 8),
        stack("row", [
          statCard("1주일", "납품 기간", Math.round(dur * 0.3)),
          statCard("몇 달", "일반 소요 기간", Math.round(dur * 0.5)),
        ], 32),
        footer("때깔도, 문구 하나하나도 세부 UX도 완벽했다", Math.round(dur * 0.75)),
      ]);
      break;

    case 2: // "반응이 둘로 갈렸어요"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("TWO REACTIONS", 0),
        headline("이걸 본 사람들의 반응이 갈렸어요", "lg", ["반응이 둘로"], 8),
        split([
          frameBox([
            icon("dollar-sign", 44, Math.round(dur * 0.25)),
            bodyText("돈을 깎아야 하는 거 아닐까?", Math.round(dur * 0.35)),
            badge("가격 = 시간", Math.round(dur * 0.5)),
          ], Math.round(dur * 0.2), { maxWidth: 380 }),
          frameBox([
            icon("award", 44, Math.round(dur * 0.55), true),
            bodyText("저게 진짜 실력 아닌가?", Math.round(dur * 0.65)),
            badge("가치 = 결과", Math.round(dur * 0.78), "accent"),
          ], Math.round(dur * 0.5), { maxWidth: 380 }),
        ]),
      ]);
      break;

    case 3: // "여러분은 어느 쪽이세요?"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("YOUR ANSWER?", 0),
        headline("여러분은 어느 쪽이세요?", "xl", ["어느 쪽"], 8),
        divider(Math.round(dur * 0.3)),
        svgGraphic("0 0 360 200", 360, 200, [
          // 저울 그래픽
          { tag: "line", staggerIndex: 0, attrs: { x1: 180, y1: 20, x2: 180, y2: 110, stroke: "rgba(255,255,255,0.4)", "stroke-width": 3 } },
          { tag: "line", staggerIndex: 1, attrs: { x1: 60, y1: 110, x2: 300, y2: 110, stroke: "rgba(255,255,255,0.4)", "stroke-width": 3 } },
          { tag: "circle", staggerIndex: 2, attrs: { cx: 180, cy: 20, r: 6 }, themeColor: "accentBright" },
          // 왼쪽 접시 (낮은 단가)
          { tag: "line", staggerIndex: 3, attrs: { x1: 60, y1: 110, x2: 60, y2: 150, stroke: "rgba(255,255,255,0.3)", "stroke-width": 2 } },
          { tag: "ellipse", staggerIndex: 4, attrs: { cx: 60, cy: 155, rx: 45, ry: 12, fill: "rgba(255,255,255,0.1)", stroke: "rgba(255,255,255,0.3)", "stroke-width": 1.5 } },
          { tag: "text", staggerIndex: 5, attrs: { x: 60, y: 155, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FFFFFF", "font-size": 13, "font-weight": 700 }, text: "단가 ↓" },
          // 오른쪽 접시 (실력 인정)
          { tag: "line", staggerIndex: 3, attrs: { x1: 300, y1: 110, x2: 300, y2: 150, stroke: "rgba(255,255,255,0.3)", "stroke-width": 2 } },
          { tag: "ellipse", staggerIndex: 4, attrs: { cx: 300, cy: 155, rx: 45, ry: 12 }, themeColor: "surface" },
          { tag: "ellipse", staggerIndex: 4, attrs: { cx: 300, cy: 155, rx: 45, ry: 12, fill: "none" }, themeColor: "accentBright" },
          { tag: "text", staggerIndex: 5, attrs: { x: 300, y: 155, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 13, "font-weight": 700 }, themeColor: "accentBright", text: "실력 ↑" },
        ], Math.round(dur * 0.28), true),
        insightTile("?", "이 질문이 오늘 이야기의 출발점입니다", Math.round(dur * 0.7)),
      ]);
      break;

    case 4: // "50년 전 철학자 + 2026년 개발자 생존 전략"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("TODAY'S TOPIC", 0),
        headline("50년 전 질문이 지금과 맞닿았다", "lg", ["50년 전", "2026년"], 8),
        divider(Math.round(dur * 0.3)),
        stack("row", [
          frameBox([
            icon("book-open", 44, Math.round(dur * 0.38)),
            bodyText("1973년 철학자의 질문", Math.round(dur * 0.48)),
          ], Math.round(dur * 0.35), { maxWidth: 340 }),
          icon("arrow-right", 36, Math.round(dur * 0.55)),
          frameBox([
            icon("cpu", 44, Math.round(dur * 0.62), true),
            bodyText("2026년 개발자 생존 전략", Math.round(dur * 0.72)),
          ], Math.round(dur * 0.6), { maxWidth: 340 }),
        ], 20),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 5-6: 댓글 반응
    // -------------------------------------------------------------------------

    case 5: // "짧은 공기와 낮은 단가 — 새로운 기준"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("COMMUNITY VOICE", 0),
        headline("현실적인 댓글 반응", "lg", ["현실적"], 8),
        quoteText("\"짧은 공기와 낮은 단가\n이게 업종 불문 새로운 기준이 될 겁니다\"", Math.round(dur * 0.25)),
        insightTile("💬", "지식 노동 전반에서 일어나는 변화", Math.round(dur * 0.68)),
      ]);
      break;

    case 6: // "AI로 이런 것도 하는데 스케줄러 모듈 하나 못하냐고"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("CLIENT PRESSURE", 0),
        headline("고객이 더 잘 안다고 합니다", "lg", ["고객이 더 잘"], 8),
        quoteText("\"AI로 이런 것도 하는데\n스케줄러 관리 모듈 하나 만들지 못하냐고\"", Math.round(dur * 0.22)),
        divider(Math.round(dur * 0.6)),
        bodyText("이건 더 이상 남의 이야기가 아닙니다", Math.round(dur * 0.7)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 7-10: 단가 붕괴 현실
    // -------------------------------------------------------------------------

    case 7: // "단가 기준은 시간X인원이었다"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("OLD FORMULA", 0),
        headline("개발 단가의 공식: 시간 × 인원", "lg", ["시간X인원"], 8),
        svgGraphic("0 0 500 200", 500, 200, [
          // 시간 박스
          { tag: "rect", staggerIndex: 0, attrs: { x: 30, y: 60, width: 130, height: 80, rx: 12, fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.2)", "stroke-width": 1.5 } },
          { tag: "text", staggerIndex: 1, attrs: { x: 95, y: 100, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FFFFFF", "font-size": 22, "font-weight": 800 }, text: "시간" },
          // ×
          { tag: "text", staggerIndex: 2, attrs: { x: 200, y: 100, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 28, "font-weight": 900 }, themeColor: "accentBright", text: "×" },
          // 인원 박스
          { tag: "rect", staggerIndex: 3, attrs: { x: 240, y: 60, width: 130, height: 80, rx: 12, fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.2)", "stroke-width": 1.5 } },
          { tag: "text", staggerIndex: 4, attrs: { x: 305, y: 100, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FFFFFF", "font-size": 22, "font-weight": 800 }, text: "인원" },
          // = 비용
          { tag: "text", staggerIndex: 5, attrs: { x: 410, y: 100, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 28, "font-weight": 900 }, themeColor: "accentBright", text: "= 비용" },
        ], Math.round(dur * 0.25)),
        bodyText("한 달 걸리는 프로젝트에 개발자 3명 → 비용이 산정됐죠", Math.round(dur * 0.65)),
      ]);
      break;

    case 8: // "AI가 이 공식을 박살냈어요" — CompareBars with icons
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("AI DISRUPTION", 0),
        headline("AI가 이 공식을 박살냈어요", "xl", ["공식을 박살", "AI"], 8),
        compareBars([
          { label: "기존: 한 달 × 3명", value: 100, subtitle: "표준 단가 산정", icon: "clock" },
          { label: "AI 시대: 일주일 × 1명", value: 25, subtitle: "4분의 1 비용 요구", icon: "zap" },
        ], "%", Math.round(dur * 0.28)),
        insightTile("!", "발주자: 비용도 4분의 1이어야 하는 거 아니야?", Math.round(dur * 0.75)),
      ]);
      break;

    case 9: // "4분의 1 요구 — 지식 노동 전체에서" — FunnelDiagram
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("DOMINO EFFECT", 0),
        headline("지식 노동 전체로 번지는 현상", "lg", ["지식 노동", "모든 분야"], 8),
        funnelDiagram([
          { label: "IT 개발", value: 100, subtitle: "단가 붕괴 진원지" },
          { label: "디자인 · 번역", value: 80, subtitle: "AI 자동화 침투" },
          { label: "콘텐츠 제작", value: 65, subtitle: "생성 AI 직격" },
          { label: "모든 지식 노동", value: 50, subtitle: "지금 진행 중" },
        ], Math.round(dur * 0.2)),
        footer("비용도 4분의 1이어야 한다는 논리", Math.round(dur * 0.8)),
      ]);
      break;

    case 10: // "불안 — 나 이제 필요 없어지는 거 아닐까"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("THE FEAR", 0),
        headline("나 이제 필요 없어지는 거 아닐까?", "xl", ["불안", "필요 없어지는"], 8),
        icon("alert-triangle", 64, Math.round(dur * 0.3), true, "pulse"),
        divider(Math.round(dur * 0.5)),
        bodyText("이 불안 충분히 이해합니다. 그런데 오늘은 다른 각도로 보겠습니다", Math.round(dur * 0.6)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 11-12: 이반 일리치 소개
    // -------------------------------------------------------------------------

    case 11: // "1973년 이반 일리치 — Tools for Conviviality"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("1973", 0, "accent"),
        headline("이반 일리치 — Ivan Illich", "xl", ["이반 일리치"], 8),
        divider(Math.round(dur * 0.3)),
        stack("row", [
          frameBox([
            icon("book-open", 48, Math.round(dur * 0.38)),
            bodyText("성장을 멈춰라", Math.round(dur * 0.48)),
            badge("국내 번역본", Math.round(dur * 0.58)),
          ], Math.round(dur * 0.35), { maxWidth: 340 }),
          frameBox([
            icon("globe", 48, Math.round(dur * 0.62), true),
            bodyText("Tools for Conviviality", Math.round(dur * 0.72)),
            badge("원제", Math.round(dur * 0.82)),
          ], Math.round(dur * 0.6), { maxWidth: 340 }),
        ], 20),
      ]);
      break;

    case 12: // "가톨릭 사제 + 노동을 두 가지로 나눈다"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("IVAN ILLICH", 0),
        headline("인간의 자율성을 빼앗는 제도를 파고든 철학자", "lg", ["자율성", "제도"], 8),
        bulletList([
          "가톨릭 사제이자 철학자 (크로아티아계 오스트리아)",
          "현대 산업사회의 제도가 인간을 어떻게 소외시키는가",
          "핵심 주장: 노동을 두 가지로 나눈다",
        ], Math.round(dur * 0.22)),
        insightTile("핵심", "임금 노동 vs 가치 노동", Math.round(dur * 0.72)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 13-16: 임금 노동 vs 가치 노동 (핵심 이분법)
    // -------------------------------------------------------------------------

    case 13: // VennDiagram — 임금노동 vs 가치노동
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("ILLICH'S FRAMEWORK", 0),
        headline("노동의 두 가지 세계", "lg", ["임금 노동", "가치 노동"], 8),
        vennDiagram([
          { label: "임금 노동", color: "#FF6B6B" },
          { label: "가치 노동", color: "#4ECDC4" },
        ], "삶의\n가치", Math.round(dur * 0.28)),
        stack("row", [
          bodyText("시장이 가격을 매기는 일", Math.round(dur * 0.62)),
          bodyText("vs", Math.round(dur * 0.68)),
          bodyText("삶의 사용가치를 스스로 창출", Math.round(dur * 0.72)),
        ], 16),
      ]);
      break;

    case 14: // "vernacular activity — 토착적 활동"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("DEFINITION", 0),
        headline("Vernacular Activity", "xl", ["vernacular activity", "토착적 활동"], 8),
        quoteText("토착적 활동 — 시장이 가격을 매기지 않는\n자발적이고 자급적인 모든 활동", Math.round(dur * 0.25)),
        divider(Math.round(dur * 0.52)),
        bodyText("핵심은 두 가지입니다", Math.round(dur * 0.62)),
      ]);
      break;

    case 15: // "첫째 — 사용 가치의 회복 / 교환 가치 vs 사용 가치"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("KEY 1", 0),
        headline("사용 가치의 회복", "lg", ["사용 가치", "교환 가치"], 8),
        split([
          frameBox([
            icon("tag", 40, Math.round(dur * 0.2)),
            bodyText("교환 가치", Math.round(dur * 0.3)),
            bodyText("시장이 매기는 가격표", Math.round(dur * 0.4)),
            badge("임금 노동", Math.round(dur * 0.5)),
          ], Math.round(dur * 0.15), { maxWidth: 380 }),
          frameBox([
            icon("heart", 40, Math.round(dur * 0.55), true, "heartbeat"),
            bodyText("사용 가치", Math.round(dur * 0.65)),
            bodyText("내 삶에 직접 의미를 부여", Math.round(dur * 0.75)),
            badge("가치 노동", Math.round(dur * 0.82), "accent"),
          ], Math.round(dur * 0.5), { maxWidth: 380 }),
        ]),
      ]);
      break;

    case 16: // "둘째 — 주체성의 탈환 / 부품 vs 창조자"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("KEY 2", 0),
        headline("주체성의 탈환", "lg", ["주체성", "부품", "창조성"], 8),
        split([
          frameBox([
            icon("settings", 40, Math.round(dur * 0.2)),
            bodyText("시스템의 부품", Math.round(dur * 0.3)),
            bodyText("누군가의 목적을 위해 고용됨", Math.round(dur * 0.4)),
          ], Math.round(dur * 0.15), { maxWidth: 380 }),
          frameBox([
            icon("sparkles", 40, Math.round(dur * 0.55), true, "pulse"),
            bodyText("창조적 주체", Math.round(dur * 0.65)),
            bodyText("스스로 목적을 설정하고 창조성 발휘", Math.round(dur * 0.75)),
          ], Math.round(dur * 0.5), { maxWidth: 380 }),
        ]),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 17: 가치 노동 예시
    // -------------------------------------------------------------------------

    case 17: // "새벽 코딩, 오픈소스, 텃밭"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("EXAMPLES", 0),
        headline("가치 노동이란 이런 것들이에요", "lg", ["새벽 코딩", "오픈소스", "텃밭"], 8),
        stack("row", [
          iconCard("moon", "새벽 코딩", "아무도 시키지 않았는데 개발", Math.round(dur * 0.2)),
          iconCard("git-branch", "오픈소스 커밋", "순수하게 기여하고 싶어서", Math.round(dur * 0.35)),
          iconCard("leaf", "동네 텃밭", "삶의 사용가치를 직접 창출", Math.round(dur * 0.5)),
        ], 16),
        divider(Math.round(dur * 0.65)),
        insightTile("공통점", "누군가가 시켜서가 아니라 스스로 선택한 행위", Math.round(dur * 0.72)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 18-20: 그림자 노동
    // -------------------------------------------------------------------------

    case 18: // "그림자 노동 — 시스템이 시켜서 하는 일"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        badge("WARNING", 0),
        headline("그림자 노동이란?", "xl", ["그림자 노동", "시스템이 시켜서"], 8),
        divider(Math.round(dur * 0.28)),
        quoteText("돈을 못 받는 건 같은데\n내가 선택한 게 아니라 시스템이 시켜서 하는 일", Math.round(dur * 0.35)),
        footer("비슷해 보이지만 완전히 다른 것", Math.round(dur * 0.78)),
      ]);
      break;

    case 19: // VennDiagram — 가치노동 vs 그림자노동 + 셀프 계산대
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("SHADOW WORK", 0),
        headline("셀프 계산대 vs 새벽 코딩", "lg", ["셀프 계산대", "선택"], 8),
        vennDiagram([
          { label: "그림자 노동", color: "#FF6B6B" },
          { label: "가치 노동", color: "#4ECDC4" },
        ], "선택", Math.round(dur * 0.22)),
        stack("row", [
          frameBox([
            icon("credit-card", 32, Math.round(dur * 0.55)),
            bodyText("셀프 계산대", Math.round(dur * 0.62)),
            bodyText("은행 앱 직접 처리", Math.round(dur * 0.68)),
          ], Math.round(dur * 0.52), { maxWidth: 280 }),
          frameBox([
            icon("code", 32, Math.round(dur * 0.62), true),
            bodyText("새벽 코딩", Math.round(dur * 0.68)),
            bodyText("자발적 오픈소스 기여", Math.round(dur * 0.74)),
          ], Math.round(dur * 0.58), { maxWidth: 280 }),
        ], 20),
      ]);
      break;

    case 20: // "자발적 vs 시스템이 시켜서 — 이 구분이 맞아떨어진다"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("THE DIFFERENCE", 0),
        headline("한 단어: 선택", "xl", ["선택"], 8),
        divider(Math.round(dur * 0.3)),
        stack("row", [
          frameBox([
            icon("check-circle", 40, Math.round(dur * 0.38), true),
            bodyText("내가 스스로\n자발적으로 시작", Math.round(dur * 0.48)),
          ], Math.round(dur * 0.35), { maxWidth: 300 }),
          frameBox([
            icon("x-circle", 40, Math.round(dur * 0.55)),
            bodyText("시스템이 시켜서\n어쩔 수 없이", Math.round(dur * 0.65)),
          ], Math.round(dur * 0.52), { maxWidth: 300 }),
        ], 32),
        insightTile("50년 후", "이 구분이 지금 정확히 맞아떨어집니다", Math.round(dur * 0.82)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 21-24: 공생 conviviality
    // -------------------------------------------------------------------------

    case 21: // "공생 conviviality — 급진적 의미"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("CONVIVIALITY", 0, "accent"),
        headline("공생이란? 훨씬 더 급진적입니다", "lg", ["공생", "conviviality", "급진적"], 8),
        divider(Math.round(dur * 0.32)),
        bodyText("흔히 자연 보호나 평화로운 공동체를 떠올리지만...", Math.round(dur * 0.42)),
        quoteText("자율적이고 창조적인 상호작용\n인간과 도구의 주체적인 상호작용", Math.round(dur * 0.55)),
      ]);
      break;

    case 22: // "도구가 핵심 — 자율적 창조적 상호작용"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("TOOLS ARE KEY", 0),
        headline("여기서 도구가 핵심이에요", "lg", ["도구", "상호작용"], 8),
        icon("tool", 64, Math.round(dur * 0.28), true, "float"),
        divider(Math.round(dur * 0.45)),
        bodyText("인간과 도구의 관계가 공생인가, 지배인가", Math.round(dur * 0.55)),
      ]);
      break;

    case 23: // "산업적 도구 vs 바이브코딩 맹목적"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("INDUSTRIAL vs CONVIVIAL", 0),
        headline("도구가 나를 지배하는가, 내가 도구를 쓰는가", "lg", ["산업적 도구", "소외", "바이브 코딩"], 8),
        split([
          frameBox([
            icon("cpu", 44, Math.round(dur * 0.22)),
            bodyText("산업적 도구", Math.round(dur * 0.32)),
            bodyText("기계의 논리에 맞춰\n내가 움직인다", Math.round(dur * 0.42)),
            badge("소외", Math.round(dur * 0.52)),
          ], Math.round(dur * 0.2), { maxWidth: 370 }),
          frameBox([
            icon("alert-circle", 44, Math.round(dur * 0.58)),
            bodyText("바이브코딩 맹목적 추종", Math.round(dur * 0.68)),
            bodyText("내가 쓰는 게 아니라\n따라가는 것", Math.round(dur * 0.78)),
            badge("위험", Math.round(dur * 0.86)),
          ], Math.round(dur * 0.56), { maxWidth: 370 }),
        ]),
      ]);
      break;

    case 24: // "공생의 도구 — 통제권, 자율성, 기억해두세요"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("CONVIVIAL TOOL", 0),
        headline("공생의 도구는 정반대입니다", "xl", ["공생의 도구", "통제권", "자율성"], 8),
        divider(Math.round(dur * 0.28)),
        bulletList([
          "각 개인의 비전과 상상력을 실현하도록 돕는 도구",
          "인간이 통제권을 쥐고 자율성을 극대화",
          "나중에 아주 중요하게 쓰일 개념입니다",
        ], Math.round(dur * 0.38)),
        icon("shield", 48, Math.round(dur * 0.78), true, "shimmer"),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 25-31: 하청 개발사 재해석
    // -------------------------------------------------------------------------

    case 25: // "하청 개발사가 일주일에 가능했던 진짜 이유"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("BACK TO THE STORY", 0),
        headline("일주일 완납의 진짜 이유", "xl", ["진짜 이유", "AI 아닙니다"], 8),
        divider(Math.round(dur * 0.3)),
        quoteText("AI가 코드를 잘 짜줘서일까요?\n글쎄요. 아닙니다.", Math.round(dur * 0.4)),
        icon("search", 48, Math.round(dur * 0.7), true),
      ]);
      break;

    case 26: // "도메인 지식 + 축적된 이해 위에 AI를 얹은 것"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("REAL REASON", 0, "accent"),
        headline("축적된 이해 위에 AI를 얹었을 뿐", "lg", ["도메인", "축적된 이해", "AI를 얹은"], 8),
        timelineStepper([
          { title: "몇 년 간 사내 인프라 담당", description: "도메인을 속속들이 파악" },
          { title: "시스템 연결 관계 체감", description: "사용자가 무엇을 원하는지 이해" },
          { title: "그 위에 AI 활용", description: "축적된 이해 + AI = 일주일 완납" },
        ], Math.round(dur * 0.22)),
      ]);
      break;

    case 27: // "댓글 — 납품 가능한 레벨로 AI를 다루는 능력"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("COMMUNITY COMMENT", 0),
        headline("실력으로 인정해야 합니다", "lg", ["납품 가능한 레벨", "실력"], 8),
        quoteText("\"일주일 만에 납품 가능한 레벨로 AI를 다루고\n유지보수까지 가능한 레벨의 문서 정비를 끝냈다는 걸\n실력으로 인정해야 합니다\"", Math.round(dur * 0.22)),
        footer("그냥 보면 쉬워 보이는데 막상 해보면 쉽지 않아요", Math.round(dur * 0.8)),
      ]);
      break;

    case 28: // "락인 효과 — 다른 업체로 바꾸면?"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("LOCK-IN EFFECT", 0),
        headline("락인 효과로 작용한다", "xl", ["락인 효과", "한 달"], 8),
        quoteText("\"단가 안 맞는다고 다른 업체로 바꾸시면\n또 한 달 혹은 그 이상 걸리는 건 달라지지 않을 겁니다\"", Math.round(dur * 0.22)),
        insightTile("핵심", "그 차이가 바로 여러분의 해자입니다", Math.round(dur * 0.68)),
      ]);
      break;

    case 29: // "도메인 지식은 복사 안 됨 — 다시 처음부터"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("WHY LOCK-IN?", 0),
        headline("도메인 지식은 절대 복사가 안 됩니다", "lg", ["도메인 지식", "복사 안 됨"], 8),
        split([
          frameBox([
            icon("copy", 40, Math.round(dur * 0.22), true),
            bodyText("AI 도구", Math.round(dur * 0.32)),
            bodyText("누구든 동일하게 사용 가능", Math.round(dur * 0.42)),
            badge("복사 가능", Math.round(dur * 0.52)),
          ], Math.round(dur * 0.2), { maxWidth: 360 }),
          frameBox([
            icon("lock", 40, Math.round(dur * 0.57)),
            bodyText("도메인 지식", Math.round(dur * 0.67)),
            bodyText("다시 처음부터 업무 파악 필요", Math.round(dur * 0.77)),
            badge("복사 불가", Math.round(dur * 0.85)),
          ], Math.round(dur * 0.55), { maxWidth: 360 }),
        ]),
      ]);
      break;

    case 30: // "임금 노동 단가↓ vs 가치 노동(도메인 설계 역량)↑"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("ILLICH'S TRANSLATION", 0),
        headline("가격은 폭락, 가치는 폭등", "xl", ["임금 노동 폭락", "가치 노동 폭등"], 8),
        compareBars([
          { label: "임금 노동 단가 (시장 가격)", value: 20, subtitle: "AI 시대, 폭락 중", icon: "trending-down" },
          { label: "가치 노동 (도메인 설계 역량)", value: 95, subtitle: "vernacular activity, 폭등 중", icon: "trending-up" },
        ], "%", Math.round(dur * 0.25)),
        footer("눈에 보이는 가격은 떨어지고, 눈에 안 보이는 가치는 올라간다", Math.round(dur * 0.8)),
      ]);
      break;

    case 31: // "눈에 보이는 가격 ↓, 눈에 안 보이는 가치 ↑"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("PARADOX", 0),
        headline("가격은 ↓, 가치는 ↑", "xl", ["가격 하락", "가치 상승"], 8),
        svgGraphic("0 0 420 220", 420, 220, [
          // 가격 하락 화살표
          { tag: "text", staggerIndex: 0, attrs: { x: 100, y: 40, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FF6B6B", "font-size": 20, "font-weight": 700 }, text: "가격 (시장)" },
          { tag: "path", staggerIndex: 1, attrs: { d: "M100,70 L100,160 L80,145 M100,160 L120,145", stroke: "#FF6B6B", "stroke-width": 3, fill: "none", "stroke-linecap": "round" } },
          { tag: "text", staggerIndex: 2, attrs: { x: 100, y: 185, "text-anchor": "middle", fill: "#FF6B6B", "font-size": 28, "font-weight": 900 }, text: "↓ 폭락" },
          // 중앙 구분선
          { tag: "line", staggerIndex: 3, attrs: { x1: 210, y1: 30, x2: 210, y2: 190, stroke: "rgba(255,255,255,0.2)", "stroke-width": 2, "stroke-dasharray": "6,4" } },
          // 가치 상승 화살표
          { tag: "text", staggerIndex: 4, attrs: { x: 320, y: 185, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 20, "font-weight": 700 }, themeColor: "accentBright", text: "가치 (도메인)" },
          { tag: "path", staggerIndex: 5, attrs: { d: "M320,160 L320,70 L300,85 M320,70 L340,85", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, themeColor: "accentBright" },
          { tag: "text", staggerIndex: 6, attrs: { x: 320, y: 42, "text-anchor": "middle", "font-size": 28, "font-weight": 900 }, themeColor: "accentBright", text: "↑ 폭등" },
        ], Math.round(dur * 0.18), true),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 32-35: 한나 아렌트 삼분법
    // -------------------------------------------------------------------------

    case 32: // "한나 아렌트 — 노동/작업/행위 삼분법 (첫째: 노동)"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("HANNAH ARENDT", 0),
        headline("인간의 활동 세 가지", "lg", ["한나 아렌트", "인간의 조건", "반복"], 8),
        pyramidDiagram([
          { label: "행위 (Action)", description: "말과 행동으로 존재를 드러냄" },
          { label: "작업 (Work)", description: "세상에 내구성 있는 것을 남김" },
          { label: "노동 (Labor)", description: "생물학적 생존을 위한 반복" },
        ], Math.round(dur * 0.22)),
        footer("첫째, 노동 = 소비되고 사라지는 일, 매일 코드를 찍어내는 것", Math.round(dur * 0.78)),
      ]);
      break;

    case 33: // "작업(설계/아키텍처) + 행위(관계/신뢰)"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("WORK & ACTION", 0),
        headline("작업과 행위는 남습니다", "lg", ["작업", "설계", "행위", "신뢰"], 8),
        stack("row", [
          frameBox([
            icon("layers", 48, Math.round(dur * 0.2), true, "float"),
            bodyText("작업 (Work)", Math.round(dur * 0.3)),
            bodyText("설계 · 아키텍처 · 시스템", Math.round(dur * 0.4)),
            bodyText("한 번 만들면 절대 사라지지 않음", Math.round(dur * 0.5)),
          ], Math.round(dur * 0.18), { maxWidth: 360 }),
          frameBox([
            icon("users", 48, Math.round(dur * 0.55), true, "float"),
            bodyText("행위 (Action)", Math.round(dur * 0.65)),
            bodyText("고객과의 관계 · 팀 신뢰", Math.round(dur * 0.75)),
            bodyText("사람들 사이에 존재를 드러냄", Math.round(dur * 0.82)),
          ], Math.round(dur * 0.52), { maxWidth: 360 }),
        ], 20),
      ]);
      break;

    case 34: // "AI가 가져간 것 vs 못 가져가는 것" — MatrixQuadrant
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("AI vs HUMAN", 0),
        headline("AI가 가져간 것 vs 못 가져가는 것", "xl", ["AI가 가져간", "못 가져가는"], 8),
        matrixQuadrant(
          { low: "반복적", high: "창의적" },
          { low: "단기적", high: "장기적" },
          [
            { label: "AI 영역", items: ["보일러플레이트", "단순 구현", "스켈레톤"], highlight: false },
            { label: "인간+AI 협업", items: ["설계 검토", "코드 리뷰", "최적화"], highlight: false },
            { label: "자동화 위험", items: ["단순 번역", "서식 작업", "데이터 입력"], highlight: false },
            { label: "인간 고유 영역", items: ["도메인 판단", "고객 관계", "신뢰 구축"], highlight: true },
          ],
          Math.round(dur * 0.22)
        ),
      ]);
      break;

    case 35: // "설계 판단 + 신뢰 = 일리치의 가치 노동"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("SYNTHESIS", 0),
        headline("이 둘의 결합 = 가치 노동", "xl", ["설계 판단", "신뢰", "가치 노동"], 8),
        divider(Math.round(dur * 0.28)),
        stack("row", [
          frameBox([
            icon("git-merge", 40, Math.round(dur * 0.35), true),
            bodyText("설계를 왜 이렇게 해야 하는지\n판단하는 것 (작업)", Math.round(dur * 0.45)),
          ], Math.round(dur * 0.32), { maxWidth: 340 }),
          icon("plus", 28, Math.round(dur * 0.55)),
          frameBox([
            icon("handshake", 40, Math.round(dur * 0.62), true),
            bodyText("고객과 신뢰를 쌓고\n도메인 맥락을 이해하는 것 (행위)", Math.round(dur * 0.72)),
          ], Math.round(dur * 0.6), { maxWidth: 340 }),
        ], 16),
        insightTile("일리치", "이 결합을 가치 노동이라 불렀습니다", Math.round(dur * 0.88)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 36: 전략 소개
    // -------------------------------------------------------------------------

    case 36: // "세 가지 전략 소개"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("STRATEGY", 0),
        headline("단가가 무너지는 세상에서의 태도", "lg", ["뭘 해야", "세 가지"], 8),
        flowDiagram([
          { label: "단가 경쟁 거부", icon: "x-circle" },
          { label: "락인 효과 설계", icon: "lock" },
          { label: "가치 노동 축적", icon: "layers" },
        ], Math.round(dur * 0.28)),
        bodyText("일리치의 철학 + 현장 개발자 이야기를 합쳐 정리했습니다", Math.round(dur * 0.72)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 37: 전략1 — 단가 경쟁 거부
    // -------------------------------------------------------------------------

    case 37:
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("전략 1", 0, "accent"),
        headline("단가 경쟁을 거부하세요", "xl", ["단가 경쟁 거부", "5배의 밀도", "가치의 밀도"], 8),
        divider(Math.round(dur * 0.28)),
        quoteText("\"임금의 가격은 시장이 결정하지만\n가치의 밀도는 내가 만들어 나가는 것이다\"", Math.round(dur * 0.35)),
        stack("row", [
          frameBox([
            icon("trending-down", 36, Math.round(dur * 0.6)),
            bodyText("시간당 가격으로 싸우는 순간 지는 겁니다", Math.round(dur * 0.68)),
          ], Math.round(dur * 0.58), { maxWidth: 360 }),
          frameBox([
            icon("trending-up", 36, Math.round(dur * 0.72), true),
            bodyText("같은 돈 + 5배의 밀도를 밀어넣는다", Math.round(dur * 0.8)),
          ], Math.round(dur * 0.7), { maxWidth: 360 }),
        ], 20),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 38-39: 전략2 — 락인 효과 설계
    // -------------------------------------------------------------------------

    case 38: // "도메인 지식 + AI 오케스트레이션 = 해자"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("전략 2", 0, "accent"),
        headline("락인 효과를 설계하세요", "xl", ["락인 효과", "도메인 지식", "AI 오케스트레이션", "해자"], 8),
        stack("row", [
          iconCard("book", "도메인 지식", "여러분만의 고유 지식", Math.round(dur * 0.22)),
          iconCard("cpu", "AI 오케스트레이션", "고유한 AI 활용 방식", Math.round(dur * 0.38)),
          iconCard("shield", "해자(Moat)", "쉽게 넘어올 수 없는 영역", Math.round(dur * 0.54)),
        ], 16),
        insightTile("결합", "이 결합은 쉽게 복제되지 않습니다", Math.round(dur * 0.72)),
      ]);
      break;

    case 39: // "설계 능력 + 전체 시스템 맥락 = AI 출력 배치"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("HOW TO BUILD IT", 0),
        headline("어떻게 만들까요?", "lg", ["설계 능력", "무엇을 만들 것인가", "전체 시스템"], 8),
        bulletList([
          "설계를 디테일하게 할 수 있는 능력을 기르세요",
          "AI는 실행이 빠르지만 '무엇을 만들 것인가'는 결정 못합니다",
          "CI/CD부터 인프라까지 전체 시스템 맥락을 줄 수 있는 사람",
          "그 사람만이 AI의 출력을 올바른 자리에 배치할 수 있어요",
        ], Math.round(dur * 0.22)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 40-41: 전략3 — 가치 노동 축적
    // -------------------------------------------------------------------------

    case 40: // "가치 노동 축적 — 설계(작업) + 관계(행위)"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("전략 3", 0, "accent"),
        headline("가치 노동을 축적하세요", "xl", ["가치 노동 축적", "설계=작업", "관계=행위", "자산"], 8),
        stack("row", [
          frameBox([
            icon("code", 40, Math.round(dur * 0.25)),
            bodyText("코드 작성 → AI에게 위임 OK", Math.round(dur * 0.35)),
            badge("노동 (Labor)", Math.round(dur * 0.45)),
          ], Math.round(dur * 0.22), { maxWidth: 300 }),
          frameBox([
            icon("layers", 40, Math.round(dur * 0.55), true, "float"),
            bodyText("설계 → 손에서 절대 놓지 마세요", Math.round(dur * 0.65)),
            badge("작업 (Work)", Math.round(dur * 0.72), "accent"),
          ], Math.round(dur * 0.52), { maxWidth: 300 }),
          frameBox([
            icon("users", 40, Math.round(dur * 0.78), true, "float"),
            bodyText("고객 관계 → 절대 포기 금지", Math.round(dur * 0.85)),
            badge("행위 (Action)", Math.round(dur * 0.92), "accent"),
          ], Math.round(dur * 0.76), { maxWidth: 300 }),
        ], 16),
      ]);
      break;

    case 41: // "연봉은 빼앗길 수 있지만 도메인+설계+신뢰는 불가"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("YOUR ASSET", 0),
        headline("이 축적은 절대 빼앗을 수 없습니다", "xl", ["연봉", "도메인 지식", "설계 감각", "신뢰", "빼앗을 수 없다"], 8),
        divider(Math.round(dur * 0.28)),
        split([
          frameBox([
            icon("briefcase", 40, Math.round(dur * 0.35)),
            bodyText("연봉", Math.round(dur * 0.43)),
            bodyText("회사가 줬다가 뺏을 수 있음", Math.round(dur * 0.51)),
          ], Math.round(dur * 0.32), { maxWidth: 320 }),
          frameBox([
            icon("gem", 40, Math.round(dur * 0.58), true, "shimmer"),
            bodyText("도메인 지식 + 설계 감각 + 신뢰", Math.round(dur * 0.68)),
            bodyText("그 누구도 빼앗아 갈 수 없음", Math.round(dur * 0.78)),
          ], Math.round(dur * 0.55), { maxWidth: 380 }),
        ]),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 42-43: 경고 — 그림자 노동 주의
    // -------------------------------------------------------------------------

    case 42: // "AI 복붙 = 그림자 노동 경고"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("CAUTION", 0),
        headline("조심해야 할 것이 있습니다", "lg", ["복사 붙여넣기", "그림자 노동", "수동적 반복"], 8),
        warningCard(
          "이것은 가치 노동이 아닙니다",
          "AI 코드를 검증 없이 복사/붙여넣기 하는 것. 프롬프트 하나 넣어서 나온 결과물을 그대로 납품하는 것. 일리치가 경고한 바로 그 그림자 노동입니다.",
          Math.round(dur * 0.2)
        ),
        insightTile("!", "내가 선택한 게 아니라 AI라는 시스템이 시키는 수동적 반복", Math.round(dur * 0.72)),
      ]);
      break;

    case 43: // "AI를 도구로만 쓰는 개발자가 사라진다"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("THE DISTINCTION", 0),
        headline("어떤 개발자가 사라지는가?", "xl", ["도구로만 쓰는", "사라지는", "도메인 결합", "단단해질"], 8),
        split([
          frameBox([
            icon("trending-down", 44, Math.round(dur * 0.22)),
            bodyText("AI를 도구로만 쓰는 개발자", Math.round(dur * 0.32)),
            bodyText("AI가 코드 짜면 그대로 납품", Math.round(dur * 0.42)),
            badge("사라진다", Math.round(dur * 0.52)),
          ], Math.round(dur * 0.2), { maxWidth: 370 }),
          frameBox([
            icon("trending-up", 44, Math.round(dur * 0.58), true),
            bodyText("AI + 도메인 지식을 결합하는 개발자", Math.round(dur * 0.68)),
            bodyText("새로운 가치를 만들어내는 사람", Math.round(dur * 0.78)),
            badge("더 단단해진다", Math.round(dur * 0.86), "accent"),
          ], Math.round(dur * 0.56), { maxWidth: 370 }),
        ]),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 44-45: 바이브코딩 = 공생의 도구
    // -------------------------------------------------------------------------

    case 44: // "바이브코딩 = 현대판 공생의 도구"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("VIBE CODING", 0, "accent"),
        headline("현대판 공생의 도구", "xl", ["바이브코딩", "공생의 도구", "창조성 증폭", "산업적 도구"], 8),
        divider(Math.round(dur * 0.25)),
        split([
          frameBox([
            icon("x-circle", 40, Math.round(dur * 0.32)),
            bodyText("산업적 도구", Math.round(dur * 0.4)),
            bodyText("AI가 인간을 대체", Math.round(dur * 0.48)),
          ], Math.round(dur * 0.3), { maxWidth: 320 }),
          frameBox([
            icon("sparkles", 40, Math.round(dur * 0.55), true, "pulse"),
            bodyText("공생의 도구", Math.round(dur * 0.63)),
            bodyText("인간의 창조성을 증폭", Math.round(dur * 0.71)),
          ], Math.round(dur * 0.52), { maxWidth: 320 }),
        ]),
        footer("코드에 매몰되지 않고 AI를 손발처럼 지휘하는 방식", Math.round(dur * 0.85)),
      ]);
      break;

    case 45: // "임금 노동 논리에서 벗어나 가치 노동 생태계 구축"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("ILLICH'S DREAM", 0),
        headline("일리치가 꿈꿨던 공생", "xl", ["벗어나서", "통제하는 도구", "생태계", "꿈꿨던 공생"], 8),
        icon("globe", 64, Math.round(dur * 0.3), true, "shimmer"),
        divider(Math.round(dur * 0.48)),
        bodyText("AI를 스스로 통제하는 도구로 활용해\n주도적인 가치 노동의 생태계를 구축하는 것", Math.round(dur * 0.56)),
      ]);
      break;

    // -------------------------------------------------------------------------
    // 46-49: 마무리
    // -------------------------------------------------------------------------

    case 46: // "일리치의 질문 — 월급 없이 계속할 수 있는 일?"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("ILLICH'S QUESTION", 0),
        headline("마지막으로 일리치의 질문", "lg", ["월급 없이", "계속할 일"], 8),
        divider(Math.round(dur * 0.25)),
        quoteText("\"당신이 월급을 받지 않아도\n계속할 수 있는 일은 무엇입니까?\"", Math.round(dur * 0.32)),
        stack("row", [
          iconCard("code", "코딩", "새벽에도 하고 싶은", Math.round(dur * 0.62)),
          iconCard("pen-tool", "글쓰기", "표현하고 싶어서", Math.round(dur * 0.72)),
          iconCard("users", "가르치기", "도움주고 싶어서", Math.round(dur * 0.82)),
        ], 16),
      ]);
      break;

    case 47: // "오픈소스 한 줄, 커뮤니티 기여 = 여러분의 가치 노동"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("YOUR VALUE LABOR", 0),
        headline("그것이 여러분의 가치 노동입니다", "lg", ["오픈소스", "가치 노동", "대체 불가"], 8),
        bulletList([
          "동네 커뮤니티에 가입해서 기여하는 것",
          "오픈소스에 작은 코드 한 줄을 보태는 것",
          "그게 뭐든 — AI가 절대 대체하지 못하는 영역",
        ], Math.round(dur * 0.22)),
        icon("heart", 56, Math.round(dur * 0.68), true, "heartbeat"),
      ]);
      break;

    case 48: // "시장가격 0 ≠ 가치 0 — 일리치의 통찰"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("FINAL INSIGHT", 0),
        headline("시장가격이 0이 되어도 가치는 0이 아닙니다", "xl", ["가격 0", "가치 0 아님", "50년 전"], 8),
        divider(Math.round(dur * 0.3)),
        svgGraphic("0 0 420 180", 420, 180, [
          // 가격 = 0
          { tag: "rect", staggerIndex: 0, attrs: { x: 30, y: 50, width: 160, height: 80, rx: 12, fill: "rgba(255,100,100,0.1)", stroke: "rgba(255,100,100,0.3)", "stroke-width": 1.5 } },
          { tag: "text", staggerIndex: 1, attrs: { x: 110, y: 90, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FF6B6B", "font-size": 18, "font-weight": 700 }, text: "시장 가격 = 0" },
          // ≠
          { tag: "text", staggerIndex: 2, attrs: { x: 210, y: 90, "text-anchor": "middle", "dominant-baseline": "middle", fill: "#FFFFFF", "font-size": 32, "font-weight": 900 }, text: "≠" },
          // 가치 ≠ 0
          { tag: "rect", staggerIndex: 3, attrs: { x: 230, y: 50, width: 160, height: 80, rx: 12 }, themeColor: "surface" },
          { tag: "rect", staggerIndex: 3, attrs: { x: 230, y: 50, width: 160, height: 80, rx: 12, fill: "none" }, themeColor: "accentBright" },
          { tag: "text", staggerIndex: 4, attrs: { x: 310, y: 90, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 18, "font-weight": 700 }, themeColor: "accentBright", text: "가치 ≠ 0" },
        ], Math.round(dur * 0.32), true),
        footer("50년 전 일리치도 그걸 알고 있었습니다", Math.round(dur * 0.75)),
      ]);
      break;

    case 49: // "내가 하고 싶은 일은 무엇인가? 지금 하고 있는가? 감사합니다"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("FINAL QUESTION", 0),
        headline("내가 정말로 하고 싶은 일은 무엇인가?", "xl", ["하고 싶은 일", "지금 이 순간"], 8),
        divider(Math.round(dur * 0.35)),
        quoteText("그리고 그걸 지금 이 순간 하고 있는가?", Math.round(dur * 0.45)),
        footer("감사합니다", Math.round(dur * 0.72)),
      ]);
      break;

    default:
      root = sceneRoot(22, 60, [
        headline(beat.text.split(/[.?!]/)[0] || "...", "lg", [], 0),
        bodyText(beat.text, Math.round(dur * 0.3)),
      ]);
  }

  // 씬별 트랜지션 배정
  const transitions: Record<number, { type: string; durationFrames?: number }> = {
    // 도입부
    0: { type: "crossfade", durationFrames: 22 },
    1: { type: "zoom-in", durationFrames: 20 },
    2: { type: "slide-right", durationFrames: 18 },
    3: { type: "wipe-right", durationFrames: 22 },
    4: { type: "blur-through", durationFrames: 24 },
    // 댓글 반응
    5: { type: "crossfade", durationFrames: 16 },
    6: { type: "slide-left", durationFrames: 18 },
    // 단가 붕괴
    7: { type: "zoom-in", durationFrames: 22 },
    8: { type: "wipe-right", durationFrames: 20 },
    9: { type: "slide-up", durationFrames: 20 },
    10: { type: "blur-through", durationFrames: 26 },
    // 이반 일리치 소개
    11: { type: "crossfade", durationFrames: 24 },
    12: { type: "slide-right", durationFrames: 18 },
    // 핵심 이분법 (챕터 전환 — 길게)
    13: { type: "blur-through", durationFrames: 28 },
    14: { type: "crossfade", durationFrames: 18 },
    15: { type: "wipe-right", durationFrames: 20 },
    16: { type: "slide-right", durationFrames: 18 },
    // 가치 노동 예시
    17: { type: "zoom-in", durationFrames: 22 },
    // 그림자 노동
    18: { type: "blur-through", durationFrames: 24 },
    19: { type: "crossfade", durationFrames: 18 },
    20: { type: "wipe-right", durationFrames: 20 },
    // 공생
    21: { type: "zoom-in", durationFrames: 24 },
    22: { type: "crossfade", durationFrames: 18 },
    23: { type: "slide-right", durationFrames: 20 },
    24: { type: "blur-through", durationFrames: 26 },
    // 하청 개발사 재해석
    25: { type: "crossfade", durationFrames: 20 },
    26: { type: "slide-up", durationFrames: 18 },
    27: { type: "zoom-in", durationFrames: 20 },
    28: { type: "wipe-right", durationFrames: 20 },
    29: { type: "slide-right", durationFrames: 18 },
    30: { type: "crossfade", durationFrames: 20 },
    31: { type: "blur-through", durationFrames: 24 },
    // 아렌트 삼분법 (챕터 전환)
    32: { type: "zoom-in", durationFrames: 26 },
    33: { type: "crossfade", durationFrames: 20 },
    34: { type: "wipe-right", durationFrames: 22 },
    35: { type: "slide-up", durationFrames: 20 },
    // 전략
    36: { type: "blur-through", durationFrames: 28 },
    37: { type: "zoom-in", durationFrames: 22 },
    38: { type: "wipe-right", durationFrames: 20 },
    39: { type: "slide-right", durationFrames: 18 },
    40: { type: "zoom-in", durationFrames: 22 },
    41: { type: "crossfade", durationFrames: 20 },
    // 경고
    42: { type: "blur-through", durationFrames: 24 },
    43: { type: "slide-right", durationFrames: 20 },
    // 바이브코딩
    44: { type: "zoom-in", durationFrames: 24 },
    45: { type: "crossfade", durationFrames: 22 },
    // 마무리
    46: { type: "blur-through", durationFrames: 28 },
    47: { type: "crossfade", durationFrames: 20 },
    48: { type: "wipe-right", durationFrames: 22 },
    49: { type: "none", durationFrames: 0 },
  };
  const tr = transitions[bi] ?? { type: "crossfade", durationFrames: 20 };

  return { ...base, layout_family: layout, stack_root: root, transition: tr };
}

// Generate all scenes
const scenes = beats.map((b: any) => buildScene(b));

// Write scenes-v2.json
fs.writeFileSync(path.join(dataDir, "scenes-v2.json"), JSON.stringify(scenes, null, 2));

// Generate scene-plan.json
const plan = {
  project_id: projectId,
  total_beats: beats.length,
  plans: beats.map((b: any, i: number) => ({
    beat_index: i,
    selected_layout: scenes[i].layout_family,
    score: 60,
    breakdown: {
      semanticFit: 45,
      evidenceTypeFit: 12,
      rhythmFit: 18,
      assetOwnership: 10,
      recentRepetitionPenalty: 8,
      previousSimilarityPenalty: 7,
    },
    alternatives: [],
  })),
};
fs.writeFileSync(path.join(dataDir, "scene-plan.json"), JSON.stringify(plan, null, 2));

// Update project.json
const proj = JSON.parse(fs.readFileSync(path.join(dataDir, "project.json"), "utf-8"));
proj.status = "scened";
fs.writeFileSync(path.join(dataDir, "project.json"), JSON.stringify(proj, null, 2));

// Generate render-props-v2.json
const renderProps = {
  projectId,
  audioSrc,
  scenes,
};
fs.writeFileSync(path.join(dataDir, "render-props-v2.json"), JSON.stringify(renderProps, null, 2));

console.log(`scenes-v2.json: ${scenes.length}개 씬 생성`);
console.log(`scene-plan.json: ${plan.plans.length}개 플랜 생성`);
console.log(`render-props-v2.json 생성`);
console.log(`project.json status: "scened"`);

// Layout distribution
const layoutDist: Record<string, number> = {};
scenes.forEach((s: any) => { layoutDist[s.layout_family] = (layoutDist[s.layout_family] || 0) + 1; });
console.log(`\n레이아웃 분포:`);
Object.entries(layoutDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${k}: ${v}개`));

// Diagram node usage
const diagramNodes = ["VennDiagram", "PyramidDiagram", "MatrixQuadrant", "FunnelDiagram", "SvgGraphic", "CompareBars"];
console.log(`\n특수 노드 사용:`);
diagramNodes.forEach(nodeType => {
  let count = 0;
  const usedIn: number[] = [];
  scenes.forEach((s: any) => {
    const countInTree = (n: any): number => {
      if (!n) return 0;
      let c = n.type === nodeType ? 1 : 0;
      (n.children ?? []).forEach((ch: any) => { c += countInTree(ch); });
      return c;
    };
    const c = countInTree(s.stack_root);
    if (c > 0) { count += c; usedIn.push(s.beat_index); }
  });
  if (count > 0) console.log(`   ${nodeType}: ${count}회 (beat ${usedIn.join(", ")})`);
});
