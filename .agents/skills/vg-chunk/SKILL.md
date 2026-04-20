---
name: vg-chunk
description: Scene-aware chunker. Transforms SRT subtitles into scene primitives with directing metadata — not just text annotations but layout-ready scene blueprints.
---

# /vg-chunk — Scene-Aware Chunker

Transforms SRT subtitles into **scene primitives** — not subtitle annotations.

Each beat is not "a subtitle with tags." It is a **scene blueprint** that tells vg-layout
what relationship to show, how important it is, and how it connects to its neighbors.

## Input
- projectId: project ID
- SRT file in data/{projectId}/

## Output
- data/{projectId}/beats.json (scene primitives)
- public/icons/{projectId}/*.png (visual assets)

## Invoke
```
/vg-chunk {projectId}
```

---

# CORE PRINCIPLE

**You are not annotating subtitles. You are pre-directing scenes.**

The layout engine downstream can only be as creative as the input it receives.
If you produce flat, uniform, text-centric beats → layout will produce flat, uniform, text-centric scenes.

Your job: give layout **scene primitives rich enough to direct with.**

---

# PIPELINE

## Step 1: SRT Parsing

```
data/{projectId}/project.json → srt_path
Parse SRT file (parseSRT)
```

## Step 2: Footnote Image Recognition

If SRT text contains `[N]` footnotes:
1. Read `public/icons/{projectId}/manifest.json` for `type:"screenshot"` entries
2. Match `srt_index` to `[N]` tags in subtitle text
3. Add `"screenshot:N"` to `visual_keywords`
4. Text already has `[N]` removed (by vg-new)
5. Screenshots with matching keywords skip web search (user assets take priority)

## Step 3: Scene-Aware Semantic Analysis (Codex performs directly)

This is the MOST IMPORTANT step. For each SRT entry group, analyze:

### 3a. Scene Role (NEW — replaces old intent)

What role does this beat play in the narrative?

| scene_role | Meaning | Layout implication |
|------------|---------|-------------------|
| `declaration` | Bold claim, thesis, key statement | Hero text, big focal, sparse support |
| `comparison` | A vs B, before/after, contrast | VersusCard, Split with asymmetric weight |
| `escalation` | Building toward a point, numbers growing | Sequential reveal, ascending bars |
| `evidence` | Proof, quote, data backing a claim | Quote+authority, stat+context |
| `sequence` | Steps, process, timeline | FlowDiagram, AnimatedTimeline |
| `payoff` | Punchline, conclusion, "so what" | Single hero number/text, dramatic reveal |
| `pause` | Transition, breath, rhetorical question | Sparse symbol, single concept |
| `metaphor` | Analogy, comparison to familiar concept | Symbol center + explanation periphery |
| `cluster` | Multiple items at same level | Grid, dashboard |
| `support` | Background info, context | Merge candidate, not automatic merge |

**Support beats are merge CANDIDATES, not automatic merges.**
A support beat that creates rhythm, contains a strong focal, or works as a pause → can stay standalone.

### 장면 문법 트리거 키워드 (Scene Grammar v1 통합)

scene_role 판별 시 아래 트리거 키워드를 참고하여 더 정확한 분류를 ���라:

| 트리거 키워드 | scene_role | semantic_shape | 활성화되는 레이아웃 패턴 |
|-------------|------------|---------------|-------------------|
| 숫자, %, 배수, 달러, 원, 시간, "증가", "감소" | `evidence` or `payoff` | `metric` | stats-number (도넛/히어로 넘버) |
| "반면", "반대로", "A와 B", "대신", "똑같다" | `comparison` | `contrast` | compare-versus (좌우 대비) |
| "이전에는", "지금��", "예전엔", "바뀌었다", "현재" | `comparison` | `transformation` | **before-after** (✗/◎ 전환) |
| "먼저", "그다음", "이후", "마지막으로", "단계" | `sequence` | `flow` | process-steps (넘버 플로우) |
| 연도, 월, "초기", "중반", "최근", "지금" | `sequence` | `flow` | timeline (수평 노드) |
| 따옴���, "라고 말했다", "핵심은", "한마디���", "바로" | `declaration` | `symbol` | **quote-focus** (히어로 3단) |
| "첫째", "둘째", "셋째", "핵심은 세 가지" | `cluster` | `cluster` | key-point-bullet |
| "확인해야", "체크", "조건", "준비", "꼭 지켜" | `cluster` | `cluster` | **checklist** (우선도 그라데이션) |
| "넣으면", "거치고", "결과로", "출력" | `sequence` | `transformation` | **input-output** (수평 변환) |
| "문제는", "하지만", "해법은", "그래서 필요한" | `declaration` | `evidence` | problem-solution |
| "많이들 착각하는데", "사실은", "오해" | `comparison` | `contrast` | **myth-vs-reality** (대화형) |
| "하지 말고", "대신", "좋은 방법", "피해야" | `comparison` | `contrast` | **do-dont** (✓/✗ 바 대비) |
| "때문에", "그래서", "결국", "원인" | `evidence` | `evidence` | cause-effect |
| "판도", "지도", "생태계", "어디쯤" | `cluster` | `hierarchy` | map-or-landscape |
| "이제", "다음은", "그 전에", "정리하면" | `pause` | `symbol` | chapter-transition |
| 기획자, PM, 개발자 + 감정/공감 표현 | `declaration` | `symbol` | **persona-empathy** (공감 선언) |

### 3.5. SVG Sketch Candidates (Step 3.5 — plan_svg 옵션 활성화 시)

각 beat 에서 시각화 가치가 있는 **핵심 명사 (concept)** 를 추출하여 `svg_needs` 에 기록.
`public/svg-library/index.json` 을 조회해 매칭되는 asset_id 가 있으면 바로 참조, 없으면 `pending_forge: true`.

**스키마:**
```ts
svg_needs?: Array<{
  concept: string;
  asset_id?: string;
  role: "focal" | "support" | "accent";
  style: "line-art" | "duotone" | "filled";
  pending_forge: boolean;
  rationale?: string;
}>
```

**실행 방법:**
- API 호출: `POST /api/skills/chunk { project_id, plan_svg: true }`
- 서비스: `src/services/svg-planner.ts` 의 `planSvgNeedsForBeats`
- 라이브러리 커버리지 리포트도 응답에 포함

**후속 조치:**
- pending_forge 가 있으면 `npx tsx scripts/svg-forge.ts --project <pid>` 로 신규 에셋 일괄 생성
- 생성 완료 후 `svg-library.generated.tsx` 가 자동 컴파일되어 렌더러에서 즉시 사용 가능

**/vg-layout 연결:**
- visual_plan 에서 focal/support 의 시각 슬롯을 채울 때 beat.svg_needs.asset_id 를 1차 후보로 사용.
- 우선순위: SvgAsset(asset_id) > DevIcon > SvgIcon > SvgGraphic elements.

