# Handoff R7 — 원칙 A 채택 + 20씬 TSX 전환 + 원칙 C 로드맵

> **세션 컨텍스트:** R5(50%) → R6(95%, ε 실험 4/4 압승) 이후, 오른쪽 페인 R6 답신에서 "Hybrid 무게중심 역전" 요구. 원칙 A(TSX 기본값+DSL 좁은 예외), B(DSL 노드 library import), C(validator TSX AST 이식) 채택.

---

## 1. 즉시 처리 사항

| 구분 | 내용 | 상태 |
|------|------|------|
| 원칙 A 수용 | "TSX 기본값 + DSL 3조건 동시 만족 시만 예외" | ✅ 채택 |
| 원칙 B 실험 | DSL 노드 library import adapter | ⚠️ 스케치만 (D+3 예정) |
| 원칙 C 로드맵 | `docs/roadmap-tsx-ast-validators.md` | ✅ 작성 완료 |
| 추가 10씬 TSX | scene-0/1/5/10/16/25/30/40/52/70 | ✅ 20씬 달성 |
| R7 비디오 의미 매칭 재검증 | aesthetic-only 배경 제거 | ✅ TSX 에 비디오 최소화. scene-22(laptop), scene-03(terminal) 만 의미 매칭 차원에서 사용 |

---

## 2. 20씬 TSX 전환 리스트 (25.6% coverage, 20/78)

| 씬 | 의도/감정 | 대표 비주얼 언어 |
|----|----------|----------------|
| 00 | 오프닝 방송 브랜드 | VIBENEWS 거대 그라디언트 타이포 + 달리는 광선 |
| 01 | 4개 뉴스 예고 | 카드 교차 레이아웃 (row/row-reverse) |
| 03 | 뉴스 1 선언 / 분노 | 빨간 섹션 바 + 타자기 + 터미널 EXHAUSTED |
| 05 | Max 10 플랜 · 10% 소멸 | 플랜 카드 + 토큰 게이지 heartbeat |
| 08 | 19분 극단값 | 560px 거대 숫자 + 5시간↔19분 게이지 |
| 10 | 이벤트 종료 원인 | 3월↔4월 영역 그래프 경계 컷 |
| 14 | 10x→20x 폭증 | 스파이크 차트 + 도약 화살표 |
| 16 | 소스코드 유출 | diff 블록 + 온도 게이지 lukewarm |
| 22 | 맥북↔클라우드 대결 | 좌우 분할 (mint WINS ↔ 회색 퇴색) |
| 23 | Gemma 4 공개 | 구글 4색 그라디언트 + APR 02 스탬프 |
| 25 | 4 모델 크기 | 뇌 네트워크 4개 (크기 비례) |
| 30 | 75,000 별 | 카운트업 + 떨어지는 별 파티클 |
| 40 | Claude Code 대화 플로우 | 말풍선 교차 + 터미널 사고중 |
| 42 | /ultraplan 커맨드 | macOS 터미널 창 + 패킷 비행 |
| 50 | AI 자동화 비전 | 상하 2분할 + 에이전트 체크리스트 |
| 52 | GPT6 4월 14일 D-Day | 달력 + 동그라미 draw + D-7 |
| 60 | OpenAI 시장 압박 | 로고 회전 + 경쟁사 스택 + pressure 게이지 |
| 69 | 수첩 vs 노트북 비유 | 베이지 종이 + 손글씨 vs 터미널 |
| 70 | 도구 기하급수 | 시간축 확산 노드 네트워크 |
| 77 | 엔딩 사인오프 | 필기 SVG path draw + 떨어지는 별 + breathing |

---

## 3. 원칙 A 3조건 재확인 + 나머지 58씬 분류

**DSL 예외 허용 조건 (동시 만족):**
1. narration 이 순수 데이터 제시 의도
2. 같은 DSL pattern 이 프로젝트 내 다른 씬에서 쓰인 적 없음
3. 감정 비트 없음 (승부/대비/전환/엔딩이 아님)

