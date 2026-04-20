# newVideoGen 워크플로우

> 주제 텍스트 하나로 교육 영상을 자동 생성하는 End-to-End 파이프라인을 설명합니다.

## 전체 파이프라인

```
"SaaS 풀스택 서비스 개발" (주제 텍스트)
              │
              ▼
    ┌─────────────────────┐
    │  Step 1: /vg-script │  Claude가 대본 생성 (script.json + script.md)
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 2: /vg-voice  │  ElevenLabs TTS → MP3 + SRT
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 3: /vg-chunk  │  SRT → beats.json (의미 단위 분할)
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 4: ✏️ 에디터   │  씬 경계 수동 조정 (선택)
    │  /chunk?projectId=  │  http://localhost:3001/chunk?projectId={id}
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 5: /vg-scene  │  beats → scenes-v2.json + 트랜지션 배정
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 6: /vg-assets │  (선택) 이미지/GIF 스캔 + 태그 생성
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 7: /vg-layout │  Claude가 stack_root JSON 트리 생성
    │  + 커스텀 SvgGraphic │  씬 의미에 맞는 SVG 직접 디자인
    │  + 에셋 매칭         │  manifest.json 태그 ↔ 씬 키워드
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 7.5: 후처리    │  bash scripts/postprocess.sh (5단계)
    │  (자동 실행)         │  자막 싱크 + 간격 보정 + gap 최적화 + 패딩 + 재분배
    └────────┬────────────┘
             ▼
    ┌─────────────────────┐
    │  Step 8: /vg-render │  TransitionSeries + Remotion CLI → mp4
    └────────┬────────────┘
             ▼
      output/{projectId}.mp4
```

### 기존 방식 (MP3 + SRT 직접 준비)

```
input/{name}.mp3 + input/{name}.srt → Step 3 /vg-chunk 부터 시작
```

### 단축 명령어 /vg-new

`/vg-new`는 Step 3 + Step 5를 한 번에 자동 실행합니다.
씬 경계를 직접 조정하고 싶다면 `/vg-chunk`만 먼저 실행 → 에디터 편집 → `/vg-scene` 순서로 진행하세요.

---

## Step 1: 대본 생성 (`/vg-script`) — 선택

주제 텍스트만 입력하면 Claude가 교육 영상용 대본을 자동 생성합니다.

### 입력
- 주제 텍스트: `"AI와 코딩의 미래"`

### 처리
1. 주제 분석 → 핵심 메시지, 타겟 청중, 톤 결정
2. 챕터 구조 설계 (도입 → 전개 → 절정 → 마무리)
3. 각 챕터별 나레이션 텍스트 작성 (구어체, 짧은 문장)

### 출력
```
data/{projectId}/
  ├── project.json     # status: "scripted"
  ├── script.json      # 구조화된 대본 (챕터별 paragraphs)
  └── script.md        # 읽기 쉬운 대본
```

---

## Step 2: 음성 생성 (`/vg-voice`) — 선택

대본을 ElevenLabs TTS로 변환하여 MP3 + SRT를 생성합니다.

### 입력
- `data/{projectId}/script.json`

### 처리
1. 각 챕터 텍스트를 ElevenLabs `/v1/text-to-speech/{voice_id}/with-timestamps` API 호출
2. 글자별 타임스탬프를 문장 단위 SRT로 변환
3. 챕터별 MP3를 ffmpeg로 병합

### 출력
```
input/{projectId}.mp3      # TTS 음성
input/{projectId}.srt      # 문장 단위 자막
```

---

## Step 3: 의미 청킹 (`/vg-chunk`)

SRT 자막을 의미 단위(beat)로 분할합니다.

### 입력
- `input/{projectId}.srt`

### 처리
1. SRT 파싱 → 개별 자막 엔트리
2. 의미 분석: intent, tone, evidence_type, emphasis_tokens, density
3. 관련 자막을 그룹핑하여 beat 생성

### 출력
```
data/{projectId}/beats.json    # Beat[] (의미 분석된 자막 단위)
project.json status → "chunked"
```

### beats.json 구조
```json
{
  "beat_index": 0,
  "start_ms": 0,
  "end_ms": 6920,
  "start_frame": 0,
  "end_frame": 207,
  "text": "여러분, 혹시 이런 이야기 들어보셨나요? ...",
  "semantic": {
    "intent": "emphasize",
    "tone": "questioning",
    "evidence_type": "statement",
    "emphasis_tokens": ["SaaS", "월 천만 원"],
    "density": 3
  }
}
```

---

## Step 4: 씬 분할 조정 (에디터) — 선택

**이 단계는 `/vg-chunk` 이후, `/vg-scene` 이전에 수행합니다.**

```
http://localhost:3001/chunk?projectId={id}
```

- 자막 사이를 클릭하여 씬 경계(cut) 설정/해제
- beat를 합치거나 분리하여 씬 크기 조정
- 저장 시 `chunks.json` + `scenes-v2.json` 동시 생성

---

## Step 5: 씬 구조 생성 (`/vg-scene`)

beats.json을 기반으로 각 씬의 레이아웃 패밀리, 트랜지션, 기본 구조를 결정합니다.

