---
name: vg-layout
description: Scene layout engine. Transforms narration meaning into 2D spatial compositions. Every scene MUST use a container (Split/Grid/Stack-row). Pure vertical stacking is BANNED.
---

# /vg-layout — Scene Layout Engine

## Invoke
```
/vg-layout {projectId}
/vg-layout {projectId} --scene 3
```

## Core Philosophy

**Every scene is a 2D spatial composition, not a 1D vertical list.**

The renderer supports Split, Grid, Stack(row), and nested containers.
If a scene only stacks nodes top-to-bottom, it is a FAILURE — regardless of what nodes it uses.

---

# PART A — HARD RULES (Breaking these = render error or blank screen)

## A1. Node Nesting

All properties must be inside `data`, `motion`, `layout`, or `style` objects.
Flat properties (`{text:"...", enterAt:4}`) will NOT render.

```json
{
  "id": "headline-abc",
  "type": "Headline",
  "data": { "text": "keyword", "size": "xl", "emphasis": ["keyword"] },
  "motion": { "preset": "fadeUp", "enterAt": 20, "duration": 15 }
}
```

| Property | Location | Example |
|----------|----------|---------|
| text, size, items, value, label, icon, name, src, segments | `data: {...}` | `data: { text: "AI" }` |
| enterAt, preset, duration, emphasis (loop anim) | `motion: {...}` | `motion: { enterAt: 30 }` |
| gap, columns, padding, align, justify, maxWidth, direction, ratio | `layout: {...}` | `layout: { gap: 20 }` |
| Top-level allowed keys | — | id, type, data, motion, layout, style, children |

**`emphasis` disambiguation:**
- `data.emphasis` = keyword highlight array (Headline only). `data: { emphasis: ["AI"] }`
- `motion.emphasis` = loop animation (float, pulse, etc). `motion: { emphasis: "float" }`
- These are completely different features. Never confuse them.

## A2. SceneRoot Defaults

```json
{
  "type": "SceneRoot",
  "layout": {
    "gap": 24,
    "padding": "60px 100px 140px",
    "align": "center",
    "justify": "center"
  }
}
```

- Bottom padding MUST be ≥ 140px (subtitle safe zone 130px + 10px margin)
- `align: "center"`, `justify: "center"` required

## A3. NO PURE VERTICAL STACKING (MANDATORY)

> **This is the single most important rule in the entire skill.**
> A scene where SceneRoot's children are all leaf nodes stacked top-to-bottom is BANNED.
> This means: SceneRoot > Kicker > Headline > BodyText > FooterCaption = ILLEGAL.
> This means: SceneRoot > ImageAsset > ImpactStat > FooterCaption = ILLEGAL.
> Even adding an ImageAsset or chart does NOT fix it if everything is still 1D vertical.

### What "2D composition" means

SceneRoot must contain **at least one structural container** as a direct child:

| Container | Usage | Example |
|-----------|-------|---------|
| `Split` | Side-by-side comparison, text+image, text+chart | `Split { ratio:[1,1] }` with 2 children |
| `Grid` | Dashboard, icon grid, card grid | `Grid { columns:2~4 }` with N children |
| `Stack(row)` | Horizontal flow of badges, pills, icons | `Stack { direction:"row" }` |
| Compound nodes | VersusCard, CompareCard, FlowDiagram, CycleDiagram, CompareBars | These are inherently 2D |

### The Container Selection Algorithm (MANDATORY)

For EVERY scene, follow this decision tree:

```
1. Is there a screenshot/media footnote? → Split (text left, image right)
2. Is it a comparison (A vs B)? → Split or VersusCard
3. Is it a list/steps (3+ items)? → Grid(2~3 columns) or Stack(row)
4. Is it a single stat/metric? → Split (stat left, context right) or Grid(1x2)
5. Is it a brand/product mention? → Split (image + text)
6. Is it a process/flow? → FlowDiagram or Stack(row) of steps
7. Is it a quote/emphasis? → Split (QuoteText left, context/image right)
8. None of the above? → Grid(2 columns) with related content cards
```

**There is NO path in this tree that results in a pure vertical stack.**

