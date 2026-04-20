# Hyperframes vs newVideoGen — 단점 해부 리포트

**작성일:** 2026-04-17
**대상 저장소:** `heygen-com/hyperframes` (★1.7k, HTML 5.8MB / TS 3.0MB)
**비교 대상:** `newVideoGen` (Remotion + Next.js + 24개 vg-* 스킬 + 74 노드 + 65개 scripts)

> ⚠️ 이 문서는 우리(newVideoGen)의 **단점**을 해부하기 위한 비교 리포트다.
> Hyperframes의 좋은 점만 모아 우리에게 비추는 거울로 쓴다.

---

## 1. Hyperframes 한 줄 요약

> **"HTML을 쓴다. 비디오를 렌더한다. 에이전트를 위해 만들었다."**
> 컴포지션은 `data-*` 속성 + GSAP 타임라인 + CSS만 있는 HTML 파일.
> Puppeteer + FFmpeg가 페이지를 시간순으로 캡처해서 mp4로 인코딩.

### 핵심 패키지 7개
| 패키지 | 역할 |
|--------|------|
| `cli` | `init / preview / lint / validate / render / transcribe / tts / doctor` |
| `core` | 파서·생성기·린터·런타임·**Frame Adapter (GSAP/Lottie/CSS/Three.js)** |
| `engine` | seekable 캡처 엔진 — `chunkEncoder` / `streamingEncoder` / `parallelCoordinator` |
| `producer` | 풀 렌더 파이프라인 — `audioMixer` / `htmlCompiler` / `deterministicFonts` / `hyperframeLint` |
| `studio` | **브라우저 기반 컴포지션 에디터** |
| `player` | 임베드용 `<hyperframes-player>` **웹 컴포넌트** |
| `shader-transitions` | **WebGL 셰이더 트랜지션** (35+ 종) |

### 5개 스킬
| 스킬 | 학습 영역 |
|------|-----------|
| `hyperframes` | HTML 컴포지션 작성, 캡션, TTS, 오디오 반응형, 트랜지션 |
| `hyperframes-cli` | CLI 사용법 |
| `hyperframes-registry` | `hyperframes add`로 50+ 블록/컴포넌트 인스톨 |
| `gsap` | GSAP API, 이지, ScrollTrigger, 플러그인, 성능 |
| `website-to-hyperframes` | URL → 7-step 파이프라인으로 비디오 생성 |

---

## 2. 우리 단점 — 카테고리별 해부 (18가지)

### A. 매체 선택 ── React/Remotion에 묶임 (구조적 약점)

| | 우리 (newVideoGen) | Hyperframes |
|---|---|---|
| 컴포지션 작성 | TSX 컴포넌트 + 노드 등록(`registry.ts`) + 타입 정의 + props 학습 | `<div data-start="0" data-duration="5">` 한 줄 |
| 노드 추가 | 코드 push → 빌드 → 런타임 반영 (dev cycle) | HTML 파일 1개 추가 (콘텐츠 작업) |
| 에이전트 친화도 | 74개 노드의 데이터 스키마 + `stack_root` JSON DSL 학습 필요 | data-attribute + GSAP만 알면 됨 |

> **본질적 차이:** Hyperframes는 "컴포지션 = 콘텐츠"인 반면, 우리는 "컴포지션 = 코드 + JSON DSL"이다. 에이전트가 만들기 더 어렵다.

---

### B. 트랜지션 시스템 ── 빈약 (정량적 약점)

| | 우리 | Hyperframes |
|---|---|---|
| 트랜지션 종류 | `TransitionSeries` 기반 fade/slide 정도 | **35+ CSS + WebGL 셰이더** (chromatic-radial-split, cinematic-zoom, cross-warp-morph, domain-warp-dissolve, flash-through-white, glitch, gravitational-lens, light-leak, ridged-burn, ripple-waves, sdf-iris, swirl-vortex, thermal-distortion, …) |
| 분류 체계 | 없음 | **Energy(Calm/Medium/High) × Mood(9가지) × Narrative Position(6가지) 매핑표** |
| 선택 가이드 | 없음 | "Pick ONE primary (60-70%) + 1-2 accents. Never use a different transition for every scene." |
| Anti-pattern | 없음 | "Visible repeating geometric patterns(grid/hex/dot array) 금지" |

---

### C. 결정론(Determinism) 보증 ── 명시 안 함

