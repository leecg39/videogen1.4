---
name: vg-scene
description: beats.json과 scoring engine을 사용하여 scene block 기반 scene-plan.json과 scenes.json을 생성합니다.
---

# /vg-scene - Scene DSL 생성

> **🚪 PRE-WRITE GATE (v1.1 guardrail audit P1)**
>
> scene-plan.json/scenes.json 생성 전에 **반드시** 실행:
> ```bash
> node scripts/validate-preflight.js {projectId} --skill=vg-scene
> ```
> exit 0 아니면 작성 금지. design-sync/SRT/project.json 부재 시 후속 /vg-layout 전체가 실패.

## 🔥 R11 이후 변경 — visual_plan.pattern_ref 격하 (2026-04-19)

> **핵심:** `/vg-layout` 의 기본 실행 모드가 **TSX 컴포넌트 (src/remotion/custom/scene-NN.tsx) 직접 작성** 으로 전환되었다 (scene-grammar v1.4 원칙 A). `/vg-scene` 이 생성하는 `visual_plan.pattern_ref` 는 **더 이상 자동 realize 대상이 아니며 참고 힌트로만 사용된다.**

**`visual_plan` 필드 역할 변경:**

| 필드 | R10 이전 | **R11 이후** |
|------|---------|-------------|
| `pattern_ref` | `/vg-layout` 이 해당 P01~P20 pattern 을 DSL 로 realize | **힌트로만 참고.** `/vg-layout` 은 narration 을 직접 읽고 TSX JSX 를 새로 설계한다. |
| `focal` / `support` | DSL 노드 힌트 (ImpactStat/BulletList 등) | TSX JSX 설계 영감 (실제 구현은 JSX 자유) |
| `density` | DSL 의미 노드 카운트 기준 | TSX JSX 요소 카운트로 자연 이식 |
| `relationship` / `accent_color` / `recommended_container` | realize 파라미터 | 감정·색·레이아웃 방향성 힌트 |

**구형 DSL 방식 자동 realize 는 폐기:** `/vg-layout` 은 이제 `pattern_ref` 를 기반으로 stack_root JSON 트리를 찍어내지 않는다. 각 씬은 `src/remotion/custom/scene-NN.tsx` 로 수작업 authoring 된다.

**그래도 visual_plan 은 계속 커밋한다. 이유:**
1. 영상 전체 pattern 분포를 saturation penalty 로 관리 (saturation over-use 방지).
2. `/vg-layout` 이 TSX 컴포넌트를 설계할 때 감정 키워드·포컬 타입을 "영감 소스" 로 읽는다.
3. DSL 허용 예외 씬 (`_dsl_rationale` 3조건 동시 만족) 에 한해 여전히 realize 가능.

**20 패턴 카탈로그는 유지되지만 "힌트 레이어" 로 격하.** `pickVisualPlan()` 이 계속 pattern_ref 를 할당하되, 이를 강제 realize 하던 가드(`validate-visual-plan-coverage`, `visual-plan-coverage`) 는 TSX 씬에서 자동 면제된다.

**3 HARD GATE (visual-plan-coverage / pattern-picker alt_for_cluster / subtitle-visual-dedup) 는 DSL 씬 대상만 유효.** TSX 씬은 `⓪-tsx1~3` AST validator (structural-signature / video-narration-match / text-dedup) 가 대체한다.

---

beats.json과 scoring engine을 사용하여 scene-plan.json과 scenes.json을 생성합니다.

## 🔴 DUAL-FILE 구조 — 절대 헷갈리지 마라 (CRITICAL)

프로젝트 편집은 두 개의 파일 구조에서 이루어진다:

| 파일 | 역할 | 비고 |
|------|------|------|
| `data/{pid}/scenes-v2.json` | **Source of truth** (모든 authoring 입력) | /vg-scene · /vg-layout · postprocess 가 수정 |
| `data/{pid}/render-props-v2.json` | **Remotion 런타임 파일 (파생)** | 오직 `sync-render-props.js` 만 쓴다 |

**규칙:** `scenes-v2.json` 만 authoring/편집 대상. `render-props-v2.json` 은 `postprocess.sh` ⑧ 단계에서 자동 sync. 수동 sync 시 `node scripts/sync-render-props.js data/{pid}/scenes-v2.json`.

