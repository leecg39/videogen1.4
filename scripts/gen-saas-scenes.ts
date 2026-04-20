#!/usr/bin/env npx tsx
/**
 * saas-fullstack 프로젝트의 scenes-v2.json 생성 스크립트
 */
import * as fs from "fs";
import * as path from "path";

const projectId = "saas-fullstack";
const dataDir = path.join("data", projectId);

// Load beats & SRT
const beats = JSON.parse(fs.readFileSync(path.join(dataDir, "beats.json"), "utf-8"));
const srtRaw = fs.readFileSync(path.join("input", `${projectId}.srt`), "utf-8");

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

// enterAt helper: distribute enterAt within scene duration
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

// 모션 프리셋 순환 — 단조로움 방지
const headlinePresets = ["fadeUp", "zoomBlur", "flipUp", "riseRotate", "blurIn"];
const badgePresets = ["popBadge", "elasticPop", "expandCenter", "dropIn"];
const bodyPresets = ["fadeUp", "slideReveal", "swoopLeft", "riseRotate"];
const iconPresets = ["popBadge", "elasticPop", "expandCenter", "rotateIn", "glowIn"];
const cardPresets = ["fadeUp", "swoopLeft", "swoopRight", "flipUp", "riseRotate"];
const framePresets = ["scaleIn", "expandCenter", "blurIn", "rotateIn"];
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

