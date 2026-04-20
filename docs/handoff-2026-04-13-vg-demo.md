# Handoff — vg-demo 파이프라인 첫 E2E 성공 (2026-04-13)

## 한 줄 요약
스크린샷 튜토리얼 → product demo mp4 파이프라인(`/vg-demo`) 첫 실제 프로젝트(`테스트`, 7슬라이드 45.3초) E2E 성공. 렌더러 버그 3건 수정 + 3D 프레임 섀도우 적용.

## 결과물
- `output/테스트.mp4` — 19.2MB, 45.3s, 1920×1080
- 7 슬라이드(미디엄 → Save to Notion 튜토리얼), 7 zoom-to 씬, 문장별 자막 분할

## 코드 변경 (3 파일)

### 1. `src/remotion/nodes/image-canvas.tsx` (수정)
- **transform 순서 버그 수정**: `translate(...) scale(...)` → `scale(s) translate(A%, B%)`. CSS는 rightmost부터 적용하므로 이게 "translate 먼저, scale 나중" 의 정답. 이전에는 focus 포인트가 중앙에 오지 않아 줌이 엉뚱한 곳을 향함.
- **3D 프레임 옵션 (`frame3d`, 기본 true)**:
  - outer: `radial-gradient(#ffffff → #e9ebf0)` + 48px padding
  - inner: border-radius 24, 다층 drop-shadow, 미세 테두리
  - 데이터로 `outerBg` / `radius` / `padding` 오버라이드 가능

### 2. `src/remotion/nodes/cursor.tsx` (수정)
- **imageKeyframes 투영 모드**: 커서 path의 (x,y)를 이미지 좌표로 해석하고, 매 프레임 이미지 transform을 통해 화면 좌표로 투영.
  ```
  screen_x = 0.5 + scale * (px - fx)
  screen_y = 0.5 + scale * (py - fy)
  ```
- **imagePadding 보정**: 3D 프레임 여백을 커서 픽셀 좌표에 반영.
- 하위 호환: `imageKeyframes`가 없으면 기존 스크린 좌표계 그대로 동작.

### 3. `scripts/tts-demo-slides.ts` (신규)
슬라이드 단위 ElevenLabs TTS 생성기.
- `demo-spec.json.slides[i].narration` → 슬라이드별 mp3 → ffprobe로 길이 측정 → `narration_ms`, `audio_offset_ms` 기록
- ffmpeg concat → `public/audio/{pid}.mp3` (libmp3lame 재인코딩)
- `data/{pid}/voice-timeline.json` 생성

## 게이트 통과 상태 (모든 Phase 0~6 PASS)
1. Phase 0 (spec 검증): 7 슬라이드, 모든 image 존재 ✓
2. Phase 1 (script): 나레이션 확장 35~70자 × 7 ✓
3. Phase 2 (voice): 통합 mp3 674KB, 45.3s, voice-timeline ✓
4. Phase 3 (layout): 7 씬, ImageCanvas+Cursor, imageKeyframes 연결, 문장별 subtitles ✓
5. Phase 4 (fx): SFX 에셋 없음 → 스킵
6. Phase 5 (render): 22.2MB → 19.2MB (흰 바탕 fix 후)
7. Phase 6 (자가검증): 6개 프레임 이미지+커서+자막 정상

## 알려진 이슈 / TODO

### 🔴 근본 해결 필요
**Root.calculateDuration의 TransitionSeries 충돌**
- `src/remotion/Root.tsx:49-52`의 `calculateDuration`이 씬 합계를 그대로 반환.
- TransitionSeries는 crossfade durationFrames만큼 실제 영상 길이를 **줄임** → audio/video 불일치 + 꼬리 검은 프레임.
- **임시 회피**: 씬별 `transition.durationFrames = 0` 설정 (이번 세션에서 `vg-demo-layout` 출력에 적용).
- **권장 수정**:
  ```ts
  const calculateDuration = (scenes: Scene[]): number => {
    if (!scenes || scenes.length === 0) return 300;
    const sum = scenes.reduce((a, s) => a + s.duration_frames, 0);
    const transTotal = scenes.slice(0, -1).reduce(
      (a, s) => a + (s.transition?.durationFrames ?? DEFAULT_TRANSITION_FRAMES), 0
    );
    return sum - transTotal;
  };
  ```

### 🟡 개선 가능
- **SFX 에셋 부재**: `public/sfx/{click,whoosh,pop}.mp3` 없음. Freesound CC0 권장.
- **ElevenLabs 음성**: `.env`의 `ELEVENLABS_VOICE_ID`가 사용자 본인 목소리처럼 들림 — 이미 클론된 기존 voice 사용 중. 파이프라인이 새로 클론하는 건 아님.
- **vg-demo-layout 스킬 자동화**: 이번 세션에서는 Claude가 수동으로 scenes-v2.json을 작성했으나, `/vg-demo-layout`이 hotspot → imageKeyframes 연결을 자동화하도록 SKILL.md 업데이트 필요.

## 파이프라인은 기존 vg-new에 영향 없음
- ImageCanvas / Cursor 노드는 데모 전용. `/vg-new` 계열 프로젝트는 이 노드를 사용하지 않음.
- 공용 모듈(StackRenderer, SubtitleBar, theme, registry 등) 미수정.

## 다음 세션 첫 할 일
1. `src/remotion/Root.tsx`의 `calculateDuration` TransitionSeries 보정 적용
2. `/vg-demo-layout` SKILL.md에 cursor.imageKeyframes/imagePadding 주입 로직 명시
3. SFX 에셋 추가 후 Phase 4 복구