Hyperframes의 `SKILL.md`에 **HARD GATE**로 박혀 있는 규칙이 우리에겐 없다:
- ❌ `Math.random()` 사용 금지 — 시드 PRNG (mulberry32) 사용
- ❌ `Date.now()` / 시간 기반 로직 금지
- ❌ `repeat: -1` 무한 반복 금지 — `Math.ceil(duration / cycle) - 1`로 정확한 횟수
- ❌ `async`/`setTimeout`/`Promise` 안에서 타임라인 빌드 금지 — 캡처 엔진이 `window.__timelines`를 동기적으로 읽음

> **우리 영향:** Remotion은 자체적으로 frame-pure하지만, 우리 노드 코드에 `Math.random` 같은 게 섞여 있는지 검증하는 가드는 없다.

---

### D. 품질 검증 ── 정적 검증에 멈춤

| 검증 | 우리 | Hyperframes |
|---|---|---|
| 정적 JSON 검사 | ✅ visual-plan-coverage / diversity / density / fidelity / label-quality / node-uniqueness / design-sync / scene-sync | ❌ 없음 (HTML lint만) |
| **WCAG contrast 픽셀 샘플링** | ❌ | ✅ `contrast-report.mjs` — 5 timestamps 캡처 → 텍스트 elements → 배경 픽셀 샘플 → 4.5:1 비교 → 위반 경고 + magenta/yellow/green overlay PNG |
| **Animation map (트윈 단위 분석)** | ❌ | ✅ `animation-map.mjs` — 모든 GSAP 트윈을 ASCII 간트차트화 + dead zone (1초 이상 무애니) + collision flag + paced-fast/slow |
| Frame 추출 후 사용자가 본다 | ✅ | ✅ |

> **결정적 차이:** 우리는 사용자가 프레임을 눈으로 봐야 하지만, Hyperframes는 contrast/dead zone/collision을 **자동으로 발견**한다.

---

### E. 레이아웃 ↔ 애니메이션 분리 ── 약함

Hyperframes의 핵심 원칙: **"Layout Before Animation"**
1. Hero frame을 **정적 HTML+CSS로 먼저 빌드** (가장 많은 요소가 동시에 보이는 프레임)
2. `gsap.from()`으로 OFFSCREEN/INVISIBLE → CSS 위치 = 진입 애니메이션
3. CSS 위치가 ground truth, 트윈은 "여정"

> **우리는?** `stack_root` JSON에 enterAt/duration/preset이 한꺼번에 묶여 있어서, 정적 hero frame을 **분리해서 검증할 방법이 없다**. → 레이아웃 깨짐을 모션 후에야 발견.

---

### F. Visual Identity 시스템 ── 약함

| | 우리 | Hyperframes |
|---|---|---|
| 디자인 명세 파일 | `theme.ts` (4 StylePack) + `docs/design-system.md` | **`DESIGN.md`** (프로젝트 루트) + **`visual-style.md`** (프로젝트별) + **`visual-styles.md`** (8 named presets) |
| 명명된 스타일 | `dark-neon` / `editorial` / `documentary` / `clean-enterprise` | **8개 디자이너 인용** — Swiss Pulse(Müller-Brockmann) / Velvet Standard(Vignelli) / Deconstructed(Brody) / Maximalist Type(Scher) / Data Drift(Anadol) / Soft Signal(Sagmeister) / Folk Frequency(Terrazas) / Shadow Cut(Hillmann) |
| 스타일별 패키지 | 폰트 + 컬러만 | **컬러 + 폰트 + GSAP signature ease + shader pairing + 1-paragraph mood prompt** |
| Visual Identity Gate | 없음 (HARD GATE 없음) | "Before writing ANY composition HTML, you MUST have a visual identity defined" — DESIGN.md 강제 |

---

### G. 모션 다양성 정량 가드 ── 부재

`hyperframes/references/motion-principles.md`의 정량 가드:
- "**같은 ease 2개 트윈 이상 금지**" (씬 내)
- "0.4-0.5s 디폴트화 금지 — 가장 느린 씬은 가장 빠른 씬의 **3배 이상**"
- "**stagger 총합 500ms 이내**" (요소 수 무관)
- "Entrance > Exit 비대칭 — 카드는 0.4s에 들어오고 0.25s에 나간다"
- "0.1-0.3s offset (t=0 시작 금지)"