### Distribution Quota (per 10 scenes)

| Container | Minimum | Maximum |
|-----------|---------|---------|
| Split (2-panel) | 3 scenes | 5 scenes |
| Grid (2~4 columns) | 2 scenes | 4 scenes |
| Compound (VersusCard, FlowDiagram, CompareBars, etc.) | 2 scenes | 4 scenes |
| Stack(row) as main structure | 1 scene | 3 scenes |
| Pure vertical leaf stack | **0** | **0** |

Track distribution every 10 scenes. Rebalance if any category hits 0.

### Exception: Transition Scenes Only

Scenes under 2 seconds (60 frames) MAY use a simple structure.
Every other scene MUST follow the container rule.

### Correct Examples

**GOOD — Split with image and text:**
```json
{
  "type": "SceneRoot",
  "children": [
    { "type": "Kicker", "data": { "text": "NEWS 01" }, "motion": { "enterAt": 0 } },
    {
      "type": "Split",
      "layout": { "ratio": [1, 1], "gap": 40, "maxWidth": 1100 },
      "motion": { "enterAt": 15 },
      "children": [
        {
          "type": "Stack",
          "layout": { "direction": "column", "gap": 16, "align": "center" },
          "children": [
            { "type": "Headline", "data": { "text": "Claude 4", "size": "lg" } },
            { "type": "BodyText", "data": { "text": "Next-gen reasoning" } }
          ]
        },
        { "type": "ImageAsset", "data": { "src": "icons/proj/ai-brain.png", "shape": "rounded", "maxHeight": 400 } }
      ]
    }
  ]
}
```

**GOOD — Grid dashboard:**
```json
{
  "type": "SceneRoot",
  "children": [
    { "type": "Kicker", "data": { "text": "Performance" }, "motion": { "enterAt": 0 } },
    {
      "type": "Grid",
      "layout": { "columns": 3, "gap": 24, "maxWidth": 1100 },
      "motion": { "enterAt": 20 },
      "children": [
        { "type": "ImpactStat", "data": { "value": "2x", "label": "Speed" } },
        { "type": "ImpactStat", "data": { "value": "50%", "label": "Cost" } },
        { "type": "ImpactStat", "data": { "value": "99.9%", "label": "Uptime" } }
      ]
    }
  ]
}
```

**GOOD — Compound node (inherently 2D):**
```json
{
  "type": "SceneRoot",
  "children": [
    { "type": "Badge", "data": { "text": "COMPARISON" }, "motion": { "enterAt": 0 } },
    { "type": "VersusCard", "data": { "leftLabel": "Manual", "rightLabel": "AI", "leftValue": "3 hours", "rightValue": "5 min" }, "motion": { "enterAt": 20 } },
    { "type": "FooterCaption", "data": { "text": "Time saved per task" }, "motion": { "enterAt": 60 } }
  ]
}
```

**BAD — Pure vertical stack (BANNED):**
```json
{
  "type": "SceneRoot",
  "children": [
    { "type": "Kicker" },
    { "type": "Headline" },
    { "type": "ImageAsset" },
    { "type": "FooterCaption" }
  ]
}
```
↑ Even though it has ImageAsset, ALL children are leaf nodes stacked vertically. ILLEGAL.

**Fix:** Wrap Headline + ImageAsset in a Split:
```json
{
  "type": "SceneRoot",
  "children": [
    { "type": "Kicker" },
    { "type": "Split", "children": [
      { "type": "Stack", "children": [{ "type": "Headline" }, { "type": "BodyText" }] },
      { "type": "ImageAsset" }
    ]},
    { "type": "FooterCaption" }
  ]
}
```

## A4. enterAt — Immediate + Sequential

**First content must appear within frames 0~30. No blank screens.**

| Phase | Frame range | What to show | Required? |
|-------|-----------|--------------|-----------|
| **Instant** | 0 ~ 30 | Kicker + main visual (Headline, ImageAsset, chart) | **YES** |
| **Develop** | 30 ~ duration×0.5 | Supporting elements. Follow subtitle timing. | Recommended |
| **Conclude** | duration×0.5 ~ duration×0.8 | FooterCaption, final element | Optional |

