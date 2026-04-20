#!/usr/bin/env npx tsx
/**
 * generate-deck.ts — deck-spec.json → PPTX 생성 (v3 — 레퍼런스 디자인 반영)
 *
 * 디자인 레퍼런스: 동대문정보화도서관 강의 자료
 * - 따뜻한 네이비 배경 + 블루 악센트
 * - 제목 위 짧은 악센트 바
 * - 좌측 컬러 보더 콜아웃 카드
 * - 번호 뱃지 (파란 원형)
 * - 도트 그리드 커버 장식
 *
 * Usage:
 *   npx tsx scripts/generate-deck.ts data/{projectId}/deck-spec.json [--format pptx|pdf|both]
 */

import PptxGenJS from "pptxgenjs";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ─── 컬러 팔레트 (레퍼런스 기반) ───
const C = {
  BG:        "2D3142",  // 따뜻한 네이비 배경
  SURFACE:   "363B50",  // 카드/컨테이너 표면
  SURFACE2:  "3F4560",  // 코드 블록, 활성 상태
  ACCENT:    "4A90D9",  // 파란 악센트 (메인)
  ACCENT2:   "5BA0E8",  // 밝은 파란 (서브헤더)
  ACCENT_DIM:"3A6FA0",  // 어두운 파란 (뱃지 배경)
  CYAN:      "22D3EE",  // 시안 (보조 포인트)
  TEXT:      "F1F5F9",  // 본문 텍스트
  TEXT_DIM:  "94A3B8",  // 부제/캡션
  TEXT_MUTED:"64748B",  // 메타/페이지번호
  SUCCESS:   "34D399",  // 실행방안 보더
  WARNING:   "FBBF24",  // 경고/강조
  DANGER:    "F87171",  // 빨강
  BORDER:    "4A5068",  // 카드 테두리
  CALLOUT_BG:"2A3040",  // 콜아웃 배경
  CODE_BG:   "1E2233",  // 터미널/코드 배경
} as const;

const FONT = "Pretendard";
const FONT_CODE = "Consolas";

const SW = 13.333;
const SH = 7.5;
const PAD = 0.65; // 좌우 공통 패딩
const CW = SW - PAD * 2; // 콘텐츠 폭

// ─── 타입 ───
interface DeckSlide { index: number; type: string; title: string; subtitle?: string; background?: string; content?: any; }
interface DeckSpec { title: string; author?: string; date?: string; org?: string; slides: DeckSlide[]; }

// ─── 공통 요소 ───

/** 제목 위 짧은 악센트 바 + 제목 텍스트 */
function addTitleBar(slide: PptxGenJS.Slide, title: string, y = 0.45) {
  // 짧은 파란 바
  slide.addShape("rect" as any, {
    x: PAD, y, w: 0.7, h: 0.055,
    fill: { color: C.ACCENT },
  });
  // 제목
  slide.addText(title, {
    x: PAD, y: y + 0.15, w: CW, h: 0.7,
    fontSize: 26, fontFace: FONT, color: C.TEXT, bold: true,
  });
}

/** 서브 헤더 (파란색, 아이콘 스타일) */
function addSubHeader(slide: PptxGenJS.Slide, text: string, y: number) {
  slide.addText(text, {
    x: PAD, y, w: CW, h: 0.5,
    fontSize: 18, fontFace: FONT, color: C.ACCENT2, bold: true,
  });
}

/** 라운드 카드 */
function addCard(slide: PptxGenJS.Slide, pptx: PptxGenJS, x: number, y: number, w: number, h: number, opts?: { borderColor?: string; bg?: string }) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: opts?.bg || C.SURFACE },
    rectRadius: 0.1,
    line: { color: opts?.borderColor || C.BORDER, width: 0.75 },
  });
}

/** 좌측 컬러 보더 콜아웃 (강사 스크립트 스타일) */
function addCallout(slide: PptxGenJS.Slide, pptx: PptxGenJS, x: number, y: number, w: number, h: number, borderColor: string) {
  // 배경
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: C.CALLOUT_BG },
    rectRadius: 0.08,
  });
  // 좌측 보더
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y: y + 0.08, w: 0.04, h: h - 0.16,
    fill: { color: borderColor },
  });
}

