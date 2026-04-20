# /vg-voice — 대본 → 음성(MP3) + 자막(SRT) 자동 생성

> script.json의 대본을 ElevenLabs PVC로 합성하여 MP3 + SRT를 자동 생성합니다.

## 트리거

```
/vg-voice {projectId}              # 대본 → MP3 + SRT
/vg-voice {projectId} --preview    # 첫 챕터만 테스트
/vg-voice --list                   # 사용 가능한 음성 목록
```

## 사전 조건

- `data/{projectId}/script.json` 존재 (`/vg-script`로 생성)
- `.env`에 `ELEVENLABS_API_KEY` 설정
- `.env`에 `ELEVENLABS_VOICE_ID=j9zDdWCMVw4VqUJwzwAL` (PVC, 2026-04-13 이후)
- `project.json`에 `voice.voice_id`가 있으면 그것이 우선

## 워크플로우

### Step 1: 대본 로드

```
Read: data/{projectId}/script.json
Read: data/{projectId}/project.json
Read: .env (API key, voice_id)
```

### Step 2: 영문 음차 치환

한국어 문장 속 영문 고유명사를 한글로 치환 (PVC 한국어 낭독 일관성).
- 기본 매핑: `"Save to Notion" → "세이브 투 노션"`, `"Notion" → "노션"`
- 프로젝트별 확장: `project.json`의 `romanize` 필드로 매핑 추가 가능
- 건너뛰기: `project.json.keep_english = true`면 치환 스킵

### Step 3: TTS API 호출 (PVC 설정)

script.json의 각 챕터를 순서대로 TTS 변환합니다.

```bash
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps
{
  "text": "<음차 적용된 챕터 텍스트>",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.4,
    "similarity_boost": 0.8,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

**응답:**
```json
{
  "audio_base64": "...",
  "alignment": {
    "characters": ["안", "녕", ...],
    "character_start_times_seconds": [0.0, 0.15, ...],
    "character_end_times_seconds": [0.15, 0.28, ...]
  }
}
```

### Step 4: 청크별 후처리 (필수)

각 TTS 청크를 raw mp3로 저장한 뒤 loudnorm + apad 정규화:

```bash
ffmpeg -i chunk.raw.mp3 \
  -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" \
  -ar 44100 -ac 1 chunk.norm.wav
```

- `loudnorm`: PVC 청크별 볼륨 편차 제거
- `apad=0.25`: 청크 경계 호흡 확보. SRT의 `timeOffset` 증가분(+0.25s)과 일치해야 자막 싱크가 유지됨.

### Step 5: SRT 생성

ElevenLabs character-level 타임스탬프를 문장 단위 SRT로 변환:
1. `characters[]` + `start_times[]` + `end_times[]` 결합
2. `.`/`?`/`!` 기준 문장 분리
3. 각 문장 시작/끝 시간을 SRT 엔트리로

```srt
1
00:00:00,000 --> 00:00:02,340
안녕하세요, 오늘은 세이브 투 노션에 대해 이야기하겠습니다.
```

### Step 6: 오디오 병합 + 파일 저장

정규화된 wav들을 concat → mp3 인코딩:

```bash
ffmpeg -f concat -safe 0 -i concat.txt \
  -c:a libmp3lame -q:a 2 -ar 44100 -ac 1 output/{projectId}.mp3
```

**최종 경로**:
- `output/{projectId}.mp3` — 사용자가 듣는 최종 산출물
- `output/{projectId}.srt` — 자막 원본
- `input/{projectId}.mp3`, `input/{projectId}.srt` — `/vg-new` 파이프라인 호환을 위한 복사본

`project.json` 업데이트:
```json
{
  "srt_path": "{projectId}.srt",
  "audio_path": "{projectId}.mp3",
  "status": "voiced"
}
```

## 실행 스크립트

```bash
npx tsx scripts/tts-generate.ts {projectId}
npx tsx scripts/tts-generate.ts {projectId} --preview
```

## 출력

```
output/{projectId}.mp3           # 최종 TTS 음성 (primary)
output/{projectId}.srt           # 문장 단위 자막 (primary)
input/{projectId}.mp3            # vg-new 호환 복사본
input/{projectId}.srt            # vg-new 호환 복사본
data/{projectId}/project.json    # status: "voiced"
```

## 다음 단계

```
/vg-new              # input/{projectId}.{mp3,srt}을 인식하여 파이프라인 실행
/vg-layout {id}      # 레이아웃 생성
/vg-render {id}      # 영상 렌더링
```

## ⛔ 재합성 후 필수 절차 (HARD RULE)

이미 `/vg-chunk` + `/vg-scene` + `/vg-layout`까지 진행된 프로젝트에서 **TTS만 재합성**하는 경우 (예: romanize 수정, voice 변경)
**scene 경계와 새 SRT가 어긋난다.** 새 mp3는 미세하게 다른 타이밍을 갖고, 기존 scene의 `start_ms`/`end_ms`/`duration_frames`는 옛 SRT 기준이기 때문이다.

**비례 스케일은 금지.** `scene.start_ms *= scale` 같은 패치는 cumulative drift를 만들고 자막이 오디오와 1~6초 어긋난다.

**올바른 절차:**
1. `/vg-voice {pid}` 재실행 → 새 mp3 + 새 SRT
2. `/vg-chunk {pid}` 재실행 → 새 SRT 기반 새 beats.json
3. `/vg-scene {pid}` 재실행 → 새 beats 기반 새 scenes-v2.json (경계 자동 정렬)
4. `/vg-layout {pid}` 재실행 — stack_root 재설계
5. `/vg-render {pid}` 최종 렌더

**검증:** `npx tsx scripts/check-scene-sync.ts {pid}` — drift 250ms 이상이면 빌드 실패.

`scripts/postprocess.sh`에 `check-scene-sync` 가드가 자동 통합되어 있어 어긋나면 빌드가 멈춘다.

**Why:** 2026-04-13 deep-blue 프로젝트에서 TTS만 재합성하고 scene을 1.00058배 비례 스케일했더니 자막-오디오 누적 drift 최대 6.5초.

## 금지

- `style > 0.0` 금지 — PVC 낭독 톤 깨짐
- loudnorm 스킵 금지 — 청크별 볼륨 편차가 시청자에게 바로 노출됨
- IVC voice_id(`hh4Wghw54LQDbTZ4X0wW`) 되돌리지 말 것 — PVC로 완전 교체됨
- `output/` 대신 `tmp/`, `public/audio/`에 최종 산출물 저장 금지

## 제한사항

- ElevenLabs API 1회 호출 최대 5000자 (초과 시 문장 단위 분할)
- 한국어는 `eleven_multilingual_v2`만 사용 (`turbo_v2.5`는 한국어 미지원)
- PVC 학습 언어는 Korean — 영문만 긴 스크립트는 발음이 어색해질 수 있음 (음차로 회피)
