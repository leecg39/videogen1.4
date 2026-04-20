---
name: vg-render
description: scenes-v2.json + render-props-v2.json을 사용하여 Remotion으로 mp4 영상을 렌더링합니다.
---

# /vg-render — Remotion mp4 렌더링

## 🔥 R11 이후 — TSX wrapper 씬 렌더 전제 (2026-04-19 · scene-grammar v1.4)

**scenes-v2.json 의 TSX wrapper 씬 (stack_root.children[0].type === "TSX") 은 반드시 다음 조건을 만족해야 렌더 가능:**

1. **`src/remotion/custom/scene-NN.tsx` 파일이 존재** — `/vg-layout` Phase 에서 Write 되었어야 함.
2. **`src/remotion/custom/registry.ts` 의 `CUSTOM_COMPONENTS` 에 `"scene-NN": SceneNN` 등록** — 미등록 시 `tsx-escape.tsx` fallback 이 "Custom component not registered" 붉은 메시지를 렌더.
3. **TSX wrapper 의 `data.component` 값이 registry 키와 일치** — 오타/케이스 불일치 시 fallback 출력.

**렌더 전 간이 체크:**

```bash
# TSX wrapper 씬 중 registry 미등록이 있는지 스캔
node -e "
const fs = require('fs');
const scenes = JSON.parse(fs.readFileSync('data/{pid}/scenes-v2.json','utf8'));
const reg = fs.readFileSync('src/remotion/custom/registry.ts','utf8');
const missing = [];
for (const s of scenes) {
  const k = s.stack_root?.children?.[0];
  if (k?.type === 'TSX') {
    const comp = k.data?.component;
    if (comp && !reg.includes('\"' + comp + '\"')) missing.push(s.id + ' → ' + comp);
  }
}
if (missing.length) {
  console.error('[FAIL:tsx-registry] 미등록 TSX 컴포넌트:');
  missing.forEach(m => console.error('  ' + m));
  process.exit(1);
}
console.log('[PASS:tsx-registry] 모든 TSX wrapper 등록 확인');
"
```

FAIL 시 `/vg-layout` 로 회귀하여 해당 `scene-NN.tsx` 작성 또는 registry.ts 에 추가.

## 🚨 v1.2 — OUTRO 블랙 스캔 + 사전 점검 HARD GATE (2026-04-19)

> **출처:** `.Codex/rules/scene-grammar.md` Section 12 (v1.2 픽셀 레벨 HARD GATE P5).
>
> 2026-04-19 감사: vibe-news-0407.mp4 의 **마지막 5프레임(f075~f079) 이 완전 블랙**. `sync-render-props` / transition rotation 수정 이후에도 outro 세그먼트가 렌더링되지 않는 버그가 감지되지 않았다. `/vg-render` 는 렌더 전 사전 점검과 렌더 후 블랙 스캔을 ABSOLUTE 게이트로 강제한다.

### 렌더 전 사전 점검 (ABSOLUTE)

```bash
# Step 0-a. 마지막 씬 구조 검사
node -e "
const s = require('./data/{pid}/scenes-v2.json');
const last = s[s.length-1];
if (!last.stack_root) { console.error('[FAIL:outro-stack] 마지막 씬 stack_root 부재'); process.exit(1); }
if (last.allow_exit !== true) { console.error('[FAIL:outro-allow-exit] 마지막 씬 allow_exit=true 필수'); process.exit(1); }
if (!last.duration_frames || last.duration_frames < 30) { console.error('[FAIL:outro-duration] 마지막 씬 ≥30f 필수'); process.exit(1); }
console.log('[PASS:outro-pre] 마지막 씬 구조 OK');
"

# Step 0-b. render-props-v2.json 총 프레임과 scenes-v2.json 합 일치
node -e "
const s = require('./data/{pid}/scenes-v2.json');
const r = require('./data/{pid}/render-props-v2.json');
const sum = s.reduce((a,c)=>a + (c.duration_frames||0), 0);
if (sum !== r.durationInFrames) {
  console.error('[FAIL:outro-frame-sum] scenes 합=',sum,'vs render=', r.durationInFrames);
  process.exit(1);
}
console.log('[PASS:outro-frame-sum]', sum, '=', r.durationInFrames);
"
```