과거 사고 (2026-04-17): sync 단계 누락으로 render-props 가 stale 한 채 여러 번 렌더됨. postprocess 를 통과하지 않은 scenes-v2 변경은 mp4 에 반영되지 않는다.

## 🚨 v1.2 — visual_plan 제약 강화 (2026-04-19 79프레임 감사 대응)

> **출처:** `.claude/rules/scene-grammar.md` Section 12 (v1.2 픽셀 레벨 HARD GATE).
>
> 2026-04-19 감사 결과 `layout-diversity` shape-hash 게이트를 통과한 씬이 육안으로 쌍둥이였다 (f022↔f068 trio gauge, f010↔f060 table pair, terminal 4회). hash 는 노드 타입 구조만 비교했고 "bbox 위치 + 노드 sequence" 의미 signature 는 무시. v1.2 는 `/vg-scene` 이 visual_plan 커밋 시 다음을 추가 검사한다.

### pattern-picker 제약 — 직전 3 씬 semantic cluster 금지

visual_plan 커밋 시 `pickVisualPlan(scoringInput, sceneBlock, patternContext)` 내부에:

1. **직전 3 씬의 `visual_plan.pattern_ref` 와 `focal.type` 조합(semantic signature)** 을 누적.
2. 현재 씬의 signature 가 직전 3 씬 중 2개 이상과 동일하면 **대안 pattern_ref 로 회피**.
3. 회피 대상은 `src/services/pattern-catalog.ts` 의 alt_for_cluster[] (신규 필드, P01~P20 각각에 ≥ 2 개 정의).
4. 회피 후에도 2개 이상 동일하면 `[FAIL:semantic-cluster]` 로 씬 생성 중단.

### 자막 ↔ 노드 text dedup 사전 차단

`visual_plan.focal.label` / `visual_plan.support[].text` 를 결정할 때:

1. 씬의 `subtitles[]` 모든 text concat (해당 시각 문자열) 을 사전 참조.
2. **Levenshtein similarity > 0.6** 이면 해당 label/text 를 **요약·은유·숫자 추상화** 로 치환.
   - 예: 자막 "Github에서 별을 7만 5천 개 넘게" + 노드 candidate "75K 깃허브 스타" (similarity 0.8) → 노드 candidate 는 "업계 최상위권" 으로 교체.
3. 매칭 임계치 사용: `src/services/dup-detection.ts` 의 `scoreSimilarity(a, b)` 헬퍼 (신규).
4. similarity ≤ 0.6 이 될 때까지 최대 3회 재시도. 실패 시 `[FAIL:subtitle-visual-dedup]`.

### 렌더 ready 판정 체크리스트 (scene-plan.json 커밋 시)

`/api/skills/scene` 는 다음을 모두 만족한 뒤에만 scene-plan.json 저장:

- [ ] 모든 씬이 `visual_plan.pattern_ref` 존재 (기존 룰)
- [ ] **[v1.2]** 직전 3 씬 semantic signature cluster ≤ 2
- [ ] **[v1.2]** focal/support text vs subtitles Levenshtein ≤ 0.6
- [ ] 비카드 비율 ≥ 40% (기존 룰)

**`/vg-scene` 은 필수적으로 이 게이트를 커밋 전 실행한다. 게이트 우회용 `--skip-pixel-guard` 플래그 없음 (v1.2 ZERO-TOLERANCE).**

---

## 🎬 VIDEO CLIP BACKGROUND — v1.2.3 ABSOLUTE (2026-04-19 비디오 누락 감사 대응)

> **문제:** 2026-04-19 감사 결과 scenes-v2.json 에 `VideoClip` / `video_queries` 0건. `AssetMode` 타입에 "video" 누락 + /vg-scene 에서 `video_queries` 자동 생성 로직 부재가 원인. **v1.2.3 부터 /vg-scene 이 씬별 video_queries 생성 필수.**

### 씬 생성 시 video_queries 규칙

1. **`project.asset_mode === "video"`** 인 경우, 각 씬에 `assets.video_queries` 배열 1개 이상 생성.
2. **query 추출 기준** — narration 키워드 + shot_type 매핑:
   - "AI / 인공지능" → `"artificial intelligence technology"`
   - "코딩 / 개발" → `"developer coding dark"` / `"laptop coding"`
   - "토큰 / 요금" → `"corporate meeting technology"`
   - "뉴스 / 회의" → `"business meeting dark"`
   - "차트 / 벤치마크" → `"data visualization"` / `"benchmark-chart"`
   - "맥북 / 로컬 AI" → `"macbook coding"`
   - "GPT / 모델 / 루머" → `"futuristic technology abstract"`
