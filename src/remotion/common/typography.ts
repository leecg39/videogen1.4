// Typography Context — Video Design OS v1
// TypographyScale을 React Context로 제공하여 노드 렌더러가 사용

import type React from "react";
import { createContext, useContext } from "react";
import type { TypographyScale, TypographyRole } from "./theme";
import { getTypography } from "./theme";

export const TypographyContext = createContext<TypographyScale>(
  getTypography("dark-neon"),
);

/** 현재 씬의 타이포그래피 스케일에 접근 */
export function useTypography(): TypographyScale {
  return useContext(TypographyContext);
}

/** TypographyRole → React.CSSProperties 변환 (fontFamily 문자열 해소) */
export function roleToStyle(
  scale: TypographyScale,
  role: TypographyRole,
): React.CSSProperties {
  const family =
    role.fontFamily === "heading"
      ? scale.headingFont
      : role.fontFamily === "mono"
        ? scale.monoFont
        : scale.bodyFont;
  return {
    fontFamily: family,
    fontSize: role.fontSize,
    fontWeight: role.fontWeight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
  };
}
