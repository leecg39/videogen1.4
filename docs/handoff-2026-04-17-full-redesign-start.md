# Handoff — 2026-04-17 · 0417-테스트 철저 재설계 시작

**Status:** 인프라는 완성, 0417-테스트 authored stack_root 는 **대부분 폐기 대상**.
사용자 지시: "철저히 재설계하라."

---

## 1. 사용자 최종 피드백 (직인용, 반복 금지 사항)

1. **"바차트 졸라 자주 쓰지 마라"** — CompareBars 뿐 아니라 가로 바 형태(ProgressBar, DataTable rows, VerticalBars 도배) 전반. 시각적 바 반복 = 실패.
2. **"매번 같은 삼각형 경고"** — scene_039 같이 narration 무관한 SvgGraphic warning triangle 이 realizer fallback 으로 반복됨. 컨텍스트 맞지 않으면 넣지 마라.
3. **"레퍼런스 따라 만들라고 했더니 따라하지도 못함"** — reference/SC 60장이 유일 DNA. 추상 카탈로그 대체 금지.
4. **"결과 분석 안 한다"** — 스크립트 돌리고 가드 통과 선언 = 시각 검증 아님. 생성된 프레임 전수 확인 없이 성공 주장 금지.
5. **"픽셀 좌표계 쓴다고 했는데 달라진 게 없음"** — Absolute/FreeText 프리미티브 만들어놓고 실제 씬에는 안 썼다. 실제 적용 없이 "인프라 추가" 자랑 금지.
6. **"균형이 맞지 않는다" (scene_001)** — 상단으로 치우친 content + 하단 40% 공백. 수직 center 미작동 조사 필요.

---

## 2. 현재 상태 (정확히)

### 2-1. **쓸 수 있는 인프라 (유지)**

| 항목 | 파일 | 상태 |
|------|------|------|
| mint palette 고정 | `src/remotion/common/theme.ts` — SCENE_PALETTES[0] = Reference Mint (#39FF14), 로테이션 제거 | ✅ |
| DevIcon 다크 반전 | `src/remotion/nodes/dev-icon.tsx` — DARK_ICONS 자동 `brightness(0) invert(1)` | ✅ |
| 40 패턴 카탈로그 | `src/services/pattern-catalog.ts` — P01~P40 | ✅ |
| pattern-picker + fidelity | `src/services/pattern-picker.ts` — mint 기본, yellow/red 하드 쿼터, mega 페널티 | ✅ |
| 5 신규 프리미티브 | `src/remotion/nodes/diversity-primitives.tsx` — BrowserMockup, EmojiIconList, BrandSatellite, VerticalBars, DiagonalFlow | ✅ |
| FreeText + Absolute | `src/remotion/nodes/freeform.tsx` | ✅ |
| HARD GATEs | `scripts/validate-visual-plan-coverage.js` · `validate-layout-diversity.js` · `validate-fidelity.js` | ✅ |
| postprocess 체인 | `scripts/postprocess.sh` — ⑥-0 coverage / ⑥-a diversity / ⑥-b density / ⑥-c fidelity / ⑧ sync-render-props | ✅ |
| dual-file sync | `sync-render-props.js` → 자동 호출됨 | ✅ |
| VisualPlan 타입 | `src/types/index.ts` — direction/typo/density 필드 포함 | ✅ |
| SKILL 업데이트 | `.claude/skills/vg-layout/SKILL.md` + global sync — 🟢 REFERENCE FIDELITY HARD GATE 블록 | ✅ |

### 2-2. **폐기 대상 (재설계 필요)**

| 파일 | 상태 |
|------|------|
| `data/0417-테스트/scenes-v2.json` stack_roots | 78 씬 중 대부분 엉망. mass realizer 가 만든 템플릿 + 과거 배치 씬이 섞여 있음. 폐기하고 처음부터. |
| `output/0417-테스트.mp4` (현재 115MB) | 기준 미달. 재렌더 후 덮어쓰기. |
| `output/full-frames/scene_*.png` 78장 | 대부분 실패 샘플. 다음 세션에 검수 기준 아님. |

### 2-3. **알려진 실패 패턴 (다음 세션이 반복 금지)**

A) **Mass realizer 금지** — `/tmp/realize_from_plan.py`, `/tmp/diversify_bars.py`, `/tmp/apply-stack-roots.js` 같은 일괄 생성 금지. 이번 세션에 이것들로 46씬을 한번에 재생성했더니 11씬 같은 shape, 컨텍스트 미스매치(scene_039 "현실적으로" 삼각형) 발생.

