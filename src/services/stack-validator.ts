// Stack Tree Validator — Claude 생성 stack_root 검증
import type { StackNode } from "@/types/stack-nodes";

const CONTAINER_TYPES = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "Overlay",
  "AnchorBox", "SafeArea", "FrameBox",
]);

const KNOWN_NODE_TYPES = new Set([
  // Containers
  "SceneRoot", "Stack", "Grid", "Split", "Overlay",
  "AnchorBox", "SafeArea", "FrameBox",
  // Text
  "Kicker", "Headline", "RichText", "BodyText",
  "BulletList", "StatNumber", "QuoteText", "FooterCaption",
  // Shapes
  "Divider", "Badge", "Pill",
  // Media
  "Icon", "RingChart",
  // Charts
  "ProgressBar", "CompareBars", "MiniBarChart",
  // Composites
  "IconCard", "StatCard", "CompareCard",
  "ProcessStepCard", "InsightTile", "WarningCard",
  // Connectors
  "ArrowConnector", "LineConnector",
  // Accents
  "AccentGlow", "AccentRing", "Backplate", "Spacer",
]);

// Required data fields per node type
const REQUIRED_DATA: Record<string, string[]> = {
  Headline: ["text"],
  Kicker: ["text"],
  BodyText: ["text"],
  RichText: ["segments"],
  QuoteText: ["text"],
  FooterCaption: ["text"],
  StatNumber: ["value"],
  BulletList: ["items"],
  Badge: ["text"],
  Pill: ["text"],
  Icon: ["name"],
  RingChart: ["value"],
  ProgressBar: ["value"],
  CompareBars: ["items"],
  MiniBarChart: ["items"],
  IconCard: ["title"],
  StatCard: ["value"],
  CompareCard: ["left", "right"],
  ProcessStepCard: ["title"],
  InsightTile: ["title"],
  WarningCard: ["title"],
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStackTree(
  node: StackNode,
  durationFrames: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  function walk(n: StackNode, depth: number, path: string): void {
    // Check type
    if (!KNOWN_NODE_TYPES.has(n.type)) {
      errors.push(`${path}: unknown type "${n.type}"`);
    }

    // Check id uniqueness
    if (!n.id) {
      errors.push(`${path}: missing id`);
    } else if (seenIds.has(n.id)) {
      errors.push(`${path}: duplicate id "${n.id}"`);
    } else {
      seenIds.add(n.id);
    }

    // Check depth
    if (depth > 6) {
      errors.push(`${path}: tree depth exceeds 6 (depth=${depth})`);
    }

    // Check required data fields
    const requiredFields = REQUIRED_DATA[n.type];
    if (requiredFields) {
      for (const field of requiredFields) {
        if (!n.data || n.data[field] == null) {
          errors.push(`${path}: missing required data.${field} for ${n.type}`);
        }
      }
    }

    // Check enterAt within duration
    if (n.motion?.enterAt != null) {
      if (n.motion.enterAt < 0) {
        errors.push(`${path}: enterAt is negative (${n.motion.enterAt})`);
      }
      if (n.motion.enterAt > durationFrames) {
        warnings.push(
          `${path}: enterAt (${n.motion.enterAt}) exceeds durationFrames (${durationFrames})`,
        );
      }
    }

    // ── Text overflow checks ──
    if (n.type === "Headline" && n.data?.text) {
      const len = String(n.data.text).length;
      if (len > 30) {
        warnings.push(`${path}: Headline text too long (${len} chars, max 30)`);
      }
    }
    if (n.type === "BodyText" && n.data?.text) {
      const len = String(n.data.text).length;
      if (len > 80) {
        warnings.push(`${path}: BodyText too long (${len} chars, max 80)`);
      }
    }
    if (n.type === "BulletList" && Array.isArray(n.data?.items)) {
      for (let idx = 0; idx < n.data.items.length; idx++) {
        const item = String(n.data.items[idx]);
        if (item.length > 20) {
          warnings.push(`${path}: BulletList item[${idx}] too long (${item.length} chars, max 20)`);
        }
      }
    }

    // ── Subtitle safe zone check ──
    if (n.layout?.anchor?.includes("bottom")) {
      const offsetY = n.layout.offsetY ?? 0;
      // Bottom-anchored nodes within 160px of canvas bottom overlap the subtitle bar
      if (offsetY > -160) {
        warnings.push(`${path}: anchor "${n.layout.anchor}" overlaps subtitle safe zone (bottom 160px)`);
      }
    }

    // ── Split balance check ──
    if (n.type === "Split" && Array.isArray(n.layout?.ratio)) {
      const ratio = n.layout.ratio;
      const total = ratio.reduce((a: number, b: number) => a + b, 0);
      if (total > 0) {
        const minRatio = Math.min(...ratio) / total;
        if (minRatio < 0.2) {
          warnings.push(`${path}: Split ratio too extreme (min segment is ${(minRatio * 100).toFixed(0)}% of total)`);
        }
      }
    }

    // Check container children
    const isContainer = CONTAINER_TYPES.has(n.type);
    if (isContainer) {
      // ── Empty FrameBox → error ──
      if (n.type === "FrameBox" && (!n.children || n.children.length === 0)) {
        errors.push(`${path}: FrameBox has no children`);
      } else if (!n.children || n.children.length === 0) {
        warnings.push(`${path}: container "${n.type}" has no children`);
      } else {
        // ── Grid overflow check ──
        if (n.type === "Grid") {
          const columns = n.layout?.columns ?? 1;
          if (n.children.length > columns * 6) {
            warnings.push(`${path}: too many grid items (${n.children.length} items, max ${columns * 6})`);
          }
        }

        for (let i = 0; i < n.children.length; i++) {
          walk(n.children[i], depth + 1, `${path}.children[${i}]`);
        }
      }
    } else if (n.children && n.children.length > 0) {
      warnings.push(`${path}: leaf node "${n.type}" has children (ignored)`);
    }
  }

  // Root must be SceneRoot
  if (node.type !== "SceneRoot") {
    errors.push(`root: expected type "SceneRoot", got "${node.type}"`);
  }

  walk(node, 0, "root");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
