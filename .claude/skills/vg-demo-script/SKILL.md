---
name: vg-demo-script
description: demo-spec.json의 슬라이드별 한 줄 액션을 자연스러운 한국어 나레이션 2~3문장으로 확장합니다. /vg-demo Phase 1 전용.
---

# /vg-demo-script — 액션 → 나레이션 확장

각 슬라이드의 `action` 한 줄(예: "파일 메뉴 클릭")을 영상 나레이션으로 확장합니다.

## 트리거

```
/vg-demo-script {pid}
```

## 사전 조건

- `data/{pid}/demo-spec.json` 존재
- 모든 슬라이드의 `action` 입력 완료

## 워크플로우

1. `demo-spec.json` 로드
2. 슬라이드 순서대로 다음을 수행 (Claude가 직접 — 별도 스크립트 없음):
   - **이전 슬라이드의 narration**과 **현재 action**을 함께 보고 흐름이 자연스럽게 이어지는 2~3문장 작성
   - 톤: 친근한 튜토리얼 해설 (반말/존댓말은 첫 슬라이드에서 결정 → 전체 일관 유지)
   - 길이: 슬라이드당 35~70자 (TTS 5~10초 수준)
   - **금지**: "이 슬라이드에서는~", "다음으로~" 같은 메타 언어
   - **MUST**: 사용자 시선/행동에 맞춰 직접적 — "여기를 누르면 모달이 열려요". 시점 어긋난 메타 톤은 vg-narration-sync 가드 fail (TODO).
3. 결과를 `slides[i].narration`에 저장 → spec 다시 쓰기

## GATE

- 모든 슬라이드에 narration 채워짐
- 각 narration 길이 ≥ 20자
- 첫 문장이 "이 슬라이드", "다음으로" 등으로 시작하지 않음

실패 시 해당 슬라이드만 재생성.

## 예시

입력:
```json
{ "action": "파일 메뉴 클릭" }
```

출력:
```json
{
  "action": "파일 메뉴 클릭",
  "narration": "먼저 상단 왼쪽의 파일 메뉴를 클릭합니다. 새 프로젝트를 만들거나 기존 프로젝트를 열 수 있어요."
}
```
