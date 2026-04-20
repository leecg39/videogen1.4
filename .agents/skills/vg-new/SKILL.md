---
name: vg-new
description: input/ 폴더의 mp3+srt를 자동 감지하여 프로젝트 생성 → /vg-chunk → /vg-scene → /vg-layout → /vg-render 전체 파이프라인을 게이트 검증과 함께 자동 실행합니다.
---

# /vg-new — 영상 생성 풀 파이프라인

`input/` 폴더에 mp3+srt 파일을 넣으면 **프로젝트 생성부터 최종 mp4 렌더링까지** 전체 파이프라인을 자동 실행합니다.

## 전체 파이프라인

```
/vg-new
  ├─ Phase 0: 프로젝트 초기화 (input/ 스캔 → 파일 복사 → project.json)
  │   └─ GATE: project.json 존재 + SRT 파싱 성공 + 오디오 파일 존재
  │
  ├─ Phase 1: /vg-chunk (SRT → beats.json + 에셋 수집)
  │   └─ GATE: beats.json ≥ 5개 + manifest 에셋 ≥ 8개
  │
  ├─ Phase 2: /vg-scene (beats → scene blocks → scenes-v2.json)
  │   └─ GATE: scenes-v2.json 존재 + 씬 ≥ 3개
  │   └─ PAUSE: 에디터 링크 제공 (선택적 편집)
  │
  ├─ Phase 3: /vg-layout (씬별 TSX 컴포넌트 수동 설계 — R11 원칙 A)
  │   └─ GATE: 모든 씬에 stack_root 존재 (TSX wrapper 또는 DSL)
  │   └─ GATE: TSX 씬 ≥ 95% (DSL 씬은 _dsl_rationale 3조건 strict)
  │   └─ GATE: ⓪-tsx1~3 AST validator 통과 (structural-signature / video-narration-match / text-dedup)
  │   └─ GATE: ⓪-dsl validate-dsl-rationale 통과 (DSL 씬 한정)
  │
  ├─ Phase 4: /vg-render (후처리 → render-props 동기화 → Remotion 렌더링)
  │   └─ GATE: mp4 파일 생성 + 파일 크기 > 1MB
  │
  └─ Phase 5: 자가 검증 (프레임 추출 → 시각 품질 확인)
      └─ GATE: 빈 화면 ≤ 1개 / 10프레임, 에셋 가시성 확인
```

**각 Phase의 GATE를 통과하지 못하면 다음 Phase로 진행하지 않는다.**
GATE 실패 시: 실패 원인 보고 → 해당 Phase 재실행 → 재검증.

## 🔥 R11 이후 파이프라인 변경 (2026-04-19 · scene-grammar v1.4)

**Phase 3 `/vg-layout` 의 기본 실행 모드가 `src/remotion/custom/scene-NN.tsx` TSX 컴포넌트 직접 작성으로 전환.**
기존 "stack_root JSON 트리를 realize" 방식은 3조건(data_only + pattern_unique + no_emotion) 동시 만족 시만 허용되는 좁은 예외로 격하.

**postprocess.sh 체인 업데이트:**

```
⓪-pre  prepare-dsl-subset          # TSX 씬 vs DSL 씬 분리 (원칙 A 분기)
⓪-tsx1 validate-tsx-structural-signature   # JSX tag signature cluster ≤ 2 (P4 AST 이식)
⓪-tsx2 validate-tsx-video-narration-match  # <OffthreadVideo> narration 매칭 (P10 재정의)
⓪-tsx3 validate-tsx-text-dedup              # JSX string ↔ SRT Levenshtein ≤ 0.6 (P3 AST 이식)
⓪-dsl  validate-dsl-rationale (strict)      # DSL 씬 _dsl_rationale 3조건 10자+ 근거 필수
...
⑥-y    validate-background-coverage         # DEPRECATED v1.4 — TSX 씬 <OffthreadVideo> 가 대체
```

**실패 시 재시도 루프 지침 (Phase 3):**

| 게이트 FAIL | 대응 |
|------------|------|
| `⓪-dsl validate-dsl-rationale` | DSL 씬을 TSX 전환 (원칙 A 기본값). `_dsl_rationale` 3조건 강보강이 아닌 이상 TSX 로 이식. |
| `⓪-tsx1 structural-signature` | JSX 트리 재설계. trio-pattern / 쌍둥이 시그니처 회피. 같은 leaf tuple 반복 금지. |
| `⓪-tsx2 video-narration-match` | `<OffthreadVideo src=...>` 경로를 narration 키워드와 매칭되는 mp4 로 교체 또는 비디오 자체 제거. |
| `⓪-tsx3 text-dedup` | JSX 내 문자열을 자막과 중복되지 않도록 요약·은유·수치 추상화. |
| `pre-commit hook` 차단 | `.git/hooks/pre-commit` 이 DSL rationale 미충족 시 commit 차단. 해당 씬 TSX 전환 후 재시도. |

