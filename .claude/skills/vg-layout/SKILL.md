---
name: vg-layout
description: 씬 레이아웃 엔진. R11 이후 기본값은 src/remotion/custom/scene-NN.tsx TSX 컴포넌트 직접 작성 (scene-grammar v1.4 원칙 A). DSL stack_root 는 3조건 동시 만족 시만 허용되는 좁은 예외.
---

# /vg-layout — Scene Layout Engine (TSX 기본값 · R11 원칙 A)

> **🔥 v1.4 기본값 선언 (2026-04-19 R11)**
>
> **씬 작성의 기본값은 `src/remotion/custom/scene-NN.tsx` TSX 컴포넌트다. scenes-v2.json 의 stack_root 는 TSX wrapper 한 개만 갖는다.**
> DSL (stack_root JSON 트리) 은 3조건 (`data_only` + `pattern_unique` + `no_emotion`) 동시 만족 시만 허용되는 **좁은 예외** — 실질 사용률 0~5%.
>
> R9 자동 분석 결과: DSL 49 씬 중 **47 씬 (95.9%) TSX 전환 권고**. stack_root JSON 트리를 직접 작성하지 않는다.

> **🚪 PRE-WRITE GATE**
>
> authoring 한 줄이라도 쓰기 전에 **반드시** 실행:
> ```bash
> node scripts/validate-preflight.js {projectId} --skill=vg-layout
> ```
> exit 0 이 아니면 authoring 금지. design-sync/SRT/프로젝트 메타데이터 부재 중 하나라도 해당되면 postprocess 에서 reject → 재설계 낭비. preflight 가 그 낭비 루프를 시작 단계에서 차단.

## Invoke

```
/vg-layout {projectId}
/vg-layout {projectId} --scene 3
```

---

## 🟡 SAFE ZONE — 콘텐츠 프레임 (2026-04-20 신설 · ABSOLUTE)

> **문제:** 1920×1080 canvas 를 가장자리까지 꽉 채우면 시청자가 숨이 막힌다. TV safe area / 시네마 letterbox 관점에서 콘텐츠는 **중앙 안쪽**으로 모여야 의도적인 여백과 호흡이 생긴다.
>
> **룰:** 모든 씬의 **콘텐츠 (텍스트/차트/아이콘/카드)** 는 아래 SAFE ZONE 안에서만 배치한다. 배경 비디오·그라데이션·글로우·장식 선은 예외로 canvas 전체 허용.

### 치수 표 (1920×1080 기준)

| 영역 | 범위 (px) | 설명 |
|------|----------|------|
| **canvas** | 0,0 ~ 1920,1080 | 배경·앰비언트 전용 (OffthreadVideo / gradient / glow) |
| **OUTER MARGIN** | 160 좌 / 160 우 / 120 상 / 140 하 | 콘텐츠 배치 금지 영역 |
| **SAFE ZONE (콘텐츠 프레임)** | x ∈ [160, 1760] / y ∈ [120, 940] → **1600×820** | 모든 콘텐츠 노드는 이 안 |
| **SUBTITLE RESERVE** | y ∈ [940, 1060] | 자막 바 예약 — 콘텐츠 배치 금지 |
| **CENTER CORE (focal hot zone)** | x ∈ [320, 1600] / y ∈ [240, 820] → **1280×580** | focal 요소 중심은 이 안에 둬야 자연스러움 |

### TSX 에 박아 쓰는 상수

```tsx
// src/remotion/custom/scene-NN.tsx 상단에 선언 (또는 공통 헬퍼로 분리 가능)
const SAFE_L = 160;      // 좌측 콘텐츠 시작
const SAFE_R = 160;      // 우측 여백
const SAFE_T = 120;      // 상단 여백
const SAFE_B = 140;      // 하단 여백 (자막바 + 20px 마진)
const SAFE_W = 1920 - SAFE_L - SAFE_R; // 1600
const SAFE_H = 1080 - SAFE_T - SAFE_B; // 820
```

**배치 원칙:**
- 텍스트/카드/차트/아이콘의 `position: absolute` 는 `left ≥ SAFE_L`, `right ≥ SAFE_R`, `top ≥ SAFE_T`, `bottom ≥ SAFE_B` 지키기.
- focal 요소 (거대 숫자/헤드라인/핵심 차트) 는 CENTER CORE (x ∈ [320, 1600], y ∈ [240, 820]) 안쪽에 중심이 놓이도록.
- 배경 gradient / OffthreadVideo / AccentGlow / 장식 라인 은 전체 canvas 허용 (SAFE ZONE 무시 OK).

### 예시 스켈레톤 (safe zone 반영)

```tsx
<AbsoluteFill style={{ background: "#060608" }}>
  {/* 1) 배경 — canvas 전체 허용 */}
  <OffthreadVideo src={...} style={{ position: "absolute", inset: 0, ... }} volume={0} />
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(...)" }} />

  {/* 2) 콘텐츠 — SAFE ZONE 안쪽 */}
  <div style={{ position: "absolute", top: 120, left: 160, right: 160 }}>
    <Kicker />
  </div>
  <div style={{ position: "absolute", top: 300, left: 320, right: 320 /* CENTER CORE */ }}>
    <HeroNumber />
  </div>
  <div style={{ position: "absolute", bottom: 160, left: 160, right: 160 /* 자막바 위 마진 20px */ }}>
    <FooterCaption />
  </div>
</AbsoluteFill>
```

