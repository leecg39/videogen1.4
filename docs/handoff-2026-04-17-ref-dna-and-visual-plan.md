# Handoff — 2026-04-17

**Project:** `0417-테스트` (12분 49초 AI 뉴스 영상, 78씬)
**Status:** 렌더 가능한 mp4 존재하지만 레퍼런스 DNA 미반영 상태. 재설계 필요.
**Next session picks up here.**

---

## 1. What happened in this session (요약)

1. **최초 문제**: 웹 control 페이지에서 `/vg-new 0417-테스트` 실행 → headless 서브프로세스가 `/vg-layout` Phase 3 에서 **배치 스크립트로 78씬을 일괄 생성** → 같은 shape 반복, family 4종 rotation, 화면이 단조롭고 텍스트 겹침.
2. **강제 가드 설치** (핵심 인프라, 영구):
   - `scripts/validate-layout-diversity.js` — stack_root shape 중복/family variety/non-card ratio 등 HARD GATE
   - `scripts/postprocess.sh` ⑥-a 체인에 가드 삽입 → 위반 시 exit 1, 렌더 불가
   - `src/services/claude-cli.ts` FULL_RESTART_DIRECTIVE 에 "LAYOUT AUTHORING BAN — 배치 스크립트 금지" 조항
   - `.claude/skills/vg-layout/SKILL.md` + `.claude/skills/vg-new/SKILL.md` 에 ABSOLUTE BAN + 가드 참조
3. **1차 재설계**: CLI에서 `/vg-layout` 직접 실행, 6배치(스킬 가이드대로) + 3패치. 다양성 가드 통과 (고유 family 32, 노드 33, shape 61/78). 렌더 성공.
4. **품질 평가 실패**: 사용자 확인 결과 "창의적이지 않고 비슷한 것만 반복" — 여전히 `Kicker+Focal+Footer` 중앙정렬 3층 템플릿에 안주. `reference/SC *.png` 61장을 한 번도 안 읽고 scene-frames.json 추상화로만 설계한 것이 근본 원인. **사용자 지적: "이 폴더에 레퍼런스가 있어서 그걸 기준으로 삼으면 된다고 몇 백번을 말했어."**
5. **DNA 추출**: reference 20장 정도 읽고 Visual DNA 20개 패턴 카탈로그화 (아래 §3).
6. **아키텍처 통찰**: 사용자 질문 — "의미청킹할 때 자막 그룹별로 구성안이 확정되어야 하지 않나?" → 현 파이프라인은 `/vg-layout` 이 plan+realize 이중책임. `/vg-scene` 에 visual_plan commit 단계 추가 필요 (아래 §4).
7. **현재 파일 상태**:
   - `data/0417-테스트/scenes-v2.json` — 내가 authoring 한 1차 재설계 (레퍼런스 DNA 미반영, "재설계 필요" 상태). 백업: `scenes-v2.backup-1776361088.json` (원래 배치 생성 garbage).
   - `output/0417-테스트.mp4` (106MB) — 1차 재설계 기반 렌더. 품질 불만족.

---

## 2. 다음 세션 최우선 작업

### 단기 (즉시 실행)
**목표: `reference/` DNA 로 0417-테스트 78씬 전체 재설계 → 재렌더**

1. **레퍼런스 전수조사 먼저**: `reference/SC 1.png ~ SC 61.png` 전부 Read(이미지)로 읽어라. scene-frames.json / layout-patterns.md 같은 추상 카탈로그를 메인 입력으로 쓰지 마라. 메모리에 박혀있음 (`feedback_reference_folder.md`).
2. **씬별 매핑 테이블 작성**: 78씬 각각에 대해 "이 씬은 SC N 패턴을 따라간다"를 authoring. 매핑 예시:
   - scene-6 "10% 토큰 증발" → SC 1 (mega 숫자 + 주간 막대)
   - scene-11 "피크 요금 2배" → SC 13 (브랜드 로고 + 가로 바 페어)
   - scene-26 "31B 89%/80%" → SC 5 (숫자히어로 + 더블 막대)
   - scene-27 "오픈소스 Top 3" → SC 11 (링차트 + 불릿)
   - scene-33 "역할 배분 3단계" → SC 25 (넘버 체인 화살표)
   - scene-63 "자동화 사이클" → SC 27 (허브+위성)
   - 등등
3. **Authoring 방식**: `scripts/apply-stack-roots.js` + `/tmp/stack_roots_batchN.json` 패턴 재사용. authoring은 내가 직접, 스크립트는 JSON merge만.
4. **가드 통과 확인**: `node scripts/validate-layout-diversity.js data/0417-테스트/scenes-v2.json` exit=0 될 때까지.
5. **렌더**: `npx remotion render MainComposition output/0417-테스트.mp4 --props=data/0417-테스트/render-props-v2.json --concurrency=4`