3. **전체 씬 중 ≥ 30% 가 video_queries 보유** — `validate-background-coverage.js` 강제.
4. **shot_type "full-bleed-broll" 은 video_queries 필수** — 배경 비디오 없이는 b-roll 불가.
5. **pause/metric/stat 씬은 video_queries 선택적** — 숫자/차트 중심 씬은 비디오 없이도 OK.

### video_queries 형식

```json
"assets": {
  "svg_icons": ["..."],
  "image_queries": [...],
  "video_queries": [
    { "query": "artificial intelligence technology", "orientation": "landscape", "minDuration": 8 }
  ]
}
```

`src` 는 fetch-scene-videos.ts 가 채움 (`videos/{projectId}/{filename}.mp4`).

### 재사용 우선 (public/videos/{pid}/ 존재 시)

```bash
ls public/videos/{pid}/*.mp4
```
씬 narration 과 파일명 매칭되면 **재다운로드 없이 직접 src 지정**. `fetch-scene-videos.ts` 는 존재 파일 skip.

---

## ⛔ visual_plan commit MANDATORY (힌트 레이어 — R11 개정)

**`/vg-scene` 은 시각 구성안(`visual_plan`)을 **씬별로 확정**하여 커밋해야 한다.**

**R11 이전:** `/vg-layout` 은 이 구성안을 **realize 만** 수행하며, composition 을 재결정하지 않는다.
**R11 이후 (v1.4 원칙 A):** `/vg-layout` 은 TSX 컴포넌트로 씬을 **새로 설계** 하며, `visual_plan` 을 **힌트로만 읽는다.** 단, visual_plan 커밋 자체는 여전히 필수 — 영상 전체 패턴 분포 관리와 DSL 예외 씬 realize 에 필요.

**작동 원리 (자동):**
- `POST /api/skills/scene` 내부에서 `pickVisualPlan(scoringInput, sceneBlock, patternContext)` 호출
- 각 씬에 `visual_plan: { pattern_ref, relationship, focal, support, accent_color, recommended_container }` 가 자동 부착됨
- `pattern_ref` 는 `src/services/pattern-catalog.ts` 의 20개 Visual DNA 패턴(P01~P20) 중 하나
- 20 패턴은 `reference/SC 1~61.png` 에서 추출된 실제 visual DNA (handoff 2026-04-17 §3)

**커밋 구조:**
```json
"visual_plan": {
  "pattern_ref": "P04_ring_with_bullets",
  "relationship": "metric",
  "focal": { "type": "RingChart", "value": 80, "label": "자동화 범위" },
  "support": [{ "type": "BulletList", "items": ["...","...","..."] }],
  "accent_color": "mint",
  "recommended_container": "Stack",
  "rationale": "intent=focus evidence=statistic → 링차트 + 불릿 리스트"
}
```

**검증:** `bash scripts/postprocess.sh` 의 `⑥-0 validate-visual-plan-coverage` 가 누락/편향을 자동 차단.

**왜 이 아키텍처인가 (handoff 핵심):**
> "의미청킹할 때 자막들을 모아서 그룹으로 청킹하는데, 한 그룹에 속한 자막들의 핵심 키워드와 의미를 식별해서 장면을 어떻게 구성할지 계획을 세우겠지? 그때 장면에 대한 구성안이 확정될 것 같은데"

기존에는 `/vg-layout` 이 composition 을 즉석 재결정 → 서브에이전트 taste 편차로 템플릿 반복.
이제 `/vg-scene` 에서 pattern_ref 분포가 정해짐 → `/vg-layout` 은 기계적 realize.

중요: 여기서 scene은 beat 1개가 아니라 **여러 beat를 묶은 scene block**입니다.
기본적으로 2~4개의 인접 beat를 하나의 장면으로 보고, 짧은 연결 자막은 같은 장면 안에서 reveal로 처리합니다.
또한 `public/assets/svg`는 완성 템플릿이 아니라 **분해 가능한 family/motif 레퍼런스 라이브러리**입니다.

## ⛔ scene 경계 = SRT entry 경계 (HARD INVARIANT)

**scene의 `start_ms` / `end_ms` / `duration_frames`는 항상 SRT entry 경계 위에 있어야 한다.**
임의로 scale (×1.05 같은 비례 보정)하면 안 된다. 누적 drift로 자막이 오디오와 어긋난다.

