"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RenderSettings } from "@/types/index";
import type { SettingsEntry } from "../api/settings/route";

const FPS_PRESETS = [24, 30, 60];
const SIZE_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: "1920×1080 (FHD 가로)", w: 1920, h: 1080 },
  { label: "1280×720 (HD 가로)", w: 1280, h: 720 },
  { label: "1080×1920 (FHD 세로/쇼츠)", w: 1080, h: 1920 },
  { label: "720×1280 (HD 세로)", w: 720, h: 1280 },
  { label: "1080×1080 (정사각)", w: 1080, h: 1080 },
  { label: "3840×2160 (4K 가로)", w: 3840, h: 2160 },
];
const STYLE_PACKS: Array<RenderSettings["stylePack"]> = [
  "dark-neon",
  "editorial",
  "documentary",
  "clean-enterprise",
];

const KIND_LABEL: Record<SettingsEntry["kind"], string> = {
  regular: "교육 영상",
  "product-demo": "Product Demo",
  "video-demo": "Video Demo",
};
const KIND_COLOR: Record<SettingsEntry["kind"], string> = {
  regular: "border-purple-500/30 text-purple-300 bg-purple-500/10",
  "product-demo": "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",
  "video-demo": "border-sky-500/30 text-sky-300 bg-sky-500/10",
};

export default function SettingsPage() {
  const [projects, setProjects] = useState<SettingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save(id: string, render: Required<RenderSettings>) {
    setSavingId(id);
    setMessage(null);
    const r = await fetch(`/api/settings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ render }),
    });
    const data = await r.json();
    setSavingId(null);
    if (data.ok) {
      setMessage(`✅ ${id} 설정 저장됨 (${data.source})`);
    } else {
      setMessage(`❌ ${data.error ?? "저장 실패"}`);
    }
  }

  function updateLocal(id: string, patch: Partial<RenderSettings>) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, render: { ...p.render, ...patch } as Required<RenderSettings> }
          : p
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/80 text-sm">
              ← 대시보드
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">프로젝트 설정</h1>
          </div>
          <span className="text-xs text-white/30">
            {projects.length} projects
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-white/30 text-sm">
            프로젝트가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="border border-white/10 rounded-xl p-5 bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[15px] text-white/90 truncate">
                        {p.title}
                      </h3>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          KIND_COLOR[p.kind]
                        }`}
                      >
                        {KIND_LABEL[p.kind]}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 font-mono">
                      {p.id} · {p.source}
                    </div>
                  </div>
                  <button
                    onClick={() => save(p.id, p.render)}
                    disabled={savingId === p.id}
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold text-xs px-4 py-2 rounded transition"
                  >
                    {savingId === p.id ? "저장 중..." : "저장"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* fps */}
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                      FPS
                    </label>
                    <div className="flex gap-1">
                      {FPS_PRESETS.map((f) => (
                        <button
                          key={f}
                          onClick={() => updateLocal(p.id, { fps: f })}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-mono border transition ${
                            p.render.fps === f
                              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* resolution */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                      해상도
                    </label>
                    <select
                      value={`${p.render.width}x${p.render.height}`}
                      onChange={(e) => {
                        const [w, h] = e.target.value.split("x").map(Number);
                        updateLocal(p.id, { width: w, height: h });
                      }}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-emerald-400"
                    >
                      {SIZE_PRESETS.map((s) => (
                        <option
                          key={s.label}
                          value={`${s.w}x${s.h}`}
                          className="bg-[#1a1a1a]"
                        >
                          {s.label}
                        </option>
                      ))}
                      {/* 현재 값이 프리셋에 없으면 커스텀 옵션 */}
                      {!SIZE_PRESETS.some(
                        (s) => s.w === p.render.width && s.h === p.render.height
                      ) && (
                        <option
                          value={`${p.render.width}x${p.render.height}`}
                          className="bg-[#1a1a1a]"
                        >
                          {p.render.width}×{p.render.height} (커스텀)
                        </option>
                      )}
                    </select>
                  </div>

                  {/* stylePack */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                      Style Pack
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {STYLE_PACKS.map((sp) => (
                        <button
                          key={sp}
                          onClick={() => updateLocal(p.id, { stylePack: sp })}
                          className={`px-3 py-1.5 rounded text-xs border transition ${
                            p.render.stylePack === sp
                              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
