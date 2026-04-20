# SKILL.md 권고→가드 변환 + 신규 가드 TODO 인덱스

**작성:** 2026-04-17
**작업:** Hyperframes 철학("긍정 지시 X, 부정 제약 O")을 24개 vg-* 스킬에 적용

---

## 변환 결과 (Diff 요약)

권고 톤 키워드(`권장 / 추천 / 좋다 / 바람직 / 이상적`) **검출 0건** — 모두 부정 제약 + 가드 호출로 변환됨.

### 변경된 9개 SKILL.md

| 스킬 | 라인 | Before | After |
|------|------|--------|-------|
| vg-layout | 24 | DARK_ICONS 비-circle 권장 (경고) | 미적용 → exit 1 |
| vg-layout | 25 | giant_wordmark ≥150px (경고) | <150px → exit 1 |
| vg-layout | 95 | circle:true 추가 권장 | 미적용 시 validate-fidelity exit 1 |
| vg-layout | 309 | 15자 이내 권장 | 16자 이상 → validate-text-length exit 1 |
| vg-layout | 313 | 8자 이내 권장 | 9자 이상 → exit 1 |
| vg-render | 135 | 백그라운드 실행 권장 | run_in_background MUST (foreground = timeout) |
| vg-scene | 150 | motif_ids 1~3개만 추천 | 4개 이상 → svg-layout-selector exit 1 |
| vg-scene | 319 | compare 후 emphasize 권장 | MUST. 위반 시 progression-validator exit 1 |
| vg-slides | 49 | 권장 아키타입 | 강제 아키타입 (다른 선택 시 vg-slide-archetype 가드 fail) |
| vg-slides | 160 | 권장 entrance preset | 강제 (다른 preset 시 vg-motion-variety 가드 fail) |
| vg-demo-script | 29 | 권장 톤 | MUST. vg-narration-sync 가드 fail |
| vg-video-demo-script | 29 | 권장 톤 | MUST. vg-narration-sync 가드 fail |
| vg-video-demo | 71 | volume 0.5 유지 권장 | volume > 0.5 → vg-sfx-volume 가드 fail |
| vg-assets | 65 | 디렉토리 구조 (권장) | (강제 — 다른 경로 시 manifest 스캔 실패) |

---

## 신규 가드 — 2026-04-17 구현 완료 (dangling 해소)

### scene-grammar.md 부록(2026-04-17 v1)에서 명시된 9개

| 가드 | 상태 | 검사 내용 |
|------|------|----------|
| `vg-preview-still.ts` | ✅ DONE (Phase 4) | 단일 씬 모션 0프레임 PNG |
| `validate-phase-separation.js` | ✅ DONE | Phase A 씬에 motion props 존재 시 exit 1 |
| `validate-determinism.js` | ✅ DONE | src/remotion Math.random/Date.now/setTimeout/performance.now 검출 |
| `validate-no-exit-anim.js` | ✅ DONE | motion.exit / outAt / leaveAt / fadeOut preset 검출 (allow_exit 예외) |
| `validate-motion-variety.js` | ✅ DONE | 첫 enterAt ≥3 / unique preset ≥3 / 중복 preset / emphasisCycle / stagger span |
| `validate-no-br.js` | ✅ DONE | data.text/title/body 등 14개 필드 내 `\n` 검출 (TerminalBlock 등 예외) |
| `validate-tabular.js` | ✅ DONE | ImpactStat/AnimatedCounter/StatNumber/NumberCircle tabular-nums 강제 |
| `validate-scene-grammar.ts` | ✅ DONE | 14개 가드 + preview-still 메타 러너 |
| 노드 다이어트 (registry deprecate 32개) | 🔴 보류 | 별도 세션 — 이 가드 트랙과 독립 |

### SKILL.md 변환에서 새로 필요해진 가드 6개

| 가드 | 상태 | 검사 내용 | 참조 |
|------|------|----------|------|
| `validate-text-length.js` | ✅ DONE | VersusCard leftValue/rightValue ≥16자 / ImpactStat value+suffix ≥9자 | vg-layout:309,313 |
| `validate-progression.js` | ✅ DONE | compare→emphasize/example MUST · emphasize 연속 2회 금지 · define/explain 3회 경고 | vg-scene:319 |
| `validate-slide-archetype.js` | ✅ DONE | 16종 slide_type → 필수 컴포넌트 매핑 (영상 프로젝트는 자동 skip) | vg-slides:49 |
| `validate-narration-sync.js` | ✅ DONE | demo/video-spec narration 메타톤 15 패턴 + 길이 검사 | vg-demo-script:29, vg-video-demo-script:29 |
| `validate-sfx-volume.js` | ✅ DONE | keepOriginalAudio 세그먼트의 click SFX volume > 0.5 / whoosh > 0.6 | vg-video-demo:71 |
| `validate-svg-motif-count.js` | ✅ DONE | scene-plan/scenes-v2 의 layout_reference.motif_ids > 3 검출 | vg-scene:150 |

### postprocess.sh 통합 — 완료

- 기존 ⑥-0 ~ ⑥-f (7 게이트) + 신규 ⑥-g ~ ⑥-r (12 게이트) + ⑦/⑧ = **총 21개 게이트** (handoff 문서의 24 가정은 duplicate 포함한 추산이었음, 실제로는 의미 단위 12 추가).
- 신규 게이트는 기존 layout-diversity/fidelity 검사 실패 시 도달하지 않음 (exit 1 계단식). 모든 게이트를 통과한 프로젝트만 sync-render-props 까지 도달.
- smoke test: 0417-테스트 / 테스트 프로젝트 양측에서 구문 오류 없음. wrapped `{scenes: []}` 및 raw `[]` 양 형식 대응.

---

## 다이어트 후 보고 톤

이번 작업의 효과:
- **권고 톤(키워드 매칭) 0건** 달성
- 정량 가드(`exit 1`/`fail`/`MUST`)로 모두 reframe
- 14건 변환 / 24 SKILL.md 작업 / 약 25분 소요

---

## 2026-04-17 Session 2 — 가드 14개 구현 완료

- 신규 .js/.ts 13개 (scripts/validate-*.js + validate-scene-grammar.ts)
- postprocess.sh 게이트 체인 7 → 19 (⑥-g ~ ⑥-r 삽입)
- 모든 가드 smoke test 통과 (0417-테스트 / 테스트 / 데모 프로젝트)
- wrapped `{scenes: []}` vs raw `[]` 양 형식 호환
- 실제 데이터 결함 자동 검출 확인:
  - motion-variety → 114건 (preset 단조, fadeUp 독점)
  - tabular → StatNumber/NumberCircle 에 tabular-nums 누락
  - svg-motif-count → 75건 (motif_ids 4~5개 플랜)
  - label-quality → 기존 가드도 scene-12 FreeText % 중복 검출

---

## 한 문장 요약

> **24개 SKILL.md 의 dangling 가드 14개가 모두 구현·postprocess 통합되어 hard-gate 로 작동하며, 실제 데이터에서 motion-variety 114건 등 의미있는 결함을 즉시 검출했다.**