우리는? `B5 Motion Variety` 섹션에 추상적 권고만.

---

### H. 페이싱 모델 ── 부재

Hyperframes의 모든 씬은 **build / breathe / resolve** 3-phase:
- **Build (0-30%)** — 요소 진입, staggered. 한꺼번에 dump 금지.
- **Breathe (30-70%)** — 콘텐츠 보임, **단 하나의** ambient motion으로 살아 있음.
- **Resolve (70-100%)** — 종료 또는 결정적 전환.

우리는 enterAt 점진 배치 정도. 호흡(breathe) 단계라는 개념 자체가 없다.

---

### I. Transcription/TTS 통합 ── 한국어 강점·범용성 약점

| | 우리 | Hyperframes |
|---|---|---|
| TTS | ElevenLabs PVC (`j9zDdWCMVw4VqUJwzwAL`) | Kokoro-82M (오픈소스) — 다국어 |
| Transcribe | Whisper (의미 단위 자막 분할) | Whisper — `--model small.en` vs `small --language ko` 등 명확한 언어 가드 |
| 자막 싱크 가드 | ✅ scene 경계 = SRT entry 경계 invariant + 250ms drift 검출 | ✅ word-level timestamps → beat 매핑 |
| 언어 정책 가드 | ❌ | ✅ "Never use `.en` models unless audio is English" HARD RULE |

> **우리 강점:** 한국어 의미 단위 자막 분할은 강력. **약점:** 다국어 일반화/언어 자동 감지/언어 가드는 hyperframes가 더 정교.

---

### J. 에디터·플레이어·프리뷰 ── 부재

| | 우리 | Hyperframes |
|---|---|---|
| Live preview | Remotion Studio (포트 충돌로 비활성화 — `remotion.config.ts` 주석) | `npx hyperframes preview` — 브라우저 라이브 리로드 |
| 컴포지션 에디터 | `/control/[projectId]` 페이지 (한정적) | `@hyperframes/studio` — **브라우저 기반 풀 에디터** |
| 임베드 플레이어 | 없음 | `<hyperframes-player>` 웹 컴포넌트 — 어디든 임베드 |

---

### K. Skill/Registry 인스톨 표준화 ── 부재

| | 우리 | Hyperframes |
|---|---|---|
| 스킬 인스톨 | 로컬 `.claude/skills/`만 | `npx skills add heygen-com/hyperframes` (vercel-labs/skills 표준) |
| 멀티 IDE 지원 | Claude Code 한정 | Claude Code / Cursor / Gemini CLI / Codex 동시 지원 |
| 블록 인스톨 | 없음 (노드는 코드 변경 필요) | `npx hyperframes add flash-through-white` 한 줄 — 50+ 블록 |
| NPM 배포 | 없음 | `npm i hyperframes` + `npx hyperframes init` |

---

### L. 구도/Asymmetry 정량 가드 ── 약함

`motion-principles.md`의 Visual Composition 가드:
- "**Two focal points minimum per scene.** The eye needs somewhere to travel."
- "**Fill the frame.** Hero text: 60-80% of width."
- "**Three layers minimum per scene.** Background + Foreground + Accent."
- "**Anchor to edges.** Centered-and-floating is a web pattern."
- "**Split frames.** Zone-based, not centered stacks."

우리는 `CLAUDE.md`에 "사각형 나열 금지", "비대칭 기본"이 있지만 **"몇 개 zone"**, **"몇 % width"**, **"몇 개 layer"** 같은 정량 가드는 없다.

---

### M. Caption Overflow 자동 fitting ── 부재

```js
// Hyperframes는 동적 폰트 크기 fitting 제공
window.__hyperframes.fitTextFontSize(text, {
  fontFamily: "Outfit", fontWeight: 900, maxWidth: 1600
})
```
우리는 고정 폰트 크기 → 긴 한국어 텍스트는 직접 줄여야 함. Caption Exit Guarantee (`tl.set(opacity:0, visibility:hidden)` deterministic kill) 같은 패턴도 없음.

---

### N. Per-word 강조 시스템 ── 부재

Hyperframes는 캡션의 단어를 **자동 분류 + 강조**:
- 브랜드/제품명 → larger size, unique color
- ALL CAPS → scale boost, flash
- 숫자/통계 → bold weight, accent
- 감정 키워드 → exaggerated animation
- CTA → highlight, underline

