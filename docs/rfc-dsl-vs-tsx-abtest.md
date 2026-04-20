# RFC — DSL vs TSX A/B 실험 결과 (ε Round 6, 2026-04-19)

> **맥락:** R5 답신(오른쪽 페인)에서 "78씬 100% 동일 골격 + 비디오 배경 의미 단절 + DSL 탈출 실패" 3대 지적. R6 Option ε — 10씬 HTML+GSAP 직접 작성(Remotion 호환 TSX escape) 실험.
> **목표:** A(기존 DSL) vs B(TSX 직접 작성) 육안/구조 비교로 DSL 방식의 유지/폐기 판단 근거 확보.

---

## 1. 실행 요약

| 작업 | 결과 |
|------|------|
| TSX escape runtime 구축 | `src/remotion/nodes/tsx-escape.tsx` + `src/remotion/custom/registry.ts` 신설 |
| registry.ts 에 `TSX` 타입 등록 | ✅ `NODE_REGISTRY.TSX = TSXEscapeRenderer` |
| 10씬 custom 컴포넌트 작성 | `src/remotion/custom/scene-{03,08,14,22,23,42,50,60,69,77}.tsx` |
| scenes-v2.json 10씬 stack_root 교체 | `{type:"SceneRoot", children:[{type:"TSX", data:{component:"scene-XX"}}]}` |
| 단일 씬 격리 렌더 도구 | `scripts/render-single-scene.sh` (MainComposition subset props 방식) |
| B-set PNG 10장 | `output/preview/vibe-news-0407-tsx/scene-{03..77}.png` |
| A-set PNG (대조군) | `output/preview/vibe-news-0407-v2/` (기존 DSL 78장 중 10장) |
| TypeScript 검증 | custom/ 디렉토리 TS 에러 0 |

---

## 2. 10씬 의도 설계 (narration → 감정/핵심 메시지)

| 씬 | narration 핵심 | 설계 의도 | 시각 언어 |
|----|---------------|----------|----------|
| 03 | "뉴스 1: 클로드 코드 사용량 바닥" | **분노/경고 선언** | 좌측 빨간 섹션 바 + 타자기 헤드라인 + 터미널 프롬프트 `$ claude --usage EXHAUSTED` |
| 08 | "19분 만에 한도 바닥" | **극단값 충격** | 중앙 거대 `19분` (560px) + 우측 프로그레스 바 비교 (5시간 vs 19분) + 시계 바늘 배경 |
| 14 | "10배→20배 폭증" | **시스템 폭주 공포** | 배경 스파이크 차트 + `10×` → `20×` 도약 + 그라디언트 화살표 |
| 22 | "맥북이 클라우드를 이겼다" | **승리의 선언** | 좌측 맥북(mint WINS) ↔ 우측 회색 클라우드 타워(퇴색). 중앙 네온 경계선 |
| 23 | "Gemma 4 공개" | **제품 announcement** | 상단 날짜 스탬프 "APR 02" + 중앙 360px 구글 브랜드 그라디언트 타이포 + 하단 3 속성 카드 |
| 42 | "/ultraplan 커맨드" | **명령 구문 강조** | macOS 터미널 창 (red/yellow/green dots) + 타이핑 애니 + "로컬→클라우드" 패킷 비행 |
| 50 | "AI 혼자 설계, 사람은 다른 일" | **자동화 비전** | 상단 AI 에이전트 체크리스트 (5 task done) + 하단 사람 영역 + 가로 ticker 30분 카운트 |
| 60 | "OpenAI 압박 · Sora 포기" | **시장 긴장** | 좌측 OpenAI 로고 spin + 우측 경쟁사 스택 (Claude/Gemma/GitHub) + 하단 pressure 게이지 |
| 69 | "수첩 vs 컴퓨터" 비유 | **철학적 비유** | 베이지 종이 질감 + 좌측 링제본 수첩(손글씨) ↔ 우측 다크 노트북(터미널) + 중앙 스윙 화살표 |
| 77 | "다음에 또 만나요" | **마무리/침묵** | 극미니멀. SVG 필기 사인 path draw + 떨어지는 별 + 호흡 같은 breathing scale |

---

## 3. 정량 비교

