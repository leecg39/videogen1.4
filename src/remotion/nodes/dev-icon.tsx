// DevIcon — developer-icons 라이브러리 기반 테크 아이콘 노드
// 정적 import로 Remotion SSR 호환 보장

import React from "react";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";

// 정적 import — 자주 쓰는 아이콘만 직접 가져옴
import * as DevIcons from "developer-icons";

// 한글 별칭 → export name
const ALIAS: Record<string, string> = {
  "엔트로픽": "Anthropic", "앤트로픽": "Anthropic",
  "클로드": "ClaudeAI", "오픈AI": "OpenAI",
  "챗GPT": "ChatGPT", "파이썬": "Python",
  "리액트": "React", "도커": "Docker",
  "깃허브": "GitHubDark", "구글": "Google",
  "애플": "AppleDark", "메타": "Meta",
  "마이크로소프트": "Microsoft", "아마존": "AWS",
  "노션": "Notion", "피그마": "Figma", "슬랙": "Slack",
  // 영문 소문자 + 대시/언더스코어 없는 키. Phase 5 진단 5-B 대응.
  "github": "GitHubDark", "githublight": "GitHub", "githubdark": "GitHubDark",
  "githublogo": "GitHubDark",
  "openai": "OpenAI", "openailogo": "OpenAI",
  "anthropic": "Anthropic", "anthropiclogo": "Anthropic",
  "claude": "ClaudeAI", "claudeai": "ClaudeAI", "claudelogo": "ClaudeAI",
  "chatgpt": "ChatGPT", "chatgptlogo": "ChatGPT",
  "python": "Python", "react": "React", "docker": "Docker",
  "typescript": "TypeScript", "ts": "TypeScript",
  "javascript": "JavaScript", "js": "JavaScript",
  "nodejs": "NodeJs", "node": "NodeJs",
  "nextjs": "NextJs", "next": "NextJs",
  "tailwind": "TailwindCSS", "tailwindcss": "TailwindCSS",
  "vscode": "VSCode", "vs": "VSCode",
  "apple": "AppleDark", "applelight": "AppleLight", "appledark": "AppleDark",
  "macbook": "MacbookLight", "macbooklight": "MacbookLight", "macbookdark": "MacbookDark",
};

// 키 정규화 — 대시/언더스코어/공백 제거 후 소문자. "github-logo" → "githublogo".
function normalizeIconKey(name: string): string {
  return String(name).replace(/[-_\s]/g, "").toLowerCase();
}

// 다크 배경에서 안 보이는 아이콘 목록 — 자동 glow 적용
const DARK_ICONS = new Set([
  "GitHub", "GitHubDark", "Vercel", "VercelDark", "NextJs", "NextJsDark",
  "Notion", "NotionDark", "Obsidian", "Terminal", "Neovim",
  "Express", "ExpressDark", "Svelte",
]);

// 내부에 밝은 배경 rect를 가진 아이콘 — CSS로 첫 번째 rect만 투명화
// ClaudeAI는 살구색 브랜드 배경이므로 제외 (의도된 디자인)
const LIGHT_BG_ICONS = new Set([
  "OpenAI", "ChatGPT", "Anthropic",
  "AnthropicBasicDark", "AnthropicBasicLight",
]);

export const DevIconRenderer: React.FC<NodeProps> = ({ node, frame }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const nodeStyle = (node.style ?? {}) as React.CSSProperties;

  const iconName: string = d.name || "React";
  const size: number = d.size || 160;
  const label: string | undefined = d.label;
  const showLabel: boolean = d.showLabel !== false && !!label;
  const circle: boolean = d.circle || false;

  // v1.1 round 4 버그5: 케이스 + 대시 변형 흡수.
  // 1) 원본 그대로, 2) 소문자, 3) 정규화 (대시/언더스코어 제거) 순서로 ALIAS 조회.
  // 매칭 실패 시 원본 iconName 을 DevIcons export 로 직접 조회.
  const normKey = normalizeIconKey(iconName);
  const resolvedName =
    ALIAS[iconName] ||
    ALIAS[iconName.toLowerCase()] ||
    ALIAS[normKey] ||
    iconName;

  // enterAt animation
  const enterAt: number = node.motion?.enterAt ?? 0;
  const fadeDuration: number = node.motion?.duration ?? 12;
  const localFrame = Math.max(0, frame - enterAt);
  const entranceOpacity = Math.min(1, localFrame / Math.max(1, fadeDuration));
  const scale = 0.8 + 0.2 * Math.min(1, localFrame / Math.max(1, fadeDuration));

  // node.style.opacity를 entrance opacity에 곱하여 최종 opacity 결정
  const styleOpacity = typeof nodeStyle.opacity === "number" ? nodeStyle.opacity : 1;
  const finalOpacity = entranceOpacity * styleOpacity;

  // 정적 lookup — 동적 import 없음
  const IconComp = (DevIcons as any)[resolvedName] as React.FC<any> | undefined;

  // 다크 배경 아이콘 자동 glow 감지
  const needsGlow = DARK_ICONS.has(resolvedName);
  const darkGlow = needsGlow
    ? `0 0 24px rgba(255,255,255,0.25), 0 0 48px ${P.accentGlow}`
    : undefined;

  // 흰색 배경을 가진 아이콘 감지
  const hasLightBg = LIGHT_BG_ICONS.has(resolvedName);

  // node.style에서 opacity 제외한 나머지 (transform 등)를 외곽 div에 병합
  const { opacity: _omit, ...restNodeStyle } = nodeStyle;

  return (
    <div
      style={{
        opacity: finalOpacity,
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        ...restNodeStyle,
      }}
    >
      <div
        style={{
          width: circle ? size : undefined,
          height: circle ? size : undefined,
          borderRadius: circle ? "50%" : 12,
          background: circle ? "rgba(255,255,255,0.06)" : "transparent",
          border: circle ? `2px solid ${P.borderAccentStrong}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: circle ? 12 : 0,
          boxShadow: circle
            ? `0 0 20px ${P.accentGlow}`
            : darkGlow ?? "none",
          overflow: "hidden",
        }}
      >
        {IconComp ? (
          <div
            style={
              hasLightBg
                ? {
                    background: "transparent",
                    filter: "drop-shadow(0 0 24px rgba(255,255,255,0.5)) brightness(1.8) contrast(1.2)",
                  }
                : needsGlow
                ? {
                    // 다크 배경용: 검정 실루엣 아이콘을 흰색으로 강제 반전
                    filter:
                      "brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.35))",
                  }
                : undefined
            }
            className={hasLightBg ? "devicon-strip-bg" : undefined}
          >
            <style>{`
              .devicon-strip-bg svg > rect:first-child {
                fill: transparent !important;
              }
              .devicon-strip-bg svg > path {
                fill: #e0e0e0 !important;
              }
            `}</style>
            <IconComp size={circle ? size - 28 : size} />
          </div>
        ) : (
          <div
            style={{
              width: size * 0.7,
              height: size * 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.max(14, size * 0.2),
              color: P.accentBright,
              fontWeight: 700,
              letterSpacing: 1,
              border: `2px solid ${P.accentBright}`,
              borderRadius: 8,
            }}
          >
            {resolvedName.slice(0, 4)}
          </div>
        )}
      </div>
      {showLabel && (
        <span style={{ color: T.textMuted, fontSize: 14, fontWeight: 500, textAlign: "center" }}>
          {label}
        </span>
      )}
    </div>
  );
};
