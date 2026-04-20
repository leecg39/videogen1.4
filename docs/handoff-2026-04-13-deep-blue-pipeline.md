# Handoff — deep-blue 파이프라인 + 자막/씬 싱크 영구 가드

**날짜**: 2026-04-13
**커밋**: `0df7335` (PVC 통합) + `df5ff89` (자막/씬 싱크 가드)
**상태**: 푸시 완료. 코드/스킬 반영 끝. **deep-blue 영상 자체는 미완료** (drift 있는 상태로 멈춤).

---

## 1. 세션 요약 (이번에 한 일)

### 1.1 ElevenLabs PVC voice 통합 (커밋 1)
이전 세션 핸드오프(`docs/handoff-2026-04-13-elevenlabs-pvc.md`) 작업을 마무리.

- `.env`: `ELEVENLABS_VOICE_ID=j9zDdWCMVw4VqUJwzwAL` 교체 (PVC)
- `scripts/tts-generate.ts` + `tts-demo-slides.ts`:
  - `voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true }`
  - 한글 음차 치환 (`project.romanize` / `spec.romanize` 매핑 테이블)
  - 청크별 loudnorm I=-18 + apad 0.25 (볼륨 편차 + 호흡 보정)
  - 출력 경로 `output/{pid}.mp3` (vg-new 호환을 위해 `input/`에도 복사)
- vg-voice / vg-demo-voice SKILL.md 업데이트

### 1.2 deep-blue 풀 파이프라인 (테스트 영상)
사용자가 직접 작성한 7챕터 대본 ("딥 블루 — AI 시대 개발자의 권태와 길")을 input으로 받아 풀 파이프라인 실행.

**Phase 결과**:
| Phase | 결과 |
|---|---|
| script.json | 7챕터 3,367자, romanize 23개 매핑 |
| TTS (PVC) | 412.5초 (~6.9분), 99 SRT 엔트리 |
| /vg-chunk | 91 beats, scene_role 9종, 17 visual assets (Wikimedia + GitHub avatars + Iconify) |
| /vg-scene | 37 scene blocks, 7 layout family |
| /vg-layout | 비카드 51% / Split 22% / 고유 노드 25종 / 차트 32% / 에셋 65% / 11 Pexels 비디오 배경 |
| /vg-render | 90.3MB / 412.7s mp4 |

**산출물**:
- `data/deep-blue/` — script/beats/scenes/render-props/project (gitignored, 로컬에 있음)
- `output/deep-blue.mp4` (gitignored)
- `output/deep-blue.mp3` + `.srt` (gitignored)
- `public/icons/deep-blue/` — 17개 에셋 (untracked, 로컬에 있음)

### 1.3 자막 / 씬 싱크 영구 가드 (커밋 2)
deep-blue를 빌드하다가 발견한 3가지 사고를 코드/스킬에 영구 반영.

| 사고 | 원인 | 가드 |
|---|---|---|
| **자막 단어 잘림** ("가면," 같은 파편) | 24자 강제 분할 + 어절 단위 fallback | `src/services/subtitle-splitter.ts` — 4단계 의미 단위 분할 (문장부호→쉼표→접속사→절 종결 어미). 30자 초과는 그대로 두어 자연 wrap 허용 |
| **자막-오디오 1~6초 drift** (씬 후반) | TTS 재합성 후 scene 경계를 1.00058배 비례 스케일 (cumulative rounding error) | `src/services/scene-sync-validator.ts` + `scripts/check-scene-sync.ts` + `scripts/postprocess.sh` ⑦단계. 250ms 이상 drift 시 빌드 실패. **scene 경계 = SRT entry 경계 HARD INVARIANT** 명문화 |
| **매 씬 카드 타이틀 흔들림** | 모든 Kicker에 `motion.preset: "fadeUp"` (24px 슬라이드 인) | 3중 차단: (1) `StackRenderer`가 `type === "Kicker"`면 motion 자동 무시, (2) `scripts/strip-kicker-motion.js` postprocess, (3) `vg-layout` SKILL.md 금지사항 #0 |

