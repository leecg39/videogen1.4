"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DemoSpec, DemoSlide, Hotspot } from "@/types/index";

interface DemoProjectListItem {
  id: string;
  title: string;
  slides: number;
}

export function DemoBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const [spec, setSpec] = useState<DemoSpec | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [projectList, setProjectList] = useState<DemoProjectListItem[]>([]);

  // 프로젝트 리스트 로드 (projectId 없을 때만)
  useEffect(() => {
    if (projectId) return;
    fetch("/api/demo-projects")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.projects) setProjectList(data.projects);
      })
      .catch(() => {});
  }, [projectId]);

  // Load spec
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/demo-projects/${projectId}/spec`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setSpec(data);
          if (data.slides[0]) setSelectedSlideId(data.slides[0].id);
        }
      });
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const r = await fetch(`/api/demo-projects/${projectId}/spec`);
    if (r.ok) {
      const data = await r.json();
      setSpec(data);
    }
  }, [projectId]);

  async function createProject() {
    if (!newTitle.trim()) return;
    setLoading(true);
    const r = await fetch("/api/demo-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const data = await r.json();
    setLoading(false);
    if (data.id) {
      router.push(`/demo-builder?projectId=${data.id}`);
    }
  }

  async function uploadFiles(files: FileList) {
    if (!projectId) return;
    setLoading(true);
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("file", f);
    await fetch(`/api/demo-projects/${projectId}/upload`, {
      method: "POST",
      body: fd,
    });
    await reload();
    setLoading(false);
  }

  async function patchSlide(slideId: string, patch: Partial<DemoSlide>) {
    if (!projectId) return;
    await fetch(`/api/demo-projects/${projectId}/spec`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slideId, slide: patch }),
    });
    await reload();
  }

  async function deleteSlide(slideId: string) {
    if (!projectId) return;
    if (!confirm("이 슬라이드를 삭제할까요?")) return;
    await fetch(`/api/demo-projects/${projectId}/spec`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: slideId }),
    });
    await reload();
  }

  async function submit() {
    if (!projectId) return;
    setSubmitting(true);
    setMessage(null);
    const r = await fetch(`/api/demo-projects/${projectId}/submit`, {
      method: "POST",
    });
    const data = await r.json();
    setSubmitting(false);
    setMessage(
      data.ok
        ? `✅ ${data.hint}`
        : `❌ ${data.error}${data.missing ? `: ${data.missing.join(", ")}` : ""}`
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Product Demo</h1>

          {/* 기존 프로젝트 목록 */}
          {projectList.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-white/60 mb-3">
                기존 프로젝트 ({projectList.length})
              </h2>
              <div className="space-y-2">
                {projectList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      router.push(`/demo-builder?projectId=${p.id}`)
                    }
                    className="w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:border-emerald-400/40 hover:bg-white/10 transition flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">
                        {p.title}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {p.id} · {p.slides} 슬라이드
                      </div>
                    </div>
                    <span className="text-white/30 group-hover:text-emerald-400">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 새 프로젝트 */}
          <section>
            <h2 className="text-sm font-semibold text-white/60 mb-3">
              새 프로젝트
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="프로젝트 이름 (예: PressCut 소개)"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={createProject}
                disabled={loading || !newTitle.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 text-black font-semibold py-3 rounded transition"
              >
                {loading ? "생성 중..." : "프로젝트 생성"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
        프로젝트 로딩 중...
      </div>
    );
  }

  const selected = spec.slides.find((s) => s.id === selectedSlideId);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{spec.title}</h1>
          <p className="text-xs text-white/40">
            {spec.slides.length}개 슬라이드 · {spec.id}
          </p>
        </div>
        <button
          onClick={submit}
          disabled={submitting || spec.slides.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold px-5 py-2 rounded transition"
        >
          {submitting ? "전송 중..." : "Claude에 전송 → /vg-demo 실행"}
        </button>
      </header>

      {message && (
        <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/30 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left — slide list */}
        <aside className="w-64 border-r border-white/10 flex flex-col">
          <SlideUploader onUpload={uploadFiles} loading={loading} />
          <div className="flex-1 overflow-y-auto">
            {spec.slides.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSlideId(s.id)}
                className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition ${
                  s.id === selectedSlideId ? "bg-emerald-500/10 border-l-2 border-l-emerald-400" : ""
                }`}
              >
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-white/40 w-6">{s.order}</span>
                  <img
                    src={`/${s.image}`}
                    alt=""
                    className="w-16 h-10 object-cover rounded bg-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">
                      {s.action || <em className="text-white/30">미입력</em>}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center — slide editor */}
        <main className="flex-1 overflow-y-auto p-8">
          {selected ? (
            <SlideEditor
              key={selected.id}
              slide={selected}
              onChange={(patch) => patchSlide(selected.id, patch)}
              onDelete={() => deleteSlide(selected.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30">
              왼쪽에서 슬라이드를 선택하거나 이미지를 업로드하세요.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SlideUploader({
  onUpload,
  loading,
}: {
  onUpload: (files: FileList) => void;
  loading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 border-b border-white/10">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded py-3 text-sm text-white/70 transition"
      >
        {loading ? "업로드 중..." : "+ 이미지 추가"}
      </button>
    </div>
  );
}

function SlideEditor({
  slide,
  onChange,
  onDelete,
}: {
  slide: DemoSlide;
  onChange: (patch: Partial<DemoSlide>) => void;
  onDelete: () => void;
}) {
  const [action, setAction] = useState(slide.action);
  const [hotspots, setHotspots] = useState<Hotspot[]>(slide.hotspots ?? []);
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
    const newSpots: Hotspot[] = [
      ...hotspots,
      { x: pt.x, y: pt.y, kind: "click", label: `클릭 ${hotspots.length + 1}` },
    ];
    setHotspots(newSpots);
    onChange({ hotspots: newSpots });
  }

  function startDrag(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = idx;

    const onMove = (ev: MouseEvent) => {
      const pt = getNormFromEvent(ev);
      if (!pt) return;
      setHotspots((prev) => {
        const next = prev.map((h, i) =>
          i === draggingRef.current ? { ...h, x: pt.x, y: pt.y } : h
        );
        return next;
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      draggingRef.current = null;
      justDraggedRef.current = true;
      // 자동 저장 — 최신 상태를 flush
      setHotspots((curr) => {
        onChange({ hotspots: curr });
        return curr;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function removeHotspot(idx: number) {
    const next = hotspots.filter((_, i) => i !== idx);
    setHotspots(next);
    onChange({ hotspots: next });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">슬라이드 {slide.order}</h2>
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-300"
        >
          삭제
        </button>
      </div>

      <div className="relative bg-black/40 rounded-lg overflow-hidden">
        <img
          ref={imgRef}
          src={`/${slide.image}`}
          alt=""
          onClick={handleImageClick}
          className="w-full cursor-crosshair"
          title="이미지를 클릭하여 클릭 hotspot 추가"
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
          </div>
        ))}
      </div>

      <p className="text-xs text-white/40">
        이미지를 클릭 → hotspot 추가. 기존 hotspot은 드래그로 이동 (드롭 시 자동 저장).
      </p>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          액션 설명 (한 줄)
        </label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onBlur={() => onChange({ action })}
          placeholder="예: 파일 메뉴 클릭"
          className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
        />
        <p className="text-xs text-white/30 mt-1">
          Claude가 이 한 줄을 자연 나레이션으로 확장합니다.
        </p>
      </div>

      {hotspots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-2">
            Hotspot {hotspots.length}개
          </h3>
          <div className="space-y-1">
            {hotspots.map((h, i) => (
              <div
                key={i}
                className="text-xs text-white/50 bg-white/5 rounded px-3 py-2 flex justify-between"
              >
                <span>
                  {h.label} — ({(h.x * 100).toFixed(0)}%, {(h.y * 100).toFixed(0)}%)
                </span>
                <button
                  onClick={() => removeHotspot(i)}
                  className="text-red-400 hover:text-red-300"
                >
                  제거
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
