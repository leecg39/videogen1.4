---
name: vg-cinematic
description: B-roll 스타일 시네마틱 영상 생성 — 전체 화면 비디오 클립 + 하단 자막 오버레이
---

# /vg-cinematic — 시네마틱 영상 생성

B-roll 스타일 비디오 클립 기반 영상을 생성합니다.
전체 화면에 무음 비디오 클립을 재생하고 하단에 자막을 오버레이합니다.

## 호출

```
/vg-cinematic {projectId}
```

## 전제조건

- `data/{projectId}/beats.json`이 존재해야 함 (없으면 `/vg-chunk` 먼저 실행)
- 환경변수 `PEXELS_API_KEY` 설정 필요
- `public/` 에 오디오 파일(더빙.mp3) 복사 완료

## 워크플로우

### 1. beats.json 확인

```bash
ls data/{projectId}/beats.json
```

없으면 사용자에게 `/vg-chunk {projectId}` 실행을 안내합니다.

### 2. 시네마틱 scenes-v2.json 생성

```bash
npx tsx scripts/gen-cinematic-scenes.ts {projectId}
```

이 스크립트는 기본 구조만 생성합니다. 다음 단계에서 video_queries를 보강합니다.

### 3. 영문 검색 키워드 생성

Claude가 각 씬의 narration을 분석하여 Pexels 검색에 적합한 영문 키워드를 생성합니다.

**키워드 가이드라인:**
- 구체적이고 시각적인 키워드 사용 (❌ "technology" → ✅ "person typing on laptop close up")
- 감정/분위기 포함 (❌ "city" → ✅ "city skyline sunset golden hour")
- 동작 묘사 포함 (❌ "team" → ✅ "diverse team collaborating whiteboard")
- 2-5단어 조합이 최적
- 추상적 개념은 메타포로 변환 (❌ "artificial intelligence" → ✅ "neural network visualization blue")

scenes-v2.json의 각 씬에서 `assets.video_queries[0].query`를 영문 키워드로 업데이트합니다.

### 4. 비디오 다운로드

```bash
npx tsx scripts/fetch-scene-videos.ts data/{projectId}/scenes-v2.json
```

Pexels API로 HD 720p+ MP4를 검색/다운로드합니다.
다운로드 경로: `public/videos/{projectId}/`

### 5. 비디오 경로 반영

다운로드 완료 후, 각 씬의 `stack_root.children[0].data.src`를
`assets.videos[0].localPath` 값으로 업데이트합니다.

Claude가 scenes-v2.json을 읽어서 자동으로 반영합니다:

```javascript
// 각 씬에 대해:
scene.stack_root.children[0].data.src = scene.assets.videos[0].localPath;
```

### 6. 후처리

```bash
bash scripts/postprocess-cinematic.sh data/{projectId}/scenes-v2.json
```

타이밍 보정(fix-transition-drift)만 수행합니다.
인포그래픽 전용 단계(sync-enterAt, fix-row-spacing 등)는 제거됨.

### 7. render-props-v2.json 동기화

scenes-v2.json 변경사항을 render-props-v2.json에 반영합니다.

```bash
# Claude가 직접 render-props-v2.json의 scenes 배열을 업데이트
```

### 8. 렌더링

```
/vg-render {projectId}
```

## 출력 파일

- `data/{projectId}/scenes-v2.json` — 시네마틱 씬 데이터
- `data/{projectId}/render-props-v2.json` — Remotion 렌더 설정
- `public/videos/{projectId}/*.mp4` — 다운로드된 비디오 클립
- `output/{projectId}.mp4` — 최종 렌더링 결과

## 품질 체크리스트

- [ ] 모든 씬에 비디오 클립이 할당되었는가?
- [ ] 빈 `src`가 있는 VideoClip이 없는가?
- [ ] video_queries의 키워드가 씬 내용과 관련이 있는가?
- [ ] 자막(SubtitleBar)이 비디오 위에 정상 표시되는가?
- [ ] 크로스페이드 전환이 자연스러운가?
- [ ] 총 재생 시간이 오디오와 일치하는가?

## 인포그래픽 vs 시네마틱 비교

| 항목 | 인포그래픽 (/vg-scene) | 시네마틱 (/vg-cinematic) |
|------|----------------------|------------------------|
| 시각 스타일 | StackNode 트리 (텍스트, 차트, 아이콘) | 전체 화면 B-roll 비디오 |
| 씬 구조 | 복잡한 레이아웃 (Split, Grid 등) | 단순 (SceneRoot > VideoClip) |
| 에셋 | SVG 아이콘, 이미지 | Pexels HD 비디오 클립 |
| 후처리 | 5단계 파이프라인 | 1단계 (타이밍 보정만) |
| 자막 | 동일 (SubtitleBar) | 동일 (SubtitleBar) |
| 전환 | 다양한 타입 | 크로스페이드 기본 |