**전체 파이프라인 순서는 동일:**
```
/vg-new → /vg-chunk → /vg-scene → /vg-layout (TSX 기본) → /vg-render
```

## 핵심 규칙

1. **각 Phase는 반드시 해당 스킬을 Skill tool로 발동한다** — 스크립트 직접 실행으로 우회 금지
2. **Phase 3(/vg-layout)은 반드시 씬별 수동 설계** — stack-composer 자동 매핑 금지
3. **Phase 5(자가 검증)은 생략 불가** — 렌더링 후 반드시 프레임을 추출하여 직접 확인
4. **GATE 실패 시 다음 Phase 진행 금지** — "일단 넘어가고 나중에 고치자" 금지
5. **사용자 판단이 필요한 지점에서는 반드시 AskUserQuestion 도구를 사용한다** — 텍스트로 질문하고 넘어가지 않는다

## 사용자 확인 포인트 (AskUserQuestion 필수)

파이프라인 실행 중 아래 상황에서는 **반드시 AskUserQuestion 도구로 사용자 응답을 받은 후** 진행한다.
일반 텍스트로 질문하고 응답을 기다리는 방식은 금지 — AskUserQuestion 도구를 사용해야 사용자가 명시적으로 선택할 수 있다.

| 상황 | AskUserQuestion 질문 | 선택지 |
|------|---------------------|--------|
| **중복 프로젝트 감지** | "'{pid}' 프로젝트가 이미 존재합니다. 어떻게 할까요?" | 1) 덮어쓰기 (처음부터) / 2) 이어서 실행 (--resume) / 3) 취소 |
| **복수 파일 발견** | "input/에 {N}개 파일이 있습니다. 어떤 것부터?" | 파일명 목록 제시 |
| **에셋 수집 범위** (Phase 0) | "에셋 수집 범위를 어떻게 설정할까요?" | 1) DevIcon만 / 2) DevIcon+이미지 에셋 / 3) DevIcon+이미지+배경 비디오 / 4) 전부(이미지+비디오+스크린샷) |
| **Phase 2 완료 후** | "씬 편집 에디터에서 수정하시겠습니까?" | 1) 바로 진행 / 2) 에디터에서 편집 후 계속 |
| **GATE 3 실패 (3회)** | "레이아웃 검증 3회 실패. 현재 상태로 진행할까요?" | 1) 현재 상태로 렌더링 / 2) 중단 |
| **GATE 5 실패** | "자가 검증 실패. {N}개 문제 프레임. 재설계할까요?" | 1) Phase 3로 돌아가 재설계 / 2) 현재 상태로 완료 |
| **렌더링 범위** (Phase 4) | "전체 영상을 렌더링할까요, 미리보기(2분)만 할까요?" | 1) 전체 / 2) 2분 미리보기 |

### 에셋 범위별 동작

사용자가 선택한 에셋 범위에 따라 각 Phase에서 수행하는 작업이 달라진다:

| 에셋 범위 | Phase 1 (chunk) | Phase 3 (layout) |
|----------|----------------|-----------------|
| **DevIcon만** | WebSearch 안 함. brand_keywords에서 DevIcon 매칭만 | DevIcon 노드만 사용 |
| **DevIcon+이미지** | WebSearch로 인물/브랜드/개념 PNG 수집 | DevIcon + ImageAsset 노드 사용 |
| **DevIcon+이미지+비디오** | 위 + Phase 3에서 Pexels 배경 비디오 fetch | 위 + 30~40% 씬에 background 설정 |
| **전부** | 위 + input/ 각주 스크린샷/동영상 포함 | 위 + screenshot 씬에 Split+ImageAsset |

이 선택값은 `project.json`의 `asset_mode` 필드에 저장하여 이후 Phase에서 참조:
```json
{ "asset_mode": "devicon+image+video" }
```

## 트리거 조건

다음 중 하나라도 해당하면 이 스킬을 자동 실행:
- 사용자가 "새 프로젝트", "새로 만들어", "새 영상" 언급
- 사용자가 "더빙 교체", "자막 교체", "새 더빙", "새 자막" 언급
- 사용자가 `/vg-new` 직접 호출
- `input/` 폴더에 아직 프로젝트화되지 않은 mp3+srt 쌍이 감지됨

