---
name: vg-demo-voice
description: demo-spec.json의 슬라이드별 narration을 ElevenLabs PVC로 합성하고 슬라이드별 length(narration_ms) + 통합 mp3를 생성합니다. /vg-demo Phase 2 전용.
---

# /vg-demo-voice — 슬라이드별 PVC TTS 생성

## 트리거

```
/vg-demo-voice {pid}
/vg-demo-voice {pid} --preview    # 첫 슬라이드만
```

## 사전 조건

- `data/{pid}/demo-spec.json`의 모든 슬라이드 `narration` 채워짐
- `.env`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID=j9zDdWCMVw4VqUJwzwAL` (PVC)

## 워크플로우 (scripts/tts-demo-slides.ts가 자동 실행)

1. **영문 음차 치환**: 한국어 narration 속 영문 고유명사를 한글로 치환.
   - 기본 매핑: `"Save to Notion" → "세이브 투 노션"`, `"Notion" → "노션"`
   - 프로젝트별 확장: `demo-spec.json`의 `romanize` 필드로 추가 매핑 가능
   - 건너뛰기: `demo-spec.json.keep_english = true`면 치환 스킵
2. **슬라이드별 PVC TTS 호출**
   ```
   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
   {
     "text": "<음차 적용된 narration>",
     "model_id": "eleven_multilingual_v2",
     "voice_settings": {
       "stability": 0.4,
       "similarity_boost": 0.8,
       "style": 0.0,
       "use_speaker_boost": true
     }
   }
   ```
3. **슬라이드별 후처리** (필수): 각 슬라이드 raw mp3를 loudnorm + apad로 정규화
   ```
   ffmpeg -i sN.raw.mp3 \
     -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" \
     -ar 44100 -ac 1 sN.norm.wav
   ```
   - `loudnorm`: 슬라이드마다 볼륨 편차 제거 (PVC도 문장별로 흔들림)
   - `apad=0.25`: 슬라이드 경계 호흡 확보 (250ms 무음 꼬리)
4. **길이 측정**: `ffprobe` 로 정규화된 wav의 duration_ms 추출 → `slides[i].narration_ms`
5. **누적 오프셋 기록**: 각 슬라이드 시작 위치 → `slides[i].audio_offset_ms`
6. **병합**: ffmpeg concat(-c:a libmp3lame -q:a 2) → `output/{pid}.mp3`
7. **voice-timeline.json 저장**:
   ```json
   {
     "total_ms": 45000,
     "slides": [
       { "id": "s1", "offset_ms": 0, "duration_ms": 6450 },
       { "id": "s2", "offset_ms": 6450, "duration_ms": 7350 }
     ]
   }
   ```
8. `demo-spec.json` 다시 쓰기 (`narration_ms`, `audio_offset_ms` 채워서)

## 실행

```bash
npx tsx scripts/tts-demo-slides.ts {pid}
npx tsx scripts/tts-demo-slides.ts {pid} --preview
```

## GATE

- `output/{pid}.mp3` 존재 + 크기 > 50KB
- 모든 슬라이드의 `narration_ms` ≥ 1000
- `voice-timeline.json` 존재 + `slides` 길이 = `spec.slides` 길이

## 출력

```
output/{pid}.mp3                 # 통합 나레이션 (최종 산출물)
data/{pid}/voice-timeline.json
data/{pid}/demo-spec.json        # narration_ms / audio_offset_ms 채워짐
tmp/{pid}/sN.raw.mp3             # 중간 파일 (raw PVC)
tmp/{pid}/sN.norm.wav            # 중간 파일 (정규화 + apad)
```

## 금지

- `public/audio/` 저장 금지 — 최종물은 반드시 `output/{pid}.mp3`
- `style > 0.0` 금지 — PVC 낭독 톤이 깨짐
- 후처리 스킵 금지 — loudnorm 없이 concat하면 시청자가 볼륨 편차 즉시 인지
- IVC voice_id(`hh4Wghw54LQDbTZ4X0wW`) 되돌리지 말 것 — PVC로 완전 교체됨