### ABSOLUTE 금지 항목

| # | 금지 | 이유 |
|---|------|------|
| 1 | `left < 140` 또는 `right < 140` 으로 **텍스트/차트 배치** | 좌우 가장자리 붙으면 숨막힘 |
| 2 | `top < 100` 으로 상단 콘텐츠 배치 | 제목이 화면 꼭대기에 딱 붙으면 디자인 미흡 |
| 3 | `bottom < 140` 으로 콘텐츠 배치 | 자막바 침범 또는 하단 꽉참 |
| 4 | `fontSize ≥ 240` + `left: 0` (bleed focal) | 히어로 숫자여도 최소 좌측 120px 여백 |
| 5 | 콘텐츠가 canvas 의 **90% 이상 면적** 차지 | 여백 없음 = 디자인 실패 |

### 의도적 예외 (허용되는 bleed)

- **배경 요소**: OffthreadVideo, AccentGlow, gradient overlay → canvas 전체 자유
- **엣지 스트라이프 / 디바이더 바**: 좌측 수직 mint 라인 (scene-00 스타일) → 120px 바깥 OK
- **장식 SVG**: 번개/파티클/모션 라인 → safe zone 무시 가능
- **focal 숫자 bleed**: 250px+ 거대 숫자가 의도적으로 SAFE_L 근처까지 오는 건 OK (단, 기본 여백 100px+ 유지)

### 검증 (권장)

```bash
# Phase A PNG 생성 후 눈으로 확인
bash scripts/render-single-scene.sh {pid} N /tmp/safe-check.png
# → PNG Read → 아래 체크리스트 눈으로 검수
```

**자가 검증 체크리스트 (매 씬):**
- [ ] 좌우 가장자리에 텍스트/차트가 "붙어" 보이지 않는가? (120px 이상 여백)
- [ ] focal 요소가 화면 중앙 쪽에 중심을 두었는가? (좌우 치우침 의도적일 때만 허용)
- [ ] 자막바 영역 (y=940~1060) 에 콘텐츠가 침범하지 않는가?
- [ ] 전체 콘텐츠 면적이 canvas 의 70% 이하인가? (숨 쉴 공간)

### 왜 이 규칙인가 (2026-04-20 회고)

- **증상:** 12 씬 authoring 후 프레임 샘플링해보니 좌우 꽉 찬 레이아웃들이 대부분. 시청자가 "정보가 너무 빽빽하다" 느낌.
- **원인:** 자유 JSX 배치는 1920×1080 전체를 쓰고 싶은 본능이 있음. 제한이 없으면 자꾸 가장자리까지 밀어붙이게 됨.
- **원칙:** reference/SC *.png 61장은 전부 명시적 여백 + 중앙 정렬. 이 DNA 를 강제.

### 기존 씬 영향

- 기존 TSX 56 씬 대부분 left:140 / right:140 권장치 준수 → 영향 적음.
- 일부 씬 (left:100, right:110 등) 은 다음 authoring 기회에 safe zone 으로 교정.
- **이 규칙은 "권장"이 아니라 "기본값"** — 새 씬 authoring 시 반드시 적용.

---

## 🔧 RENDER NOTE — TransitionSeries 말미 블랙 이슈 (2026-04-20)

**알려진 Remotion 동작:** `TransitionSeries` 안에 transitions 가 많을 때, 비디오 끝 쪽에 누적 transition frames 만큼 블랙 구간이 남는다. 12 씬 + 11 transitions(20f each) = 약 7.3초 블랙.

**우회책:**
- preview/부분 렌더: scenes[].transition = `{ type: "none", durationFrames: 0 }` 로 전부 덮어쓰기 (시각 전환 손실, outro 블랙 제거).
- full 렌더: 마지막 씬을 TSX 로 작성 + 영상 피날레 시각 효과를 스스로 마무리하게 디자인. scene-grammar v1.2 에서 "엔딩 5프레임 블랙 → scene-77 TSX 전환으로 해소" 와 동일 방식.
- 장기 해결: `src/remotion/Root.tsx` 의 `calculateDuration` 에서 `(numScenes - 1) * DEFAULT_TRANSITION_FRAMES` 차감 — **전역 영향**이므로 별도 세션에서 검토.

---

## 0. 표준 워크플로우 (TSX 기본 · 8단계)

**각 씬마다 아래 순서대로 진행한다. 금지 구문: mass realizer / pattern-based builder / batch 스크립트.**

