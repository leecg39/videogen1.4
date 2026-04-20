# Handoff 2026-04-19 — Skill Hardening Round 1 (v1.2 Pixel Gate)

> **대상:** 오른쪽 평가 페인
> **목적:** 2026-04-19 vibe-news-0407 79프레임 감사의 근본 원인("schema 통과, 픽셀 통과 미검증") 에 대한 **스킬 레벨 강제화** 1라운드 완료 보고. 95% 만족도까지 반복 루프 1/N.
> **범위:** 규칙 문서 + 스킬 3종 SKILL.md + 5종 validator 구현. **이번 라운드에서 실제 mp4 재렌더는 없음** (스킬 강제화 우선).

---

## 1. 진단 요약 (오른쪽 페인 보고 복습)

| 지표 | 결과 | HF 기준 | 판정 |
|------|------|---------|------|
| 밀도 ≤3 (near-empty) | 28/79 = 35.4% | 0% | 🔴 |
| 하단 dead-space | 65/79 = 82% | ≤20% | 🔴 |
| 엔딩 5프레임 블랙 | f075~f079 | 0 | 🔴 치명 |
| 자막-시각 텍스트 중복 | 7건 | 0 | 🔴 |
| Semantic shape 쌍둥이 | f022↔f068, f010↔f060, terminal×4 | cluster ≤2 | 🔴 |
| 노드 count 우회 의혹 | ZERO-TOLERANCE 통과 씬에 노드 1~2개 | 통과 씬 ≥5 | 🔴 |

**근본 진단 (우리 수용):** "schema 가드는 완성, 픽셀 가드는 구멍."

---

## 2. 작업 범위 (A~E)

### A. `.claude/rules/scene-grammar.md` v1.1 → **v1.2** 승격

- 헤더: v1.2 핸드라인 진단 블록 추가 (35.4%/82%/블랙/7건/쌍둥이/우회 6줄 진단).
- Section 11 체크리스트 확장: Phase A 검증에 P1~P4 추가, **Phase "렌더 후 검증 시" 신설** (P5 + rendered-node-presence + 무작위 3씬 밀도).
- **Section 12 신설 — "픽셀 레벨 HARD GATE (v1.2 핵심)"**:
  - 12.1 게이트 목록 5종 (P1~P5)
  - 12.2 Goodhart 방지 (노드 count 우회)
  - 12.3 ZERO-TOLERANCE 원칙 (bypass 금지)
  - 12.4 운영 플로우 (Phase A 제출 흐름)
- 기존 Section 12 "마인드셋" → Section 13 으로 밀기, v1.2 격언 한 줄 추가.
- 부록 테이블 22~27번 validator 6종 신규 등록 (D+1 = 2026-04-19 ship 기록).
- 갱신 로그 v1.2 entry.

### B. `.claude/skills/vg-layout/SKILL.md` — 픽셀 게이트 ABSOLUTE 승격

"🚨 PIXEL LEVEL HARD GATE v1.2 (2026-04-19 79프레임 감사 대응 — ABSOLUTE)" 섹션 삽입 위치: 기존 HYPERFRAMES 가드레일 (postprocess ⑥-s ~ ⑥-v) 직후.

내용:
1. **씬 단위 Phase A 제출 플로우** (4단계 필수 커맨드)
2. **ABSOLUTE 표 (P1~P4)** + 각 게이트의 차단 대상 증거
3. **Goodhart 방지 — 노드 count 통과 ≠ 실제 노드 렌더** (PNG 육안 재검증 체크리스트 4항목)
4. **환경변수 bypass 금지 (ZERO-TOLERANCE)**
5. **Phase A 제출 전 통합 체크 (9단계 플로우)**

금지사항 리스트에 9번 항목 추가: `[v1.2 ABSOLUTE] 씬마다 픽셀 게이트 P1~P4 통과 필수`.

### C. `.claude/skills/vg-scene/SKILL.md` — pattern-picker 제약 신설

신설 섹션: "🚨 v1.2 — visual_plan 제약 강화"
- **pattern-picker 제약 — 직전 3 씬 semantic cluster 금지** (pickVisualPlan 내부 로직 4단계 추가)
- **자막 ↔ 노드 text dedup 사전 차단** (focal.label / support[].text 결정 시 Levenshtein similarity > 0.6 이면 요약/은유/추상화 치환, 3회 재시도 후 FAIL)
- **렌더 ready 판정 체크리스트** (scene-plan.json 커밋 전 4항목)
- **`--skip-pixel-guard` 플래그 없음 (ZERO-TOLERANCE)**

### D. `.claude/skills/vg-render/SKILL.md` — outro 블랙 스캔 HARD GATE

최상단 신설: "🚨 v1.2 — OUTRO 블랙 스캔 + 사전 점검 HARD GATE (2026-04-19)"
- **렌더 전 사전 점검** 2단계:
  - Step 0-a. 마지막 씬 stack_root / allow_exit / duration_frames ≥ 30 검사
  - Step 0-b. scenes-v2 frame 합 == render-props durationInFrames 일치
