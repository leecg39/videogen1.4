// scene-16 — "소스코드 유출 · 엔트로픽 미지근한 대응" 음모적 분위기
// 의도: 유출된 코드 diff 에서 한 줄 하이라이트. "최우선 과제" vs "뜨끈미지근" 온도 게이지 대비.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const DIFF_LINES = [
  { type: "ctx", text: "  // cache validation" },
  { type: "ctx", text: "  const token = computeTokenUsage(request);" },
  { type: "del", text: "- return token.amount; // BUG: incorrect cache keying" },
  { type: "add", text: "+ return normalize(token).amount; // fixed: re-key by session" },
  { type: "ctx", text: "  logUsage(user.id, token);" },
  { type: "ctx", text: "}" },
];

export const Scene16: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const tempFill = interpolate(frame, [30, 150], [20, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const suspicionOpacity = interpolate(frame, [100, 140], [0, 1], { extrapolateRight: "clamp" });
  const lineReveal = (i: number) => interpolate(frame, [10 + i * 8, 30 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const highlightPulse = 0.4 + 0.6 * Math.abs(Math.sin(frame / 12));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a0612 0%, #14081c 55%, #0a0612 100%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 좌측 상단 헤더 */}
      <div style={{ position: "absolute", top: 80, left: 140 }}>
        <div style={{ fontSize: 22, color: "#c89aff", letterSpacing: "0.4em", fontWeight: 700 }}>LEAKED SOURCE · 오픈 인터넷 유출</div>
        <div style={{ fontSize: 48, color: "#fff", fontWeight: 800, marginTop: 10, lineHeight: 1.15 }}>
          버그는 <span style={{ color: "#7dffb0" }}>5줄 수정</span> 이면 끝.
        </div>
      </div>

      {/* 중앙: 코드 diff 블록 */}
      <div style={{ position: "absolute", top: 240, left: 140, width: 1100, background: "#0a0814", border: "1px solid rgba(200,154,255,0.3)", borderRadius: 12, padding: "18px 0", boxShadow: "0 30px 100px rgba(200,154,255,0.12)" }}>
        <div style={{ display: "flex", gap: 10, padding: "0 20px 14px", borderBottom: "1px solid rgba(200,154,255,0.12)", alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 16, fontSize: 14, color: "#8a7ea5", fontFamily: "'JetBrains Mono', monospace" }}>anthropic/claude-cache.ts · leaked</span>
        </div>
        {DIFF_LINES.map((l, i) => {
          const opacity = lineReveal(i);
          const color = l.type === "del" ? "#ff6b8a" : l.type === "add" ? "#7dffb0" : "#8a7ea5";
          const bg = l.type === "del" ? "rgba(255,107,138,0.12)" : l.type === "add" ? "rgba(125,255,176,0.12)" : "transparent";
          const isAdd = l.type === "add";
          return (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color, background: bg, padding: "6px 28px", opacity, lineHeight: 1.6, outline: isAdd ? `2px solid rgba(125,255,176,${highlightPulse})` : "none", outlineOffset: -2 }}>
              {l.text}
            </div>
          );
        })}
      </div>

      {/* 우측 상단: 온도 게이지 */}
      <div style={{ position: "absolute", top: 240, right: 140, width: 440, padding: 28, border: "1px solid rgba(200,154,255,0.25)", background: "rgba(200,154,255,0.04)", borderRadius: 14 }}>
        <div style={{ fontSize: 18, color: "#c89aff", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 18 }}>URGENCY THERMOMETER</div>

        {/* 가로 온도계 */}
        <div style={{ position: "relative", height: 48, borderRadius: 24, background: "linear-gradient(90deg, #3dcdff 0%, #7dffb0 40%, #ffbe5c 70%, #ff3b5c 100%)", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${tempFill}%`, background: "rgba(10,6,18,0.6)", borderRight: "3px solid #fff", transition: "width 0.1s" }} />
          <div style={{ position: "absolute", top: "50%", left: `${tempFill}%`, transform: "translate(-50%, -50%)", width: 20, height: 20, borderRadius: "50%", background: "#fff", border: "3px solid #14081c" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 14, color: "#8a7ea5" }}>
          <span>cold · 최우선</span>
          <span>warm</span>
          <span>hot · 긴급</span>
        </div>

        <div style={{ marginTop: 28, padding: "18px 20px", background: "#1a0b1f", borderLeft: "4px solid #ffbe5c", borderRadius: 4 }}>
          <div style={{ fontSize: 18, color: "#ffbe5c", letterSpacing: "0.2em", fontWeight: 700 }}>ANTHROPIC 실제 대응</div>
          <div style={{ fontSize: 30, color: "#fff", marginTop: 6, fontWeight: 600, lineHeight: 1.3 }}>
            뜨끈미지근 · <span style={{ color: "#ffbe5c", fontSize: 38 }}>lukewarm</span>
          </div>
        </div>
      </div>

      {/* 하단 의심 질문 */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center", opacity: suspicionOpacity }}>
        <div style={{ fontSize: 34, color: "#c89aff", fontStyle: "italic", fontWeight: 500 }}>
          &ldquo;정말 <span style={{ color: "#ff6b8a", fontWeight: 700 }}>최우선</span> 과제로 조사하고 있는가?&rdquo;
        </div>
      </div>
    </AbsoluteFill>
  );
};