/** 번호 뱃지 (파란 원형) */
function addBadge(slide: PptxGenJS.Slide, pptx: PptxGenJS, x: number, y: number, num: string, color = C.ACCENT) {
  slide.addShape(pptx.shapes.OVAL, {
    x, y, w: 0.32, h: 0.32,
    fill: { color },
  });
  slide.addText(num, {
    x, y, w: 0.32, h: 0.32,
    fontSize: 11, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
  });
}

/** 페이지 번호 + 하단 라인 */
function addFooter(slide: PptxGenJS.Slide, slideNum: number, total: number) {
  slide.addText(`${slideNum} / ${total}`, {
    x: SW - 1.3, y: SH - 0.42, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: FONT, color: C.TEXT_MUTED, align: "right",
  });
}

function colorFor(key: string): string {
  return ({ success: C.SUCCESS, warning: C.WARNING, danger: C.DANGER, accent: C.ACCENT, accent_alt: C.CYAN } as any)[key] || C.ACCENT;
}

// ─── 슬라이드 빌더 ───

function buildCover(pptx: PptxGenJS, s: DeckSlide, spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });

  // 도트 그리드 패턴 (좌상단 장식)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      slide.addShape(pptx.shapes.OVAL, {
        x: 0.5 + col * 0.3, y: 0.4 + row * 0.3,
        w: 0.07, h: 0.07,
        fill: { color: C.BORDER },
      });
    }
  }

  // 악센트 바
  slide.addShape("rect" as any, {
    x: PAD, y: 2.0, w: 0.9, h: 0.065,
    fill: { color: C.ACCENT },
  });

  // 메인 타이틀
  slide.addText(s.title, {
    x: PAD, y: 2.2, w: 9.0, h: 1.4,
    fontSize: 42, fontFace: FONT, color: C.TEXT,
    bold: true, lineSpacingMultiple: 1.1,
  });

  // 부제 (파란색)
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: PAD, y: 3.7, w: 9.0, h: 0.6,
      fontSize: 20, fontFace: FONT, color: C.ACCENT2, bold: true,
    });
  }

  // 설명 (있으면)
  const desc = s.content?.description;
  if (desc) {
    slide.addText(desc, {
      x: PAD, y: 4.4, w: 9.0, h: 0.5,
      fontSize: 16, fontFace: FONT, color: C.TEXT_DIM,
    });
  }

  // 하단 우측 — 저자 정보
  const meta = [spec.author, spec.org].filter(Boolean).join(" · ");
  if (meta) {
    slide.addText(`with. ${meta}`, {
      x: 7.5, y: 5.8, w: 5.3, h: 0.4,
      fontSize: 13, fontFace: FONT, color: C.TEXT_DIM, align: "right", italic: true,
    });
  }
}

function buildToc(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);

  // 센터 제목
  slide.addText(s.title || "목차", {
    x: 0, y: 0.5, w: SW, h: 0.8,
    fontSize: 30, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
  });

  // 센터 악센트 바
  slide.addShape("rect" as any, {
    x: SW / 2 - 0.5, y: 1.35, w: 1.0, h: 0.05,
    fill: { color: C.ACCENT },
  });

  // 아이템 — 시간뱃지 | 구분선 | 내용
  const items = s.content?.items || [];
  const startY = 1.8;
  const rowH = Math.min(0.6, (SH - startY - 0.8) / Math.max(items.length, 1));

  items.forEach((item: any, i: number) => {
    const y = startY + i * rowH;
    const num = item.number || String(i + 1).padStart(2, "0");

    // 행 배경
    addCard(slide, pptx, 1.5, y, SW - 3.0, rowH - 0.06, { bg: C.SURFACE, borderColor: C.SURFACE });

    // 시간 뱃지 (파란 텍스트)
    slide.addText(num, {
      x: 1.7, y, w: 0.7, h: rowH - 0.06,
      fontSize: 14, fontFace: FONT, color: C.ACCENT2, bold: true, valign: "middle",
    });

    // 세로 구분선
    slide.addShape("rect" as any, {
      x: 2.6, y: y + 0.1, w: 0.02, h: rowH - 0.26,
      fill: { color: C.BORDER },
    });

    // 내용
    slide.addText(item.title, {
      x: 2.85, y, w: SW - 5.5, h: rowH - 0.06,
      fontSize: 14, fontFace: FONT, color: C.TEXT, valign: "middle",
    });
  });
}

