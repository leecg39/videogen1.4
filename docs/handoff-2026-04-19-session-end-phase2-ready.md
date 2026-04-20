# Handoff 2026-04-19 — Session End, Phase 2 Ready (C: 78씬 한번에 authoring)

> **다음 세션 시작 지점:** Phase 2 — /vg-chunk → /vg-scene → /vg-layout 파이프라인 전체 실행 + 78씬 PNG 대량 생성.
> **선택지:** C (78씬 한번에 authoring 시도, 컨텍스트 한계 도달 시 분할 재개).
> **사용자 지시:** A=덮어쓰기 / B=78씬 전체 재authoring / C=커밋 후 병렬. **mp4 렌더 X, 씬별 대표 PNG 만.**
> **중요 룰:** mass realizer 절대 금지 — scene-by-scene Edit 으로 한 씬씩 수동 authoring.

---

## 1. 현재 커밋 상태

- **Head**: `32a1519 feat(skill-hardening): scene-grammar v1.2.3 + 9 pixel validators + video clip ABSOLUTE`
- **Branch**: `main`
- **uncommitted**: `.claude/settings.json`, `.claude/skills/*` 일부, `CLAUDE.md`, `docs/design-system.md`, `src/remotion/**/*.tsx` 등 이전 세션 잔여 수정 — 이번 라운드와 직접 관련 없으니 손대지 않음.
- `data/` 는 `.gitignore` 대상이므로 `data/vibe-news-0407/` 는 git 미추적 (project.json asset_mode 변경분은 로컬에만).

---

## 2. Round 1~4 히스토리 (오른쪽 페인 평가)

| Round | 내용 | 만족도 |
|-------|------|--------|
| R1 | scene-grammar v1.2 + SKILL.md 3종 ABSOLUTE + 5 validator (pixel-density, bottom-occupancy, subtitle-dedup, semantic-shape-cluster, outro-black) | 62% |
| R2 | E-1/E-2 구조 버그 수정 (JPG 960×540 + mp4/folder 모드) + P4 signature v1.2.1 + P7 rendered-node-presence 신설 | 91% |
| R3 | P2 center-of-mass v1.2.2 4지표 + P8 color-hierarchy + P9 opening-hook | 94% |
| R4-1 (진행중) | P2 lower-third 0.30 + horizontal-asymmetry 신설 + P3 strict mode + P8 dominance mode + **video clip ABSOLUTE 신설** | **대기 중** (cmux 전송 완료, 답신 미수신) |

---

## 3. 비디오 클립 누락 감사 + FIX (2026-04-19 하반 세션 핵심 작업)

### 발견된 원인 4계층

1. `src/types/index.ts:23` AssetMode 에 `"video"` 누락 → validate-background-coverage 가드 비활성
2. `src/services/` 의 chunk/scene route 에 `video_queries` 자동 생성 로직 전무
3. `vg-layout/vg-scene SKILL.md` 에 VideoClip / video_queries 지침 부재
4. `data/vibe-news-0407/project.json` 의 `asset_mode` 가 Round 1 에서 "all" → "devicon+image" 로 강등됐음

### 적용된 FIX (커밋 `32a1519`)

| # | 파일 | 변경 |
|---|------|------|
| FIX-1 | `src/types/index.ts:23` | `AssetMode` 에 `"video"` 추가 |
| FIX-2 | `.claude/skills/vg-layout/SKILL.md` | "🎬 BACKGROUND VIDEO CLIP — ABSOLUTE" 섹션 신설 (픽셀 게이트 앞) |
| FIX-3 | `.claude/skills/vg-scene/SKILL.md` | "🎬 VIDEO CLIP BACKGROUND — v1.2.3 ABSOLUTE" 섹션 신설 (visual_plan 앞) |
| FIX-4 | `data/vibe-news-0407/project.json` | `asset_mode: "devicon+image"` → `"video"` |

