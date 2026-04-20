# Handoff 2026-04-20 — SKILL.md 동기화 (R11 이후 TSX 기본값 반영)

> **세션 시작 시 가장 먼저 Read.** 9 라운드 여정(R1 62% → R11 99.5%) 결과가 `.claude/skills/**/SKILL.md` 에 반영되지 않아 다음 세션에서 `/vg-layout` 호출 시 **구형 DSL 방식으로 회귀할 위험** 이 있음. 본 핸드오프가 해소해야 할 불일치.

---

## 1. 현재 불일치 — "파이프라인 구조 vs 스킬 지침" 갭

**코드/가드는 R11 기준:** TSX 56/78, pre-commit hook, postprocess ⓪-pre/⓪-tsx1~3/⓪-dsl 체인, scene-grammar v1.4, `_dsl.tsx` adapter, P4/P10/P3 AST validator 모두 작동.

**SKILL.md 는 R1 기준:** `/vg-layout` SKILL.md 가 여전히 "stack_root JSON 편집 + pattern realize" 지침. TSX/custom/원칙 A 언급 0건.

**결과:** 다음 세션에서 `/vg-layout` 을 호출하면 SKILL.md 를 따라 DSL 방식으로 씬을 작성 시도 → pre-commit hook 이 차단하긴 하지만 **사용자/에이전트 모두 혼란**.

---

## 2. 수정 대상 5 파일 및 작업 명세

### (A) `.claude/skills/vg-layout/SKILL.md` — 🔴 **전면 재작성** (현 1119 lines)

기존 "stack_root JSON + pattern realize + 74 노드 카탈로그" 중심 지침을 **TSX 기본값 워크플로우** 로 전환.

**필수 포함 섹션:**

1. **Opening 선언 (v1.4 기본값 전환)**
   - "씬 작성의 기본값은 `src/remotion/custom/scene-NN.tsx` TSX 컴포넌트. stack_root JSON 은 TSX wrapper 만 갖는다."
   - "DSL (stack_root JSON 트리) 은 3조건 동시 만족 시만 허용되는 좁은 예외 — 실질적 사용률 0~5%."

2. **표준 워크플로우** (순서)
   ```
   1) data/{pid}/scene-plan.json Read
      → 각 씬 narration 읽기. visual_plan.pattern_ref 는 참고만 (R11 이후 격하)
   2) 씬마다 감정/핵심 메시지 추출
      → "이 씬 관람자가 느껴야 할 것 한 줄" 결정
   3) src/remotion/custom/scene-NN.tsx Write
      → Remotion primitives 사용:
         - AbsoluteFill, interpolate, spring, OffthreadVideo, staticFile, useVideoConfig
         - 고유 JSX 트리 + CSS + 모션
      → DSL 노드 필요시 _dsl.tsx adapter:
         - import { D } from "./_dsl";
         - <D type="ImpactStat" data={{value:..., label:...}} frame={frame} durationFrames={durationFrames} />
   4) src/remotion/custom/registry.ts 에 컴포넌트 등록
   5) data/{pid}/scenes-v2.json 의 scene.stack_root 를 TSX wrapper 로 교체:
      {
        "type": "SceneRoot",
        "layout": {"padding": 0, "gap": 0},
        "style": {"background": "transparent"},
        "children": [
          {"type": "TSX", "data": {"component": "scene-NN"},
           "layout": {"width": "100%", "height": "100%"}}
        ]
      }
   6) bash scripts/render-single-scene.sh <pid> <idx> <outPath>
      → 단일 씬 PNG 생성 (TransitionSeries 격리 렌더)
      → Read 로 육안 확인
   7) node scripts/sync-render-props.js data/{pid}/scenes-v2.json
   8) postprocess → pre-commit hook 자동 검증
   ```