## 호출

```
/vg-new                    # input/ 스캔 → 풀 파이프라인 (Phase 0~5)
/vg-new --name "프로젝트명"  # 프로젝트명 직접 지정
/vg-new --until chunk      # Phase 1(chunk)까지만 실행
/vg-new --until scene      # Phase 2(scene)까지만 실행
/vg-new --until layout     # Phase 3(layout)까지만 실행
/vg-new --resume {pid}     # 중단된 파이프라인 이어서 실행 (project.json의 status 기반)
```

`--until` 없으면 **풀 파이프라인(렌더링+자가검증까지)** 실행이 기본.
`--resume`는 이전에 중단된 프로젝트를 이어서 실행. status가 "chunked"면 Phase 2부터, "scened"면 Phase 3부터.

## 워크플로우 — Phase 기반 파이프라인

---

### Phase 0: 프로젝트 초기화

#### 0-1. input/ 폴더 스캔

```bash
ls input/
```

mp3와 srt 파일을 **같은 이름(확장자만 다른)** 쌍으로 매칭합니다.

예시:
```
input/가치 노동.mp3  +  input/가치 노동.srt  →  하나의 프로젝트
input/RAG4.mp3       +  input/RAG4.srt       →  하나의 프로젝트
```

#### 0-2. 프로젝트 ID 생성

파일명에서 자동 생성:
- 한글/공백 → 영문 슬러그 변환 (kebab-case)
- 예: `"가치 노동"` → `"gachi-nodong"` 또는 짧은 영문 요약
- 영문 파일명은 소문자 kebab-case로: `"RAG4"` → `"rag4"`
- 기존 프로젝트 ID와 충돌 시 숫자 접미사 추가: `"rag4-2"`

**한글 파일명 슬러그 변환 규칙:**
- 초성 기반 약어 사용: `"가치 노동"` → `"value-labor"`
- 또는 의미 기반 영문 번역 사용 (Codex가 판단)
- projectId는 반드시 영문 소문자 + 숫자 + 하이픈만 사용

### 3. 프로젝트 디렉토리 생성 + 파일 복사

```bash
# 디렉토리 생성
mkdir -p data/{projectId}
mkdir -p public/icons/{projectId}

# SRT 복사 (data/{projectId}/ 아래로)
cp "input/{filename}.srt" "data/{projectId}/{filename}.srt"

# 오디오 복사 (public/ 아래로, Remotion staticFile용)
cp "input/{filename}.mp3" "public/{filename}.mp3"
```

### 3.5. SRT 각주 이미지 처리

SRT 자막에 `[숫자]` 각주가 있고, input/ 폴더에 대응하는 이미지 파일이 있으면 자동 처리한다.

**SRT 각주 형식:**
```srt
4
00:00:06,760 --> 00:00:11,460
엔트로픽의 차세대 AI 모델 정보가 유출됐습니다, 이름은 Mythos [1]
```

**미디어 파일:** `input/1.png` (이미지) 또는 `input/2.mp4` (동영상)
지원 포맷: png, jpg, webp, mp4, webm

**처리 순서:**
1. SRT 파일에서 `[숫자]` 패턴을 모두 찾는다 (정규식: `\[(\d+)\]`)
2. 각 숫자에 대응하는 미디어 파일을 input/에서 찾는다 (`{n}.png`, `{n}.jpg`, `{n}.mp4` 등)
3. 미디어를 `public/icons/{projectId}/`로 복사 (동영상은 `public/videos/{projectId}/`로)
4. **연속 각주 구간 계산:** 같은 `[N]`이 여러 자막에 연속 등장하면 start_ms~end_ms 구간을 기록
   ```
   예: [1]이 자막 10(30360ms), 11(32020ms), 12(33050ms~35570ms)에 연속 → start_ms:30360, end_ms:35570
   ```
5. `public/icons/{projectId}/manifest.json`에 등록:
   ```json
   { "keyword": "[1]", "path": "icons/{projectId}/1.png", "type": "screenshot", "srt_index": 1, "start_ms": 30360, "end_ms": 35570, "media_type": "image" }
   ```
   동영상이면:
   ```json
   { "keyword": "[2]", "path": "videos/{projectId}/2.mp4", "type": "screenshot", "srt_index": 2, "start_ms": 125510, "end_ms": 146740, "media_type": "video" }
   ```
