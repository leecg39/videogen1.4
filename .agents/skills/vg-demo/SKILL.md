---
name: vg-demo
description: 스크린샷 매뉴얼(이미지 + 한 줄 액션)을 Ken Burns/커서 애니메이션 + ElevenLabs TTS + SFX가 합쳐진 product demo mp4로 변환합니다. /demo-builder 웹 에디터에서 작성한 demo-spec.json을 입력으로 받습니다.
---

# /vg-demo — Product Demo 풀 파이프라인

스크린샷 N장 + 슬라이드별 한 줄 설명을 받아 **Ken Burns + 커서 이동 + ElevenLabs 나레이션 + SFX**가 결합된 product demo mp4를 생성합니다.

## 트리거

```
/vg-demo {projectId}
/vg-demo {projectId} --until layout    # 렌더링 직전까지만
/vg-demo --resume {projectId}
```

또는 SessionStart 훅이 `data/*/demo-trigger.json (status: pending)`을 감지하면 사용자에게 자동 실행을 제안한다.

## 사전 조건

- `data/{pid}/demo-spec.json` 존재 (`/demo-builder` 웹 UI에서 작성)
- 모든 슬라이드에 `action`(한 줄 설명) 입력 완료
- `public/images/{pid}/*.png` 업로드 완료
- `.env`에 `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`

## 파이프라인

```
/vg-demo {pid}
  ├─ Phase 0: spec 검증
  │   └─ GATE: demo-spec.json 존재 + slides ≥ 1 + 모든 action 채워짐 + 모든 image 파일 존재
  │
  ├─ Phase 1: /vg-demo-script  (action → narration)
  │   └─ GATE: 모든 슬라이드에 narration 채워짐
  │
  ├─ Phase 2: /vg-demo-voice   (narration → ElevenLabs TTS)
  │   └─ GATE: public/audio/{pid}.mp3 존재 + 모든 슬라이드 narration_ms 기록
  │
  ├─ Phase 3: /vg-demo-layout  (slides → scenes-v2.json)
  │   └─ GATE: 모든 씬 duration_frames > 0, stack_root 존재, ImageCanvas 노드 포함
  │
  ├─ Phase 4: /vg-demo-fx      (SFX 주입)
  │   └─ GATE: 클릭 hotspot 있는 씬에 SfxAudio 노드 1개 이상
  │
  ├─ Phase 5: /vg-render
  │   └─ GATE: output/{pid}.mp4 > 1MB
  │
  └─ Phase 6: 자가 검증 (프레임 추출 → 가시성 확인)
      └─ GATE: 빈 프레임 ≤ 1, 이미지 가시 ≥ 80%
```

각 Phase는 **Skill tool로 명시 호출**한다. 스크립트 직접 실행 금지.

## 핵심 규칙

1. **재생 시간은 TTS 길이로 결정** — `duration_frames = round(narration_ms * 30 / 1000)`
2. **각 슬라이드는 1씬** — 슬라이드 N개 → 씬 N개
3. **카메라 모션 자동 결정** — hotspot이 있으면 zoom-to(target=hotspot 좌표), 없으면 약한 Ken Burns
4. **씬 경계마다 whoosh** — 자동 SFX 주입
5. **클릭 hotspot 시점 = 커서 도착 시점** — 그 프레임에 click.mp3 + ripple
6. **이미지 누락 시 즉시 중단** — 가짜 placeholder로 진행하지 않음

## Phase 6 자가 검증

```bash
ffmpeg -i output/{pid}.mp4 -vf "fps=1/3" tmp/demo-frames/{pid}_%03d.jpg
```

추출된 프레임을 Read tool로 직접 확인:
- 빈 화면 0~1개
- 모든 슬라이드 이미지가 한 번 이상 frame에 등장
- 커서가 화면 안에 있음

검증 통과 후 `data/{pid}/demo-trigger.json` status를 `done` + `output_path`로 갱신한다 (Stop 훅도 같은 일을 하지만 즉시 처리).

## 사용자 확인 포인트 (AskUserQuestion)

| 상황 | 질문 | 선택지 |
|------|------|--------|
| 슬라이드 수 ≥ 20 | "슬라이드가 {N}장입니다. 전체를 한 번에 처리할까요?" | 1) 전체 / 2) 처음 10장만 미리보기 / 3) 취소 |
| TTS 비용 경고 | "총 {chars}자 TTS 변환 — 약 {credits} 크레딧 사용 예상" | 1) 진행 / 2) 취소 |
| Phase 6 실패 | "{N}개 문제 프레임 발견. 재설계할까요?" | 1) Phase 3 재실행 / 2) 현재 상태로 완료 |

## 결과 보고

```
✅ Product Demo 생성 완료: '{pid}'
  - 출력: output/{pid}.mp4 ({size}MB, {duration})
  - 슬라이드: {N}장
  - 나레이션: {chars}자, TTS {ttsSec}초
  - 카메라 모션: zoom-to {z}개 / ken-burns {k}개
  - SFX: click {c}개 + whoosh {w}개
```