3. **원칙 B adapter 사용법 상세**
   - `src/remotion/custom/_dsl.tsx` 의 `<D/>` 컴포넌트 시그니처
   - 예시: scene-26 (ImpactStat), scene-54 (BulletList×2), scene-32 (CompareBars+Badge+Kicker)
   - 사용 시점: 정보 밀집형 데이터 표현 (차트·통계·불릿). TSX JSX 안에서 자유 배치.

4. **금지 사항 (Anti-pattern)**
   - ❌ scenes-v2.json 에 stack_root JSON 트리 직접 작성 (DSL 방식)
   - ❌ Python/JS 스크립트로 다수 씬 stack_root 일괄 생성 (mass realizer)
   - ❌ pattern_ref 기반 자동 realize
   - ❌ 74 노드를 TSX 밖에서 조립

5. **DSL 예외 허용 3조건 (원칙 A strict)**
   - data_only: narration 이 순수 데이터 제시 의도 ("표를 보겠습니다" 수준)
   - pattern_unique: 해당 DSL pattern 이 프로젝트 내 다른 씬에서 쓰이지 않음
   - no_emotion: 감정 비트(승부/대비/전환/엔딩) 없음
   - 3조건 동시 만족 → `_dsl_rationale` 필드에 각각 10자+ 근거 기입
   - R9 자동 분석 결과 49 DSL 중 47 TSX 전환 권고 — 실질 허용률 극소

6. **검증 도구 참조**
   - `scripts/render-single-scene.sh` — 단일 씬 격리 렌더 (TransitionSeries subset)
   - `scripts/validate-tsx-structural-signature.js` — JSX tag signature cluster ≤ 2
   - `scripts/validate-tsx-video-narration-match.js` — `<OffthreadVideo>` narration 매칭
   - `scripts/validate-tsx-text-dedup.js` — JSX string ↔ SRT Levenshtein
   - `scripts/validate-dsl-rationale.js` — DSL 씬 3조건 근거 strict
   - `scripts/prepare-dsl-subset.js` — 원칙 A 분기 preprocess
   - `.git/hooks/pre-commit` — commit 차단

7. **pattern builder ABSOLUTE BAN 삭제**
   - 기존 섹션 "pattern builder 사용 금지" 는 DSL 내부 규칙 — TSX 기본값에서는 자연 무효. 섹션 제거하거나 "deprecated" 표시.

8. **design-linker 설계 참조 유지**
   - reference/ Visual DNA 61장 Read 규칙은 TSX 작성에서도 유효 (영상 톤 일관성).

### (B) `.claude/skills/vg-scene/SKILL.md` — ⚠️ **pattern_ref 격하** (현 409 lines)

**수정 포인트:**
1. 상단에 "R11 이후 변경" 블록 추가:
   - `visual_plan.pattern_ref` 는 여전히 생성되지만 **`/vg-layout` 이 참고 힌트로만 사용**. 자동 realize 없음.
   - `/vg-layout` 은 narration 을 직접 읽고 TSX 컴포넌트를 새로 설계.

2. pattern-picker 20 패턴 카탈로그 섹션은 유지하되 "힌트 레이어" 로 격하 명시.

3. `visual_plan.pattern_ref` 의 역할 표:
   | 필드 | R10 이전 | R11 이후 |
   |------|---------|---------|
   | pattern_ref | `/vg-layout` 이 해당 pattern 을 realize | 무시하거나 참고만 |
   | focal / support | DSL 노드 힌트 | TSX 설계 영감 |
   | density | DSL 노드 카운트 기준 | JSX 요소 카운트로 자연 이식 |

4. 3 HARD GATE (visual-plan-coverage 등) 는 DSL 씬 대상에만 유효. TSX 씬은 AST validator 가 대체.

### (C) `.claude/skills/vg-new/SKILL.md` — ⚠️ **postprocess 체인 업데이트** (현 482 lines)

**수정 포인트:**
1. `/vg-layout` 이후 postprocess 가 이제 **원칙 A 분기 체인** 실행한다는 사실 반영:
   - ⓪-pre prepare-dsl-subset
   - ⓪-tsx1~3 TSX AST validators (structural-signature, video-narration-match, text-dedup)
   - ⓪-dsl validate-dsl-rationale (strict)
   - ⑥-y background-coverage 는 DEPRECATED (v1.4)