B) **통계적 pass ≠ 시각 pass** — `validate-fidelity.js` 통과해도 프레임 안 봄. 반드시 Read 로 최소 20장 직접 검수.

C) **SvgGraphic 도배** — realizer fallback 에 "warning triangle" 기본값. narration 에 경고/위험 의미 없으면 넣지 마라. 실제 SvgGraphic 가 어울리는 씬은 P16_warning_triangle 뿐.

D) **Kicker + Badge 중복 phrase** — extract_phrases()[0] 를 여러 노드에 동시 사용 → "현실적으로" 가 kicker 와 badge 에 중복. 각 노드는 서로 다른 phrase 사용 OR Badge 없앨 것.

E) **수직 center 미작동** — scene_001 content 가 상단으로 쏠림. `SceneRoot { justify:center }` 인데도 미작동. 원인 조사 필요 (SceneShell padding? ambient 배경?). 

F) **"한 번 렌더 · 한 번 검수 · 한 번 수정" 를 모든 씬에 적용** — 지금까지 10 씬만 샘플 보고 "다 됐다" 선언 반복. 78/78 전수 확인 필수.

---

## 3. 다음 세션 작업 플랜 (REQUIRED 순서)

### Phase A — 진단 (1시간)

1. 세션 시작 즉시 이 핸드오프 + 메모리 `MEMORY.md` 읽기
2. `reference/SC 1~61.png` 중 **미확인** 것 전부 이미지 Read (전 세션에서 약 50장 확인)
3. `output/full-frames/scene_001~078.png` **전수 Read**, 각 씬별로 1줄 진단 테이블 작성 — e.g.:
   - `scene_001: top-heavy, bar 4행 + wordmark / SC1 대비 간결성 부족 / 재설계`
4. 실패 유형 분류:
   - [BAR_DUP] 바 형태 노드 2개 이상 (CompareBars/ProgressBar/DataTable/VerticalBars 중복)
   - [NARR_MISS] narration 과 시각 미스매치 (예: 경고 삼각형 엉뚱한 위치)
   - [DUP_PHRASE] 같은 단어 여러 노드 중복
   - [TOP_HEAVY] 수직 center 미작동, 상단 쏠림
   - [EMPTY_ICON] ImageAsset 경로 깨짐 또는 placeholder circle
   - [OK] 그대로 유지

### Phase B — 수직 center 근본 원인 수정 (30분)

- `src/remotion/common/SceneRenderer.tsx` → `SceneShell` 의 layout 구조 조사
- `src/remotion/common/SubtitleBar.tsx` 가 layout flow 를 깨뜨리는지 확인
- SceneRoot + height:100% + justify:center 가 정상 동작하도록 수정
- 수정 후 **scene-0 렌더 스틸 한 장 검수** — 수직 center 달성 확인

### Phase C — 씬별 수동 재설계 (가장 오래)

**절대 원칙:**
- **반드시 한 씬씩 author + render still + 검수 + 수정 사이클**
- **절대 한 번에 10씬 이상 처리 금지**
- **mass realizer / 공통 템플릿 스크립트 작성 금지**
- **SvgGraphic warning triangle — 경고 키워드 명시된 씬 에서만 사용**
- **CompareBars / ProgressBar / DataTable 중 한 씬에 최대 1개**
- **Stack(row, align: baseline) 활용으로 픽셀 계산 회피**

