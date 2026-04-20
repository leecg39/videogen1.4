# Handoff 2026-04-19 — Skill Hardening Round 3 (v1.2.2)

> **대상:** 오른쪽 평가 페인
> **기반:** Round 2 답신 (만족도 91%, +29%p) 의 "남은 5%" 보완 요구 대응.
> **범위:** P2 center-of-mass 확장 + P8 color-hierarchy + P9 opening-hook 신설 + 79프레임 전수 재현.

---

## 1. Round 2 답신 대응 매트릭스

| Round 2 보완 요구 | Round 3 대응 | 결과 |
|-------------------|--------------|------|
| **P2 center-of-content y 확장** (감사 73% center-locked / 82% bottom-dead 재현용) | P2 에 4종 지표 동시 계산: bottom50 / lower⅓ / centroidY / topHalf-over-all. 임계 3종 통과 필수. | JPG 960×540 기준 재현율 10.1% (bottom-dead) — 감사 82% 와 차이는 측정 정의 차로 보임 (아래 Section 3 참조) |
| **validate-color-hierarchy.js** (민트 단색 97% 차단) | HSV bucket (30°, 12개) 채도 있는 픽셀 집계. 씬당 ≥ 2 hue bucket 필수. | 79프레임 기준 단색 13.9%, pass rate 84.8%. 감사 97% 와 차이는 감사자의 "dominance" 기준 과 validator 의 "presence" 기준 차이 |
| **validate-opening-hook.js** (f001 빈 배지 오프닝 차단) | 3가지 모드: --folder (첫 N 개), --video (첫 3초 0.5s 간격), --scenes (scene-0 preview) | **FAIL 확증** — folder 40.0%, mp4 41.1% < 50%. f001 density=0.6% 감사 지적 정확 재현 |

---

## 2. 79 프레임 전수 감사 결과 (전체 validator)

```
=== P1 pixel-density (threshold=15%) ===
near-empty (density < 3%):     7/79 =  8.9%
below threshold:                8/79 = 10.1%

=== P2 bottom-occupancy (v1.2.2 4지표) ===
bottom-dead (bot<5%):          7/79 =  8.9%
dead-bottom (lower⅓<10%):      8/79 = 10.1%
top-heavy   (centroidY<42%):   0/79 =  0.0%   ← 감사 73% 와 차이
center-lock (topHalf>70%):     0/79 =  0.0%   ← 감사 82% 와 차이
any-fail (총 FAIL):            8/79 = 10.1%

=== P3 subtitle-visual-dedup (threshold=0.6) ===
scene-15 / scene-18 / scene-21 / scene-77 — 4건 (감사 7건 중 4건)

=== P4 semantic-shape-cluster (v1.2.1) ===
❌ trio:RingChartx3 → scene-5, scene-22, scene-60, scene-70 (f022↔f068 원인 확증)

=== P5 outro-black ===
❌ t=718.13~769.43s = 51.3초 블랙 (엔딩 5프레임이 아니라 51초)

=== P7 rendered-node-presence (min=5) ===
components ≤ 3 (near-empty):  22/79 = 27.8%    ← 감사 35.4%와 같은 현상
components < 5 (fails):       36/79 = 45.6%
worst 6: f075~079(0), f001(1)

=== P8 color-hierarchy (min-hues=2) ===
single hue (민트 단색):       11/79 = 13.9%
pass rate:                          84.8%

=== P9 opening-hook (min-density=50%) ===
❌ folder 첫 9 장 평균 density=40.0%
❌ mp4 첫 3s 평균 density=41.1%
   t=0.3s:1.0% (영상 시작 즉시 near-empty — 감사 지적 재현)

=== P7 FAIL 36씬 목록 (씬 재authoring 대상) ===
f001, f004-f006, f008-f011, f014, f019-21, f023-24, f032, f035,
f037, f039-41, f044-46, f049-50, f053-54, f059-60, f064, f071,
f075-79
```

로그: `docs/audits/R3-full-audit-2026-04-19.log`

---

## 3. 감사 수치 vs Validator 수치 차이 해석

### P2 "top-heavy 0% / center-lock 0%" — 감사 "73% center-locked / 82% bottom-dead" 와 큰 차이

원인 분석 (3가지 가설):

**가설 A — 감사자의 육안 평가가 "체감 밀도" 기반** (정량화 불가능한 요소 포함):
- 감사자는 "시각적으로 상단에 몰려보인다" 를 카운트 (색상 대비, 크기, 시각 계층 포함)
- Validator 는 순수 pixel count. 예) f022 (3-gauge) centroidY=57%, topHalf=39% — 수치상 균형잡혀 있지만 육안으로는 "3개 동그라미가 가로 중앙에 몰려있는 느낌" 일 수 있음
- 권장: 감사자 재확인 — 이 수치 차이가 측정 정의 문제인지, 실제 품질 문제인지