추가로 `scene-blocks.ts.buildSceneBlock()`이 `subtitle-splitter`를 자동 호출하도록 통합 — 모든 신규 프로젝트는 처음부터 의미 단위 자막을 받음.

---

## 2. 다음 세션 우선순위

### 2.1 deep-blue 영상 재빌드 (HIGH)
현재 `output/deep-blue.mp4`는 **drift가 있는 채로 멈춘 상태**. 사용자가 "렌더링 다시 하지 말고 코드만 강화" 지시한 시점에 멈췄음. 가드는 들어갔지만 **deep-blue 자체는 가드 적용된 상태로 다시 빌드해야 한다**.

올바른 절차:
```bash
# 1. 기존 산출물 폐기
rm data/deep-blue/{beats.json,scenes.json,scenes-v2.json,scene-plan.json,render-props-v2.json}
rm output/deep-blue.{mp4,mp3,srt}

# 2. TTS 재합성 (PVC + 한글 음차)
npx tsx scripts/tts-generate.ts deep-blue

# 3. /vg-chunk Skill 호출 — 새 SRT 기반 의미 청킹 + 에셋 수집
#    (이전 세션의 91 beats.json은 참고용으로 유지하되 새로 만들어야 함)

# 4. /vg-scene Skill 호출 — 새 beats 기반 scene 경계 정확히 정렬

# 5. /vg-layout Skill 호출 — stack_root 수동 설계
#    (이전 LAYOUTS는 scripts/build-deep-blue-layouts.py에 보관, 재사용 가능)

# 6. /vg-render Skill 호출
#    postprocess.sh가 자동으로:
#    - strip-kicker-motion (Kicker 정적화)
#    - subtitle-splitter (의미 단위 자막)
#    - check-scene-sync (drift 가드)
```

이렇게 하면 자막/씬/Kicker 3가지 사고가 모두 자동 차단된 상태로 빌드됨.

### 2.2 핸드오프된 스크립트 정리 (LOW)
이번 세션의 **일회성 패치 스크립트들**이 untracked로 남아있음. TS 모듈로 영구 통합됐으므로 삭제하거나 별도 폴더로 옮겨도 됨:
- `scripts/build-deep-blue-layouts.py` — 37씬 stack_root 수동 설계 (LAYOUTS 배열, 재사용 가능 참고용)
- `scripts/fix-deep-blue-density.py` — 차트/에셋 비율 보강
- `scripts/repatch-deep-blue.py` — **이게 사고 원인이었던 비례 스케일 패치.** 유지하지 말 것 (반면교사용)
- `scripts/resplit-deep-blue-subs.py` — 의미 단위 분할 1차 시도 (이제 `subtitle-splitter.ts`로 통합됨, 삭제 가능)

### 2.3 데이터/산출물 정리 (LOW)
git status에 남은 비관련 변경:
- `dist/`, `.claude/skills/vg-package/skill.md` — 이전 vg-package 산출물
- `src/app/page.tsx` — Demo Builder 링크 추가 (별도 작업)
- `public/audio/테스트.mp3` — 데모 산출물

이것들은 따로 검토하고 커밋 또는 폐기.

---

## 3. 새 가드 사용법 (다음 세션이 알아야 할 것)

### 3.1 자막 분할은 자동
`/vg-scene` 또는 `groupBeatsIntoSceneBlocks()`를 호출하면 `buildSubtitleEntries()`가 자동으로 의미 단위 분할. 별도 호출 불필요.

수동 호출이 필요하면:
```typescript
import { buildSubtitleEntries } from "./src/services/subtitle-splitter";
const subs = buildSubtitleEntries(text, startMs, endMs, sceneStartMs, /* maxChars */ 30);
```

### 3.2 씬-자막 싱크 검증
`bash scripts/postprocess.sh data/{pid}/scenes-v2.json` 가 자동으로 ⑦단계에서 실행.

수동 검증:
```bash
npx tsx scripts/check-scene-sync.ts deep-blue
# exit 0 → OK / exit 1 → drift 발견
```

