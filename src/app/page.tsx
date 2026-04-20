"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/types";

interface ProjectWithScenes extends Project {
  sceneCount?: number;
}

type FriendlyState = {
  label: string;
  tone: "idle" | "working" | "done";
  emoji: string;
};

const STATUS_MAP: Record<string, FriendlyState> = {
  draft: { label: "준비 중", tone: "idle", emoji: "📝" },
  initialized: { label: "준비 중", tone: "idle", emoji: "📝" },
  chunked: { label: "장면 설계 단계", tone: "working", emoji: "🎭" },
  scened: { label: "레이아웃 단계", tone: "working", emoji: "🎨" },
  voiced: { label: "음성 생성됨", tone: "working", emoji: "🎙️" },
  layout: { label: "레이아웃 단계", tone: "working", emoji: "🎨" },
  rendered: { label: "완성", tone: "done", emoji: "✅" },
  verified: { label: "완성", tone: "done", emoji: "✅" },
};

const toneColors: Record<FriendlyState["tone"], string> = {
  idle: "bg-white/10 text-white/60 border-white/15",
  working: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  done: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithScenes[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        const list: ProjectWithScenes[] = data.projects ?? [];

        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const sRes = await fetch(`/api/projects/${p.id}/scenes-v2`);
              if (sRes.ok) {
                const scenes = await sRes.json();
                return {
                  ...p,
                  sceneCount: Array.isArray(scenes) ? scenes.length : 0,
                };
              }
            } catch {
              /* ignore */
            }
            return p;
          })
        );
        setProjects(enriched);
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const handleDelete = async (project: ProjectWithScenes) => {
    if (
      !confirm(
        `"${project.name}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } else {
        const data = await res.json();
        alert(data.error ?? "삭제에 실패했습니다");
      }
    } catch {
      alert("삭제 요청에 실패했습니다");
    }
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}분 ${sec}초`;
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const ta =
        typeof a.updated_at === "string"
          ? new Date(a.updated_at).getTime()
          : (a.updated_at as unknown as number) ?? 0;
      const tb =
        typeof b.updated_at === "string"
          ? new Date(b.updated_at).getTime()
          : (b.updated_at as unknown as number) ?? 0;
      return tb - ta;
    });
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#08060D] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-bold shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)]">
              V
            </div>
            <h1 className="text-lg font-semibold tracking-tight">VideoGen</h1>
          </div>
          <Link
            href="/settings"
            className="text-xs font-medium px-3 py-1.5 rounded-md text-white/50 hover:text-white/90 hover:bg-white/5 transition"
          >
            ⚙ 설정
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2">무엇을 만들어 볼까요?</h2>
          <p className="text-sm text-white/50">
            영상 종류를 선택하면 자동으로 만들어드려요
          </p>
        </section>

        {/* New project entry cards */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          <EntryCard
            href="/wizard"
            emoji="🎬"
            title="영상 제작 위자드"
            description="음성 파일(mp3+srt)이나 대본 텍스트로 시작"
            tone="purple"
            primary
          />
          <EntryCard
            href="/demo-builder"
            emoji="🖱️"
            title="스크린샷 튜토리얼"
            description="스크린샷에 설명·커서 애니메이션·음성 추가"
            tone="emerald"
          />
          <EntryCard
            href="/video-demo-builder"
            emoji="📹"
            title="녹화 영상 튜토리얼"
            description="녹화된 mp4 위에 자막과 음성 추가"
            tone="sky"
          />
        </section>

        {/* Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90">
              내 프로젝트
            </h3>
            <span className="text-xs text-white/40">
              {projects.length}개
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
              <div className="text-4xl mb-3">✨</div>
              <div className="text-sm text-white/60 mb-1">
                아직 프로젝트가 없어요
              </div>
              <div className="text-xs text-white/35">
                위에서 영상 종류를 선택해 첫 프로젝트를 만들어 보세요
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedProjects.map((p) => {
                const state =
                  STATUS_MAP[p.status] ?? {
                    label: p.status,
                    tone: "idle" as const,
                    emoji: "📝",
                  };
                return (
                  <div
                    key={p.id}
                    className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/25 hover:bg-white/[0.04] transition"
                  >
                    <Link
                      href={`/control/${p.id}`}
                      className="absolute inset-0 rounded-xl"
                      aria-label={`${p.name} 열기`}
                    />
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="font-medium text-[15px] text-white/95 truncate flex-1">
                        {p.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(p);
                        }}
                        className="relative z-10 shrink-0 w-7 h-7 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 grid place-items-center text-sm"
                        aria-label="삭제"
                      >
                        🗑
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border ${toneColors[state.tone]}`}
                      >
                        <span>{state.emoji}</span>
                        <span>{state.label}</span>
                      </span>
                      {p.total_duration_ms > 0 && (
                        <span className="text-[11px] text-white/40">
                          {formatDuration(p.total_duration_ms)}
                        </span>
                      )}
                      {p.sceneCount != null && p.sceneCount > 0 && (
                        <span className="text-[11px] text-white/40">
                          장면 {p.sceneCount}개
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end text-[11px] text-white/50 group-hover:text-purple-300 transition">
                      <span>열기 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EntryCard({
  href,
  emoji,
  title,
  description,
  tone,
  primary,
}: {
  href: string;
  emoji: string;
  title: string;
  description: string;
  tone: "purple" | "emerald" | "sky";
  primary?: boolean;
}) {
  const toneStyles = {
    purple: {
      border: "border-purple-500/40",
      hoverBorder: "hover:border-purple-400/70",
      bg: primary
        ? "bg-gradient-to-br from-purple-500/20 to-purple-500/5"
        : "bg-gradient-to-br from-purple-500/10 to-purple-500/0",
      glow: primary
        ? "shadow-[0_20px_60px_-20px_rgba(168,85,247,0.5)]"
        : "",
      text: "text-purple-200",
      arrow: "text-purple-300",
    },
    emerald: {
      border: "border-emerald-500/35",
      hoverBorder: "hover:border-emerald-400/60",
      bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/0",
      glow: "",
      text: "text-emerald-200",
      arrow: "text-emerald-300",
    },
    sky: {
      border: "border-sky-500/35",
      hoverBorder: "hover:border-sky-400/60",
      bg: "bg-gradient-to-br from-sky-500/10 to-sky-500/0",
      glow: "",
      text: "text-sky-200",
      arrow: "text-sky-300",
    },
  }[tone];

  return (
    <Link
      href={href}
      className={`group relative block p-6 rounded-2xl border ${toneStyles.border} ${toneStyles.bg} ${toneStyles.hoverBorder} ${toneStyles.glow} transition`}
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <div className={`text-base font-semibold ${toneStyles.text} mb-1`}>
        {title}
      </div>
      <div className="text-xs text-white/55 leading-relaxed">{description}</div>
      <span
        className={`absolute top-5 right-5 ${toneStyles.arrow} group-hover:translate-x-1 transition text-lg`}
      >
        →
      </span>
    </Link>
  );
}
