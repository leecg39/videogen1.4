"use client";

// VideoDemoBuilder — /video-demo-builder 페이지의 메인 컴포넌트.
// 원본 녹화 비디오 업로드 → ffmpeg scene detection → segment 주석 → /vg-video-demo 실행.

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { VideoSpec, VideoSegment, Hotspot } from "@/types/index";
import { HotspotEditor } from "./HotspotEditor";

function fmtMs(ms: number): string {
  const total = Math.max(0, Math.round(ms / 100) / 10);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m.toString().padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

interface VideoProjectListItem {
  id: string;
  title: string;
  segments: number;
  videoDuration_ms: number;
}

export function VideoDemoBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const [spec, setSpec] = useState<VideoSpec | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [projectList, setProjectList] = useState<VideoProjectListItem[]>([]);

  useEffect(() => {
    if (projectId) return;
    fetch("/api/video-demo-projects")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.projects) setProjectList(data.projects);
      })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/video-demo-projects/${projectId}/spec`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setSpec(data);
          if (data.segments?.[0]) setSelectedSegmentId(data.segments[0].id);
        }
      });
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const r = await fetch(`/api/video-demo-projects/${projectId}/spec`);
    if (r.ok) {
      const data = await r.json();
      setSpec(data);
    }
  }, [projectId]);

  async function createProject() {
    if (!newTitle.trim()) return;
    setLoading(true);
    const r = await fetch("/api/video-demo-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const data = await r.json();
    setLoading(false);
    if (data.id) {
      router.push(`/video-demo-builder?projectId=${data.id}`);
    }
  }

  async function uploadVideo(file: File) {
    if (!projectId) return;
    setLoading(true);
    setMessage("비디오 업로드 + scene detection 중...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(
      `/api/video-demo-projects/${projectId}/upload-video`,
      { method: "POST", body: fd }
    );
    const data = await r.json();
    setLoading(false);
    if (data.ok) {
      setSpec(data.spec);
      if (data.spec.segments[0]) setSelectedSegmentId(data.spec.segments[0].id);
      setMessage(`✅ ${data.segmentCount}개 세그먼트 감지`);
    } else {
      setMessage(`❌ ${data.error ?? "업로드 실패"}`);
    }
  }

  async function patchSegment(
    segmentId: string,
    patch: Partial<VideoSegment>
  ) {
    if (!projectId) return;
    await fetch(`/api/video-demo-projects/${projectId}/spec`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segmentId, segment: patch }),
    });
    await reload();
  }

  async function deleteSegment(segmentId: string) {
    if (!projectId) return;
    if (!confirm("이 세그먼트를 삭제할까요?")) return;
    await fetch(`/api/video-demo-projects/${projectId}/spec`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: segmentId }),
    });
    await reload();
  }

  function copySkillCommand() {
    if (!projectId) return;
    const cmd = `/vg-video-demo ${projectId}`;
    navigator.clipboard.writeText(cmd);
    setMessage(`✅ 복사됨: ${cmd} — Claude Code 에 붙여넣으세요.`);
  }

  // 프로젝트 선택/생성 화면
  if (!projectId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Video Demo</h1>
          <p className="text-sm text-white/50 mb-8 max-w-lg">
            녹화된 제품 영상(mp4) 을 업로드하면 자동으로 씬을 감지하고, 세그먼트별로
            액션/핫스팟을 주석해 나레이션+자막+SFX 가 합쳐진 최종 영상을 만듭니다.
          </p>

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
                      router.push(`/video-demo-builder?projectId=${p.id}`)
                    }
                    className="w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:border-sky-400/40 hover:bg-white/10 transition flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">
                        {p.title}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {p.id} · {p.segments} 세그먼트
                        {p.videoDuration_ms > 0 &&
                          ` · ${fmtMs(p.videoDuration_ms)}`}
                      </div>
                    </div>
                    <span className="text-white/30">→</span>
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
                placeholder="프로젝트 이름 (예: PressCut 튜토리얼)"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-sky-400"
              />
              <button
                onClick={createProject}
                disabled={loading || !newTitle.trim()}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-white/10 text-black font-semibold py-3 rounded transition"
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

  const selected = spec.segments.find((s) => s.id === selectedSegmentId);
  const hasVideo = Boolean(spec.videoSrc) && spec.videoWidth > 0;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{spec.title}</h1>
          <p className="text-xs text-white/40">
            {spec.segments.length}개 세그먼트 ·{" "}
            {hasVideo
              ? `${spec.videoWidth}×${spec.videoHeight} · ${fmtMs(spec.videoDuration_ms)}`
              : "비디오 없음"}{" "}
            · {spec.id}
          </p>
        </div>
        <button
          onClick={copySkillCommand}
          disabled={spec.segments.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold px-5 py-2 rounded transition"
        >
          /vg-video-demo 커맨드 복사
        </button>
      </header>

      {message && (
        <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/30 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left — segment list */}
        <aside className="w-72 border-r border-white/10 flex flex-col">
          <VideoUploader onUpload={uploadVideo} loading={loading} hasVideo={hasVideo} />
          <div className="flex-1 overflow-y-auto">
            {spec.segments.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSegmentId(s.id)}
                className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition ${
                  s.id === selectedSegmentId
                    ? "bg-emerald-500/10 border-l-2 border-l-emerald-400"
                    : ""
                }`}
              >
                <div className="flex gap-3 items-start">
                  <span className="text-xs text-white/40 w-6 mt-1">{s.order}</span>
                  {s.thumbnail ? (
                    <img
                      src={`/${s.thumbnail}`}
                      alt=""
                      className="w-20 h-12 object-cover rounded bg-white/5"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded bg-white/5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/40 font-mono">
                      {fmtMs(s.startMs)} → {fmtMs(s.endMs)}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {s.action || <em className="text-white/30">미입력</em>}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center — segment editor */}
        <main className="flex-1 overflow-y-auto p-8">
          {!hasVideo ? (
            <div className="flex h-full items-center justify-center text-white/30">
              왼쪽에서 비디오를 업로드하면 세그먼트가 자동 생성됩니다.
            </div>
          ) : selected ? (
            <SegmentEditor
              key={selected.id}
              segment={selected}
              videoSrc={spec.videoSrc}
              mediaAspect={spec.videoWidth / spec.videoHeight}
              onChange={(patch) => patchSegment(selected.id, patch)}
              onDelete={() => deleteSegment(selected.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30">
              왼쪽에서 세그먼트를 선택하세요.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function VideoUploader({
  onUpload,
  loading,
  hasVideo,
}: {
  onUpload: (file: File) => void;
  loading: boolean;
  hasVideo: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 border-b border-white/10">
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded py-3 text-sm text-white/70 transition"
      >
        {loading ? "처리 중..." : hasVideo ? "비디오 교체" : "+ 비디오 업로드 (mp4)"}
      </button>
    </div>
  );
}

function SegmentEditor({
  segment,
  videoSrc,
  mediaAspect,
  onChange,
  onDelete,
}: {
  segment: VideoSegment;
  videoSrc: string;
  mediaAspect: number;
  onChange: (patch: Partial<VideoSegment>) => void;
  onDelete: () => void;
}) {
  const [action, setAction] = useState(segment.action);
  const previewRef = useRef<HTMLVideoElement>(null);

  // 미리보기: 선택된 segment 의 시작 지점으로 seek
  useEffect(() => {
    const v = previewRef.current;
    if (!v) return;
    const handler = () => {
      v.currentTime = segment.startMs / 1000;
    };
    if (v.readyState >= 1) {
      handler();
    } else {
      v.addEventListener("loadedmetadata", handler, { once: true });
    }
  }, [segment.id, segment.startMs]);

  function setHotspot(list: Hotspot[]) {
    // maxCount=1 이므로 list 는 0/1 개
    onChange({ hotspot: list[0] ?? null });
  }

  const hotspots = segment.hotspot ? [segment.hotspot] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">세그먼트 {segment.order}</h2>
          <p className="text-xs text-white/40 font-mono mt-1">
            {fmtMs(segment.startMs)} → {fmtMs(segment.endMs)} (
            {fmtMs(segment.endMs - segment.startMs)})
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-300"
        >
          삭제
        </button>
      </div>

      {/* 핫스팟 에디터 — 썸네일 위에서 단일 hotspot */}
      <div>
        <div
          className="relative"
          style={{ aspectRatio: mediaAspect, background: "#000" }}
        >
          <HotspotEditor
            imageSrc={`/${segment.thumbnail}`}
            hotspots={hotspots}
            onChange={setHotspot}
            maxCount={1}
          />
        </div>
        <p className="text-xs text-white/40 mt-2">
          썸네일을 클릭 → 클릭 지점 설정. 기존 지점은 드래그로 이동 (자동 저장).
        </p>
      </div>

      {/* 원본 미리보기 */}
      <details className="bg-white/5 rounded">
        <summary className="cursor-pointer px-4 py-2 text-sm text-white/70">
          원본 비디오 미리보기 (이 세그먼트 구간)
        </summary>
        <div className="p-3">
          <video
            ref={previewRef}
            src={`/${videoSrc}`}
            controls
            className="w-full rounded bg-black"
          />
        </div>
      </details>

      {/* 액션 입력 */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          액션 설명 (한 줄)
        </label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onBlur={() => onChange({ action })}
          placeholder="예: 검색창에 키워드 입력"
          className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
        />
        <p className="text-xs text-white/30 mt-1">
          Claude가 이 한 줄을 자연 나레이션으로 확장합니다.
        </p>
      </div>

      {/* 옵션 */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={segment.showCursor}
            onChange={(e) => onChange({ showCursor: e.target.checked })}
            className="accent-emerald-400"
          />
          커서 오버레이 표시
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={segment.keepOriginalAudio}
            onChange={(e) => onChange({ keepOriginalAudio: e.target.checked })}
            className="accent-emerald-400"
          />
          원본 오디오 유지
        </label>
      </div>

      {/* 구간 미세 조정 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">
          구간 미세 조정 (ms)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={segment.startMs}
            onChange={(e) =>
              onChange({ startMs: Math.max(0, Number(e.target.value) || 0) })
            }
            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
          />
          <span className="text-white/30 self-center">→</span>
          <input
            type="number"
            value={segment.endMs}
            onChange={(e) => onChange({ endMs: Number(e.target.value) || 0 })}
            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}
