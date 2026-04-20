# Handoff — ElevenLabs PVC 통합

**날짜**: 2026-04-13
**목적**: futurewave 본인 목소리 PVC를 기존 `/vg-demo-voice`·`/vg-voice` 파이프라인에 통합
**상태**: 학습 완료, 7슬라이드 A/B 테스트 완료, 사용자 승인. **통합 작업만 남음.**

---

## 1. 배경 요약 (이전 세션에서 한 것)

**검증한 옵션 (전부 그닥 → PVC 채택)**
- ElevenLabs IVC (기존): "그닥"이었음
- VoxCPM2 (HF Space, gradio_client): 톤 튐·환각·영문 발음 붕괴로 실패
- Qwen3-TTS: 보이스 클로닝 미지원(48개 프리셋만) → 탈락
- **ElevenLabs PVC ($22/mo Creator)**: ✅ 사용자 승인

**학습 데이터** (`output/pvc/`)
- `01-dubbing.wav` (11:28, -20.9 LUFS, -2.9 dBTP)
- `02-news-0331.wav` (11:50, -21.7 LUFS, -1.5 dBTP)
- `03-vibe-0407.wav` (12:49, -21.1 LUFS, -1.5 dBTP)
- 44.1kHz / 16-bit / mono / 총 36분 / loudnorm I=-18 처리됨
- 소스: `public/더빙.mp3`, `public/오늘의 뉴스 0331.mp3`, `public/0407 바이브 뉴스.mp3`

**테스트 결과** (`data/테스트/` 7슬라이드, "Save to Notion" 워크플로우)
- `output/테스트-pvc.mp3` — 초기 PVC 합성, 볼륨 편차 + 영문 발음 아쉬움
- `output/테스트-pvc-v2.mp3` — 사용자 승인본. s2 음차 재합성 + 슬라이드별 loudnorm
- 총 길이 47.68s (IVC 대비 +1.3% — 거의 동일한 페이싱)
- 환각·반복·톤 튐 **전혀 없음** (VoxCPM2 대비 결정적 차이)

---

## 2. 다음 세션에서 할 일

### 2.1 `.env` 교체 (1분)

```diff
- ELEVENLABS_VOICE_ID=<기존 IVC voice_id>
+ ELEVENLABS_VOICE_ID=j9zDdWCMVw4VqUJwzwAL
```

**주의**: 기존 IVC voice_id를 커밋에 남기지 말 것. 그냥 교체.

### 2.2 `/vg-demo-voice` 스킬 업데이트

**경로**: `.claude/skills/vg-demo-voice/SKILL.md`

**변경점**:
1. **voice_settings 갱신** (현재 skill은 stability 0.5 / similarity_boost 0.75 / style 0.3 — IVC용)
   ```json
   { "stability": 0.4, "similarity_boost": 0.8, "style": 0.0, "use_speaker_boost": true }
   ```
   이유: PVC는 파인튜닝 덕에 similarity_boost를 더 밀어도 안정적이고, style을 0으로 낮춰야 낭독 톤이 일관됨.

2. **모델 ID 명시**: `eleven_multilingual_v2` (한국어 최적, PVC fine_tuned 상태)

3. **슬라이드별 후처리 필수 단계 추가** (현재 스킬엔 없음):
   ```
   ffmpeg -i s{N}.mp3 -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" s{N}_norm.wav
   ```
   이유: PVC도 문장마다 볼륨 흔들림 있음. 사용자가 v1에서 지적.

4. **영문 음차 규칙**: 한국어 narration 속 영문 단어는 한글 음차 기본값.
   ```js
   const ROMANIZE = {
     "Save to Notion": "세이브 투 노션",
     "Notion": "노션",
     // 프로젝트별 확장
   };
   ```
   스킬에서 ElevenLabs API 호출 직전에 치환. 사용자가 "영문 그대로" 원한다고 명시하면 스킵.

5. **출력 경로**: `output/{pid}.mp3` 고정 (`public/audio/` 금지 — 2026-04-13 규칙).

### 2.3 `/vg-voice` 스킬도 동일 검토

`.claude/skills/vg-voice/SKILL.md` — 일반 나레이션 스킬. PVC voice_id 적용 + 같은 voice_settings + 후처리 동일하게. 슬라이드 단위가 아닌 beat 단위라면 beat마다 loudnorm 적용.

### 2.4 검증

`데이터/테스트/` 프로젝트로 엔드투엔드 재실행 → `output/테스트.mp3`가 `output/테스트-pvc-v2.mp3`와 동등한 품질인지 확인. 동등하면 통합 성공.

---

## 3. 참고 파일

- 테스트 스크립트: `/tmp/voxcpm-test/pvc_test.py` (다음 세션에선 프로젝트 안으로 이동 or 삭제)
- 승인본 mp3: `output/테스트-pvc-v2.mp3`
- 학습 wav: `output/pvc/*.wav`
- 메모리:
  - `project_elevenlabs_pvc.md` (voice_id, 설정)
  - `feedback_tts_postprocess.md` (후처리 규칙)
  - `feedback_output_location.md` (output/ 폴더 규칙)

---

## 4. 사용자 피드백 요약 (설계 근거)

- "목소리 톤 자체는 내 것" — similarity 자체는 문제 없음
- "문장마다 볼륨 차이" → **슬라이드별 loudnorm 필수**
- "영어 발음이 조금 아쉬웠고" → **한글 음차 규칙 필요**
- "다른 건 내 목소리와 거의 비슷한 듯" — v2 승인

---

## 5. 하지 말 것

- 기존 IVC voice_id를 "백업용"으로 남기지 말 것 — 완전 교체
- `public/audio/`에 산출물 저장 금지 — `output/` 고정
- VoxCPM2 관련 실험 파일(`/tmp/voxcpm-test/`) 프로젝트 안으로 복사 금지 — 폐기
- PVC voice_settings의 `style`을 0 이상으로 올리지 말 것 (낭독 톤 깨짐)

---

**다음 액션 (첫 30분 안에)**: `/clear` → 이 문서 읽기 → 2.1 `.env` 교체 → 2.2 스킬 수정 → 2.4 `데이터/테스트/`로 검증 → 커밋.