2. 실패 시 재시도 루프 지침 업데이트:
   - DSL rationale FAIL → TSX 전환 (원칙 A)
   - TSX structural FAIL → JSX 트리 재설계
   - TSX video-narration FAIL → OffthreadVideo src 변경 또는 제거

3. 전체 파이프라인 순서는 같다는 것 명시 (사용자 혼란 방지):
   ```
   /vg-new → /vg-chunk → /vg-scene → /vg-layout (TSX 기본) → /vg-render
   ```

### (D) `.claude/skills/vg-render/SKILL.md` — ✅ **유지** (현 207 lines)

렌더 로직 자체는 변경 없음. 단 **참고 체크만 추가**:
- scenes-v2.json 의 TSX wrapper 씬은 `src/remotion/custom/scene-NN.tsx` 가 registry 에 등록되어 있어야 렌더 가능.
- 미등록 시 "Custom component not registered" 메시지 출력 (tsx-escape.tsx 의 fallback).

### (E) `.claude/skills/vg-chunk/SKILL.md` — ✅ **유지** (현 498 lines)

변경 없음. SRT → beats.json 단계는 DSL/TSX 무관.

---

## 3. 작업 순서 권고

```
Step 1: (D)(E) 는 건드리지 않음 확인 (유지)
Step 2: (B) vg-scene/SKILL.md 상단에 "R11 이후 pattern_ref 격하" 블록 삽입 — 가장 작은 수정
Step 3: (C) vg-new/SKILL.md postprocess 체인 섹션 업데이트
Step 4: (A) vg-layout/SKILL.md 전면 재작성 — 가장 큰 작업
   - 기존 1119 lines 의 DSL 중심 내용을 TSX 중심으로 치환
   - "원칙 B adapter", "render-single-scene.sh 검증 루프", "DSL 3조건 예외" 섹션 신설
   - pattern builder/realize 관련 섹션 제거 또는 deprecated
Step 5: 수정 후 `bash scripts/postprocess.sh data/vibe-news-0407/scenes-v2.json` 돌려서 문제 없는지 smoke test
Step 6: R11-audit (mp4 79프레임 감사) 진행 — 별도 세션 가능
```

**예상 소요:** (A) 2~3시간, (B)(C) 각 30분, smoke test 30분. 총 4~5시간.

**R11-audit 과의 관계:**
- SKILL.md 동기화 먼저 → 이후 R11-audit 가 권장 순서 (스킬이 정합성 갖춘 상태에서 감사)
- 또는 병렬: audit 은 mp4 가 렌더 완료 후 독립 수행 가능, SKILL.md 작업은 audit 과 무관하게 진행

---

## 4. 참고 문서 (R11 여정 전체)

세션 시작 시 Read 순서:
1. 본 핸드오프 (가장 먼저)
2. `docs/handoff-2026-04-19-R11-100-percent-final.md` — R11 최종 상태
3. `.claude/rules/scene-grammar.md` v1.4 — 원칙 A/B/C 명문화 (line 1~30)
4. `docs/rfc-dsl-vs-tsx-abtest.md` — R6 ε 실험 근거 (SKILL.md 재작성 철학)
5. `docs/roadmap-tsx-ast-validators.md` — 원칙 C 로드맵
6. `src/remotion/custom/_dsl.tsx` — 원칙 B adapter 코드
7. `src/remotion/custom/scene-26.tsx`, `scene-54.tsx`, `scene-32.tsx` — adapter 사용 예시
8. `src/remotion/custom/scene-03.tsx`, `scene-22.tsx`, `scene-77.tsx` — 순수 TSX 작성 예시
9. `scripts/render-single-scene.sh` — 단일 씬 렌더 도구
10. `scripts/postprocess.sh` line 57-92 — ⓪-pre/⓪-tsx/⓪-dsl 체인 코드