- **렌더 후 블랙 스캔** (ffprobe blackdetect, 마지막 2초 블랙 1개라도 있으면 exit 1 + mp4 삭제)
- **렌더 후 픽셀 밀도 샘플** (무작위 3 씬 PNG 밀도 ≥ 15%)
- **`VG_SKIP_OUTRO_SCAN=1` 같은 bypass 금지**

### E. 픽셀 validator 5종 구현 (scripts/)

| # | Validator | 증거/스모크 결과 |
|---|-----------|----------------|
| P1 | `validate-pixel-density.js` | PNG 모드 + `--video mp4 --samples N` 모드. scene-0 hero.png density=52.99% (PASS) |
| P2 | `validate-bottom-occupancy.js` | 자막바 하단 160px 제외한 하단 50% 영역 content 비율. scene-0 bottom occupancy=67.80% (PASS) |
| P3 | `validate-subtitle-visual-dedup.js` | Levenshtein similarity > 0.6. **scene-77 "다음에 또 만나요" 중복 감지 확증** (감사 7건 중 1건 재현) |
| P4 | `validate-semantic-shape-cluster.js` | signature = `pattern_ref|focal.type|node seq`. window=3 cluster ≤2 + global ≤4. scenes-v2.json 전수 PASS (감사 쌍둥이는 signature 가 달랐던 것 — 게이트가 f022↔f068 를 잡으려면 bbox 기반 signature 확장 필요, v1.2.1 예정) |
| P5 | `validate-outro-black.js` | ffprobe blackdetect. pix_th=0.03 으로 다크 틴트 배경 오탐 방지. **vibe-news-0407.mp4 tail 51.3초 블랙 감지 (t=718~769s)** — 보조 증거로 t=760s 샘플 density=0.00% 확증 |

### 스모크 테스트 결과 (요약)

```
$ node scripts/validate-pixel-density.js output/preview/vibe-news-0407-scene-0-hero.png
✅ [PASS:pixel-density] density=52.99%

$ node scripts/validate-bottom-occupancy.js output/preview/vibe-news-0407-scene-0-hero.png
✅ [PASS:bottom-occupancy] bottom50% occupancy=67.80%

$ node scripts/validate-subtitle-visual-dedup.js data/vibe-news-0407/scenes-v2.json --scene 77
❌ [FAIL:subtitle-visual-dedup] scene-77 중복 1건
  node="다음에 또 만나요 · 랩장" ↔ subtitle="다음에 또 만나요" (sim=0.778)

$ node scripts/validate-outro-black.js output/vibe-news-0407.mp4
❌ [FAIL:outro-black] output/vibe-news-0407.mp4 (dur=769.51s)
  black: 718.13s ~ 769.43s (dur=51.300s)
```

---

## 3. 평가 포인트 (오른쪽 페인이 검토할 것)

### 3-a. 강제력 질문

| 체크 항목 | 질문 |
|----------|------|
| 픽셀 게이트가 SKILL.md ABSOLUTE 섹션에 박혔나? | vg-layout "🚨 PIXEL LEVEL HARD GATE v1.2" / vg-render "🚨 v1.2 OUTRO 블랙 스캔" / vg-scene "🚨 v1.2 visual_plan 제약" 세 위치에 명시 |
| 금지사항 리스트에 추가 되었나? | vg-layout 금지사항 9번 신규 추가 (`[v1.2 ABSOLUTE] 씬마다 픽셀 게이트 P1~P4 통과 필수`) |
| bypass 경로가 차단 되었나? | scene-grammar Section 12.3 + vg-layout "환경변수 bypass 금지" + vg-render "`VG_SKIP_OUTRO_SCAN=1` 금지" 세 곳에 명시 |
| 우회 검증기의 Goodhart 문제가 지적 되었나? | scene-grammar Section 12.2 + vg-layout "Goodhart 방지" 섹션에 명시. rendered-node-presence validator (도구 27번, D+3 예정) 로 근본 해결 |

### 3-b. validator 5종 커버리지 질문

| 감사 지적 | 대응 validator | 커버? |
|-----------|---------------|------|
| 밀도 ≤3 35.4% | P1 pixel-density | ✅ |
| 하단 공백 82% | P2 bottom-occupancy | ✅ |
| 엔딩 5프레임 블랙 | P5 outro-black | ✅ |
| 자막-시각 중복 7건 | P3 subtitle-visual-dedup | ✅ (증거: scene-77 감지) |
| Semantic 쌍둥이 (f022↔f068) | P4 semantic-shape-cluster | 🟡 부분 — window/global count 는 작동하나 bbox 기반 signature 확장 필요 (v1.2.1) |
| 민트 단색 97% | 기존 `validate-fidelity.js` | ✅ |
| 노드 count 우회 | 27번 `validate-rendered-node-presence.js` | ⏳ D+3 예정 |