**언제 위반되는가:**
- TTS를 재합성한 뒤 (`/vg-voice` 재실행) 새 SRT는 다른 타이밍을 가지는데 scene 경계는 그대로 두는 경우
- scene 경계를 비례 스케일하는 패치 스크립트
- scene 경계를 손으로 미세 조정한 경우

**올바른 절차 (재TTS 후):**
1. `/vg-voice` 재실행 → 새 mp3 + 새 SRT
2. `/vg-chunk {pid}` 재실행 → 새 SRT 기반 새 beats.json
3. `/vg-scene {pid}` 재실행 → 새 beats 기반 새 scenes-v2.json (경계 자동 정렬)
4. `/vg-layout {pid}` 재실행 — stack_root 재설계 (또는 `rebuildScenesFromSrt()`로 enterAt만 비례 보정)
5. `/vg-render {pid}` 최종 렌더

**자동 가드:** `bash scripts/postprocess.sh data/{pid}/scenes-v2.json` 가 `check-scene-sync.ts`로 250ms 이상 drift를 자동 검출하여 빌드를 실패시킨다.

**수동 검증:** `npx tsx scripts/check-scene-sync.ts {pid}` — exit 0이면 OK, 1이면 drift 발견.

**Why:** 2026-04-13 deep-blue 프로젝트에서 새 TTS 합성 후 scene 경계만 1.00058배 스케일했더니 일부 SRT entry가 scene 중간을 가로질러 자막-오디오가 최대 6.5초 어긋났다. 균등 scale은 cumulative rounding error도 만든다.

## 자막 의미 단위 분할 (자동)

`scene.subtitles[]`는 `src/services/subtitle-splitter.ts`의 `buildSubtitleEntries()`로 생성됩니다.
한 beat의 텍스트가 30자를 초과하면 다음 우선순위로 자동 분할:

1. **문장부호** (`. ! ? …`)
2. **쉼표** (`,`)
3. **접속사** (그런데/하지만/그래서/그리고/그러니까/오히려/심지어/정확히는/그러면/그래도/따라서)
4. **절 종결 어미** (~때/~면/~지만/~니까/~면서/~라서/~해서/~되면/~고/~며/~여)

**4단계까지 했는데도 30자 초과면 그대로 둡니다 (자연 wrap 허용).**
어절 단위 강제 분할은 절대 하지 않습니다 — `"가면,"` 같은 무의미 파편을 만들지 않기 위해.

시간은 글자 수 비례로 분배되며, 시작 시각은 씬 상대 시간(seconds)으로 기록됩니다.

**Why:** 2026-04-13 deep-blue 프로젝트에서 24자 강제 분할로 단어 잘림 사고 발생.
의미 > 줄 수 원칙으로 변경. 일부 자막은 2줄 wrap을 허용하더라도 의미 단위는 보존.

**커스터마이즈:** `buildSubtitleEntries(text, startMs, endMs, sceneStartMs, maxChars)` 의 `maxChars` 파라미터 조정.

## 입력
- projectId: 프로젝트 ID
- data/{projectId}/beats.json이 존재해야 함
- data/{projectId}/design-tokens.json (선택, 없으면 기본값 사용)

## 출력
- data/{projectId}/scene-plan.json
- data/{projectId}/scenes.json

## 사용법
/vg-scene {projectId}

## API 엔드포인트
POST /api/skills/scene

### Request
```json
{
  "project_id": "string"
}
```

### Response (200)
```json
{
  "success": true,
  "scenes_count": 10,
  "scene_plan_path": "data/{projectId}/scene-plan.json",
  "scenes_path": "data/{projectId}/scenes.json"
}
```

### Errors
- 400: project_id 누락, beats.json 없음/빈 배열
- 500: 내부 서버 오류

## 처리 흐름
1. data/{projectId}/beats.json 읽기 (없으면 400)
2. data/{projectId}/design-tokens.json 읽기 (없으면 기본값 사용)
3. beats를 scene block으로 묶기:
   a. 기본 목표: 2~4 beat / 5.5~14초
   b. `그런데`, `즉`, `예를 들어`, `반면` 같은 연결 자막은 독립 scene 금지
   c. 새 scene은 새 자막이 아니라 새 시각 흐름이 필요할 때만 생성