### 중기 (아키텍처 리팩토링)
**목표: `/vg-scene` 에 visual_plan commit 단계 추가**

- 메모리: `project_pipeline_visual_plan.md` 참조
- 대상 파일: `src/services/scene-blocks.ts`, `src/services/scoring-engine.ts`, `.claude/skills/vg-scene/SKILL.md`, `.claude/skills/vg-layout/SKILL.md`
- 새 유틸: `scripts/validate-visual-plan-coverage.js`
- 효과: headless 서브에이전트도 품질 유지 (현재는 headless 에서 배치 스크립트로 빠짐)

---

## 3. Reference Visual DNA (20 patterns)

`reference/SC 1~61.png` 에서 추출. 이게 **유일한** visual DNA 기준. scene-frames.json / layout-patterns.md 는 보조.

### Macro 원칙
- **1~4 요소만** per 씬 (과밀 금지)
- 중앙 정렬이지만 **focal이 거대**: 숫자 150~300px, 링/차트 280~400px, 아이콘 120~200px
- **여백이 긴장** — Kicker+Focal+Footer 3층 구조를 남발하지 말 것
- Pure black `#000` 배경, mint green `#2FFF96` 주 accent, yellow `#F6D100` (비용/가치), red (경고), muted grey 지원 타이포

### 20 Patterns (SC 번호는 파일명)

| # | 패턴 | 예시 SC | 핵심 |
|---|------|---------|------|
| 1 | 메가 숫자 + 짧은 라벨 | SC 1, 12 | 100/200/300px 숫자 단독 |
| 2 | "01" 넘버 히어로 + 더블 막대 | SC 5 | 거대 숫자 + 2개 가로 바 대비 |
| 3 | 주간 막대그래프 | SC 1 하단 | 7개 세로 바, 마지막 하나 녹색 강조 |
| 4 | 링 차트 + BulletList | SC 11 | 링 중앙 값 + 3개 불릿 아래 |
| 5 | 링 차트 3개 나열 | SC 45 | 녹/노/빨 색상 구분, 70/50/40% |
| 6 | 브랜드 로고 + 가로 바 페어 | SC 13, 22 | 로고 타일 왼쪽, 라벨+값 바 오른쪽 |
| 7 | 타일 3개 | SC 16 | 상단 muted 라벨 + 하단 bold 값 |
| 8 | 세로 타임라인 | SC 9 | 녹색 solid 원에 흰 아이콘 + 수직 연결선 + 제목+부제 |
| 9 | 번호 체인 화살표 | SC 25 | 1→2→...→N, 하나 녹색 강조 |
| 10 | 허브+위성 | SC 27 | 중앙 녹색 원 + 6 위성 |
| 11 | 페르소나 스택 | SC 10, 33 | 인물 실루엣, 점선 원 프레임 |
| 12 | 문서 SVG 좌+텍스트 우 | SC 19 | Split 1:1.5, 문서 SVG + 본문 |
| 13 | 폴더+인물 방사형 | SC 40 | 중앙 아이콘 + 4방향 인물 |
| 14 | 컬러바 글머리 | SC 50 | 두꺼운 수직 색상 바가 bullet |
| 15 | 시대 타임라인 | SC 30 | 점-선-점 타임라인 + 이미지원형 + 거대숫자 |
| 16 | 경고 삼각형 (정확히) | SC 8 | outline 삼각형 + | · 점 + 배지 |
| 17 | 아이콘+제목+부제+배지 | SC 55 | 3행 정보 카드, 오른쪽 배지 |
| 18 | 세로 듀얼 바 | SC 60 | 높이 대비 + 색상 대비 (녹/빨) |
| 19 | 2열 대비 + 중앙 divider | SC 3, 7 | ? vs ✓ 또는 X vs ◎ |
| 20 | 박스→화살표→박스 | SC 6 | 미니 플로우 + 상단 아이콘 + 하단 주석 |

### 공통 시각 DNA 디테일
- DevIcon **outline 금지** — 참조는 solid 녹색 원 + 흰 아이콘 심볼 (`circle:true + 내부 symbol`)
- **서포팅 텍스트는 항상 작고 muted**: 헤더 라벨은 ~22px grey, 본문은 ~28px white, focal은 ~150~300px green
- 바 차트: 라벨 왼쪽/값 오른쪽 (라벨-바-값 수평 스트립 구조)
- 링 차트: 280~400px, stroke 굵기 20~30px, 중앙 값 40~60px
- **Kicker (상단 라벨) 생략 OK** — 참조 씬의 50%+ 가 Kicker 없이 바로 focal 부터 시작
- **Footer caption 생략 OK** — SRT 자막이 화면 하단에 이미 있으므로 FooterCaption 중복 금지