function buildSectionDivider(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);

  // 악센트 바
  addTitleBar(slide, "", 0.45);

  // 섹션 제목 (큰 폰트)
  slide.addText(s.title, {
    x: PAD, y: 0.7, w: CW, h: 1.0,
    fontSize: 30, fontFace: FONT, color: C.TEXT, bold: true,
  });

  // 서브헤더
  if (s.subtitle) {
    addSubHeader(slide, s.subtitle, 1.85);
  }

  // 중앙 설명 카드 (content가 있을 때)
  if (s.content?.body) {
    addCard(slide, pptx, PAD, 2.8, CW, 2.5);
    slide.addText(s.content.body, {
      x: PAD + 0.3, y: 2.95, w: CW - 0.6, h: 2.2,
      fontSize: 14, fontFace: FONT, color: C.TEXT_DIM,
      lineSpacingMultiple: 1.4,
    });
  }
}

function buildKeyMetrics(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  if (s.subtitle) addSubHeader(slide, s.subtitle, 1.45);

  const metrics = s.content?.metrics || [];
  const count = Math.min(metrics.length, 4);
  const gap = 0.2;
  const cardW = (CW - (count - 1) * gap) / count;
  const cardY = 1.95;
  const cardH = 3.5;

  metrics.slice(0, 4).forEach((m: any, i: number) => {
    const x = PAD + i * (cardW + gap);
    const col = colorFor(m.color);

    addCard(slide, pptx, x, cardY, cardW, cardH, { borderColor: C.BORDER });

    // 상단 악센트 라인
    slide.addShape("rect" as any, {
      x: x + 0.15, y: cardY + 0.15, w: cardW - 0.3, h: 0.04,
      fill: { color: col },
    });

    // 값
    slide.addText(m.value, {
      x, y: cardY + 0.5, w: cardW, h: 1.1,
      fontSize: 36, fontFace: FONT, color: col, bold: true, align: "center",
    });

    // 라벨
    slide.addText(m.label, {
      x, y: cardY + 1.6, w: cardW, h: 0.45,
      fontSize: 14, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
    });

    // 보조
    if (m.sub) {
      slide.addText(m.sub, {
        x: x + 0.1, y: cardY + 2.2, w: cardW - 0.2, h: 0.7,
        fontSize: 11, fontFace: FONT, color: C.TEXT_DIM, align: "center", lineSpacingMultiple: 1.2,
      });
    }
  });

  if (s.content?.footer) {
    addCallout(slide, pptx, PAD, SH - 1.0, CW, 0.55, C.ACCENT);
    slide.addText(s.content.footer, {
      x: PAD + 0.2, y: SH - 0.95, w: CW - 0.4, h: 0.45,
      fontSize: 11, fontFace: FONT, color: C.TEXT_DIM,
    });
  }
}

function buildDataTable(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const { headers = [], rows = [], footer } = s.content || {};
  const tableRows: PptxGenJS.TableRow[] = [];

  tableRows.push(headers.map((h: string) => ({
    text: h,
    options: {
      fontSize: 12, fontFace: FONT, color: C.TEXT,
      fill: { color: C.ACCENT_DIM }, bold: true, align: "center" as const,
      border: { type: "solid" as const, pt: 0.5, color: C.BORDER },
      margin: [5, 8, 5, 8] as [number, number, number, number],
    },
  })));

  rows.forEach((row: string[], ri: number) => {
    tableRows.push(row.map((cell: string, ci: number) => {
      let cc = C.TEXT;
      if (cell.startsWith("+")) cc = C.SUCCESS;
      else if (cell.startsWith("-") && cell.includes("%")) cc = C.DANGER;
      return {
        text: cell,
        options: {
          fontSize: 11, fontFace: FONT, color: cc,
          fill: { color: ri % 2 === 0 ? C.SURFACE : C.BG },
          align: (ci === 0 ? "left" : "center") as PptxGenJS.HAlign,
          border: { type: "solid" as const, pt: 0.5, color: C.BORDER },
          margin: [4, 8, 4, 8] as [number, number, number, number],
        },
      };
    }));
  });

  if (tableRows.length > 0) {
    const colCount = headers.length;
    const firstW = Math.min(3.5, CW * 0.3);
    const otherW = (CW - firstW) / Math.max(colCount - 1, 1);
    const colWidths = colCount > 1 ? [firstW, ...Array(colCount - 1).fill(otherW)] : [CW];
    const rowH = Math.min(0.5, (SH - 2.0) / Math.max(tableRows.length, 1));

    slide.addTable(tableRows, {
      x: PAD, y: 1.55, w: CW, colW: colWidths, rowH,
      border: { type: "solid", pt: 0.5, color: C.BORDER },
    });
  }

  if (footer) {
    slide.addText(footer, {
      x: PAD, y: SH - 0.7, w: CW, h: 0.35,
      fontSize: 10, fontFace: FONT, color: C.TEXT_MUTED, italic: true,
    });
  }
}

