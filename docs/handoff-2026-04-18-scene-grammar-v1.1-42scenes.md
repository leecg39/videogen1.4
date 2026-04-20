# Handoff 2026-04-18 — Scene Grammar v1.1 강제 완료 + 42씬 수동 재설계 대기

## Context

외부 감사 보고서(`.claude/reviews/scene-grammar-v1-audit-2026-04-18.md`) 반영 + "C 전면 재작업 + 강제력 강화" 지시 처리 중이었다. 강제력 체계는 완료, 42 씬 수동 재설계가 남아 있다.

---

## ✅ 완료 (이번 세션)

### 감사 반영 4 치명 공백 + 11 미세 교정
- `.claude/reviews/scene-grammar-v1-audit-2026-04-18.md` 원문 저장
- `docs/ROADMAP-scene-grammar.md` — D+2 (preview-still) / D+5 (validator 6) / D+7 (Phase 5 진단) / D+14 (@deprecated) / D+21 (물리 삭제) 마일스톤 + 효력정지 조항
- `.claude/rules/scene-grammar.md` v1.1 업데이트:
  - 조건 ① 재정의 (예측 가능성 ≠ frame-purity) + 조건 ⑤ 결정론 분리
  - 조건 ② 의미 노드 정의 (컨테이너/장식 제외)
  - Section 9 노드별 시각요소 가중치표
  - Absolute 허용 자식 화이트리스트
  - enterAt 모순 해소 · allow_exit 중간 씬 금지
  - 부록 도구표에 Ship date 부착

### 신규 가드 6종 (postprocess.sh ⑥-za ~ ⑥-zf)
| 파일 | 기능 | Ship |
|------|------|------|
| `scripts/validate-node-count.js` | 의미 노드 5~9개 강제 | ✅ |
| `scripts/validate-hero-frame.js` | hero_frame_ms 필수 필드 | ✅ |
| `scripts/validate-absolute-content.js` | Absolute 자식 화이트리스트 | ✅ |
| `scripts/validate-preview-reviewed.js` | Phase B 씬 preview_reviewed_at 필수 | ✅ |
| `scripts/validate-allow-exit.js` | 중간 씬 allow_exit 금지 | ✅ |
| `scripts/count-visual-elements.js` | 씬당 시각요소 ≥ 4 | ✅ |

### Migration 스크립트
- `scripts/migrate-to-phase-ab.ts` — scenes-v2 → phase-a(motion 제거) + phase-b(motion diff)
- `scripts/merge-phase-ab.ts` — 승인 후 재병합

