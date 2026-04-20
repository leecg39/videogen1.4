// @TASK Control Center Phase 2 — 7개 파이프라인 정의
// topic / from-input / product-demo / video-demo / slides / deck / cinematic
// 각 파이프라인은 선택적 orchestratorSkill(전체 자동 실행) + steps[](세부 단계) 를 가짐

export type PipelineId =
  | "topic"
  | "from-input"
  | "product-demo"
  | "video-demo"
  | "slides"
  | "deck"
  | "cinematic";

export const ORCHESTRATOR_STEP_ID = "__orchestrator__";

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  skill: string;
  requires: string[];
  produces: string[];
  next: string | null;
  estimatedSeconds: number;
}

export interface PipelineDefinition {
  id: PipelineId;
  label: string;
  description: string;
  orchestratorSkill?: string;
  orchestratorLabel?: string;
  orchestratorEstimatedSeconds?: number;
  requiresInput?: string[];
  steps: PipelineStep[];
  atomic?: boolean;
}

const topicPipeline: PipelineDefinition = {
  id: "topic",
  label: "주제 → 교육 영상",
  description: "주제 텍스트에서 시작해 대본·음성·레이아웃·렌더까지 6단계 수동 체이닝",
  steps: [
    {
      id: "script",
      label: "대본 생성",
      description: "project.json 의 topic 필드 기반으로 script.json 생성",
      skill: "/vg-script",
      requires: ["project.json"],
      produces: ["script.json"],
      next: "voice",
      estimatedSeconds: 60,
    },
    {
      id: "voice",
      label: "음성 생성",
      description: "ElevenLabs TTS → mp3 + srt",
      skill: "/vg-voice",
      requires: ["script.json"],
      produces: ["*.mp3", "*.srt"],
      next: "chunk",
      estimatedSeconds: 90,
    },
    {
      id: "chunk",
      label: "자막 청킹",
      description: "SRT 의미 단위 분할 → beats.json",
      skill: "/vg-chunk",
      requires: ["*.srt"],
      produces: ["beats.json"],
      next: "scene",
      estimatedSeconds: 20,
    },
    {
      id: "scene",
      label: "씬 설계",
      description: "beats → scene block + scoring → scenes.json",
      skill: "/vg-scene",
      requires: ["beats.json"],
      produces: ["scene-plan.json", "scenes.json"],
      next: "layout",
      estimatedSeconds: 120,
    },
    {
      id: "layout",
      label: "레이아웃 생성",
      description: "AI stack_root 트리 → scenes-v2.json + render-props-v2.json",
      skill: "/vg-layout",
      requires: ["scenes.json"],
      produces: ["scenes-v2.json", "render-props-v2.json"],
      next: "render",
      estimatedSeconds: 180,
    },
    {
      id: "render",
      label: "렌더링",
      description: "Remotion → output/{pid}.mp4",
      skill: "/vg-render",
      requires: ["render-props-v2.json"],
      produces: ["output/{projectId}.mp4"],
      next: null,
      estimatedSeconds: 300,
    },
  ],
};

const fromInputPipeline: PipelineDefinition = {
  id: "from-input",
  label: "mp3 + srt → 영상",
  description: "이미 있는 나레이션/자막 파일을 /vg-new 로 한 번에 처리",
  orchestratorSkill: "/vg-new",
  orchestratorLabel: "Full Auto (/vg-new)",
  orchestratorEstimatedSeconds: 720,
  requiresInput: ["*.srt", "*.mp3"],
  steps: [
    {
      id: "chunk",
      label: "자막 청킹",
      description: "SRT 의미 단위 분할 → beats.json",
      skill: "/vg-chunk",
      requires: ["*.srt"],
      produces: ["beats.json"],
      next: "scene",
      estimatedSeconds: 20,
    },
    {
      id: "scene",
      label: "씬 설계",
      description: "beats → scene blocks → scenes.json",
      skill: "/vg-scene",
      requires: ["beats.json"],
      produces: ["scene-plan.json", "scenes.json"],
      next: "layout",
      estimatedSeconds: 120,
    },
    {
      id: "layout",
      label: "레이아웃 생성",
      description: "AI stack_root 트리 생성",
      skill: "/vg-layout",
      requires: ["scenes.json"],
      produces: ["scenes-v2.json", "render-props-v2.json"],
      next: "render",
      estimatedSeconds: 180,
    },
    {
      id: "render",
      label: "렌더링",
      description: "Remotion → mp4",
      skill: "/vg-render",
      requires: ["render-props-v2.json"],
      produces: ["output/{projectId}.mp4"],
      next: null,
      estimatedSeconds: 300,
    },
  ],
};

