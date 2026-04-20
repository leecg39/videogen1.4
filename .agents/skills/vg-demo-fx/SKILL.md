---
name: vg-demo-fx
description: scenes-v2.json에 SFX 노드를 in-place 주입. click hotspot 시점에 click.mp3, 씬 경계에 whoosh.mp3 추가. /vg-demo Phase 4 전용.
---

# /vg-demo-fx — SFX 주입

**render-props-v2.json** 을 읽어 각 씬의 stack_root 에 SfxAudio 노드를 추가한다. (scenes-v2.json 이 아니다 — 렌더러는 render-props-v2 를 사용한다)

### 이동 SFX (추가)

Cursor 노드의 path 가 2개 이상이면 각 세그먼트 시작 프레임에 move.mp3 주입:
```json
{ "id": "sfx-move-{i}-{k}", "type": "SfxAudio",
  "data": { "src": "sfx/move.mp3", "startFrame": <prev_point.frame>, "volume": 0.3 } }
```

## 트리거

```
/vg-demo-fx {pid}
```

## 규칙

### 1. 클릭 SFX

씬의 Cursor 노드에 `clicks: [{frame: F}]`가 있으면, 같은 stack_root children에 다음을 추가:
```json
{
  "id": "sfx-click-1",
  "type": "SfxAudio",
  "data": { "src": "sfx/click.mp3", "startFrame": F, "volume": 0.5 }
}
```

### 2. 씬 시작 whoosh

각 씬(첫 씬 제외)의 stack_root children에 추가:
```json
{
  "id": "sfx-whoosh",
  "type": "SfxAudio",
  "data": { "src": "sfx/whoosh.mp3", "startFrame": 0, "volume": 0.4 }
}
```

### 3. 줌 시작 pop (선택)

ImageCanvas keyframes의 두 번째 키프레임 frame이 ≥ 30이면 그 시점에 pop.mp3 추가 (선택적, 강한 줌-인 강조용):
```json
{
  "id": "sfx-pop",
  "type": "SfxAudio",
  "data": { "src": "sfx/pop.mp3", "startFrame": 30, "volume": 0.3 }
}
```

## GATE

- 클릭 hotspot 있는 모든 씬에 click SfxAudio 노드 1개 이상
- 첫 씬 외 모든 씬에 whoosh SfxAudio 노드 1개

## 출력

```
data/{pid}/scenes-v2.json   # in-place 업데이트
```

## 주의

- `public/sfx/{click,whoosh,pop}.mp3` 파일이 없으면 **해당 SFX는 건너뛴다** (영상은 정상 생성)
- 모든 SFX가 누락되면 경고만 출력하고 in-place 변경 없이 종료 — 파이프라인은 계속 진행
- Audio 노드는 SceneRenderer가 컨테이너 자식으로 렌더할 때 화면에는 안 보이지만 오디오만 재생됨
