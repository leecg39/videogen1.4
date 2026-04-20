---
name: videogen1-4
description: Use when working in the leecg39/videogen1.4 repository or a closely related newVideoGen fork. Covers the Remotion pipeline, scene-design guardrails, key renderer files, and the repo-native vg-* workflow skills.
---

# Videogen 1.4

이 스킬은 `leecg39/videogen1.4` 또는 이와 가까운 `newVideoGen-v1.4.0` 계열 저장소에서 작업할 때 사용합니다.

## 먼저 읽을 파일

- `AGENTS.md`
- `README.md`
- `.Codex/rules/scene-grammar.md`

특정 파이프라인 단계가 작업 범위에 들어가면, 해당 단계의 repo-native 스킬도 함께 엽니다.

- 전체 파이프라인: `.agents/skills/vg-new/SKILL.md`
- 대본/음성: `.agents/skills/vg-script/SKILL.md`, `.agents/skills/vg-voice/SKILL.md`
- chunk/scene/layout/render: `.agents/skills/vg-chunk/SKILL.md`, `.agents/skills/vg-scene/SKILL.md`, `.agents/skills/vg-layout/SKILL.md`, `.agents/skills/vg-render/SKILL.md`
- 데모 계열: `.agents/skills/vg-demo/SKILL.md`, `.agents/skills/vg-video-demo/SKILL.md`
- 보조 워크플로우: `.agents/skills/vg-cinematic/SKILL.md`, `.agents/skills/vg-deck/SKILL.md`, `.agents/skills/vg-analyze/SKILL.md`, `.agents/skills/vg-catalog/SKILL.md`, `.agents/skills/vg-assets/SKILL.md`

## 이 저장소가 하는 일

- Next.js 16 + React 19 + Remotion 4 기반 AI 영상 생성 엔진입니다.
- 기본 파이프라인은 `script -> voice -> chunk -> scene -> layout -> render` 입니다.
- 핵심 목표는 "AI가 만든 것 같지 않은 영상"이며, 무난한 카드 나열보다 깊이감과 구도 품질을 우선합니다.

## 핵심 경로

- 엔트리: `src/remotion/index.ts`, `src/remotion/Root.tsx`, `src/remotion/Composition.tsx`
- 씬 라우팅: `src/remotion/common/SceneRenderer.tsx`
- 재귀 노드 렌더러: `src/remotion/common/StackRenderer.tsx`
- 노드 등록: `src/remotion/nodes/registry.ts`
- 테마/배경/자막: `src/remotion/common/theme.ts`, `src/remotion/common/AmbientBackground.tsx`, `src/remotion/common/SubtitleBar.tsx`
- 커스텀 씬: `src/remotion/custom/registry.ts`, `src/remotion/custom/scene-*.tsx`
- 파이프라인 서비스: `src/services/*.ts`
- 프로젝트 데이터: `data/{projectId}/scenes-v2.json`, `data/{projectId}/render-props-v2.json`
- 최종 산출물: `output/{projectId}.mp4`

## 작업 규칙

- 사각형 카드 나열, 좌우 대칭, 같은 구도 반복을 피합니다.
- 모든 씬에 전경/중경/배경의 층위를 의도적으로 만듭니다.
- `InsightTile` 노드는 사용하지 않습니다.
- 다크 배경은 순수 검정 대신 틴트가 들어간 어두운 색을 우선합니다.
- `scene.background`가 비어 있으면 `AmbientBackground` 프리셋이 적용됩니다.
- Phase 3 `/vg-layout`의 기본값은 TSX 씬 직접 작성입니다.
- DSL은 예외 경로이므로 `.Codex/rules/scene-grammar.md`의 조건을 먼저 확인합니다.
- `SceneRoot`의 `alignItems: "center"`는 유지합니다.
- Stack/Grid/Split 계열 컨테이너는 `width: "100%"`를 기본으로 봅니다.

## 어떤 파일부터 볼지

- 렌더 결과가 이상하면:
  - `src/remotion/common/SceneRenderer.tsx`
  - `src/remotion/common/StackRenderer.tsx`
  - `src/remotion/nodes/registry.ts`
- 특정 노드가 깨지면:
  - 대응하는 `src/remotion/nodes/*.tsx`
- 씬 구조를 바꾸면:
  - `src/remotion/custom/registry.ts`
  - 해당 `src/remotion/custom/scene-NN.tsx`
  - `.Codex/rules/scene-grammar.md`
- 파이프라인 상태나 데이터 파일 생성이 이상하면:
  - `src/services/job-runner.ts`
  - `src/services/project-status.ts`
  - 단계별 관련 서비스 파일

## 기본 명령

저장소 루트에서 실행합니다.

```bash
npm install
npm run dev
npm run build
npm run test
npm run remotion:preview
```

최종 렌더 예시는 다음과 같습니다.

```bash
npx remotion render src/remotion/index.ts MainComposition output/<name>.mp4 \
  --props=data/<projectId>/render-props-v2.json \
  --concurrency=4
```

## 실무 팁

- 새 영상 입력이 `input/`에 준비되어 있으면 `vg-new` 경로를 먼저 고려합니다.
- 장면 품질 이슈는 자동 매핑보다 수동 TSX 설계에서 해결되는 경우가 많습니다.
- UI를 고칠 때도 영상 미학 규칙을 유지해야 하며, "무난함"을 성공으로 취급하지 않습니다.
- 변경 범위가 렌더러와 씬 정의를 동시에 건드리면 최소 `npm run build`는 확인하는 편이 안전합니다.