const productDemoPipeline: PipelineDefinition = {
  id: "product-demo",
  label: "Product Demo (스크린샷)",
  description: "demo-spec.json + 스크린샷 → Ken Burns + 커서 + TTS + SFX mp4",
  orchestratorSkill: "/vg-demo",
  orchestratorLabel: "Full Auto (/vg-demo)",
  orchestratorEstimatedSeconds: 600,
  requiresInput: ["demo-spec.json"],
  steps: [
    {
      id: "demo-script",
      label: "나레이션 확장",
      description: "action 한 줄 → 2~3문장 나레이션",
      skill: "/vg-demo-script",
      requires: ["demo-spec.json"],
      produces: ["demo-spec.json"],
      next: "demo-voice",
      estimatedSeconds: 45,
    },
    {
      id: "demo-voice",
      label: "데모 TTS",
      description: "ElevenLabs 나레이션 + voice-timeline.json",
      skill: "/vg-demo-voice",
      requires: ["demo-spec.json"],
      produces: ["voice-timeline.json"],
      next: "demo-layout",
      estimatedSeconds: 90,
    },
    {
      id: "demo-layout",
      label: "데모 레이아웃",
      description: "ImageCanvas + Cursor + SubtitleBar 트리 생성",
      skill: "/vg-demo-layout",
      requires: ["demo-spec.json", "voice-timeline.json"],
      produces: ["scenes-v2.json", "render-props-v2.json"],
      next: "demo-fx",
      estimatedSeconds: 45,
    },
    {
      id: "demo-fx",
      label: "SFX 주입",
      description: "click / whoosh / move SFX → render-props-v2.json",
      skill: "/vg-demo-fx",
      requires: ["render-props-v2.json"],
      produces: ["render-props-v2.json"],
      next: "render",
      estimatedSeconds: 10,
    },
    {
      id: "render",
      label: "렌더링",
      description: "Remotion → mp4",
      skill: "/vg-render",
      requires: ["render-props-v2.json"],
      produces: ["output/{projectId}.mp4"],
      next: null,
      estimatedSeconds: 300,
    },
  ],
};

const videoDemoPipeline: PipelineDefinition = {
  id: "video-demo",
  label: "Video Demo (녹화 mp4)",
  description: "video-spec.json + 녹화 mp4 → 세그먼트 나레이션 + SFX 튜토리얼",
  orchestratorSkill: "/vg-video-demo",
  orchestratorLabel: "Full Auto (/vg-video-demo)",
  orchestratorEstimatedSeconds: 720,
  requiresInput: ["video-spec.json"],
  steps: [
    {
      id: "video-demo-script",
      label: "세그먼트 나레이션",
      description: "세그먼트 주석 → 나레이션 확장",
      skill: "/vg-video-demo-script",
      requires: ["video-spec.json"],
      produces: ["video-spec.json"],
      next: "video-demo-voice",
      estimatedSeconds: 60,
    },
    {
      id: "video-demo-voice",
      label: "세그먼트 TTS",
      description: "로컬 macOS say, OpenAI, 또는 ElevenLabs TTS + voice-timeline.json",
      skill: "/vg-video-demo-voice",
      requires: ["video-spec.json"],
      produces: ["voice-timeline.json"],
      next: "video-demo-layout",
      estimatedSeconds: 120,
    },
    {
      id: "video-demo-layout",
      label: "비디오 레이아웃",
      description: "VideoCanvas + SubtitleBar 트리 생성",
      skill: "/vg-video-demo-layout",
      requires: ["video-spec.json", "voice-timeline.json"],
      produces: ["scenes-v2.json", "render-props-v2.json"],
      next: "demo-fx",
      estimatedSeconds: 45,
    },
    {
      id: "demo-fx",
      label: "SFX 주입",
      description: "click / whoosh SFX 주입 (vg-demo-fx 재사용)",
      skill: "/vg-demo-fx",
      requires: ["render-props-v2.json"],
      produces: ["render-props-v2.json"],
      next: "render",
      estimatedSeconds: 10,
    },
    {
      id: "render",
      label: "렌더링",
      description: "Remotion → mp4 (TTS 덕킹 오디오 믹싱 포함)",
      skill: "/vg-render",
      requires: ["render-props-v2.json"],
      produces: ["output/{projectId}.mp4"],
      next: null,
      estimatedSeconds: 300,
    },
  ],
};

