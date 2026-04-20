"use client";

// HotspotEditor — 재사용 가능한 이미지 핫스팟 편집기.
// DemoBuilder / VideoDemoBuilder 양쪽에서 사용.
//
// 특징:
// - 이미지 클릭 → hotspot 추가 (maxCount === 1 이면 기존 것 교체)
// - 기존 hotspot 드래그 → 이동 (드롭 시 onChange 자동 호출)
// - cross-hair 커서, 에메랄드 링, hover 시 좌표 표시
//
// 수학은 DemoBuilder 의 검증된 구현을 그대로 이식.

import { useRef } from "react";
import type { Hotspot } from "@/types/index";

export interface HotspotEditorProps {
  imageSrc: string;
  hotspots: Hotspot[];
  onChange: (hotspots: Hotspot[]) => void;
  /** 1 이면 single-mode (기존 것 덮어쓰기), undefined 면 unlimited */
  maxCount?: number;
  /** 이미지 aspect 고정용 컨테이너 스타일 (선택) */
  className?: string;
}

export function HotspotEditor({
  imageSrc,
  hotspots,
  onChange,
  maxCount,
  className,
}: HotspotEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef<number | null>(null);
  const justDraggedRef = useRef(false);

  function getNormFromEvent(e: { clientX: number; clientY: number }) {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    const pt = getNormFromEvent(e);
    if (!pt) return;
    const newHotspot: Hotspot = {
      x: pt.x,
      y: pt.y,
      kind: "click",
      label: `클릭 ${(maxCount === 1 ? 1 : hotspots.length + 1)}`,
    };
    if (maxCount === 1) {
      onChange([newHotspot]);
    } else if (maxCount === undefined || hotspots.length < maxCount) {
      onChange([...hotspots, newHotspot]);
    }
  }

  function startDrag(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = idx;

    // 드래그 중 낙관적 업데이트를 위해 로컬 스냅샷 유지
    let current = hotspots.slice();

    const onMove = (ev: MouseEvent) => {
      const pt = getNormFromEvent(ev);
      if (pt == null || draggingRef.current == null) return;
      current = current.map((h, i) =>
        i === draggingRef.current ? { ...h, x: pt.x, y: pt.y } : h
      );
      onChange(current);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      draggingRef.current = null;
      justDraggedRef.current = true;
      // 드롭 시점 final flush (onMove 가 이미 보낸 상태와 동일)
      onChange(current);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function removeHotspot(idx: number) {
    onChange(hotspots.filter((_, i) => i !== idx));
  }

  return (
    <div className={className ?? "relative bg-black/40 rounded-lg overflow-hidden"}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        onClick={handleImageClick}
        className="w-full cursor-crosshair select-none"
        draggable={false}
        title={
          maxCount === 1
            ? "이미지를 클릭 → 단일 hotspot 설정/이동"
            : "이미지를 클릭 → hotspot 추가"
        }
      />
      {hotspots.map((h, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing"
          style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
          onMouseDown={(e) => startDrag(i, e)}
        >
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-emerald-400/30 backdrop-blur shadow-lg shadow-emerald-500/40" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
            {h.label} · ({(h.x * 100).toFixed(0)}%, {(h.y * 100).toFixed(0)}%)
          </div>
          {maxCount !== 1 && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeHotspot(i);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs hidden group-hover:block"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