위 둘 중 하나라도 FAIL → 렌더 불가. /vg-layout 단계로 회귀하여 마지막 씬 재작성.

### 렌더 후 블랙 스캔 (ABSOLUTE)

```bash
# Step 6-a. 영상 마지막 2초 블랙 프레임 검사 (ffprobe blackdetect)
node scripts/validate-outro-black.js output/{pid}.mp4

# 내부 로직:
# ffprobe -f lavfi -i movie=output/{pid}.mp4,blackdetect=d=0.05:pix_th=0.10 -show_entries frame=pkt_pts_time -of json
# → 영상 마지막 2초 구간에서 black 프레임 1개라도 감지 → exit 1
# → [FAIL:outro-black] black segment at {ms}, 폐기 + /vg-layout 재실행
```

FAIL 시 **mp4 즉시 삭제** (파일 남겨두면 사용자가 "렌더 됐네" 오해). `output/{pid}.mp4` rm 후 `/vg-layout` 재실행.

### 렌더 후 픽셀 밀도 샘플 (ABSOLUTE)

```bash
# Step 6-b. 무작위 3 씬 샘플 PNG 밀도 ≥ 15% 확인
node scripts/validate-pixel-density.js --video output/{pid}.mp4 --samples 3 --threshold 0.15

# 내부 로직:
# ffmpeg -ss {mid_ms} -i output/{pid}.mp4 -vframes 1 /tmp/sample-N.png
# 각 PNG 의 non-empty pixel ratio 측정. 1장이라도 <15% → exit 1
# → [FAIL:pixel-density-runtime] scene={N} density={X}%, 폐기
```

이 두 게이트를 통과해야 `project.json.status` 를 `"rendered"` 로 업데이트. FAIL 시 `"rendering-failed"` 로 기록.

### `VG_SKIP_OUTRO_SCAN=1` 같은 bypass 환경변수 금지

v1.2 ZERO-TOLERANCE. 감사에서 드러난 outro 블랙 5프레임은 bypass 구멍이 없었기에 더 **감지되지 않았다**. 즉 "게이트 부재 = 무검출" 이었다. 새 게이트도 같은 실수를 반복하지 않는다. 오작동 시 게이트 우회가 아니라 게이트 로직을 수정한다.

---

## 호출

```
/vg-render {projectId}
```

## 전제조건

`/vg-layout`이 완료되어 다음 파일이 존재해야 함:
- `data/{projectId}/scenes-v2.json` (stack_root 포함)
- `data/{projectId}/render-props-v2.json` (scenes 동기화 완료)
- `public/` 에 오디오 파일 복사 완료

## 워크플로우

### 1. 검증 + 오디오 복사

```bash
# scenes-v2.json 존재 확인
ls data/{projectId}/scenes-v2.json

# render-props-v2.json 존재 확인
ls data/{projectId}/render-props-v2.json
```

**오디오 파일 최신 복사 (필수):**
project.json에서 `audio_path`를 읽고, `input/`에 원본이 있으면 **항상** `public/`으로 복사 (덮어쓰기):

```bash
# project.json에서 audio_path 읽기 (예: "가치 노동.mp3")
# input/에 해당 파일이 있으면 public/으로 복사
cp "input/{audio_filename}" "public/{audio_filename}"
```

복사 후 `public/{audio_filename}` 존재 확인. 없으면 에러.

### 2. render-props-v2.json 동기화 (필수)

**항상** scenes-v2.json과 project.json에서 다시 생성:

```javascript
const scenes = JSON.parse(fs.readFileSync('data/{projectId}/scenes-v2.json'));
const project = JSON.parse(fs.readFileSync('data/{projectId}/project.json'));
// audio_path는 "public/" 접두사 없이 파일명만 (예: "가치 노동.mp3")
// Remotion staticFile()이 public/ 기준 상대경로를 사용하므로
const renderProps = {
  projectId: project.id,
  audioSrc: project.audio_path,  // "가치 노동.mp3" (public/ 접두사 없이!)
  scenes: scenes
};
fs.writeFileSync('data/{projectId}/render-props-v2.json', JSON.stringify(renderProps, null, 2));
```

