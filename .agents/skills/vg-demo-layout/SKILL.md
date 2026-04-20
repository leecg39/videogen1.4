---
name: vg-demo-layout
description: demo-spec.json + voice-timeline → scenes-v2.json 변환. 슬라이드당 1씬, ImageCanvas + Cursor + SubtitleBar 트리, hotspot 기반 카메라/커서 경로 자동 생성. /vg-demo Phase 3 전용.
---

# /vg-demo-layout — Scene 트리 생성

## 트리거

```
/vg-demo-layout {pid}
```

## 사전 조건

- demo-spec.json의 모든 슬라이드 narration_ms 채워짐
- voice-timeline.json 존재

## 핵심 변환 규칙

### 1. 슬라이드 → 씬 매핑

```
duration_frames = round(narration_ms * 30 / 1000)
```

각 슬라이드 1개 → 씬 1개. fps=30 가정.

### 2. 카메라 모션 자동 결정

| 조건 | camera | ImageCanvas keyframes |
|------|--------|----------------------|
| hotspot 1개 (click) | zoom-to | start: (0.5, 0.5, 1.02) → end: (hotspot.x, hotspot.y, 1.6) |
| hotspot 2개+ | pan-to | 첫 hotspot 위치 → 마지막 hotspot 위치, scale 1.2 유지 |
| hotspot 없음 | ken-burns | (0.45, 0.45, 1.02) → (0.55, 0.55, 1.10) — 약한 무작위 |

### 3. 커서 경로

- hotspot이 있으면 커서 path = `[{frame: 0, x: 0.1, y: 0.1}, {frame: dur*0.6, x: hotspot.x, y: hotspot.y}]`
- click hotspot이면 `clicks: [{frame: dur*0.65}]` 추가
- 다음 씬으로 넘어갈 때 마지막 위치 기억해서 자연스럽게 이어지면 좋음 (선택)

### 3.5. imageAspect 자동 주입 (필수)

ImageCanvas 는 `object-fit: cover` 로 렌더되므로, 이미지 종횡비 ≠ 박스 종횡비일 때
cover 크롭이 발생합니다. Cursor/Ken Burns focus 좌표가 어긋나지 않으려면 양쪽 노드 모두
동일한 `data.imageAspect` (= imgW / imgH) 를 가져야 합니다.

```bash
python3 -c "from PIL import Image; im=Image.open('public/images/{pid}/01-x.png'); print(im.width/im.height)"
# 또는 file 명령으로 dims 읽어 직접 계산
```

슬라이드별 이미지 dims 를 읽어 ImageCanvas.data.imageAspect, Cursor.data.imageAspect 에 동일 값을 기록합니다.
기본값 16/9 (≈1.7778) 이 fallback 이지만, 실측치와 다르면 Y축 오프셋이 수십 px 발생합니다.

### 4. stack_root 구조

```json
{
  "id": "scene-root",
  "type": "SceneRoot",
  "children": [
    {
      "id": "img-canvas",
      "type": "ImageCanvas",
      "data": {
        "src": "images/{pid}/01-home.png",
        "imageAspect": 1.616803,
        "keyframes": [
          { "frame": 0, "x": 0.5, "y": 0.5, "scale": 1.02 },
          { "frame": 180, "x": 0.42, "y": 0.78, "scale": 1.55 }
        ]
      }
    },
    {
      "id": "cursor",
      "type": "Cursor",
      "data": {
        "size": 56,
        "imagePadding": 48,
        "imageAspect": 1.616803,
        "path": [
          { "frame": 0, "x": 0.1, "y": 0.1 },
          { "frame": 110, "x": 0.42, "y": 0.78 }
        ],
        "clicks": [{ "frame": 120 }]
      }
    }
  ]
}
```

자막바는 `narration` 필드에 텍스트를 넣으면 SubtitleBar가 자동 표시한다(기존 SceneRenderer 동작).

### 5. scenes-v2.json 구조

각 씬:
```json
{
  "id": "demo-s1",
  "project_id": "{pid}",
  "beat_index": 0,
  "layout_family": "hero-center",
  "start_ms": 0,
  "end_ms": 6200,
  "duration_frames": 186,
  "components": [],
  "copy_layers": { "kicker": null, "headline": "{action}", "supporting": null, "footer_caption": null },
  "narration": "{narration}",
  "stack_root": { /* 위 구조 */ },
  "transition": { "type": "crossfade", "durationFrames": 18 },
  "chunk_metadata": { "intent": "demo", "tone": "instructional", "evidence_type": "visual", "emphasis_tokens": [], "density": 1, "beat_count": 1 },
  "motion": { "entrance": "fade", "emphasis": null, "exit": null, "duration_ms": 600 },
  "assets": { "svg_icons": [], "chart_type": null, "chart_data": null }
}
```

## GATE

- 모든 씬에 stack_root 존재
- 모든 씬에 ImageCanvas 노드 1개 정확히 포함
- 모든 씬 duration_frames > 0
- 씬 개수 = spec.slides 개수

## 출력

```
data/{pid}/scenes-v2.json
```
