// Text Nodes: Kicker, Headline, RichText, BodyText, BulletList, StatNumber, QuoteText, FooterCaption
import React from "react";
import type { NodeProps } from "@/types/stack-nodes";
import { T, useScenePalette } from "../common/theme";
import { useTypography, roleToStyle } from "../common/typography";

function highlightTokens(
  text: string,
  tokens: string[] = [],
  accentColor: string,
  options?: { bold?: boolean; scale?: boolean; glow?: string },
): React.ReactNode {
  if (!tokens.length) return text;
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    tokens.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <span key={i} style={{
        color: accentColor,
        fontWeight: options?.bold !== false ? 800 : undefined,
        display: "inline-block",
        transform: options?.scale ? "scale(1.08)" : undefined,
        textShadow: options?.glow ? `0 0 16px ${options.glow}` : undefined,
      }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export const KickerRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const typo = useTypography();
  const labelStyle = roleToStyle(typo, typo.roles.label);
  return (
    <span
      style={{
        ...labelStyle,
        textTransform: "uppercase",
        color: P.accentBright,
        backgroundColor: P.accentTint,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "8px 24px",
        borderRadius: 8,
        border: `1px solid ${P.accent}`,
        display: "inline-block",
        textAlign: "center",
        ...(node.style as React.CSSProperties),
      }}
    >
      {d.text ?? ""}
    </span>
  );
};

// 기존 size 프리셋에서 스케일 비율로 변환
const HEADLINE_SIZE_SCALE: Record<string, number> = {
  sm: 0.87,   // 48/55
  md: 1.05,   // 58/55
  lg: 1.45,   // 80/55
  xl: 1.96,   // 108/55 — 레퍼런스 수준 크기
};

export const HeadlineRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const typo = useTypography();
  const headlineStyle = roleToStyle(typo, typo.roles.headline);
  const sizeScale = HEADLINE_SIZE_SCALE[d.size ?? "lg"] ?? 1;
  const fontSize = Math.round(typo.roles.headline.fontSize * sizeScale);
  return (
    <div
      style={{
        ...headlineStyle,
        fontSize,
        color: T.textPrimary,
        whiteSpace: "pre-line",
        textAlign: "center",
        wordBreak: "keep-all",
        overflowWrap: "break-word",
        width: "100%",
        textShadow: `0 4px 32px rgba(0,0,0,0.8), 0 0 20px ${P.accentGlow}`,
        letterSpacing: "-0.02em",
        ...(node.style as React.CSSProperties),
      }}
    >
      {highlightTokens(d.text ?? "", d.emphasis, P.accentBright, {
        bold: true, scale: true, glow: P.accentGlow,
      })}
    </div>
  );
};

export const RichTextRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const segments: Array<{ text: string; tone?: string }> = d.segments ?? [];
  return (
    <div
      style={{
        fontFamily: T.font,
        fontSize: 27,
        fontWeight: 500,
        lineHeight: 1.5,
        textAlign: "center",
        color: T.textSecondary,
        ...(node.style as React.CSSProperties),
      }}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            color: seg.tone === "accent" ? P.accentBright : T.textSecondary,
            fontWeight: seg.tone === "accent" ? 700 : 500,
          }}
        >
          {seg.text}
        </span>
      ))}
    </div>
  );
};

export const BodyTextRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const typo = useTypography();
  const bodyStyle = roleToStyle(typo, typo.roles.body);
  return (
    <div
      style={{
        ...bodyStyle,
        color: T.textSecondary,
        whiteSpace: "pre-line",
        textAlign: "center",
        wordBreak: "keep-all",
        overflowWrap: "break-word",
        ...(node.style as React.CSSProperties),
      }}
    >
      {highlightTokens(d.text ?? "", d.emphasis, P.accentBright, {
        bold: true, glow: P.accentGlow,
      })}
    </div>
  );
};