---

## 5. 작성 시 유의 사항

### 5-1. Claude Code 가 SKILL.md 를 그대로 따라가므로 "지시 톤" 이 중요

"가능하다" / "권장한다" 같은 약한 지시는 무시되기 쉬움. 다음 톤 사용:
- "반드시 TSX 로 작성한다"
- "stack_root JSON 트리를 직접 작성하지 않는다"
- "DSL 예외 허용 3조건은 동시 만족 필수"

### 5-2. 예시 코드 블록 필수

SKILL.md 에 실제 씬 TSX 스켈레톤 붙여넣기:
```tsx
// src/remotion/custom/scene-NN.tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { NodeProps } from "@/types/stack-nodes";
// DSL 노드 필요시: import { D } from "./_dsl";

export const SceneNN: React.FC<NodeProps> = ({ frame, durationFrames }) => {
  // 1) narration 의 감정/핵심 메시지를 주석으로 명시
  // 의도: "..."

  return (
    <AbsoluteFill style={{ background: "...", fontFamily: "..." }}>
      {/* 고유 JSX 트리 */}
    </AbsoluteFill>
  );
};
```

### 5-3. 금지 구문 grep 차단

SKILL.md 재작성 후 다음 grep 결과가 비어 있어야:
- `grep "stack_root JSON 을 작성" .claude/skills/vg-layout/SKILL.md` → 없어야
- `grep "pattern_ref 기반 realize" .claude/skills/vg-layout/SKILL.md` → 없어야

### 5-4. 변경 후 스킬이 실제로 로드되는지 검증

VS Code 에서 `.claude/skills/vg-layout/SKILL.md` 저장 후, 테스트 프로젝트에서 `/vg-layout {pid}` 호출 → 저장된 새 지침을 따라 TSX 작성을 시도하는지 smoke test.

---

## 6. 성공 기준

- [ ] `.claude/skills/vg-layout/SKILL.md` 에 "TSX", "custom/", "원칙 A", "_dsl.tsx" 키워드 각 5회 이상
- [ ] `.claude/skills/vg-layout/SKILL.md` 에 "stack_root JSON 직접 작성" 관련 지시 0회
- [ ] `.claude/skills/vg-scene/SKILL.md` 에 "pattern_ref 격하" 또는 "참고 힌트" 명시
- [ ] `.claude/skills/vg-new/SKILL.md` 에 ⓪-pre / ⓪-tsx / ⓪-dsl 체인 언급
- [ ] 테스트 프로젝트에서 `/vg-layout` 호출 시 TSX 파일 작성 시도
- [ ] commit 후 다음 세션에서 구형 DSL 방식 회귀 0회

---

## 7. 완료 후 다음 단계 (R11-audit)

SKILL.md 동기화 완료되면 R11-audit 진행:
- `output/vibe-news-0407-r11.mp4` 렌더 완료 확인
- ffmpeg 로 79 프레임 추출 (`/tmp/vibe-frames-r11/fNNN.jpg`)
- 6 지표 실측:
  - near-empty (density < 15%) ≤ 10% (R5: 35.4%)
  - center-locked (centerStrip > 60%) ≤ 30%
  - bottom-dead (l⅓ < 30%) ≤ 30% (R5: 82%)
  - trio 쌍둥이 = 0 (R5: 4건)
  - 민트 단색 dominance ≤ 30% (R5: 97%)
  - 엔딩 블랙 = 0 (R5: 51.3초)
- 4+ 통과 = 100% 확정 / 2-3 통과 = R12 이월 / 0-1 통과 = 구조 재검토

감사 기준 상세: `memory/project_r11_audit_criteria.md`.

---

**이 핸드오프가 다음 세션의 single-source-of-truth. 세션 시작 시 맨 먼저 Read.**

**완료 후 사용자에게 보고할 항목:**
1. 5 SKILL.md 파일의 R11 반영 여부
2. smoke test 결과
3. R11-audit 실행 여부 (선택)