function icon(name: string, size: number, enterAt: number, glow = false): N {
  return node("Icon", { data: { name, size, ...(glow ? { glow: true } : {}) } }, { motion: { preset: nextPreset(iconPresets, "i"), enterAt, duration: 12 } });
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
  return node("InsightTile", { data: { index, title } }, { layout: { maxWidth: 600 }, motion: { preset: "expandCenter", enterAt, duration: 18 } });
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

function split(children: N[], ratio = [1, 1], gap = 20, enterAt?: number): N {
  const m = enterAt !== undefined ? { motion: { preset: "slideSplit", enterAt, duration: 18 } } : {};
  return node("Split", { layout: { ratio, gap, justify: "center", align: "center" }, style: { maxWidth: 900 } }, { children, ...m });
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

function monitorMockup(title: string, enterAt: number, children: N[] = []): N {
  return node("MonitorMockup", { data: { title } }, { motion: { preset: "scaleIn", enterAt, duration: 20 }, children });
}

function flowDiagram(items: { label: string; icon?: string }[], enterAt: number): N {
  return node("FlowDiagram", { data: { items }, style: { maxWidth: 800 } }, { motion: { preset: "fadeUp", enterAt, duration: 20 } });
}

function cycleDiagram(items: { label: string }[], enterAt: number): N {
  return node("CycleDiagram", { data: { items }, style: { maxWidth: 500 } }, { motion: { preset: "fadeUp", enterAt, duration: 20 } });
}

function timelineStepper(steps: { title: string; description?: string }[], enterAt: number): N {
  return node("TimelineStepper", { data: { steps }, style: { maxWidth: 800 } }, { motion: { preset: "fadeUp", enterAt, duration: 25 } });
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
    copy_layers: { kicker: null, headline: beat.text.split(/[.?!]/)[0], supporting: null, footer_caption: null },
    motion: { entrance: "fadeUp", emphasis: null, exit: null, duration_ms: beat.end_ms - beat.start_ms },
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
    case 0: // Hook - "혹시 이런 이야기 들어보셨나요?"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("SaaS FULL-STACK", 0),
        headline("혼자서 SaaS를 만들어 월 천만 원", "xl", ["월 천만 원"], 8),
        divider(Math.round(dur * 0.35)),
        statNumber("1인", "개발자의 SaaS 수익", Math.round(dur * 0.45)),
        footer("인디해커들의 비밀", Math.round(dur * 0.7)),
      ]);
      break;

    case 1: // "인디해커 = 풀스택"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("INDIE HACKER", 0),
        headline("풀스택 개발자의 힘", "lg", ["풀스택"], 8),
        stack("row", [
          iconCard("code", "프론트엔드", "UI/UX 구현", Math.round(dur * 0.25)),
          iconCard("server", "백엔드", "API & DB", Math.round(dur * 0.4)),
          iconCard("rocket", "배포", "운영 & 관리", Math.round(dur * 0.55)),
        ], 20),
      ]);
      break;

    case 2: // "옛날에는 불가능... 팀이 필요"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("BEFORE vs NOW", 0),
        headline("예전에는 팀이 필요했다", "lg", ["팀이 필요"], 8),
        split([
          frameBox([
            icon("server", 40, Math.round(dur * 0.2)),
            bodyText("서버 구축", Math.round(dur * 0.3)),
            bodyText("DB 설치", Math.round(dur * 0.38)),
            bodyText("보안 관리", Math.round(dur * 0.46)),
          ], Math.round(dur * 0.2), { maxWidth: 400 }),
          frameBox([
            icon("alert-triangle", 40, Math.round(dur * 0.55)),
            bodyText("최소 3~5명 팀 필수", Math.round(dur * 0.65)),
            bodyText("수개월 소요", Math.round(dur * 0.73)),
          ], Math.round(dur * 0.55), { maxWidth: 400 }),
        ]),
      ]);
      break;

    case 3: // "지금은? 일주일 만에 런칭"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        badge("NOW", 0, "accent"),
        headline("일주일 만에 런칭", "xl", ["일주일"], 8),
        statNumber("7일", "아이디어 → 제품", Math.round(dur * 0.35)),
        insightTile("!", "한 사람이 전부 해내는 시대", Math.round(dur * 0.6)),
      ]);
      break;

    case 4: // "오늘은 그 비밀... 차근차근"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("TODAY'S TOPIC", 0),
        headline("SaaS 풀스택 서비스 개발", "xl", ["풀스택 서비스"], 8),
        divider(Math.round(dur * 0.4)),
        bodyText("어디서부터 어떻게 시작하는지 차근차근 풀어드릴게요", Math.round(dur * 0.5)),
        flowDiagram([
          { label: "프론트엔드", icon: "code" },
          { label: "백엔드", icon: "server" },
          { label: "배포", icon: "rocket" },
        ], Math.round(dur * 0.6)),
      ]);
      break;

    case 5: // SaaS 정의 — "Software as a Service"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("DEFINITION", 0),
        headline("SaaS = Software as a Service", "lg", ["Software as a Service"], 8),
        bodyText("설치 없이 인터넷으로 접속해서 쓰는 소프트웨어", Math.round(dur * 0.2)),
        divider(Math.round(dur * 0.35)),
        stack("row", [
          frameBox([
            imageAsset("assets/notion.png", "Notion", Math.round(dur * 0.4), 80),
            bodyText("Notion", Math.round(dur * 0.48)),
          ], Math.round(dur * 0.4), { maxWidth: 180 }),
          frameBox([
            icon("message-circle", 48, Math.round(dur * 0.5)),
            bodyText("Slack", Math.round(dur * 0.58)),
          ], Math.round(dur * 0.5), { maxWidth: 180 }),
          frameBox([
            imageAsset("assets/figma.png", "Figma", Math.round(dur * 0.6), 80),
            bodyText("Figma", Math.round(dur * 0.68)),
          ], Math.round(dur * 0.6), { maxWidth: 180 }),
        ], 24),
      ]);
      break;

    case 6: // "왜 열광? 반복 수익"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("WHY SaaS?", 0),
        headline("반복 수익의 마법", "xl", ["반복 수익"], 8),
        icon("dollar-sign", 64, Math.round(dur * 0.3), true),
        bodyText("한 번 만들면 매달 구독료가 들어온다", Math.round(dur * 0.5)),
      ]);
      break;

    case 7: // "구독료 vs 프리랜서"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        headline("SaaS vs 프리랜서", "lg", ["SaaS", "프리랜서"], 8),
        split([
          frameBox([
            icon("trending-up", 40, Math.round(dur * 0.2), true),
            bodyText("SaaS 수익", Math.round(dur * 0.28)),
            bodyText("매달 자동 구독료", Math.round(dur * 0.36)),
            badge("반복 수익", Math.round(dur * 0.44)),
          ], Math.round(dur * 0.15), { maxWidth: 380 }),
          frameBox([
            icon("user", 40, Math.round(dur * 0.5)),
            bodyText("프리랜서 수입", Math.round(dur * 0.58)),
            bodyText("매번 새 프로젝트 탐색", Math.round(dur * 0.66)),
            badge("일회성 수입", Math.round(dur * 0.74)),
          ], Math.round(dur * 0.5), { maxWidth: 380 }),
        ]),
      ]);
      break;

    case 8: // "클라우드... 월 몇 천 원"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("CLOUD ERA", 0),
        headline("서버 비용의 혁명", "lg", ["비용의 혁명"], 8),
        stack("row", [
          statCard("월 ~5,000원", "서비스 운영 비용", Math.round(dur * 0.25)),
          statCard("90%↓", "인프라 비용 절감", Math.round(dur * 0.45)),
        ], 24),
        footer("클라우드 덕분에 누구나 서비스를 운영할 수 있는 시대", Math.round(dur * 0.7)),
      ]);
      break;

    case 9: // "AI + 역사상 가장 좋은 타이밍"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("GOLDEN AGE", 0),
        headline("역사상 가장 좋은 타이밍", "xl", ["가장 좋은 타이밍"], 8),
        compareBars([
          { label: "AI 도구", value: 95, icon: "brain" },
          { label: "클라우드", value: 90, icon: "globe" },
          { label: "낮은 비용", value: 85, icon: "dollar-sign" },
          { label: "오픈소스", value: 80, icon: "code" },
        ], "", Math.round(dur * 0.22)),
        footer("SaaS 시작에 이보다 좋은 때는 없었다", Math.round(dur * 0.75)),
      ]);
      break;

    case 10: // "풀스택 = 프론트엔드 + 백엔드"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("FULL-STACK", 0),
        headline("두 개의 세계", "lg", ["프론트엔드", "백엔드"], 8),
        split([
          frameBox([
            icon("code", 48, Math.round(dur * 0.2)),
            bodyText("프론트엔드", Math.round(dur * 0.3)),
            bodyText("사용자가 보는 화면", Math.round(dur * 0.4)),
          ], Math.round(dur * 0.15), { maxWidth: 400 }),
          frameBox([
            icon("server", 48, Math.round(dur * 0.5)),
            bodyText("백엔드", Math.round(dur * 0.6)),
            bodyText("보이지 않는 핵심 로직", Math.round(dur * 0.7)),
          ], Math.round(dur * 0.45), { maxWidth: 400 }),
        ]),
      ]);
      break;

    case 11: // "프론트엔드 = 화면... 구리면 아무도 안 써요"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("FRONTEND", 0),
        headline("화면이 구리면 아무도 안 써요", "lg", ["구리면 안 써요"], 8),
        quoteText("아무리 기능이 좋아도 화면이 전부다", Math.round(dur * 0.3)),
        divider(Math.round(dur * 0.55)),
        insightTile("UX", "사용자 경험이 곧 제품의 가치", Math.round(dur * 0.65)),
      ]);
      break;

    case 12: // "React + Next.js 압도적"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("TECH STACK", 0),
        headline("React + Next.js", "xl", ["React", "Next.js"], 8),
        stack("row", [
          frameBox([
            icon("code", 44, Math.round(dur * 0.2)),
            bodyText("React", Math.round(dur * 0.3)),
            bodyText("UI 컴포넌트 라이브러리", Math.round(dur * 0.38)),
          ], Math.round(dur * 0.2), { maxWidth: 350 }),
          frameBox([
            imageAsset("assets/nextjs.svg", "Next.js", Math.round(dur * 0.45), 60),
            bodyText("Next.js", Math.round(dur * 0.55)),
            bodyText("풀스택 프레임워크", Math.round(dur * 0.63)),
          ], Math.round(dur * 0.45), { maxWidth: 350 }),
        ], 24),
      ]);
      break;

    case 13: // "SSR + 라우팅 + API + Tailwind"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("NEXT.JS FEATURES", 0),
        headline("Next.js가 한 번에 해결", "lg", ["한 번에 해결"], 8),
        stack("row", [
          iconCard("layers", "SSR", "서버 사이드 렌더링", Math.round(dur * 0.2)),
          iconCard("git-branch", "라우팅", "자동 페이지 라우팅", Math.round(dur * 0.33)),
          iconCard("link", "API", "API 라우트 내장", Math.round(dur * 0.46)),
        ], 16),
        divider(Math.round(dur * 0.6)),
        stack("row", [
          icon("sparkles", 36, Math.round(dur * 0.65)),
          bodyText("Tailwind CSS로 디자인까지 빠르게", Math.round(dur * 0.7)),
        ], 12),
      ]);
      break;

    case 14: // "ShadCN UI... 하루면 돼요"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("UI COMPONENTS", 0),
        headline("ShadCN UI로 뚝딱", "lg", ["뚝딱"], 8),
        bulletList([
          "로그인 폼",
          "대시보드",
          "데이터 테이블",
          "설정 페이지",
        ], Math.round(dur * 0.25)),
        divider(Math.round(dur * 0.55)),
        stack("row", [
          statCard("일주일 →", "예전", Math.round(dur * 0.6)),
          icon("arrow-right", 36, Math.round(dur * 0.68)),
          statCard("하루", "지금", Math.round(dur * 0.72)),
        ], 16),
      ]);
      break;

    case 15: // "백엔드 = SaaS의 심장"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("BACKEND", 0),
        headline("SaaS의 심장", "xl", ["심장"], 8),
        compareBars([
          { label: "인증", value: 95, icon: "user-circle" },
          { label: "데이터", value: 90, icon: "folder" },
          { label: "결제", value: 85, icon: "dollar-sign" },
          { label: "실시간", value: 75, icon: "activity" },
        ], "", Math.round(dur * 0.22)),
        footer("핵심 로직이 모두 백엔드에 있다", Math.round(dur * 0.8)),
      ]);
      break;

    case 16: // "BaaS가 대신해 줘요"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("PARADIGM SHIFT", 0),
        headline("Backend as a Service", "lg", ["BaaS"], 8),
        bodyText("백엔드를 직접 다 만들지 않는 시대", Math.round(dur * 0.25)),
        divider(Math.round(dur * 0.4)),
        insightTile("BaaS", "서비스가 백엔드를 대신한다", Math.round(dur * 0.55)),
      ]);
      break;

    case 17: // "Supabase = DB + 인증 + 스토리지"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("SUPABASE", 0),
        headline("Supabase 하나면 전부 해결", "lg", ["전부 해결"], 8),
        imageAsset("assets/supabase.png", "Supabase", Math.round(dur * 0.18), 80),
        stack("row", [
          iconCard("folder", "데이터베이스", "PostgreSQL", Math.round(dur * 0.3)),
          iconCard("user-circle", "인증", "Auth 내장", Math.round(dur * 0.42)),
        ], 16),
        stack("row", [
          iconCard("folder-open", "스토리지", "파일 관리", Math.round(dur * 0.54)),
          iconCard("activity", "실시간", "Realtime", Math.round(dur * 0.66)),
        ], 16),
        footer("SQL 한 줄이면 API 자동 생성", Math.round(dur * 0.8)),
      ]);
      break;

    case 18: // "Stripe + Resend + Cloudflare R2"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("SERVICE STACK", 0),
        headline("레고 블록처럼 조립", "lg", ["레고 블록"], 8),
        stack("row", [
          iconCard("dollar-sign", "Stripe", "결제 & 구독", Math.round(dur * 0.2)),
          iconCard("send", "Resend", "이메일 발송", Math.round(dur * 0.38)),
          iconCard("globe", "Cloudflare R2", "파일 업로드", Math.round(dur * 0.56)),
        ], 16),
      ]);
      break;

    case 19: // "핵심에만 집중"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("CORE PRINCIPLE", 0),
        headline("핵심 비즈니스에만 집중", "xl", ["핵심", "집중"], 8),
        divider(Math.round(dur * 0.3)),
        quoteText("직접 만들 필요 없는 건 가져다 쓰고\n핵심 로직에만 집중한다", Math.round(dur * 0.4)),
        insightTile("KEY", "풀스택의 비결 = 스마트한 조립", Math.round(dur * 0.65)),
      ]);
      break;

    case 20: // "배포라고 하죠"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("DEPLOYMENT", 0),
        headline("세상에 내놓기", "lg", ["세상에"], 8),
        icon("rocket", 56, Math.round(dur * 0.35), true),
        bodyText("코드를 짜는 것과 서비스를 내놓는 것은 다르다", Math.round(dur * 0.55)),
      ]);
      break;

    case 21: // "예전에는 EC2, Nginx, SSL..."
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("OLD WAY", 0),
        headline("예전의 배포 과정", "lg", ["골치 아팠어요"], 8),
        terminalBlock([
          "$ ssh deploy@server",
          "$ sudo apt install nginx",
          "$ certbot --nginx -d example.com",
          "$ pm2 start app.js",
          "# ... 이틀 소요 😩",
        ], Math.round(dur * 0.25)),
        statCard("2일+", "배포에만 소요되는 시간", Math.round(dur * 0.65)),
      ]);
      break;

    case 22: // "Vercel! git push 한 번"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("NEW WAY", 0, "accent"),
        headline("Vercel로 원클릭 배포", "xl", ["원클릭"], 8),
        terminalBlock([
          "$ git push origin main",
          "✓ Build succeeded",
          "✓ Deployed to production",
          "✓ HTTPS & CDN enabled",
          "🌍 전 세계 배포 완료!",
        ], Math.round(dur * 0.2)),
        stack("row", [
          iconCard("git-branch", "GitHub", "코드 푸시", Math.round(dur * 0.5)),
          iconCard("rocket", "자동 빌드", "CI/CD 내장", Math.round(dur * 0.58)),
          iconCard("globe", "글로벌 CDN", "전 세계 배포", Math.round(dur * 0.66)),
        ], 16),
      ]);
      break;

    case 23: // "모니터링: Sentry + Vercel Analytics"
      layout = "split-2col";
      root = sceneRoot(22, 60, [
        kicker("MONITORING", 0),
        headline("스타트업 수준의 인프라", "lg", ["스타트업"], 8),
        split([
          frameBox([
            icon("alert-triangle", 40, Math.round(dur * 0.2)),
            bodyText("Sentry", Math.round(dur * 0.28)),
            bodyText("에러 추적 & 알림", Math.round(dur * 0.36)),
          ], Math.round(dur * 0.15), { maxWidth: 380 }),
          frameBox([
            icon("bar-chart", 40, Math.round(dur * 0.5)),
            bodyText("Vercel Analytics", Math.round(dur * 0.58)),
            bodyText("성능 모니터링", Math.round(dur * 0.66)),
          ], Math.round(dur * 0.45), { maxWidth: 380 }),
        ]),
        insightTile("✓", "이 정도면 스타트업 수준", Math.round(dur * 0.8)),
      ]);
      break;

    case 24: // "실전으로 들어가 볼게요"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("PRACTICE", 0),
        headline("SaaS 만드는 5단계", "xl", ["5단계"], 8),
        icon("layers", 56, Math.round(dur * 0.35), true),
        bodyText("실전 순서를 하나씩 짚어드릴게요", Math.round(dur * 0.55)),
      ]);
      break;

    case 25: // "1단계: 문제를 찾으세요"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("STEP 1", 0),
        headline("문제를 찾으세요", "lg", ["문제"], 8),
        processStep(1, "문제 발견", "기술이 아니라 문제가 먼저", Math.round(dur * 0.25)),
        divider(Math.round(dur * 0.5)),
        bodyText("내가 불편했던 것, 주변 사람들이 겪는 문제를 찾아보세요", Math.round(dur * 0.6)),
        icon("search", 48, Math.round(dur * 0.75)),
      ]);
      break;

    case 26: // "2단계: MVP"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("STEP 2", 0),
        headline("MVP를 빠르게 만드세요", "lg", ["MVP"], 8),
        bodyText("Minimum Viable Product = 최소 기능 제품", Math.round(dur * 0.18)),
        divider(Math.round(dur * 0.3)),
        split([
          frameBox([
            icon("x-circle", 40, Math.round(dur * 0.35)),
            bodyText("완벽함을 추구", Math.round(dur * 0.42)),
            bodyText("❌ 런칭 못함", Math.round(dur * 0.49)),
          ], Math.round(dur * 0.35), { maxWidth: 380 }),
          frameBox([
            icon("check-circle", 40, Math.round(dur * 0.55), true),
            bodyText("핵심 기능 하나", Math.round(dur * 0.62)),
            bodyText("✅ 빠른 런칭", Math.round(dur * 0.69)),
          ], Math.round(dur * 0.55), { maxWidth: 380 }),
        ]),
      ]);
      break;

    case 27: // "3단계: 랜딩 페이지"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("STEP 3", 0),
        headline("랜딩 페이지로 검증", "lg", ["검증"], 8),
        processStep(3, "시장 검증", "사람들의 반응을 먼저 확인", Math.round(dur * 0.2)),
        bulletList([
          "이메일 구독 받기",
          "대기자 명단 운영",
          "관심 확인 후 본격 개발",
        ], Math.round(dur * 0.45)),
      ]);
      break;

    case 28: // "4단계: 결제 기능"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("STEP 4", 0),
        headline("유료 전환하세요", "lg", ["유료 전환"], 8),
        icon("dollar-sign", 56, Math.round(dur * 0.25), true),
        quoteText("무료로만 쓰이는 서비스는 오래 못 간다", Math.round(dur * 0.4)),
        insightTile("$", "가치를 증명했다면 가격을 매기세요", Math.round(dur * 0.65)),
      ]);
      break;

    case 29: // "5단계: 피드백 + 반복"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("STEP 5", 0),
        headline("피드백을 받고 반복", "lg", ["반복"], 8),
        cycleDiagram([
          { label: "피드백 수집" },
          { label: "데이터 분석" },
          { label: "개선 & 배포" },
          { label: "사용자 반응" },
        ], Math.round(dur * 0.25)),
        footer("이 다섯 단계가 SaaS 개발의 핵심 루프", Math.round(dur * 0.7)),
      ]);
      break;

    case 30: // "정리... 대기업만의 영역 아니에요"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("WRAP UP", 0),
        headline("더 이상 대기업만의 영역이 아니다", "lg", ["대기업만의 영역"], 8),
        divider(Math.round(dur * 0.45)),
        bodyText("풀스택 SaaS 개발은 이제 누구나 할 수 있어요", Math.round(dur * 0.55)),
      ]);
      break;

    case 31: // "Next.js + Supabase + Vercel"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        badge("TECH STACK SUMMARY", 0),
        headline("이 세 가지면 끝", "lg", ["세 가지"], 8),
        flowDiagram([
          { label: "Next.js", icon: "code" },
          { label: "Supabase", icon: "server" },
          { label: "Vercel", icon: "rocket" },
        ], Math.round(dur * 0.2)),
        divider(Math.round(dur * 0.55)),
        stack("row", [
          icon("brain", 36, Math.round(dur * 0.6)),
          bodyText("+ AI 코딩 도구로 개발 속도 극대화", Math.round(dur * 0.65)),
        ], 12),
      ]);
      break;

    case 32: // "기술이 아니라 어떤 문제를 풀 건지"
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        kicker("CORE MESSAGE", 0),
        headline("어떤 문제를 풀 건지", "xl", ["문제"], 8),
        divider(Math.round(dur * 0.3)),
        quoteText("기술은 도구일 뿐\n진짜 가치는 사용자의 문제를 해결하는 데 있다", Math.round(dur * 0.4)),
        icon("sparkles", 48, Math.round(dur * 0.7), true),
      ]);
      break;

    case 33: // "작게 시작하고... 지금 바로"
      layout = "stacked-vertical";
      root = sceneRoot(22, 60, [
        kicker("TAKE ACTION", 0),
        headline("지금 바로 시작하세요", "xl", ["시작"], 8),
        stack("row", [
          processStep(1, "작게 시작", "완벽하지 않아도 괜찮아요", Math.round(dur * 0.2)),
          processStep(2, "빠르게 배우고", "실전에서 성장", Math.round(dur * 0.35)),
          processStep(3, "계속 개선", "멈추지 않는 반복", Math.round(dur * 0.5)),
        ], 16),
        divider(Math.round(dur * 0.65)),
        insightTile("💡", "여러분의 아이디어가 누군가의 불편함을 해결합니다", Math.round(dur * 0.72)),
      ]);
      break;

    case 34: // Outro
      layout = "hero-center";
      root = sceneRoot(22, 60, [
        headline("감사합니다", "xl", ["감사"], 0),
        divider(Math.round(dur * 0.25)),
        bodyText("구독과 좋아요 부탁드려요!", Math.round(dur * 0.35)),
        footer("다음 영상에서 또 만나요!", Math.round(dur * 0.55)),
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
    0: { type: "crossfade", durationFrames: 20 },       // hook → 정의
    1: { type: "slide-right", durationFrames: 18 },
    2: { type: "zoom-in", durationFrames: 22 },          // 과거→현재 극적 전환
    3: { type: "wipe-right", durationFrames: 20 },
    4: { type: "blur-through", durationFrames: 24 },     // 챕터 전환
    5: { type: "crossfade", durationFrames: 18 },
    6: { type: "slide-up", durationFrames: 18 },
    7: { type: "crossfade", durationFrames: 16 },
    8: { type: "slide-right", durationFrames: 18 },
    9: { type: "zoom-in", durationFrames: 24 },          // 챕터 전환
    10: { type: "wipe-right", durationFrames: 22 },
    11: { type: "crossfade", durationFrames: 16 },
    12: { type: "slide-left", durationFrames: 18 },
    13: { type: "crossfade", durationFrames: 16 },
    14: { type: "blur-through", durationFrames: 24 },    // 챕터 전환
    15: { type: "zoom-in", durationFrames: 22 },
    16: { type: "slide-right", durationFrames: 18 },
    17: { type: "crossfade", durationFrames: 16 },
    18: { type: "wipe-down", durationFrames: 20 },
    19: { type: "blur-through", durationFrames: 24 },    // 챕터 전환
    20: { type: "zoom-in", durationFrames: 22 },
    21: { type: "slide-right", durationFrames: 20 },     // old→new 전환
    22: { type: "crossfade", durationFrames: 18 },
    23: { type: "zoom-in", durationFrames: 24 },         // 챕터 전환
    24: { type: "wipe-right", durationFrames: 22 },
    25: { type: "slide-up", durationFrames: 16 },        // step 간 빠른 전환
    26: { type: "slide-up", durationFrames: 16 },
    27: { type: "slide-up", durationFrames: 16 },
    28: { type: "slide-up", durationFrames: 16 },
    29: { type: "blur-through", durationFrames: 24 },    // 마무리 전환
    30: { type: "crossfade", durationFrames: 20 },
    31: { type: "zoom-in", durationFrames: 22 },
    32: { type: "wipe-right", durationFrames: 22 },
    33: { type: "crossfade", durationFrames: 24 },
    34: { type: "none", durationFrames: 0 },             // 마지막
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
    score: 55,
    breakdown: {
      semanticFit: 40, evidenceTypeFit: 10, rhythmFit: 15,
      assetOwnership: 10, recentRepetitionPenalty: 10, previousSimilarityPenalty: 10,
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
  audioSrc: `${projectId}.mp3`,
  scenes,
};
fs.writeFileSync(path.join(dataDir, "render-props-v2.json"), JSON.stringify(renderProps, null, 2));

console.log(`✅ scenes-v2.json: ${scenes.length}개 씬 생성`);
console.log(`✅ scene-plan.json: ${plan.plans.length}개 플랜 생성`);
console.log(`✅ render-props-v2.json 생성`);
console.log(`✅ project.json status: "scened"`);

// Layout distribution
const layoutDist: Record<string, number> = {};
scenes.forEach((s: any) => { layoutDist[s.layout_family] = (layoutDist[s.layout_family] || 0) + 1; });
console.log(`\n📊 레이아웃 분포:`);
Object.entries(layoutDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${k}: ${v}개`));