### 3b. Semantic Shape (NEW — pre-classify for layout)

Determine the spatial relationship this beat represents:

| semantic_shape | What relationship? |
|---------------|-------------------|
| `contrast` | Two things opposed |
| `flow` | Sequential progression |
| `cluster` | Multiple equal items |
| `metric` | One dominant number/stat |
| `hierarchy` | Center vs periphery |
| `transformation` | Input → output, cause → effect |
| `symbol` | Single concept/metaphor |
| `evidence` | Claim + proof |
| `summary` | Recap, collection |

### 3c. Merge Hint (NEW — critical for scene quality)

Should this beat stand alone or combine with neighbors?

| merge_hint | Meaning |
|-----------|---------|
| `standalone` | Strong enough for its own scene (DEFAULT — prefer this) |
| `merge_prev` | Only when it MUST be seen as part of the previous visual event |
| `merge_next` | Only when the next beat completes this beat's visual idea |
| `candidate_for_merge` | Weak alone but may work as rhythm break — layout decides |

**SPLIT-FIRST philosophy — merge is the exception, not the default:**

- Default for every beat is `standalone`
- Only mark `merge_prev`/`merge_next` when beats MUST be one visual event
- Beats shorter than 2 seconds: consider `candidate_for_merge` (NOT automatic merge)
- Short beats with a strong focal (a number, a name, a question): keep `standalone`
- Short beats that create rhythm breaks or pauses: keep `standalone`

**Beat length control (CRITICAL):**

| Target length | Guidance |
|--------------|---------|
| 2~6 seconds | Ideal — one visual intention |
| 7~9 seconds | Acceptable for comparison/evidence scenes |
| 10+ seconds | SPLIT into 2 beats unless genuinely one visual event |
| 12+ seconds | Almost always must be split |

**Split trigger — if a beat contains more than one of these, split it:**
- a claim + an explanation
- a number + a comparison
- a question + an answer
- an example + a conclusion