const slidesPipeline: PipelineDefinition = {
  id: "slides",
  label: "슬라이드 영상",
  description: "목차 텍스트 → 슬라이드 영상 단일 호출",
  orchestratorSkill: "/vg-slides",
  orchestratorLabel: "Generate (/vg-slides)",
  orchestratorEstimatedSeconds: 360,
  atomic: true,
  steps: [],
};

const deckPipeline: PipelineDefinition = {
  id: "deck",
  label: "프레젠테이션 덱 (pptx)",
  description: "목차 → pptxgenjs 기반 PPTX (Remotion 미사용)",
  orchestratorSkill: "/vg-deck",
  orchestratorLabel: "Generate (/vg-deck)",
  orchestratorEstimatedSeconds: 180,
  atomic: true,
  steps: [],
};

const cinematicPipeline: PipelineDefinition = {
  id: "cinematic",
  label: "시네마틱 B-roll",
  description: "beats.json → Pexels 비디오 + 시네마틱 레이아웃 → 렌더",
  orchestratorSkill: "/vg-cinematic",
  orchestratorLabel: "Full Auto (/vg-cinematic)",
  orchestratorEstimatedSeconds: 600,
  requiresInput: ["*.srt"],
  steps: [
    {
      id: "chunk",
      label: "자막 청킹",
      description: "SRT → beats.json (시네마틱도 beats 필요)",
      skill: "/vg-chunk",
      requires: ["*.srt"],
      produces: ["beats.json"],
      next: "cinematic",
      estimatedSeconds: 20,
    },
    {
      id: "cinematic",
      label: "시네마틱 씬 설계",
      description: "beats → Pexels 비디오 fetch + 시네마틱 레이아웃",
      skill: "/vg-cinematic",
      requires: ["beats.json"],
      produces: ["scenes-v2.json", "render-props-v2.json"],
      next: "render",
      estimatedSeconds: 240,
    },
    {
      id: "render",
      label: "렌더링",
      description: "Remotion → mp4",
      skill: "/vg-render",
      requires: ["render-props-v2.json"],
      produces: ["output/{projectId}.mp4"],
      next: null,
      estimatedSeconds: 300,
    },
  ],
};

export const PIPELINES: Record<PipelineId, PipelineDefinition> = {
  topic: topicPipeline,
  "from-input": fromInputPipeline,
  "product-demo": productDemoPipeline,
  "video-demo": videoDemoPipeline,
  slides: slidesPipeline,
  deck: deckPipeline,
  cinematic: cinematicPipeline,
};

export const PIPELINE_IDS: PipelineId[] = [
  "from-input",
  "topic",
  "product-demo",
  "video-demo",
  "cinematic",
  "slides",
  "deck",
];

export function getPipeline(id: PipelineId): PipelineDefinition {
  return PIPELINES[id];
}

export function findStep(
  pipelineId: PipelineId,
  stepId: string
): PipelineStep | null {
  const pipeline = PIPELINES[pipelineId];
  return pipeline.steps.find((s) => s.id === stepId) ?? null;
}

export function getNextStep(
  pipelineId: PipelineId,
  stepId: string
): PipelineStep | null {
  const current = findStep(pipelineId, stepId);
  if (!current || !current.next) return null;
  return findStep(pipelineId, current.next);
}
