// scene-76 — "구독/좋아요/알림 요청" — CTA 콜아웃
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";

const CTA = [
  { icon: "🔔", label: "알림 설정", color: "#ffbe5c" },
  { icon: "👍", label: "좋아요", color: "#8fd5ff" },
  { icon: "🎁", label: "구독", color: "#ff6b8a" },
];

export const Scene76: React.FC<NodeProps> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const pulse = 0.95 + 0.1 * Math.abs(Math.sin(frame / 10));

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #14082e 0%, #05030a 85%)", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif" }}>
      <div style={{ position: "absolute", top: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 24, color: "#c8a8ff", letterSpacing: "0.5em", fontWeight: 700 }}>THANK YOU · 시청해 주셔서 감사해요</div>
        <div style={{ fontSize: 60, color: "#fff", fontWeight: 800, marginTop: 14 }}>다음 뉴스에 <span style={{ color: "#c8a8ff" }}>다시 만나려면</span></div>
      </div>

      {/* 3 개 CTA 버튼 */}
      <div style={{ position: "absolute", top: "40%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 50 }}>
        {CTA.map((c, i) => {
          const appearFrame = 30 + i * 18;
          const enter = interpolate(frame, [appearFrame, appearFrame + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const localPulse = i === 2 ? pulse : 1;
          return (
            <div key={i} style={{ transform: `scale(${enter * localPulse})`, opacity: enter, display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 40px", background: `${c.color}18`, border: `2px solid ${c.color}`, borderRadius: 24, minWidth: 280, boxShadow: `0 20px 80px ${c.color}30` }}>
              <div style={{ fontSize: 120 }}>{c.icon}</div>
              <div style={{ fontSize: 44, color: "#fff", fontWeight: 900, marginTop: 16 }}>{c.label}</div>
              <div style={{ fontSize: 16, color: c.color, letterSpacing: "0.3em", fontWeight: 700, marginTop: 6 }}>→ click</div>
            </div>
          );
        })}
      </div>

      {/* 하단 메시지 */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#c5d7f0", lineHeight: 1.4 }}>
          다음 바이브 뉴스는 — <span style={{ color: "#c8a8ff", fontWeight: 900 }}>더 많은 소식</span>을 담아 찾아올게요
        </div>
      </div>
    </AbsoluteFill>
  );
};
