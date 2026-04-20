# Handoff — /vg-video-demo (비디오 입력 기반 데모)

**날짜**: 2026-04-13
**이전 세션 커밋**: `3349963` (fix(vg-demo): 커서 Y축 보정 + SFX 실재생 + 포인터 커서 + hotspot 드래그)
**목표**: 기존 이미지 기반 `/vg-demo` 를 비디오 입력 기반으로 확장.

---

## 0. 배경

현재 `/vg-demo` 파이프라인은 **정적 스크린샷 + 한 줄 액션 → Ken Burns + 커서 + TTS + SFX** 로 mp4 를 생성한다.
사용자 요구: **사용자가 실제 녹화한 제품 영상**을 입력으로 받아, 세그먼트별 액션/핫스팟 주석을 붙이고, 나레이션 + 자막 + 커서 오버레이를 합친 최종 mp4 를 렌더링.

---

## 1. 사용자 시나리오 (UX 흐름)

```
1) 사용자가 DemoBuilder 에서 "새 비디오 데모" 생성 → mp4 업로드
2) 서버가 ffprobe 로 width/height/duration 추출, ffmpeg scene detection 으로
   cut point 자동 검출 → segments[] 초기 생성
3) 각 segment 당 대표 프레임(중앙 시점) 1장을 썸네일로 추출
4) Builder UI 좌측에 segment 타임라인 (기존 슬라이드 리스트 자리) 표시
5) 사용자가 segment 클릭 → 중앙에 썸네일 + 타임라인 스크러버
   - action (한 줄 설명) 입력
   - 핫스팟 클릭/드래그 (기존 이미지 데모와 동일 UX)
   - 필요하면 segment 구간 [startMs, endMs] 미세 조정
6) "Claude 에 전송" → /vg-video-demo 파이프라인 실행
   - /vg-video-demo-script: segment action → 나레이션 (2~3문장) 확장
   - /vg-video-demo-voice: ElevenLabs TTS → segment 별 mp3
   - /vg-video-demo-layout: segments → scenes-v2.json (VideoCanvas + Cursor + SubtitleBar)
   - /vg-video-demo-fx: 클릭/이동/씬 전환 SFX 주입
   - /vg-render: render-props-v2 → mp4
```

---

## 2. 재사용 가능한 기존 자산 (중요 — 80% 재활용 가능)

| 자산 | 경로 | 재사용 방식 |
|------|------|------------|
| **computeImageRect** | `src/remotion/common/image-rect.ts` | 비디오 종횡비 그대로 적용. 이름만 `computeMediaRect` 로 리네임 권장. |
| **Cursor 노드** | `src/remotion/nodes/cursor.tsx` | 100% 그대로. imageAspect → mediaAspect 로 의미 확장. 이미 선형 매핑이라 비디오 좌표도 동일. |
| **SubtitleBar** | `src/remotion/common/SubtitleBar.tsx` | 100% 그대로. |
| **SfxAudio + SceneShell 수집 로직** | `src/remotion/common/SceneShell.tsx` (`collectSfxNodes`) | 100% 그대로. |
| **DemoBuilder 드래그 + 자동저장** | `src/components/demo-builder/DemoBuilder.tsx` | 핫스팟 부분 100% 재사용. 좌측 리스트 UI 만 타임라인으로 확장. |
| **/vg-demo-script** (skill) | `.claude/skills/vg-demo-script/` | 거의 그대로 — 입력이 demo-spec.json 이냐 video-spec.json 이냐만 다름. |
| **/vg-demo-voice** (skill) | `.claude/skills/vg-demo-voice/` | 동일. segment.narration 을 TTS → segment.narration_ms 채움. |
| **/vg-demo-fx** (skill) | `.claude/skills/vg-demo-fx/` | 동일 규칙 (click/move/whoosh). render-props-v2.json 타겟. |
| **SFX 에셋** | `public/sfx/{click,move,whoosh,pop}.mp3` | 그대로. |
| **Hotspot / Cursor 수학** | `src/remotion/common/image-rect.ts` + `cursor.tsx` | 앞 세션에서 수학적 정확도 검증 완료. 동일 공식 사용. |

---

## 3. 새로 만들어야 할 것 (4가지)

### 3.1 `VideoCanvas` Remotion 노드 (30분)

**경로**: `src/remotion/nodes/video-canvas.tsx`

**요구사항**:
- `<OffthreadVideo>` (Remotion) 를 사용 — `staticFile` 경로 처리 동일
- ImageCanvas 와 동일한 `computeImageRect(compW, compH, mediaAspect, basePadding)` 사용해 rect 계산
- Ken Burns (옵션): `data.keyframes = [{frame, x, y, scale}, ...]` — ImageCanvas 와 동일 API 유지
- **비디오 시간 오프셋**: `data.startFrom` (비디오 내부 시작 위치, ms) 추가. segment별로 원본 비디오의 다른 구간을 재생.
- `data.mediaAspect` 필드 지원 (ffprobe 결과)

