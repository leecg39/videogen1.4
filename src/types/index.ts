// Shared Types - specs/shared/types.yaml 기반
// P0-T0.3에서 완성 예정 (현재는 스캐폴드)

import type { AmbientPreset } from "@/remotion/common/theme";

export type ProjectStatus = "draft" | "chunked" | "scened" | "rendered";

export type LayoutFamily =
  | "hero-center"
  | "split-2col"
  | "grid-4x3"
  | "process-horizontal"
  | "radial-focus"
  | "stacked-vertical"
  | "comparison-bars"
  | "spotlight-case"
  | "donut-metric"
  | "big-number"
  | "quote-highlight";

export type ShotType = "full-bleed-broll" | "ui-mockup-focus" | "diagram-build" | "stat-punch" | "quote-pause" | "compare-split" | "timeline-cascade" | "hero-text" | "icon-cluster" | "checklist-reveal";
export type CameraBehavior = "static" | "slow-zoom" | "pan-left" | "reveal";
// 2026-04-19: "video" 추가 — validate-background-coverage 가드 활성화 + 배경 VideoClip 커버리지 30% 강제 기반.
export type AssetMode = "text-only" | "icon" | "diagram" | "chart" | "image" | "mockup" | "screenshot" | "video";
export type CaptionMode = "bottom-bar" | "side-caption" | "inline" | "punch-word" | "none";

export interface ShotPlan {
  shot_type: ShotType;
  primary_subject: string;
  secondary_support?: string;
  camera_behavior: CameraBehavior;
  asset_mode: AssetMode;
  caption_mode: CaptionMode;
}

export type RenderStatus = "pending" | "rendering" | "paused" | "completed" | "failed";

export type LogLevel = "info" | "warning" | "error";

export interface Project {
  id: string;
  name: string;
  srt_path: string;
  audio_path: string;
  created_at: string;
  updated_at: string;
  status: ProjectStatus;
  total_duration_ms: number;
  render?: RenderSettings;
}

export interface CopyLayers {
  kicker: string | null;
  headline: string;
  supporting: string | null;
  footer_caption: string | null;
  // Extended copy fields
  hook?: string | null;             // Attention grabber
  claim?: string | null;            // Main assertion
  evidence?: string | null;         // Supporting data/fact
  counterpoint?: string | null;     // Contrast/comparison
  annotation?: string | null;       // Small explanatory note
  cta?: string | null;              // Call to action
}

export interface ChunkMetadata {
  intent: string;
  tone: string;
  evidence_type: string;
  emphasis_tokens: string[];
  density: number;
  beat_count: number;
}

export interface SceneComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface LayoutReferencePack {
  primary_family_id: string;
  references: Array<{
    id: string;
    svg_path: string;
    family_id: string;
    motif_ids: string[];
  }>;
  motif_ids: string[];
  guidance: string[];
}

// ── Visual Plan (vg-scene commit → vg-layout realize) ──
// /vg-scene 단계에서 씬별 시각 구성안을 "확정"하여 /vg-layout 이 realize only 수행하도록 한다.
// 참조: docs/handoff-2026-04-17-ref-dna-and-visual-plan.md §4, memory/project_pipeline_visual_plan.md

export type VisualRelationship =
  | "metric"      // 숫자/지표 강조
  | "contrast"    // A vs B / before-after
  | "flow"        // 순서/단계/흐름
  | "evidence"    // 사례/인용/증거
  | "pause"       // 감정/전환/브리딩
  | "enumerate"   // 다중 항목 나열
  | "case";       // 브랜드/인물/구체 대상

export type VisualAccentColor = "mint" | "yellow" | "red" | "white";

export type VisualCompositionDirection =
  | "center"        // 중앙 수직 스택 (레퍼런스 70%+)
  | "left"          // 좌측 치우침 (e.g. SC 37)
  | "right"         // 우측 정렬 (e.g. SC 50)
  | "diagonal"      // 대각선 흐름 (e.g. SC 42)
  | "asymmetric"    // 비대칭 (좌 작은 + 우 거대, e.g. SC 30)
  | "horizontal";   // 가로 spread (3-4 요소)

