# ROADMAP — Scene Grammar v1 Enforcement

**기준일 (D0)**: 2026-04-18
**근거**: `.claude/reviews/scene-grammar-v1-audit-2026-04-18.md`

---

## ⚠️ 효력 정지 조항

> 2026-04-20 (D+2) 까지 `scripts/vg-preview-still.ts` 가
> `data/{pid}/scenes-v2.json` + `src/remotion/common/theme.ts` 를 읽어
> `output/preview/{pid}-scene-N-hero.png` (1920×1080, 실제 theme 적용, ≤ 30s)
> 를 생성하지 못하면 **scene-grammar v1 전체의 효력 정지**.

효력 정지 상태에서는 `vg-layout` 의 Phase A 만 허용되고 Phase B 는 도구 가용 시까지 작성 금지.

---

## 마일스톤

| Day | 이행 항목 | 책임 산출물 | 판정 |
|-----|----------|-----------|------|
| **D+0** (2026-04-18) | vg-preview-still.ts · Phase 5 진단 · validator 6종 | scripts/vg-preview-still.ts · handoff-2026-04-17-dsl-vs-tsx-diagnosis.md · 6 validator | ✅ shipped |
| **D+1** (2026-04-18 오후) | 감사 재수행 반영 — scene-grammar v1.1 본문 편집 + ROADMAP 통합 | `.claude/rules/scene-grammar.md` v1.1 · 이 문서 업데이트 | ✅ shipped |
| **D+2** (2026-04-20) | 효력 정지 해제 | vg-preview-still 30s→exit 1 전환 + require-preview-read hook 구현 | Phase B 진입 허용 |
| **D+3** (2026-04-21) | 노드 버그 6종 수정 (Phase 5 진단) | impact.tsx fontSize / StackRenderer align / freeform.tsx anchor / emphasis.tsx range / dev-icon.tsx map / SceneBackground fallback | DSL 표현력 +30% |
| **D+5** (2026-04-23) | 보조 validator 4종 + hook 실전 | validate-no-exit-anim · validate-motion-variety · validate-no-br · validate-determinism + settings.json PostToolUse[Read] | preview-read fallback 제거 |
| **D+7** (2026-04-25) | Phase 5 재진단 (노드 버그 수정 후) + 42씬 재설계 2/4 배치 | DSL vs TSX 재측정 PNG · scene-38~47 수동 authoring | DSL 80% 따라잡기 확인 |
| **D+10** (2026-04-28) | 신규 노드 4종 + TSX escape runtime | VerticalTimeline (P0) · RotatingRingMotif/GridLineMotif/HandDrawnUnderline (P1) + Composition.tsx dynamic import + validate-tsx-escape | "감정 영상" 대응 가능 |
| **D+10** (2026-04-28) | Positive→Negative schema 리팩토링 (guardrail audit P2) | hero_frame_ms 자동 계산 스크립트 · preview_reviewed_at 필드 deprecate (VG_PREVIEW_STRICT_HOOK 기본값으로) · count-visual-elements auto-repair | Goodhart 공격 경로 제거. Claude 가 값 창작으로 우회 불가 |
| **D+14** (2026-05-02) | DSL 다이어트 — `@deprecated` | registry.ts 32 노드 export 제외 + postprocess warning | dead 코드 검출 경로 마련 |
| **D+21** (2026-05-09) | 실제 삭제 + scene-grammar v2 | 데드 21 + cold 11 물리 삭제 + scene-grammar v2 문서 | dead ratio → 0 |

---

## 즉시 시작 (D+0 ~ D+2)

1. `scripts/vg-preview-still.ts` 구현 요건:
   - 입력: `projectId`, `--scene N`, `--time hero|mid|end` (기본 hero)
   - 씬 start_frame 계산 + `hero_frame_ms` 필드 우선, 없으면 스택의 `enterAt + duration` max
   - `npx remotion still` 호출, `--props=data/{pid}/render-props-v2.json`
   - 30 초 이내 완료 못 하면 warning
2. `output/preview/` 디렉토리 + `.gitignore` 에 추가
3. `vg-layout` SKILL.md 최상단에 효력 정지 경고 1줄 박음

## D+3 ~ D+5 작업

- `scripts/migrate-to-phase-ab.ts`
  - scenes-v2.json 을 읽어 motion 을 각 노드에서 분리
  - `scenes-v2.{pid}.phase-a.json` (motion 제거) + `scenes-v2.{pid}.phase-b.json` (motion-only diff) 생성
  - 원자적 승인 후 병합 스크립트 `merge-phase-ab.ts` 동반

- hooks (`.claude/settings.json`):
  ```json
  { "hooks": { "PostToolUse": [{ "matcher": "Read", "hooks": [{ "type": "command", "command": "node scripts/_hook-preview-read-log.js" }] }] } }
  ```
  Read tool 이 `output/preview/*.png` 를 대상일 때 `.claude/state/preview-reads.json` 에 timestamp 기록.

- hook 을 못 쓸 경우 fallback: Phase B 씬마다 `preview_reviewed_at` 필수 필드.

## D+3 노드 버그 6종 수정 (Phase 5 진단 기반)

`docs/handoff-2026-04-17-dsl-vs-tsx-diagnosis.md` §3 층위1 에서 식별:

| # | 버그 | 파일 | 수정 | 검증 |
|---|------|------|------|------|
| 1 | `ImpactStat.style.fontSize` 무시 | `src/remotion/nodes/impact.tsx` | user prop 덮어쓰기 로직 제거, size prop 기본값만 fallback | 5-A PNG 재렌더로 fontSize:220 적용 확인 |
| 2 | `Stack/Split align: "start"` 무시 → vertical center 로 강제 | `src/remotion/common/StackRenderer.tsx` | default align 을 layout.align 값 그대로 반영 (현재 center 하드코딩) | 5-C 좌측 timeline 정렬 확인 |
| 3 | `Absolute` anchor 가 SceneRoot padding 안에 갇힘 | `src/remotion/nodes/freeform.tsx` | parent padding 제외 bbox 기준으로 재계산. portal 패턴 검토 | 5-A 우상단 회전 링 보임 |
| 4 | `MarkerHighlight` 다단어 highlight 한계 | `src/remotion/nodes/emphasis.tsx` | range API 추가 (`data.emphasisRange: [start, end]`) | 5-B "바이브랩스" 2단어 highlight |
| 5 | `DevIcon` anthropic/openai/github 미지원 → React 로고 fallback | `src/remotion/nodes/dev-icon.tsx` | icon map 에 claude-ai/openai/github-logo/anthropic 추가 | 5-B 적절 브랜드 로고 표시 |
| 6 | `background.kind: "image"` src 누락 시 검정 fallback | `src/remotion/common/SceneBackground.tsx` | src 검증 + AmbientBackground 폴백 | 5-C 인물 배경 누락 씬도 ambient 적용 |

## D+5 ~ D+7 Phase 5 재진단

노드 버그 6종 수정 후 같은 3씬(5-A/5-B/5-C) 재렌더 → DSL 과 TSX 격차 측정.

평가 루브릭 (총 100):
- bbox 오버랩 (20)
- 텍스트 밀도 적정성 (20)
- 모션 다양성 (20)
- Claude 가 JSON 만 읽고 최종 픽셀 80% 서술 가능 여부 (20)
- 코드 변경 용이성 (20)

목표: DSL+수정 점수 ≥ TSX 점수 × 0.8. 미달 시 scene-grammar v2 에서 DSL 어휘 확장 + escape hatch 비중 상향.

## D+10 Positive→Negative schema 리팩토링 (guardrail audit P2)

현재 positive schema 는 Claude 가 값만 채워 넣으면 통과 → Goodhart 취약. 리팩토링:

| 가드 | Positive 형태 (현재) | Negative 형태 (목표) |
|------|-------------------|-------------------|
| `hero_frame_ms` | 필드 필수 (Claude 가 기입) | `scripts/compute-hero-frame.js` 가 enterAt+duration max 로 자동 계산 → scenes-v2 에 주입. 계산 실패 (motion 필드 부재 등) 시 `[FAIL] hero-frame compute impossible` exit 1. |
| `preview_reviewed_at` | 필드 필수 (Claude 가 ISO 기입) | `VG_PREVIEW_STRICT_HOOK=1` 기본값 전환 → hook 증적만 인정. 필드는 deprecated warning + archive. |
| `count-visual-elements ≥ 4` | 임계값 통과 (장식 추가로 우회 가능) | 가중치 계산이 컨테이너/장식 제외 + "의미 기여도" 측정. 창작으로 우회 불가한 관측 지표. |

Claude 가 **값을 창작해서** 통과하는 경로를 전부 닫는 것이 목표. Hyperframes 의 "grep/픽셀/AST 관찰" 철학과 정렬.

## D+10 신규 노드 4종 + TSX escape runtime

`docs/handoff-2026-04-17-dsl-vs-tsx-diagnosis.md` §3 층위2/3 기반:

| 노드 | 우선순위 | 구현 파일 | 유즈케이스 |
|------|---------|---------|---------|
| `VerticalTimeline` | 🔴 P0 | `src/remotion/nodes/vertical-timeline.tsx` | 5-C 2018→2026 시간성. steps[] + year 라벨 + dot accent |
| `RotatingRingMotif` | 🟠 P1 | `src/remotion/nodes/motifs/rotating-ring.tsx` | 5-A 우상단 회전 링. 장식 전용 (Absolute 자식 화이트리스트) |
| `GridLineMotif` | 🟠 P1 | `src/remotion/nodes/motifs/grid-line.tsx` | 5-B 좌상단 모눈. 장식 전용 |
| `HandDrawnUnderline` | 🟠 P1 | `src/remotion/nodes/emphasis/hand-drawn-underline.tsx` | 5-C SVG path stroke draw. `data.text` 아래 accent 선 |

TSX escape hatch 런타임:
- `src/remotion/common/StackRenderer.tsx` 에 `node.type === "TSX"` 분기 추가.
- `data.component` 문자열 → `src/remotion/custom/<path>.tsx` dynamic import.
- `data.props` 는 동결 shallow clone 으로 전달 (결정론 유지).
- `validate-tsx-escape.js` 씬당 ≤ 1, 미존재 경로 시 exit 1.

---

## 갱신 로그

- **2026-04-18 D+0**: 감사 보고서 수령 + 이 ROADMAP 작성. 효력 정지 조항 부착.
- **2026-04-18 D+0 추가**: vg-preview-still.ts 조기 구현 (3~4초) → 효력 정지 해제. Phase 5 진단(5-A/5-B/5-C) 조기 실행 → "DSL 유죄, 보수공사" 판결 + 노드 버그 6개 + 신규 노드 4종 식별.
- **2026-04-18 D+1**: 2차 감사 반영. scene-grammar.md 실제 v1.1 편집. Phase 5 진단 결과 이 ROADMAP 에 편입 (D+3 버그 수정 · D+7 재진단 · D+10 신규 노드/escape runtime).
- (예정) D+2 (04-20): vg-preview-still 30s exit 1 전환 + hook 구현
- (예정) D+3 (04-21): 노드 버그 6종 수정 시작
- (예정) D+7 (04-25): Phase 5 재진단 + 42씬 재설계 2/4 배치
- (예정) D+10 (04-28): 신규 노드 4종 + TSX escape runtime
- (예정) D+21 (05-09): scene-grammar v2 draft