```
Step 1  data/{pid}/scene-plan.json + scenes-v2.json Read
        → 각 씬 narration 읽기. visual_plan.pattern_ref 는 참고만 (R11 이후 힌트로 격하)

Step 2  reference/SC *.png (61장) 를 이미지로 Read — Visual DNA 확인

Step 3  씬 하나씩 — 감정/핵심 메시지 추출
        → "이 씬 관람자가 느껴야 할 것 한 줄"을 먼저 결정

Step 4  src/remotion/custom/scene-NN.tsx Write
        → Remotion primitives 사용:
          - AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing
          - React.FC<NodeProps>, frame / durationFrames 활용
        → 고유 JSX 트리 + inline CSS + 프레임 기반 모션
        → DSL 노드 재사용 필요 시 원칙 B adapter:
          import { D } from "./_dsl";
          <D type="ImpactStat" data={{value, label}} frame={frame} durationFrames={durationFrames} />

Step 5  src/remotion/custom/registry.ts 에 컴포넌트 등록
        → import { SceneNN } from "./scene-NN";
        → "scene-NN": SceneNN 추가

Step 6  data/{pid}/scenes-v2.json 의 해당 씬 stack_root 를 TSX wrapper 로 교체
        {
          "type": "SceneRoot",
          "layout": { "padding": 0, "gap": 0 },
          "style": { "background": "transparent" },
          "children": [
            { "type": "TSX",
              "data": { "component": "scene-NN" },
              "layout": { "width": "100%", "height": "100%" } }
          ]
        }

Step 7  bash scripts/render-single-scene.sh {pid} N /tmp/scene-N.png
        → 단일 씬 격리 렌더 (TransitionSeries subset, half-frame still)
        → Read 툴로 이미지 확인 — 육안 검수 필수

Step 8  node scripts/sync-render-props.js data/{pid}/scenes-v2.json
        → render-props-v2.json 자동 동기화
        → bash scripts/postprocess.sh data/{pid}/scenes-v2.json
           • ⓪-pre   prepare-dsl-subset (원칙 A 분기)
           • ⓪-tsx1  validate-tsx-structural-signature (P4 AST)
           • ⓪-tsx2  validate-tsx-video-narration-match (P10 재정의)
           • ⓪-tsx3  validate-tsx-text-dedup (P3 AST)
           • ⓪-dsl   validate-dsl-rationale strict
        → pre-commit hook (`.git/hooks/pre-commit`) 이 DSL rationale 미충족 시 commit 차단
```

**씬 하나당 Step 3~7 을 완주한 뒤 다음 씬. 절대 병렬/일괄 생성 금지.**

---

## 1. TSX 컴포넌트 스켈레톤 (복사용)

```tsx
// src/remotion/custom/scene-NN.tsx — "{한 줄 의도 / 감정 / 메시지}"
// 원칙 A: TSX 기본값. 원칙 B: DSL 노드 필요 시 <D type="..." /> 로 import.
import React from "react";
import { AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig, Easing } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
// DSL 노드 필요할 때만:
// import { D } from "./_dsl";

export const SceneNN: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  const { fps } = useVideoConfig();

  // 1) 모션: interpolate / spring 기반
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const heroSlide = spring({ frame, fps, config: { damping: 16, stiffness: 100 }, from: -60, to: 0 });

  return (
    <AbsoluteFill style={{ background: "#0b0810", fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", overflow: "hidden" }}>
      {/* 고유 JSX 트리 — 절대 위치/크기로 직접 배치 */}
      {/* 배경 비디오가 맞는 씬: */}
      {/* <OffthreadVideo src={staticFile("videos/{pid}/keyword.mp4")} style={{...}} volume={0} /> */}

      {/* DSL 노드 재사용 예시 (원칙 B): */}
      {/* <div style={{ position: "absolute", top: 240, left: 140 }}>
        <D type="ImpactStat" data={{ value: "31", suffix: "B", label: "파라미터" }} frame={frame} durationFrames={durationFrames} />
      </div> */}
    </AbsoluteFill>
  );
};
```

**참고 예시 (리포 내 실제 파일 Read 권장):**

| 파일 | 내용 | 활용 포인트 |
|------|------|-----------|
| `src/remotion/custom/scene-03.tsx` | 뉴스 헤드라인 + 타자기 + 터미널 | OffthreadVideo 배경 + interpolate 타자 애니 |
| `src/remotion/custom/scene-22.tsx` | 데이터 중심 정보 씬 | interpolate 기반 바 차트 · 튀지 않는 구성 |
| `src/remotion/custom/scene-26.tsx` | 원칙 B — DSL ImpactStat import | `<D type="ImpactStat" />` 조합 패턴 |
| `src/remotion/custom/scene-32.tsx` | 원칙 B — CompareBars + Badge + Kicker | 다중 DSL 노드 배치 |
| `src/remotion/custom/scene-54.tsx` | 원칙 B — BulletList × 2 | 좌우 비교 + DSL 리스트 |
| `src/remotion/custom/scene-77.tsx` | 엔딩 씬 순수 TSX | 블랙 프레임 방지 + 피날레 모션 |

---

## 2. 원칙 B — `_dsl.tsx` adapter 사용법

