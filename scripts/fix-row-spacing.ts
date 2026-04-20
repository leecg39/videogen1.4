/**
 * fix-row-spacing.ts -- Row Stack 내 카드↔화살표 간격 보정
 *
 * 문제:
 *   Stack(row) 안에 FrameBox/카드 + ArrowConnector가 있을 때
 *   maxWidth가 없으면 화면 전체로 퍼져서 카드가 멀리 떨어짐.
 *
 * 규칙:
 *   1. Row Stack에 maxWidth가 없으면 자식 수 기반으로 자동 설정
 *      - 카드 2개 + 화살표 1개: maxWidth 500
 *      - 카드 3개 + 화살표 2개: maxWidth 700
 *      - 카드 4개+: maxWidth 900
 *   2. Row Stack gap > 16이면 12로 축소
 *   3. Row Stack 자식 중 컨테이너(Stack col)를 FrameBox로 교체 권장은
 *      스크립트 수준에서 불가하므로, maxWidth를 180~200으로 제한
 *
 * 사용법:
 *   npx tsx scripts/fix-row-spacing.ts data/{id}/scenes-v2.json
 */

import * as fs from "fs";

interface StackNode {
  id: string;
  type: string;
  layout?: Record<string, any>;
  style?: Record<string, any>;
  data?: Record<string, any>;
  motion?: Record<string, any>;
  children?: StackNode[];
  [key: string]: unknown;
}

const CONNECTOR_TYPES = new Set(["ArrowConnector", "LineConnector", "Icon"]);
const CARD_TYPES = new Set([
  "FrameBox", "IconCard", "StatCard", "CompareCard",
  "ProcessStepCard", "InsightTile", "WarningCard",
]);

let totalFixes = 0;

function isRowStack(node: StackNode): boolean {
  return node.type === "Stack" && node.layout?.direction === "row";
}

function hasConnector(children: StackNode[]): boolean {
  return children.some(c => CONNECTOR_TYPES.has(c.type));
}

function countCards(children: StackNode[]): number {
  return children.filter(c =>
    CARD_TYPES.has(c.type) ||
    (c.type === "Stack" && c.layout?.direction === "column") ||
    (c.type === "FrameBox")
  ).length;
}

function fixRowStack(node: StackNode): void {
  if (!node.children || node.children.length === 0) return;

  if (isRowStack(node) && hasConnector(node.children)) {
    const cards = countCards(node.children);
    if (!node.layout) node.layout = {};

    // maxWidth 보정
    if (!node.layout.maxWidth && !node.style?.maxWidth) {
      const maxW = cards <= 2 ? 500 : cards <= 3 ? 700 : 900;
      node.layout.maxWidth = maxW;
      totalFixes++;
    }

    // gap 보정 (16 초과면 12로)
    if (node.layout.gap && node.layout.gap > 16) {
      node.layout.gap = 12;
      totalFixes++;
    }

    // 자식 중 컨테이너(Stack col)에 maxWidth 제한
    for (const child of node.children) {
      if (child.type === "Stack" && child.layout?.direction === "column") {
        if (!child.layout.maxWidth && !child.style?.maxWidth) {
          if (!child.style) child.style = {};
          child.style.maxWidth = 200;
          totalFixes++;
        }
      }
    }
  }

  // 모든 Row Stack (커넥터 없어도) gap 과도한 경우 보정
  if (isRowStack(node) && node.layout?.gap && node.layout.gap > 24) {
    node.layout.gap = 20;
    totalFixes++;
  }

  // 재귀
  for (const child of node.children) {
    fixRowStack(child);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/fix-row-spacing.ts data/{id}/scenes-v2.json");
  process.exit(1);
}

const scenes: Array<{ stack_root?: StackNode; [key: string]: any }> =
  JSON.parse(fs.readFileSync(filePath, "utf-8"));

for (const scene of scenes) {
  if (scene.stack_root) {
    fixRowStack(scene.stack_root);
  }
}

fs.writeFileSync(filePath, JSON.stringify(scenes, null, 2));
console.log(`✅ fix-row-spacing: ${totalFixes}건 보정 완료`);