나머지 58씬 중 TSX 필수 예상 (조건 미달):
- 모든 뉴스 섹션 전환 (이미 03/22/52 처리. 섹션 내부 "본론" 씬도 감정 비트 강함)
- 예: scene-7/9/11/12/17/19/21 등 불만/충격/피로 씬 → TSX
- 데이터 테이블/순수 열거 씬 (예: Gemma 라이선스 나열) → DSL 유지 가능

대략 **30~40씬 추가 TSX 전환 예상** (최종 65~75% TSX). 나머지 10~15씬만 DSL.

---

## 4. 원칙 C 로드맵 요약 (세부: `docs/roadmap-tsx-ast-validators.md`)

| D+N | 이식 대상 | 산출물 |
|-----|----------|--------|
| D+1 | P4 shape cluster → JSX tag sequence | `validate-tsx-structural-signature.js` |
| D+2 | node-count → JSX semantic element count | `validate-tsx-semantic-count.js` |
| D+3 | P3 dedup → JSX string literal scan | `validate-tsx-text-dedup.js` |
| D+5 | postprocess.sh 분기 | TSX wrapper 감지 시 TSX validator 호출 |
| D+7 | DSL 전용 validator 에 SOFT:skip gate | TSX 씬은 skip |
| D+14 | scene-grammar v1.4 | 원칙 A/B/C 명시 |

**폐기 후보**: `validate-tsx-escape.js`, `validate-background-coverage.js`, pattern picker 가드 전부.

---

## 5. 원칙 B adapter 스케치 (D+3 정식 구현 예정)

```tsx
// src/remotion/custom/_dsl.ts
import { NODE_REGISTRY } from "../nodes/registry";

export const D = (type: string, data?: any) => (frame: number, dur: number) => {
  const Comp = NODE_REGISTRY[type];
  return Comp ? <Comp node={{id:`dsl-${type}`, type, data}} frame={frame} durationFrames={dur}/> : null;
};
```

이로써 74 노드 자산 보존 + JSX 자유도 동시 확보.

---

## 6. 재측정 전망 (D+5 후 재 audit)

- subtitle-dedup 14건 → TSX 전환 씬에서 구조적 소멸 (scene-77 "다음에 또 만나요" 이미 해소)
- trio:RingChartx3 × 4 → scene-5/22/60/70 전부 TSX → **예상 0건**
- shape cluster 반복 → TSX 씬은 각자 고유 JSX → **예상 급감**
- P7 near-empty → TSX 씬은 rich DOM, mask 카운트 증가 → 통과율 증가 예상

---

## 7. 산출물

| 경로 | 내용 |
|------|------|
| `src/remotion/custom/*.tsx` | 20 custom 컴포넌트 |
| `src/remotion/custom/registry.ts` | CUSTOM_COMPONENTS 맵 |
| `src/remotion/nodes/tsx-escape.tsx` | TSXEscapeRenderer |
| `src/remotion/nodes/registry.ts` | TSX 타입 등록 |
| `scripts/render-single-scene.sh` | TransitionSeries 격리 렌더 |
| `output/preview/vibe-news-0407-tsx/*.png` | 20 PNG 결과물 |
| `docs/roadmap-tsx-ast-validators.md` | 원칙 C 로드맵 |
| `data/vibe-news-0407/scenes-v2.json` | 20씬 TSX wrapper. 원본은 `_stack_root_dsl_backup` 에 보존 |

---

## 8. 남은 1%p (95→100%) 돌파 조건 (R7 답신 기준)

- 나머지 58씬 중 30~40씬 TSX 전환 완료 (최종 65~75% coverage)
- validator 이식 완료 (D+14)
- trio / subtitle-dedup / shape cluster 0건 재확인
- 비디오 배경 의미 매칭 — scene-22 laptop 은 narration 연결 OK. 남은 DSL 씬에서 aesthetic-only 비디오 제거

---

**평가 요청:** Round 7 만족도 / 원칙 A 3조건 완화 금지 재확인 / 원칙 C 로드맵 승인 / 나머지 58씬 TSX 전환 우선순위 지침 / 최종 TSX coverage 목표(% ?).