export type VisualTypoVariant =
  | "standard"       // 기본 Kicker+focal+footer
  | "medium_hero"    // 중형 hero (50~70px) — 30% 씬
  | "giant_wordmark" // 거대 wordmark (200px+) — 10% 씬
  | "mono_terminal"; // 모노스페이스 터미널 — 5% 씬

export type VisualDensity = "sparse" | "medium" | "dense";

export interface VisualPlanFocal {
  /** 주 시각 요소의 노드 타입 (ImpactStat/RingChart/VersusCard/FlowDiagram 등) */
  type: string;
  value?: string | number | null;
  label?: string | null;
  suffix?: string | null;
  /** 추가 메모 — realize 단계 힌트 */
  note?: string | null;
}

export interface VisualPlanSupport {
  /** 보조 요소 노드 타입 (BulletList/Badge/Kicker/FooterCaption/CheckMark/CompareBars 등) */
  type: string;
  items?: string[] | null;
  text?: string | null;
  note?: string | null;
}

export interface VisualPlan {
  /** reference/SC *.png 패턴 ID (pattern-catalog.ts 에 정의된 20 패턴 중 하나) */
  pattern_ref: string;
  /** 의미 관계 분류 */
  relationship: VisualRelationship;
  /** 주 시각 요소 1개 */
  focal: VisualPlanFocal;
  /** 보조 시각 요소 0~3개 */
  support: VisualPlanSupport[];
  /** 강조 색상 */
  accent_color: VisualAccentColor;
  /** 추천 컨테이너 (focal-only 시 null) */
  recommended_container?: "Split" | "Grid" | "Stack" | "FrameBox" | "Absolute" | null;
  /** 구도 방향 — 중앙 고착 방지, 25% 비중앙 강제 */
  composition_direction?: VisualCompositionDirection;
  /** 타이포 변주 — 크기·모노 등 30/10/5% 강제 */
  typo_variant?: VisualTypoVariant;
  /** 밀도 로테이션 — 20/60/20 */
  density?: VisualDensity;
  /** 선택 이유 — 디버깅/감사용 */
  rationale?: string;
}

export interface MotionConfig {
  entrance: string;
  emphasis: string | null;
  exit: string | null;
  duration_ms: number;
}

export interface AssetConfig {
  svg_icons: string[];
  chart_type: string | null;
  chart_data: Record<string, unknown> | null;
}

export interface Scene {
  id: string;
  project_id: string;
  beat_index: number;
  layout_family: LayoutFamily;
  start_ms: number;
  end_ms: number;
  duration_frames: number;
  components: SceneComponent[];
  copy_layers: CopyLayers;
  motion: MotionConfig;
  assets: AssetConfig;
  chunk_metadata: ChunkMetadata;
  /** manifest.json에서 narration 키워드로 매칭된 asset 경로 목록 */
  matched_assets?: string[];
  /** 나레이션 텍스트 (하단 자막 표시용) */
  narration?: string;
  /** 개별 자막 엔트리 (시간 기반 표시용) */
  subtitles?: Array<{ startTime: number; endTime: number; text: string }>;
  /** 스택 노드 트리 (설정 시 layout_family 대신 StackRenderer 사용) */
  stack_root?: import("./stack-nodes").StackNode;
  /** 다음 씬으로의 전환 효과 설정 */
  transition?: SceneTransition;
  /** 장면 설계 다양성을 위한 Shot Plan */
  shot_plan?: ShotPlan;
  /** 배경 스크린샷 3레이어 시스템 */
  background?: SceneBackground;
  /** 앰비언트 배경 오버라이드 (background 없을 때 텍스처 제공) */
  ambient?: {
    preset?: AmbientPreset;
    tintColor?: string;
    opacity?: number;
  };
  /** SVG 템플릿 분해 카탈로그에서 선택된 참조 팩 */
  layout_reference?: LayoutReferencePack;
  /** 시각 구성 계획 (/vg-scene 이 commit, /vg-layout 이 realize) */
  visual_plan?: VisualPlan;
}