function buildChartBar(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const { labels = [], datasets = [] } = s.content || {};
  if (labels.length > 0 && datasets.length > 0) {
    const chartData = datasets.map((ds: any, i: number) => ({ name: ds.name || `Series ${i + 1}`, labels, values: ds.values || [] }));
    slide.addChart(pptx.charts.BAR, chartData, {
      x: PAD, y: 1.5, w: CW, h: SH - 2.3,
      showTitle: false, showValue: true, valueFontSize: 10, valueFontColor: C.TEXT,
      catAxisLabelColor: C.TEXT_DIM, catAxisLabelFontSize: 11,
      valAxisLabelColor: C.TEXT_MUTED, valAxisLabelFontSize: 9,
      chartColors: [C.ACCENT, C.CYAN, C.SUCCESS, C.WARNING],
      plotArea: { fill: { color: C.BG } },
      showLegend: datasets.length > 1, legendPos: "b", legendColor: C.TEXT_DIM,
    });
  }
}

function buildChartPie(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const { labels = [], values = [] } = s.content || {};
  const colors = [C.ACCENT, C.CYAN, C.SUCCESS, C.WARNING, C.DANGER, C.SURFACE2];
  if (labels.length > 0) {
    slide.addChart(pptx.charts.DOUGHNUT, [{ name: s.title, labels, values }], {
      x: PAD, y: 1.5, w: 6.0, h: 5.0,
      showTitle: false, showPercent: true, showLegend: false,
      chartColors: colors, dataLabelColor: C.TEXT, dataLabelFontSize: 11,
    });
    const lx = PAD + 6.5;
    addCard(slide, pptx, lx, 1.5, CW - 6.5, labels.length * 0.55 + 0.3);
    labels.forEach((label: string, i: number) => {
      const ly = 1.7 + i * 0.55;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: lx + 0.2, y: ly + 0.02, w: 0.2, h: 0.2,
        fill: { color: colors[i % colors.length] }, rectRadius: 0.04,
      });
      slide.addText(label, { x: lx + 0.55, y: ly, w: CW - 8.2, h: 0.25, fontSize: 12, fontFace: FONT, color: C.TEXT });
      slide.addText(`${values[i]}%`, { x: lx + CW - 8.0, y: ly, w: 0.8, h: 0.25, fontSize: 12, fontFace: FONT, color: colors[i % colors.length], bold: true, align: "right" });
    });
  }
}

function buildTwoColumn(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const { left, right } = s.content || {};
  const gap = 0.25;
  const colW = (CW - gap) / 2;
  const cardY = 1.55;
  const cardH = SH - cardY - 0.7;

  [{ col: left, x: PAD }, { col: right, x: PAD + colW + gap }].forEach(({ col, x }) => {
    if (!col) return;
    const bc = col.borderColor || C.ACCENT;

    addCard(slide, pptx, x, cardY, colW, cardH, { borderColor: bc });

    // 헤더 배경
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.01, y: cardY + 0.01, w: colW - 0.02, h: 0.55,
      fill: { color: C.SURFACE2 }, rectRadius: 0.1,
    });

    slide.addText(col.title || "", {
      x: x + 0.2, y: cardY + 0.05, w: colW - 0.4, h: 0.45,
      fontSize: 14, fontFace: FONT, color: bc, bold: true,
    });

    const items: string[] = col.items || [];
    items.forEach((item: string, i: number) => {
      const iy = cardY + 0.75 + i * 0.4;
      addBadge(slide, pptx, x + 0.15, iy + 0.03, "\u2022", bc);
      slide.addText(item, {
        x: x + 0.55, y: iy, w: colW - 0.75, h: 0.35,
        fontSize: 11, fontFace: FONT, color: C.TEXT, lineSpacingMultiple: 1.15,
      });
    });

    if (col.summary) {
      const sy = cardY + cardH - 0.55;
      slide.addShape("rect" as any, { x: x + 0.15, y: sy - 0.05, w: colW - 0.3, h: 0.01, fill: { color: C.BORDER } });
      slide.addText(col.summary, {
        x: x + 0.15, y: sy + 0.02, w: colW - 0.3, h: 0.4,
        fontSize: 10, fontFace: FONT, color: bc, italic: true,
      });
    }
  });
}

