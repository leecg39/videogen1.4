"use client";

import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import Link from "next/link";
import type { ProjectStatus, StepStatus } from "@/services/project-status";
import type { JobRecord, JobLogLine } from "@/services/job-runner";
import {
  getPipeline,
  ORCHESTRATOR_STEP_ID,
  PIPELINE_IDS,
  PIPELINES,
  type PipelineDefinition,
  type PipelineId,
  type PipelineStep,
} from "@/lib/pipelines";
import {
  parseLogLines,
  type PrettyLogEvent,
  type PrettyTone,
} from "@/lib/log-parser";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

type ControlStatusResponse = ProjectStatus & {
  available_pipelines: PipelineId[];
  suggested_pipeline: PipelineId;
};

const STEP_EMOJI: Record<string, string> = {
  script: "✍️",
  voice: "🎙️",
  chunk: "✂️",
  scene: "🎭",
  layout: "🎨",
  render: "🎬",
  "demo-script": "✍️",
  "demo-voice": "🎙️",
  "demo-layout": "🎨",
  "demo-fx": "✨",
  "video-demo-script": "✍️",
  "video-demo-voice": "🎙️",
  "video-demo-layout": "🎨",
  cinematic: "🎞️",
};

const STEP_HELP: Record<string, string> = {
  script: "주제를 읽고 자연스러운 대본을 작성해요",
  voice: "대본을 AI 목소리로 읽어 mp3 와 자막(srt)을 만들어요",
  chunk: "긴 자막을 문장 단위로 쪼개서 장면 후보를 뽑아요",
  scene: "자막의 의미에 맞는 장면 블록과 흐름을 설계해요",
  layout: "각 장면에 들어갈 텍스트·이미지·배치를 그려요",
  render: "모든 장면을 합쳐서 최종 mp4 영상을 만들어요",
  "demo-script": "스크린샷마다 어울리는 설명 문장을 만들어요",
  "demo-voice": "설명을 AI 목소리로 녹음하고 길이를 계산해요",
  "demo-layout": "스크린샷 위에 커서 움직임과 자막을 배치해요",
  "demo-fx": "클릭음·전환음 같은 효과음을 자동으로 넣어요",
  "video-demo-script": "녹화 영상 구간마다 설명 문장을 만들어요",
  "video-demo-voice": "구간별 설명을 AI 목소리로 녹음해요",
  "video-demo-layout": "녹화 영상 위에 자막과 커서 힌트를 얹어요",
  cinematic: "자막에 어울리는 시네마틱 배경 영상을 붙여요",
};

const PIPELINE_HERO: Record<
  PipelineId,
  { title: string; description: string; icon: string }
> = {
  topic: {
    title: "주제로 영상 만들기",
    description: "주제 한 줄로 대본→음성→영상까지 한 번에",
    icon: "💡",
  },
  "from-input": {
    title: "음성 파일로 영상 만들기",
    description: "이미 있는 나레이션(mp3) + 자막(srt) 으로 영상 생성",
    icon: "🎙️",
  },
  "product-demo": {
    title: "스크린샷 튜토리얼",
    description: "스크린샷 + 한 줄 설명 → 커서 애니메이션 튜토리얼",
    icon: "🖱️",
  },
  "video-demo": {
    title: "녹화 영상 튜토리얼",
    description: "녹화된 mp4 + 주석 → 완성된 튜토리얼 영상",
    icon: "📹",
  },
  slides: {
    title: "슬라이드 영상",
    description: "목차만 입력하면 슬라이드 형식으로 자동 제작",
    icon: "📊",
  },
  deck: {
    title: "프레젠테이션 덱",
    description: "PPTX 파일 자동 생성 (영상이 아닌 발표자료)",
    icon: "📑",
  },
  cinematic: {
    title: "시네마틱 B-roll",
    description: "자막 + Pexels 비디오로 시네마틱 영상 제작",
    icon: "🎞️",
  },
};

