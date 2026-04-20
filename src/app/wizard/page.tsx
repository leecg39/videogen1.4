"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { RenderSettings } from "@/types/index";

type Mode = "srt-dubbing" | "script-text";

const FPS_PRESETS = [24, 30, 60];
const SIZE_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: "1920×1080 (가로 FHD)", w: 1920, h: 1080 },
  { label: "1080×1920 (세로/쇼츠)", w: 1080, h: 1920 },
  { label: "1280×720 (가로 HD)", w: 1280, h: 720 },
  { label: "1080×1080 (정사각)", w: 1080, h: 1080 },
];
const STYLE_PACKS: Array<Required<RenderSettings>["stylePack"]> = [
  "dark-neon",
  "editorial",
  "documentary",
  "clean-enterprise",
];
const STYLE_LABEL: Record<string, string> = {
  "dark-neon": "다크 네온 (기본, 테크)",
  editorial: "에디토리얼 (고전적 세리프)",
  documentary: "다큐멘터리 (따뜻한 톤)",
  "clean-enterprise": "클린 엔터프라이즈 (비즈니스)",
};

interface WizardResult {
  id: string;
  title: string;
  mode: Mode;
  render: Required<RenderSettings>;
  handoff: string;
  extraNote: string;
}

export default function WizardPage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [mp3, setMp3] = useState<File | null>(null);
  const [srt, setSrt] = useState<File | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [render, setRender] = useState<Required<RenderSettings>>({
    fps: 30,
    width: 1920,
    height: 1080,
    stylePack: "dark-neon",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WizardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const mp3Ref = useRef<HTMLInputElement>(null);
  const srtRef = useRef<HTMLInputElement>(null);

  const autoId = projectId.trim() ||
    title.trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  function canProceed(): boolean {
    if (step === 1) return mode !== null;
    if (step === 2) return title.trim().length > 0;
    if (step === 3) {
      if (mode === "srt-dubbing") return mp3 !== null && srt !== null;
      if (mode === "script-text") return scriptText.trim().length > 20;
    }
    if (step === 4) return true;
    return false;
  }

  async function submit() {
    if (!mode) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("mode", mode);
    fd.append("title", title);
    fd.append("id", projectId);
    fd.append("render", JSON.stringify(render));
    if (mode === "srt-dubbing") {
      if (mp3) fd.append("mp3", mp3);
      if (srt) fd.append("srt", srt);
    } else {
      fd.append("scriptText", scriptText);
    }
    try {
      const r = await fetch("/api/wizard/create", { method: "POST", body: fd });
      const data = await r.json();
      if (data.ok) {
        setResult(data as WizardResult);
        setStep(5);
      } else {
        setError(data.error ?? "알 수 없는 오류");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function copyHandoff() {
    if (!result) return;
    navigator.clipboard.writeText(result.handoff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setStep(1);
    setMode(null);
    setTitle("");
    setProjectId("");
    setMp3(null);
    setSrt(null);
    setScriptText("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/80 text-sm">
              ← 대시보드
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">영상 제작 위자드</h1>
          </div>
          <span className="text-xs text-white/30">Step {step} / 5</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step ? "bg-emerald-400" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1 — 입력 소스 */}
        {step === 1 && (
          <section>
            <h2 className="text-2xl font-bold mb-2">1. 어떤 입력이 있나요?</h2>
            <p className="text-sm text-white/50 mb-6">
              영상 제작의 시작점에 따라 파이프라인이 달라집니다.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setMode("srt-dubbing")}
                className={`w-full text-left p-5 rounded-xl border transition ${
                  mode === "srt-dubbing"
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold mb-1">
                      🎙️ 이미 더빙된 mp3 + srt 가 있어요
                    </div>
                    <div className="text-xs text-white/60 leading-relaxed">
                      직접 녹음/TTS 한 음성 파일과 자막 파일이 준비된 경우. 가장 빠른 경로 —
                      바로 씬 청킹 → 레이아웃 → 렌더링으로 진행.
                    </div>
                  </div>
                  {mode === "srt-dubbing" && <span className="text-emerald-400">✓</span>}
                </div>
              </button>

              <button
                onClick={() => setMode("script-text")}
                className={`w-full text-left p-5 rounded-xl border transition ${
                  mode === "script-text"
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold mb-1">📝 대본 텍스트만 있어요</div>
                    <div className="text-xs text-white/60 leading-relaxed">
                      직접 작성한 대본 텍스트를 붙여넣으면, ElevenLabs PVC 음성으로 합성한 뒤
                      영상까지 자동 제작합니다.
                    </div>
                  </div>
                  {mode === "script-text" && <span className="text-emerald-400">✓</span>}
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Step 2 — 프로젝트 정보 */}
        {step === 2 && (
          <section>
            <h2 className="text-2xl font-bold mb-2">2. 프로젝트 이름</h2>
            <p className="text-sm text-white/50 mb-6">
              어떤 영상인지 알아볼 수 있게 이름을 붙여주세요.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  프로젝트 제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: AI 시대의 가치 노동"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  프로젝트 ID (선택 — 파일 경로에 사용)
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder={autoId || "자동 생성"}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                />
                <p className="text-xs text-white/30 mt-1">
                  비워두면 제목에서 자동 생성: <code className="text-white/50">{autoId}</code>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Step 3 — 입력 데이터 */}
        {step === 3 && (
          <section>
            <h2 className="text-2xl font-bold mb-2">3. 소스 파일</h2>

            {mode === "srt-dubbing" ? (
              <>
                <p className="text-sm text-white/50 mb-4">
                  mp3 오디오와 srt 자막 파일을 드래그하여 놓거나 클릭해서 선택하세요.
                </p>
                <CombinedDropZone
                  mp3={mp3}
                  srt={srt}
                  onFiles={(files) => {
                    for (const f of files) {
                      const name = f.name.toLowerCase();
                      if (name.endsWith(".mp3") || f.type === "audio/mpeg") {
                        setMp3(f);
                      } else if (name.endsWith(".srt")) {
                        setSrt(f);
                      }
                    }
                  }}
                />
                <div className="space-y-3 mt-4">
                  <FileDropRow
                    label="오디오 (mp3)"
                    file={mp3}
                    accept="audio/mpeg,.mp3"
                    matchFile={(f) =>
                      f.name.toLowerCase().endsWith(".mp3") ||
                      f.type === "audio/mpeg"
                    }
                    inputRef={mp3Ref}
                    onPick={(f) => setMp3(f)}
                  />
                  <FileDropRow
                    label="자막 (srt)"
                    file={srt}
                    accept=".srt,text/plain"
                    matchFile={(f) => f.name.toLowerCase().endsWith(".srt")}
                    inputRef={srtRef}
                    onPick={(f) => setSrt(f)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50 mb-6">
                  대본 텍스트를 붙여넣으세요. <code className="text-white/70">#</code> 또는{" "}
                  <code className="text-white/70">##</code> 로 시작하는 줄을 챕터 제목으로,
                  빈 줄로 문단을 구분합니다.
                </p>
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={16}
                  placeholder={`# 도입\n\n안녕하세요. 오늘은 ~ 에 대해 이야기해볼까 합니다.\n\n먼저 ~ 의 배경부터 짚어볼게요.\n\n## 1. 핵심 개념\n\n~ 란 무엇인가요?`}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded px-4 py-3 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-400"
                />
                <p className="text-xs text-white/30 mt-2">
                  글자 수: {scriptText.length} · TTS 기준 대략 {Math.ceil(scriptText.length / 5)}초
                </p>
              </>
            )}
          </section>
        )}

        {/* Step 4 — 영상 옵션 */}
        {step === 4 && (
          <section>
            <h2 className="text-2xl font-bold mb-2">4. 영상 옵션</h2>
            <p className="text-sm text-white/50 mb-6">
              렌더링 해상도와 스타일을 선택하세요. 나중에 <code className="text-white/70">/settings</code> 에서 수정할 수 있습니다.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  프레임 레이트
                </label>
                <div className="flex gap-2">
                  {FPS_PRESETS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setRender({ ...render, fps: f })}
                      className={`flex-1 px-4 py-2.5 rounded text-sm font-mono border transition ${
                        render.fps === f
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      }`}
                    >
                      {f} fps
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  해상도
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZE_PRESETS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setRender({ ...render, width: s.w, height: s.h })}
                      className={`text-left px-4 py-3 rounded border transition ${
                        render.width === s.w && render.height === s.h
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-sm font-medium text-white/90">{s.label}</div>
                      <div className="text-[11px] text-white/40 font-mono">
                        {s.w}×{s.h}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  스타일
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PACKS.map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setRender({ ...render, stylePack: sp })}
                      className={`text-left px-4 py-3 rounded border transition ${
                        render.stylePack === sp
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-sm font-medium text-white/90">
                        {STYLE_LABEL[sp!] ?? sp}
                      </div>
                      <div className="text-[11px] text-white/40 font-mono">{sp}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 5 — 완료 */}
        {step === 5 && result && (
          <section>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium mb-3">
                ✓ 프로젝트 생성 완료
              </div>
              <h2 className="text-2xl font-bold mb-1">{result.title}</h2>
              <p className="text-sm text-white/50 font-mono">
                data/{result.id}/ · {result.render.fps}fps · {result.render.width}×
                {result.render.height} · {result.render.stylePack}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-white/60 mb-2">
                다음 단계 — 이 지시문을 Claude Code CLI 에 붙여넣으세요
              </label>
              <div className="relative">
                <pre className="bg-[#1a1a1a] border border-emerald-400/40 rounded-lg p-4 text-sm text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
                  {result.handoff}
                </pre>
                <button
                  onClick={copyHandoff}
                  className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3 py-1.5 rounded transition"
                >
                  {copied ? "✓ 복사됨" : "📋 복사"}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">💡 {result.extraNote}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition text-sm"
              >
                새 프로젝트 시작
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 rounded bg-white/5 text-white/70 hover:bg-white/10 transition text-sm"
              >
                대시보드로
              </Link>
            </div>
          </section>
        )}

        {error && step !== 5 && (
          <div className="mt-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {/* Nav buttons */}
        {step < 5 && (
          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-5 py-2.5 rounded border border-white/15 text-white/60 hover:border-white/30 hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm"
            >
              ← 이전
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold transition text-sm"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="px-6 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold transition text-sm"
              >
                {submitting ? "생성 중..." : "프로젝트 생성 →"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FileDropRow({
  label,
  file,
  accept,
  matchFile,
  inputRef,
  onPick,
}: {
  label: string;
  file: File | null;
  accept: string;
  matchFile: (f: File) => boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [rejected, setRejected] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const matched = files.find(matchFile);
    if (matched) {
      onPick(matched);
      setRejected(false);
    } else if (files.length > 0) {
      setRejected(true);
      setTimeout(() => setRejected(false), 2000);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        className={`w-full text-left p-4 rounded-lg border transition cursor-pointer select-none ${
          rejected
            ? "border-red-400/60 bg-red-500/10"
            : dragOver
              ? "border-emerald-400 bg-emerald-500/15 scale-[1.01]"
              : file
                ? "border-emerald-400/50 bg-emerald-500/5"
                : "border-dashed border-white/20 bg-white/5 hover:border-white/40"
        }`}
      >
        <div className="flex items-center justify-between gap-4 pointer-events-none">
          <div>
            <div className="text-xs font-medium text-white/60 mb-1">{label}</div>
            <div className="text-sm text-white/90 truncate">
              {rejected
                ? "❌ 지원하지 않는 파일"
                : dragOver
                  ? "📥 여기에 놓기"
                  : file
                    ? file.name
                    : "파일을 끌어다 놓거나 클릭"}
            </div>
            {file && !dragOver && !rejected && (
              <div className="text-[11px] text-white/40 font-mono mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>
          <span className="text-white/40">{file ? "교체" : "+"}</span>
        </div>
      </div>
    </div>
  );
}

function CombinedDropZone({
  mp3,
  srt,
  onFiles,
}: {
  mp3: File | null;
  srt: File | null;
  onFiles: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  };

  const bothReady = mp3 !== null && srt !== null;

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={handleDrop}
      className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition ${
        dragOver
          ? "border-emerald-400 bg-emerald-500/15 scale-[1.01]"
          : bothReady
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-white/15 bg-white/[0.03] hover:border-white/25"
      }`}
    >
      <div className="pointer-events-none">
        <div className="text-3xl mb-2">{dragOver ? "📥" : bothReady ? "✅" : "🎯"}</div>
        <div className="text-sm font-medium text-white/80 mb-1">
          {dragOver
            ? "파일을 놓으세요"
            : bothReady
              ? "두 파일 모두 준비됨"
              : "mp3 + srt 파일을 한 번에 드래그하세요"}
        </div>
        <div className="text-[11px] text-white/40">
          확장자로 자동 분류됩니다 · 여러 파일 동시 드롭 지원
        </div>
      </div>
    </div>
  );
}
