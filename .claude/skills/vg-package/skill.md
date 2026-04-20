---
name: vg-package
description: newVideoGen 스킬팩을 dist/ 폴더에 배포 패키징합니다. "패키징해줘" 키워드에 반응합니다.
---

# /vg-package — 배포 패키징

스킬이 포함된 전체 프로젝트를 ZIP으로 압축하고, **소개 문서 4종을 생성/업데이트**합니다.

## 🚫 배포 원칙 (반드시 지킬 것)

**ZIP 이 곧 배포본이다.** 사용자는 `newVideoGen-vX.Y.Z.zip` 을 받아서 압축만 풀면 모든
것이 동작해야 한다.

- ❌ **문서에 `git clone` 지시 금지** — 사용자는 GitHub 접근 권한이 없을 수 있다.
- ❌ **문서에 GitHub URL 안내 금지** — 프라이빗 레포일 수 있다.
- ✅ ZIP 에는 민감 정보(.env)와 대용량 바이너리(원본 이미지/오디오/비디오/렌더결과)를
  제외한 **모든 파일** 을 포함한다 — 스킬, 소스, docs, 스크립트, 설정, SFX 에셋, 빌드 설정까지.
- ✅ 모든 사용자 문서(01~04) 는 "ZIP 압축 풀기 → npm install" 흐름으로 작성한다.

## ⚠️ 필수 체크리스트 (절대 스킵 금지)

1. dist/01-introduction.md 업데이트
2. dist/02-pipeline.md 업데이트
3. dist/03-usage.md 업데이트
4. **dist/04-video-background-guide.md 업데이트** (초보자 가이드 — 새 기능/변경사항 반영)
5. dist/VERSION 업데이트
6. dist/newVideoGen-v{버전}.zip 재생성
7. **local(.claude/skills/) 와 global(~/.claude/skills/) vg-* 스킬 동기화**
   — 패키징 전 `cp -R .claude/skills/vg-*` 로 global 을 local 과 일치시킬 것

위 7개 중 하나라도 빠지면 패키징 실패로 간주한다. 특히 04 는 초보자가 실제로 읽는 문서이므로
Product Demo 같은 새 기능이 들어오면 반드시 여기에도 반영해야 한다.

## 트리거

```
패키징해줘
/vg-package
```

## 워크플로우

### Step 1: 버전 확인

AskUserQuestion 도구로 버전을 물어봅니다:

```
현재 버전: {마지막 버전 또는 1.0.0}
어떤 업데이트인가요?
1) patch (버그 수정) → {x.y.z+1}
2) minor (기능 추가) → {x.y+1.0}
3) major (대규모 변경) → {x+1.0.0}
4) 직접 입력
```

버전 이력은 `dist/VERSION` 파일에 저장합니다 (없으면 1.0.0 시작).

### Step 2: dist/ 문서 4종 생성/업데이트

**반드시 4개 파일 모두 새 버전 내용으로 갱신. 하나라도 빠지면 안 됨.**


#### ① dist/01-introduction.md — 소개자료

```markdown
# newVideoGen v{버전}
> AI 기반 교육 영상 자동 생성 스킬팩

## 운영자 멘트
(프로젝트의 비전과 가치를 1~2문단으로)

## 핵심 특징
- 주제 텍스트 → 대본 → 음성 → 영상 End-to-End 자동화
- 32종 Leaf + 9종 Container + 8종 도식화 노드
- 26종 entrance + 19종 emphasis 모션 프리셋
- TransitionSeries 씬 간 트랜지션
- SvgGraphic: Claude가 직접 SVG 디자인
- 후처리 파이프라인 6단계 자동 품질 보정
- ElevenLabs TTS 음성 클론 지원

## 기능 목록
| 스킬 | 역할 |
|------|------|
| /vg-script | 대본 자동 생성 |
| /vg-voice | TTS → MP3 + SRT |
| /vg-chunk | SRT 의미 청킹 |
| /vg-scene | 씬 구조 + 트랜지션 |
| /vg-layout | AI 레이아웃 생성 |
| /vg-render | mp4 렌더링 |
| /vg-slides | 슬라이드 영상 |
| /vg-assets | 에셋 태깅 |
| /vg-new | 프로젝트 초기화 |
| /vg-analyze | 디자인 토큰 추출 |
| /vg-catalog | 카탈로그 생성 |
| /vg-package | 배포 패키징 |

## 버전 이력
- v{버전}: {변경 요약}
```

내용은 현재 코드베이스, docs/, CLAUDE.md를 읽고 **최신 상태**를 반영하여 작성합니다.

#### ② dist/02-pipeline.md — 파이프라인

docs/02-workflow.md를 기반으로 **배포용**으로 정리합니다:
- 전체 파이프라인 다이어그램
- 각 단계별 입력/출력
- 후처리 파이프라인 설명
- 데이터 파일 생명주기

#### ③ dist/03-usage.md — 사용법

