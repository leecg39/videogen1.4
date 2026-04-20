---
name: vg-video-demo-voice
description: video-spec.json의 세그먼트별 narration을 ElevenLabs PVC로 합성하고 세그먼트별 length(narration_ms) + 통합 mp3를 생성합니다. /vg-video-demo Phase 2 전용.
---

# /vg-video-demo-voice — 세그먼트별 PVC TTS 생성

/vg-demo-voice 의 비디오 버전. `scripts/tts-video-demo-segments.ts` 가 실제 작업을 수행한다.

## 트리거

```
/vg-video-demo-voice {pid}
/vg-video-demo-voice {pid} --preview    # 첫 세그먼트만
```

## 사전 조건

- `data/{pid}/video-spec.json`의 모든 세그먼트 `narration` 채워짐 (Phase 1 완료)
- `.env`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID=j9zDdWCMVw4VqUJwzwAL` (PVC)

## 워크플로우 (scripts/tts-video-demo-segments.ts가 자동 실행)

1. **영문 음차 치환**: 한국어 narration 속 영문 고유명사를 한글로 치환.
   - 기본 매핑: `"Save to Notion" → "세이브 투 노션"`, `"Notion" → "노션"`
   - 프로젝트별 확장: `video-spec.json`의 `romanize` 필드로 추가 매핑 가능
2. **세그먼트별 PVC TTS 호출** — eleven_multilingual_v2, stability 0.4 / similarity 0.8 / style 0.0 / speaker boost on
3. **세그먼트별 후처리** (필수): loudnorm I=-18 + apad 0.25로 정규화
   ```
   ffmpeg -i segN.raw.mp3 \
     -af "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true,apad=pad_dur=0.25" \
     -ar 44100 -ac 1 segN.norm.wav
   ```
4. **길이 측정**: `segments[i].narration_ms`, `audio_offset_ms` 채움
5. **병합**: `output/{pid}.mp3`
6. **voice-timeline.json 저장**:
   ```json
   {
     "total_ms": 45000,
     "segments": [
       { "id": "seg-1", "offset_ms": 0, "duration_ms": 6450 },
       { "id": "seg-2", "offset_ms": 6450, "duration_ms": 7350 }
     ]
   }
   ```
7. `video-spec.json` 다시 쓰기

## 실행

```bash
npx tsx scripts/tts-video-demo-segments.ts {pid}
npx tsx scripts/tts-video-demo-segments.ts {pid} --preview
```

## GATE

- `output/{pid}.mp3` 존재 + 크기 > 50KB
- 모든 세그먼트의 `narration_ms` ≥ 1000
- `voice-timeline.json` 존재 + `segments` 길이 = `spec.segments` 길이

## 출력

```
output/{pid}.mp3                 # 통합 나레이션
data/{pid}/voice-timeline.json
data/{pid}/video-spec.json       # narration_ms / audio_offset_ms 채워짐
tmp/{pid}/segN.raw.mp3           # 중간 파일
tmp/{pid}/segN.norm.wav          # 중간 파일
```

## 금지

- `public/audio/` 저장 금지 — 최종물은 반드시 `output/{pid}.mp3`
- `style > 0.0` 금지 — PVC 낭독 톤이 깨짐
- 후처리 스킵 금지 — loudnorm 없이 concat하면 볼륨 편차 발생
