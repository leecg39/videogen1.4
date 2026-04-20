// Node Registry - type string → React component
import type React from "react";
import type { NodeProps } from "@/types/stack-nodes";

import { ContainerPlaceholder } from "./containers";
import {
  KickerRenderer, HeadlineRenderer, RichTextRenderer, BodyTextRenderer,
  BulletListRenderer, StatNumberRenderer, QuoteTextRenderer, FooterCaptionRenderer,
} from "./text";
import { DividerRenderer, BadgeRenderer, PillRenderer, FrameBoxRenderer } from "./shapes";
import { IconRenderer, RingChartRenderer } from "./media";
import {
  IconCardRenderer, StatCardRenderer, CompareCardRenderer,
  ProcessStepCardRenderer, InsightTileRenderer, WarningCardRenderer,
} from "./composites";
import { ArrowConnectorRenderer, LineConnectorRenderer } from "./connectors";
import { AccentGlowRenderer, AccentRingRenderer, BackplateRenderer, SpacerRenderer } from "./accents";
import { ProgressBarRenderer, CompareBarsRenderer, MiniBarChartRenderer } from "./charts";
import { ImageAssetRenderer } from "./image-asset";
import {
  ChatBubbleRenderer, PhoneMockupRenderer,
  MonitorMockupRenderer, TerminalBlockRenderer,
} from "./interactive";
import {
  CycleDiagramRenderer, FlowDiagramRenderer,
  TimelineStepperRenderer, PersonAvatarRenderer,
} from "./diagrams";
import {
  ScatterPlotRenderer, DataTableRenderer, StructuredDiagramRenderer,
} from "./data-viz";
import { SvgGraphicRenderer } from "./svg-graphic";
import { SvgAssetRenderer } from "./svg-asset";
import { VideoClipRenderer } from "./video-clip";
import {
  VennDiagramRenderer, FunnelDiagramRenderer,
  PyramidDiagramRenderer, MatrixQuadrantRenderer,
} from "./diagrams-v2";
import { MarkerHighlightRenderer, DualToneTextRenderer } from "./emphasis";
import { DevIconRenderer } from "./dev-icon";
import { ImpactStatRenderer, AnimatedCounterRenderer, CalloutArrowRenderer } from "./impact";
import { WaffleChartRenderer, PictogramRowRenderer } from "./pictogram";
import {
  NumberCircleRenderer, CheckMarkRenderer, VersusCardRenderer,
  SplitRevealCardRenderer, ScaleComparisonRenderer,
} from "./scene-patterns";
import {
  AreaChartRenderer, LineChartRenderer, AnimatedTimelineRenderer, PieChartRenderer,
} from "./advanced-viz";
import { VerticalTimelineRenderer } from "./vertical-timeline";
import { ImageCanvasRenderer } from "./image-canvas";
import { VideoCanvasRenderer } from "./video-canvas";
import { CursorRenderer } from "./cursor";
import { SfxAudioRenderer } from "./sfx-audio";
import { FreeTextRenderer, AbsolutePlaceholder } from "./freeform";
import { TSXEscapeRenderer } from "./tsx-escape";
import {
  BrowserMockupRenderer, EmojiIconListRenderer, BrandSatelliteRenderer,
  VerticalBarsRenderer, DiagonalFlowRenderer,
} from "./diversity-primitives";