4. 각 scene block에 대해:
   a. scoring-engine.ts의 selectBestLayout() 호출 -> 레이아웃 선택
   b. svg-layout-selector.ts의 selectSvgLayoutReferencePack() 호출 -> `layout_reference` 생성
      - `src/data/svg-layout-motifs.ts` 카탈로그 기반
      - `public/assets/svg/*.svg`는 원본 템플릿이 아니라 분해용 레퍼런스
      - `primary_family_id` 1개 + `motif_ids` 1~3개. 4개 이상 → svg-layout-selector exit 1.
   c. scoreAllLayouts()로 대안 레이아웃 목록 수집
   d. dsl-generator.ts의 generateSceneDSL() 호출 -> Scene DSL 생성
   e. 이전 레이아웃 추적 (ScoringContext 업데이트)
4. **이미지 에셋 탐색** (각 씬 분석 후):
   a. 씬 내용을 분석하여 이미지가 효과적인 씬 식별
   b. `assets.image_queries[]`에 검색 쿼리 추가 (아래 기준 참고)
   c. 이미지 검색/다운로드: `npx tsx scripts/fetch-scene-images.ts data/{projectId}/scenes-v2.json`
   d. 다운로드된 이미지는 `public/images/{projectId}/`에 저장
5. scene-plan.json 저장 (각 scene block별 선택된 레이아웃 + 점수 + 대안)
6. scenes-v2.json 저장 (Scene[] 배열)
7. **후처리 파이프라인 실행 (필수)**:
   ```bash
   bash scripts/postprocess.sh data/{projectId}/scenes-v2.json
   ```
   이 단계가 자막 싱크, 카드 간격, 빈 화면 등을 자동 보정합니다.
8. render-props-v2.json 동기화 (후처리 결과 반영)
9. project.json status를 "scened"로 업데이트

## 이미지 에셋 탐색 기준

씬 분석 시 다음 조건에 해당하면 `assets.image_queries`를 추가:

| 조건 | 이미지 유형 | 예시 |
|------|------------|------|
| 특정 제품/서비스 언급 | 로고, 스크린샷 | `{"query": "OpenAI logo", "style": "icon"}` |
| 비유/은유 표현 | 일러스트레이션 | `{"query": "puzzle pieces connecting", "style": "illustration"}` |
| 실제 사례/데모 | 목업, 사진 | `{"query": "chatbot interface", "style": "photo"}` |
| 개념 시각화 필요 | 다이어그램 | `{"query": "vector database concept", "style": "illustration"}` |

### image_queries 형식
```json
{
  "assets": {
    "svg_icons": ["search", "database"],
    "image_queries": [
      {"query": "RAG pipeline diagram", "style": "illustration"},
      {"query": "vector search concept", "style": "illustration"}
    ]
  }
}
```

### 이미지 사용하지 않는 씬
- 인트로/아웃트로 (텍스트 중심)
- 체크리스트/불릿 리스트 (텍스트면 충분)
- 차트/통계 씬 (데이터 시각화가 이미 있음)
- 5초 미만 짧은 씬

### WebSearch 활용 (API 키 없을 때)
Unsplash API 키가 없으면 Claude가 직접 WebSearch로 이미지를 찾아 다운로드:
```
1. WebSearch: "{query} transparent png free"
2. 적절한 이미지 URL 선택 (라이선스 확인)
3. curl로 public/images/{projectId}/에 다운로드
4. assets.images[]에 경로 기록
```

## scene-plan.json 구조
```typescript
interface ScenePlan {
  project_id: string;
  total_beats: number;
  plans: Array<{
    beat_index: number;
    selected_layout: string;
    layout_reference?: {
      primary_family_id: string;
      references: Array<{
        id: string;
        svg_path: string;
        family_id: string;
        motif_ids: string[];
      }>;
      motif_ids: string[];
      guidance: string[];
    };
    score: number;
    breakdown: object;
    alternatives: Array<{ layout: string; score: number }>;
  }>;
}
```

## SVG reference usage rules

- Never copy a full SVG template as the final scene
- Never use SVG templates as random fallback inserts
- Use `primary_family_id` as the structural backbone
- Borrow only a few `motif_ids`
- Keep the same primary family throughout one scene block
- Vary reveal, support, and emphasis inside the block instead of switching templates

## 씬 간 트랜지션

현재 모든 씬에 `transition: { type: "none", durationFrames: 0 }` 설정.
(TransitionSeries overlap으로 자막 밀림 방지)