// ── 배경 스크린샷 3레이어 시스템 ──

export interface SceneBackground {
  /** "image" (기본) | "video" — 배경 유형 */
  type?: "image" | "video";
  /** 이미지 또는 비디오 경로 (public/ 기준, staticFile()용) */
  src: string;
  /** 어두운 오버레이 투명도 0-1 (이미지 기본 0.55, 비디오 기본 0.6) */
  overlayOpacity?: number;
  /** 가우시안 블러 px (이미지 기본 10, 비디오 기본 4) */
  blur?: number;
  /** 확대 비율 (기본 1.1) */
  scale?: number;
  /** 패닝 애니메이션 */
  pan?: {
    direction?: "left" | "right" | "up" | "down";
    distance?: number;
  };
  /** 비네팅 강도 0-1 (기본 0.5) */
  vignette?: number;
  // ── 비디오 전용 필드 ──
  /** 비디오 루프 여부 (기본 true) */
  loop?: boolean;
  /** 비디오 시작 지점 (초 단위) */
  startFrom?: number;
  /** 재생 속도 (기본 0.7 — 슬로모션 다큐 느낌) */
  playbackRate?: number;
  /** 비디오 원본 길이 (초, Loop 계산용) */
  durationSec?: number;
  /** 포커스 하이라이트 (핵심 부분 확대) */
  focus?: {
    /** 크롭 영역 (원본 이미지 % 기준) */
    crop: { x: number; y: number; width: number; height: number };
    /** 화면 내 위치 */
    anchor: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
    offsetX?: number;
    offsetY?: number;
    /** 표시 너비 px (기본 400) */
    width?: number;
    /** 글로우 색상 */
    glowColor?: string;
    /** 모서리 반경 (기본 12) */
    radius?: number;
    /** 등장 모션 */
    motion?: { preset?: string; enterAt?: number; duration?: number };
  };
  /** 출처 라벨 */
  sourceLabel?: {
    text: string;
    icon?: string;
    position?: "bottom-left" | "bottom-right";
  };
}

export type TransitionType =
  | "crossfade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "wipe-right"
  | "wipe-down"
  | "zoom-in"
  | "zoom-out"
  | "iris"
  | "blur-through"
  | "none";

export interface SceneTransition {
  /** 전환 유형 */
  type: TransitionType;
  /** 전환 지속 프레임 수 (기본 20) */
  durationFrames?: number;
}