function buildBulletDetail(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  // 서브헤더 (있으면)
  let contentY = 1.55;
  if (s.subtitle) {
    addSubHeader(slide, s.subtitle, 1.45);
    contentY = 1.95;
  }

  const items = s.content?.items || [];
  const availH = SH - contentY - 0.6;

  // 메인 카드
  addCard(slide, pptx, PAD, contentY, CW, availH);

  let yPos = contentY + 0.2;

  items.forEach((item: { title: string; body: string | string[] }, idx: number) => {
    const bodyText = Array.isArray(item.body) ? item.body.join("\n") : item.body;
    const lineCount = bodyText.split("\n").length;
    const bodyH = Math.min(Math.max(0.35, lineCount * 0.22), 1.2);

    // 번호 뱃지
    addBadge(slide, pptx, PAD + 0.2, yPos + 0.02, String(idx + 1));

    // 제목 (파란색)
    slide.addText(item.title, {
      x: PAD + 0.65, y: yPos, w: CW - 1.0, h: 0.35,
      fontSize: 14, fontFace: FONT, color: C.ACCENT2, bold: true,
    });
    yPos += 0.38;

    // 본문
    slide.addText(bodyText, {
      x: PAD + 0.65, y: yPos, w: CW - 1.0, h: bodyH,
      fontSize: 11, fontFace: FONT, color: C.TEXT_DIM, lineSpacingMultiple: 1.35,
    });
    yPos += bodyH + 0.15;
  });
}

function buildTimeline(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const phases = s.content?.phases || [];
  const count = Math.min(phases.length, 6);
  if (count === 0) return;

  const lineY = 2.3;
  const startX = PAD + 0.5;
  const totalW = CW - 1.0;

  slide.addShape("rect" as any, { x: startX, y: lineY, w: totalW, h: 0.035, fill: { color: C.BORDER } });

  const spacing = count > 1 ? totalW / (count - 1) : totalW;
  phases.forEach((phase: any, i: number) => {
    const x = startX + i * spacing;
    const isActive = phase.active || false;
    const dotCol = isActive ? C.SUCCESS : C.ACCENT;

    // 노드
    slide.addShape(pptx.shapes.OVAL, { x: x - 0.14, y: lineY - 0.12, w: 0.28, h: 0.28, fill: { color: dotCol } });

    // 라벨
    slide.addText(phase.label || "", {
      x: x - 1.0, y: lineY - 0.6, w: 2.0, h: 0.35,
      fontSize: 11, fontFace: FONT, color: isActive ? C.SUCCESS : C.TEXT_DIM, align: "center", bold: isActive,
    });

    // 카드
    const cardW = Math.min(spacing - 0.25, 3.0);
    const cardX = x - cardW / 2;
    const cardY = 2.85;
    const cardH = SH - cardY - 0.8;

    addCard(slide, pptx, cardX, cardY, cardW, cardH, { borderColor: isActive ? C.SUCCESS : C.BORDER });

    slide.addText(phase.title || "", {
      x: cardX + 0.12, y: cardY + 0.12, w: cardW - 0.24, h: 0.38,
      fontSize: 13, fontFace: FONT, color: C.TEXT, bold: true,
    });

    slide.addShape("rect" as any, { x: cardX + 0.12, y: cardY + 0.55, w: cardW - 0.24, h: 0.01, fill: { color: C.BORDER } });

    (phase.items || []).forEach((item: string, j: number) => {
      slide.addText(`\u2022 ${item}`, {
        x: cardX + 0.12, y: cardY + 0.65 + j * 0.32, w: cardW - 0.24, h: 0.28,
        fontSize: 10, fontFace: FONT, color: C.TEXT_DIM,
      });
    });
  });

  if (s.content?.footer) {
    addCallout(slide, pptx, PAD, SH - 0.95, CW, 0.5, C.SUCCESS);
    slide.addText(s.content.footer, {
      x: PAD + 0.2, y: SH - 0.9, w: CW - 0.4, h: 0.4,
      fontSize: 11, fontFace: FONT, color: C.TEXT_DIM,
    });
  }
}