// 색상 바 글머리 색상 순환 (레퍼런스 SC50 스타일)
const BAR_COLORS = ["#00E599", "#FFD93D", "#FF6B6B", "#6BAFFF", "#C084FC"];

export const BulletListRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  const items: string[] = d.items ?? [];
  const variant = d.variant ?? d.bulletStyle ?? "dot";

  // variant별 글머리 렌더링
  const renderBullet = (index: number) => {
    switch (variant) {
      case "color-bar":
        return (
          <div style={{
            width: 6, height: 36, borderRadius: 3, flexShrink: 0,
            background: BAR_COLORS[index % BAR_COLORS.length],
            boxShadow: `0 0 12px ${BAR_COLORS[index % BAR_COLORS.length]}60`,
          }} />
        );
      case "number":
        return (
          <span style={{
            color: P.accentBright, fontSize: 32, fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
            minWidth: 36, textAlign: "center",
          }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        );
      case "check":
        return (
          <span style={{
            color: "#00E599", fontSize: 28, fontWeight: 700, flexShrink: 0,
            textShadow: "0 0 8px rgba(0,229,153,0.4)",
          }}>✓</span>
        );
      default: // dot
        return (
          <span style={{
            color: P.accentBright, fontSize: 30, fontWeight: 700, flexShrink: 0,
          }}>•</span>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        alignItems: variant === "color-bar" || variant === "number" ? "flex-start" : "center",
        ...(node.style as React.CSSProperties),
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          {renderBullet(i)}
          <span
            style={{
              fontFamily: T.font,
              fontSize: 36,
              fontWeight: variant === "color-bar" ? 700 : 500,
              color: T.textSecondary,
              lineHeight: 1.4,
              wordBreak: "keep-all",
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

export const StatNumberRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        ...(node.style as React.CSSProperties),
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: T.font,
            fontSize: 83,
            fontWeight: 900,
            color: T.textPrimary,
            lineHeight: 1,
            textShadow: `0 0 50px ${P.accentGlow}, 0 4px 16px rgba(0,0,0,0.4)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {d.value ?? "0"}
        </span>
        {d.suffix && (
          <span
            style={{
              fontFamily: T.font,
              fontSize: 27,
              fontWeight: 700,
              color: P.accentVivid,
              marginLeft: 4,
            }}
          >
            {d.suffix}
          </span>
        )}
      </div>
      {d.label && (
        <span
          style={{
            fontFamily: T.font,
            fontSize: 20,
            color: T.textSecondary,
            textAlign: "center",
          }}
        >
          {d.label}
        </span>
      )}
    </div>
  );
};

export const QuoteTextRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  const P = useScenePalette();
  return (
    <div
      style={{
        fontFamily: T.font,
        fontSize: 38,
        fontWeight: 600,
        fontStyle: "italic",
        lineHeight: 1.4,
        color: T.textPrimary,
        textAlign: "center",
        textShadow: `0 2px 16px rgba(0,0,0,0.5), 0 0 14px ${P.accentGlow}`,
        ...(node.style as React.CSSProperties),
      }}
    >
      <span
        style={{
          color: P.accentBright,
          fontSize: 34,
          verticalAlign: "top",
          lineHeight: 0.5,
          marginRight: 4,
        }}
      >
        &ldquo;
      </span>
      {d.text ?? ""}
      <span
        style={{
          color: P.accentBright,
          fontSize: 34,
          verticalAlign: "bottom",
          lineHeight: 0.5,
          marginLeft: 4,
        }}
      >
        &rdquo;
      </span>
    </div>
  );
};

export const FooterCaptionRenderer: React.FC<NodeProps> = ({ node }) => {
  const d = node.data ?? {};
  return (
    <div
      style={{
        fontFamily: T.font,
        fontSize: 30,
        fontWeight: 500,
        color: T.textMuted,
        textAlign: "center",
        ...(node.style as React.CSSProperties),
      }}
    >
      {d.text ?? ""}
    </div>
  );
};