6. SRT에서 `[숫자]` 태그를 제거한 깨끗한 버전을 data/{projectId}/에 저장

**input/ 폴더 예시:**
```
input/
  ├── 바이브 뉴스.mp3
  ├── 바이브 뉴스.srt     ← [1], [2], [3] 각주
  ├── 1.png               ← GitHub 스크린샷
  ├── 2.png               ← 뉴스 캡처
  └── 3.jpg               ← 데모 화면
```

### 4. project.json 생성

```json
{
  "id": "{projectId}",
  "name": "{파일명 또는 사용자 지정명}",
  "srt_path": "{filename}.srt",
  "audio_path": "{filename}.mp3",
  "created_at": "2026-03-13T...",
  "updated_at": "2026-03-13T...",
  "status": "draft",
  "total_duration_ms": 0
}
```

#### GATE 0: 프로젝트 초기화 검증

```
✅ 통과 조건 (전부 충족):
  - data/{projectId}/project.json 존재
  - SRT 파일 파싱 가능 (entries ≥ 10)
  - public/{audio}.mp3 존재 + 파일 크기 > 100KB
  - public/icons/{projectId}/ 디렉토리 존재

❌ 실패 시: 에러 메시지 출력 + 파이프라인 중단
```

통과하면 project.json status를 `"initialized"`로 업데이트하고 Phase 1 진행.

---

### Phase 1: /vg-chunk — 의미 청킹 + 에셋 수집

**반드시 Skill tool로 `/vg-chunk {projectId}` 발동한다. 스크립트 직접 실행 금지.**

수행 내용:
1. SRT 전문 의미 분석 → beats.json 생성
2. WebSearch로 인물 사진, 브랜드 로고, 개념 아이콘 수집
3. manifest.json 업데이트

#### GATE 1: 청킹 품질 검증

```
✅ 통과 조건:
  - data/{projectId}/beats.json 존재
  - beats 개수 ≥ 5
  - 모든 standalone beat에 focal_candidate 존재
  - manifest 에셋 ≥ 8개 (DevIcon 활용 가능 브랜드 포함)
  - scene_role 4종 이상 사용
  - energy "sharp"/"explosive" beat ≥ 20%

❌ 실패 시:
  - 에셋 부족 → WebSearch 추가 수집 후 재검증
  - focal 누락 → beats.json 해당 beat 수정 후 재검증
  - 재검증 최대 2회. 2회 실패 시 사용자에게 보고 + 중단
```

통과하면 project.json status를 `"chunked"`로 업데이트.

---

### Phase 2: /vg-scene — 씬 블록 생성

**반드시 Skill tool로 `/vg-scene {projectId}` 발동한다.**

수행 내용:
1. beats를 scene block으로 묶기 (2~4 beats, 5.5~14초)
2. scoring-engine으로 레이아웃 선택
3. scenes-v2.json + scene-plan.json 생성
4. 후처리 파이프라인 실행

#### GATE 2: 씬 구조 검증

```
✅ 통과 조건:
  - data/{projectId}/scenes-v2.json 존재
  - 씬 개수 ≥ 3
  - 모든 씬에 duration_frames > 0
  - 모든 씬에 narration 또는 copy_layers 존재

❌ 실패 시: 에러 보고 + 재실행 (최대 1회)
```

통과하면 project.json status를 `"scened"`로 업데이트.

**PAUSE 포인트 — AskUserQuestion 필수:**
```
AskUserQuestion 도구로 질문:
  "Phase 2 완료 — {N}개 씬 생성됨. 에디터에서 씬 경계를 수정하시겠습니까?
   편집 링크: http://localhost:3001/chunk?projectId={projectId}"

선택지:
  1) "바로 진행" → Phase 3 즉시 시작
  2) "편집 후 계속" → 사용자가 다시 "계속"이라고 할 때까지 대기
```

사용자 응답을 받은 후에만 Phase 3 진행. 응답 없이 넘어가지 않는다.

---

### Phase 3: /vg-layout — 씬별 TSX 컴포넌트 수동 설계 (R11 원칙 A)

**반드시 Skill tool로 `/vg-layout {projectId}` 발동한다.**
**기본 실행 모드는 `src/remotion/custom/scene-NN.tsx` TSX 컴포넌트 작성이다 (scene-grammar v1.4 원칙 A).** stack_root JSON 트리 realize 방식은 3조건 동시 만족 시만 허용되는 좁은 예외.