모션 프리셋, SvgGraphic 스키마, 노드 레퍼런스: `docs/node-data-reference.md` 참조
Semantic Shape 분류: `docs/semantic-shapes.md` 참조

> 전환/모션/SvgGraphic 상세: `docs/node-data-reference.md` 참조

## Shot Plan 자동 생성 (선택적)

각 씬 생성 시, narration 내용을 분석하여 shot_plan을 추론:
- 숫자/통계 → shot_type: "stat-punch"
- 비교/대조 → shot_type: "compare-split"
- 순서/단계 → shot_type: "timeline-cascade"
- 인용/감정 → shot_type: "quote-pause"
- 목록/나열 → shot_type: "icon-cluster" or "checklist-reveal"
- 개념/구조 → shot_type: "diagram-build"
- 강조/핵심 → shot_type: "hero-text"

### Scene Grammar v1 확장 shot_type

| shot_type | 트리거 | 레이아웃 패턴 | 프레임 |
|-----------|--------|-------------|--------|
| `before-after` | 변화/전환 ("이전에는", "바뀌었다") | before-after-shift (#17) | F13 |
| `myth-bust` | 오해 깨기 ("착각하는데", "사실은") | myth-chatbubble (#20) | F14 |
| `do-dont` | 가이드라인/규칙 ("하지 말고", "피해야") | do-dont-bars (#21) | F3(Split) |
| `input-output` | 변환/처리 ("넣으면", "거치고") | input-output-flow (#22) | F15 |
| `empathy-hook` | 타겟 공감 ("기획자분들", "그 불편함") | persona-empathy (#19) | F1(Stack) |
| `donut-stat` | 비율/퍼센트 강조 (도넛 차트 활용) | donut-stat-hero (#25) | F16 |

이 shot_type들은 scoring-engine의 SHOT_PLAN_LAYOUT_MAP에 매핑되어 있음.
`layout-patterns.md` #17~#30의 stack_root 예시를 참조하여 레이아웃을 구성할 것.

asset_mode는 narration에 브랜드명/제품명이 있으면 "image", 없으면 "icon" or "text-only"
caption_mode는 기본 "bottom-bar", 짧은 씬(100fr 미만)은 "punch-word"

## Scoring Context 관리
- recentLayouts: 최근 3개 레이아웃 추적 (repetition penalty용)
- previousLayout: 직전 레이아웃 추적 (similarity penalty용)
- 각 beat 처리 후 context 업데이트

## 의존
- src/services/scoring-engine.ts (selectBestLayout, scoreAllLayouts)
- src/services/dsl-generator.ts (generateSceneDSL)
- src/services/file-service.ts (readJSON, writeJSON, getProjectPath)
- @remotion/transitions (TransitionSeries, fade, slide, wipe)

## 참고
- scoring-engine은 순수 함수로 부작용 없음
- dsl-generator도 순수 함수로 부작용 없음
- design-tokens는 현재 로드만 하고 향후 확장 예정
- 트랜지션은 Composition.tsx에서 TransitionSeries로 렌더링됨

---

## [INTENT PROGRESSION — 서사 흐름 가이드]

beat의 intent 배열이 시청자의 인지 흐름을 결정한다.
단순 "내용 배치"가 아니라 **의미의 서사 곡선**을 설계해야 한다.

### 좋은 진행 패턴
- `define → explain → compare → emphasize → example` (개념→이해→대비→각인→응용)
- `list → compare → emphasize` (개요→심화→결론)
- `example → explain → define` (귀납적: 사례→분석→정의)

### 나쁜 진행 패턴
- `emphasize → emphasize → define` (클라이맥스가 너무 이름, 역삼각형)
- `define → define → define` (교과서 나열, 시청자 이탈)
- `list → list → list` (카탈로그 피로)

### 규칙

1. **emphasize 연속 2회 금지** — 에너지 피로. 사이에 explain/compare 삽입
2. **define/explain 연속 3회 금지** — 지루함. 사이에 example 또는 compare 삽입
3. **compare 후에는 emphasize 또는 example MUST** — 결론 도출 유도. compare 다음에 define/explain만 오면 progression-validator exit 1 (TODO 가드).
4. **영상 마지막 2개 씬**: emphasize 또는 list — 요약/강조로 마무리
5. **영상 첫 씬**: define 또는 emphasize — 주제 선언으로 시작