우리는 자막 = 평문 한 줄.

---

### O. Audio-reactive ── 부재

`audio-reactive.md`: frequency band → GSAP property 매핑 (beat sync, glow, pulse driven by music). 우리는 오디오는 단순 백그라운드 트랙.

---

### P. Marker Highlight 패턴 ── 1개만

Hyperframes의 `css-patterns.md`는 5종 deterministic 강조:
- highlight (마커 sweep)
- circle (손그림 원)
- burst (폭발선)
- scribble (낙서)
- sketchout (스케치 X 표시)

우리는 `MarkerHighlight` 노드 1개.

---

### Q. Data-in-motion 패턴집 ── 부재

`data-in-motion.md` = 차트/통계/인포그래픽이 **시간에 따라 reveal되는 방법**의 카탈로그.
우리는 차트 노드 (CompareBars/RingChart/AreaChart 등)는 있지만 "어떻게 시간 축에 따라 데이터를 드러낼지"의 패턴 모음이 없다.

---

### R. Anti-pattern Collection ── 추상적

Hyperframes의 `SKILL.md`에 박혀 있는 11개의 "Never do"는 매우 구체적:
> "Use `<br>` in content text — forced line breaks don't account for actual rendered font width. Text that wraps naturally + a `<br>` produces an extra unwanted break, causing overlap. Let text wrap via `max-width` instead."

우리의 anti-slop은 "Inter 금지", "순수 검정 금지" 정도로 추상적.

---

### S. 문서 사이트 / 카탈로그 ── 부재

Hyperframes: `hyperframes.heygen.com` — Mintlify 도큐먼트 + 카탈로그 + 가이드 + 50+ 블록 미리보기.
우리: `docs/` 폴더 안 마크다운만.

---

## 3. 우리의 진짜 강점 (잃어선 안 될 것)

비교 중 명확해진 우리의 우위:

1. **한국어 의미 단위 자막 분할** — Whisper 결과를 다시 의미 단위로 재chunk. Hyperframes에 없음.
2. **scene-SRT drift HARD GATE** — 250ms 이상 drift 자동 차단. 우리만 있음.
3. **Visual DNA 패턴 카탈로그(P01~P20)** — `reference/SC *.png` 61장 기반 picker.
4. **Multi-stage HARD GATE 체인** — postprocess.sh의 ⓪~⑧ 9단계.
5. **Dual-file (scenes-v2 + render-props-v2) sync 자동화** — 한 번 실수 후 영구 가드.
6. **74 노드 레지스트리의 절대 풍부함** — Hyperframes의 50 블록보다 많고 데이터-중심.
7. **TTS 후처리 표준** — loudnorm I=-18 + apad 250ms + 영문 한글 음차.
8. **클로드 한국어 컨설팅 페어링** — vg-script/vg-deck/vg-cinematic 같은 도메인 특화.

---

## 4. 우선순위별 도입 액션 플랜

### 🔴 P0 — 즉시 도입 가능 (구조 변경 0)

1. **결정론 HARD GATE 추가** — `scripts/validate-determinism.js` — `Math.random` / `Date.now` / `repeat: -1` / async 타임라인 검출
2. **Motion Variety 정량 가드** — postprocess에 추가:
   - 씬 내 같은 enterAt preset 2회 이상 금지
   - stagger 총합 500ms 이내
   - 가장 느린 enter ≥ 가장 빠른 enter × 3
3. **Visual Identity Gate** — vg-layout SKILL.md에 "DESIGN.md/theme.ts 확인 안 하면 실패" HARD GATE
4. **Anti-pattern collection 구체화** — "Never do" 리스트를 11개 정도 구체적 규칙으로 (현재 추상적)

### 🟠 P1 — 1주일 작업

5. **Animation Map 도구** — `scripts/animation-map.mjs` 포팅 — 모든 노드의 enterAt/duration/preset을 ASCII 간트차트 + dead zone 검출
6. **Contrast Audit 도구** — Remotion으로 5 timestamps 렌더 → 픽셀 샘플 → WCAG 4.5:1 검증 → magenta/yellow/green overlay
7. **Build/Breathe/Resolve 페이싱 모델** — scene 내 0-30% / 30-70% / 70-100% 가드
8. **8 Visual Style Library 한국판** — 미니멀(Müller-Brockmann) / 럭셔리(Vignelli) / 아방가르드(Brody) / 키네틱(Scher) / 데이터드리프트(Anadol) / 인티메이트(Sagmeister) / 컬러풀(Terrazas) / 누아르(Hillmann) — 각 컬러+폰트+ease+shader 패키지화