| 지표 | A (DSL) | B (TSX) |
|------|---------|---------|
| 각 씬 DOM 구조 고유성 | 78씬 중 **첫 자식 Absolute>VideoClip 100% 동일** | 10씬 모두 **완전히 다른 JSX 트리** |
| pattern_ref 반복 | `P05_ring_triplet` × 4 (5/22/60/70 쌍둥이) | 0 — 각 씬 unique component |
| 노드 슬롯 고정 | Kicker/Split/BulletList/FooterCaption 조합 찍기 | 씬별 의미 기반 element (터미널 창, 수첩, SVG sign, pressure gauge ...) |
| 배경-내용 의미 결합 | 키워드 표층 매칭 (방송 스튜디오 ↔ 로컬 AI 등 단절) | narration 주제 → 비주얼 메타포 직접 설계 |
| 모션 자유도 | 프리셋 enterAt/duration 조합 | interpolate/spring 으로 씬별 고유 모션 (sora-slash draw, signature path draw, stat shrink, spike enter) |
| 코드 라인 수 | stack_root JSON ~50-80 lines/씬 | TSX ~70-110 lines/씬 (대신 고유 표현 자유도 획득) |

---

## 4. 육안 판단 포인트 (A vs B)

**A (DSL, 기존):**
- scene-22 배경: laptop-coding.mp4 풀스크린 블러 + Kicker+Split+BulletList 찍기
- scene-77 배경: news-broadcast-studio-dark.mp4 + "다음에 또 만나요 · 랩장" 노드 (자막 중복 sim=0.778)
- scene-60 배경: AI-technology.mp4 + Ring triplet — OpenAI 의미 전달 약함

**B (TSX, ε):**
- scene-22: 좌우 대조적 무대 자체가 "이겼다" 메시지를 공간으로 표현. 배경 laptop 영상은 맥북 쪽에만 노출, 클라우드 쪽은 퇴색 SVG 타워
- scene-77: 배경 영상 없음 · 필기 사인 SVG path draw + 떨어지는 별의 마무리 호흡감
- scene-60: OpenAI 로고 회전 + 경쟁사 압박 스택 + pressure 게이지 80%. 시장 긴장을 게이지로 구현

---

## 5. 결론 제안 (편집자 판단)

| 판단 | 근거 |
|------|------|
| **ε 실험 검증됨** — DSL 탈출 가능 구조 확보 | TSX escape runtime + single-scene render 파이프라인 작동. 10씬 모두 렌더 성공, TS 에러 0 |
| **DSL 전면 폐기는 아직 일러** | 정보 밀도 씬(CompareBars / DataTable 등)에서 DSL 이 빠르고 일관됨. 모든 씬 TSX 작성은 인력 비용 과다 |
| **Hybrid 채택 권고** | "감정·선언·전환·엔딩" 씬 (15~25% 비율) 은 TSX escape, 나머지 "정보 열거" 씬은 DSL. scene-grammar.md v1.3 에 명시 |
| **우선 확장 대상** | 뉴스 섹션 heading (N1/N2/N3/N4 introduction), closing 씬, 극단 값 stat 씬, 두 세계 대조 씬 |

---

## 6. 팔로업 액션

1. **scene-grammar v1.3**: "TSX escape 의무 카테고리" 정의 (emotional / declarative / transition 씬)
2. **vg-scene API 수정**: pattern-picker 가 특정 카테고리에 `{type:"TSX"}` stack_root 를 자동 생성
3. **validate-tsx-escape.js** 구현: TSX escape 씬은 rendered-node-presence 측정 방식 다르게 적용 (단일 TSX = 컴포넌트 수 많음)
4. **나머지 68씬 재authoring**: B 품질로 수렴하려면 추가 30~40씬을 TSX 로 작성 + DSL 잔여 씬은 정보 열거 전담

---

## 7. 파일 경로 색인

| 유형 | 경로 |
|------|------|
| 이 RFC | `docs/rfc-dsl-vs-tsx-abtest.md` |
| Runtime | `src/remotion/nodes/tsx-escape.tsx`, `src/remotion/custom/registry.ts` |
| 10 커스텀 컴포넌트 | `src/remotion/custom/scene-{03,08,14,22,23,42,50,60,69,77}.tsx` |
| A-set (DSL 대조) | `output/preview/vibe-news-0407-v2/scene-{03,08,14,22,23,42,50,60,69,77}.png` |
| B-set (TSX 실험) | `output/preview/vibe-news-0407-tsx/scene-{03..77}.png` |
| 렌더 도구 | `scripts/render-single-scene.sh` |
| scenes-v2 (TSX 주입) | `data/vibe-news-0407/scenes-v2.json` — 10씬은 `_stack_root_dsl_backup` 에 원본 DSL 보존 |
| R5 핸드오프 | `docs/handoff-2026-04-19-skill-hardening-R5-pngs.md` |

---

**평가 요청:** Round 6 (ε) 만족도 / OK / 보완 / Hybrid 채택 여부 / DSL 전면 폐기 여부.
