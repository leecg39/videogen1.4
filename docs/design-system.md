# newVideoGen Design System v2

> **"방망이 깎는 노인" 워크플로우용 디자인 헌장.**
> v1 (퍼플 네온) 전면 폐기. reference/SC 60장 + 유튜버 벤치마크 기반 재정의.
> 모든 씬의 모든 요소가 이 문서 한 장과 일치해야 한다.

---

## 0. 공식 스타일: **Exaggerated Minimalism**

*"Bold minimalism · oversized typography · high contrast · negative space · loud minimal · statement design"* (UI/UX Pro Max 2026-04-17 검증)

뉴스/에디토리얼/모션그래픽/럭셔리 브랜드에 최적화된 스타일. 우리 프로젝트의 공식 스타일.

## 0-1. 핵심 원칙 (6)

1. **프리픽스 prefab 조립 금지.** Kicker+focal+FooterCaption 샌드위치로 시작하지 마라. 빈 1920×1080 캔버스에서 narration 이 요구하는 요소만 추가.
2. **요소는 크게.** 본문 텍스트 < 36px 금지. 히어로 숫자 ≥ 120px. pill bar width ≥ 1000.
3. **절대좌표 + 커스텀 SVG 가 기본.** Stack/Grid 도 허용되지만 기본은 `Absolute` + `FreeText` + `SvgGraphic(elements[])`.
4. **색상은 mint 전용.** `#39FF14` 이외의 accent 사용 금지 (yellow/red 는 cost/warning narration 에서만).
5. **1 씬 = 1 메시지.** narration 을 1 문장으로 요약 가능해야. 2개 이상이면 씬 분할.
6. **Massive whitespace.** focal 이 차지하는 영역 **≤ 40%**. 나머지 60%+ 는 순수 검정(#000) 으로 완전 비움. "화면이 너무 비었다" 느낌이 들 때가 정답.

---

## 1. Color Tokens (mint brand fixed)

### Accent — mint green (브랜드 단일 고정)

| Token | Hex | 용도 |
|-------|-----|------|
| `accent` | `#39FF14` | 모든 강조 (숫자/mint bar/mint text/border/ring) |
| `accent-bright` | `#5EE88E` | 라이트 틴트 (hover/second-tier) |
| `accent-vivid` | `#A8F4C5` | 최상 밝기 (최고 강조, 드물게) |
| `accent-dim` | `#20B464` | 어두운 용 (보더, hover inactive) |
| `accent-glow` | `rgba(57,255,20,0.30)` | 글로우 이펙트 |
| `accent-tint` | `rgba(57,255,20,0.08)` | 카드 배경 tint |

### Background & Text

| Token | Hex | 용도 |
|-------|-----|------|
| `bg-base` | `#000000` | 메인 배경 (순수 검정, SC 레퍼런스 DNA) |
| `bg-elevated` | `#0D0A15` | 카드 배경 (미미한 elevated) |
| `bg-accent-subtle` | `rgba(57,255,20,0.06)` | mint-bordered 카드 내부 |
| `text-primary` | `#FFFFFF` | 헤드라인, 본문 |
| `text-secondary` | `rgba(255,255,255,0.75)` | 설명문 |
| `text-muted` | `rgba(255,255,255,0.55)` | Kicker, caption, 서브라벨 |
| `text-disabled` | `rgba(255,255,255,0.28)` | 미미한 부가정보 |
| `text-accent` | `#39FF14` | 강조 토큰, 숫자, 하이라이트 단어 |

### Cost / Warning (narration-driven only)

| Token | Hex | 용도 조건 |
|-------|-----|---------|
| `cost-yellow` | `#FBBF24` | narration 에 "비용/요금/부담" 명시된 씬만 |
| `warning-red` | `#EF4444` | narration 에 "위험/오류/실패" 명시된 씬만 |

### Border

| Token | Hex | 용도 |
|-------|-----|------|
| `border-default` | `rgba(255,255,255,0.08)` | 기본 구분선 |
| `border-accent` | `rgba(57,255,20,0.45)` | mint 카드 테두리 |
| `border-accent-strong` | `#39FF14` | focal card 테두리 (frame 145 식) |

**금지 색상**: `#9945FF` · `#A855F7` · `#C084FC` · 기타 purple/violet/blue 계열. theme.ts 의 legacy `T.accent = "#9945FF"` 는 폐기 대상 (Phase 다음에 mint 로 교체).

---

## 2. Typography Scale (reference SC + 유튜버 benchmark)

| 역할 | fontSize | weight | letterSpacing | 용도 |
|------|---------|--------|--------------|------|
| **wordmark** | **180~220px** | 900 | -0.05em | 브랜드/로고 (SC 2 "바이브랩스") |
| **hero-number** | **150~200px** | 800 | -0.04em | 거대 숫자 (SC 1 "10~30", frame 40 "900줄") |
| **display** | **84~120px** | 800 | -0.035em | 대형 헤드라인 (SC 8 "01") |
| **headline** | **48~72px** | 700 | -0.025em | 씬 제목 (SC 3 "AI 마케팅 · 앤트로픽 내부") |
| **body-large** | **36~44px** | 600~700 | -0.01em | 리스트 본문 (유튜버 frame 25 단계 5) |
| **body** | **28~32px** | 500 | 0 | 설명 텍스트 |
| **caption** | **22~26px** | 400 | 0.01em | 소형 부가설명 |
| **kicker-pill** | **18~22px** | 600 | 0.10em uppercase | pill badge |
| **subtitle-bar** | 42px | 700 | 0 | 하단 자막 (고정) |

**폰트 스택**:
- **한글**: `"Pretendard Variable", "Pretendard", sans-serif` (모든 한글 텍스트)
- **영문/숫자 (에디토리얼 믹스)**: `"Newsreader", "SF Pro Display", sans-serif` — 뉴스/저널리즘 mood 강화 (UI/UX Pro Max 추천)
- **모노 (terminal/code)**: `"JetBrains Mono", "SF Mono", monospace`

**CSS**:
```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700;800&family=Pretendard+Variable:wght@300..900&display=swap');
```

한글/영문 믹스 원칙: 한 요소 내에서 영문/숫자는 Newsreader, 한글은 Pretendard 자동 fallback. wordmark/hero number 는 영문이면 Newsreader weight 900, 한글이면 Pretendard weight 900.

### 타이포 강조 원칙

- **부분 강조는 색만 바꾼다**: `"코딩이라는 행위 자체는"` 흰색 + `"이미 해결된 문제"` mint (SC 8)
- **듀오톤 wordmark**: `"바이브"` muted + `"랩스"` accent (SC 2)
- **Underline 금지**. bold 도 가급적 자제 (모두 굵은 상태에서 bold 는 효과 없음)

### 에디토리얼 보강 (Pull Quote · Drop Cap)

텍스트 단독 씬(§5-2 quote/text-only 유형) 에 사용.

- **Pull Quote**: 큰따옴표 `"..."` 으로 감싼 인용문. fontSize 60~80px, lineHeight 1.2, 앞뒤에 mint accent 짧은 horizontal rule.
- **Drop Cap**: 첫 글자 2배 크게 (fontSize 160+, weight 900, 색상 mint), 두번째 글자부터 일반 크기로 흐르게. 영문/숫자에 한정 (한글은 Drop Cap 효과 약함).

```json
// Pull quote 예
{ "type": "FreeText", "data": { "text": "\u201C투명성 없는 토큰 사용량은 말이 안 된다\u201D" },
  "style": { "fontSize": 64, "fontWeight": 600, "letterSpacing": "-0.02em", "lineHeight": 1.25 } }
```

---

## 3. Spacing & Canvas

### Viewport 안전구역 (1920×1080)

```
┌─────────────────────────────────────────────┐
│  top padding: 140px                         │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │   content area: 1680 × 680            │  │
│  │   (side 120 · subtitle safe 140+)     │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│  bottom padding: 260px (subtitle 140 + 120) │
└─────────────────────────────────────────────┘
```

- **viewport margin**: top 140 / side 120 / bottom 260
- **block → block gap**: 48~80px (dense) / 100~160px (airy)
- **adjacent element**: 16~28px
- **icon ↔ text**: 16~24px

### 비대칭 배치 가이드

- 완전 center 는 지루함. **1/3 or 2/3 지점에 focal** 을 두는 식으로 비대칭.
- 단 **SC 1, SC 8, SC 11** 는 center 정렬 — hero number 단일 씬은 center 허용.
- Split 은 항상 비대칭 ratio: 1:2, 2:3, 3:4 (1:1 금지).

---

## 4. Component Vocabulary (Part-based, not Pattern-based)

> **핵심 변화**: prefab 컴포넌트(CompareBars/RingChart/etc.) 를 "문법" 으로 쓰지 말고, **재료** 로 써라. 재료만으론 부족하면 `SvgGraphic elements[]` 로 직접 그려라.

### 4-1. 텍스트 재료

| 재료 | 표현 방법 | 예 |
|-----|---------|---|
| hero wordmark | `FreeText` + fontSize 200 + duoton segments OR DualToneText | SC 2 "바이브랩스" |
| 거대 숫자 | `FreeText` fontSize 180 OR `ImpactStat size:xl` + 명시 fontSize | frame 40 "900줄" |
| 대형 헤드라인 (강조 단어 포함) | `Headline` with `emphasis: ["단어"]` | SC 8 "이미 해결된 문제" |
| 리스트 항목 (번호 원형 + 큰 본문) | `Absolute` 컨테이너 + 원형 SVG + `FreeText` 각각 | 유튜버 frame 25 |
| 서브 캡션 | `FreeText` fontSize 24 tone:muted | 전반 |
| pill badge | `Badge` with data.text — pill 스타일 자동 | SC 3 "지시서" |

### 4-2. 숫자/차트 재료

| 재료 | 표현 방법 |
|-----|---------|
| 가로 pill bar | `CompareBars` width:1200 OR `SvgGraphic` rect + rect (유튜버 frame 3) |
| 수직 pill bar | `VerticalBars` — **단 영상 전체에서 ≤ 2회** |
| 원형 차트 | `RingChart` size:280-320 stroke:16-20 |
| 3 ring triplet | `Grid columns:3` + `RingChart` 3개 (mint/yellow/red 구분) |
| 숫자 + suffix | `ImpactStat` data.value+suffix OR `FreeText` duo |
| 단일 값 vs 목표 (퍼센트) | `RingChart` (100 max) — Gauge/Bullet 대체 |

**Bar chart 필수 원칙** (UI/UX Pro Max 2026-04-17):
- **Sorted descending**: 가장 큰 값부터 정렬 (강조 bar 가 제일 위 or 제일 왼쪽)
- **Value labels on bars**: 각 bar 옆에 숫자 라벨 명시 (clarity)
- **Category grouped**: 같은 카테고리는 같은 색

### 4-3. 아이콘 재료 — 에셋 타입 결정트리

```
질문 1: 특정 앱/브랜드 로고인가?
  YES → DevIcon (318 라이브러리) circle:true
        + 다크색 로고 (AppleDark/Anthropic/OpenAI) 는 반드시 circle:true
        + 큰 rounded square 카드 배경 원할 시 FrameBox 래핑 (유튜버 frame 10)
  NO → 질문 2

질문 2: 개념 아이콘인가? (눈/문서/화살표/경고/체크/심장/방패/구름/번개/톱니)
  YES → SvgGraphic elements[] 로 path 직접 작성
        - viewBox 0 0 100 100 기준 + strokeWidth 4 + round cap/join
        - 예: 눈 아이콘 = ellipse + circle 중앙
        - 예: 문서 = rect + 3-4 lines
  NO → 질문 3

질문 3: 인물/실제 사진인가?
  YES → ImageAsset shape:circle
  NO → 질문 4

질문 4: 이모지가 narration 에 명시됐나?
  YES → FreeText with emoji character fontSize 100+
  NO → 아이콘이 정말 필요한가? 필요 없으면 넣지 마라.
```

### 4-4. 다이어그램 재료

| 다이어그램 타입 | 기본 구현 |
|---|---|
| Hub-satellite (SC 27 식) | `SvgGraphic elements[]` — 중앙 filled circle + 6개 stroke circle + 방사 accent line + 각 satellite 텍스트. CycleDiagram 은 **부적합** (filled center 미지원) |
| Flow (box → arrow → box) | `FlowDiagram variant:"box-chain"` OR `SvgGraphic` 으로 직접 (유튜버 frame 40) |
| Timeline (세로) | `AnimatedTimeline direction:"vertical"` + stepEnterAts |
| Timeline (가로) | `AnimatedTimeline direction:"horizontal"` |
| Split compare (mint vs dark) | `Absolute` + 2 `FrameBox` (하나는 border-accent-strong) + `BulletList` 각각 (유튜버 frame 145) |
| Diagram with arrows IN (frame 40) | `SvgGraphic` 으로 4 라벨 + 4 arrow + 중앙 박스 |

### 4-5. 커넥터 재료 (모두 SvgGraphic path)

```js
// 얇은 accent line
{ tag: "line", attrs: { x1, y1, x2, y2, strokeWidth: 2 }, themeColor: "accent" }
// 화살표 (V head)
{ tag: "path", attrs: { d: "M100 50 L200 50 M195 45 L200 50 L195 55", strokeWidth: 3 }, themeColor: "accent" }
// 점선 dotted
{ tag: "line", attrs: { strokeDasharray: "4 6" } }
```

---

## 5. Scene Composition Rules

### 5-1. Canvas-First Authoring Flow

```
1. narration 을 1 문장으로 요약 (이 씬의 메시지는?)
2. 메시지를 표현할 ONE 시각 메타포 결정 (숫자? 대비? 흐름? 리스트?)
3. reference/SC 중 가장 근접한 1~2장 재확인 (구도 복사 금지 — 기법만)
4. 빈 1920×1080 에 focal 1개 배치 (center 40% or third-line)
5. 지지 요소 0~2개 (narration 이 요구하면만)
6. Kicker/Footer 는 narration 이 요구할 때만 (BG 메타데이터 있을 때)
```

### 5-2. 씬 유형 (narration 의도별)

| 의도 | 구성 | 예 |
|------|------|---|
| **hero intro** | wordmark + 주간 bar | SC 1, scene-0 |
| **metric punch** | hero number + 1 줄 marker | SC 8, scene-8 (19분) |
| **contrast** | split 카드 2개 (mint vs dark) | SC 3, scene-72 |
| **listing** | 번호 원 + 큰 본문 반복 | 유튜버 frame 25 |
| **flow** | 3~5 박스 + 화살표 | 유튜버 frame 40 |
| **quote / text-only** | 거대 텍스트 + 1~2 서브문장 | 유튜버 frame 120 |
| **case study** | 인물 원 + 제목 + 숫자 + 짧은 리스트 | SC 45 "소크라테스" |
| **hub-satellite** | 중앙 filled + 6~8 satellite | SC 27 |
| **pause / warning** | 아이콘 1개 + 배지 + 자막 | SC 19 |
| **chapter header** | 큰 pill + 큰 제목 | SC 32 "뉴스 1" |

씬 유형은 **narration 내용 판단**. pattern_ref 로 선결정 금지.

---

## 6. Motion Presets

| Preset | 용도 |
|--------|------|
| `fadeUp` | 텍스트 기본 등장 (opacity + translateY 24→0) |
| `popNumber` | 스프링 스케일 (숫자, 큰 아이콘) |
| `scaleIn` | 부드러운 scale 1.3→1.0 |
| `drawMode` | SVG path 그려지는 효과 (SvgGraphic) |
| `staggerChildren` | 리스트 순차 (delay 10~20f) |
| `slideSplit` | 좌우 슬라이드 |

**규칙**: 
- 한 씬에 동일 preset 3회 초과 금지 (섞어라)
- Kicker 는 entrance motion 금지 (정적)
- emphasis (loop) 는 1 씬당 1 요소만
- enterAt 자막 싱크 (`(subtitle.startTime - scene.start_ms/1000) * 30`)

---

## 7. Absolute Primitives Reference

`src/remotion/nodes/freeform.tsx`:

### FreeText

```json
{
  "type": "FreeText",
  "data": { "text": "10 ~ 30 개", "tone": "accent" },
  "style": { "fontSize": 180, "fontWeight": 800, "letterSpacing": "-0.04em" },
  "motion": { "preset": "popNumber", "enterAt": 15, "duration": 24 }
}
```

- tone: `accent` | `muted` | `white` | `danger` | `warning` | custom hex
- style.fontSize/fontWeight/letterSpacing/lineHeight/textAlign 전부 허용
- 빈 text + 명시 width/height → 색 블록 (spacer/tile)

### Absolute 컨테이너

```json
{
  "type": "Absolute",
  "layout": { "width": 1680, "height": 680 },
  "children": [
    { "type": "FreeText", "style": { "position": "absolute", "left": 200, "top": 100, ... } },
    { "type": "SvgGraphic", "style": { "position": "absolute", "left": 600, "top": 300 }, ... }
  ]
}
```

자식은 `style.left/top/right/bottom/width/height/transform` 로 자유 배치. position:absolute 자동 적용.

### SvgGraphic (커스텀 그리기)

```json
{
  "type": "SvgGraphic",
  "data": {
    "viewBox": "0 0 800 400",
    "width": 1200,
    "height": 600,
    "elements": [
      { "tag": "circle", "attrs": { "cx": 400, "cy": 200, "r": 80, "fill": "currentColor" }, "themeColor": "accent", "staggerIndex": 0 },
      { "tag": "path", "attrs": { "d": "M...", "strokeWidth": 4, "strokeLinecap": "round", "fill": "none" }, "themeColor": "accent", "staggerIndex": 1 }
    ],
    "drawMode": true,
    "drawDuration": 24,
    "staggerDelay": 5
  }
}
```

themeColor: `accent` (mint) · `muted` · `primary`  
strokeWidth: ≥ 3 메인, ≥ 2 보조  
strokeLinecap/Linejoin: `"round"` 강제.

---

## 8. HARD RULES (자동 가드 연계)

| 규칙 | 가드 | 위반 시 |
|------|-----|--------|
| bar-family 합산 (CompareBars + VerticalBars + ProgressBar) | `validate-fidelity.js` | > 8 시 exit 1 |
| SvgGraphic signature 중복 3+ | `validate-node-uniqueness.js` | 중복 3+ exit 1 |
| mint 외 accent > 20% | `validate-fidelity.js` | exit 1 |
| 한 씬 내 동일 텍스트 2+ | `validate-label-quality.js` | 1개 씬이라도 exit 1 |
| 기능어 라벨 (그리고/물론/그냥) | `validate-label-quality.js` | 5+ 씬 exit 1 |
| warning-triangle narration 매치 | `validate-node-uniqueness.js` | 비매치 2+ exit 1 |
| DevIcon dark-color + circle:false | `validate-fidelity.js` | **HARD FAIL (승격)** |
| docs/design-system.md ↔ theme.ts sync | `validate-design-sync.js` (NEW) | 불일치 exit 1 |

---

## 9. 적용 파일

| 파일 | 역할 |
|------|------|
| `docs/design-system.md` (본 문서) | 유일한 진실 소스 |
| `src/remotion/common/theme.ts` | 토큰 상수 (본 문서와 sync) |
| `src/remotion/nodes/freeform.tsx` | FreeText/Absolute primitive |
| `src/remotion/nodes/diversity-primitives.tsx` | BrandSatellite/VerticalBars/DiagonalFlow |
| `src/remotion/nodes/registry.ts` | 노드 타입 등록 |
| `.claude/skills/vg-layout/SKILL.md` | authoring 플레이북 (본 문서 참조) |
| `scripts/validate-*.js` | 가드 (본 문서 규칙 강제) |

---

## 10. 금지 목록 (NEVER)

- Kicker+focal+FooterCaption 샌드위치 기본 사용 (narration 이 요구할 때만)
- 같은 shape hash 3+ 씬 반복
- fontSize < 24px (fine print 제외)
- CompareBars items < 3 (VerticalBars/DataTable 로 교체)
- SvgGraphic warning triangle 을 narration 경고 키워드 없는 씬에 사용
- mint accent 비율 < 60%
- 퍼플/바이올렛/블루 (`#A855F7`, `#9945FF`, `#C084FC`) 사용
- `T.accent = "#9945FF"` legacy 토큰 참조 (mint 로 교체 중)
- prefab (Kicker/Headline/BulletList) 만으로 씬 구성 — **SvgGraphic + FreeText + Absolute** 를 기본 재료로
- scene.stack_root 에 같은 template 구조 3+ 씬 반복

---

## 11. 레퍼런스 참조 목록

SC 60장 각자가 특정 구성 기법의 예. **이미지 복사 아닌 기법 학습** 에 사용.

| SC 번호 | 핵심 기법 |
|---|---|
| SC 1 | hero number + 주간 7 bar + 마지막 accent |
| SC 2 | 듀오톤 wordmark + 서브 mint marker |
| SC 3 | 2-card split (✗ vs ✓) + bullet list |
| SC 5 | 번호 + 거대 헤드라인 + 2 pill bar (100/100) |
| SC 8 | 경고 삼각형 + pill badge + 서브문장 |
| SC 11 | center Ring 100% + 3 bullet |
| SC 16 | 3 박스 row + accent arrow up + 서브라벨 |
| SC 19 | document stroke + 큰 text + 3 인용 리스트 |
| SC 27 | Hub-satellite (filled center + 6 stroke sat) |
| SC 30 | 3 Ring triplet (mint/yellow/red) |
| SC 45 | 인물 흉상 + 타임라인 점 + 거대 숫자 |
| SC 52 | 3 브랜드 원형 + 삼각형 연결 |
| SC 60 | 수직 2-bar (mint vs red) 대비 |

다른 SC 번호는 해당 씬 authoring 시 개별 Read 로 확인.

---


*버전: v2.0 — 2026-04-17 재작성. v1 (퍼플 네온) 폐기.*