### 🟡 P2 — 1달 작업

9. **Layout Before Animation 분리** — scenes-v2.json에 `static_hero_frame` 필드 추가 → 정적 hero frame을 따로 렌더 → 레이아웃 검증 후 모션 추가
10. **WebGL Shader Transition 도입** — Remotion에 WebGL 트랜지션 (또는 hyperframes/shader-transitions 직접 임포트)
11. **Caption fitTextFontSize() 포팅** — Remotion에서 측정 후 폰트 크기 자동 조정
12. **Per-word 캡션 강조 시스템** — 브랜드/숫자/CTA 자동 분류 + scale/color 강조

### 🟢 P3 — 장기 (구조 변경 큼)

13. **HTML-native 모드 실험** — Remotion 의존을 줄이고 Puppeteer 기반 캡처로 옮기는 실험적 트랙. **본 프로젝트 ≠ 단순 포팅**, vg-deck/vg-demo 같은 정적 슬라이드 영상에 한해서만 시도.
14. **Studio 웹 에디터** — `/control` 페이지를 풀 에디터로 확장
15. **Skill 표준 인스톨러** — `npx skills add` 호환 manifest 추가
16. **Audio-reactive 노드** — Web Audio API 분석 → motion preset
17. **다국어 자막 일반화** — `--language ko/en/ja` 가드
18. **Mintlify 문서 사이트** — docs/를 MDX로 + node 카탈로그 미리보기

---

## 5. "도입하지 말 것" 명시

비교 후 의도적으로 거부할 사항:

- ❌ **Remotion 폐기 후 HTML-native 전환** — 우리의 74 노드 React 자산 + 한국어 자막 + Visual DNA 시스템이 모두 React 기반. 단순 포팅은 손해.
- ❌ **GSAP 메인 채택** — Remotion의 `interpolate` + `useCurrentFrame`이 더 결정론적이고 frame-pure.
- ❌ **8개 Visual Style 직접 카피** — 디자이너 이름은 그대로 못 쓰고, 우리의 reference/SC PNG와 충돌.
- ❌ **WebGL 셰이더 풀 셋 35종** — 데이터 중심 영상에 과잉. 5-10종으로 충분.

---

## 6. 한 문장 요약

> **우리는 "한국어 데이터 영상 생성기"로서는 hyperframes보다 깊지만, "에이전트 친화적 비디오 프레임워크"로서는 얕다.**
> 매체(React/Remotion)를 유지하되, hyperframes의 ① 정량 모션 가드 ② 자동 contrast/animation map ③ Visual Identity Gate ④ Build/Breathe/Resolve 페이싱 ⑤ 셰이더 트랜지션 ⑥ Per-word 캡션 강조 ── 6가지를 흡수하면 격차가 좁혀진다.

---

## 부록 — 비교 출처 핵심 파일

| 영역 | Hyperframes 파일 | 우리 대응 |
|------|-----------------|----------|
| 컴포지션 작성 가이드 | `skills/hyperframes/SKILL.md` (520줄) | `.claude/skills/vg-layout/SKILL.md` (920줄) |
| 모션 원칙 | `references/motion-principles.md` | `B5 Motion Variety` 섹션 |
| 트랜지션 카탈로그 | `references/transitions.md` (12KB) + `transitions/catalog.md` | `vg-render` 짧은 절 |
| 캡션 | `references/captions.md` | `vg-chunk` Step 3 의미 분할 |
| 비주얼 스타일 | `visual-styles.md` (8 named) | `theme.ts` (4 StylePack) |
| Contrast 검증 | `scripts/contrast-report.mjs` (실행 시 픽셀 샘플) | `validate-fidelity.js` (정적 JSON) |
| Animation 분석 | `scripts/animation-map.mjs` (트윈 단위 ASCII 간트) | 없음 |
| 결정론 규칙 | `SKILL.md > Rules (Non-Negotiable)` | 없음 |
| 풀 파이프라인 | `website-to-hyperframes/SKILL.md` (7-step) | `vg-new` (5 Phase) |