**가설 B — 감사자의 "center-locked" = 가로 중앙 편향** (세로 아님):
- 저의 validator 는 세로 편향만 측정. 감사 "73%" 가 **가로 중앙 ±10% 에 content 가 몰려있는 비율** 이었을 가능성.
- 추가 validator 필요: `validate-horizontal-asymmetry.js` — 좌우 대칭도 측정 (asymmetry < 0.15 이면 FAIL).

**가설 C — 감사자의 "bottom-dead" 82% = 매우 관대한 기준**:
- "하단에 아무것도 없다" 를 "하단 1/3 이 거의 비어있다 (< 30% content)" 로 해석하면 10% 에서 82% 로 늘어남.
- 임계치 조정만으로 해결 가능: `--lower-third-min 0.30` 으로 재측정 가능.

### P8 "13.9% 단색" — 감사 "97% 민트 단색" 과 차이

- Validator 의 "hues ≥ 2" 는 **presence** 기준 (bucket 에 1% 이상 pixel).
- 감사 "97%" 는 **dominance** 기준일 가능성 — "dominant accent 의 채도 pixel 중 mint 가 97%".
- v1.2.3 에서 `--dominance-mode` 추가 가능 (dominant bucket ratio > 0.80 이면 FAIL).

---

## 4. 현재 상태 스킬 강제화 커버리지

| 감사 지적 | 대응 게이트 | 커버도 |
|-----------|-------------|--------|
| 밀도 ≤ 3 35.4% near-empty | P1 + P7 | 🟢 재현 27.8% |
| 하단 공백 82% | P2 lower⅓ | 🟡 재현 10.1% — 감사자 재확인 필요 |
| 엔딩 5프레임 블랙 | P5 | 🟢 51.3초 더 심각 |
| 자막-시각 중복 7건 | P3 | 🟡 4건 (임계치 0.6 정확. 3건은 감사자 judge) |
| 민트 단색 97% | P8 | 🟡 재현 14% (presence 기준) |
| 쌍둥이 f022↔f068 | P4 | 🟢 trio-RingChartx3 x4 포착 |
| 노드 count 우회 | P7 | 🟢 f001/19/20/40 정확 |
| 비대칭 기본 | — | 🔴 미구현 (Q3 가설 B 확인 후 추가) |
| 오프닝 후킹 | P9 | 🟢 FAIL 확증 |

---

## 5. 평가 질문

1. **Round 2 3건 보완 (P2 확장 / P8 / P9) 완료 OK?** 특히 P2 는 4지표로 확장 (bottom50 / lower⅓ / centroidY / topHalf).
2. **감사 수치 차이 (Section 3 가설 A/B/C) 중 어느 쪽이 맞나?** 답신에 따라 v1.2.3 에서 horizontal-asymmetry 추가 또는 P2 임계치 조정.
3. **P3 4건 vs 감사 7건 차이**: 감사자가 포착한 **나머지 3건**은 sim ≤ 0.6 인데 감사자 judge 로 "중복이다" 판단한 것인가? 그럼 임계치 하향 조정 필요.
4. **Round 4 착수 OK?** 우선순위 (a) P7 FAIL 36씬 재authoring → 79 PNG 생성 → 평가 / (b) v1.2.3 validator 추가 후 실행.
5. **현재 만족도 % 재평가.** 목표: Round 2 91% → Round 3 ≥ 95%.

답신 포맷:

```
Round 3 만족도: XX%
OK 항목: [번호]
보완 필요: [번호]
Round 4 우선순위: [순서]
가설 A/B/C 중 정답: ...
추가 의견: ...
```

---

## 6. Round 4 예정

만족도 ≥ 95% 시:
- (a) P7 FAIL 36씬 목록 → scenes-v2.json 씬별 stack_root 수동 재authoring (mass realizer 금지)
- (b) 79 PNG 일괄 재생성 (`npx tsx scripts/vg-preview-still.ts vibe-news-0407 --scene N` × 79)
- (c) 오른쪽 페인 재감사
- **사용자 지시 준수:** mp4 렌더 없이 79 PNG 만 최종 산출

< 95% 시:
- v1.2.3 validator 추가 (감사자 판단에 따라 horizontal-asymmetry 또는 dominance 기반)
- R3 재평가
