// svg-sanitize.ts — line-art SVG 정규화/검증
//
// svg-forge 에서 Claude 가 생성한 <svg> 응답을 받아 아래 규격으로 강제 교정한다:
//   - viewBox="0 0 120 120" (지정된 값이 아니면 warn + 강제)
//   - stroke="currentColor" / stroke-width="3.5" / stroke-linecap="round" / stroke-linejoin="round"
//   - fill 은 "none" 또는 "currentColor" 만 허용
//   - 허용 primitive: path, line, circle, rect, polyline, polygon, ellipse, g
//   - 금지: text, filter, mask, defs, gradient, image, foreignObject
//   - style/attr 주석/네임스페이스 제거

export interface SanitizeResult {
  ok: boolean;
  svg: string;
  strokeCount: number;
  warnings: string[];
  errors: string[];
}

const ALLOWED_TAGS = new Set([
  "svg", "path", "line", "circle", "rect", "polyline", "polygon", "ellipse",
  // <g> 는 제외 — grouping 은 랩퍼에서 처리하고 각 primitive 에 stroke 속성을 직접 주입한다.
  // ALLOWED 에 포함 시 닫는 태그 </g> 페어 관리가 복잡해지고 JSX 빌드 오류 유발.
]);

const FORBIDDEN_TAGS = new Set([
  "script", "text", "tspan", "foreignObject", "image", "use", "symbol",
  "filter", "mask", "defs", "clipPath", "linearGradient", "radialGradient",
  "pattern", "animate", "animateTransform", "set", "feGaussianBlur",
]);

const STROKE_TAGS = new Set(["path", "line", "circle", "rect", "polyline", "polygon", "ellipse"]);

const STROKE_DEFAULTS = {
  stroke: "currentColor",
  "stroke-width": "3.5",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  fill: "none",
};

export function sanitizeSvg(raw: string, concept?: string): SanitizeResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. 마크다운 fence 제거
  let body = raw.trim();
  body = body.replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  // 2. <svg> 루트 매칭
  const svgOpenRe = /<svg\b[^>]*>/i;
  const openMatch = body.match(svgOpenRe);
  if (!openMatch) {
    errors.push("no <svg> root element found");
    return { ok: false, svg: body, strokeCount: 0, warnings, errors };
  }
  const closeIdx = body.lastIndexOf("</svg>");
  if (closeIdx < 0) {
    errors.push("no </svg> close tag");
    return { ok: false, svg: body, strokeCount: 0, warnings, errors };
  }
  const svgInner = body.slice(openMatch.index! + openMatch[0].length, closeIdx);

  // 3. 금지 태그 검사
  for (const tag of FORBIDDEN_TAGS) {
    const re = new RegExp(`<${tag}\\b`, "i");
    if (re.test(svgInner)) {
      errors.push(`forbidden tag <${tag}>`);
    }
  }
  if (errors.length) {
    return { ok: false, svg: body, strokeCount: 0, warnings, errors };
  }

  // 4. primitive 태그만 수집
  const tagRe = /<(\w+)\b([^>]*)>/gi;
  let strokeCount = 0;
  const primitives: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(svgInner)) != null) {
    const tag = m[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      warnings.push(`dropped tag <${tag}>`);
      continue;
    }
    if (tag === "svg") continue;
    // attrs 끝의 자체닫기 슬래시 제거
    let attrs = m[2].replace(/\s*\/\s*$/, "").trim();
    if (attrs.length) attrs = " " + attrs;

    if (STROKE_TAGS.has(tag)) {
      strokeCount++;
      attrs = normalizeStrokeAttrs(attrs);
    }

    const selfClose = ["path", "line", "circle", "rect", "polyline", "polygon", "ellipse"].includes(tag);
    primitives.push(selfClose ? `  <${tag}${attrs} />` : `  <${tag}${attrs}>`);
  }

  if (strokeCount === 0) {
    errors.push("no stroke primitive shapes found");
  }
  if (strokeCount > 10) {
    warnings.push(`high primitive count ${strokeCount} (plan caps at 8)`);
  }

  // 5. 루트 재구성 — viewBox 강제 0 0 120 120
  const vbRe = /viewBox\s*=\s*"([^"]+)"/i;
  const vbMatch = openMatch[0].match(vbRe);
  const viewBox = vbMatch ? vbMatch[1].trim() : "0 0 120 120";
  if (viewBox !== "0 0 120 120") {
    warnings.push(`non-standard viewBox "${viewBox}" → enforced 0 0 120 120`);
  }

  const commentConcept = concept ? `  <!-- concept: ${concept.replace(/-->/g, "— —")} -->\n` : "";
  const sanitized =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">\n` +
    commentConcept +
    primitives.join("\n") +
    `\n</svg>\n`;

  return {
    ok: errors.length === 0,
    svg: sanitized,
    strokeCount,
    warnings,
    errors,
  };
}

function normalizeStrokeAttrs(attrs: string): string {
  // attrs 는 "fill='none' stroke='...' d='...'" 같은 자유 포맷. 앞뒤 공백 정리.
  // 1. 기존 stroke/fill/stroke-width/style 속성 제거 (single + double quote 모두)
  let a = attrs
    .replace(/\s*stroke(-[a-z]+)?\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\s*fill\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\s*style\s*=\s*("[^"]*"|'[^']*')/gi, "");
  // 2. 잔여 자체닫기 슬래시 제거 + trim
  a = a.replace(/\s*\/\s*$/, "").replace(/\s+/g, " ").trim();
  // 3. 표준 stroke 속성 주입
  const extras =
    ` fill="${STROKE_DEFAULTS.fill}"` +
    ` stroke="${STROKE_DEFAULTS.stroke}"` +
    ` stroke-width="${STROKE_DEFAULTS["stroke-width"]}"` +
    ` stroke-linecap="${STROKE_DEFAULTS["stroke-linecap"]}"` +
    ` stroke-linejoin="${STROKE_DEFAULTS["stroke-linejoin"]}"`;
  return (a.length ? " " + a : "") + extras;
}

/** viewBox/stroke 규격 검증 (저장된 SVG 파일용) */
export function validateSavedSvg(raw: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!/viewBox\s*=\s*"0 0 120 120"/.test(raw)) reasons.push("viewBox not 0 0 120 120");
  if (/<text\b/i.test(raw)) reasons.push("contains <text>");
  if (/<filter\b/i.test(raw)) reasons.push("contains <filter>");
  if (/<(linear|radial)Gradient\b/i.test(raw)) reasons.push("contains gradient");
  // stroke-width 3.5 강제
  const swMatches = raw.match(/stroke-width\s*=\s*"([^"]+)"/g) || [];
  for (const s of swMatches) {
    const v = s.match(/"([^"]+)"/)?.[1];
    if (v !== "3.5") reasons.push(`stroke-width="${v}" (expected 3.5)`);
  }
  // currentColor 강제
  const strokeMatches = raw.match(/stroke\s*=\s*"([^"]+)"/g) || [];
  for (const s of strokeMatches) {
    const v = s.match(/"([^"]+)"/)?.[1];
    if (v !== "currentColor") reasons.push(`stroke="${v}" (expected currentColor)`);
  }
  return { ok: reasons.length === 0, reasons };
}