**주의:** `audioSrc`에 `"public/"` 접두사 절대 붙이지 않는다. `staticFile("가치 노동.mp3")`는 자동으로 `public/가치 노동.mp3`를 찾는다.

### 2.5. 후처리 파이프라인 실행 (필수)

**렌더링 전에 반드시 실행합니다.** 후처리를 건너뛰면 카드 간격, 자막 싱크, 빈 화면 등 품질 문제가 발생합니다.

```bash
bash scripts/postprocess.sh data/{projectId}/scenes-v2.json
```

후처리 5단계:
1. `sync-enterAt` — 자막↔노드 타이밍 동기화
2. `fix-row-spacing` — 카드↔화살표 간격 보정 (maxWidth, gap)
3. `optimize-layout` — gap/maxWidth 최적화
4. `pad-sparse-scenes` — 빈 씬 패딩
5. `fix-all-enterAt-gaps` — 공백 재분배 + 컨테이너 동기화

**이 단계를 절대 건너뛰지 마세요.** 이후 Step 2의 render-props 동기화가 후처리 결과를 반영합니다.

### 3. 렌더링 실행

```bash
npx remotion render MainComposition output/{projectId}.mp4 \
  --props=data/{projectId}/render-props-v2.json \
  --concurrency=4
```

### 4. 상태 업데이트

렌더링 성공 시 project.json 업데이트:
```json
{
  "status": "rendered",
  "updated_at": "..."
}
```

### 5. 결과 보고

- 출력 파일: `output/{projectId}.mp4`
- 파일 크기, 렌더링 소요 시간 보고

## 렌더링 파이프라인 (2.0)

Composition.tsx의 `TransitionSeries`가 씬 간 전환 효과를 자동 적용합니다.

### 씬 간 트랜지션
각 씬의 `transition` 필드를 읽어 `TransitionSeries.Transition`으로 렌더링:
- `crossfade` — 불투명도 교차 전환 (기본)
- `slide-left/right/up/down` — 방향별 슬라이드
- `wipe-right/down` — 닦아내기
- `zoom-in/out` — 확대/축소 + exit 효과
- `blur-through` — 블러 효과 전환

`transition` 필드가 없으면 `autoSelectTransition()`이 intent/갭 기반으로 자동 선택합니다.

### 씬 exit 애니메이션
`SceneWithEffects` 래퍼가 각 씬 마지막 12프레임에서:
- zoom-in/out: scale 변화
- blur-through: blur 효과
- 기본: 미세 entrance blur 해제

### 노드 모션 (26종 entrance + 19종 emphasis)
StackRenderer가 처리:
- **entrance**: fadeUp, popBadge, rotateIn, zoomBlur, flipUp, expandCenter 등 26종
- **emphasis**: 등장 완료 후 루프 재생 — float, pulse, shimmer, heartbeat, tilt3d, borderGlow 등 19종
- `motion.emphasis`와 `motion.emphasisCycle`로 제어

### 지원 노드 (41종)
- 컨테이너 9종: SceneRoot, Stack, Grid, Split, Overlay, AnchorBox, SafeArea, FrameBox, ScatterLayout
- Leaf 32종: 텍스트 8 + 도형 4 + 미디어 4(SvgGraphic 포함) + 차트 3 + 복합카드 6 + 커넥터 2 + 악센트 4 + 인터랙티브 4 + 다이어그램 8(v2: Venn/Funnel/Pyramid/Matrix) + 데이터시각화 3

## 주의사항

- 렌더링은 시간이 오래 걸림 (10분 영상 ≈ 5~10분). foreground 실행 시 timeout 위험 → `run_in_background: true` MUST.
- `remotion.config.ts` 포트 설정은 주석 처리 상태 (Next.js 충돌 방지)
- 오디오 파일은 반드시 `public/` 아래에 있어야 Remotion `staticFile()`이 인식
- concurrency=4 이상은 메모리 부족 위험
- `@remotion/transitions` 4.0.435 필요 (TransitionSeries용)
