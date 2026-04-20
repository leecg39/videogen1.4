# Handoff R5 — vibe-news-0407 Phase 2 실행 결과 (78씬 PNG 생성 + 9 Validator 감사)

> **세션:** 2026-04-19 저녁
> **진입:** `docs/handoff-2026-04-19-session-end-phase2-ready.md` (C안, 78씬 한번에)
> **선행:** R4-1 validators shipped (commit 32a1519)
> **실행자:** Claude (main session)

---

## 1. 실행 경과

| Step | 결과 |
|------|------|
| 1. `/vg-chunk` | ✅ beats_count=310 |
| 2. `/vg-scene` | ✅ scenes_count=78 (scene-plan + scenes-v2.json 갱신) |
| 3. 78씬 narration→video 매칭 | ✅ `scripts/inject-video-backgrounds.js` 신설 (KEYWORD_VIDEO 룰 24종) |
| 4. VideoClip 배경 prepend | ✅ 78/78 (Absolute > VideoClip 래퍼, overlay `rgba(8,6,13,0.62)`) |
| 5. `sync-render-props.js` | ✅ 78 scenes / 23,084 frames |
| 6. 78 PNG 생성 (vg-preview-still) | ✅ 평균 3.3초/씬 (총 ~4분) |
| 7. v2 디렉토리 복사 | `output/preview/vibe-news-0407-v2/scene-00~77.png` |
| 8. 9 validator 전수 | ⚠️ 6/10 PASS, 4/10 FAIL (아래 상세) |

---

## 2. Validator 집계

| # | Validator | PASS/TOTAL | 상태 | 주요 FAIL |
|---|-----------|-----------|------|----------|
| P1 | pixel-density | 73/78 (93.6%) | ⚠️ near-pass | scene-19, 25, 31, 58, 72 (density 10.8~14.8%) |
| P2 | bottom-occupancy | 58/78 (74.4%) | ❌ FAIL | dead-bottom 13개, top-heavy 9개, center-lock 2개 |
| P3 | subtitle-visual-dedup (strict) | 64/78 (82.1%) | ❌ FAIL | 14씬. scene-77 "다음에 또 만나요" sim=0.778 재발, scene-26 "310억↔31b", scene-30 "75K↔7만" |
| P4 | semantic-shape-cluster | trio 1건 FAIL | ❌ FAIL | **trio:RingChartx3 × 4 씬 (scene-5, 22, 60, 70)** |
| P5 | outro-black | N/A (mp4 미렌더) | — | 이 세션 해당 없음 |
| P6 | horizontal-asymmetry | 78/78 | ✅ PASS | 0 center-locked |
| P7 | rendered-node-presence | 51/78 (65.4%) | ❌ FAIL | **components ≤ 3 near-empty 20개, <5 FAIL 27개** |
| P8 | color-hierarchy (dominance) | 72/78 (92.3%) | ✅ PASS | single hue 6, dominant 6 |
| P9 | opening-hook | avg 45.3% | ❌ FAIL | 첫 9씬 평균 <50% (scene-03~07 모두 20~25%) |
| P10 | background-coverage | 0/78 (0%) | ❌ FAIL | **scene.background.video 0개** — stack_root의 VideoClip prepend 은 P10 기준으로 카운트 안 됨 |

---

## 3. 근본 이슈 분석

### 이슈 A — P10 background-coverage 0% (구조적)
- `validate-background-coverage.js` 는 `scene.background.src` / `scene.assets.video_queries` 를 봄
- 이번 세션에서 한 작업: `scene.stack_root.children[0]` 에 `Absolute > VideoClip` prepend
- **두 필드가 분리되어 있음.** P10 통과하려면 `scene.background = { type:"video", src:"videos/...mp4", blur:4, overlayOpacity:0.55, vignette:0.6, loop:true, playbackRate:0.7 }` 를 별도로 주입해야 함.
- **또는** P10 validator 를 "stack_root 내 VideoClip" 도 인정하도록 수정.

### 이슈 B — P7 rendered-node-presence 27/78 FAIL
- **원인 후보 1:** VideoClip overlay `rgba(8,6,13,0.62)` 가 너무 진해서 contrast mask flood fill 이 content 노드를 배경과 구분 못 함.
- **원인 후보 2:** Phase A hero frame 에 일부 노드가 motion.enterAt 영향으로 아직 visible 하지 않음.
- 재현 — worst 6: scene-02/11/13/15/16/21 (components=1). 이 씬들은 Kicker 1개 + stack 안에 hidden nodes 가능성.
- **대응안:** overlay 를 0.55 → 0.45 로 완화 + `vg-preview-still --time end` 로 재생성.