**🚫 mass realizer / 배치 스크립트 ABSOLUTE BAN:**
씬 목록을 순회하며 TSX 파일 또는 stack_root 를 템플릿으로 찍어내는 스크립트 작성 금지.
`scripts/gen-layouts-*.{py,js,ts}`, `build-layouts-batch.*`, 또는 scenes-v2.json 전체를 한 번에
덮어쓰는 생성기를 새로 만들지 마라. 반드시 Edit/Write 로 **씬 단위 직접 authoring**.
10~15씬씩 배치로 나눠 여러 턴에 진행해도 된다.

수행 내용:
1. scenes-v2.json 의 모든 씬을 읽는다 (narration + visual_plan 참고 힌트)
2. 씬별 감정/핵심 메시지 추출 → "관람자가 느껴야 할 것 한 줄"
3. `src/remotion/custom/scene-NN.tsx` 작성 (Remotion primitives + 고유 JSX 트리)
   - DSL 노드 필요 시 `import { D } from "./_dsl"` 로 `<D type="..."/>` 패턴 사용 (원칙 B)
4. `src/remotion/custom/registry.ts` 에 컴포넌트 등록
5. `scenes-v2.json[i].stack_root` 를 TSX wrapper 로 교체:
   ```json
   { "type": "SceneRoot", "children": [
     { "type": "TSX", "data": { "component": "scene-NN" },
       "layout": { "width": "100%", "height": "100%" } }
   ]}
   ```
6. `bash scripts/render-single-scene.sh {pid} N /tmp/scene-N.png` → PNG 생성 + Read 육안 확인
7. `node scripts/sync-render-props.js data/{pid}/scenes-v2.json`
8. `bash scripts/postprocess.sh data/{pid}/scenes-v2.json` → ⓪-pre/⓪-tsx/⓪-dsl 체인 자동 검증

#### GATE 3: TSX / DSL 품질 검증 (HARD — R11 기준)

```
✅ 통과 조건 (전부 충족):
  - 모든 씬에 stack_root 존재 (TSX wrapper 또는 DSL)
  - TSX 씬 비율 ≥ 95% (실질 100% 권고, DSL 은 3조건 strict)
  - ⓪-tsx1 structural-signature cluster ≤ 2 (trio 쌍둥이 금지)
  - ⓪-tsx2 <OffthreadVideo> narration 매칭 (비디오 있는 경우)
  - ⓪-tsx3 JSX string ↔ SRT Levenshtein ≤ 0.6
  - ⓪-dsl DSL 씬 _dsl_rationale 3조건 각 10자+ 근거
  - registry.ts 에 모든 scene-NN TSX 컴포넌트 등록

❌ 실패 시:
  - 위반 씬 목록 출력
  - DSL 씬은 TSX 전환 우선 (원칙 A 기본값)
  - TSX 씬은 JSX 트리 재설계 (trio 회피, 비디오 교체, 텍스트 추상화)
  - 재검증 (최대 3회)
  - 3회 실패 시 현재 상태로 사용자에게 보고 + 판단 요청
```

통과하면 project.json status를 `"layouted"`로 업데이트.

---

### Phase 4: /vg-render — 렌더링

**반드시 Skill tool로 `/vg-render {projectId}` 발동한다.**

수행 내용:
1. 후처리 파이프라인 실행 (최종)
2. render-props-v2.json 동기화
3. 오디오 파일 public/ 복사 확인
4. `npx remotion render` 실행

#### GATE 4: 렌더링 완료 검증

```
✅ 통과 조건:
  - output/{projectId}.mp4 존재
  - 파일 크기 > 1MB
  - 렌더링 exit code = 0

❌ 실패 시:
  - 에러 로그 분석
  - 문제 씬 식별 → stack_root 수정 → Phase 3 GATE 재검증 → 재렌더링
  - 최대 2회 재시도
```

통과하면 project.json status를 `"rendered"`로 업데이트.

---

### Phase 5: 자가 검증 — 프레임 시각 품질 확인

**이 Phase는 생략 불가. 렌더링이 끝나면 반드시 실행한다.**

수행 내용:
1. ffmpeg로 5초 간격 프레임 추출: `ffmpeg -i output/{pid}.mp4 -vf "fps=1/5" -q:v 2 tmp/frames-{pid}/f_%03d.jpg`
2. 추출된 프레임을 Read tool로 직접 확인 (최소 12프레임)
3. 각 프레임 분석:
   - 빈 화면 (검은색 90%+) 여부
   - 텍스트만 있고 비주얼 요소 없음 여부
   - 에셋(ImageAsset/DevIcon) 실제 가시성
   - 요소 겹침/충돌 여부

