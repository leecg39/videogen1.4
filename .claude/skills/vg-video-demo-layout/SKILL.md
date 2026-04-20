---
name: vg-video-demo-layout
description: video-spec.json + voice-timeline → scenes-v2.json 변환. 세그먼트당 1씬, VideoCanvas + Cursor + SubtitleBar 트리, hotspot 기반 커서 경로 자동 생성. /vg-video-demo Phase 3 전용.
---

# /vg-video-demo-layout — Video Scene 트리 생성

/vg-demo-layout 의 비디오 버전. ImageCanvas 대신 **VideoCanvas** 노드로, 원본 mp4 의 특정 구간을 `startFrom` 으로 재생한다.

## 트리거

```
/vg-video-demo-layout {pid}
```

## 사전 조건

- `data/{pid}/video-spec.json` 모든 세그먼트 `narration_ms` 채워짐
- `data/{pid}/voice-timeline.json` 존재

## 핵심 변환 규칙

### 1. 세그먼트 → 씬 매핑 (fps=30)

```
duration_frames = ceil(max(narration_ms, endMs - startMs) * 30 / 1000)
```

- **narration_ms > 원본 구간 길이** 면 씬이 narration 에 맞춰 확장. OffthreadVideo 는 끝나면 last frame 을 유지하므로 자연스럽게 정지됨.
- **narration_ms < 원본 구간 길이** 면 씬 길이는 원본 구간에 맞춤. 나레이션 뒤 무음이 살짝 남는 것을 허용 (apad 250ms 로 이미 보완).

### 2. VideoCanvas 노드

```json
{
  "id": "video",
  "type": "VideoCanvas",
  "data": {
    "src": "{spec.videoSrc}",                    // 예: "videos/my-demo/source.mp4"
    "mediaAspect": {videoWidth/videoHeight},     // spec 값 계산
    "startFrom": {segment.startMs},              // ms. VideoCanvas 가 내부에서 fps 변환
    "muted": {!segment.keepOriginalAudio},       // 기본 true
    "frame3d": true                              // basePadding 48 + radius 24
  }
}
```

**주의**: `startFrom` 은 ms 단위로 저장. VideoCanvas 내부에서 `Math.round(ms * fps / 1000)` 으로 프레임 변환.

### 3. Cursor 노드 (hotspot 있을 때만)

MVP: segment 당 hotspot 0/1 개.

```json
{
  "id": "cursor",
  "type": "Cursor",
  "data": {
    "size": 56,
    "imagePadding": 48,
    "imageAspect": {videoWidth/videoHeight},
    "path": [
      { "frame": 0,                "x": 0.1,            "y": 0.1 },
      { "frame": {dur * 0.65},     "x": {hotspot.x},    "y": {hotspot.y} }
    ],
    "clicks": [
      { "frame": {dur * 0.72} }
    ]
  }
}
```

**조건**:
- `segment.showCursor === false` → Cursor 노드 자체를 생략
- `segment.hotspot == null` → Cursor 노드 생략 (커서가 화면 안에서 떠다닐 필요 없음)
- `segment.hotspot.kind !== "click"` → `clicks` 배열 비움

### 4. stack_root 구조

```json
{
  "id": "scene-root",
  "type": "SceneRoot",
  "children": [
    { /* VideoCanvas */ },
    { /* Cursor (선택) */ }
  ]
}
```

자막바는 `scene.narration` 필드 기반으로 SceneShell/SubtitleBar 가 자동 렌더. 별도 노드 불필요.

### 5. scenes-v2.json 전체 구조

각 씬:
```json
{
  "id": "video-seg-1",
  "project_id": "{pid}",
  "beat_index": 0,
  "layout_family": "hero-center",
  "start_ms": {voice offset_ms},          // voice-timeline.json 기준
  "end_ms": {voice offset + duration},
  "duration_frames": {위 계산식},
  "components": [],
  "copy_layers": {
    "kicker": null,
    "headline": null,
    "supporting": null,
    "footer_caption": null
  },
  "narration": "{segment.narration}",
  "stack_root": { /* 위 구조 */ },
  "transition": { "type": "crossfade", "durationFrames": 18 },
  "chunk_metadata": {
    "intent": "video-demo",
    "tone": "instructional",
    "evidence_type": "visual",
    "emphasis_tokens": [],
    "density": 1,
    "beat_count": 1
  },
  "motion": { "entrance": "fade", "emphasis": null, "exit": null, "duration_ms": 600 },
  "assets": { "svg_icons": [], "chart_type": null, "chart_data": null },
  "subtitles": []
}
```

Root:
```json
{
  "projectId": "{pid}",
  "audioSrc": null,
  "scenes": [ /* 위 씬 배열 */ ]
}
```

## 중요 불변 조건 (HARD RULE)

1. **scenes-v2.json 만 작성하고 끝내지 말 것**. 다음 Phase(/vg-demo-fx, /vg-render) 가 **render-props-v2.json** 을 읽는다. 이 스킬 완료 직후 `/vg-render` 스킬의 "render-props-v2 동기화" 단계가 자동으로 생성하지만, 수동 체인 실행 시에는 사용자가 render-props-v2.json 재생성을 잊지 않도록 경고 출력.

2. **Kicker 노드 넣지 말 것**. 이 파이프라인은 UI 텍스트 오버레이 미사용. 자막바가 유일한 텍스트 레이어.

3. **scene.start_ms 를 수동 스케일 금지**. 오디오가 재합성되면 반드시 `/vg-video-demo-voice` → `/vg-video-demo-layout` 재실행. 누적 drift 발생.

## GATE

- 씬 개수 = `spec.segments` 개수
- 모든 씬에 VideoCanvas 노드 정확히 1 개
- 모든 씬 duration_frames > 0
- `spec.videoSrc` 파일이 `public/{videoSrc}` 에 존재

## 출력

```
data/{pid}/scenes-v2.json
```
