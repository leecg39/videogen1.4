---
name: vg-video-demo-script
description: video-spec.json의 세그먼트별 한 줄 액션을 자연스러운 한국어 나레이션 2~3문장으로 확장합니다. /vg-video-demo Phase 1 전용.
---

# /vg-video-demo-script — segment action → 나레이션 확장

/vg-demo-script 의 비디오 버전. 입력이 `slides[]` 대신 `segments[]` 이고 파일 이름이 `video-spec.json` 인 것만 다름.

## 트리거

```
/vg-video-demo-script {pid}
```

## 사전 조건

- `data/{pid}/video-spec.json` 존재
- 모든 세그먼트의 `action` 입력 완료

## 워크플로우

1. `video-spec.json` 로드
2. `spec.segments` 순서대로 다음을 수행 (Claude가 직접 — 별도 스크립트 없음):
   - **이전 세그먼트의 narration**과 **현재 action**을 함께 보고 흐름이 자연스럽게 이어지는 2~3문장 작성
   - 톤: 친근한 튜토리얼 해설 (반말/존댓말은 첫 세그먼트에서 결정 → 전체 일관 유지)
   - 길이: 세그먼트당 35~70자 (TTS 5~10초 수준)
   - **금지**: "이 세그먼트에서는~", "다음으로~" 같은 메타 언어
   - **MUST**: 사용자 시선/행동에 맞춰 직접적 — "여기를 누르면 결과가 나타나요". 시점 어긋난 메타 톤은 vg-narration-sync 가드 fail (TODO).
3. 결과를 `segments[i].narration`에 저장 → spec 다시 쓰기

## GATE

- 모든 세그먼트에 narration 채워짐
- 각 narration 길이 ≥ 20자
- 첫 문장이 "이 세그먼트", "다음으로" 등으로 시작하지 않음

실패 시 해당 세그먼트만 재생성.

## 예시

입력:
```json
{ "id": "seg-1", "action": "검색창에 키워드 입력" }
```

출력:
```json
{
  "id": "seg-1",
  "action": "검색창에 키워드 입력",
  "narration": "상단 검색창에 원하는 키워드를 입력합니다. 자동완성 목록이 뜨면 가장 가까운 결과를 바로 선택할 수 있어요."
}
```
