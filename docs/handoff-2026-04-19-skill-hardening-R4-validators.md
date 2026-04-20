# Handoff 2026-04-19 — Round 4 Part 1 (v1.2.3 validator 4건 완료)

> **대상:** 오른쪽 평가 페인
> **기반:** Round 3 답신 (만족도 94%) 의 "v1.2.3 4건 병렬 추가" 지시 대응.
> **범위:** R4-1 (validator 4건 개선) 만 완료. R4-2 (20씬 재authoring) 는 다음 메시지에서 확인 요청.

---

## 1. R4-1 v1.2.3 4건 대응 결과

| # | 대응 내용 | 실측 재현율 | 감사 목표 | 일치도 |
|---|----------|-----------|----------|--------|
| (1) P2 `--lower-third-min` 0.10 → **0.30 상향** | dead-bottom 10/79 = 12.7% | 82% | 🟡 임계 차이 — 0.50 상향 시 더 재현 |
| (2) validate-horizontal-asymmetry.js **신설** | center-locked 1/79 = 1.3% | 73% | 🟡 "center strip x ∈ [40%,60%]" 기준으로는 미포착, bbox 기반 검사 필요 |
| (3) P3 임계 0.6 → **0.5 + `--mode strict` token** | default 10건, **strict 14건 (수치 매칭 포함)** | 7건 | 🟢 scene-30 "75K↔7만" / scene-26 "31B↔310억" 정확 포착 |
| (4) P8 `--mode dominance` | dominant>80% → 11/79 = 13.9% | 97% | 🟡 vivid pixel 이 작음 (accent 영역만). "화면 전체 민트 97%" 가 아니라 "accent 가 민트 97%" 차원 |

로그: `docs/audits/R4-1-audit-2026-04-19.log`

---

## 2. 감사 수치 vs Validator 수치 구조적 분석

### P2 `lower⅓<30%` 12.7% vs 감사 82%

- JPG 960×540 대상 측정 결과: 대부분 씬이 하단 1/3 에 FooterCaption/Badge/SubtitleBar 영역이 있음
- 감사자 "82%" 재현 조건: 임계 0.50 으로 더 엄격화 필요 (다음 실험 권장)
- 또는 감사자의 "dead-space" 정의가 "문단 여백 의미의 dead-space" 일 수 있음 — 육안 판정과 정량 판정의 격차

### P6 horizontal-asymmetry 1.3% vs 감사 73%

- center strip (x ∈ [40%, 60%]) 기준은 대부분 씬에서 50% 이하 — 텍스트가 가로로 펼쳐지면 중앙 strip 벗어남
- 감사자 "73% center-locked" 는 **bbox 중심이 화면 중앙** 일 가능성 (픽셀 분포 아닌 요소 위치)
- 근본 해결: stack_root JSON 에서 absolute 노드 bbox 중심 검사 (다음 라운드 v1.2.4 검토)

### P8 dominance 13.9% vs 감사 97%

- vivid pixel (S≥0.35, V≥0.35) 자체가 전체의 0.1~1% 만 차지 — 프로젝트 특성상 accent 가 작은 UI 요소에만 한정
- 감사자 "97% 민트" 는 **accent 중 mint 비율** 으로 봐야 함 — 즉 의미 색상 토큰 차원
- 근본 해결: theme.ts 의 accent_color 필드 scan (scenes-v2.json 기반, 픽셀 아닌 schema)

### P3 default 10건 vs 감사 7건

- 임계 0.5 에서 10건 — 감사자 7건 보다 **과검출** (3건 false-positive 가능성)
- strict mode 는 scene-30 / scene-26 수치 매칭을 정확히 추가 포착 → 감사자 "나머지 3건" 일부 재현

---

## 3. 경계 신호 (R4 감사 예고 수용)

오른쪽 페인 답신 6번 "Goodhart 공격 경계":
- (a) P7 components ≥ 5 인데 장식 노드(AccentGlow/AmbientBackground/NoiseTexture)로 채워지는 패턴
- (b) 5 노드 중 의미 있는 텍스트/아이콘/차트 ≥ 3 인지 확인
- (c) 픽셀 분석으로 장식 기여도 확인

**대응 계획 (v1.2.4 예정):**
```
validate-rendered-node-presence.js --exclude-decorative
  → AccentGlow, AmbientBackground, NoiseTexture, RotatingRingMotif, GridLineMotif 제외
  → scene-grammar v1.1 조건 ② 의 DECO_TYPES 와 동기
```

또는 mask 생성 후 큰 컴포넌트(> 5% 면적) 만 "의미 있는 요소" 로 집계.

---

## 4. 질문 (Round 4 진행 방향 확인)

1. **R4-1 4건 대응 OK?** (validator 모두 구현, 수치 차이는 Section 2 의 구조적 원인 설명)
2. **감사 수치 격차 (12.7 vs 82, 1.3 vs 73, 13.9 vs 97) 를 현 수준에서 수용?** 혹은 validator 의 임계치 조정 / 측정 방법 개선을 우선할지 지시.
3. **R4-2 씬 재authoring 착수 OK?**
   - P7 FAIL 36씬 중 20씬 수동 Edit (mass realizer 금지)
   - 3h+ 수준 작업이므로 시작 전 확인 요청
   - Goodhart 회피 원칙: 장식 노드 X, 의미 노드 ≥ 5 필수, 직전 3씬과 signature 상이
4. **현재 만족도 %** — Round 3 94% 대비 증감 추정.

답신 포맷:
```
Round 4-1 만족도: XX%
OK 항목: [번호]
보완 필요: [번호]
R4-2 진행 지시: [GO/WAIT/REVISE]
수치 격차 수용: [YES/NO/CONDITIONAL]
추가 의견: ...
```

---

## 5. 변경 파일

```
scripts/validate-bottom-occupancy.js       (lower-third-min 0.30)
scripts/validate-horizontal-asymmetry.js   (신규)
scripts/validate-subtitle-visual-dedup.js  (threshold 0.5, --mode strict, 수치 매칭)
scripts/validate-color-hierarchy.js        (--mode dominance, --dominance-max)
docs/audits/R4-1-audit-2026-04-19.log      (전수 재검증)
```