Rules:
1. First content element: enterAt 0~30. Kicker alone with nothing until frame 100 = BANNED.
2. No element may have enterAt > duration_frames × 0.8. Last 20% is exit zone.
3. Sibling nodes: minimum **15 frames** apart.
4. Container children: **15~30 frame** intervals from container's enterAt.

## A5. SvgGraphic Schema

```json
{
  "type": "SvgGraphic",
  "data": {
    "viewBox": "0 0 600 300",
    "width": 1100, "height": 500,
    "elements": [
      { "tag": "circle", "attrs": { "cx": 300, "cy": 150, "r": 60, "fill": "none", "strokeWidth": 3.5, "strokeLinecap": "round", "strokeLinejoin": "round" }, "themeColor": "accent", "staggerIndex": 0 }
    ],
    "drawMode": true, "fillAfterDraw": true, "drawDuration": 25, "staggerDelay": 5
  }
}
```

SVG quality rules:
- `strokeWidth` ≥ 3.0 (main), 2.0 (auxiliary)
- `strokeLinecap: "round"`, `strokeLinejoin: "round"` on ALL shape elements
- `fontSize` ≥ 22, `fontWeight` ≥ 600
- All SVG attributes MUST be inside `attrs` object
- `elements` array required. Raw SVG structure forbidden.
- `width` ≥ 1000, `height` ≥ 450
- Arrow: single `path` with V-head (`M350 135 L375 150 L350 165`)
- SvgGraphic = accent only (arrows, marks, connection lines). Max 5 elements.
- NO stick figures, NO complex illustrations, NO concrete objects.

## A6. BulletList Format

```json
{ "items": ["text1", "text2", "text3"] }
```
MUST be string array. Object array causes React error.

## A7. Pre-Render Checklist

1. Run `bash scripts/postprocess.sh data/{projectId}/scenes-v2.json`
2. Fix duration_frames: `Math.round((end_ms - start_ms) / 1000 * 30)`
3. Set all transitions: `{ type: "none", durationFrames: 0 }`
4. Sync render-props-v2.json
5. Verify background file existence — delete background if src missing

---

# PART B — DESIGN QUALITY (Soft rules — follow when possible)

## B1. Visual DNA (Fixed)
- Black background + mint/green accent + white typography
- Stroke 3~4px with round cap/join
- Corner radius 8~16px, glow accent colors only

## B2. Semantic Shape → Pattern → Container Mapping

### Step 1: Classify narration meaning into semantic_shape

| Narration meaning | semantic_shape |
|---|---|
| Comparing A vs B | `contrast` |
| Steps/process/sequence | `sequence` |
| Listing multiple items | `cluster` |
| Single key metric | `metric` |
| Part of a whole | `fraction` |
| Structure/hierarchy | `hierarchy` |
| Before/after transformation | `transformation` |
| Question/pause/transition | `pause` |
| Single symbol/metaphor | `symbol` |
| Evidence/quote/case | `evidence` |
| Summary/recap | `summary` |

### Step 2: Pick composition pattern AND container

| Pattern | Container | semantic_shape |
|---------|-----------|---------------|
| Brand hero (logo + title) | **Split** (image + text) | symbol |
| Stat dashboard (2~4 metrics) | **Grid** (2~4 cols) | metric, cluster |
| Side-by-side comparison | **Split** or **VersusCard** | contrast |
| Numbered steps | **Grid** (2~3 cols) or **Stack(row)** | sequence |
| Before/After | **SplitRevealCard** or **Split** | transformation |
| Flow diagram | **FlowDiagram** (compound) | sequence |
| Ring/Pie hero | **Split** (chart + context) | fraction |
| Compare bars | **CompareBars** (compound) | contrast, metric |
| Quote + context | **Split** (quote + image/icon) | evidence, pause |
| Icon grid | **Grid** (3~4 cols) | cluster |
| Cycle diagram | **CycleDiagram** (compound) | sequence |
| Hub-spoke | **Grid** center + surrounding | hierarchy |
| Pipeline pills | **FlowDiagram** (compound) | sequence, summary |
| Checklist compare | **Split** (check vs X lists) | contrast, summary |
| Timeline | **AnimatedTimeline** (compound) | sequence |
| Progress evaluation | **Grid** (items + ProgressBar) | evidence |