### vg-layout SKILL.md 강제 조항
- 최상단 효력정지 경고
- **Pattern builder ABSOLUTE BAN** (금지사항 #6)
- Preview PNG Read + `preview_reviewed_at` 필수 (#7)
- `hero_frame_ms` 필수 필드 (#8)

### vg-preview-still 동작 확인
`output/preview/vibe-news-0407-scene-0-hero.png` 4.1초 렌더 — 효력정지 해제됨.

---

## 🚧 대기 (다음 세션 최우선)

### 42씬 수동 재설계 (vibe-news-0407)

**대상**: `data/vibe-news-0407/scenes-v2.json` 의 pattern builder 로 생성된 42 씬.
**문제**: `buildP01` ~ `buildP27` 함수가 같은 pattern 에 같은 구조를 찍어내서 shape hash 반복 10건 → `validate-layout-diversity` FAIL.

**원칙**:
- **pattern builder 절대 재사용 금지** (SKILL.md #6)
- 각 씬 `narration` + `subtitles` 직접 읽고 **고유 구조** 설계
- SvgAsset 라이브러리(50 assets) 우선 사용
- 10씬 단위 배치 → 4회 세션 예상

**배치 분할** (권장):
- **1차**: scene-28 ~ 37 (10씬) — P13/P01/P03/P06/P19/P17/P12/P08/P21/P03
- **2차**: scene-38 ~ 47 (10씬) — P01/P04/P24/P23/P09/P09/P11/P11/P15/P03
- **3차**: scene-48 ~ 57 (10씬) — P17/P07/P27/P26/P10/P11/P05/P08/P15/P04
- **4차**: scene-58 ~ 69 (12씬) — P11/P08/P08/P09/P01/P02/P17/P12/P06/P08/P16/P05

### 각 씬 authoring 체크리스트
1. `narration` + `subtitles` 배열 읽기
2. `visual_plan.pattern_ref` + `focal.type` 참고만 (맹목 복사 X)
3. reference/SC*.png 유사 프레임 Read 로 시각 DNA 확인
4. stack_root 작성 — Stack/Grid/Split 컨테이너 + SvgAsset/Headline/BodyText/FooterCaption
5. `hero_frame_ms` 지정 (모든 모션 정착 ms)
6. `npx tsx scripts/vg-preview-still.ts vibe-news-0407 --scene N --time hero` 실행
7. PNG Read 로 레이아웃 확인
8. `preview_reviewed_at` ISO 타임스탬프 기입

### 재설계 완료된 씬 (참고)
- scene-35: Split(coin-line vs globe-line) + Kicker + FooterCaption — `output/scene-35-fixed.png`

---

## 🔧 추가 필요 작업

### D+3 ~ D+5 (아직 미착수)
- [ ] `scripts/require-preview-read.ts` (hook 버전) — `.claude/settings.json` PostToolUse[Read] 훅 등록
- [ ] 혹은 fallback 유지: `preview_reviewed_at` 필드 (이미 validator 있음)

### D+5 ~ D+7 Phase 5 진단
- [ ] DSL vs TSX 비교 실험 — 3 씬 (반복 구조 1 / 밀도 부족 1 / 정렬 난독 1)
- [ ] 평가 루브릭 5축 * 20점 = 100점
- [ ] 결과 → scene-grammar v2 draft

### D+14 ~ D+21
- [ ] registry.ts 의 32 dead/cold 노드 `@deprecated` + export 제외
- [ ] 실제 파일 삭제 + scene-grammar v2 최종

---

## 현재 상태 (데이터/파일)

### vibe-news-0407
- `status`: rendered (mp4 생성됨: `output/vibe-news-0407.mp4` 126.4MB · 12:49 · 1920×1080 30fps)
- `scenes-v2.json`: 80 씬, 42씬이 pattern builder 로 작성 (38씬 이식 + 42씬 builder)
- 가드 현황:
  - ✅ no-emoji / svg-asset-integrity / frame-pixels / allow-exit / count-visual-elements (평균 7.3)
  - ❌ layout-diversity (shape 반복 10건)
  - ❌ freetext-cap (36 씬) / absolute-bbox (flow-collapse 31 씬)
  - ❌ node-count / hero-frame / absolute-content (1개 위반 리포트)
  - ❌ background-coverage (asset_mode=all 인데 background 0%)

### 데이터 무결성
- `/tmp/scenes-v2-backup-0407.json` (이번 세션 초기 스냅샷, 78 씬 stack_root 포함)
- `/tmp/newvideogen-backup-1776441568/` (vg-new 초기 백업)
- 0417-테스트 디렉토리 유지

---

## 다음 세션 시작 명령

```bash
# 1. 현재 상태 확인
node -e "const v2=JSON.parse(require('fs').readFileSync('data/vibe-news-0407/scenes-v2.json','utf8')); console.log('scenes:',v2.length,'with stack_root:',v2.filter(s=>s.stack_root).length);"

# 2. pending 씬 narration 덤프 (scene-28~37 1차 배치)
node -e "
const v2 = JSON.parse(require('fs').readFileSync('data/vibe-news-0407/scenes-v2.json','utf8'));
for (const i of [28,29,30,31,32,33,34,35,36,37]) {
  const s = v2[i]; console.log('scene-'+i, '['+s.visual_plan?.pattern_ref+']');
  console.log(' nar:', s.narration);
  (s.subtitles||[]).forEach(st => console.log('  '+st.startTime.toFixed(1)+'s \"'+st.text+'\"'));
}"

# 3. 재설계 후 단일 씬 preview
npx tsx scripts/vg-preview-still.ts vibe-news-0407 --scene 28 --time hero
# → output/preview/vibe-news-0407-scene-28-hero.png Read 로 확인

# 4. 전체 재렌더 (모든 배치 완료 후)
node scripts/sync-render-props.js data/vibe-news-0407/scenes-v2.json
bash scripts/postprocess.sh data/vibe-news-0407/scenes-v2.json
node scripts/render-stills-0407.mjs
npx remotion render MainComposition output/vibe-news-0407.mp4 --props=data/vibe-news-0407/render-props-v2.json --concurrency=4
```

---

## 한 문장 요약

> **강제력 체계 (33 HARD GATE + 감사 11 미세 교정 + ROADMAP + migration 스크립트) 완료. 42 씬 수동 재설계는 10 씬/세션 배치로 4 회 분산 진행 필요. pattern builder 재사용 ABSOLUTE BAN.**
