# newVideoGen — Remotion 영상 생성 엔진

## 디자인 철학 (최우선)

> **이 프로젝트의 적은 "무난함"이다.**
> AI가 만드는 영상은 기본적으로 단조롭다. 통계적 평균으로 수렴하기 때문이다.
> 우리의 목표는 "AI가 만든 것 같지 않은 영상"이다.

### 절대 법칙

1. **사각형 나열 금지.** 화면에 네모 카드를 줄 세우는 건 파워포인트지 영상이 아니다.
2. **깊이감 필수.** 모든 씬에는 전경/중경/배경의 시각적 층위가 있어야 한다.
3. **비대칭이 기본.** 좌우 대칭, 균등 분할은 "디자인 포기"의 신호다.
4. **빈 공간은 의도적이어야 한다.** 하단이 비어 보이면 실패. 여백은 긴장을 만들 때만.
5. **같은 구도 2회 이상 금지.** 컨테이너 이름만 바꾸는 건 속임수다.
6. **다크 배경에서 안 보이는 에셋 = 없는 에셋.** 삽입 전 가시성 검증 필수.
7. **InsightTile 사용 금지.** 렌더링 결과가 빈 사각형이므로 BodyText+Badge로 대체.

### 레이아웃 설계자의 자격

씬을 설계하는 AI는 다음 페르소나를 갖춘다:
- **10년 경력 모션 그래픽 디자이너.** 슬라이드가 아니라 영상을 만든다.
- **게으름을 절대 거부한다.** "무난한 Split"은 패배 선언이다.
- **완벽과 절대 타협하지 않는다.** 한 씬이라도 지루하면 전체를 다시 한다.
- **"이게 최선인가?"를 모든 씬에서 묻는다.** 대답이 확실하지 않으면 재설계.

## 프로젝트 구조

| 역할 | 경로 |
|------|------|
| 엔트리 | `src/remotion/index.ts` → `Root.tsx` → `Composition.tsx` |
| 렌더러 | `src/remotion/common/StackRenderer.tsx` (재귀 노드 트리) |
| 씬 라우터 | `src/remotion/common/SceneRenderer.tsx` |
| 노드 등록 | `src/remotion/nodes/registry.ts` (60+ 노드) |
| 타입 | `src/types/stack-nodes.ts`, `src/types/index.ts` |
| 테마 | `src/remotion/common/theme.ts` (StylePack + Typography + Ambient) |
| 자막바 | `src/remotion/common/SubtitleBar.tsx` |
| 배경 | `src/remotion/common/AmbientBackground.tsx` (noise-glow 등 4 프리셋) |

## 출력

| 항목 | 경로 |
|------|------|
| 렌더링 결과 | `output/{projectId}.mp4` |
| 프로젝트 데이터 | `data/{projectId}/scenes-v2.json`, `render-props-v2.json` |
| 정적 파일 | `public/` (오디오, 이미지 등 Remotion staticFile용) |

## 렌더 명령어

```bash
npx remotion render MainComposition output/{name}.mp4 \
  --props=data/{projectId}/render-props-v2.json --concurrency=4
```

## 디자인 시스템 (Video Design OS v1)

### 타이포 스케일 (Major Third 1.25, base=28)

| Role | 크기 | 용도 |
|------|------|------|
| stat | 107px | ImpactStat 거대 숫자 |
| display | 68px | 히어로 타이틀 |
| headline | 55px | 씬 제목 |
| subhead | 35px | Kicker |
| body | 28px | 본문 |
| caption | 22px | 하단 캡션 |
| label | 18px | Badge, Pill |

StylePack별 폰트: dark-neon(Space Grotesk/DM Sans), editorial(Cormorant/Baskerville), documentary(Lora/Raleway), clean-enterprise(Lexend/Source Sans 3)

### 앰비언트 배경 (scene.background 없을 때)

| StylePack | 프리셋 | 효과 |
|-----------|--------|------|
| dark-neon | noise-glow | 바이올렛 글로우 블룸 + 노이즈 그레인 |
| editorial | paper | 따뜻한 종이 텍스처 + 비네팅 |
| documentary | film-grain | 필름 그레인 + 앰버 오버레이 |
| clean-enterprise | gradient-mesh | 부드러운 메시 그라데이션 |

### Anti-Slop 규칙 (taste-skill 기반)

- 순수 검정 `#000000` 금지 → `#08060D` (다크 바이올렛 틴트)
- Inter 폰트 금지 → Space Grotesk / DM Sans
- Equal-weight 그리드 금지 → 최소 1개 항목이 dominant
- 뻔한 수치(99.9%, 50%) 금지 → 나레이션 원본 수치 그대로
- 장식용 에셋 삽입 금지 → 에셋은 관계 강화용으로만

## 핵심 제약

- `remotion.config.ts` 포트 설정 주석 처리됨 (Next.js 충돌 방지)
- SceneRoot `alignItems: "center"` 유지 (stretch 시 inline-block 깨짐)
- Stack/Grid/Split 컨테이너는 `width: "100%"` 필수
- subtitle-based enterAt 제거됨 — stack_root JSON의 명시적 enterAt 사용
- **InsightTile 노드 사용 금지** — 렌더링 결과가 빈 사각형

## 장면 조립 수칙 (필독)

씬을 만들기 전 반드시 [.Codex/rules/scene-grammar.md](.Codex/rules/scene-grammar.md) Read.
DSL 4가지 작동 조건, Phase A/B 강제, vg-preview-still 자가 검증 포함.

## 소통

- 한글 존댓말로 소통할 것
