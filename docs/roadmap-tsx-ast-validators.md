# Roadmap — 원칙 C 가드 재설계 (TSX AST validators)

> **맥락:** R6 오른쪽 페인 판정 — "DSL 전면 폐기 대신 원칙 A+B+C 채택. 원칙 A=TSX 기본값, B=DSL 노드 library import 가능, C=기존 validator 중 DSL 특화 항목은 TSX AST 로 이식."

---

## 1. 현행 10 validator 분류

| # | Validator | 측정 대상 | 원칙 C 재분류 |
|---|-----------|----------|---------------|
| P1 | `validate-pixel-density.js` | PNG non-empty pixel ratio | **UNIVERSAL** — TSX/DSL 무관. 유지 |
| P2 | `validate-bottom-occupancy.js` | 하단 50% content ratio | **UNIVERSAL** — 유지 |
| P3 | `validate-subtitle-visual-dedup.js` | SRT ↔ 씬 텍스트 중복 | **HYBRID** — DSL `data.text` 스캔 + TSX 는 JSX text child 스캔 필요 |
| P4 | `validate-semantic-shape-cluster.js` | 노드 타입 sequence signature | **TSX AST 이식 대상** — JSX element tag sequence 로 치환 |
| P5 | `validate-outro-black.js` | 마지막 2초 블랙 frame | **UNIVERSAL** — 유지 |
| P6 | `validate-horizontal-asymmetry.js` | center strip 점유율 | **UNIVERSAL** — 유지 |
| P7 | `validate-rendered-node-presence.js` | PNG mask flood-fill components | **UNIVERSAL** — TSX 는 JSX 요소 수가 많아 자연 통과. 임계 재평가 |
| P8 | `validate-color-hierarchy.js` | HSV 12 bucket hue 다양성 | **UNIVERSAL** — 유지 |
| P9 | `validate-opening-hook.js` | 첫 9씬 density | **UNIVERSAL** — 유지 |
| P10 | `validate-background-coverage.js` | scene.background.video 비율 | **OBSOLETE** — 비디오 배경은 TSX 내 `<OffthreadVideo>` 로 자유 사용. 제거하거나 "TSX 내 video 노드 카운트" 로 재정의 |

**DSL 전용 validator (TSX AST 이식 필요):**
- `validate-node-count.js` (의미 노드 5-9개)
- `validate-semantic-shape-cluster.js` (trio 쌍둥이 차단)
- `validate-absolute-content.js` (Absolute 화이트리스트)
- `validate-hero-frame.js` (hero_frame_ms 필수)
- `validate-preview-reviewed.js` (phase_reviewed_at)
- `validate-label-quality.js` (조사 끝 라벨, 기능어 라벨)
- `validate-fidelity.js` (mint accent · mega-number)
- `validate-allow-exit.js`

---

## 2. TSX AST validator 설계 원칙

### 2-1. JSX parsing
- `@babel/parser` 또는 `@typescript/compiler` 로 `src/remotion/custom/*.tsx` 를 AST 로 로드.
- 최상위 `export const SceneXX: React.FC<NodeProps>` 의 return JSX 를 추출.

### 2-2. Structural signature (P4 재이식)
- 씬의 "leaf JSX tag sequence" 추출. ex: `[div, div, svg, text, div]`.
- DOM 계층의 **BFS traversal 첫 10 요소**의 tag+key-props signature.
- 직전 3씬과 signature cluster size 검사 (기존 P4 와 동일 로직, input 만 AST).

### 2-3. Semantic component count (node-count 이식)
- JSX element 중 "content" 에 해당하는 것만 카운트:
  - **포함**: `h1~h6`, `p`, `span` (text child 있음), `<OffthreadVideo>`, `<svg text>`, `<img>`, `<video>`, custom `<ImpactStat>`, `<BulletList>` 등
  - **제외**: `<div>` (container), `<AbsoluteFill>`, 장식 SVG path, 빈 span
- 임계: 5-15 (TSX 는 노드 풍부하므로 DSL 5-9 보다 넓게)

### 2-4. Text dedup (P3 재이식)
- JSX 에서 string literal (template literal 제외 — 동적 값) 추출.
- SRT 자막과 Levenshtein 측정.
- 강한 token 매칭 (기존 strict mode) 유지.