**registry.ts 등록** 필요: `VideoCanvas: VideoCanvasRenderer`.

### 3.2 ffprobe + scene detection 백엔드 (1~2시간)

**새 API**: `POST /api/demo-projects/:id/upload-video`
- multer 로 mp4 저장 → `public/videos/{pid}/source.mp4`
- `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate` → `{w, h, dur, fps}`
- `ffmpeg -i source.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1` 파싱해서 cut point 추출
- cut point 양쪽 씬을 segment 로 묶어 `video-spec.json` 생성:

```json
{
  "id": "my-demo",
  "title": "Product Tour",
  "videoSrc": "videos/my-demo/source.mp4",
  "videoWidth": 1920,
  "videoHeight": 1080,
  "videoDuration_ms": 45000,
  "videoFps": 30,
  "segments": [
    {
      "id": "seg-1",
      "order": 1,
      "startMs": 0,
      "endMs": 6200,
      "action": "",
      "narration": null,
      "narration_ms": null,
      "hotspots": [],
      "thumbnail": "thumbnails/seg-1.png",
      "keepOriginalAudio": false
    }
  ]
}
```

- segment 당 대표 프레임 자동 추출: `ffmpeg -ss <midMs/1000> -i source.mp4 -frames:v 1 thumbnails/seg-N.png`

**의존성**: `ffmpeg` 는 이미 시스템에 설치됨(`/opt/homebrew/bin/ffmpeg` 확인됨).

### 3.3 Builder UI: 타임라인 세그먼트 편집기 (하루)

**수정**: `src/components/demo-builder/DemoBuilder.tsx` — 현재 슬라이드 편집기 옆에 **video mode** 분기.

**UI 구성**:
- **좌측 패널** — segments 를 세로 리스트로. 썸네일 + 구간(`00:05.2 → 00:08.7`) + action 한 줄. 드래그로 순서 변경(선택).
- **중앙 패널** — 선택된 segment 편집:
  - 상단: segment 구간 트리머 (startMs/endMs 슬라이더 — 원본 비디오 내 범위)
  - 중앙: 대표 프레임 이미지 위에 기존 핫스팟 편집기 그대로 (클릭 추가, 드래그 이동, 드롭 자동저장)
  - 하단: action 입력, `keepOriginalAudio` 토글
- **네비게이션** — "원본 비디오 미리보기" 버튼 → `<video>` 태그로 구간만 플레이
- 핫스팟 좌표는 비디오 정규좌표(0..1). 종횡비 고정이라 대표 프레임 썸네일 위에서 편집해도 문제 없음.

**기존 패턴 그대로 재사용**: `getNormFromEvent`, `startDrag`, `justDraggedRef`, 드롭 시 PATCH.

### 3.4 `/vg-video-demo-layout` 스킬 (하루)

**경로**: `.claude/skills/vg-video-demo-layout/SKILL.md`

**역할**: `video-spec.json` + voice-timeline → `scenes-v2.json` + `render-props-v2.json` 변환.

**핵심 변환 로직**:
- segment 1개 → scene 1개
- 각 scene 의 `stack_root.children`:
  ```json
  [
    { "type": "VideoCanvas",
      "data": {
        "src": "videos/{pid}/source.mp4",
        "startFrom": "{segment.startMs}",
        "mediaAspect": {videoWidth/videoHeight},
        "keyframes": [...]
      }
    },
    { "type": "Cursor",
      "data": {
        "imageAspect": {same},
        "path": [ ... hotspot 기반 경로 ... ],
        "clicks": [ ... ]
      }
    }
    // SubtitleBar 는 SceneShell 이 자동 렌더
  ]
  ```
- scene.duration_frames = max(segment.narration_ms, segment.endMs - segment.startMs) × fps / 1000
- **narration 이 길면 비디오 구간을 정지(last frame hold)** 하거나 segment 구간을 늘려야 함. 단순히 늘리는 게 안전.
- scene.narration = segment.narration (SceneShell 의 SubtitleBar 가 소비)

---

## 4. 결정 필요 사항 (사용자에게 물어볼 것)

### 4.1 오디오 믹싱 전략 (가장 중요)

3가지 옵션:
- **(A) 원본 완전 무시** — TTS 나레이션이 유일한 오디오. 가장 단순, "내레이션 튜토리얼" 느낌.
- **(B) 자동 덕킹** — 나레이션 재생 중엔 원본 볼륨 0.15, 나레이션 사이엔 1.0. 자연스러움 ↑.
- **(C) segment 별 토글** — 각 segment 에 `keepOriginalAudio: bool` 제공.

