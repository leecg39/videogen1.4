# Handoff 2026-04-18 — 1차 배치 완료 (scene-28~37) + 2~4차 대기

## Context

이전 세션 (`handoff-2026-04-18-scene-grammar-v1.1-42scenes.md`) 에서 분할한 4회 배치 중 **1차 (scene-28~37)** 수동 재설계를 완료했다. pattern builder 흔적 제거, 각 씬 narration 기반 고유 구조, preview PNG 10장 모두 Read 검증.

---

## ✅ 완료 (이번 세션)

### 10씬 수동 재설계 (scene-28~37)
- 스크립트: `scripts/_redesign-28-37-batch1.mjs` — 9개 씬 인라인 authoring + scene-35 메타만 업데이트
- 각 씬 `phase: "B"`, `hero_frame_ms`, `preview_reviewed_at` (2026-04-17T17:54:23.453Z) 기입
- preview PNG 모두 4초 이내 렌더 + 시각 확인 완료 (`output/preview/vibe-news-0407-scene-{28..37}-hero.png`)

| 씬 | narration 핵심 | 재설계 구조 |
|----|---------------|-----------|
| 28 | Claude Sonnet 벤치마크 공개 + MLX 결합 | Kicker + Split(arrow) Claude↔유로AI + Stack(row) MLX + Footer |
| 29 | 속도 3~4배 + vLLM 정의 | Kicker + Split(3:4) ImpactStat + FrameBox(vLLM 정의) + Footer |
| 30 | 주방장 비유 + 75K ★ | Kicker + Split(line) branching + ImpactStat 75K + Footer |
| 31 | 사실상 표준 + MLX 애플 맥 | Kicker + Split(2:3) AppleLight + CheckMark(M1/M2/M4) + Footer |
| 32 | MLX 최대 + vLLM+MLX 합작 | Kicker + Split(arrow) gear↔rocket + Headline + Footer |
| 33 | Ollama 간편 설치/실행 | Kicker + FrameBox(terminal) + Badge 3종 + Footer |
| 34 | 3도구 역할 정리 + 레고 | Kicker + Grid(3) Ollama/vLLM/MLX + puzzle 조합 |
| 35 | 두 가지 제약 (이미 설계됨, 메타만) | Kicker + Split(line) coin↔globe + Footer |
| 36 | 로컬 무료/오프라인 + 기밀 분석 | Kicker + Split(vs) laptop+CheckMark↔lock+Body + Footer |
| 37 | 외부 서버 찜찜 + 구독료 | Kicker + Grid(2) cloud+coin + target Headline + Footer |

### 가드 검증 (10씬 관련)
- ✅ `validate-layout-diversity`: 28~37 shape 중복 제로 (나머지 씬은 2~4차 배치 필요)
- ✅ `validate-label-quality`: 28~37 duplicate/function-word/particle 리스트 전부 빠짐
- ✅ `validate-no-emoji` 전체 통과
- ✅ `validate-phase-separation`: Phase B 10씬 전부 통과
- ✅ `sync-render-props`: 80 scenes · 23085 frames

---

## 🚧 남은 배치 (2~4차)

### 2차 배치: scene-38 ~ 47 (10씬) — P01/P04/P24/P23/P09/P09/P11/P11/P15/P03

실제 shape 반복 리포트:
- `18e3d6d8` × 6: scene-8, 14, 23, 25, 45, 52 → 2차에 scene-45 포함
- `868e22a5` × 5: scene-9, 10, 16, 17, 49
- `25691e5b` × 4: scene-35(재설계됨), **scene-46, 68, 78** → 2차에 scene-46 포함 → 재설계 결과가 scene-46/68/78과 같아지지 않게 주의
- `09ef663d` × 3: scene-38, 66, 74 → 2차에 scene-38 포함

### 3차 배치: scene-48 ~ 57 (10씬) — P17/P07/P27/P26/P10/P11/P05/P08/P15/P04
### 4차 배치: scene-58 ~ 69 (12씬) — 나머지

---

## 🔧 전체 렌더 전 최종 체크리스트

다른 배치 완료 후:
1. 모든 씬 `phase: "B"` + `hero_frame_ms` + `preview_reviewed_at` 필드 채우기
2. `bash scripts/postprocess.sh data/vibe-news-0407/scenes-v2.json` 전체 통과 확인
3. `npx remotion render MainComposition output/vibe-news-0407.mp4 --props=data/vibe-news-0407/render-props-v2.json --concurrency=4`

---

## 📦 이번 세션 산출물

```
scripts/_redesign-28-37-batch1.mjs      (신규, 재사용 금지 — 1회성 authoring 스크립트)
data/vibe-news-0407/scenes-v2.json      (scene-28~37 stack_root 교체)
data/vibe-news-0407/render-props-v2.json (sync 완료)
output/preview/vibe-news-0407-scene-28-hero.png
output/preview/vibe-news-0407-scene-29-hero.png
output/preview/vibe-news-0407-scene-30-hero.png
output/preview/vibe-news-0407-scene-31-hero.png
output/preview/vibe-news-0407-scene-32-hero.png
output/preview/vibe-news-0407-scene-33-hero.png
output/preview/vibe-news-0407-scene-34-hero.png
output/preview/vibe-news-0407-scene-35-hero.png
output/preview/vibe-news-0407-scene-36-hero.png
output/preview/vibe-news-0407-scene-37-hero.png
```

---

## 다음 세션 시작 명령

```bash
# 1. 2차 배치 (scene-38~47) narration 덤프
node -e "
const v2 = JSON.parse(require('fs').readFileSync('data/vibe-news-0407/scenes-v2.json','utf8'));
for (const i of [38,39,40,41,42,43,44,45,46,47]) {
  const s = v2[i]; console.log('scene-'+i, '['+s.visual_plan?.pattern_ref+']');
  console.log(' nar:', s.narration);
  (s.subtitles||[]).forEach(st => console.log('  '+st.startTime.toFixed(1)+'s \"'+st.text+'\"'));
}"

# 2. 1차 배치와 동일 패턴으로 _redesign-38-47-batch2.mjs 작성 후 실행

# 3. 단일 씬 preview
npx tsx scripts/vg-preview-still.ts vibe-news-0407 --scene 38 --time hero
# → output/preview/vibe-news-0407-scene-38-hero.png Read

# 4. sync
node scripts/sync-render-props.js data/vibe-news-0407/scenes-v2.json
```

---

## 한 문장 요약

> **1차 배치 (scene-28~37) 수동 재설계 + preview 검증 완료. 나머지 3회 배치(38~47 / 48~57 / 58~69) 남음. shape 반복 제거 진행률 10/80 씬.**
