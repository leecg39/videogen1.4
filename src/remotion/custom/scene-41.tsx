// scene-41 — "AI 가 터미널을 점거 — 사용자는 기다려야 한다"
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene41: React.FC<NodeProps> = ({ frame }) => {
  const blink = Math.floor(frame / 12) % 2 === 0;
  const lockPulse = 0.6 + 0.4 * Math.abs(Math.sin(frame / 10));

  return (
    <AbsoluteFill style={{ background: "#0a0a14", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>
      {/* 상단 */}
      <div style={{ position: "absolute", top: 80, left: 140, fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ fontSize: 22, color: "#ff6b8a", letterSpacing: "0.4em", fontWeight: 700 }}>PROBLEM · 터미널 점거</div>
        <div style={{ fontSize: 50, color: "#fff", fontWeight: 800, marginTop: 10 }}>AI 가 <span style={{ color: "#ff6b8a" }}>일하는 동안</span> 나는?</div>
      </div>

      {/* 잠긴 터미널 */}
      <div style={{ position: "absolute", top: 260, left: 140, right: 140, height: 520, background: "#0a0a14", border: "2px solid rgba(255,107,138,0.4)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 24px", background: "#141420", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 18, color: "#8fa5c7", fontSize: 14 }}>zsh — claude is thinking (locked)</span>
          {/* 잠금 아이콘 */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "#ff6b8a", opacity: lockPulse }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C9.24 2 7 4.24 7 7v3H5v12h14V10h-2V7c0-2.76-2.24-5-5-5zm3 8H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v3z" /></svg>
            <span style={{ fontSize: 12, letterSpacing: "0.2em", fontWeight: 700 }}>LOCKED</span>
          </div>
        </div>

        <div style={{ padding: "32px 40px", fontSize: 22, lineHeight: 1.8, color: "#8fa5c7" }}>
          <div style={{ color: "#ffbe5c" }}>$ claude code --plan-and-implement</div>
          <div>→ analyzing repository structure{blink ? "..." : "   "}</div>
          <div>→ computing dependency graph{blink ? "..." : "   "}</div>
          <div>→ drafting spec outline{blink ? "..." : "   "}</div>
          <div style={{ marginTop: 18, color: "#ff6b8a", fontSize: 28 }}>⏸ 터미널 블로킹 · 6-18분 소요 예상</div>
          <div style={{ marginTop: 30, fontSize: 20, color: "#5a6d96", fontStyle: "italic" }}>
            &nbsp;&nbsp;&nbsp; 그동안 쉘에서 다른 작업 불가. git, ls, 파일 편집 모두 대기.
          </div>

          {/* 사용자 시계 */}
          <div style={{ marginTop: 60, padding: "18px 24px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 6 }}>
            <div style={{ fontSize: 16, color: "#8fa5c7", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 8 }}>YOU</div>
            <div style={{ fontSize: 32, color: "#fff" }}>🕒 대기 중... 커피? 트위터?</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", color: "#c5d7f0", fontFamily: "'Space Grotesk', sans-serif", fontSize: 24 }}>
        → 울트라 플랜이 해답
      </div>
    </AbsoluteFill>
  );
};