권장: **(C) + 기본값 false (= A)**. UI 복잡도 최소화하면서 유연성 확보.

**구현 위치**:
- `VideoCanvas` 는 기본적으로 `muted` 재생. `data.keepOriginalAudio === true` 일 때만 원본 오디오 사용 (별도 Audio 노드로).
- 나레이션은 기존 `audioSrc` 또는 segment 별 Sequence+Audio 로 주입.

### 4.2 SFX 의미 재정의

이미지 데모에서는 "클릭 = 사용자가 마우스 클릭한 순간". 비디오 데모에서는 **원본 영상에 이미 클릭 모션**이 들어있음.
- 그래도 Cursor 오버레이 + 클릭 SFX 는 강조를 위해 유용
- move SFX 는 오히려 과할 수 있음 → 기본 off, 사용자 opt-in

### 4.3 Cursor 오버레이 on/off

원본 영상에 이미 마우스 포인터가 녹화돼 있으면 중복. segment 별 `showCursor` 토글 제공 권장.

### 4.4 비디오 렌더 성능

- 원본 길이 × 디코딩 오버헤드 → 현재 이미지 기반보다 렌더 시간 2~4배 예상
- `<OffthreadVideo>` 는 multi-thread decode 지원
- concurrency 를 낮춰야 할 수도 있음 (`--concurrency=2`)

---

## 5. 구현 순서 (권장)

| Step | 작업 | 예상 시간 | 차단 조건 |
|------|------|---------|----------|
| 1 | `VideoCanvas` 노드 + `computeMediaRect` 리네임 | 1시간 | — |
| 2 | 간단한 하드코딩 scenes-v2.json 으로 VideoCanvas 렌더 검증 (Y축/cursor 정확도) | 30분 | Step 1 |
| 3 | 백엔드: upload-video + ffprobe + scene detection + 썸네일 생성 | 2시간 | — |
| 4 | `video-spec.json` 스키마 + PATCH API | 1시간 | Step 3 |
| 5 | DemoBuilder video mode UI (타임라인, 세그먼트 편집기) | 1일 | Step 4 |
| 6 | `/vg-video-demo-layout` 스킬 | 4시간 | Step 1~5 |
| 7 | `/vg-video-demo` 오케스트레이터 (기존 script/voice/fx 체이닝) | 2시간 | Step 6 |
| 8 | end-to-end 테스트 — 실제 mp4 업로드 → 렌더 | 반일 | Step 7 |

**총**: 약 2~3일 집중 작업.

---

## 6. 리스크 & 해결책

### 6.1 Hotspot Y축 — 이미 해결된 패턴 재적용

- 이미지 데모에서 `object-fit: cover` 크롭 때문에 Y축 ~29px 오차가 발생했음
- 해결: `computeImageRect` 로 inner box 종횡비 = 이미지 종횡비 → 선형 매핑
- **비디오에서도 동일 이슈 발생 가능**. 반드시 `VideoCanvas` 에서 `computeImageRect(compW, compH, mediaAspect, basePadding)` 사용. `<OffthreadVideo>` 도 CSS `object-fit: fill` 로 렌더해서 크롭 방지.

### 6.2 TTS 길이 vs segment 길이 불일치

- narration_ms > segment duration → segment 끝 프레임에서 비디오를 holdfreeze. `<OffthreadVideo>` 의 `startFrom` 과 컴포지션 길이 분리로 해결 가능.
- 또는 비디오 `playbackRate=0.8` 같은 감속(최후 수단).
- **권장**: layout 단계에서 `scene.duration_frames = max(narration, originalSegment)` 로 설정 후, 비디오가 끝나면 last frame 유지.

### 6.3 render-props-v2.json 동기화 이슈 (앞 세션 교훈)

- **중요**: `render-props-v2.json` 이 진실의 원천. `scenes-v2.json` 만 업데이트하면 렌더러에 반영 안 됨.
- `/vg-video-demo-layout` 스킬은 반드시 render-props-v2.json 에 scenes 를 직접 기록할 것.
- 앞 세션에서 이 문제로 SFX 가 완전 무음이었음. 절대 같은 실수 반복하지 말 것.

### 6.4 Cursor 좌표 타이밍

- 원본 비디오 안의 UI 요소는 시간에 따라 움직임. 사용자가 대표 프레임에서 찍은 (x, y) 는 그 프레임에서만 정확.
- 해결: segment 내부에서만 커서 경로를 해당 프레임 좌표로 고정. segment 경계에서 커서 점프 허용.
- 더 정교하게 가려면: segment 내에 여러 keyframe 찍을 수 있도록 확장. **MVP 는 single hotspot per segment** 로 시작.