`src/remotion/custom/_dsl.tsx` 는 74 노드 자산을 TSX 내부에서 React 컴포넌트처럼 재사용하는 adapter. 노드 다이어트 전까지 영구 보존.

**시그니처:**

```tsx
interface DProps {
  type: string;                        // NODE_REGISTRY 에 등록된 타입명
  data?: Record<string, unknown>;      // 노드 data 필드
  layout?: Record<string, unknown>;    // 노드 layout 필드 (선택)
  style?: Record<string, unknown>;     // 노드 style 필드 (선택)
  motion?: Record<string, unknown>;    // 노드 motion 필드 (선택)
  frame: number;                       // 필수
  durationFrames: number;              // 필수
}
```

**사용 시점:** 정보 밀집형 데이터 표현 (차트/통계/불릿). TSX JSX 안에서 자유 배치. 4~5개까지 혼합 가능.

**실전 예시 (scene-26 에서 발췌):**

```tsx
<div style={{ position: "absolute", top: 240, left: 140, width: 700 }}>
  <D
    type="ImpactStat"
    data={{ value: "31", suffix: "B", label: "파라미터 · parameters", accentColor: "#7dffb0" }}
    frame={frame}
    durationFrames={durationFrames}
  />
</div>
```

**허용 노드 타입:** `NODE_REGISTRY` (`src/remotion/nodes/registry.ts`) 에 export 된 타입 전부. 주요 타입 — ImpactStat, CompareBars, BulletList, Kicker, Headline, Badge, FooterCaption, RichText, Pill, DevIcon, SvgAsset, RingChart, ProgressBar, DataTable, FlowDiagram, CycleDiagram 등.

**metric 예시 (9+ 타입 교차 검증 완료):** scene-13 (Kicker+Headline+RichText), scene-26 (ImpactStat), scene-32 (CompareBars+Badge+Kicker), scene-44 (Pill+FooterCaption), scene-54 (BulletList×2).

---

## 3. DSL 예외 허용 3조건 (원칙 A strict)

TSX 로 작성하지 않고 stack_root JSON 트리로 DSL realize 를 허용하는 조건 — **3개 동시 만족 필수**:

| 조건 | 의미 | 판별 기준 |
|------|------|----------|
| `data_only` | narration 이 순수 데이터 제시 의도 | "표를 보겠습니다" / "지표 세 개" 같은 중립적 전달. 감정 비트 없음. |
| `pattern_unique` | 해당 DSL pattern 이 프로젝트 내 다른 씬에서 미사용 | `pattern_ref` 가 같은 프로젝트 씬에서 반복되지 않음. |
| `no_emotion` | 감정 비트 없음 (승부/대비/전환/엔딩/경고/환호) | narration 에 강조/분노/찬양/비교 어휘 없음. |

**3조건 만족 DSL 씬은 `scenes-v2.json[i]._dsl_rationale` 에 각 조건 근거를 **10자 이상** 명시:**

```json
{
  "id": "scene-N",
  "_dsl_rationale": {
    "data_only": "narration 이 수치 3개 나열 외 서술 없음",
    "pattern_unique": "P14_compact_table 프로젝트 내 첫 사용",
    "no_emotion": "승부/대비/경고 어휘 0개, 중립 전달"
  },
  "stack_root": { ... }
}
```

**`⓪-dsl validate-dsl-rationale.js` 가 strict 검증 — 형식적 기입 ("재검토 필요" / "N회 반복" / 10자 미만) 은 exit 2.**

**R9 자동 분석 결과: DSL 49 씬 중 47 (95.9%) TSX 전환 권고.** 실질적 DSL 허용률은 0~2%. 애매하면 TSX 로 작성한다 — **기본값이 TSX 이기 때문에 예외를 만들 이유를 증명해야 DSL 사용 가능.**

---

## 4. 🚫 금지 사항 (ABSOLUTE · Anti-pattern)

| # | 금지 행위 | 이유 |
|---|---------|------|
| 1 | `scenes-v2.json` 에 **stack_root JSON 트리 직접 작성** (DSL 방식) | 원칙 A 위반. 3조건 미충족 시 pre-commit hook 차단. |
| 2 | Python/JS 스크립트로 **다수 씬 stack_root 일괄 생성 (mass realizer)** | `buildP01`/`buildP04` 같은 템플릿 함수 사용 시 구도 반복 + narration mismatch 발생 (2026-04-17 / 04-18 사고). |
| 3 | Python/JS 스크립트로 **다수 TSX 파일 일괄 생성** | 동일한 사고 재발. 씬은 narration 단위 authoring. |
| 4 | `pattern_ref` 기반 자동 realize | R11 이후 pattern_ref 는 힌트로만 사용. 자동 realize 가드 폐기. |
| 5 | 74 노드를 **TSX 밖에서** 조립 | 원칙 B 위반. stack_root JSON 에 노드 배치 대신 TSX 안에서 `<D type="..."/>` 사용. |
| 6 | `src/remotion/custom/scene-NN.tsx` Write 후 `registry.ts` 미등록 | `tsx-escape.tsx` fallback 이 "Custom component not registered" 메시지 출력. |
| 7 | scenes-v2.json 편집 후 `sync-render-props.js` 미실행 | render-props-v2.json 이 stale → mp4 에 반영 안 됨 (2026-04-17 사고). |
| 8 | `<OffthreadVideo src>` 가 narration 과 무관한 mp4 | `⓪-tsx2 validate-tsx-video-narration-match` 차단. |
| 9 | TSX JSX 내부 문자열이 SRT 자막과 동일 | `⓪-tsx3 validate-tsx-text-dedup` 차단. Levenshtein ≤ 0.6 유지 (요약·은유·추상화). |
| 10 | 직전 3 씬과 JSX tag signature 가 동일 (trio 쌍둥이) | `⓪-tsx1 validate-tsx-structural-signature` cluster > 2 → exit 1. |
| 11 | InsightTile 사용 | 빈 회색 사각형 렌더 버그. |
| 12 | `Math.random` / `Date.now` / `setTimeout` / `new Date` | Remotion frame-purity 파괴. `validate-determinism.js` 차단. |

