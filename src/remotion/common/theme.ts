// Design System - 바이올렛 네온 다크 테마
// 형광 바이올렛 3색 로테이션 브랜딩
// Video Design OS v1: Typography Scale + Ambient Texture
import { createContext, useContext } from "react";

// ---------------------------------------------------------------------------
// Typography Scale System (Major Third 1.25)
// ---------------------------------------------------------------------------

export interface TypographyRole {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  fontFamily: "heading" | "body" | "mono";
}

export interface TypographyScale {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  baseSize: number;
  ratio: number;
  roles: {
    display: TypographyRole;
    headline: TypographyRole;
    subhead: TypographyRole;
    body: TypographyRole;
    caption: TypographyRole;
    label: TypographyRole;
    stat: TypographyRole;
  };
  googleFontsUrl: string;
}

export function buildTypographyScale(
  headingFont: string,
  bodyFont: string,
  ratio = 1.25,
  baseSize = 28,
  googleFontsUrl = "",
): TypographyScale {
  const s = (steps: number) => Math.round(baseSize * Math.pow(ratio, steps));
  return {
    headingFont,
    bodyFont,
    monoFont: "'JetBrains Mono', monospace",
    baseSize,
    ratio,
    roles: {
      display:  { fontSize: s(4), fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", fontFamily: "heading" },
      headline: { fontSize: s(3), fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.035em", fontFamily: "heading" },
      subhead:  { fontSize: s(1), fontWeight: 600, lineHeight: 1.3,  letterSpacing: "0.01em",  fontFamily: "body" },
      body:     { fontSize: s(0), fontWeight: 400, lineHeight: 1.55, letterSpacing: "0",        fontFamily: "body" },
      caption:  { fontSize: s(-1), fontWeight: 500, lineHeight: 1.4, letterSpacing: "0.02em",  fontFamily: "body" },
      label:    { fontSize: s(-2), fontWeight: 700, lineHeight: 1.2, letterSpacing: "0.08em",  fontFamily: "body" },
      stat:     { fontSize: s(5), fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", fontFamily: "heading" },
    },
    googleFontsUrl,
  };
}

// ---------------------------------------------------------------------------
// Ambient Background System
// ---------------------------------------------------------------------------

export type AmbientPreset = "noise-glow" | "paper" | "film-grain" | "gradient-mesh" | "none";

export interface AmbientConfig {
  preset: AmbientPreset;
  tintColor: string;
  opacity: number;
  grain: boolean;
  grainIntensity: number;
}

export const T = {
  // Background (바이올렛 틴트)
  bgBase: "#08060D",
  bgElevated: "#0D0A15",
  bgSurface: "#150F22",
  bgAccentSubtle: "rgba(153, 69, 255, 0.06)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.38)",
  textAccent: "#5EE88E",

  // Accent (Reference Mint — 2026-04-17 migration from #9945FF purple)
  accent: "#39FF14",
  accentBright: "#5EE88E",
  accentVivid: "#A8F4C5",
  accentDim: "#20B464",
  accentGlow: "rgba(57, 255, 20, 0.30)",
  accentTint: "rgba(57, 255, 20, 0.08)",

  // Semantic
  success: "#22C55E",
  successGlow: "rgba(34, 197, 94, 0.25)",
  warning: "#F59E0B",
  warningGlow: "rgba(245, 158, 11, 0.25)",
  info: "#3B82F6",
  infoGlow: "rgba(59, 130, 246, 0.25)",

  // Border
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderAccent: "rgba(57, 255, 20, 0.45)",
  borderAccentStrong: "#39FF14",

  // Font
  font: "'Pretendard Variable', Pretendard, Inter, sans-serif",
} as const;

// ---------------------------------------------------------------------------
// Scene-level palette: 씬별 강조색 로테이션
// ---------------------------------------------------------------------------
export interface ScenePalette {
  accent: string;
  accentBright: string;
  accentVivid: string;
  accentDim: string;
  accentGlow: string;
  accentTint: string;
  borderAccent: string;
  borderAccentStrong: string;
}

export const SCENE_PALETTES: ScenePalette[] = [
  { // 0: Reference Mint — reference/SC *.png 60장 DNA. 이 프로젝트의 표준.
    accent: "#39FF14", accentBright: "#5EE88E", accentVivid: "#A8F4C5",
    accentDim: "#20B464", accentGlow: "rgba(57,255,20,0.30)",
    accentTint: "rgba(57,255,20,0.08)", borderAccent: "rgba(57,255,20,0.45)",
    borderAccentStrong: "#39FF14",
  },
  { // 1: Electric Mint — 시원한 민트 사이언 (바이올렛 보색, 테크/데이터 씬)
    accent: "#14E0C9", accentBright: "#5EEAD4", accentVivid: "#99F6E4",
    accentDim: "#0D9488", accentGlow: "rgba(20,224,201,0.28)",
    accentTint: "rgba(20,224,201,0.10)", borderAccent: "rgba(20,224,201,0.45)",
    borderAccentStrong: "#14E0C9",
  },
  { // 2: Neon Fuchsia — 따뜻한 핑크-바이올렛 형광 (감정/공감 씬)
    accent: "#E040FB", accentBright: "#F06EFF", accentVivid: "#F5A8FF",
    accentDim: "#B300D9", accentGlow: "rgba(224,64,251,0.28)",
    accentTint: "rgba(224,64,251,0.10)", borderAccent: "rgba(224,64,251,0.45)",
    borderAccentStrong: "#E040FB",
  },
  { // 3: Amber Gold — 따뜻한 앰버 골드 (경고/강조/포인트 씬)
    accent: "#FBBF24", accentBright: "#FCD34D", accentVivid: "#FDE68A",
    accentDim: "#D97706", accentGlow: "rgba(251,191,36,0.28)",
    accentTint: "rgba(251,191,36,0.10)", borderAccent: "rgba(251,191,36,0.45)",
    borderAccentStrong: "#FBBF24",
  },
  { // 4: Cyber Indigo — 시원한 블루-바이올렛 형광 (차분한 정보 씬)
    accent: "#7C4DFF", accentBright: "#B388FF", accentVivid: "#D1C4E9",
    accentDim: "#651FFF", accentGlow: "rgba(124,77,255,0.28)",
    accentTint: "rgba(124,77,255,0.10)", borderAccent: "rgba(124,77,255,0.45)",
    borderAccentStrong: "#7C4DFF",
  },
];

export const SceneThemeContext = createContext<ScenePalette>(SCENE_PALETTES[0]);

export function useScenePalette(): ScenePalette {
  return useContext(SceneThemeContext);
}

export function getPaletteForScene(_i: number): ScenePalette {
  // Reference DNA (2026-04-17): 전 씬 동일 mint palette 고정.
  // 이전에는 씬 index 로 5 팔레트 로테이션 → 레퍼런스와 색상 불일치.
  // 레퍼런스 SC *.png 60장 전부 mint green 단일 accent.
  return SCENE_PALETTES[0];
}

// ---------------------------------------------------------------------------
// Style Pack: 프로젝트별 테마 선택
// ---------------------------------------------------------------------------
export type StylePack = "dark-neon" | "editorial" | "documentary" | "clean-enterprise";

export type ThemeConfig = { [K in keyof typeof T]: string };

export interface StylePackConfig {
  colors: ThemeConfig;
  typography: TypographyScale;
  ambient: AmbientConfig;
}

const EDITORIAL: ThemeConfig = {
  bgBase: "#FAFAFA",
  bgElevated: "#FFFFFF",
  bgSurface: "#F0F0F0",
  bgAccentSubtle: "rgba(229, 57, 53, 0.06)",
  textPrimary: "#1A1A1A",
  textSecondary: "rgba(0,0,0,0.6)",
  textMuted: "rgba(0,0,0,0.38)",
  textAccent: "#E53935",
  accent: "#E53935",
  accentBright: "#FF5252",
  accentVivid: "#FF8A80",
  accentDim: "#C62828",
  accentGlow: "rgba(229, 57, 53, 0.28)",
  accentTint: "rgba(229, 57, 53, 0.10)",
  success: "#2E7D32",
  successGlow: "rgba(46, 125, 50, 0.25)",
  warning: "#F57F17",
  warningGlow: "rgba(245, 127, 23, 0.25)",
  info: "#1565C0",
  infoGlow: "rgba(21, 101, 192, 0.25)",
  borderDefault: "rgba(0, 0, 0, 0.08)",
  borderAccent: "rgba(229, 57, 53, 0.45)",
  borderAccentStrong: "#E53935",
  font: "'Georgia', 'Noto Serif KR', serif",
};

const DOCUMENTARY: ThemeConfig = {
  bgBase: "#1A1714",
  bgElevated: "#2A2520",
  bgSurface: "#332E28",
  bgAccentSubtle: "rgba(255, 183, 77, 0.06)",
  textPrimary: "#F5F0EB",
  textSecondary: "rgba(245, 240, 235, 0.6)",
  textMuted: "rgba(245, 240, 235, 0.38)",
  textAccent: "#FFCC80",
  accent: "#FFB74D",
  accentBright: "#FFCC80",
  accentVivid: "#FFE0B2",
  accentDim: "#F09800",
  accentGlow: "rgba(255, 183, 77, 0.28)",
  accentTint: "rgba(255, 183, 77, 0.10)",
  success: "#66BB6A",
  successGlow: "rgba(102, 187, 106, 0.25)",
  warning: "#FFA726",
  warningGlow: "rgba(255, 167, 38, 0.25)",
  info: "#42A5F5",
  infoGlow: "rgba(66, 165, 245, 0.25)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderAccent: "rgba(255, 183, 77, 0.45)",
  borderAccentStrong: "#FFB74D",
  font: "'Inter', 'Pretendard', sans-serif",
};

const CLEAN_ENTERPRISE: ThemeConfig = {
  bgBase: "#F5F7FA",
  bgElevated: "#FFFFFF",
  bgSurface: "#E8ECF1",
  bgAccentSubtle: "rgba(33, 150, 243, 0.06)",
  textPrimary: "#2C3E50",
  textSecondary: "rgba(44, 62, 80, 0.6)",
  textMuted: "rgba(44, 62, 80, 0.38)",
  textAccent: "#2196F3",
  accent: "#2196F3",
  accentBright: "#64B5F6",
  accentVivid: "#90CAF9",
  accentDim: "#1565C0",
  accentGlow: "rgba(33, 150, 243, 0.28)",
  accentTint: "rgba(33, 150, 243, 0.10)",
  success: "#4CAF50",
  successGlow: "rgba(76, 175, 80, 0.25)",
  warning: "#FF9800",
  warningGlow: "rgba(255, 152, 0, 0.25)",
  info: "#2196F3",
  infoGlow: "rgba(33, 150, 243, 0.25)",
  borderDefault: "rgba(0, 0, 0, 0.08)",
  borderAccent: "rgba(33, 150, 243, 0.45)",
  borderAccentStrong: "#2196F3",
  font: "'Inter', 'Pretendard', sans-serif",
};

// Legacy flat color map (하위호환)
export const STYLE_PACKS: Record<StylePack, ThemeConfig> = {
  "dark-neon": T,
  "editorial": EDITORIAL,
  "documentary": DOCUMENTARY,
  "clean-enterprise": CLEAN_ENTERPRISE,
};

// ---------------------------------------------------------------------------
// Full Style Pack Configs (colors + typography + ambient)
// ---------------------------------------------------------------------------

const STYLE_PACK_CONFIGS: Record<StylePack, StylePackConfig> = {
  "dark-neon": {
    colors: T,
    typography: buildTypographyScale(
      "'Space Grotesk', 'Pretendard', sans-serif",
      "'DM Sans', 'Pretendard', sans-serif",
      1.25, 28,
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
    ),
    ambient: { preset: "noise-glow", tintColor: "#9945FF", opacity: 0.35, grain: true, grainIntensity: 0.15 },
  },
  editorial: {
    colors: EDITORIAL,
    typography: buildTypographyScale(
      "'Cormorant Garamond', 'Noto Serif KR', serif",
      "'Libre Baskerville', 'Noto Serif KR', serif",
      1.25, 28,
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap",
    ),
    ambient: { preset: "paper", tintColor: "#E8D5B7", opacity: 0.12, grain: true, grainIntensity: 0.04 },
  },
  documentary: {
    colors: DOCUMENTARY,
    typography: buildTypographyScale(
      "'Lora', 'Pretendard', serif",
      "'Raleway', 'Pretendard', sans-serif",
      1.25, 28,
      "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap",
    ),
    ambient: { preset: "film-grain", tintColor: "#FFB74D", opacity: 0.1, grain: true, grainIntensity: 0.12 },
  },
  "clean-enterprise": {
    colors: CLEAN_ENTERPRISE,
    typography: buildTypographyScale(
      "'Lexend', 'Pretendard', sans-serif",
      "'Source Sans 3', 'Pretendard', sans-serif",
      1.25, 28,
      "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
    ),
    ambient: { preset: "gradient-mesh", tintColor: "#2196F3", opacity: 0.08, grain: false, grainIntensity: 0 },
  },
};

/** 색상 토큰 반환 (하위호환) */
export function getTheme(pack: StylePack = "dark-neon"): ThemeConfig {
  return STYLE_PACKS[pack] ?? T;
}

/** 타이포그래피 스케일 반환 */
export function getTypography(pack: StylePack = "dark-neon"): TypographyScale {
  return STYLE_PACK_CONFIGS[pack]?.typography ?? STYLE_PACK_CONFIGS["dark-neon"].typography;
}

/** 앰비언트 배경 설정 반환 */
export function getAmbient(pack: StylePack = "dark-neon"): AmbientConfig {
  return STYLE_PACK_CONFIGS[pack]?.ambient ?? STYLE_PACK_CONFIGS["dark-neon"].ambient;
}

/** 풀 StylePackConfig 반환 */
export function getStylePackConfig(pack: StylePack = "dark-neon"): StylePackConfig {
  return STYLE_PACK_CONFIGS[pack] ?? STYLE_PACK_CONFIGS["dark-neon"];
}