#### GATE 5: 시각 품질 검증

```
✅ 통과 조건:
  - 빈 화면 ≤ 1개 / 전체 프레임
  - "텍스트만 있는 화면" ≤ 30%
  - DevIcon/ImageAsset 가시 프레임 ≥ 3개
  - 요소 겹침 0개

❌ 실패 시:
  - 문제 프레임 + 해당 씬 번호 보고
  - Phase 3로 돌아가 해당 씬 재설계
  - 재렌더링 + 재검증 (최대 1회)
```

통과하면 **최종 결과 보고**:

```
✅ 영상 생성 완료: '{projectId}'
  - 출력: output/{projectId}.mp4 ({size}MB, {duration})
  - 씬: {N}개, 컨테이너 분포: Split {a}% / Grid {b}% / Compound {c}%
  - 에셋: {M}개 사용 (DevIcon {d} + ImageAsset {e})
  - 자가 검증: PASS (빈 화면 {f}개, 에셋 가시 {g}개)
```

---

### Phase 간 상태 추적

project.json의 `status` 필드로 현재 위치를 추적:

| status | 의미 | 다음 Phase |
|--------|------|-----------|
| `draft` | 프로젝트 생성됨 | Phase 0 |
| `initialized` | 파일 복사 완료 | Phase 1 |
| `chunked` | beats.json 완료 | Phase 2 |
| `scened` | scenes-v2.json 완료 | Phase 3 |
| `layouted` | stack_root 설계 완료 | Phase 4 |
| `rendered` | mp4 렌더링 완료 | Phase 5 |
| `verified` | 자가 검증 통과 | 완료 |

`--resume {pid}`는 이 status를 읽어서 해당 Phase부터 재개.

## 중복 감지 — AskUserQuestion 필수

기존 프로젝트와의 중복을 감지합니다:
1. `data/*/project.json`을 모두 읽기
2. 각 프로젝트의 `srt_path`와 `audio_path`를 비교
3. 같은 파일명이 이미 프로젝트에 연결되어 있으면:

```
AskUserQuestion 도구로 질문:
  "'{projectId}' 프로젝트가 이미 존재합니다 (status: {status}). 어떻게 할까요?"

선택지:
  1) "덮어쓰기" → 기존 beats.json, scenes-v2.json 삭제 후 Phase 0부터 재시작
  2) "이어서 실행" → 현재 status 기반으로 해당 Phase부터 재개 (--resume 동작)
  3) "취소" → 파이프라인 중단
```

**AskUserQuestion 응답을 받기 전에 절대 진행하지 않는다.**

## 복수 파일 지원

input/에 여러 쌍이 있으면:
```
input/가치 노동.mp3 + .srt
input/RAG4.mp3 + .srt
```
→ 목록을 보여주고 어떤 것부터 할지 사용자에게 선택을 요청합니다.
→ 하나만 있으면 바로 진행합니다.

## 에러 처리

| 상황 | 동작 |
|------|------|
| input/ 비어있음 | "input/ 폴더에 mp3+srt 파일을 넣어주세요" |
| mp3만 있고 srt 없음 | "'{name}.srt' 파일이 없습니다" |
| srt만 있고 mp3 없음 | "'{name}.mp3' 파일이 없습니다" (경고만, 진행 가능) |
| SRT 파싱 실패 | "SRT 형식이 올바르지 않습니다" |
| 디스크 공간 부족 | 파일 복사 실패 시 에러 메시지 |

## 예시 실행 흐름

```
사용자: "더빙과 자막을 새로 넣었어"
Codex: input/ 폴더를 스캔합니다...

  발견: 가치 노동.mp3 + 가치 노동.srt

  프로젝트 생성 중...
  - ID: value-labor
  - 이름: 가치 노동

  beats.json 생성 중... ✓ 250 beats
  기본 장면 분리 중... ✓ 21개 씬 자동 생성

  ✅ 프로젝트 'value-labor' 생성 완료
  - 이름: 가치 노동
  - 자막: 250개, 11분 39초
  - 기본 장면 분리: 21개 씬 자동 생성 완료

  👉 장면 편집이 필요하면 아래 링크에서 수정하세요 (선택사항):
     http://localhost:3001/chunk?projectId=value-labor
     편집 후 저장하면 scenes-v2.json이 자동 업데이트됩니다.

  👉 바로 진행하려면 "/vg-layout value-labor" 를 요청해주세요.
```
