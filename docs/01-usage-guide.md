# newVideoGen 사용 가이드

> 주제 텍스트 하나로 교육 영상을 자동 생성합니다.

## 영상 제작 파이프라인

```
/vg-script → /vg-voice → /vg-chunk → ✏️ 에디터 → /vg-scene → /vg-layout → /vg-render
   대본        음성+자막     의미 청킹    씬 분할 조정   씬 구조 생성   레이아웃 생성    mp4 렌더링
```

모든 단계를 거칠 필요는 없습니다. MP3+SRT가 준비되어 있으면 `/vg-chunk`부터 시작합니다.

---

## 방법 A: 주제만으로 영상 만들기 (End-to-End)

```bash
# 1. 대본 생성 — Claude가 챕터 구조 + 나레이션 텍스트 작성
/vg-script "SaaS 풀스택 서비스 개발"

# 2. 음성 + 자막 생성 — ElevenLabs TTS
/vg-voice saas-fullstack

# 3. 의미 청킹 — SRT를 의미 단위(beat)로 분할
/vg-chunk saas-fullstack

# 4. ✏️ 씬 분할 조정 (선택) — 에디터에서 경계 편집
# http://localhost:3001/chunk?projectId=saas-fullstack

# 5. 씬 구조 생성 — beat → scene DSL + 트랜지션 + 레이아웃 선택
/vg-scene saas-fullstack

# 6. (선택) 에셋 태깅 — 이미지/GIF 자동 태그
/vg-assets

# 7. AI 레이아웃 생성 — stack_root JSON 트리 + 커스텀 SVG
/vg-layout saas-fullstack

# 8. 렌더링
/vg-render saas-fullstack
```

### 사전 설정

- `.env`에 `ELEVENLABS_API_KEY` 설정
- `.env`에 `ELEVENLABS_VOICE_ID` 설정

---

## 방법 B: MP3 + SRT로 영상 만들기

이미 더빙 음성과 자막이 준비된 경우:

```bash
# 1. input/ 폴더에 파일 배치
# input/{이름}.mp3 + input/{이름}.srt (파일 이름 동일해야 함)

# 2. 의미 청킹
/vg-chunk {projectId}

# 3. ✏️ 씬 분할 조정 (선택)
# http://localhost:3001/chunk?projectId={projectId}

# 4. 씬 구조 생성
/vg-scene {projectId}

# 5. AI 레이아웃 생성
/vg-layout {projectId}

# 6. 렌더링
/vg-render {projectId}
```

**팁**: `/vg-new`를 사용하면 프로젝트 초기화 + chunk + scene을 한번에 실행합니다.
다만 에디터에서 씬 분할을 조정하고 싶다면 `/vg-chunk`까지만 실행 후 에디터에서 편집하세요.

---

## 방법 C: 슬라이드 영상 만들기

SRT/MP3 없이 목차만으로 슬라이드 영상을 생성합니다.

```bash
/vg-slides "프로젝트 소개"
```

---

## Slash Commands 전체 목록

| 명령어 | 역할 | 단계 |
|--------|------|------|
| `/vg-script "주제"` | 주제 → 대본 (script.json + script.md) | Step 1 |
| `/vg-voice {id}` | 대본 → TTS → MP3 + SRT | Step 2 |
| `/vg-chunk {id}` | SRT → beats.json (의미 청킹) | Step 3 |
| `/vg-scene {id}` | beats → scene-plan + scenes + 트랜지션 배정 | Step 5 |
| `/vg-layout {id}` | Claude가 stack_root JSON + 커스텀 SVG 직접 생성 | Step 7 |
| `/vg-render {id}` | scenes-v2 → TransitionSeries → mp4 렌더링 | Step 8 |
| `/vg-new` | input/ 스캔 → 프로젝트 생성 → chunk + scene 자동 실행 | 단축 |
| `/vg-slides "제목"` | 텍스트 목차 → 슬라이드 영상 | 독립 |
| `/vg-assets` | public/assets/ 스캔 → 이미지/GIF 태그 자동 생성 | 선택 |
| `/vg-catalog` | 레이아웃 카탈로그 + 모션 프리셋 생성 | 참조 |
| `/vg-analyze` | 레퍼런스 이미지 디자인 토큰 추출 | 참조 |

---

## 웹 UI (Next.js)

```bash
npm run dev
# http://localhost:3001
```

### 주요 페이지

| URL | 설명 | 파이프라인 단계 |
|-----|------|---------------|
| `/` | 프로젝트 대시보드 | — |
| `/chunk?projectId={id}` | 청크 에디터 (씬 경계 편집) | Step 3 → 4 사이 |
| `/scene-editor?projectId={id}` | 씬 에디터 (stack_root 시각 편집) | Step 7 이후 |

### 주요 API 엔드포인트

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| GET | `/api/projects/{id}/scenes-v2` | scenes-v2 조회 |
| PATCH | `/api/projects/{id}/scenes-v2/{idx}/stack-root` | 개별 씬 stack_root 수정 |
| POST | `/api/projects/{id}/render` | 렌더 작업 시작 |
| GET | `/api/srt?projectId={id}` | SRT 자막 조회 |
| POST | `/api/srt/save-chunks` | 청크 경계 저장 |

---

## 이미지/GIF 에셋 활용

```bash
# 1. 파일을 public/assets/에 넣기
public/assets/
  ├── supabase.png
  ├── nextjs.svg
  └── characters/
      └── smurf/greeting.png

# 2. 에셋 스캔 + 태깅
/vg-assets

# 3. 레이아웃 생성 시 자동 매칭
/vg-layout {projectId}
```

---

## 후처리 파이프라인 (수동 실행)

레이아웃 생성 후 품질 개선이 필요할 때:

```bash
# ① 자막-노드 키워드 매칭으로 enterAt 동기화
npx tsx scripts/sync-enterAt.ts data/{id}/scenes-v2.json

# ② 콘텐츠 높이 기반 gap/maxWidth 자동 조정
npx tsx scripts/optimize-layout.ts data/{id}/scenes-v2.json

# ③ sparse 씬에 InsightTile 자동 삽입
node scripts/pad-sparse-scenes.js data/{id}/scenes-v2.json

# ④ enterAt 갭 재분배 + 컨테이너 동기화
node scripts/fix-all-enterAt-gaps.js data/{id}/scenes-v2.json
```

순서를 반드시 지켜야 합니다 (① → ② → ③ → ④).

---

## 트러블슈팅

### 자막이 표시되지 않음
- scenes-v2.json의 `subtitles[].startTime`이 씬 내 상대값인지 확인

### 빈 카드가 렌더링됨
- IconCard: `{ icon, title, body }` (desc가 아닌 **body**)
- CompareCard: `{ left: { icon, title, subtitle, negative }, right: { ... } }`

### 렌더링 오류 (React error #31)
- `TerminalBlock.lines`는 문자열 배열 (`string[]`)이어야 함

### GIF가 정지 이미지로만 표시됨
- `@remotion/gif` 패키지 설치 확인, `src`가 `.gif` 확장자