export interface BeatMarker {
  beat_index: number;
  time_ms: number;
  text: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// ── Product Demo (vg-demo) ──

export type HotspotKind = "click" | "hover" | "highlight";

export interface Hotspot {
  /** 0~1 정규화 좌표 (이미지 기준) */
  x: number;
  y: number;
  kind: HotspotKind;
  label?: string;
}

export type DemoCameraKind = "ken-burns" | "zoom-to" | "pan-to" | "static";

export interface DemoCamera {
  kind: DemoCameraKind;
  /** zoom-to / pan-to 타겟 (0~1) */
  target?: { x: number; y: number };
  /** 최종 배율 (1.0 = 원본) */
  scale?: number;
  /** 시작 프레임 비율 0~1 */
  startAt?: number;
}

export interface DemoSlide {
  id: string;
  order: number;
  /** public/ 기준 상대 경로 */
  image: string;
  /** 사용자가 입력한 한 줄 액션 설명 */
  action: string;
  /** vg-demo-script가 채우는 자연 문장 */
  narration?: string | null;
  /** vg-demo-voice가 채우는 TTS 길이(ms) */
  narration_ms?: number | null;
  /** TTS 시작 오프셋(ms, 전체 mp3 기준) */
  audio_offset_ms?: number | null;
  hotspots?: Hotspot[];
  camera?: DemoCamera | null;
}

export interface DemoVoiceConfig {
  provider?: "elevenlabs" | "openai" | "local";
  model?: string;
  voice?: string;
  voice_id?: string;
  instructions?: string;
  speed?: number;
  style?: number;
  stability?: number;
  similarity_boost?: number;
}

export interface DemoSpec {
  id: string;
  kind: "product-demo";
  title: string;
  style_pack?: string;
  voice?: DemoVoiceConfig;
  slides: DemoSlide[];
  render?: RenderSettings;
  created_at?: string;
  updated_at?: string;
}

/**
 * VideoSegment — /vg-video-demo 파이프라인의 세그먼트.
 * 원본 녹화 비디오의 특정 구간 + 사용자 주석(action, hotspot).
 * MVP 는 segment 당 hotspot 0/1 개만 허용.
 */
export interface VideoSegment {
  id: string;
  order: number;
  /** 원본 비디오 내부 기준 시작(ms) */
  startMs: number;
  /** 원본 비디오 내부 기준 끝(ms) */
  endMs: number;
  /** public/ 기준 상대 경로. 세그먼트 대표 프레임 썸네일. */
  thumbnail: string;
  /** 사용자가 입력한 한 줄 액션 설명 */
  action: string;
  /** vg-video-demo-script 가 채우는 자연 문장 */
  narration: string | null;
  /** vg-video-demo-voice 가 채우는 TTS 길이(ms) */
  narration_ms: number | null;
  /** TTS 시작 오프셋(ms, 전체 mp3 기준) */
  audio_offset_ms?: number | null;
  /** MVP: 0 또는 1 개. 2 개 이상이면 첫 번째만 사용. */
  hotspot: Hotspot | null;
  /** 커서 오버레이 on/off (기본 true). 원본에 이미 포인터가 있으면 false. */
  showCursor: boolean;
  /** 원본 오디오 사용 여부 (기본 false = TTS 만). */
  keepOriginalAudio: boolean;
}

/**
 * VideoSpec — /vg-video-demo 파이프라인의 프로젝트 정의.
 * data/{pid}/video-spec.json 에 저장됨.
 */
export interface VideoSpec {
  id: string;
  kind: "video-demo";
  title: string;
  /** public/ 기준 원본 mp4 경로 */
  videoSrc: string;
  videoWidth: number;
  videoHeight: number;
  videoDuration_ms: number;
  videoFps: number;
  /** DemoSpec 에서 재사용 */
  voice?: DemoVoiceConfig;
  segments: VideoSegment[];
  render?: RenderSettings;
  created_at?: string;
  updated_at?: string;
}

/**
 * RenderSettings — project.json / demo-spec.json / video-spec.json 에 선택적으로
 * 붙는 렌더링 파라미터 override. 없으면 Root.tsx 기본값(30fps / 1920x1080 / dark-neon).
 * render-props-v2.json 루트에도 같은 형태로 복사되어 Remotion 이 런타임에 읽는다.
 */
export interface RenderSettings {
  fps?: number;
  width?: number;
  height?: number;
  stylePack?: "dark-neon" | "editorial" | "documentary" | "clean-enterprise";
}

export type DemoTriggerStatus = "pending" | "running" | "done" | "failed";

export interface DemoTrigger {
  pid: string;
  status: DemoTriggerStatus;
  created_at: string;
  updated_at?: string;
  submitted_by?: string;
  output_path?: string | null;
  error?: string | null;
}

export interface RenderJob {
  id: string;
  project_id: string;
  status: RenderStatus;
  total_frames: number;
  rendered_frames: number;
  started_at: string;
  completed_at: string | null;
  output_path: string | null;
  file_size: number | null;
  logs: LogEntry[];
  current_scene: string | null;
}