### 이미 준비된 리소스

- `public/videos/vibe-news-0407/` — **53개 mp4 완비** (AI-technology, artificial-intelligence, benchmark-chart, business-meeting, cloud-computing, coding-*, corporate-*, data-visualization, futuristic-*, laptop-coding 등)
- `input/0407 바이브 뉴스.mp3` + `input/0407 바이브 뉴스.srt` 원본
- `/tmp/vibe-frames/f001~f079.jpg` — 오른쪽 페인이 생성한 이전 mp4 79 프레임 감사 샘플
- `output/vibe-news-0407.mp4` — 이전 세션 렌더 결과 (tail 51.3초 블랙, 재렌더 X)

---

## 4. 9 Validator 현황 (shipped)

| # | Validator | 상태 | 주요 기능 |
|---|-----------|------|----------|
| P1 | `validate-pixel-density.js` | ✅ v1.2.1 | 단일/folder/mp4 3모드. non-empty pixel ratio ≥ 15% |
| P2 | `validate-bottom-occupancy.js` | ✅ v1.2.2/3 | 4지표: bottom50 + lower⅓≥30% + centroidY ≥ 42% + topHalf ≤ 70% |
| P3 | `validate-subtitle-visual-dedup.js` | ✅ v1.2.3 | Levenshtein 임계 0.5 + `--mode strict` token 매칭 (75K↔7만 포착) |
| P4 | `validate-semantic-shape-cluster.js` | ✅ v1.2.1 | leaf type tuple + trio-pattern (trio:RingChartx3 포착) |
| P5 | `validate-outro-black.js` | ✅ | ffprobe blackdetect, pix_th 0.03 (다크 틴트 배경 오탐 방지) |
| P6 | `validate-horizontal-asymmetry.js` | ✅ | center strip 40-60% content > 60% FAIL, 가로 편향 차단 |
| P7 | `validate-rendered-node-presence.js` | ✅ | 480×270 mask + dilate(2) + 4-conn flood fill, components ≥ 5 |
| P8 | `validate-color-hierarchy.js` | ✅ v1.2.3 | HSV 30° 12 bucket. presence 모드 / `--mode dominance` 80% 모드 |
| P9 | `validate-opening-hook.js` | ✅ | 3모드(folder/video/scenes) 첫 3초 density ≥ 50% |

---

## 5. scene-grammar v1.2.3 현재 상태

`.claude/rules/scene-grammar.md`:
- Section 12 픽셀 HARD GATE 5종 (P1~P5) + 12.2 Goodhart 방지 + 12.3 ZERO-TOLERANCE
- 부록 22~29번 validator 등록 (22~27: R1~R2 shipped, 28~29: R2 shipped)
- 갱신 로그 v1.2.1 / v1.2 / v1.1 / v1.0

**v1.2.3 업데이트 아직 미반영** — Section 12 에 P6/P8 dominance/P9 opening-hook/horizontal-asymmetry 항목 추가 예정. Phase 2 전 또는 후 업데이트 가능.

---

## 6. 오른쪽 페인 (surface:12) 대화 상태

- R4-1 핸드오프 전송 완료 (`docs/handoff-2026-04-19-skill-hardening-R4-validators.md`)
- 답신 대기 중. 만족도 추정: 94% → 95%+ 가능성.
- 답신 포맷: `Round 4-1 만족도: XX% / OK 항목 / 보완 필요 / R4-2 진행 지시: [GO/WAIT/REVISE] / 수치 격차 수용 / 추가 의견`
- **다음 세션에서 cmux 답신 확인 먼저**: `cmux send --surface surface:12 "(R4-1 답신 있으면 알려줘)"` 또는 answer 을 사용자가 붙여서 전달

---

## 7. Phase 2 C 안 — 78씬 한번에 authoring 플레이북

### 7-a. 시작 체크리스트