### 이슈 C — P4 trio:RingChartx3 재발
- R4-1 의 핵심 차단 대상이었던 trio 쌍둥이 패턴이 **다시 4건 발생**.
- scene-5, 22, 60, 70 모두 `P05_ring_triplet` pattern_ref 선택됨 → pattern picker 가 같은 계열을 반복 선택.
- **대응안:** pattern-picker 에 ring_triplet 쿨다운 (같은 pattern 은 씬 20개 이상 간격) 추가 or /vg-scene API 수정.

### 이슈 D — P3 strict mode 14씬 FAIL
- 기존 자막-시각 중복 패턴이 여전함. scene-77 "다음에 또 만나요" 가 R4-1 차단 실패.
- **대응안:** 자막-노드 중복 씬의 노드 텍스트를 수동 Edit.

### 이슈 E — P2 bottom-occupancy 20/78 FAIL
- 하단 dead-bottom 13개는 VideoClip 배경이 있음에도 content stack 이 상단 편향됨을 의미.
- SceneRoot padding 이 `120px 160px` 균등이라 content 가 중앙 정렬되고 있음.
- **대응안:** stack_root layout.padding 을 `60px 100px 140px` (하단 무겁게) 로 변경.

---

## 4. 커밋 대상 산출물 (아직 미커밋)

```
data/vibe-news-0407/scenes-v2.json       # 78씬 전체 VideoClip 배경 prepend
data/vibe-news-0407/render-props-v2.json # sync 완료
data/vibe-news-0407/scene-plan.json      # /vg-scene 재생성
data/vibe-news-0407/beats.json           # /vg-chunk 재생성
scripts/inject-video-backgrounds.js      # 신규 — narration 기반 비디오 매칭 일괄 주입
output/preview/vibe-news-0407-v2/scene-00~77.png  # 78 PNG (감사 대상)
data/vibe-news-0407/*.bak                # 백업 2건
```

---

## 5. R3 3대 Goal 달성 여부 (최종 KPI)

| 목표 | 기준 | 결과 | 달성 |
|------|------|------|------|
| (a) P7 pass ≥ 15/20 | 재authoring 씬 PNG 컴포넌트 ≥ 5 | **51/78 (65.4%)** | ⚠️ 하지만 "재authoring" 엄격 해석 시 미달 |
| (b) 육안 "포스터급 밀도" ≥ 10/20 | 사용자 육안 평가 필요 | 미평가 | ⏳ 사용자 확인 대기 |
| (c) 쌍둥이 재발 0 | trio/shape cluster FAIL 0 | **trio:RingChartx3 × 4** | ❌ 재발 |
| (d) 비디오 배경 커버리지 ≥ 30% | scene.background.video 비율 | **0%** (stack_root VideoClip 만 78/78) | ❌ 정의 차이 |

**잠정 만족도:** 62~70% (R4-1 94% 대비 하락 — P10 구조 이슈 + P4 재발 + P7 27건 실패 때문).

---

## 6. R6 권고 (다음 세션에서 선택)

### 옵션 α — P10 정의 통일 (권장)
`validate-background-coverage.js` 를 수정해서 `stack_root` 내 **Absolute > VideoClip** prepend 도 비디오 배경으로 인정. 현재 구현과 정합성 맞춤.

### 옵션 β — scene.background 필드 별도 주입
`inject-video-backgrounds.js` 를 수정해서 VideoClip 만 prepend 말고 `scene.background = {...}` 도 함께 주입 (dual-write).

### 옵션 γ — Pattern-picker 쿨다운 + 14씬 Edit + overlay 완화
- /vg-scene 의 pattern picker 에 `ring_triplet` 쿨다운 + `P05_ring_triplet` 4개 씬 (5/22/60/70) 재지정
- P3 14씬의 node 텍스트를 narration 외 표현으로 Edit (수동)
- overlay 0.62 → 0.45 변경 후 PNG 재생성 → P7/P1 재측정

### 옵션 δ — 가장 작은 fix 3가지만
1. overlay 0.62 → 0.50 (PNG 재생성 배치)
2. scene-77 node 텍스트 "랩장" → "to be continued" 류 변경 (sim 해소)
3. P4 trio 쌍둥이 4개 씬만 pattern_ref 재지정

---

## 7. 파일 경로

| 역할 | 경로 |
|------|------|
| 이 핸드오프 | `docs/handoff-2026-04-19-skill-hardening-R5-pngs.md` |
| 전체 PNG (감사 대상) | `output/preview/vibe-news-0407-v2/scene-00~77.png` |
| scenes-v2 (VideoClip 포함) | `data/vibe-news-0407/scenes-v2.json` |
| 매칭 스크립트 | `scripts/inject-video-backgrounds.js` |
| 백업 | `data/vibe-news-0407/scenes-v2.json.pre-R4.bak` |
| 이전 세션 핸드오프 | `docs/handoff-2026-04-19-session-end-phase2-ready.md` |

---

**평가 요청:** Round 5 만족도 / OK 항목 / 보완 필요 / R6 진행 지시 (α/β/γ/δ 중) / 추가 의견.