자동 복구가 필요하면:
```typescript
import { rebuildScenesFromSrt } from "./src/services/scene-sync-validator";
const { scenes, report } = rebuildScenesFromSrt(scenes, srtEntries);
```
하지만 **권장은 `/vg-chunk + /vg-scene + /vg-layout` 재실행** (semantic annotations 보존을 위해).

### 3.3 Kicker는 자동 정적
`stack_root`에 `Kicker`를 만들 때 `motion.preset` / `motion.emphasis`를 넣어도 무시됨. 안 넣는 게 정석.

```json
{
  "id": "k", "type": "Kicker",
  "data": { "text": "AI 코딩 도구의 가속" }
  // motion 필드 없음
}
```

---

## 4. 절대 하지 말 것

1. **scene 경계를 비례 스케일하지 마라** (`scene.start_ms *= scale` 같은 패치). 누적 rounding error로 자막-오디오가 1~6초 어긋난다. 재TTS 후엔 반드시 `/vg-chunk + /vg-scene` 재실행.
2. **자막을 어절 단위로 자르지 마라.** "가면," 같은 무의미 파편 생성. 30자 초과는 자연 wrap 허용.
3. **Kicker에 motion 넣지 마라.** 매 씬 흔들거림 유발. 렌더러가 무시하지만 JSON에도 넣지 말 것.
4. **vg-* 스킬을 우회하고 raw 스크립트로 파이프라인 돌리지 마라** (이번 세션 초반에 한 실수). `Skill tool`로 호출해야 의미 청킹/레이아웃 설계가 진짜 일어남.

---

## 5. 참고 파일

### 코드
- `src/services/subtitle-splitter.ts` — 의미 단위 자막 분할
- `src/services/scene-sync-validator.ts` — drift 검출 + rebuild
- `src/services/scene-blocks.ts` — buildSceneBlock에 splitter 통합
- `src/remotion/common/StackRenderer.tsx` (line ~870) — Kicker motion 자동 무시

### 스크립트
- `scripts/check-scene-sync.ts` — drift 검증 CLI
- `scripts/strip-kicker-motion.js` — Kicker entrance preset 제거
- `scripts/postprocess.sh` — ⓪-c (strip-kicker) + ⑦ (sync 검증) 통합

### 스킬
- `.claude/skills/vg-scene/SKILL.md` — scene 경계 invariant + 자막 분할 섹션
- `.claude/skills/vg-voice/SKILL.md` — 재합성 후 절차 HARD RULE
- `.claude/skills/vg-layout/SKILL.md` — 금지사항 #0 (Kicker 모션)
- `.claude/skills/vg-demo-voice/SKILL.md` — PVC 설정

### 메모리 (앞 세션 산출물)
- `~/.claude/projects/-Users-futurewave-Documents-dev-newVideoGen/memory/project_elevenlabs_pvc.md`
- `feedback_tts_postprocess.md`
- `project_vg_demo_pipeline.md`
- `feedback_output_location.md`

### 사용자 피드백 히스토리 (이번 세션)
1. "자막은 한 줄씩 짧게 끊어치면 좋겠어. GPT-5.4는 5점 사가 아니야 5.4지" → 음차 수정 + 1차 자막 분할
2. "단어 단위까지 의미없게 잘렸네" → 어절 분할 금지, 의미 단위 4단계 분할
3. "마지막 문장 음성이 개발자일 여기서 끝나" → 마지막 씬 +200ms 버퍼
4. "스킬에 영구 통합해줘" → `subtitle-splitter.ts` 모듈화
5. "중후반부 자막이 씬과 싱크 안 됨. 렌더 다시 말고 가드만" → `scene-sync-validator.ts` + postprocess gate
6. "매 씬 카드 타이틀이 흔들거려" → Kicker motion 3중 차단

각 피드백마다 사고 → 진단 → 영구 가드 → 문서화 사이클로 처리됨.

---

**다음 액션 (첫 30분 안에)**:
1. 이 핸드오프 읽기
2. `git pull` (이미 푸시됨)
3. `bash scripts/postprocess.sh data/deep-blue/scenes-v2.json` 실행해서 가드들이 deep-blue에 어떤 결과를 내는지 확인
4. 사용자에게 deep-blue 재빌드 진행 여부 확인 (위 2.1 절차)