### 3-c. 검증기 자체 건강성 질문

- P4 가 현재 scenes-v2.json 78씬 전수 PASS 이지만 감사는 쌍둥이 지적 → signature 가 너무 느슨한가? 엄격한 bbox 기반 signature 로 v1.2.1 확장 필요?
- P5 가 pix_th=0.03 으로 다크 틴트 배경 오탐 방지했는데, 과소검출로 진짜 "약간 어두운" 프레임을 놓치지는 않는가?
- P3 similarity 임계치 0.6 이 적절한가 (scene-77 "다음에 또 만나요 · 랩장" ↔ "다음에 또 만나요" sim=0.778 로 걸렸음)?

### 3-d. 아직 남은 구멍 (D+3 / D+10 예정 작업)

- **27번 `validate-rendered-node-presence.js`** (D+3, P1 우선순위) — 노드 count 검증기 우회의 근본 해결. 렌더된 PNG에서 OCR 또는 contrast mask 로 실제 보이는 요소 카운트.
- **P4 bbox 기반 signature 확장** (v1.2.1) — 현재 `pattern_ref|focal.type|node seq` 에 bbox quadrant 포함 예정.
- **색상 의미 위계 token** (P1 권고) — theme.ts `accent.success/warn/danger/info` 분리. scene-grammar 룰 추가.
- **비대칭 강제 validator** (P1 권고) — 노드 bbox 중심점이 화면 중앙 ±10% 에 몰린 비율 < 60% 강제.
- **오프닝 3초 후킹 강도** (P1 권고) — scene-0 빈 배지 차단.

---

## 4. 반복 루프 설계 (user 지시: 95% 만족도까지)

현재 Round 1 = **스킬 강제화 완료**. 이후 루프:

### Round 2 (제안)

A. **27번 rendered-node-presence validator 구현** (D+3 워크 조기 선행).
B. **P4 bbox signature 확장 → v1.2.1 패치**.
C. **vibe-news-0407 전체 씬 레이아웃 재authoring** (스킬이 강제한 픽셀 게이트 5종 통과까지).
D. **전체 씬 PNG 79장 생성** (렌더 X, `vg-preview-still` 일괄 실행) → `output/preview/vibe-news-0407-v2/scene-NN.png`.
E. 오른쪽 페인에 Round 2 결과 전달 → 평가.

**사용자 지시 핵심:** "마지막에 영상을 렌더링하지 말고 전체 씬의 대표 프레임을 만들고 그 프레임 결과를 평가받도록 해." → Round 2 최종 산출은 mp4 가 아니라 **79 PNG 묶음**.

### Round 3 이후

평가 결과 만족도 < 95% 면 실패 원인별 재작업. 만족도 ≥ 95% 면 최종 렌더 (P5 outro-black 게이트 통과 확인 후).

---

## 5. 파일 디프 경로 (리뷰어가 Read 할 것)

```
.claude/rules/scene-grammar.md                    (v1.1 → v1.2)
.claude/skills/vg-layout/SKILL.md                  (Section v1.2 추가 + 금지사항 9번)
.claude/skills/vg-scene/SKILL.md                   (섹션 v1.2 제약 신설)
.claude/skills/vg-render/SKILL.md                  (최상단 outro 블랙 스캔 HARD GATE)
scripts/validate-pixel-density.js                  (신규)
scripts/validate-bottom-occupancy.js               (신규)
scripts/validate-outro-black.js                    (신규, pix_th=0.03)
scripts/validate-subtitle-visual-dedup.js          (신규)
scripts/validate-semantic-shape-cluster.js         (신규)
```

---

## 6. 질문 ("평가 페인이 이것만 답해 주세요")

1. **스킬 강제화 방향 OK?** (schema 통과 != 픽셀 통과, ZERO-TOLERANCE, bypass 금지) — ✅ / ⚠️ / ❌
2. **5종 validator 커버리지 충분?** (감사 지적 7개 중 6개 직접 커버, 1개는 D+3 rendered-node-presence) — ✅ / ⚠️ / ❌
3. **P4 semantic-shape-cluster 가 현재 scenes-v2 전수 PASS 인데, 감사 쌍둥이는 왜 못 잡았나?** signature 확장 방향 제안 주세요. (bbox quadrant / pattern_ref 불일치 / focal.type 동일성 기준 등)
4. **Round 2 착수 OK?** (rendered-node-presence 먼저 vs 씬 재authoring 먼저 — 우선순위)
5. **만족도 % 평가** (현재 Round 1 결과에 대한 총평 0~100%).

답신 포맷:

```
Round 1 만족도: XX%
OK 항목: 1,2
보완 필요: 3,4
Round 2 우선순위: [A/B/C/D/E 중 순서]
추가 의견: ...
```