**Every pattern has a mandatory container. There is no pattern that uses pure vertical stacking.**

### Step 3: Avoid repetition

- Same pattern: max 3 times across entire video
- Same container type: no more than 2 consecutive scenes
- Per 5 scenes: use at least 3 different patterns
- News header scenes (Badge+Headline) are exempt from the 3-repeat limit

## B3. Bold Sizing (Specific Numbers)

> Safe and small = boring. Big and bold = impact.

| Element | Minimum | Context |
|---------|---------|---------|
| ImageAsset (hero) | `maxHeight: 300` | When image is the star |
| ImageAsset (supporting) | `maxHeight: 150` | Inside Split alongside text |
| RingChart/PieChart | `size: 280` | Center of screen |
| CompareBars | `maxWidth: 900` | Fill width |
| Grid/Split | `maxWidth: 900~1100` | Fill screen |
| Background blur | **6~10** | Background must be VISIBLE |
| Background overlayOpacity | **0.5~0.65** | Over 0.75 = invisible background |
| Single card | `maxWidth: 480~520` | |

## B4. Asset Priority

1. Brand logo (ImageAsset from manifest) — highest priority
2. Concept icon (from `public/icons/{projectId}/manifest.json`)
3. Chart/card nodes (CompareBars, RingChart, etc.)
4. SVG accent (arrows, marks only — NOT illustrations)

Check `public/assets/manifest.json` for brand assets.
Check `public/icons/{projectId}/manifest.json` for project-specific icons.

## B5. Motion Variety

- Don't use `fadeUp` for everything — mix: scaleIn, blurIn, slideSplit, wipeRight, revealUp
- Kicker/Badge/Headline/FooterCaption: fadeUp is fine
- `motion.emphasis` (loop animation): apply to 1 main visual per scene only
- Emphasis cycle: use prime numbers (67, 73, 83, 97)

## B6. Content Density for Long Scenes

| Scene duration | Minimum content elements | Example |
|---------------|------------------------|---------|
| ~5 sec | 1 | Headline in Split is enough |
| 5~10 sec | 2 | Split(Headline + ImageAsset) |
| 10~15 sec | 3 | Split + FooterCaption + supporting |
| 15+ sec | 4+ | Grid or Split + multiple elements |

Content element = any visually meaningful node (NOT Kicker or FooterCaption).

## B7. Screenshot/Footnote Media

When SRT has `[N]` footnotes and manifest has `type:"screenshot"`:

1. Scenes with `visual_keywords` containing `"screenshot:N"` → use Split layout
2. Default: text left, image/video right
3. ImageAsset: `shape:"rounded"`, `maxHeight:500`, `shadow:true`
4. Consecutive `[N]` across subtitles: maintain same image across scenes
5. `media_type:"video"` → background video or Split with VideoClip

## B8. Backgrounds (Target 30~40% of scenes)

Recommended for: news headers, intro/outro, pause/symbol scenes.
Avoid for: complex Grid/BulletList infographics (readability).

| Property | Image | Video |
|----------|-------|-------|
| blur | 8px | 4px |
| overlayOpacity | 0.6 | 0.55 |
| vignette | 0.5 | 0.6 |
| scale | 1.2~1.3 | — |

---

# PART C — NODE REFERENCE

> Full reference: `docs/node-data-reference.md`