**A beat is not a paragraph. A beat is one visual intention.**

Do not merge beats merely because they are semantically related.
Merge only when they must be seen as one visual event.
Short beats are not a problem — they create rhythm.
Long beats are a problem — they flatten the screen into explanation.

### 3d. Visual Weight & Energy (NEW — rhythm control)

| Field | Values | Purpose |
|-------|--------|---------|
| `visual_weight` | `low` / `medium` / `high` | How much screen space this beat deserves |
| `energy` | `calm` / `neutral` / `sharp` / `explosive` | How dramatic the visual treatment should be |

**Guidelines:**
- Statistics, key numbers → `high` weight, `sharp` or `explosive` energy
- Definitions, context → `low` weight, `calm` energy
- Bold claims, quotes → `high` weight, `sharp` energy
- Transitions, pauses → `low` weight, `calm` energy
- Comparisons → `medium-high` weight, `sharp` energy
- Lists, clusters → `medium` weight, `neutral` energy

### 3e. Focal, Subline & Support Candidates (layout hints)

For each beat, identify:
- `focal_candidate`: The ONE thing that should dominate the screen (a number, a brand, a quote, a concept)
- `subline_candidate`: A readable sentence that gives context to the focal (NOT just a keyword — a sentence the viewer can READ on screen)
- `support_candidates`: 1~3 secondary elements that provide context

**CRITICAL: "one visual intention" does NOT mean "one keyword on screen."**
A good beat has a focal AND a readable subline. The screen must convey the core claim even without the subtitle bar.

For declaration/evidence/comparison/payoff beats, `subline_candidate` is MANDATORY.
Only pause/transition beats may omit it.

Example:
```
narration: "개발자의 92%가 AI 코딩 도구를 매일 쓰고 있고 전세계 코드의 41%를 AI가 만들고 있습니다"
focal_candidate: "92%"
subline_candidate: "미국 개발자 AI 도구 사용률"
support_candidates: ["41%", "AI 코딩 도구"]
```

Example 2:
```
narration: "바이브코딩은 코드를 직접 쓰지 않죠 AI에게 만들어줘라고 말로 시키는 방식이에요"
focal_candidate: "말로 시키는 코딩"
subline_candidate: "코드 없이 AI에게 말로 시키는 방식"
support_candidates: ["바이브코딩"]
```

### 3f. Neighbor Relationship (NEW — rhythm awareness)

For each beat, note its relationship to neighbors:

| Field | Values |
|-------|--------|
| `contrast_with_prev` | true if this beat contradicts or reverses the previous |
| `continues_motif` | true if this beat extends the same topic |
| `should_break_rhythm` | true if this beat should feel visually different from recent scenes |

### 3g. Legacy Fields (kept for compatibility)

These still exist but are SECONDARY to the new fields:

- `tone`: neutral, dramatic, questioning, confident, analytical, warning
- `evidence_type`: statement, statistic, quote, example, definition
- `emphasis_tokens`: keyword highlights (max 5) — for text rendering, NOT scene structure
- `density`: information density (1-5)
- `brand_keywords`: brand/product/company names
- `visual_keywords`: visualization keywords (for asset search)

## Step 3.5: 핵심 단어 이미지 추출

**`project.json`의 `asset_mode`를 먼저 확인한다.**

| asset_mode | 이 Step에서 하는 일 |
|-----------|-----------------|
| `devicon-only` | **이 Step 건너뜀**. WebSearch/다운로드 안 함. DevIcon 매칭만 visual_keywords에 기록 |
| `devicon+image` | WebSearch로 인물/브랜드/개념 PNG 다운로드. 아래 규칙 전체 적용 |
| `devicon+image+video` | 위와 동일 (배경 비디오는 Phase 3/vg-layout에서 처리) |
| `all` | 위와 동일 + input/ 각주 스크린샷 포함 |
| 없음(미설정) | `devicon+image`로 간주 |

**asset_mode가 `devicon-only`가 아닌 경우에만 아래 WebSearch 수집을 실행한다.**

**모든 beat의 나레이션에서 핵심 명사를 추출하고, 이미지가 필요한 단어는 WebSearch로 검색하여 PNG 다운로드.**

이 단계가 없으면 화면에 텍스트만 나오고, 인물/브랜드/개념이 시각적으로 빈다.

### 추출 대상 단어 유형