```bash
# (1) 환경 확인
ls data/vibe-news-0407/                    # scenes-v2.json 기존 (덮어쓰기 대상)
ls public/videos/vibe-news-0407/*.mp4 | wc -l   # 53개 mp4 확인
cat data/vibe-news-0407/project.json | grep asset_mode   # "video" 확인

# (2) 기존 scenes-v2.json 백업 (실수 대비)
cp data/vibe-news-0407/scenes-v2.json data/vibe-news-0407/scenes-v2.json.pre-R4.bak
```

### 7-b. /vg-chunk 실행

Next.js API 서버가 떠 있는지 확인. 안 떠 있으면:
```bash
npm run dev &   # background, port 3000
```

```bash
curl -X POST http://localhost:3000/api/skills/chunk \
  -H "Content-Type: application/json" \
  -d '{"project_id":"vibe-news-0407"}'
# → beats.json 재생성
```

또는 Skill 도구로 `/vg-chunk vibe-news-0407` 호출.

### 7-c. /vg-scene 실행

```bash
curl -X POST http://localhost:3000/api/skills/scene \
  -H "Content-Type: application/json" \
  -d '{"project_id":"vibe-news-0407"}'
# → scene-plan.json + scenes-v2.json 재생성
# visual_plan.pattern_ref 각 씬에 자동 부착
# asset_mode="video" 이므로 video_queries 배열 씬당 1개 (SKILL.md v1.2.3 룰)
```

**주의:** 현재 `src/app/api/skills/scene/route.ts` 는 `video_queries` 자동 생성 로직이 없다 (FIX-3 은 SKILL.md 지침만). **Claude 가 /vg-layout 단계에서 수동 삽입 필요**. 또는 Phase 2 전에 `pickVisualPlan()` 내부에 `video_queries` 생성 코드 추가 (FIX-6 예정).

### 7-d. /vg-layout — 78씬 수동 authoring (핵심)

**ABSOLUTE 룰 (`scene-grammar.md` + `vg-layout/SKILL.md`):**
- mass realizer 금지 — `buildP01(scene)` 같은 pattern-별 helper 금지
- 각 씬 narration 을 읽고 **고유 stack_root** 작성 (Edit 한 씬씩)
- 씬당 **VideoClip 배경 배치 (30% 이상)** 의무 — asset_mode="video" 이므로
- 의미 노드 5-9개 (P7 components ≥ 5)
- 직전 3 씬과 semantic signature 상이 (P4)
- 자막 ↔ 노드 텍스트 중복 ≤ 0.5 / strict 모드 통과 (P3)

**authoring 템플릿 (배경 비디오 씬):**
```json
{
  "id": "scene-N",
  "phase": "A",
  "stack_root": {
    "type": "SceneRoot",
    "layout": { "gap": 32, "padding": "60px 100px 140px" },
    "children": [
      {
        "id": "bg-video",
        "type": "VideoClip",
        "data": {
          "src": "videos/vibe-news-0407/{matching-file}.mp4",
          "fit": "cover",
          "opacity": 0.30,
          "muted": true,
          "loop": true
        },
        "layout": { "position": "absolute", "x": 0, "y": 0, "width": 1920, "height": 1080, "zIndex": 0 },
        "style": { "filter": "blur(2px) brightness(0.6)" }
      },
      {
        "id": "content-stack",
        "type": "Stack",
        "layout": { "gap": 24, "align": "center" },
        "children": [
          { "type": "Kicker", "data": { "text": "..." } },
          { "type": "Headline", "data": { "text": "...", "size": "xl" } },
          { "type": "ImpactStat"/"CompareBars"/"RingChart" 등, "data": {...} },
          { "type": "FooterCaption", "data": { "text": "..." } }
        ]
      }
    ]
  },
  "phase_reviewed_at": "2026-04-19T12:00:00Z",
  "hero_frame_ms": 1500,
  "allow_exit": false
}
```

