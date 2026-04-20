# SFX Assets for /vg-demo

이 디렉토리는 product demo 영상에 사용되는 효과음을 보관합니다.

## 필요 파일

| 파일 | 용도 | 권장 길이 | 사용처 |
|------|------|----------|--------|
| `click.mp3` | 마우스 클릭 탭 | 50~150ms | Cursor의 click hotspot 도달 시점 |
| `whoosh.mp3` | 씬 전환 화이트 노이즈 | 200~400ms | 씬 시작 (첫 씬 제외) |
| `pop.mp3` | UI 강조 팝 | 100~250ms | 강한 줌-인 시작 시점 (선택) |
| `transition.mp3` | 부드러운 전환 | 300~600ms | 슬라이드 간 추가 강조 (선택) |

## 라이선스

CC0 / 무료 사용 가능한 음원만 사용하세요. 추천 출처:

- [Freesound.org](https://freesound.org) (CC0 필터)
- [Zapsplat](https://www.zapsplat.com) (무료 가입)
- [Mixkit](https://mixkit.co/free-sound-effects/)

## 추가 방법

1. 위 4개 파일을 다운로드하여 `public/sfx/` 폴더에 저장
2. 파일명을 정확히 `click.mp3`, `whoosh.mp3`, `pop.mp3`, `transition.mp3`로 통일
3. `/vg-demo {pid}` 실행 시 자동 사용됨

파일이 없으면 `/vg-demo-fx`가 SFX 노드를 추가하지 않고 영상에 효과음 없이 진행됩니다.