### 2-5. Hero frame 자동 추론
- TSX 에서 `interpolate(frame, [A, B], ...)` 의 B 값 수집.
- 최대값 + 6f = hero_frame_ms (자동 계산, scenes-v2.json 필드 불필요).

---

## 3. 구현 일정

| D+N | 작업 |
|-----|------|
| **D+1** | `scripts/validate-tsx-structural-signature.js` — P4 AST 이식. 직전 3씬 cluster ≤ 2 |
| **D+2** | `scripts/validate-tsx-semantic-count.js` — JSX 의미 요소 5-15 |
| **D+3** | `scripts/validate-tsx-text-dedup.js` — JSX string literal ↔ SRT strict |
| **D+5** | `postprocess.sh` 에 TSX 씬 자동 분기 — stack_root 가 TSX wrapper 면 TSX AST validator 호출 |
| **D+7** | 기존 DSL validator 에 "TSX 씬은 skip" gate 추가 (SOFT:skip 로그) |
| **D+10** | `validate-label-quality.js` / `validate-fidelity.js` 도 JSX string literal 대상 확장 |
| **D+14** | PR 머지 + scene-grammar v1.4 에 원칙 A/B/C 명시 |

---

## 4. 원칙 B 보조 유틸

DSL 노드 컴포넌트를 TSX 에서 쉽게 import 하기 위한 adapter:

```tsx
// src/remotion/custom/_dsl.ts (신설)
import type { StackNode } from "@/types/stack-nodes";
import { NODE_REGISTRY } from "../nodes/registry";

export function D(type: string, data?: any, props: Partial<StackNode> = {}) {
  const Comp = NODE_REGISTRY[type];
  if (!Comp) return null;
  const node = { id: `dsl-${type}-${Math.random().toString(36).slice(2, 8)}`, type, data, ...props };
  return (frame: number, durationFrames: number) =>
    <Comp node={node as StackNode} frame={frame} durationFrames={durationFrames} />;
}
```

TSX 내부 사용 예:
```tsx
const StatBlock = D("ImpactStat", { value: 75000, suffix: "+", label: "GitHub stars" });

<AbsoluteFill>
  <div style={{ position: "absolute", top: 200, left: 140 }}>
    {StatBlock(frame, durationFrames)}
  </div>
</AbsoluteFill>
```

이 방식이면 74 노드 자산은 보존하면서 레이아웃 자유도는 JSX 가 확보. 단, TSX AST validator 는 이 패턴(`D("type", ...)`)도 인식해 semantic count 에 포함해야 함.

---

## 5. 이번 라운드(R6→R7) 에서 즉시 반영된 것

- [x] 10 + 10 = 20씬 TSX 전환 (scene-0/1/3/5/8/10/14/16/22/23/25/30/40/42/50/52/60/69/70/77)
- [x] TSX escape runtime + custom/registry.ts
- [x] single-scene render 도구 (`scripts/render-single-scene.sh`)
- [ ] D+1 ~ D+14 validator 이식 (**이 문서의 나머지 항목**)
- [ ] 나머지 58씬 재평가 (TSX 로 전환할지, DSL 유지할지 — 원칙 A 3조건 테스트)

---

## 6. Goodhart 방지 재강화

원칙 C 에서 TSX AST validator 가 잘못 설계되면 "JSX 요소 수만 늘리는 Goodhart" 가능. 방지:

1. JSX 최상위 return 의 **사람이 읽을 수 있는 텍스트 총량** (모든 string literal 합) 최소치 100자.
2. 애니메이션 사용 (interpolate/spring) 최소 2 종류.
3. 배경 `<OffthreadVideo>` 사용시 narration 기반 선택 이유가 TSX 주석에 명시 (validator 로 검출).

---

## 7. 폐기 후보 (D+14 에 삭제 심사)

- `validate-tsx-escape.js` (씬당 TSX ≤ 1) — 원칙 A 하에선 오히려 "TSX 기본" 이므로 무의미. 삭제.
- `validate-background-coverage.js` (scene.background.video 비율) — stack_root 내부 VideoClip 이나 TSX `<OffthreadVideo>` 로 충분. 재정의.
- `pattern picker` 관련 모든 가드 (trio 쿨다운 등) — TSX 전환 후 pattern 반복 구조적 소멸.

---

**이 로드맵은 R7 답신으로 원칙 A/B/C 확정 후 D+14 안에 완료 예정.**