씬별 순서 권장:
1. **열쇠 씬 먼저** (0, 3, 22, 39, 52, 65, 77) — 오프닝/뉴스 헤더/엔딩
2. **metric 씬** — 실제 숫자가 narration 에 명확히 있는 것만 mega 패턴
3. **flow 씬** — FlowDiagram / AnimatedTimeline / CycleDiagram
4. **contrast 씬** — VersusCard / ChatBubble / Split 1:1
5. **listing 씬** — EmojiIconList / BulletList / Grid 3 타일
6. **나머지 보조 씬**

각 씬 커밋 전:
- [ ] `node scripts/render-stills.mjs` 로 그 씬 프레임 확인 (전체 스크립트 말고 특정 씬만 렌더하는 옵션 추가 권장 — 지금 스크립트는 78장 다 찍음)
- [ ] 레퍼런스 SC N 번과 대조 — 구도 · 색 · 계층 · 여백 모두 근접하는지
- [ ] "이 프레임을 사용자가 본다면 OK 라 할까?" 자문

### Phase D — 전수 재검수 + 재렌더

- 78씬 모두 Phase C 완료 후 전체 렌더
- 78 mid-frames 전수 Read
- 실패 씬 재설계 사이클 반복
- CompareBars 총 ≤ 5 · SvgGraphic warning ≤ 2 · 수직 center 전 씬 통과 확인

### Phase E — 사용자 승인 → 최종 mp4 렌더

---

## 4. 파일 포인터

### 핵심 소스
- `src/remotion/common/theme.ts` — mint palette · palette rotation 제거됨
- `src/remotion/common/StackRenderer.tsx` — Absolute 컨테이너, baseline alignment 지원
- `src/remotion/nodes/registry.ts` — 전체 노드 맵
- `src/remotion/nodes/diversity-primitives.tsx` — 5 신규 프리미티브
- `src/remotion/nodes/freeform.tsx` — FreeText (빈 text + 크기 → 블록)
- `src/services/pattern-catalog.ts` — 40 패턴 (P01~P40)
- `src/services/pattern-picker.ts` — mint 기본 · 하드 쿼터 · mega 페널티
- `src/types/index.ts` — VisualPlan (direction/typo/density 포함)

### 가드
- `scripts/validate-visual-plan-coverage.js`
- `scripts/validate-layout-diversity.js`
- `scripts/validate-fidelity.js`
- `scripts/validate-density.sh`
- `scripts/postprocess.sh`
- `scripts/sync-render-props.js`
- `scripts/render-stills.mjs` — bundle 1회 + renderStill 78회

### 데이터
- `data/0417-테스트/scenes-v2.json` — **폐기 예정** (각 씬 재설계)
- `data/0417-테스트/scenes.json` — /vg-scene 출력, visual_plan 이 가장 최신
- `data/0417-테스트/0417-테스트.srt` — 자막 (건드리지 말 것)
- `data/0417-테스트/beats.json` — beats (건드리지 말 것)

### 레퍼런스
- `reference/SC 1~61.png` (60장, SC 20 없음) — **유일 DNA**

### SKILL
- `.claude/skills/vg-layout/SKILL.md` (local) + `~/.claude/skills/vg-layout/SKILL.md` (global, 동기화됨)
- `.claude/skills/vg-scene/SKILL.md` + global

---

## 5. 메모리 업데이트 필수

다음 메모리를 새 세션 시작 시 읽을 것:

- `feedback_reference_folder.md` — ABSOLUTE: reference/ 가 유일 DNA
- `feedback_dual_file_sync.md` — scenes-v2 / render-props-v2 sync 실수 금지
- **NEW 필요** `feedback_no_mass_realizer.md` — 이번 세션에서 mass realizer 로 46씬 동시 재생성했다가 template-loop 실패. 한 씬씩 author 만 허용.
- **NEW 필요** `feedback_frame_verification_required.md` — 가드 통과 ≠ 시각 통과. 렌더 후 반드시 프레임 Read 로 전수 검수.

