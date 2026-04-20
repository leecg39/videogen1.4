# Semantic Shapes — 의미 기반 장면 설계

vg-layout, vg-scene에서 공통 참조하는 의미 구조.

## Semantic Shape 분류

| 자막의 의미 | semantic_shape |
|---|---|
| A와 B를 비교 | `contrast` |
| 순서/단계/과정 | `sequence` |
| 여러 요소를 나열 | `cluster` |
| 하나의 핵심 수치 | `metric` |
| 전체에서 일부를 강조 | `fraction` |
| 구조/계층/포함 관계 | `hierarchy` |
| 변환/전후 | `transformation` |
| 질문/멈춤/전환 | `pause` |
| 하나의 상징/비유 | `symbol` |
| 증거/사례/인용 | `evidence` |
| 요약/정리 | `summary` |

## Scene Family (shape별 변주)

- contrast: split-compare, vs-badge, scale-contrast, before-after, **myth-chatbubble**(#20), **do-dont-bars**(#21)
- sequence: horizontal-flow, vertical-timeline, numbered-stack, funnel-reduction, **timeline-horizontal**(#27)
- cluster: icon-row, grid-cards, radial-spread, stacked-list, **checklist-graded**(#28), **scorecard-donut-3**(#30)
- metric: big-number-hero, ring-fraction, bar-comparison, stat-row, **donut-stat-hero**(#25), **donut-split-action**(#26)
- fraction: ring-highlight, one-vs-many, segment-focus, pie-callout
- hierarchy: tree-breakdown, pyramid-layers, nested-boxes, hub-spoke, **funnel-persona**(#29), **cross-verify**(#24)
- transformation: arrow-transition, split-before-after, morph-stages, **before-after-shift**(#17), **input-output-flow**(#22), **convergence-flow**(#23)
- pause: single-question, icon-spotlight, empty-center, quote-focus
- symbol: centered-icon, metaphor-illustration, equation-style, **quote-hero-3tier**(#18), **persona-empathy**(#19)
- evidence: person-quote, data-row, screenshot-split, case-card
- summary: checklist-final, keyword-cluster, cycle-recap, single-sentence

## 패턴 번호 참조

`#17`~`#30` 번호는 `.claude/skills/vg-layout/references/layout-patterns.md`에 정의된 레이아웃 패턴 번호.
각 패턴에 stack_root JSON 예시가 포함되어 있으므로 vg-layout 실행 시 직접 참조 가능.