---

## 5. 🔴 DUAL-FILE 구조 — 절대 헷갈리지 마라 (CRITICAL)

프로젝트는 **두 개의 파일**을 가진다. 어느 파일에 작업하는지 매 edit 마다 확인.

| 파일 | 역할 | 누가 쓰나 | 누가 읽나 |
|------|------|---------|---------|
| `data/{pid}/scenes-v2.json` | **Source of truth (authoring 입력)** | `/vg-layout` (TSX wrapper 삽입) · `postprocess.sh` · `/api/skills/scene` | postprocess validator · `sync-render-props.js` |
| `data/{pid}/render-props-v2.json` | **Remotion 런타임 입력 (파생 산출물)** | **오직 `sync-render-props.js` 만** | **Remotion renderer** (Composition.tsx) |
| `src/remotion/custom/scene-NN.tsx` | **TSX 컴포넌트 본체 (R11 기본값)** | `/vg-layout` (씬별 Write) | `registry.ts` 로 SceneRenderer 가 lookup |
| `src/remotion/custom/registry.ts` | **TSX 컴포넌트 등록 테이블** | `/vg-layout` (추가 시 Edit) | SceneRenderer 가 `data.component` 키로 조회 |

**핵심 규칙:**
1. **Authoring 은 `src/remotion/custom/scene-NN.tsx` 에서 — scenes-v2.json 에는 TSX wrapper 만 넣는다.**
2. **`render-props-v2.json` 은 절대 직접 손대지 마라.** 자동 파생물이다.
3. **렌더 전 반드시 `scripts/sync-render-props.js` 를 돌려라.** `postprocess.sh` ⑧ 단계에 이미 포함.
4. **TSX 파일 Write 후 반드시 registry.ts 에 추가.** 미등록 시 fallback 메시지 출력.

**과거 사고 (2026-04-17):** `scenes-v2.json` 에만 80+ edit 했지만 sync 누락으로 `render-props-v2.json` 이 1차 재설계 버전에 멈춰 있었음. 사용자가 "뭐가 달라진거야" 지적하고서야 발견.

---

## 6. 🟢 REFERENCE FIDELITY — Visual DNA (ABSOLUTE)

`reference/SC *.png` 60장은 **이 프로젝트의 시각 DNA 단일 원천**. TSX 에서도 유효. 스타일이 여기서 벗어나면 HARD FAIL.

**필수 Read:** `/vg-layout` 시작 시 `reference/SC 1.png` ~ `reference/SC 61.png` 중 최소 10장을 **이미지로 Read** 하여 톤·여백·비대칭·타이포 크기·색 균형을 내면화.

**자동 가드 (`scripts/validate-fidelity.js`, postprocess ⑥-c 에서 자동 실행):**
| 규칙 | 한계 |
|------|------|
| 비-mint accent 비율 | ≤ 40% (mint `#39FF14` 가 기본) |
| mega-number focal 폰트 | ≥ 120px (SC1/5/12 DNA) |
| DARK_ICONS 비-circle 사용 (github/openai/vercel 등) | circle:true 적용 필수 |
| giant_wordmark typo 폰트 | ≥ 150px |

**색상 기준:** accent = `#39FF14` mint (palette 0 고정). yellow/red 는 비용·경고 의미에만. 시각 변주 목적 사용 금지.

---

## 7. 🎬 Background Video Clip (TSX 내 OffthreadVideo)

> **문제:** 2026-04-19 감사 결과 78 씬 stack_root 에 VideoClip 노드 0건. `public/videos/{pid}/` 에 53개 mp4 있는데 할당 0건. 원인: `AssetMode` 타입 "video" 누락 + VideoClip 사용 지침 부재.
>
> **v1.4 해법:** TSX 기본값 전환 후 **씬 TSX 내에서 `<OffthreadVideo>` 직접 import**. `validate-tsx-video-narration-match.js` (⓪-tsx2) 가 narration 키워드와 src 파일명 매칭을 강제.

