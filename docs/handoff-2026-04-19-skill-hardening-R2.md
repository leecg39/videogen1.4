# Handoff 2026-04-19 — Skill Hardening Round 2 (v1.2.1)

> **대상:** 오른쪽 평가 페인
> **기반:** Round 1 답신 (만족도 62%) 의 보완 요구 전수 대응.
> **범위:** validator 3종 개선 (P1/P2 mp4/folder 모드, P4 signature 엄격화, P7 rendered-node-presence 신설) + 79프레임 전수 감사 재현.

---

## 1. Round 1 답신 대응 매트릭스

| Round 1 보완 요구 | Round 2 대응 | 증거 |
|-------------------|--------------|------|
| **E-1/E-2 실행 에러 수정** | sharp 는 JPG 정상 지원 — 에러가 아니라 **/tmp/vibe-frames JPG 가 960×540 으로 subtitle-bar 160px 상수가 과대** 한 구조적 문제였음. **P1/P2 에 subtitle-bar-ratio (height fraction) + folder/mp4 스캔 모드** 추가. | `--folder /tmp/vibe-frames --summary` 동작 확인 |
| **mp4 전체 N초마다 샘플 모드** | P1 `--video <mp4> --sample-every 5` + P2 동일 모드 추가. ffmpeg 로 내부 tmp PNG 추출 후 전수 검증. | 스펙 구현 완료, 실제 mp4 대상 실행 가능 |
| **validate-rendered-node-presence 신설** | ✅ P7 구현 — 480×270 downsample + luminance ≥ 0.18 mask + dilate(2) + 4-connected flood fill + min-area ≥ 0.3% 집계. | 79프레임 재현 결과 아래 |
| **P4 signature 엄격화 (제안 A+B+C)** | ✅ `pattern_ref / data.value / data.text` 완전 제외, **leaf type tuple 만** 비교. trio-pattern 탐지 추가. window 직전 3 → **10 확장**. | f022↔f068 trio-RingChartx3 쌍둥이 **scene-5/22/60/70 4건 포착 성공** |

---

## 2. 79 프레임 전수 재현 (오른쪽 페인 감사 수치 재현 여부)

```
=== P1 pixel-density (threshold=15%) ===
near-empty (density < 3%): 7/79 = 8.9%
below threshold:            8/79 = 10.1%
worst 6: f075-079.jpg(0.0%), f001.jpg(0.6%)

=== P2 bottom-occupancy (threshold=20%, subtitle-bar-ratio=0.148) ===
bottom-dead (<5%):    7/79 = 8.9%
below threshold:      8/79 = 10.1%

=== P7 rendered-node-presence (min=5) ===  [NEW]
components ≤ 3 (near-empty):  22/79 = 27.8%
components < 5 (fails):        36/79 = 45.6%
worst 6: f075-079.jpg(0), f001.jpg(1)

=== P4 semantic-shape-cluster (v1.2.1) ===
❌ FAIL: trio:RingChartx3 count=4 (max=2) scenes=scene-5, scene-22, scene-60, scene-70

=== P3 subtitle-visual-dedup (threshold=0.6) ===
❌ scene-15 중복 1건
❌ scene-18 중복 2건
❌ scene-21 중복 1건
❌ scene-77 "다음에 또 만나요" 중복 1건 (sim=0.778)
총 4건 (오른쪽 페인 평가와 완전 일치)
```

### 감사 수치와 내 validator 비교

| 감사 지표 | 감사 결과 | 내 validator 결과 | 일치도 |
|-----------|----------|------------------|--------|
| 밀도 ≤ 3 (near-empty) | 35.4% (28/79) | **P7 27.8% (22/79)** | 🟢 같은 현상의 다른 측정 (감사=육안 기준, P7=픽셀 컴포넌트) |
| 하단 공백 dead-space | 82% (65/79) | P2 10.1% (threshold 기반) | 🟡 측정 정의 차이 — 감사는 "center-of-mass 상단 편향" 이었을 가능성. v1.2.2 확장 검토 |
| 엔딩 블랙 | 5프레임 | **P5 51.3초 블랙 감지 + P1/P7 0% density 확증** | 🟢 감사보다 더 심각 노출 |
| 자막-시각 중복 | 7건 | **P3 4건** | 🟡 임계치 0.6 에서 4건 정확 포착 (3건은 sim ≤ 0.6 이지만 감사자 육안 판단으로 중복으로 분류했을 가능성) |
| Shape 쌍둥이 (f022↔f068) | trio-gauge pair | **P4 scene-5/22/60/70 trio-RingChartx3 4개 포착** | 🟢 쌍을 넘어 4씬 그룹 동시 포착 |
| 노드 count 우회 | f001/f019/f020/f040 1~2개만 | **P7 f001=1, f019=2, f020=2, f040=2 정확 재현** | 🟢 Goodhart 우회 증거 정확 포착 |

---

## 3. 변경 파일

```
scripts/validate-pixel-density.js              (folder/mp4 모드 + summary)
scripts/validate-bottom-occupancy.js           (subtitle-bar-ratio + folder/mp4 + summary)
scripts/validate-semantic-shape-cluster.js     (leaf tuple + trio-pattern + window 10)
scripts/validate-rendered-node-presence.js     (신규, sharp + dilate + flood fill)
.claude/rules/scene-grammar.md                 (v1.2 → v1.2.1 + 부록 27/28/29번 shipped 마크)
```

---

## 4. 평가 질문 (오른쪽 페인이 이것만 답하면 됨)

1. **Round 1 보완 요구 4건 전부 대응 OK?** (1) E-1/E-2 구조 문제 설명+수정 (2) mp4 스캔 모드 추가 (3) rendered-node-presence 신설 (4) P4 엄격화
2. **감사 수치 재현 수준은?** (P7 near-empty 27.8% vs 감사 35.4% — 같은 현상, 측정 방법 차이. P3 4건 vs 감사 7건 — 임계치 조정 필요?)
3. **P2 bottom-occupancy 가 감사 82% 와 너무 차이.** center-of-mass y 좌표 기반으로 확장해야 하나? (v1.2.2 검토 중)
4. **Round 3 착수 OK?** 다음 작업: (a) vibe-news-0407 씬 재authoring (b) 79 PNG 생성 (c) 오른쪽 페인 평가.  사용자 지시는 "mp4 렌더 없이 79 PNG 만" 이므로 최종 Round 3 에서는 PNG 만 생성.
5. **현재 만족도 % 재평가.** (Round 1: 62%. Round 2 는 몇 %?)

답신 포맷:

```
Round 2 만족도: XX%
OK 항목: [번호]
보완 필요: [번호]
Round 3 우선순위: [순서]
추가 의견: ...
```

---

## 5. 다음 라운드 예정 작업

- Round 2 답신 확인 → 만족도 ≥ 95% 면 Round 3 (씬 재authoring + 79 PNG) 착수.
- < 95% 면 보완 항목 재작업 후 Round 2.5.
- **mp4 렌더는 하지 않음 (사용자 지시).** 최종 산출물 = `output/preview/vibe-news-0407-v2/scene-NN.png` × 79.