export default function ControlCenterPage({ params }: PageProps) {
  const { projectId } = use(params);
  const [pipelineId, setPipelineId] = useState<PipelineId | null>(null);
  const [availablePipelines, setAvailablePipelines] = useState<PipelineId[]>([]);
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<JobLogLine[]>([]);
  const [runningStepId, setRunningStepId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubStep, setActiveSubStep] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [runningJob, setRunningJob] = useState<JobRecord | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outputVersion, setOutputVersion] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const pipeline = useMemo(
    () => (pipelineId ? getPipeline(pipelineId) : null),
    [pipelineId]
  );

  const events = useMemo(() => parseLogLines(logs), [logs]);

  const renderProgress = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const matches = logs[i].text.match(/Encoded\s+(\d+)\/(\d+)/g);
      if (matches && matches.length > 0) {
        const last = matches[matches.length - 1];
        const m = last.match(/Encoded\s+(\d+)\/(\d+)/);
        if (m) {
          return { current: parseInt(m[1], 10), total: parseInt(m[2], 10) };
        }
      }
    }
    return null;
  }, [logs]);

  const attachStream = useCallback(
    (jobId: string, stepId: string) => {
      esRef.current?.close();
      setLogs([]);
      setRunningJobId(jobId);
      setRunningStepId(stepId);

      const es = new EventSource(
        `/api/control/projects/${projectId}/jobs/${jobId}/stream`
      );
      esRef.current = es;

      es.addEventListener("snapshot", (e) => {
        const parsed = JSON.parse((e as MessageEvent).data) as {
          logs?: JobLogLine[];
        };
        if (Array.isArray(parsed.logs)) setLogs(parsed.logs);
      });
      es.addEventListener("log", (e) => {
        const entry = JSON.parse((e as MessageEvent).data) as JobLogLine;
        setLogs((prev) => [...prev, entry]);
      });
      es.addEventListener("status", (e) => {
        const d = JSON.parse((e as MessageEvent).data) as { status: string };
        if (d.status !== "running") void fetchStatus();
      });
      es.addEventListener("done", () => {
        es.close();
        setRunningJobId(null);
        setRunningStepId(null);
        setActiveSubStep(null);
        setProgressMessage("");
        setOutputVersion((v) => v + 1);
        void fetchStatus();
      });
      es.addEventListener("error", () => {
        /* ignore */
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId]
  );

  const fetchStatus = useCallback(async () => {
    try {
      const qs = pipelineId ? `?pipeline=${pipelineId}` : "";
      const res = await fetch(`/api/control/projects/${projectId}${qs}`);
      if (!res.ok) throw new Error(`상태 조회 실패: ${res.status}`);
      const data = (await res.json()) as ControlStatusResponse;
      setStatus(data);
      setAvailablePipelines(data.available_pipelines ?? []);
      if (!pipelineId && data.suggested_pipeline) {
        setPipelineId(data.suggested_pipeline);
      }
      if (data.active_job && !runningJobId) {
        attachStream(data.active_job.id, data.active_job.step_id);
      }
    } catch (err) {
      setError((err as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, pipelineId, runningJobId, attachStream]);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => void fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!pipeline || events.length === 0) {
      setActiveSubStep(null);
      setProgressMessage("");
      return;
    }

    let phaseTitle = "";
    let subStepFromPhase: string | null = null;
    let subStepFromSkill: string | null = null;
    let fallbackMsg = "";

    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];

      if (!subStepFromPhase && ev.kind === "phase") {
        const phaseMatch = ev.title.match(/Phase\s*(\d)/);
        if (phaseMatch) {
          const phaseNum = parseInt(phaseMatch[1], 10);
          if (phaseNum >= 1 && phaseNum <= pipeline.steps.length) {
            subStepFromPhase = pipeline.steps[phaseNum - 1]?.id ?? null;
            phaseTitle = ev.title;
          }
        }
      }

      if (!subStepFromSkill && ev.kind === "skill") {
        const match = ev.title.match(/\/([\w-]+)/);
        if (match) {
          const skillPath = `/${match[1]}`;
          const step = pipeline.steps.find((s) => s.skill === skillPath);
          if (step) subStepFromSkill = step.id;
        }
      }

      if (
        !fallbackMsg &&
        (ev.kind === "text" ||
          ev.kind === "tool" ||
          ev.kind === "auto-default" ||
          ev.kind === "result" ||
          ev.kind === "abort")
      ) {
        fallbackMsg = ev.title;
      }

      if (subStepFromPhase && subStepFromSkill && fallbackMsg) break;
    }

    const subStep = subStepFromPhase ?? subStepFromSkill;
    const msg = phaseTitle || fallbackMsg;

    setActiveSubStep(subStep);
    if (msg) setProgressMessage(msg);
  }, [events, pipeline]);

  useEffect(() => {
    if (!runningJobId) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningJobId]);

  useEffect(() => {
    if (!runningJobId) {
      setRunningJob(null);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/control/projects/${projectId}/jobs/${runningJobId}`
        );
        if (!res.ok || cancelled) return;
        const job = (await res.json()) as JobRecord;
        if (cancelled) return;
        setRunningJob(job);
        if (job.status !== "running" && job.status !== "pending") {
          esRef.current?.close();
          setRunningJobId(null);
          setRunningStepId(null);
          setActiveSubStep(null);
          setProgressMessage("");
          setRunningJob(null);
          setOutputVersion((v) => v + 1);
          void fetchStatus();
        }
      } catch {
        /* ignore */
      }
    };
    void check();
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningJobId, projectId]);

  const activePhaseStartTs = useMemo(() => {
    if (!pipeline || !activeSubStep) return null;
    const idx = pipeline.steps.findIndex((s) => s.id === activeSubStep);
    if (idx < 0) return null;
    const targetPhaseNum = idx + 1;
    for (const ev of events) {
      if (ev.kind !== "phase") continue;
      const m = ev.title.match(/Phase\s*(\d)/);
      if (!m) continue;
      if (parseInt(m[1], 10) === targetPhaseNum) return ev.ts;
    }
    return null;
  }, [pipeline, activeSubStep, events]);

  const runStep = async (stepId: string, mode: "auto" | "manual" = "manual") => {
    if (!pipelineId) return;
    setError(null);
    try {
      const res = await fetch(`/api/control/projects/${projectId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          step_id: stepId,
          mode,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `실행 실패 ${res.status}`);
      }
      const data = (await res.json()) as { job_id: string };
      attachStream(data.job_id, stepId);
      void fetchStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const cancelRunning = async () => {
    if (!runningJobId) return;
    await fetch(
      `/api/control/projects/${projectId}/jobs/${runningJobId}/cancel`,
      { method: "POST" }
    );
    void fetchStatus();
  };

  const switchPipeline = (next: PipelineId) => {
    if (next === pipelineId) return;
    setPipelineId(next);
    setStatus(null);
  };

  const hasOutput = useMemo(() => {
    return status?.steps.some(
      (s) =>
        s.step_id === "render" &&
        s.produces.some((p) => p.pattern.includes("output/") && p.exists)
    ) ?? false;
  }, [status]);

  const isRunning = !!runningJobId;
  const hero = pipelineId ? PIPELINE_HERO[pipelineId] : null;

  const jobStartedAt = runningJob?.started_at ?? null;
  const jobElapsedSec = jobStartedAt
    ? Math.max(0, (nowTick - jobStartedAt) / 1000)
    : 0;
  const phaseElapsedSec = activePhaseStartTs
    ? Math.max(0, (nowTick - activePhaseStartTs) / 1000)
    : jobElapsedSec;

  const primaryActionLabel = (() => {
    if (!pipeline) return "준비 중...";
    if (isRunning) return "만드는 중...";
    if (hasOutput) return "다시 만들기";
    return `${hero?.icon ?? "▶"} 영상 만들기`;
  })();

  const handlePrimaryAction = () => {
    if (!pipeline || isRunning) return;
    if (pipeline.orchestratorSkill) {
      runStep(ORCHESTRATOR_STEP_ID);
    } else {
      const first = pipeline.steps[0];
      if (first) runStep(first.id, "auto");
    }
  };

  return (
    <div className="min-h-screen bg-[#08060D] text-white">
      <header className="border-b border-white/10 sticky top-0 z-10 bg-[#08060D]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/5 text-white/60 border border-white/15 hover:bg-white/10 transition"
            >
              ←
            </Link>
            <h1 className="text-sm font-mono text-white/70">{projectId}</h1>
          </div>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-white/40 hover:text-white/70 transition"
          >
            {showAdvanced ? "기본 모드" : "고급 설정"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        {hero && (
          <section className="mb-8 text-center">
            <div className="text-5xl mb-3">{hero.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{hero.title}</h2>
            <p className="text-sm text-white/50">{hero.description}</p>
          </section>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm text-center">
            ❌ {error}
          </div>
        )}

        {/* Primary action (when idle) */}
        {!isRunning && pipeline && (
          <section className="mb-8">
            <button
              onClick={handlePrimaryAction}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-bold text-lg transition shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)]"
            >
              {primaryActionLabel}
            </button>
            {hasOutput && (
              <p className="text-xs text-white/40 text-center mt-2">
                기존 영상은 덮어씌워집니다
              </p>
            )}
          </section>
        )}

        {/* Running banner */}
        {isRunning && pipeline && (
          <RunningBanner
            pipeline={pipeline}
            runningStepId={runningStepId}
            activeSubStep={activeSubStep}
            progressMessage={progressMessage}
            jobElapsedSec={jobElapsedSec}
            phaseElapsedSec={phaseElapsedSec}
            renderProgress={renderProgress}
            onCancel={cancelRunning}
          />
        )}

        {/* Completed output */}
        {hasOutput && !isRunning && (
          <OutputPreview projectId={projectId} versionKey={outputVersion} />
        )}

        {/* Simplified stepper */}
        {pipeline && pipeline.steps.length > 0 && (
          <Stepper
            pipeline={pipeline}
            status={status}
            activeSubStep={activeSubStep}
            runningStepId={runningStepId}
            isRunning={isRunning}
          />
        )}

        {/* Advanced panel */}
        {showAdvanced && pipeline && (
          <AdvancedPanel
            projectId={projectId}
            pipelineId={pipelineId!}
            pipeline={pipeline}
            availablePipelines={availablePipelines}
            status={status}
            runningStepId={runningStepId}
            isRunning={isRunning}
            logs={logs}
            onSwitchPipeline={switchPipeline}
            onRunStep={runStep}
          />
        )}
      </main>
    </div>
  );
}

function RunningBanner({
  pipeline,
  runningStepId,
  activeSubStep,
  progressMessage,
  jobElapsedSec,
  phaseElapsedSec,
  renderProgress,
  onCancel,
}: {
  pipeline: PipelineDefinition;
  runningStepId: string | null;
  activeSubStep: string | null;
  progressMessage: string;
  jobElapsedSec: number;
  phaseElapsedSec: number;
  renderProgress: { current: number; total: number } | null;
  onCancel: () => void;
}) {
  const currentStepId =
    runningStepId === ORCHESTRATOR_STEP_ID ? activeSubStep : runningStepId;
  const currentStep = currentStepId
    ? pipeline.steps.find((s) => s.id === currentStepId)
    : null;
  const currentStepLabel = currentStep?.label ?? "초기화 중";

  const isRender = currentStepId === "render";
  const elapsedSec =
    runningStepId === ORCHESTRATOR_STEP_ID ? phaseElapsedSec : jobElapsedSec;

  let percent: number | null = null;
  let etaSec: number | null = null;
  let extraNote: string | null = null;

  if (isRender && renderProgress) {
    const { current, total } = renderProgress;
    percent = total > 0 ? (current / total) * 100 : 0;
    const rate = elapsedSec > 0 ? current / elapsedSec : 0;
    const remainFrames = Math.max(total - current, 0);
    etaSec = rate > 0 ? remainFrames / rate : null;
    extraNote = `프레임 ${current.toLocaleString()} / ${total.toLocaleString()}`;
  } else if (currentStep) {
    const totalSec = currentStep.estimatedSeconds || 60;
    percent = Math.min((elapsedSec / totalSec) * 100, 95);
    etaSec = Math.max(totalSec - elapsedSec, 0);
  }

  const clamped =
    typeof percent === "number" ? Math.max(0, Math.min(100, percent)) : 0;
  const showDeterminate = typeof percent === "number" && elapsedSec > 2;

  return (
    <section className="mb-8 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-purple-500/0 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-purple-300/70 mb-1">
            ⏳ 영상 만드는 중
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold text-purple-100">
            <span className="text-xl">
              {(currentStepId && STEP_EMOJI[currentStepId]) || "⚙️"}
            </span>
            <span>{currentStepLabel}</span>
          </div>
          {progressMessage && (
            <div className="text-xs text-white/50 mt-1 truncate">
              {progressMessage}
            </div>
          )}
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 transition shrink-0"
        >
          ■ 중단
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-2">
        <span>⏱ {formatDuration(elapsedSec)}</span>
        {etaSec !== null && <span>남은 ~{formatDuration(etaSec)}</span>}
        {typeof percent === "number" && (
          <span className="text-purple-200">{clamped.toFixed(1)}%</span>
        )}
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
        {showDeterminate ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300 transition-all duration-500 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div
            className="absolute inset-y-0 w-[40%] bg-gradient-to-r from-purple-500/0 via-purple-400 to-purple-500/0"
            style={{
              animation: "progress-slide 1.6s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {extraNote && (
        <div className="mt-2 text-[10px] font-mono text-white/40">
          {extraNote}
        </div>
      )}
    </section>
  );
}

function OutputPreview({
  projectId,
  versionKey,
}: {
  projectId: string;
  versionKey: number;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 p-6">
      <div className="text-[11px] uppercase tracking-widest text-emerald-300/70 mb-1">
        ✅ 완성
      </div>
      <h3 className="text-lg font-semibold text-emerald-100 mb-4">
        영상이 준비됐어요
      </h3>
      <video
        key={versionKey}
        controls
        className="w-full rounded-lg border border-white/10 bg-black"
        src={`/api/output/${projectId}?v=${versionKey}`}
      >
        영상을 재생할 수 없습니다.
      </video>
      <div className="mt-3 text-[10px] font-mono text-white/40 text-center">
        output/{projectId}.mp4
      </div>
    </section>
  );
}

function Stepper({
  pipeline,
  status,
  activeSubStep,
  runningStepId,
  isRunning,
}: {
  pipeline: PipelineDefinition;
  status: ProjectStatus | null;
  activeSubStep: string | null;
  runningStepId: string | null;
  isRunning: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3">
        진행 단계
      </div>
      <ol className="space-y-2">
        {pipeline.steps.map((step, idx) => {
          const stepStatus = status?.steps.find((s) => s.step_id === step.id);
          const isActive =
            isRunning &&
            ((runningStepId === ORCHESTRATOR_STEP_ID &&
              activeSubStep === step.id) ||
              runningStepId === step.id);
          const isDone = stepStatus?.satisfied ?? false;
          const emoji = STEP_EMOJI[step.id] ?? "•";

          const help = STEP_HELP[step.id];
          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition ${
                isActive
                  ? "border-purple-500/50 bg-purple-500/10"
                  : isDone
                    ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span className="text-lg shrink-0 w-6 text-center mt-0.5">
                {emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm ${
                    isActive
                      ? "text-purple-100 font-medium"
                      : isDone
                        ? "text-emerald-200/90"
                        : "text-white/75"
                  }`}
                >
                  {step.label}
                </div>
                {help && (
                  <div
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isActive
                        ? "text-purple-200/70"
                        : isDone
                          ? "text-emerald-200/45"
                          : "text-white/40"
                    }`}
                  >
                    {help}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-white/40 shrink-0 font-mono mt-1">
                {idx + 1} / {pipeline.steps.length}
              </span>
              <span className="shrink-0 w-5 text-center mt-1">
                {isActive ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                ) : isDone ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-white/20">○</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AdvancedPanel({
  projectId,
  pipelineId,
  pipeline,
  availablePipelines,
  status,
  runningStepId,
  isRunning,
  logs,
  onSwitchPipeline,
  onRunStep,
}: {
  projectId: string;
  pipelineId: PipelineId;
  pipeline: PipelineDefinition;
  availablePipelines: PipelineId[];
  status: ProjectStatus | null;
  runningStepId: string | null;
  isRunning: boolean;
  logs: JobLogLine[];
  onSwitchPipeline: (id: PipelineId) => void;
  onRunStep: (stepId: string) => void;
}) {
  const [showLog, setShowLog] = useState(false);

  return (
    <section className="mt-10 pt-6 border-t border-white/10 space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3">
          파이프라인 선택
        </div>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_IDS.map((id) => {
            const def = PIPELINES[id];
            const detected = availablePipelines.includes(id);
            const isCurrent = id === pipelineId;
            return (
              <button
                key={id}
                onClick={() => onSwitchPipeline(id)}
                title={def.description}
                className={`relative px-3 py-2 text-xs font-medium rounded-lg border whitespace-nowrap transition ${
                  isCurrent
                    ? "bg-purple-500/25 text-purple-100 border-purple-400/60"
                    : detected
                      ? "bg-emerald-500/10 text-emerald-100 border-emerald-500/30"
                      : "bg-white/5 text-white/65 border-white/15 hover:bg-white/10"
                }`}
              >
                {detected && !isCurrent && (
                  <span className="absolute -top-1 -right-1 text-[9px] leading-none bg-emerald-500 text-black rounded-full px-1 font-bold">
                    ✓
                  </span>
                )}
                {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {pipeline.steps.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3">
            개별 스텝 실행
          </div>
          <ol className="space-y-2">
            {pipeline.steps.map((step, idx) => {
              const stepStatus = status?.steps.find(
                (s) => s.step_id === step.id
              );
              return (
                <AdvancedStepRow
                  key={step.id}
                  index={idx + 1}
                  step={step}
                  stepStatus={stepStatus}
                  isRunning={runningStepId === step.id}
                  isDisabled={isRunning && runningStepId !== step.id}
                  onRun={() => onRunStep(step.id)}
                />
              );
            })}
          </ol>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="text-[11px] uppercase tracking-widest text-white/40 hover:text-white/60 transition"
        >
          {showLog ? "▾" : "▸"} 디버그 로그 ({logs.length} lines)
        </button>
        {showLog && <DebugLogView logs={logs} />}
      </div>
    </section>
  );
}

function AdvancedStepRow({
  index,
  step,
  stepStatus,
  isRunning,
  isDisabled,
  onRun,
}: {
  index: number;
  step: PipelineStep;
  stepStatus: StepStatus | undefined;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}) {
  const ready = stepStatus?.ready ?? false;
  const satisfied = stepStatus?.satisfied ?? false;

  const label = (() => {
    if (isRunning) return "실행 중";
    if (!ready) return "입력 부족";
    if (satisfied) return "재실행";
    return "실행";
  })();

  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-md border border-white/10 bg-white/[0.02]">
      <span className="text-[10px] font-mono text-white/40 w-6">{index}</span>
      <span className="flex-1 text-xs">
        <span className="text-white/80">{step.label}</span>
        <span className="ml-2 text-[10px] font-mono text-white/30">
          {step.skill}
        </span>
      </span>
      <span className="text-[10px] text-white/40 shrink-0">
        {satisfied ? "✓ 완료" : ready ? "대기" : "—"}
      </span>
      <button
        onClick={onRun}
        disabled={isDisabled || isRunning || !ready}
        className={`px-3 py-1 text-[11px] rounded border transition shrink-0 ${
          isDisabled || isRunning || !ready
            ? "border-white/10 text-white/25 cursor-not-allowed"
            : "border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
        }`}
      >
        {label}
      </button>
    </li>
  );
}

function DebugLogView({ logs }: { logs: JobLogLine[] }) {
  const events = useMemo(() => parseLogLines(logs), [logs]);
  const [showRaw, setShowRaw] = useState(false);
  const filtered = events.filter((e) => e.kind !== "thinking");

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-white/5">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className={`text-[10px] px-2 py-0.5 rounded border ${
            showRaw
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/15 text-white/50"
          }`}
        >
          raw
        </button>
      </div>
      <div className="max-h-[45vh] overflow-y-auto px-3 py-2">
        {showRaw ? (
          <div className="text-[10px] font-mono">
            {logs.length === 0 ? (
              <div className="text-white/30">없음</div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap break-words ${
                    l.stream === "stderr"
                      ? "text-red-300"
                      : l.stream === "system"
                        ? "text-purple-300"
                        : "text-white/55"
                  }`}
                >
                  {l.text}
                </div>
              ))
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-white/30 text-xs">없음</div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((ev) => (
              <EventRow key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: PrettyLogEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasBody = !!event.body;
  const tone = toneClass(event.tone);
  const timeStr = new Date(event.ts).toLocaleTimeString("ko-KR", {
    hour12: false,
  });
  const isPhase = event.kind === "phase";

  return (
    <li
      className={`rounded border border-transparent ${
        isPhase ? "bg-purple-500/10 border-purple-500/30" : ""
      }`}
    >
      <button
        onClick={hasBody ? () => setExpanded((v) => !v) : undefined}
        disabled={!hasBody}
        className={`w-full text-left px-2 py-1 rounded flex items-start gap-2 ${
          hasBody ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
        }`}
      >
        <span className="text-sm shrink-0 w-5 text-center">{event.icon}</span>
        <span className="text-[10px] text-white/30 font-mono shrink-0 mt-0.5">
          {timeStr}
        </span>
        <span className={`flex-1 text-[11px] ${tone}`}>{event.title}</span>
        {hasBody && (
          <span className="text-[10px] text-white/30 shrink-0 mt-0.5">
            {expanded ? "▾" : "▸"}
          </span>
        )}
      </button>
      {hasBody && expanded && (
        <pre className="ml-7 mb-1 mr-2 text-[10px] font-mono text-white/55 bg-white/[0.02] border border-white/10 rounded px-2 py-1 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
          {event.body}
        </pre>
      )}
    </li>
  );
}

function toneClass(tone: PrettyTone): string {
  switch (tone) {
    case "success":
      return "text-emerald-200";
    case "warning":
      return "text-amber-200";
    case "error":
      return "text-red-300";
    case "muted":
      return "text-white/55";
    case "info":
    default:
      return "text-white/85";
  }
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