**비디오 파일 매칭 표** (narration 키워드 → public/videos/vibe-news-0407/*.mp4):

| narration 키워드 | mp4 후보 |
|-----------------|---------|
| AI / 인공지능 / 모델 | `artificial-intelligence-technology.mp4`, `AI-technology.mp4`, `artificial-intelligence-technology-futur.mp4`, `futuristic-technology-abstract.mp4`, `futuristic-technology.mp4` |
| 코딩 / 개발 / 토큰 | `laptop-coding.mp4`, `coding-dark-screen.mp4`, `coding-programming.mp4`, `coding-frustrated-developer.mp4`, `coding-programming-frustrated-developer.mp4` |
| 회의 / 미팅 / 뉴스 | `business-meeting.mp4`, `corporate-meeting-technology.mp4`, `corporate-office-technology.mp4`, `corporate-technology.mp4` |
| 차트 / 벤치마크 / 데이터 | `benchmark-chart.mp4`, `benchmark-performance-testing.mp4`, `benchmark-testing-performance-chart.mp4`, `data-visualization.mp4` |
| 클라우드 / 원격 | `cloud-computing.mp4` |

`ls public/videos/vibe-news-0407/*.mp4` 로 전체 목록 재확인.

### 7-e. 씬별 PNG 대량 생성 (Phase 2 최종 산출물)

```bash
mkdir -p output/preview/vibe-news-0407-v2
for i in $(seq 0 77); do
  npx tsx scripts/vg-preview-still.ts vibe-news-0407 --scene $i --time hero \
    --out output/preview/vibe-news-0407-v2/scene-$(printf '%02d' $i).png
done
# → 78 PNG. mp4 렌더 X.
```

### 7-f. 전수 validator 감사

```bash
node scripts/validate-pixel-density.js        --folder output/preview/vibe-news-0407-v2 --summary
node scripts/validate-bottom-occupancy.js     --folder output/preview/vibe-news-0407-v2 --summary
node scripts/validate-rendered-node-presence.js --folder output/preview/vibe-news-0407-v2 --summary
node scripts/validate-color-hierarchy.js      --folder output/preview/vibe-news-0407-v2 --mode dominance --summary
node scripts/validate-horizontal-asymmetry.js --folder output/preview/vibe-news-0407-v2 --summary
node scripts/validate-opening-hook.js         --folder output/preview/vibe-news-0407-v2 --first-n 9
node scripts/validate-subtitle-visual-dedup.js data/vibe-news-0407/scenes-v2.json --mode strict
node scripts/validate-semantic-shape-cluster.js data/vibe-news-0407/scenes-v2.json
node scripts/validate-background-coverage.js data/vibe-news-0407/scenes-v2.json
```

### 7-g. 오른쪽 페인 R5 핸드오프 + 평가 요청

`docs/handoff-2026-04-19-skill-hardening-R5-pngs.md` 작성 → `cmux send --surface surface:12` 전송.

평가 기준 (R3 답신 제시):
- (a) P7 pass ≥ 15/20 (재authoring 씬 기준)
- (b) 육안 "포스터급 밀도" ≥ 10/20
- (c) trio/shape 쌍둥이 재발 0
- (d) 비디오 배경 커버리지 ≥ 30%

**만족도 ≥ 95% 면 종료.**

---

## 8. 경계 신호 (Goodhart 공격 예방)

오른쪽 페인 R3 답신 6번:
> "재authoring 시 'P7 pass 를 위해 의미 없는 장식 노드 5개 뿌리는 Goodhart 공격' 의심."

**회피 룰:**
- AccentGlow / AmbientBackground / NoiseTexture / RotatingRingMotif / GridLineMotif 은 P7 components 에서 제외 (컨테이너/장식 EXCLUDE 리스트)
- 의미 노드 = 텍스트 블록 + 차트 + 아이콘 + 통계. 5개 이상이면서 narration 과 직결되어야 함
- 재authoring 후 육안 확인 — 배지/footer 만 잔뜩 있는 씬은 FAIL 재인정

---

## 9. 다음 세션 진입 스크립트 (첫 메시지 템플릿)

사용자가 다음 세션에서 이 핸드오프를 붙이면, 다음 작업으로 진입:

```
1. 이 핸드오프 Read: docs/handoff-2026-04-19-session-end-phase2-ready.md
2. `cmux send --surface surface:12 "R4-1 답신 있나요?"` 으로 페인 상태 확인
3. (A) Next.js dev server 확인 / 재기동 필요 시 `npm run dev &`
4. (B) `data/vibe-news-0407/scenes-v2.json` 백업
5. (C) /vg-chunk → /vg-scene 파이프라인 호출 (API 2회)
6. (D) /vg-layout 78씬 수동 Edit authoring 시작
   - Goodhart 회피 원칙 유지
   - 비디오 배경 ≥ 30% 씬
   - 씬별 narration 읽고 고유 stack_root
   - ABSOLUTE mass realizer 금지
7. (E) 78 PNG 일괄 생성 (vg-preview-still 반복)
8. (F) validator 9종 전수 감사
9. (G) R5 핸드오프 작성 + cmux 전송
10. 답신 만족도 ≥ 95% 까지 반복
```

---

## 10. 세션 종료 당시 TaskList 스냅샷

```
#57~65 (일부 완료, 일부 pending):
- 완료: 38-43, 44-57, 60-64 (scene-grammar/vg-layout/vg-scene/vg-render SKILL.md 수정 + 9 validator + FIX 1~5)
- pending: 58 (20씬 재authoring — B=78씬으로 수정됨), 59 (PNG + Goodhart 감사), 65 (Phase 2 전체)
```

다음 세션에서 관련 task 를 다시 생성하거나 기존 task 에 이어 진행.

---

## 11. 중요 파일 경로 색인

| 유형 | 경로 |
|------|------|
| 룰 | `.claude/rules/scene-grammar.md` (v1.2.3 대기) |
| 스킬 | `.claude/skills/vg-chunk/SKILL.md`, `vg-scene/`, `vg-layout/`, `vg-render/` |
| 진행 핸드오프 | `docs/handoff-2026-04-19-skill-hardening-R1.md` ~ `R4-validators.md` + 본 파일 |
| 감사 로그 | `docs/audits/R3-full-audit-2026-04-19.log`, `R4-1-audit-2026-04-19.log` |
| 소스 타입 | `src/types/index.ts` (AssetMode) |
| 렌더러 | `src/remotion/nodes/video-clip.tsx`, `video-canvas.tsx` |
| 비디오 스크립트 | `scripts/fetch-scene-videos.ts` |
| 프로젝트 데이터 | `data/vibe-news-0407/project.json`, `scenes-v2.json`, `beats.json`, `scene-plan.json` |
| 비디오 에셋 | `public/videos/vibe-news-0407/*.mp4` (53개) |
| 감사 샘플 | `/tmp/vibe-frames/f001~f079.jpg` |

---

## 12. 남은 1%p (94→95%) 돌파 조건

오른쪽 페인 R3 답신 인용:
> "**95% 목표 남은 1%p = 실제 결과물 품질의 육안+가드 동시 통과**. 현재까지는 '가드의 정합성' 만 확보. 재authoring 결과 20(→78)씬이 (a) P7 pass ≥ 15/20, (b) 육안 '포스터급 밀도' ≥ 10/20, (c) f022/f068 같은 쌍둥이 재발 0 이면 95% 달성."

→ **Phase 2 C 의 목표는 이 세 기준 동시 만족.** 의미 있는 씬 재authoring + 비디오 클립 포함 + validator 통과 + 육안 승인.

---

**이 핸드오프가 다음 세션의 single-source-of-truth. 세션 시작 시 맨 먼저 Read.**
