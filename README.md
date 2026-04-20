# videogen 1.4

Remotion + Next.js 기반의 AI 영상 생성 엔진입니다.

이 프로젝트의 목표는 "AI가 만든 것처럼 보이지 않는 영상"입니다. 단순한 카드 나열 대신, 장면마다 깊이감, 비대칭 구도, 강한 타이포그래피, 밀도 있는 정보 구조를 가진 영상 제작 파이프라인을 제공합니다.

## 핵심 특징

- Remotion 4 기반의 React 영상 렌더링
- Next.js App Router 기반의 웹 UI와 API
- `SRT -> beats -> scenes -> stack_root -> mp4` 파이프라인
- 장면별 `stack_root` JSON 트리를 재귀 렌더링하는 구조
- 자막, 에셋, SVG, 차트, 카드, 다이어그램을 조합하는 60+ 노드 시스템
- 청크 편집, 씬 편집, 렌더 제어를 위한 웹 인터페이스
- 에셋 태깅, SVG 플래닝, 후처리 스크립트를 포함한 영상 제작 워크플로우

## 기술 스택

- Next.js 16
- React 19
- Remotion 4
- TypeScript
- Tailwind CSS
- Radix UI
- Zustand
- Zod
- Vitest / Playwright

## 빠른 시작

### 요구 사항

- Node.js
- npm
- ffmpeg

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

기본 포트는 `3000`이며, 이미 사용 중이면 Next.js가 다른 포트를 자동으로 선택합니다.

### 프로덕션 빌드 검증

```bash
npm run build
```

### Remotion 프리뷰

```bash
npm run remotion:preview
```

### MP4 렌더링

```bash
npx remotion render src/remotion/index.ts MainComposition output/demo.mp4 \
  --props=data/{projectId}/render-props-v2.json \
  --concurrency=4
```

예시 데이터는 `data/기업승계형-ma/` 아래에 포함되어 있습니다.

## 파이프라인

전체 흐름은 아래와 같습니다.

```text
script -> voice -> chunk -> scene -> layout -> render
```

조금 더 구체적으로는 다음 순서입니다.

1. `/vg-script`: 주제 텍스트에서 대본 생성
2. `/vg-voice`: 대본에서 MP3 + SRT 생성
3. `/vg-chunk`: SRT를 의미 단위 beat로 분할
4. `/vg-scene`: beat를 장면 구조로 변환
5. `/vg-layout`: 장면별 `stack_root`와 시각 요소 생성
6. `/vg-render`: Remotion으로 최종 mp4 렌더링

이미 MP3와 SRT가 있으면 `/vg-chunk`부터 시작할 수 있습니다.

## 프로젝트 구조

```text
src/
  app/                  Next.js 페이지와 API 라우트
  components/           에디터, 프리뷰, 렌더 UI
  remotion/             Composition, SceneRenderer, 노드 구현
  services/             파일 I/O, 파이프라인, 플래너, 검증기
  types/                공통 타입과 스키마
data/                   프로젝트별 scenes-v2, render-props 등
public/                 오디오, 비디오, 이미지, SVG 자산
scripts/                생성/후처리/검증 스크립트
docs/                   워크플로우, 아키텍처, 디자인 문서
reference/              장면 레퍼런스 이미지
output/                 최종 렌더 결과물
```

핵심 진입점은 다음과 같습니다.

- `src/remotion/index.ts`
- `src/remotion/Root.tsx`
- `src/remotion/Composition.tsx`
- `src/remotion/common/StackRenderer.tsx`
- `src/remotion/common/SceneRenderer.tsx`
- `src/remotion/nodes/registry.ts`

## 주요 스크립트

| 명령어 | 설명 |
|------|------|
| `npm run dev` | Next.js 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 검증 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | 린트 실행 |
| `npm run test` | Vitest 실행 |
| `npm run test:e2e` | Playwright 실행 |
| `npm run remotion:preview` | Remotion 프리뷰 실행 |
| `npm run remotion:render` | Remotion 렌더 명령 시작점 |

## 디자인 원칙

이 저장소는 단순히 "영상이 나오면 된다"가 아니라, 시각적 밀도와 구도 품질을 강하게 요구합니다.

- 사각형 카드 나열 금지
- 모든 씬에 전경/중경/배경의 층위 확보
- 좌우 대칭보다 비대칭 구도 우선
- 같은 구도를 반복하지 않기
- 어두운 배경에서 보이지 않는 자산은 사용하지 않기
- `InsightTile` 노드 사용 금지

더 자세한 작업 규칙은 `AGENTS.md`를 참고하시면 됩니다.

## 문서

- [사용 가이드](docs/01-usage-guide.md)
- [워크플로우](docs/02-workflow.md)
- [아키텍처](docs/03-architecture.md)
- [디자인 시스템](docs/design-system.md)

## 출력 경로

- 렌더 결과: `output/{projectId}.mp4`
- 프로젝트 데이터: `data/{projectId}/scenes-v2.json`
- 렌더 입력값: `data/{projectId}/render-props-v2.json`

## 참고

- 이 저장소에는 실제 자산과 샘플 프로젝트 데이터가 함께 포함되어 있습니다.
- 공개 저장소에 올릴 때는 `.env`, 대용량 산출물, 로컬 캐시가 포함되지 않도록 관리하는 것을 권장합니다.