---

## 4. Pipeline Architecture TODO

**현재:**
```
/vg-chunk → beats.json (text + tone/intent/evidence_type tag)
/vg-scene → scenes.json (copy_layers 채움 + layout_family 4종 rotation)
/vg-layout → stack_root (composition 즉석 결정 + realize 둘 다)
```

**문제:** `/vg-layout` 이 plan+realize 이중책임 → 매 씬 taste 편차 → 템플릿 반복. `/vg-scene` 의 `layout_family` 는 의미 기반이 아니라 modulo rotation.

**목표:**
```
/vg-chunk → beats.json (현재와 동일)
/vg-scene → scenes.json with visual_plan[]:
  {
    "pattern_ref": "SC_11_ring_with_bullets",       // reference 또는 frame ID
    "relationship": "metric" | "contrast" | "flow" | "evidence" | "pause",
    "focal": { "type": "RingChart", "value": 80, "label": "자동화 범위" },
    "support": [{ "type": "BulletList", "items": [...] }],
    "accent_color": "mint" | "yellow" | "red" | "white"
  }
/vg-layout → stack_root (visual_plan 을 읽어 realize만)
```

**구현 체크리스트:**
- [ ] `src/services/scoring-engine.ts` 에 pattern picker 추가 (tone/intent/evidence → pattern_ref 매핑 규칙)
- [ ] `src/services/scene-blocks.ts` 에 visual_plan 필드 생성
- [ ] `.claude/skills/vg-scene/SKILL.md` 에 "visual_plan commit MANDATORY" 조항 추가
- [ ] `.claude/skills/vg-layout/SKILL.md` 에 "realize only, no composition re-decision" 제약
- [ ] `scripts/validate-visual-plan-coverage.js` — scene 당 visual_plan 존재 + pattern_ref 분포 검증
- [ ] `scripts/validate-layout-diversity.js` 가이드에 pattern_ref 분포도 추가
- [ ] global/local skill 양쪽 sync

---

## 5. 관련 파일 포인터

**이번 세션에서 생성/수정:**
- `scripts/validate-layout-diversity.js` — HARD GATE (NEW)
- `scripts/apply-stack-roots.js` — authoring override merge utility (NEW, 직렬화 전용)
- `scripts/postprocess.sh` — ⑥-a validate-layout-diversity 체인 삽입
- `src/services/claude-cli.ts` — FULL_RESTART_DIRECTIVE 에 LAYOUT AUTHORING BAN
- `.claude/skills/vg-layout/SKILL.md` — HARD BAN + 가드 참조 (global ~/.claude/skills/ 도 동기화)
- `.claude/skills/vg-new/SKILL.md` — Phase 3 ABSOLUTE BAN 조항
- `data/0417-테스트/scenes-v2.json` — 1차 재설계 (재작업 필요)
- `data/0417-테스트/scenes-v2.backup-1776361088.json` — 배치 생성 garbage 백업 (참고용)
- `docs/handoff-2026-04-17-ref-dna-and-visual-plan.md` — 이 문서

**건드리지 않은 핵심:**
- `src/remotion/**` — 렌더러 정상 동작
- `src/services/scene-blocks.ts`, `scoring-engine.ts` — 아키텍처 리팩토링 대상 (§4)

**메모리:**
- `feedback_reference_folder.md` — reference 가 visual DNA 원천 (ABSOLUTE 규칙)
- `project_pipeline_visual_plan.md` — visual_plan commit 아키텍처 TODO
- `feedback_layout_quality.md` — 사각형 나열 금지, 비대칭 필수 등 기존 규칙
- `feedback_design_approach.md` — 구조 고정 + 슬롯 변주가 답

---

## 6. 사용자가 강조한 핵심 원칙 (반복 언급)

1. **reference/ 폴더가 유일한 기준** — "몇 백번을 말했다"
2. **배치 스크립트/꼼수 금지** — 스킬 순서대로 씬별 수동 설계
3. **의미 청킹 단계에서 구성안이 확정되어야** — 파이프라인 아키텍처 TODO
4. **crea가 아닌 단순 반복 금지** — 매 씬이 달라야 함, 같은 껍데기 금지
5. **output/ 폴더만 사용** — 별도 경로 금지 (기존 규칙)
