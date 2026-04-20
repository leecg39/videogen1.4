---
name: vg-video-demo
description: 녹화된 제품 영상(mp4)을 업로드 후 세그먼트 주석 → 나레이션/자막/SFX/커서 오버레이가 합쳐진 product demo mp4를 생성합니다. /video-demo-builder 웹 에디터에서 작성한 video-spec.json을 입력으로 받습니다.
---

# /vg-video-demo — Video-based Product Demo 풀 파이프라인

/vg-demo 의 비디오 버전. 사용자가 직접 녹화한 mp4를 세그먼트 단위로 주석하면 나레이션 + 자막 + SFX + 커서 오버레이가 추가된 완성 영상을 만든다.

## 트리거

```
/vg-video-demo {projectId}
/vg-video-demo {projectId} --until layout    # 렌더링 직전까지만
/vg-video-demo --resume {projectId}
```

## 사전 조건

- `data/{pid}/video-spec.json` 존재 (`/video-demo-builder` 웹 UI 에서 작성)
- 모든 세그먼트에 `action`(한 줄 설명) 입력 완료
- `public/{spec.videoSrc}` (원본 mp4) 존재
- `.env` 에 `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`

## 파이프라인

```
/vg-video-demo {pid}
  ├─ Phase 0: spec 검증
  │   └─ GATE: video-spec.json 존재 + segments ≥ 1 + 모든 action 채워짐
  │          + spec.videoSrc 파일 존재 + videoWidth/Height/Fps > 0
  │
  ├─ Phase 1: /vg-video-demo-script   (action → narration)
  │   └─ GATE: 모든 세그먼트에 narration 채워짐
  │
  ├─ Phase 2: /vg-video-demo-voice    (narration → ElevenLabs TTS)
  │   └─ GATE: output/{pid}.mp3 존재 + 모든 세그먼트 narration_ms 기록
  │
  ├─ Phase 3: /vg-video-demo-layout   (segments → scenes-v2.json)
  │   └─ GATE: 모든 씬 duration_frames > 0, stack_root 존재, VideoCanvas 노드 포함
  │
  ├─ Phase 4: /vg-demo-fx (재사용)    (SFX 주입)
  │   └─ GATE: click hotspot 있는 씬에 SfxAudio 노드 1개 이상
  │   └─ 주의: vg-demo-fx 는 render-props-v2.json 을 직접 수정한다.
  │          그러려면 Phase 3 직후 render-props-v2.json 이 먼저 생성돼 있어야 함.
  │          /vg-render 의 "동기화" 단계가 이를 처리하므로, 순서는
  │          layout → (render-props-v2 재생성 sub-step) → fx → render 로 진행.
  │
  ├─ Phase 5: /vg-render
  │   └─ GATE: output/{pid}.mp4 > 1MB
  │
  └─ Phase 6: 자가 검증 (프레임 추출 → 비디오 + 커서 가시성 확인)
      └─ GATE: 빈 프레임 ≤ 1, VideoCanvas 가 검은 화면만 나오지 않음
```

각 Phase 는 **Skill tool 로 명시 호출**. 스크립트 직접 실행 금지.

## 핵심 규칙

1. **재생 시간 = max(narration_ms, 원본 구간 길이)** — TTS 가 길면 비디오 last frame hold, 짧으면 원본 구간 유지.
2. **각 세그먼트 = 1 씬** — segment N 개 → 씬 N 개.
3. **VideoCanvas.startFrom (ms) = segment.startMs** — 원본의 해당 구간부터 재생.
4. **`muted` 기본 true** — `segment.keepOriginalAudio === true` 일 때만 원본 오디오 유지.
5. **Cursor 는 hotspot 있을 때만** — `showCursor === false` 또는 `hotspot == null` 이면 노드 생략.
6. **scene 경계 비례 스케일 금지** — 재TTS 시 반드시 Phase 2 → 3 재실행.

## vg-demo-fx 재사용 노트

vg-demo-fx 는 "clicks 배열이 있는 Cursor 노드 옆에 click.mp3 를 붙이고, 씬 경계에 whoosh.mp3 를 주입" 하는 일만 한다. 입력이 ImageCanvas 냐 VideoCanvas 냐는 상관하지 않는다. 따라서 그대로 재사용.

단, 원본 오디오가 있는 세그먼트(`keepOriginalAudio: true`)에서 click SFX volume > 0.5 → vg-sfx-volume 가드 fail (원본 audio mask).

## Phase 6 자가 검증

```bash
ffmpeg -i output/{pid}.mp4 -vf "fps=1/3" tmp/video-demo-frames/{pid}_%03d.jpg
```

추출된 프레임을 Read tool 로 확인:
- 빈 화면 0~1 개
- 모든 세그먼트의 원본 비디오 프레임이 한 번 이상 등장
- 커서가 화면 안에 있음 (showCursor 인 씬에서)

## 사용자 확인 포인트 (AskUserQuestion)

| 상황 | 질문 | 선택지 |
|---|---|---|
| 세그먼트 수 ≥ 15 | "세그먼트가 {N} 개입니다. 전체 처리할까요?" | 1) 전체 / 2) 처음 5개만 미리보기 / 3) 취소 |
| 총 원본 길이 > 10분 | "원본 {min} 분, 렌더 시간 20~40 분 예상" | 1) 진행 / 2) 취소 |
| Phase 6 실패 | "{N} 개 문제 프레임. 재설계할까요?" | 1) Phase 3 재실행 / 2) 현재 상태로 완료 |

## 결과 보고

```
✅ Video Demo 생성 완료: '{pid}'
  - 출력: output/{pid}.mp4 ({size}MB, {duration})
  - 세그먼트: {N} 개 (원본 {origMin} 분 → 최종 {finalMin} 분)
  - 나레이션: {chars} 자, TTS {ttsSec} 초
  - Cursor 씬: {c} / Original Audio 씬: {o}
  - SFX: click {clk} + whoosh {wh}
```

## 금지 사항

- scene.start_ms 수동 스케일 (누적 drift)
- VideoCanvas.muted 를 기본 false 로 바꾸기 (사용자 명시 없이 원본 오디오 재생)
- Kicker 텍스트 오버레이 추가 (이 파이프라인은 자막바만 사용)
- 이미지 기반 /vg-demo 와 혼용하기 — spec.kind 는 반드시 "video-demo"