| 단어 유형 | 예시 | 검색 쿼리 패턴 | manifest type | 우선순위 |
|----------|------|-------------|--------------|---------|
| **인물명(실명)** | 안드레 카파시, 보리스, chenglou | `"{full name}" OR "{english name}" portrait headshot` | `person-photo` | **최우선** |
| **기업/브랜드** | 테슬라, OpenAI, 엔트로픽, Linear | `"{brand} logo transparent png"` | `brand-logo` | 높음 |
| **직업/역할** | 개발자, 창업자, 기획자, PM | `"{role} icon flat illustration"` | `role-icon` | 중간 |
| **개념/사물** | 코드, 돈, 속도, 슬롯머신, 화면 | `"{concept} icon transparent png"` | `concept-icon` | 중간 |
| **도구/제품** | CLI-Anything, 클로드코드 | 이미 screenshot 있으면 **스킵** | - | - |

### 인물 이미지 수집 강화 (CRITICAL)

**나레이션에 실명이 나오면 반드시 그 인물의 사진을 수집한다.**
인물 사진이 있으면 layout에서 원형 크롭으로 화면에 넣을 수 있고, 없으면 텍스트만 남는다.

| 인물 식별 기준 | 검색 전략 | 예시 |
|-------------|---------|------|
| 한국어 실명 | 영문명으로 변환하여 검색 | "카파시" → `"Andrej Karpathy" headshot` |
| 영문 실명 | 그대로 검색 | `"chenglou" developer portrait` |
| 직함+회사 함께 | 회사명 포함 검색 | `"Andrej Karpathy" OpenAI Tesla` |

**수집 후 manifest 등록:**
```json
{"keyword": "카파시", "path": "icons/{pid}/karpathy.png", "type": "person-photo", "source_beat": 7, "display_name": "안드레 카파시", "shape": "circle"}
```

**`shape: "circle"` 필드를 추가하면 vg-layout에서 자동으로 원형 크롭 적용.**

인물 사진은 정사각형에 가까운 이미지를 선택. 전신이 아닌 얼굴 중심.
Wikipedia, 공식 사이트, 컨퍼런스 발표 사진 등에서 수집.

### 수집 규칙

1. **beat당 최대 1개 이미지** — `focal_candidate` 기준으로 가장 시각적으로 강한 단어 선택
2. **이미 manifest.json에 있으면 스킵** — 중복 다운로드 금지
3. **투명 배경 우선** — 없으면 배경이 깔끔한 이미지 선택
4. **인물 사진은 정사각형** — `shape:"circle"` 용도 (원형 크롭)
5. **프로젝트당 15~30개 목표** — 너무 많으면 asset slideshow, 너무 적으면 텍스트 지옥
6. **WebSearch → WebFetch → curl 다운로드** 순서로 수집

### 저장 경로

```
public/icons/{projectId}/{keyword}.png
```

### manifest.json 등록 형식

```json
{"keyword": "카파시", "path": "icons/{pid}/karpathy.png", "type": "person-photo", "source_beat": 7}
{"keyword": "테슬라", "path": "icons/{pid}/tesla.png", "type": "brand-logo", "source_beat": 8}
{"keyword": "개발자", "path": "icons/{pid}/developer.png", "type": "role-icon", "source_beat": 9}
{"keyword": "슬롯머신", "path": "icons/{pid}/slot-machine.png", "type": "concept-icon", "source_beat": 15}
```

### 예시: news-0331에서 추출해야 할 이미지

| beat | 나레이션 핵심 | 추출 키워드 | 유형 |
|------|------------|----------|------|
| 7 | 카파시가 이름을 붙였죠 | 카파시 | person-photo |
| 8 | OpenAI 공동 창업, 테슬라 AI 총괄 | 테슬라 | brand-logo |
| 9 | 개발자의 92% | 개발자 | role-icon |
| 11 | 37조원 시장 | 돈/시장 | concept-icon |
| 15 | 슬롯머신 비유 | 슬롯머신 | concept-icon |
| 23 | 클로드코드 | 엔트로픽 | brand-logo |

---

## Step 4: Visual Asset Collection

**Purpose:** Provide layout with image assets — but assets serve structure, not replace it.

```
Storage: public/icons/{projectId}/{keyword}.png
```

### Asset types:

#### A. Brand Logos (required when brands appear)
- Search: `"{brand} logo png transparent"`
- manifest type: `"brand-logo"`