export const NODE_REGISTRY: Record<string, React.FC<NodeProps>> = {
  // Text
  Kicker: KickerRenderer,
  Headline: HeadlineRenderer,
  RichText: RichTextRenderer,
  BodyText: BodyTextRenderer,
  BulletList: BulletListRenderer,
  StatNumber: StatNumberRenderer,
  QuoteText: QuoteTextRenderer,
  FooterCaption: FooterCaptionRenderer,

  // Shapes
  Divider: DividerRenderer,
  Badge: BadgeRenderer,
  Pill: PillRenderer,
  FrameBox: FrameBoxRenderer,

  // Media
  Icon: IconRenderer,
  RingChart: RingChartRenderer,
  ImageAsset: ImageAssetRenderer,

  // Charts
  ProgressBar: ProgressBarRenderer,
  CompareBars: CompareBarsRenderer,
  MiniBarChart: MiniBarChartRenderer,

  // Composites
  IconCard: IconCardRenderer,
  StatCard: StatCardRenderer,
  CompareCard: CompareCardRenderer,
  ProcessStepCard: ProcessStepCardRenderer,
  InsightTile: InsightTileRenderer,
  WarningCard: WarningCardRenderer,

  // Connectors
  ArrowConnector: ArrowConnectorRenderer,
  LineConnector: LineConnectorRenderer,

  // Accents
  AccentGlow: AccentGlowRenderer,
  AccentRing: AccentRingRenderer,
  Backplate: BackplateRenderer,

  // Utility
  Spacer: SpacerRenderer,

  // Interactive
  ChatBubble: ChatBubbleRenderer,
  PhoneMockup: PhoneMockupRenderer,
  MonitorMockup: MonitorMockupRenderer,
  TerminalBlock: TerminalBlockRenderer,

  // Diagrams
  CycleDiagram: CycleDiagramRenderer,
  FlowDiagram: FlowDiagramRenderer,
  TimelineStepper: TimelineStepperRenderer,
  PersonAvatar: PersonAvatarRenderer,

  // Data Visualization
  ScatterPlot: ScatterPlotRenderer,
  DataTable: DataTableRenderer,
  StructuredDiagram: StructuredDiagramRenderer,

  // Custom SVG Graphics
  SvgGraphic: SvgGraphicRenderer,
  SvgAsset: SvgAssetRenderer,

  // Video
  VideoClip: VideoClipRenderer,

  // Diagrams v2
  VennDiagram: VennDiagramRenderer,
  FunnelDiagram: FunnelDiagramRenderer,
  PyramidDiagram: PyramidDiagramRenderer,
  MatrixQuadrant: MatrixQuadrantRenderer,

  // Phase 1: Emphasis
  MarkerHighlight: MarkerHighlightRenderer,
  DualToneText: DualToneTextRenderer,

  // Phase 2: Impact & Pictogram
  ImpactStat: ImpactStatRenderer,
  AnimatedCounter: AnimatedCounterRenderer,
  CalloutArrow: CalloutArrowRenderer,
  WaffleChart: WaffleChartRenderer,
  PictogramRow: PictogramRowRenderer,

  // Phase 3: Scene Patterns
  NumberCircle: NumberCircleRenderer,
  CheckMark: CheckMarkRenderer,
  VersusCard: VersusCardRenderer,
  SplitRevealCard: SplitRevealCardRenderer,
  ScaleComparison: ScaleComparisonRenderer,

  // Tech Icons (developer-icons 라이브러리)
  DevIcon: DevIconRenderer,

  // Phase 4: Advanced Viz
  AreaChart: AreaChartRenderer,
  LineChart: LineChartRenderer,
  AnimatedTimeline: AnimatedTimelineRenderer,
  VerticalTimeline: VerticalTimelineRenderer,
  PieChart: PieChartRenderer,

  // Product Demo (vg-demo)
  ImageCanvas: ImageCanvasRenderer,
  VideoCanvas: VideoCanvasRenderer,
  Cursor: CursorRenderer,
  SfxAudio: SfxAudioRenderer,

  // Freeform primitives — Artifacts 급 자유도
  FreeText: FreeTextRenderer,
  Absolute: AbsolutePlaceholder,

  // TSX escape hatch — scene-grammar.md Section 0
  TSX: TSXEscapeRenderer,

  // Diversity primitives — reference 60장 누락 DNA 보충
  BrowserMockup: BrowserMockupRenderer,
  EmojiIconList: EmojiIconListRenderer,
  BrandSatellite: BrandSatelliteRenderer,
  VerticalBars: VerticalBarsRenderer,
  DiagonalFlow: DiagonalFlowRenderer,
};

// 컨테이너 타입 (children을 직접 렌더하는 노드)
export const CONTAINER_TYPES = new Set([
  "SceneRoot", "Stack", "Grid", "Split", "Overlay",
  "AnchorBox", "SafeArea", "FrameBox",
  "ScatterLayout",
  "Absolute",
]);