Key nodes:
- **Headline**: `{text, size:"lg"|"xl", emphasis:["keyword"]}`
- **BulletList**: `{items:string[], variant:"check"|"dot"}` — MUST be string array
- **ImpactStat**: `{value, suffix?, label?}`
- **AnimatedCounter**: `{from?, to, suffix?, label?}`
- **VersusCard**: `{leftLabel, rightLabel, leftValue?, rightValue?}`
- **CompareCard**: `{left:{icon,title,subtitle}, right:{icon,title,subtitle}}`
- **CompareBars**: `{items:[{label,value,color?}]}`
- **ImageAsset**: `{src, shape:"rounded"|"circle", maxHeight?, shadow?}`
- **RingChart**: `{value, label, size?}`
- **PieChart**: `{segments:[{label,value,color?}], donut?, title?}`
- **FlowDiagram**: `{steps:[{label,icon?}]}`
- **CycleDiagram**: `{steps:[{label}], centerLabel}`
- **AnimatedTimeline**: `{steps:[{label,icon?,desc?}], direction?}`
- **SplitRevealCard**: `{beforeLabel?, afterLabel?, beforeItems:[], afterItems:[]}`
- **ScaleComparison**: `{items:[{label,value}]}`
- **NumberCircle**: `{number, label?, size?}`
- **CheckMark**: `{label(required!), variant?:"success"|"accent"}`
- **ProgressBar**: `{value, label}`
- **MarkerHighlight**: `{text, fontSize?:48}`
- **DualToneText**: `{segments:[{text, tone?:"accent"|"large"|"muted"}]}`
- **SvgGraphic**: See A5 (elements array, viewBox, width/height required)

Containers:
- **Split**: `layout: {ratio:[1,1]|[2,3], gap:40, maxWidth:1100}` — exactly 2 children
- **Grid**: `layout: {columns:2~4, gap:24, maxWidth:1100}` — N children
- **Stack**: `layout: {direction:"row"|"column", gap, maxWidth, align:"center"}` — N children
- **FrameBox**: `layout: {maxWidth, gap}` — must have children

---

# PART D — WORKFLOW

## ⚠ Execution: Generate directly. No sub-agents.

Do NOT delegate layout generation to Agent tool. Sub-agents degrade quality over long runs.

### Step 1: Load Data
```
Read: data/{projectId}/scenes-v2.json
Read: public/assets/manifest.json
Read: public/icons/{projectId}/manifest.json (if exists)
```

### Step 2: For each scene → classify → pick pattern → pick container

Follow the A3 Container Selection Algorithm. Every scene gets a container.
Track container distribution. After every 10 scenes, verify the quota from A3.

### Step 3: Generate stack_root (batches of 10~15 scenes)

For each scene:
1. Determine semantic_shape from narration
2. Pick a composition pattern from B2 table (must differ from previous scene)
3. The pattern determines the container type (Split/Grid/compound/Stack-row)
4. Build the stack_root with the container as a direct child of SceneRoot
5. Set enterAt values following A4 timing rules

After each batch, verify:
- Container distribution quota (A3)
- No pure vertical stacks
- Node type variety (ImageAsset, charts, compound nodes, etc.)

### Step 4: Validate

- All enterAt within duration_frames
- Sibling enterAt ≥ 15 frames apart
- Text ≤ 25 characters (keywords only, not narration)
- maxWidth applied to all containers
- Every scene has a container (not pure leaf stack)

### Step 5: Save + Post-process
```
Edit: data/{projectId}/scenes-v2.json
bash scripts/postprocess.sh data/{projectId}/scenes-v2.json
```
Then follow A7 pre-render checklist.

### Step 6: Cinematic Backgrounds (Optional)
If background.type === "video":
1. Create `assets.video_queries` (English keywords, 2~5 words)
2. Run `npx tsx scripts/fetch-scene-videos.ts`
3. Update background.src
4. No PEXELS_API_KEY → use image + Ken Burns fallback

---

# PART E — ABSOLUTE BANS (Render breakage or UX destruction)

- Pure vertical leaf stacking (SceneRoot > leaf > leaf > leaf) — USE A CONTAINER
- Narration text on screen (keywords only!)
- Flat node structure (`{text:"...", enterAt:4}` — properties outside data/motion)
- SvgGraphic without `elements` array
- SvgGraphic attrs outside `attrs` object
- BulletList items as object array
- FrameBox without children
- CheckMark without label
- Same text twice in SvgGraphic
- SceneRoot bottom padding < 140px
- Headline > 25 characters
- SvgGraphic as complex illustration (stick figures, buildings, shields, etc.)
- Same composition pattern more than 3 times in entire video