#### B. Concept Icons (selective — quality over quantity)
- Search: `"{concept} icon png"` or `"{concept} flat icon"`
- manifest type: `"concept-icon"`

#### C. Screenshots (user-provided via SRT footnotes)
- Handled by vg-new

### Collection rules:

**IMPORTANT: Assets serve structure. Structure does not serve assets.**

- Collect assets that SUPPORT scene relationships, not assets for decoration
- A brand logo is useful when the scene is ABOUT that brand (identity/comparison)
- A concept icon is useful when the scene needs a visual FOCAL that text can't provide
- Do NOT collect assets just because a keyword exists
- Target: 10~25 per project (quality over quantity)
- Skip if: keyword already in public/assets/manifest.json

### Anti-pattern warning:

If the model has many assets, it tends to:
- Put logo on left, text on right → safe Split → boring
- Fill every scene with icons → asset slideshow → boring

Assets ≠ scene structure. An asset-rich scene can still be structurally dead.

## Step 5: Generate beats.json

```json
{
  "beat_index": 0,
  "start_ms": 0,
  "end_ms": 7830,
  "start_frame": 0,
  "end_frame": 235,
  "text": "안녕하세요 바이브랩스의 랩장입니다 오늘 바이브 뉴스에서 다룰 이야기는 이렇습니다",

  "scene": {
    "role": "pause",
    "semantic_shape": "symbol",
    "merge_hint": "standalone",
    "visual_weight": "medium",
    "energy": "calm",
    "focal_candidate": "바이브 뉴스",
    "support_candidates": ["인사", "오늘의 소식"],
    "contrast_with_prev": false,
    "continues_motif": false,
    "should_break_rhythm": false
  },

  "semantic": {
    "tone": "confident",
    "evidence_type": "statement",
    "emphasis_tokens": ["바이브랩스"],
    "density": 1,
    "brand_keywords": [],
    "visual_keywords": []
  }
}
```

### Full Beat TypeScript interface:

```typescript
interface Beat {
  beat_index: number;
  start_ms: number;
  end_ms: number;
  start_frame: number;
  end_frame: number;
  text: string;

  // NEW: Scene directing metadata
  scene: {
    role: "declaration" | "comparison" | "escalation" | "evidence" | "sequence" | "payoff" | "pause" | "metaphor" | "cluster" | "support";
    semantic_shape: "contrast" | "flow" | "cluster" | "metric" | "hierarchy" | "transformation" | "symbol" | "evidence" | "summary";
    merge_hint: "standalone" | "merge_prev" | "merge_next" | "support_only";
    visual_weight: "low" | "medium" | "high";
    energy: "calm" | "neutral" | "sharp" | "explosive";
    focal_candidate: string | null;
    support_candidates: string[];
    contrast_with_prev: boolean;
    continues_motif: boolean;
    should_break_rhythm: boolean;
  };

  // Legacy: kept for compatibility
  semantic: {
    tone: string;
    evidence_type: string;
    emphasis_tokens: string[];
    density: number;
    brand_keywords: string[];
    visual_keywords: string[];
  };
}
```

## Step 6: Manifest Generation

```json
[
  {
    "keyword": "openai",
    "path": "icons/{projectId}/openai.png",
    "source_beat": 8,
    "type": "brand-logo"
  }
]
```

## Step 7: Update project.json

```json
{
  "status": "chunked",
  "keyword_images_count": 12
}
```

---

# QUALITY CHECKLIST

After generating beats.json, verify:

- [ ] No `support_only` beat is left as standalone (must be merged)
- [ ] Beats shorter than 2 seconds have `merge_prev` or `merge_next`
- [ ] At least 1 in 5 beats has `energy: "sharp"` or `"explosive"` (rhythm variety)
- [ ] At least 1 in 5 beats has `visual_weight: "high"` (hero scenes exist)
- [ ] `semantic_shape` is not the same for 3+ consecutive beats
- [ ] `scene_role` includes at least 4 different types across the video
- [ ] `focal_candidate` is filled for all `standalone` beats
- [ ] No beat has `scene_role: "support"` AND `merge_hint: "standalone"` (contradiction)

---

# DEPENDENCIES

- src/services/srt-parser.ts (parseSRT, SRTEntry)
- src/services/file-service.ts (readJSON, writeJSON, getProjectPath)
- public/assets/manifest.json (existing brand assets)
- WebSearch, WebFetch (asset collection)
