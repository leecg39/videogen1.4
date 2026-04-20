"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { PropertyField, NumberField, TextInputField, SelectField } from "./shared";
import { FolderOpen, X } from "lucide-react";
import type { SceneBackground } from "@/types";

function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (open && images.length === 0) {
      fetch("/api/assets")
        .then((r) => r.json())
        .then((data: string[]) => setImages(data))
        .catch(() => {});
    }
  }, [open, images.length]);

  const filtered = filter
    ? images.filter((img) => img.toLowerCase().includes(filter.toLowerCase()))
    : images;

  return (
    <div className="relative">
      <PropertyField label="src">
        <div className="flex gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="screenshots/example.png"
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 placeholder:text-white/20 focus:border-purple-500/50 focus:outline-none"
          />
          <button
            onClick={() => setOpen(!open)}
            className="px-1.5 bg-purple-500/20 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors"
            title="이미지 선택"
          >
            <FolderOpen size={14} className="text-purple-300" />
          </button>
        </div>
      </PropertyField>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/15 rounded-lg shadow-xl max-h-[300px] overflow-hidden flex flex-col">
          {/* 검색 + 닫기 */}
          <div className="flex items-center gap-1 p-2 border-b border-white/10">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="검색..."
              autoFocus
              className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X size={12} className="text-white/40" />
            </button>
          </div>

          {/* 이미지 목록 */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-[10px] text-white/30 text-center">
                {images.length === 0 ? "로딩 중..." : "결과 없음"}
              </div>
            ) : (
              filtered.map((img) => (
                <button
                  key={img}
                  onClick={() => {
                    onChange(img);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-purple-500/15 transition-colors"
                >
                  {/* 미니 썸네일 */}
                  <img
                    src={`/${img}`}
                    alt=""
                    className="w-8 h-8 object-cover rounded border border-white/10 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-[10px] text-white/70 truncate">
                    {img}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BackgroundSection() {
  const scene = useEditorStore((s) => s.getActiveScene());
  const updateBg = useEditorStore((s) => s.updateSceneBackground);

  const bg = scene?.background;

  const update = (patch: Partial<SceneBackground>) => {
    updateBg({ ...bg, src: bg?.src ?? "", ...patch });
  };

  const remove = () => {
    updateBg(undefined);
  };

  if (!bg) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] text-white/30 mb-2">
          이 씬에 배경 스크린샷이 없습니다
        </div>
        <button
          onClick={() =>
            updateBg({
              src: "",
              overlayOpacity: 0.55,
              blur: 10,
              scale: 1.1,
              vignette: 0.5,
            })
          }
          className="w-full py-1.5 text-[11px] bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          + 배경 이미지 추가
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 이미지 경로 (폴더 아이콘 포함) */}
      <div className="text-[10px] text-white/50 font-medium mb-1">
        📷 배경 이미지
      </div>
      <ImagePicker
        value={bg.src}
        onChange={(v) => update({ src: v })}
      />

      {/* 미리보기 */}
      {bg.src && (
        <div className="rounded overflow-hidden border border-white/10">
          <img
            src={`/${bg.src}`}
            alt="preview"
            className="w-full h-20 object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* 오버레이 설정 */}
      <div className="text-[10px] text-white/50 font-medium mt-3 mb-1">
        🌑 오버레이
      </div>
      <NumberField
        label="opacity"
        value={bg.overlayOpacity}
        onChange={(v) => update({ overlayOpacity: v })}
        min={0}
        max={1}
        step={0.05}
        placeholder="0.55"
      />
      <NumberField
        label="blur"
        value={bg.blur}
        onChange={(v) => update({ blur: v })}
        min={0}
        max={30}
        step={1}
        placeholder="10"
      />
      <NumberField
        label="scale"
        value={bg.scale}
        onChange={(v) => update({ scale: v })}
        min={1}
        max={1.5}
        step={0.05}
        placeholder="1.1"
      />
      <NumberField
        label="vignette"
        value={bg.vignette}
        onChange={(v) => update({ vignette: v })}
        min={0}
        max={1}
        step={0.1}
        placeholder="0.5"
      />

      {/* 패닝 */}
      <div className="text-[10px] text-white/50 font-medium mt-3 mb-1">
        🎬 패닝
      </div>
      <SelectField
        label="direction"
        value={bg.pan?.direction ?? "left"}
        options={["left", "right", "up", "down"]}
        onChange={(v) =>
          update({
            pan: {
              ...bg.pan,
              direction: v as "left" | "right" | "up" | "down",
            },
          })
        }
      />
      <NumberField
        label="distance"
        value={bg.pan?.distance}
        onChange={(v) =>
          update({ pan: { ...bg.pan, distance: v } })
        }
        min={0}
        max={100}
        step={5}
        placeholder="30"
      />

      {/* 출처 라벨 */}
      <div className="text-[10px] text-white/50 font-medium mt-3 mb-1">
        🏷️ 출처 라벨
      </div>
      <TextInputField
        label="text"
        value={bg.sourceLabel?.text ?? ""}
        onChange={(v) =>
          update({
            sourceLabel: v
              ? { ...bg.sourceLabel, text: v, position: bg.sourceLabel?.position ?? "bottom-left" }
              : undefined,
          })
        }
        placeholder="OpenAI Blog"
      />
      {bg.sourceLabel && (
        <SelectField
          label="position"
          value={bg.sourceLabel.position ?? "bottom-left"}
          options={["bottom-left", "bottom-right"]}
          onChange={(v) =>
            update({
              sourceLabel: {
                ...bg.sourceLabel!,
                position: v as "bottom-left" | "bottom-right",
              },
            })
          }
        />
      )}

      {/* 삭제 */}
      <button
        onClick={remove}
        className="w-full mt-4 py-1.5 text-[11px] bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 transition-colors"
      >
        배경 이미지 제거
      </button>
    </div>
  );
}