**TSX 내 OffthreadVideo 배치 패턴:**

```tsx
import { OffthreadVideo, staticFile } from "remotion";

<AbsoluteFill style={{ background: "#0b0810" }}>
  <OffthreadVideo
    src={staticFile("videos/vibe-news-0407/terminal-command.mp4")}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }}
    volume={0}
  />
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(255,60,80,0.28) 0%, rgba(11,8,16,0.92) 38%, rgba(11,8,16,0.98) 100%)" }} />
  {/* 전경 콘텐츠 */}
</AbsoluteFill>
```

**규칙:**
- 불투명도 overlay: `opacity: 0.15 ~ 0.40`. 필요 시 gradient 오버레이로 가독성 확보.
- 파일 매칭: `public/videos/{pid}/` 의 파일명에서 narration 핵심 명사와 매칭 (예: narration "터미널" → `terminal-*.mp4`).
- `⓪-tsx2 validate-tsx-video-narration-match` 가 src 경로에 narration 키워드 최소 1개 포함 강제.
- 비디오 없어도 되는 씬 (metric/stat/엔딩) 은 OffthreadVideo 생략 가능.

**재사용 우선 (public/videos/{pid}/ 존재 시):**

```bash
ls public/videos/{pid}/*.mp4
```
씬 narration 과 파일명 매칭되면 **재다운로드 없이 직접 src 지정**. 없으면 `npx tsx scripts/fetch-scene-videos.ts data/{pid}/scenes-v2.json` (PEXELS_API_KEY 필요).

---

## 8. 🚨 AST-LEVEL HARD GATE (⓪-tsx · R11 체인)

R11 이후 픽셀 게이트 P1/P2/P3/P4 는 **JSX AST 기반 validator 3종** 으로 이식/재정의됨. TSX 씬은 전부 이 체인을 통과해야 한다.

| # | Validator | 파일 | 기준 |
|---|-----------|------|------|
| ⓪-tsx1 | structural-signature | `scripts/validate-tsx-structural-signature.js` | JSX tag signature cluster ≤ 2. leaf type tuple + trio-pattern 검출. trio-RingChartx3 같은 쌍둥이 씬 차단. |
| ⓪-tsx2 | video-narration-match | `scripts/validate-tsx-video-narration-match.js` | `<OffthreadVideo src={...}>` 가 narration 핵심 키워드 1개 이상 포함. 무관한 b-roll 차단. |
| ⓪-tsx3 | text-dedup | `scripts/validate-tsx-text-dedup.js` | JSX 내 string literal ↔ SRT 자막 Levenshtein similarity ≤ 0.6. 자막 복제 차단. |

**추가 strict 가드 (DSL 예외 씬 대상):**

| # | Validator | 파일 | 기준 |
|---|-----------|------|------|
| ⓪-dsl | dsl-rationale | `scripts/validate-dsl-rationale.js` | `_dsl_rationale.{data_only,pattern_unique,no_emotion}` 3필드 각 10자+ 근거. 형식적 기입 차단. |

**pre-commit hook (`.git/hooks/pre-commit`):** DSL rationale 미충족 시 commit 차단. Bypass 금지.

---

## 9. 🚫 폐기된 가드 (v1.4)

R11 이전에 쓰이던 아래 가드는 **TSX 기본값 전환으로 자연 무효화** 됨. 현재 postprocess 에서 deprecated 표시 또는 physical removal.

| 폐기 가드 | 대체 |
|---------|------|
| `validate-tsx-escape.js` (씬당 ≤ 1) | 기본값이 TSX 이므로 룰 무의미. 제거 예정. |
| `validate-background-coverage.js` (VideoClip 30%+) | TSX 내 `<OffthreadVideo>` + ⓪-tsx2 가 대체. |
| pattern-picker 기반 가드 전부 (mass realize 관련) | TSX 기본값에서 mass realize 가 없으므로 자연 무효. |
| `validate-layout-diversity.js` shape-hash | `validate-tsx-structural-signature.js` (⓪-tsx1) 로 구조 signature 기반 재정의. |

**2026-04-19 R9 자동 분석이 "정보 열거 씬 = DSL" 프레이밍을 공식 철회.** 기본값 TSX 공식 확정.

---

## 10. 🔴 Render-Time 픽셀 게이트 (유지)

TSX 씬이어도 렌더된 mp4 에 대한 아래 검증은 유지.

| # | Validator | 시점 | 기준 |
|---|-----------|------|------|
| P5 | `validate-outro-black.js` | 렌더 완료 후 | 영상 마지막 2초 블랙 프레임 = 0 |
| P7 | `validate-rendered-node-presence.js` | Phase A PNG / 렌더 샘플 | 실제 보이는 요소 ≥ 5 (sharp + dilate) |

**감사 기준 6 지표 (R11-audit 용, memory `project_r11_audit_criteria.md`):**
- near-empty (density < 15%) ≤ 10%
- center-locked (centerStrip > 60%) ≤ 30%
- bottom-dead (l⅓ < 30%) ≤ 30%
- trio 쌍둥이 = 0
- 민트 단색 dominance ≤ 30%
- 엔딩 블랙 = 0