---

## 6. 시간 예산 권장

- Phase A (진단): 1시간
- Phase B (수직 center fix): 30분
- Phase C (78 씬 재설계): **8~12시간** (씬당 5~10분 × 78)
- Phase D (전수 검수 + 재렌더): 1시간
- Phase E (사용자 승인 + 최종): 30분

**총 11~15시간.** 한 세션에 몰아서 처리 금지. 3~5 세션에 나누어 Phase C 를 분산 권장.

---

## 7. 이번 세션 커밋 내역 (유지할 변경)

- `src/remotion/common/theme.ts` — Scene palette 0 mint 로 교체
- `src/remotion/nodes/dev-icon.tsx` — DARK_ICONS auto-invert
- `src/remotion/nodes/diversity-primitives.tsx` — 신규 5 프리미티브 (new file)
- `src/remotion/nodes/freeform.tsx` — FreeText 빈 text 블록 처리
- `src/remotion/nodes/registry.ts` — 7 신규 노드 등록
- `src/remotion/common/StackRenderer.tsx` — Absolute 컨테이너, baseline align, isAbsoluteContainer 분기
- `src/services/pattern-catalog.ts` — P21~P40 추가
- `src/services/pattern-picker.ts` — direction/typo/density 추가, mint 강제, mega 페널티
- `src/services/scene-blocks.ts` (변경 없음)
- `src/app/api/skills/scene/route.ts` — visual_plan commit + render-props 동기화
- `src/types/index.ts` — VisualPlan 타입, direction/typo/density 필드
- `scripts/validate-fidelity.js` (new file) — HARD GATE
- `scripts/validate-layout-diversity.js` — pattern_ref run / plan-fidelity 추가
- `scripts/validate-visual-plan-coverage.js` (new file)
- `scripts/postprocess.sh` — ⑥-c fidelity · ⑧ sync-render-props 삽입
- `scripts/sync-render-props.js` — postprocess 필수 단계화
- `scripts/apply-stack-roots.js` · `append-density-nodes.js` — sync 자동 호출 내재화
- `scripts/render-stills.mjs` (new file)
- `.claude/skills/vg-layout/SKILL.md` + global — 🟢 REFERENCE FIDELITY HARD GATE 섹션 + DUAL-FILE 섹션
- `.claude/skills/vg-scene/SKILL.md` + global — visual_plan commit MANDATORY + DUAL-FILE

### 폐기하는 임시 파일 (gitignore 해도 됨)

- `/tmp/realize_from_plan.py` · `/tmp/diversify_bars.py` · `/tmp/realize_new_patterns.py` · `/tmp/signature_v2.py` · `/tmp/signature_scenes.py` · `/tmp/stack_roots_batch*.json` · `/tmp/p0_fixes.json` · `/tmp/fix_76.json` · `/tmp/versus_fix.json` · `/tmp/density_additions.json` · `/tmp/signature_redesign.json`

---

## 8. 다음 세션 Day-1 체크리스트

```
[ ] 이 handoff 문서 전체 읽기
[ ] MEMORY.md + 하위 메모리 파일 전체 읽기
[ ] reference/ 60장 중 덜 본 SC 번호 목록 작성 → 이미지 Read
[ ] output/full-frames/scene_*.png 78장 전수 Read → 진단 테이블 작성
[ ] 사용자에게 진단 테이블 공유 · 어느 씬부터 시작할지 지시 받기
[ ] Phase B (수직 center 수정) 부터 착수
[ ] 절대 mass realizer 만들지 말 것
[ ] 절대 "통과" 전에 "시각 검수" 먼저 할 것
```

이 세션은 여기서 종료.