function buildProcessFlow(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const steps = s.content?.steps || [];
  const count = Math.min(steps.length, 5);
  if (count === 0) return;

  const arrowW = 0.45;
  const boxW = (CW - (count - 1) * arrowW) / count;
  const boxH = SH - 2.2;
  const boxY = 1.6;

  steps.slice(0, 5).forEach((step: any, i: number) => {
    const x = PAD + i * (boxW + arrowW);
    addCard(slide, pptx, x, boxY, boxW, boxH);

    // 넘버 뱃지
    addBadge(slide, pptx, x + boxW / 2 - 0.16, boxY + 0.2, String(i + 1));

    slide.addText(step.title || "", {
      x: x + 0.08, y: boxY + 0.65, w: boxW - 0.16, h: 0.4,
      fontSize: 13, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
    });

    if (step.tech) {
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + boxW * 0.12, y: boxY + 1.15, w: boxW * 0.76, h: 0.3,
        fill: { color: C.CODE_BG }, rectRadius: 0.04,
      });
      slide.addText(step.tech, {
        x: x + boxW * 0.12, y: boxY + 1.15, w: boxW * 0.76, h: 0.3,
        fontSize: 10, fontFace: FONT_CODE, color: C.CYAN, align: "center",
      });
    }

    if (step.metric) {
      slide.addText(step.metric, {
        x: x + 0.08, y: boxY + boxH - 0.55, w: boxW - 0.16, h: 0.35,
        fontSize: 10, fontFace: FONT, color: C.TEXT_MUTED, align: "center",
      });
    }

    if (i < count - 1) {
      slide.addText("\u25B6", {
        x: x + boxW + (arrowW - 0.3) / 2, y: boxY + boxH / 2 - 0.15, w: 0.3, h: 0.3,
        fontSize: 14, fontFace: FONT, color: C.ACCENT, align: "center",
      });
    }
  });

  if (s.content?.footer) {
    addCallout(slide, pptx, PAD, SH - 0.85, CW, 0.45, C.ACCENT);
    slide.addText(s.content.footer, {
      x: PAD + 0.2, y: SH - 0.8, w: CW - 0.4, h: 0.35,
      fontSize: 10, fontFace: FONT, color: C.TEXT_DIM,
    });
  }
}

function buildClosing(pptx: PptxGenJS, s: DeckSlide, spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });

  // 배경 장식 원
  slide.addShape(pptx.shapes.OVAL, {
    x: SW / 2 - 3.5, y: 0.8, w: 7.0, h: 7.0,
    fill: { color: C.SURFACE },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: SW / 2 - 2.8, y: 1.5, w: 5.6, h: 5.6,
    fill: { color: C.BG },
  });

  // 메인 인사
  slide.addText(s.content?.greeting || "감사합니다", {
    x: 0, y: 0.8, w: SW, h: 1.0,
    fontSize: 36, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
  });

  // 부제
  const contacts: string[] = s.content?.contacts || [];
  if (contacts.length > 0) {
    slide.addText(contacts[0] || "", {
      x: 0, y: 1.85, w: SW, h: 0.4,
      fontSize: 14, fontFace: FONT, color: C.TEXT_DIM, align: "center",
    });
  }

  // 악센트 바 (센터)
  slide.addShape("rect" as any, {
    x: SW / 2 - 0.5, y: 2.4, w: 1.0, h: 0.05,
    fill: { color: C.ACCENT },
  });

  // 서브 텍스트
  if (contacts.length > 1) {
    slide.addText("여러분의 손에는 이미", {
      x: 0, y: 2.65, w: SW, h: 0.35,
      fontSize: 13, fontFace: FONT, color: C.TEXT_DIM, align: "center",
    });
  }

  // 요약 카드들
  const summary: string[] = s.content?.summary || [];
  summary.forEach((line: string, i: number) => {
    const cy = 3.2 + i * 0.55;
    addCard(slide, pptx, SW / 2 - 4.0, cy, 8.0, 0.48);
    slide.addText(line, {
      x: SW / 2 - 3.7, y: cy + 0.02, w: 7.4, h: 0.4,
      fontSize: 13, fontFace: FONT, color: C.TEXT,
    });
  });

  // Q&A 버튼
  if (summary.length > 0) {
    const qaY = 3.2 + summary.length * 0.55 + 0.35;
    slide.addText("가 들려있습니다.", {
      x: 0, y: qaY - 0.15, w: SW, h: 0.3,
      fontSize: 13, fontFace: FONT, color: C.TEXT_DIM, align: "center",
    });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: SW / 2 - 4.0, y: qaY + 0.25, w: 8.0, h: 0.55,
      fill: { color: C.ACCENT }, rectRadius: 0.08,
    });
    slide.addText("Q&A", {
      x: SW / 2 - 4.0, y: qaY + 0.25, w: 8.0, h: 0.55,
      fontSize: 18, fontFace: FONT, color: C.TEXT, bold: true, align: "center",
    });
  }
}