---

## 11. ⛔ `visual_plan` 은 참고만 (realize 금지)

R10 이전: `/vg-scene` 이 커밋한 `visual_plan` 을 realize — pattern_ref 기반 자동 생성.

**R11 이후 (v1.4 원칙 A):**
- `visual_plan.pattern_ref` 는 **TSX 설계 영감** (감정 · focal type · container 방향성).
- `/vg-layout` 은 narration 을 직접 읽고 TSX JSX 를 새로 설계.
- DSL 예외 씬 (3조건 만족) 에 한해 여전히 DSL stack_root 로 realize 가능.

**해서는 안 되는 것:**
- pattern_ref 값이 P04 라서 "RingChart + BulletList" 로 stack_root 찍기. (mass realizer)
- pattern-based builder 함수 작성. (절대 금지)
- scenes-v2.json 에 stack_root JSON 트리 직접 편집. (3조건 강보강 안 하면 `⓪-dsl` 차단)

**해야 하는 것:**
- narration 을 감정·의미 단위로 읽기 → TSX JSX 트리 설계 → 원칙 B adapter 로 DSL 노드 부분 재사용.

---

## 12. Inputs To Read

| 경로 | 목적 |
|------|------|
| `data/{pid}/scenes-v2.json` | 각 씬의 subtitles / start_ms / duration_frames / visual_plan 힌트 |
| `data/{pid}/scene-plan.json` | plans[i].visual_plan 동일 내용 (감사용) |
| `reference/SC *.png` | Visual DNA 원본 (**ABSOLUTE 규칙, 매 세션 Read**) |
| `src/remotion/custom/*.tsx` | 기존 TSX 예시 (scene-03/22/26/32/54/77 우선 Read) |
| `src/remotion/custom/_dsl.tsx` | 원칙 B adapter 시그니처 |
| `src/remotion/nodes/registry.ts` | NODE_REGISTRY 타입 목록 |
| `src/remotion/common/theme.ts` | StylePack + Typography + Ambient (폰트/색 팔레트) |
| `public/videos/{pid}/*.mp4` | OffthreadVideo src 선택 후보 |
| `public/icons/{pid}/manifest.json` | 브랜드/개념 아이콘 (TSX 내 `<img>` 또는 `<D type="DevIcon" />`) |

---

## 13. Phase A → B 구분 (참고)

TSX 씬에서는 Phase A/B 구분이 단일 컴포넌트 내부 if/else 로 흡수되지만, 전통 flow 참고:

- **Phase A (Layout)**: 모션 제거한 정적 hero frame. `frame === Math.floor(durationFrames / 2)` 시점 PNG 로 확인.
- **Phase B (Motion)**: interpolate / spring / Easing 으로 entrance/emphasis 추가.

`render-single-scene.sh` 가 half-frame still 을 렌더하므로 Phase A 검증 자동화.

**씬 첫 커밋 시점에 `scene.preview_reviewed_at = new Date().toISOString()` 기록.** `validate-preview-reviewed.js` 가 Phase B 씬에 이 필드 없으면 exit 1.

---

## 14. Motion 규칙 (Remotion primitives)

| 원칙 | 구현 |
|------|------|
| 첫 enterAt ≥ 3f | `interpolate(frame, [3, 24], ...)` |
| 씬당 ≥ 3 종 이징 혼합 | linear / spring / easeIn/easeOut (`Easing.bezier(...)`) |
| 같은 preset 2회 이상 금지 | interpolate 설정값을 요소마다 다르게 |
| `repeat: -1` / 무한 반복 금지 | Math.sin(frame / N) 같이 frame 기반으로만. setInterval 금지. |
| motion.exit 금지 (마지막 씬 제외) | TransitionSeries 가 처리. 중간 씬에 opacity 0 fade 금지. |

**자막 싱크 (점진 등장):** narration 이 키워드 발화하는 시점에 관련 요소 등장.
```
const enterAt = Math.round((subtitle.startTime - scene.start_ms/1000) * 30);
const opacity = interpolate(frame, [enterAt, enterAt + 20], [0, 1], { extrapolateRight: "clamp" });
```

---

## 15. 검증 도구 참조 (전체)

| 도구 | 사용 시점 |
|------|----------|
| `scripts/render-single-scene.sh` | 씬 작성 후 단일 씬 PNG 격리 렌더 |
| `scripts/vg-preview-still.ts` | Phase A 정적 hero PNG (옵션) |
| `scripts/sync-render-props.js` | scenes-v2.json 편집 후 필수 |
| `scripts/postprocess.sh` | 전체 검증 체인 (⓪-pre ~ ⑧) |
| `scripts/prepare-dsl-subset.js` | TSX 씬 vs DSL 씬 분기 (postprocess 내부) |
| `scripts/validate-tsx-structural-signature.js` | JSX 쌍둥이 구조 차단 |
| `scripts/validate-tsx-video-narration-match.js` | OffthreadVideo src 매칭 |
| `scripts/validate-tsx-text-dedup.js` | 자막 ↔ JSX 문자열 중복 차단 |
| `scripts/validate-dsl-rationale.js` | DSL 예외 씬 3조건 strict |
| `scripts/validate-fidelity.js` | 색·폰트·아이콘 Visual DNA |
| `scripts/validate-determinism.js` | frame-purity (Math.random 등 차단) |
| `scripts/validate-rendered-node-presence.js` | 렌더 PNG 실제 보이는 요소 ≥ 5 |
| `.git/hooks/pre-commit` | DSL rationale 미충족 commit 차단 |