---

## 7. 데이터 스키마 (제안)

### video-spec.json

```typescript
interface VideoSpec {
  id: string;
  title: string;
  videoSrc: string;           // "videos/{pid}/source.mp4"
  videoWidth: number;
  videoHeight: number;
  videoDuration_ms: number;
  videoFps: number;
  segments: VideoSegment[];
  createdAt: string;
  updatedAt: string;
}

interface VideoSegment {
  id: string;
  order: number;
  startMs: number;            // 원본 비디오 기준
  endMs: number;
  thumbnail: string;          // "thumbnails/seg-{id}.png"
  action: string;             // 한 줄 설명 (사용자 입력)
  narration: string | null;   // script 스킬이 확장한 풀 나레이션
  narration_ms: number | null;// TTS 스킬이 계산한 길이
  hotspots: Hotspot[];        // 비디오 정규좌표
  showCursor: boolean;        // 기본 true
  keepOriginalAudio: boolean; // 기본 false
}
```

### scenes-v2.json (layout 스킬 출력)

```jsonc
{
  "scenes": [
    {
      "id": "video-seg-1",
      "project_id": "my-demo",
      "beat_index": 0,
      "start_ms": 0,
      "end_ms": 6200,
      "duration_frames": 186,
      "narration": "...",
      "subtitles": [...],
      "layout_family": "hero-center",
      "stack_root": {
        "type": "SceneRoot",
        "children": [
          {
            "type": "VideoCanvas",
            "id": "video",
            "data": {
              "src": "videos/my-demo/source.mp4",
              "startFrom": 0,
              "mediaAspect": 1.7778,
              "muted": true,
              "keyframes": [
                {"frame": 0, "x": 0.5, "y": 0.5, "scale": 1.0},
                {"frame": 186, "x": 0.5, "y": 0.5, "scale": 1.05}
              ]
            }
          },
          {
            "type": "Cursor",
            "id": "cursor",
            "data": {
              "imageAspect": 1.7778,
              "path": [
                {"frame": 0, "x": 0.1, "y": 0.1},
                {"frame": 120, "x": 0.45, "y": 0.6}
              ],
              "clicks": [{"frame": 130}],
              "imageKeyframes": [...]
            }
          },
          {
            "type": "SfxAudio",
            "id": "sfx-click-0",
            "data": {"src": "sfx/click.mp3", "startFrame": 130, "volume": 0.65}
          }
        ]
      }
    }
  ]
}
```

---

## 8. 스킬 파일 구조 제안

```
.claude/skills/
├── vg-video-demo/              # 오케스트레이터 (새)
│   └── SKILL.md
├── vg-video-demo-script/       # segments → narration (새, vg-demo-script 복제)
├── vg-video-demo-voice/        # narration → TTS (새, vg-demo-voice 복제)
├── vg-video-demo-layout/       # video-spec → scenes-v2 (새)
├── vg-demo-fx/                 # 그대로 재사용 (이미 render-props-v2 타겟팅)
└── vg-demo/                    # 이미지 기반, 그대로 유지
```

---

## 9. 첫 세션 시작 가이드

다음 세션에서 이 문서를 읽은 후:

1. 이 문서 전체 읽기 (`docs/handoff-2026-04-13-vg-video-demo.md`)
2. **Step 1 부터 순서대로** — 먼저 `VideoCanvas` 노드를 만들고 하드코딩 scenes-v2.json 으로 Y축/cursor 정확도 검증
3. 사용자에게 **오디오 믹싱 전략**(4.1) 확정 받기
4. 검증 완료 후 백엔드 → UI → 스킬 순서로 진행
5. 매 단계 끝에서 실제 mp4 렌더로 검증 필수

---

## 10. 참고: 앞 세션 교훈 (반복 금지)

- `render-props-v2.json` ≠ `scenes-v2.json`. **렌더러는 render-props-v2 만 읽음**. 스킬은 반드시 render-props-v2 를 타겟해야 함.
- `object-fit: cover` 는 좌표 정확도를 파괴함. 항상 `computeImageRect` + `object-fit: fill` 사용.
- Remotion `<Audio>` 는 React 트리 레벨에서 자동 수집됨. `SceneShell` 레벨에서 `collectSfxNodes` 로 직접 마운트하는 패턴 유지.
- 드래그 + 자동저장 UX 는 `justDraggedRef` 로 클릭 이벤트와 분리.

---

**다음 액션**: `/clear` 후 이 문서로 시작. 첫 물음: "오디오 믹싱 전략 A/B/C 중 뭐로 갈까요?"