function buildGeneric(pptx: PptxGenJS, s: DeckSlide, _spec: DeckSpec, sn: number, total: number) {
  const slide = pptx.addSlide({ masterName: "MAIN" });
  addFooter(slide, sn, total);
  addTitleBar(slide, s.title);

  const body = s.content?.text || s.content?.body || "";
  if (body) {
    addCard(slide, pptx, PAD, 1.55, CW, SH - 2.3);
    slide.addText(body, {
      x: PAD + 0.25, y: 1.7, w: CW - 0.5, h: SH - 2.6,
      fontSize: 13, fontFace: FONT, color: C.TEXT_DIM, lineSpacingMultiple: 1.35, valign: "top",
    });
  }
}

// ─── 메인 ───
type Builder = (pptx: PptxGenJS, s: DeckSlide, spec: DeckSpec, sn: number, total: number) => void;

const builders: Record<string, Builder> = {
  cover: buildCover, toc: buildToc, "section-divider": buildSectionDivider,
  "key-metrics": buildKeyMetrics, "data-table": buildDataTable,
  "chart-bar": buildChartBar, "chart-pie": buildChartPie,
  "two-column": buildTwoColumn, "bullet-detail": buildBulletDetail,
  timeline: buildTimeline, "process-flow": buildProcessFlow, closing: buildClosing,
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) { console.error("Usage: npx tsx scripts/generate-deck.ts <deck-spec.json> [--format pptx|pdf|both]"); process.exit(1); }

  const specPath = args[0];
  const formatIdx = args.indexOf("--format");
  const format = formatIdx >= 0 ? args[formatIdx + 1] || "pptx" : "pptx";

  if (!fs.existsSync(specPath)) { console.error(`\u274C ${specPath} not found`); process.exit(1); }

  const spec: DeckSpec = JSON.parse(fs.readFileSync(specPath, "utf-8"));
  const projectDir = path.dirname(specPath);
  const projectId = path.basename(projectDir);
  const total = spec.slides.length;

  console.log(`\uD83D\uDCCA ${spec.title} (${total}\uC7A5)`);

  const pptx = new PptxGenJS();
  pptx.author = spec.author || "vg-deck";
  pptx.title = spec.title;
  pptx.layout = "LAYOUT_WIDE";

  pptx.defineSlideMaster({ title: "MAIN", background: { color: C.BG } });

  for (let i = 0; i < total; i++) {
    const s = spec.slides[i];
    (builders[s.type] || buildGeneric)(pptx, s, spec, i + 1, total);
  }

  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const pptxPath = path.join(outputDir, `${projectId}.pptx`);

  if (format === "pptx" || format === "both") {
    await pptx.writeFile({ fileName: pptxPath });
    console.log(`\u2705 PPTX: ${pptxPath}`);
  }
  if (format === "pdf" || format === "both") {
    if (format === "pdf") await pptx.writeFile({ fileName: pptxPath });
    try {
      execSync(`which libreoffice`, { stdio: "ignore" });
      execSync(`libreoffice --headless --convert-to pdf "${pptxPath}" --outdir "${outputDir}"`, { stdio: "inherit" });
    } catch { console.log(`\u2139\uFE0F PDF: brew install --cask libreoffice`); }
    if (format === "pdf" && fs.existsSync(path.join(outputDir, `${projectId}.pdf`))) fs.unlinkSync(pptxPath);
  }

  const tc: Record<string, number> = {};
  spec.slides.forEach(s => { tc[s.type] = (tc[s.type] || 0) + 1; });
  console.log(`\u2705 ${total}\uC7A5 | ${Object.entries(tc).map(([t, c]) => c > 1 ? `${t}\u00D7${c}` : t).join(", ")}`);
}

main().catch(e => { console.error("\u274C", e); process.exit(1); });
