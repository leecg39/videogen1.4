# Pattern Builder Conflict — 해결 전략 (2026-04-18)

## 배경

- 2026-04-18 scene-grammar v1.1 에 **Pattern builder ABSOLUTE BAN** 도입 (`vg-layout` SKILL.md #6).
- 현재 `data/vibe-news-0407/scenes-v2.json` 의 총 80 씬 중 42 씬이 기존 `buildP01` ~ `buildP27` 패턴 함수로 찍혀 있어 `validate-layout-diversity` FAIL.
- 정책과 기존 데이터가 충돌.

## 옵션 비교

| 옵션 | 내용 | 장점 | 단점 | 판정 |
|------|------|------|------|------|
| **(a) 벽 정책 · 전면 재설계** | 42 씬 전부 수동 authoring. pattern builder 함수 22종 즉시 비활성. | 정책 일관성. DSL 다이어트 가속. | 4세션 × 10씬 노동. 사용자가 즉시 렌더 못 함. | **채택** (단계적) |
| (b) 정책 scope 축소 | 신규 프로젝트만 ABSOLUTE BAN. 기존 프로젝트는 advisory. | 즉시 렌더 가능. | 정책 2 track 운영 리스크. "신규"의 경계 모호. | 기각 |
| (c) 정책 유예 | D+14까지 BAN 해제, 데드코드 다이어트 먼저. | 시간 확보. | scene-grammar v1.1 자체 모순. 감사가 지적한 "completed 라 써놓고 실제 안 한" 패턴 재발. | 기각 |

## 채택: (a) 단계적 전면 재설계

### 진행 현황

- **1차 배치 완료 (2026-04-18)**: scene-28~37 (10 씬)
  - 산출물: `scripts/_redesign-28-37-batch1.mjs` · 10 PNG preview · `handoff-2026-04-18-batch1-28-37-complete.md`
  - 가드 통과: layout-diversity(28~37), label-quality, no-emoji, phase-separation
  - 10 씬 모두 `phase:"B"` + `hero_frame_ms` + `preview_reviewed_at` 기입

### 남은 배치 일정

| 배치 | 씬 범위 | 씬 수 | 예정 | 비고 |
|------|--------|------|------|------|
| 2차 | scene-38~47 | 10 | D+2 ~ D+3 | shape `09ef663d`(38,66,74) 의 38 포함 — 68/78 와 다른 구조로 해야 함 |
| 3차 | scene-48~57 | 10 | D+4 ~ D+5 | shape 반복 리스트의 49/52 포함. hook 구현 후 진입해야 preview_reviewed_at 자동화 혜택 |
| 4차 | scene-58~69 | 12 | D+6 ~ D+7 | 64/66/67/68 반복 shape 3종 동시 제거. 이 배치가 끝나야 layout-diversity PASS |

### 각 배치 원칙 (1차에서 검증된 워크플로우)

1. 각 씬 narration + subtitles 직접 읽기.
2. `visual_plan.pattern_ref` + `focal.type` 은 힌트만 — 맹목 복사 금지.
3. reference/SC*.png 유사 프레임 이미지 Read 로 DNA 확인.
4. 고유 stack_root 작성 (Stack/Grid/Split + SvgAsset/Headline/BodyText).
5. `hero_frame_ms` 지정.
6. `npx tsx scripts/vg-preview-still.ts <pid> --scene N --time hero` 실행.
7. PNG Read 로 확인 → (v1.1 hook 으로) `.claude/state/preview-reads.json` 자동 기록.
8. `preview_reviewed_at` ISO 타임스탬프 병행 기입 (이중 검증).

### 배치 스크립트는 직렬화 도우미로만 허용

- `scripts/_redesign-28-37-batch1.mjs` 같은 **일회성 authoring wrapper** 는 허용.
- 조건: 각 씬 entry 가 인라인으로 개별 작성되어 있고, pattern builder 함수 (`buildPXX(scene)` 형태) 가 **없을 것**.
- 스크립트는 JSON 포맷 보전·대량 Edit 회피 용도. 구조 결정은 여전히 인간/Claude 가 수행.
- 2차 ~ 4차 배치 스크립트는 각각 `_redesign-38-47-batch2.mjs`, `_redesign-48-57-batch3.mjs`, `_redesign-58-69-batch4.mjs` 로 생성.
- 4차 완료 후 모든 `_redesign-*-batchN.mjs` 는 `scripts/archive/` 로 이동 + 재사용 금지 주석.

## pattern builder 함수의 말로

1. **즉시 (D+0)**: 신규 authoring 에서 사용 금지 (SKILL.md #6 — ABSOLUTE BAN 이미 박힘).
2. **D+3**: `buildP01` ~ `buildP27` 함수가 있는 스크립트 목록 감사 (`grep -rn "function buildP" scripts/`). 결과 문서화.
3. **D+7** (4차 배치 완료): 해당 스크립트 파일을 `scripts/archive/pattern-builders/` 로 이동 + `README.md` 에 "폐기. 2026-04-18 scene-grammar v1.1 ABSOLUTE BAN" 기록.
4. **D+14**: registry.ts dead/cold 노드 `@deprecated` 작업과 동시에 해당 archive 최종 삭제 검토.

## 검증 체크리스트 — 4차 배치 완료 시점

- [ ] `validate-layout-diversity` — shape 반복 3+ 씬 0건, 연속 동일 family 0건
- [ ] `validate-phase-separation` — 80 씬 전부 Phase B, motion props 섞임 없음
- [ ] `validate-preview-reviewed` — 80 씬 전부 hook 증적 or fallback 필드
- [ ] `validate-hero-frame` — 80 씬 전부 `hero_frame_ms` 기입
- [ ] `validate-node-count` — 의미 노드 5-9개 범위 위반 0건
- [ ] `count-visual-elements` — 시각요소 가중치 합 ≥ 4, 평균 ≥ 7
- [ ] `validate-fidelity`, `validate-label-quality`, `validate-no-emoji`, `validate-svg-asset-integrity` — 기존 가드 유지
- [ ] 전체 mp4 재렌더 → 23085 frames 완주

## 한 문장 요약

> **42씬 중 10씬 완료(1차 배치). 남은 32씬은 D+7까지 3회 배치로 수동 재설계. 완주 후 pattern builder 함수를 archive 로 이동하여 정책과 데이터의 일관성 회복.**
