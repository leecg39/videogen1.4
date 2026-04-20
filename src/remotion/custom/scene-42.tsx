// scene-42 — "/ultraplan 커맨드 입력" · 명령 구문 강조
// 의도: 화면 전체가 macOS 터미널 창. 타이핑 애니 + 토큰 구문 강조 + 하단 "클라우드로 위임" 시각화.
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

export const Scene42: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const fullCmd = "/ultraplan 인증을 세션 방식에서 JWT로 변경";
  const typed = Math.floor(interpolate(frame, [12, 96], [0, fullCmd.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cursorOn = Math.floor(frame / 10) % 2 === 0;
  const cloudMove = interpolate(frame, [110, 170], [0, 480], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const statusOpacity = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050914 0%, #0d1324 100%)", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* 상단 라벨 — 일반 폰트 */}
      <div style={{ position: "absolute", top: 70, left: 160, fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ fontSize: 22, color: "#5dd8ff", letterSpacing: "0.4em", fontWeight: 700 }}>COMMAND &middot; 추론 위임 전략</div>
        <div style={{ fontSize: 44, color: "#fff", marginTop: 10, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>터미널에서 클라우드로 기획을 보낸다</div>
      </div>

      {/* 터미널 창 */}
      <div style={{ position: "absolute", left: 140, top: 260, right: 140, height: 440, borderRadius: 18, overflow: "hidden", background: "#0a0f1e", border: "1px solid rgba(93,216,255,0.25)", boxShadow: "0 30px 100px rgba(93,216,255,0.15)" }}>
        {/* 타이틀 바 */}
        <div style={{ background: "#141a2e", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(93,216,255,0.1)" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28c840" }} />
          <div style={{ marginLeft: 20, color: "#8da0c5", fontSize: 16 }}>claude — zsh — 120×28</div>
        </div>

        {/* 내용 */}
        <div style={{ padding: "28px 36px", fontSize: 30, lineHeight: 1.6 }}>
          <div style={{ color: "#8da0c5" }}>
            <span style={{ color: "#28c840" }}>~/projects/app</span> <span style={{ color: "#5dd8ff" }}>(main)</span> <span style={{ color: "#fff" }}>❯</span>{" "}
            <span style={{ color: "#ffcc6b", fontWeight: 700 }}>{fullCmd.slice(0, Math.min(typed, 11))}</span>
            <span style={{ color: "#e6e8ef" }}>{fullCmd.slice(Math.min(typed, 11), typed)}</span>
            {typed < fullCmd.length && <span style={{ background: "#5dd8ff", color: "#5dd8ff", marginLeft: 2, opacity: cursorOn ? 1 : 0 }}>█</span>}
          </div>

          {typed >= fullCmd.length && (
            <>
              <div style={{ color: "#5dd8ff", marginTop: 24, opacity: statusOpacity }}>
                → 오퍼스 4.6 Agent started in cloud. 최대 30분.
              </div>
              <div style={{ color: "#8da0c5", marginTop: 8, opacity: statusOpacity }}>
                [1/4] <span style={{ color: "#7ed6a8" }}>리포 구조 분석</span>…
              </div>
              <div style={{ color: "#8da0c5", marginTop: 4, opacity: statusOpacity }}>
                [2/4] <span style={{ color: "#7ed6a8" }}>의존 맵 생성</span>…
              </div>
              <div style={{ color: "#8da0c5", marginTop: 4, opacity: statusOpacity }}>
                [3/4] <span style={{ color: "#ffcc6b" }}>JWT 마이그레이션 플랜 작성</span>…
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 플로우: 터미널 → 클라우드 */}
      <div style={{ position: "absolute", left: 140, bottom: 90, right: 140, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(93,216,255,0.15)", border: "1px solid rgba(93,216,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🖥️</div>
          <div>
            <div style={{ fontSize: 20, color: "#5dd8ff", letterSpacing: "0.2em" }}>MY LAPTOP</div>
            <div style={{ fontSize: 24, color: "#fff" }}>터미널 사용 가능</div>
          </div>
        </div>

        {/* 비행 패킷 */}
        <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, rgba(93,216,255,0.2), rgba(168,93,255,0.6))", margin: "0 40px", position: "relative" }}>
          <div style={{ position: "absolute", left: cloudMove, top: -12, width: 26, height: 26, borderRadius: "50%", background: "#ffcc6b", boxShadow: "0 0 20px rgba(255,204,107,0.8)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 20, color: "#a58dff", letterSpacing: "0.2em", textAlign: "right" }}>CLOUD</div>
            <div style={{ fontSize: 24, color: "#fff" }}>Opus 4.6 · 최대 30분</div>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(168,93,255,0.15)", border: "1px solid rgba(168,93,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>☁️</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