### 처리
1. scoring-engine으로 각 beat에 최적 레이아웃 선택
2. 씬 간 트랜지션 배정 (crossfade, slide, wipe, zoom, blur-through 등)
3. copy_layers, motion, assets 기본값 생성
4. scene-plan.json + scenes-v2.json 출력

### 씬 트랜지션 유형 (12종)
| 유형 | 설명 | 권장 |
|------|------|------|
| `crossfade` | 교차 전환 | 기본 |
| `slide-left/right/up/down` | 방향별 슬라이드 | 비교, 단계별 |
| `wipe-right/down` | 닦아내기 | 챕터 전환 |
| `zoom-in/out` | 확대/축소 | 강조, 극적 전환 |
| `blur-through` | 블러 효과 | 챕터 브레이크 |
| `none` | 전환 없음 | 마지막 씬 |

### 출력
```
data/{projectId}/
  ├── scene-plan.json    # 레이아웃 선택 점수표
  ├── scenes-v2.json     # Scene[] (stack_root는 이 시점에 기본 구조)
  └── render-props-v2.json
project.json status → "scened"
```

---

## Step 6: 에셋 준비 (`/vg-assets`) — 선택

`public/assets/`에 이미지/GIF를 넣어두면 Claude가 태그를 생성합니다.

### 출력
```json
// public/assets/manifest.json
[
  {
    "file": "assets/supabase.png",
    "type": "image",
    "tags": ["Supabase", "BaaS", "데이터베이스", "인증"],
    "category": "tech",
    "alt": "Supabase 로고"
  }
]
```

---

## Step 7: AI 레이아웃 생성 (`/vg-layout`)

Claude가 각 씬의 자막 + 의미 분석 + 에셋을 읽고 `stack_root` JSON 트리를 직접 생성합니다.

### 핵심 기능
- **stack_root 생성**: 28종 leaf + 9종 컨테이너 자유 조합
- **커스텀 SVG (`SvgGraphic`)**: 씬 의미에 맞는 SVG를 직접 디자인하여 삽입
- **에셋 매칭**: manifest.json 태그 ↔ 씬 키워드 자동 매칭
- **후처리 4단계**: enterAt 동기화 → gap 최적화 → 패딩 → 갭 재분배

### 후처리 파이프라인
```bash
npx tsx scripts/sync-enterAt.ts data/{id}/scenes-v2.json
npx tsx scripts/optimize-layout.ts data/{id}/scenes-v2.json
node scripts/pad-sparse-scenes.js data/{id}/scenes-v2.json
node scripts/fix-all-enterAt-gaps.js data/{id}/scenes-v2.json
```

---

## Step 8: 렌더링 (`/vg-render`)

### 처리
1. `render-props-v2.json` 동기화
2. Remotion CLI 렌더링:
   ```bash
   npx remotion render MainComposition output/{id}.mp4 \
     --props=data/{id}/render-props-v2.json --concurrency=4
   ```

### 렌더링 내부 흐름
```
render-props-v2.json
    ↓ (Composition.tsx)
TransitionSeries로 씬 순차 배치 + 씬 간 트랜지션
    ↓ (각 씬)
SceneWithEffects → exit 애니메이션 + zoom/blur 효과
    ↓
SceneRenderer → stack_root → SceneShell + StackRenderer
    ↓ (StackRenderer)
SceneRoot → 재귀 RenderNode → 26종 모션 프리셋 적용
    ↓
SubtitleBar (하단 자막) + Audio (음성 트랙)
```

### 출력
```
output/{projectId}.mp4    # 1920×1080, 30fps, h264
```

---

## 데이터 파일 생명주기

```
project.json    scripted → voiced → chunked → scened → rendered
                   │         │         │         │         │
script.json ──────┘         │         │         │         │
input/{id}.mp3 + .srt ─────┘         │         │         │
beats.json ───────────────────────────┘         │         │
scenes-v2.json ─────────────────────────────────┘         │
render-props-v2.json + output/*.mp4 ──────────────────────┘
```

| 파일 | 생성 시점 | 갱신 시점 |
|------|----------|----------|
| `script.json` | `/vg-script` | 대본 수정 시 |
| `project.json` | `/vg-script` 또는 `/vg-new` | 각 단계 status 업데이트 |
| `beats.json` | `/vg-chunk` | 재생성 시에만 |
| `chunks.json` | 청크 에디터 저장 | 재편집 시 |
| `scenes-v2.json` | `/vg-scene` 또는 에디터 저장 | `/vg-layout` + 후처리 |
| `render-props-v2.json` | `/vg-scene` 또는 `/vg-render` | 렌더링 전 |
| `manifest.json` | `/vg-assets` | 에셋 추가/삭제 시 |

---

## 반복 개선 사이클

영상 결과가 마음에 들지 않을 때:

1. **씬 분할 재조정**: 에디터에서 `/chunk` → `/vg-scene` 재실행
2. **개별 씬 수정**: 씬 에디터 또는 직접 scenes-v2.json 수정
3. **레이아웃 재생성**: `/vg-layout` 다시 실행
4. **후처리 재실행**: sync-enterAt → optimize-layout → pad-sparse → fix-gaps
5. **재렌더링**: `/vg-render`
