# Node Data Reference

vg-layout에서 stack_root 생성 시 참조하는 노드 data 형식 일람.

## 기존 노드

```
Headline:     { text, size:"lg"|"xl", emphasis:["키워드"] }
BodyText:     { text }
Kicker:       { text }
FooterCaption:{ text }
Icon:         { name, size, glow:bool }
StatNumber:   { value, suffix?, label }
BulletList:   { items:string[], variant:"check"|"dot" }  ← 반드시 문자열 배열
IconCard:     { icon, title, body }
CompareCard:  { left:{icon,title,subtitle}, right:{icon,title,subtitle} }
CompareBars:  { items:[{label,value,color?}] }
RingChart:    { value, label, size? }
ProgressBar:  { value, label }
ProcessStepCard: { step, title, description }
WarningCard:  { title, body }
InsightTile:  { index(String!), title }
QuoteText:    { text }
FlowDiagram:  { steps:[{label,icon?}] }
CycleDiagram: { steps:[{label}], centerLabel }
TimelineStepper: { steps:[{year,title,description?}] }
Badge/Pill:   { text }
ImageAsset:   { src, shape:"rounded"|"circle", caption?, maxHeight?, shadow? }
```

## 신규 노드 (렌더러 등록 완료)

```
MarkerHighlight:  { text, fontSize?:48, highlightColor? }
DualToneText:     { segments:[{text, tone?:"accent"|"large"|"muted"}] }
ImpactStat:       { value, suffix?, label? }
AnimatedCounter:  { from?, to, suffix?, label? }
CalloutArrow:     { text, direction?:"right"|"left"|"up"|"down" }
WaffleChart:      { value(0-100), label? }
PictogramRow:     { total, highlighted, icon?, label? }
NumberCircle:     { number, label?, size? }
CheckMark:        { label(필수!), variant?:"success"|"accent" }
VersusCard:       { leftLabel, rightLabel, leftValue?, rightValue? }
SplitRevealCard:  { beforeLabel?, afterLabel?, beforeItems:[], afterItems:[] }
ScaleComparison:  { items:[{label,value}] }
AreaChart:        { points:number[], labels?:string[], title? }
LineChart:        { series:[{label,points:number[],color?}], labels?, title? }
AnimatedTimeline: { steps:[{label,icon?,desc?}], direction? }
PieChart:         { segments:[{label,value,color?}], donut?, title? }
```

## 컨테이너

```
SceneRoot: { gap:20~28, padding:"60px 100px 140px", align:"center", justify:"center" }
Stack:     { direction:"row"|"column", gap, maxWidth, justify, align }
Grid:      { columns:2~4, gap, maxWidth }
Split:     { ratio:[1,1]|[2,3], gap, maxWidth }
FrameBox:  { maxWidth, gap }  — children 필수
```

## 모션 프리셋

입장: fadeUp, popBadge, scaleIn, blurIn, slideSplit, shakeIn, impactPop, wipeRight, stampIn, revealUp
강조: float, pulse, shimmer, glowPulse, radarPing, dangerPulse, successGlow, numberTick