---

## 16. ⛔ Execution — 에이전트/배치 스크립트 금지

**Do NOT delegate TSX authoring to Agent tool.** 씬은 narration 감정 단위로 수작업. 서브에이전트 위임 시 톤 일관성 깨짐.

**절대 금지 — 배치 스크립트 작성 (HARD BAN):**
- 씬 목록을 순회하며 공통 템플릿으로 TSX 파일 또는 stack_root 를 찍어내는 스크립트 작성 금지.
- Python `for sc in scenes: write_tsx(sc)` / Node `scenes.map(sc => buildTsx(sc))` 전부 금지.
- `scripts/gen-layouts-*.{py,js,ts}` / `build-tsx-batch.*` 등 신규 생성기 작성 금지.
- **Edit/Write 도구로 씬 단위 직접 authoring**. 10~15 씬 배치로 나눠 여러 턴에 진행.
- 직렬화 도우미 (JSON 포맷팅만 담당) 와 배치 생성기는 다르다. 헷갈리면: "이 스크립트가 씬의 **구조/노드 선택**에 관여하는가?" Yes → 금지.

---

## 17. Core Philosophy

**You are a 10-year veteran motion graphics director.** Not a coder, not a template filler.
당신은 **슬라이드가 아니라 씬을 만드는 디렉터** 다. 매 씬이 수천 명의 관람자에게 닿는다.

**질문 루프:**
1. "이 씬의 관람자가 느껴야 할 감정 한 줄은?"
2. "reference/SC *.png 중 이 느낌과 가까운 톤은?"
3. "narration 의 핵심 숫자/명사/동사 3개는?"
4. "JSX 트리에서 focal 은 화면 50% 이상 차지하는가?"
5. "직전 3 씬과 구도가 쌍둥이는 아닌가?"
6. "자막과 화면 텍스트가 동일하지 않은가?"
7. "최종 PNG 를 Read 했을 때 5개 이상 시각 요소가 보이는가?"

**마인드셋 — R11 격언:**
> DSL 을 옹호하려면 DSL 을 다이어트시켜야 한다. 그 다이어트가 끝났다.
>
> **이제는 TSX 로 쓴다. 자유도가 당신을 해방시킬 때까지.**

---

## 18. 자가 검증 체크리스트 (씬 단위)

씬 하나 완성 전 전부 확인:

- [ ] `src/remotion/custom/scene-NN.tsx` Write 완료
- [ ] `src/remotion/custom/registry.ts` 에 등록
- [ ] `scenes-v2.json[i].stack_root` 가 TSX wrapper 로 교체 (children[0].type === "TSX")
- [ ] `scene.preview_reviewed_at` 기록
- [ ] `bash scripts/render-single-scene.sh {pid} N /tmp/scene-N.png` → PNG Read (이미지) 육안 확인
- [ ] reference/SC *.png 톤과 일관
- [ ] 자막 ↔ JSX 문자열 중복 없음 (Levenshtein ≤ 0.6)
- [ ] 직전 3 씬과 JSX tag signature 다름 (trio 쌍둥이 없음)
- [ ] `<OffthreadVideo src>` 가 있다면 narration 키워드 매칭
- [ ] focal 50%+ / deep composition / 비대칭 / 여백 의도적
- [ ] `Math.random` / `Date.now` / `setTimeout` 사용 0
- [ ] `node scripts/sync-render-props.js data/{pid}/scenes-v2.json` 실행
- [ ] `bash scripts/postprocess.sh data/{pid}/scenes-v2.json` 통과 (⓪-tsx1~3 + ⓪-dsl 포함)

**하나라도 NO → 해당 씬 TSX 재작성. "나중에 고치기" 금지.**

---

## 19. 갱신 로그

- **2026-04-19 R11 v1.4 전면 재작성** — DSL 기본값 공식 철회. TSX 기본값 (`src/remotion/custom/scene-NN.tsx`) + 원칙 B adapter (`_dsl.tsx`) + DSL 3조건 strict + AST validator 체인 (⓪-tsx1~3) 명문화. pattern builder / realize 섹션 전부 제거. 참고: `docs/handoff-2026-04-20-next-skill-sync.md` + `.claude/rules/scene-grammar.md` v1.4.
- **2026-04-18 v1.1** 감사 반영 — 의미 노드 5-9개 / Phase A/B 강제 / vg-preview-still ship.
- **2026-04-17 v1.0** 초안 — Hyperframes 흡수 + DSL 자기진단.