docs/01-usage-guide.md를 기반으로 **초보자가 바로 따라할 수 있는** 가이드:
- 사전 준비 (Node.js, .env 설정)
- 방법 A: MP3+SRT로 영상 만들기
- 방법 B: 대본만 있을 때
- 방법 C: Product Demo (/vg-demo) — 스크린샷 기반 튜토리얼
- 방법 D: 슬라이드 영상
- Slash Commands 전체 목록
- 트러블슈팅

#### ④ dist/04-video-background-guide.md — 초보자 가이드 (필수)

대화형 톤으로 작성된 초심자용 end-to-end 가이드. **이 파일은 절대 빠지면 안 됨.**
매 버전마다 아래 항목을 반영해 완전 재작성:
- 사전 준비 (Claude Code 설치, ffmpeg, API 키)
- 영상 만드는 모든 방법 (A/B/C + Product Demo)
- 새 기능/변경사항 bullet 업데이트 (예: v1.3.0 에서는 Y축 보정, SFX, 포인터 커서,
  hotspot 드래그 등)
- 전체 슬래시 명령어 표 (메인/Product Demo/특수/보조 4 카테고리)
- FAQ (렌더 시간, 비용, 해상도, 한국어, 새 기능 관련 질문)

**초보자 관점에서 바로 따라할 수 있도록 실제 명령어와 버튼 클릭 흐름을 반드시 포함.**

### Step 3: local ↔ global 스킬 동기화 (필수)

패키징 전 반드시 local(.claude/skills/) 의 vg-* 스킬을 global(~/.claude/skills/) 로 복사:

```bash
for s in .claude/skills/vg-*; do
  name=$(basename "$s")
  rm -rf ~/.claude/skills/"$name"
  cp -R "$s" ~/.claude/skills/"$name"
done
```

이 단계를 건너뛰면 다른 프로젝트에서 최신 스킬을 호출할 수 없다.

### Step 4: ZIP 생성

```bash
# dist/ 폴더 생성
mkdir -p dist

# ZIP 대상: 스킬 + 소스 + 문서 + 스크립트 + 설정
# 제외: node_modules, output/, data/*/scenes-v2.json(대용량), .git, public/*.mp3
zip -r dist/newVideoGen-v{버전}.zip \
  .claude/skills/ \
  src/ \
  scripts/ \
  docs/ \
  public/assets/ \
  public/sfx/ \
  CLAUDE.md \
  package.json \
  package-lock.json \
  tsconfig.json \
  remotion.config.ts \
  tailwind.config.ts \
  postcss.config.mjs \
  next.config.ts \
  -x "node_modules/*" "output/*" ".git/*" "public/audio/*.mp3" "data/*/scenes-v2.json" "data/*/render-props-v2.json"
```

### Step 5: VERSION 파일 업데이트

```
echo "{버전}" > dist/VERSION
```

### Step 6: 결과 보고

```
✅ 패키징 완료: newVideoGen v{버전}

dist/
  ├── newVideoGen-v{버전}.zip         ({크기}MB)
  ├── 01-introduction.md              소개자료
  ├── 02-pipeline.md                  파이프라인
  ├── 03-usage.md                     사용법
  ├── 04-video-background-guide.md    초보자 가이드 (대화형 톤)
  └── VERSION                         {버전}
```

**완료 전 셀프 체크 (반드시 모두 ✅ 여야 함)**:
- [ ] 01/02/03/04 네 개 문서 전부 최신 버전 내용 반영
- [ ] VERSION 파일 갱신
- [ ] local 스킬 → global 동기화 완료
- [ ] ZIP 의 vg-* 스킬 수가 로컬과 일치 (`[ "$(unzip -l dist/newVideoGen-v*.zip | grep -c 'skills/vg-[^/]*/skill.md')" = "$(ls -d .claude/skills/vg-*/ | wc -l | tr -d ' ')" ]`)

## ZIP 포함 목록

| 폴더/파일 | 포함 | 이유 |
|----------|------|------|
| `.claude/skills/` | ✅ | 핵심 스킬 파일 |
| `src/` | ✅ | 소스 코드 |
| `scripts/` | ✅ | 후처리 + 생성 스크립트 |
| `docs/` | ✅ | 문서 |
| `public/assets/` | ✅ | 이미지 에셋 |
| `public/sfx/` | ✅ | Product Demo SFX (click/move/whoosh/pop) |
| `CLAUDE.md` | ✅ | 프로젝트 설정 |
| `package.json` | ✅ | 의존성 |
| `node_modules/` | ❌ | npm install로 복원 |
| `output/` | ❌ | 렌더링 결과물 |
| `.git/` | ❌ | Git 히스토리 |
| `public/audio/*.mp3` | ❌ | 대용량 나레이션 원본 |
| `data/*/scenes-v2.json` | ❌ | 프로젝트별 대용량 데이터 |
| `input/` | ❌ | 원본 미디어 |

## 주의사항

- dist/ 문서는 매번 **최신 코드 상태**를 읽고 새로 작성합니다 (캐시 사용 금지)
- ZIP 파일명에 버전 포함: `newVideoGen-v1.0.0.zip`
- VERSION 파일은 다음 패키징 시 이전 버전 참조용
