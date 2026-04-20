# Layout Patterns — Reference Video Analysis

reference/ 폴더 60개 스크린샷에서 추출한 16가지 레이아웃 패턴.
vg-layout에서 장면 설계 시 이 패턴들을 적극 활용할 것.

---

## 1. 인물 원형 사진 (person-circle-hero)

**언제**: 인물이 등장할 때 (카파시, 보리스, chenglou 등)
**구조**: Split(1:2) — 왼쪽에 원형 사진, 오른쪽에 숫자/텍스트

```json
{
  "type": "Split", "layout": {"ratio": [1, 2], "gap": 40, "maxWidth": 1100},
  "children": [
    {"type": "ImageAsset", "data": {"src": "icons/{pid}/{name}.png", "shape": "circle", "maxHeight": 220}},
    {"type": "Stack", "layout": {"direction": "column", "gap": 12, "align": "start"}, "children": [
      {"type": "Headline", "data": {"text": "카파시", "size": "xl"}},
      {"type": "BodyText", "data": {"text": "OpenAI 공동창업 · 테슬라 AI 총괄"}}
    ]}
  ]
}
```

**적합 semantic_shape**: hierarchy, evidence
**빈도 제한**: 영상당 최대 3회

---

## 2. 브랜드 로고 플로우 (brand-logo-flow)

**언제**: A사→B사 이직, 협업, 전환 스토리
**구조**: Split(1:1) — 양쪽에 로고 + 가운데 화살표

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 60, "maxWidth": 900},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 8}, "children": [
      {"type": "ImageAsset", "data": {"src": "icons/{pid}/meta.png", "shape": "rounded", "maxHeight": 120}},
      {"type": "BodyText", "data": {"text": "메타"}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 8}, "children": [
      {"type": "ImageAsset", "data": {"src": "icons/{pid}/anthropic.png", "shape": "rounded", "maxHeight": 120}},
      {"type": "BodyText", "data": {"text": "엔트로픽"}}
    ]}
  ]
}
```
**Kicker**: 인물명 (예: "보리스")
**적합 semantic_shape**: transformation, hierarchy

---

## 3. 아이콘 분할 비교 (icon-split-compare)

**언제**: 두 개념의 대비 (마케팅 vs 내부, 오해 vs 사실)
**구조**: Split(1:1) — 좌우 각각 아이콘 헤더 + BulletList

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1100},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 16}, "children": [
      {"type": "CheckMark", "data": {"label": "?", "variant": "accent"}},
      {"type": "Headline", "data": {"text": "AI 마케팅", "size": "md"}},
      {"type": "BulletList", "data": {"items": ["과장 광고겠지", "숫자만 그럴싸한"]}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 16}, "children": [
      {"type": "CheckMark", "data": {"label": "확인", "variant": "success"}},
      {"type": "Headline", "data": {"text": "실제 내부", "size": "md"}},
      {"type": "BulletList", "data": {"items": ["실제 엔지니어 증언", "측정 가능한 결과"], "variant": "check"}}
    ]}
  ]
}
```
**적합 semantic_shape**: contrast

---

## 4. 번호 그리드 카탈로그 (numbered-grid)

**언제**: N가지 항목 나열 (12가지 인사이트, 7가지 단계)
**구조**: Grid(columns:3~4) + Badge 번호

```json
{
  "type": "Grid", "layout": {"columns": 4, "gap": 16, "maxWidth": 1100},
  "children": [
    {"type": "Badge", "data": {"text": "01"}},
    {"type": "Badge", "data": {"text": "02"}},
    ...
  ]
}
```
**Headline**: "N가지 인사이트" (Grid 위에 배치)
**적합 semantic_shape**: cluster, summary

---

## 5. 섹션 번호 + 비교 바 (section-number-bars)

**언제**: 뉴스 번호 + 핵심 주장 + 데이터 비교
**구조**: ImpactStat(큰 "01") + Headline + CompareBars

```json
{
  "children": [
    {"type": "ImpactStat", "data": {"value": "01", "label": ""}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "Headline", "data": {"text": "코딩은 해결된 문제", "size": "lg"}},
    {"type": "CompareBars", "data": {"items": [{"label": "전통 개발", "value": 100}, {"label": "AI 설명", "value": 100}]}}
  ]
}
```
**적합 semantic_shape**: metric, evidence

---

## 6. 사례 플로우 (case-study-flow)

**언제**: 실제 사례 소개 (앱 이름 + 과정)
**구조**: 아이콘 + Hero 텍스트 + FlowDiagram(3단계)

```json
{
  "children": [
    {"type": "Kicker", "data": {"text": "실제 사례"}},
    {"type": "Headline", "data": {"text": "10분기타", "size": "xl"}},
    {"type": "FlowDiagram", "data": {"steps": [{"label": "컴공 X"}, {"label": "만들어줘"}, {"label": "앱 출시"}]}}
  ]
}
```
**적합 semantic_shape**: flow, transformation

---

## 7. 패러다임 분할 (paradigm-split)

**언제**: 옛 방식 vs 새 방식, 단순도구 vs 전환
**구조**: Split + SvgGraphic 아이콘(✗/●) + 중앙 선언 텍스트

SC7에서 관찰: 좌측 ✗ + "단순 도구" / 우측 ● + "패러다임 전환" + 중앙 "시대가 바뀌었습니다"

**적합 semantic_shape**: contrast, transformation

---

## 8. 경고 전환 (alert-transition)

**언제**: 장 전환, 경고 메시지
**구조**: 중앙 SvgGraphic(삼각형 경고) + Badge("2번째 인사이트") + BodyText

SC8에서 관찰: 최소 요소, 강한 시각 임팩트, pause 용도

**적합 semantic_shape**: pause, symbol
**빈도**: 영상당 2~3회 (장 전환에만)

---

## 9. 수직 아이콘 타임라인 (vertical-icon-timeline)

**언제**: 단계별 행동 나열 (탐색→분석→결과)
**구조**: AnimatedTimeline(steps with icons)

SC9에서 관찰: 아이콘 원 + 세로 연결선 + 각 단계 제목+설명

**적합 semantic_shape**: flow, sequence

---

## 10. 페르소나 아이콘 (persona-icons)

**언제**: 역할/직업 소개 (기획자, PM, 개발자)
**구조**: Stack(row) + SvgGraphic(사람 실루엣) + Badge 아래

SC10에서 관찰: 추상 원형 + 반원 = 사람, 여러 명 나란히

**적합 semantic_shape**: cluster, hierarchy

---

## 11. 비용 비교 카드 (cost-compare-card)

**언제**: 가격/비용 비교 (연봉 vs AI 비용)
**구조**: Split(1:2) — 인물+숫자 왼쪽 + CompareBars 오른쪽

SC15에서 관찰: Badge(순서) + 인물 아이콘 + hero 금액 + 두 줄 비교 바

**적합 semantic_shape**: metric, contrast

---

## 12. 파이프라인 하이라이트 (pipeline-highlight)

**언제**: 프로세스 중 특정 단계 강조
**구조**: Stack(row) + NumberCircle 여러 개 (1개만 accent 컬러)

SC25에서 관찰: 7개 원 → 화살표 → "코딩"만 민트색

```json
{
  "type": "Stack", "layout": {"direction": "row", "gap": 8, "maxWidth": 1100, "align": "center", "justify": "center"},
  "children": [
    {"type": "NumberCircle", "data": {"number": 1, "label": "기획"}},
    {"type": "NumberCircle", "data": {"number": 2, "label": "설계"}},
    {"type": "NumberCircle", "data": {"number": 3, "label": "코딩"}, "style": {"accent": true}},
    ...
  ]
}
```
**적합 semantic_shape**: flow, hierarchy

---

## 13. 허브-스포크 (hub-spoke)

**언제**: 중앙 개념 + 주변 연결 (팀 → 문서, 검토 체계)
**구조**: SvgGraphic(중앙 아이콘 + 방사선) + BodyText

SC40에서 관찰: 4명 사람 아이콘 → 중앙 폴더로 점선 연결

**적합 semantic_shape**: hierarchy, cluster

---

## 14. 컬러 불릿 리스트 (color-bullet-list)

**언제**: 3가지 핵심 포인트 (짧은 문장)
**구조**: BulletList + 각 항목 앞 컬러 바

SC50에서 관찰: 민트+노랑+민트 바 + "작은 작업 하나 / 짧은 규칙 / 사람의 확인"

**적합 semantic_shape**: cluster, summary

---

## 15. 랭킹 피처 리스트 (ranking-feature-list)

**언제**: 기능 비교 + 순위 (1등 뱃지)
**구조**: Grid(1col) + IconCard(아이콘+제목+설명) + Badge(1등)

SC55에서 관찰: 3개 행, 각각 아이콘 왼쪽 + 제목/설명 + 오른쪽 1등 뱃지

**적합 semantic_shape**: cluster, evidence

---

## 16. 센터 개념도 (center-concept)

**언제**: 추상 개념 1개 시각화 (같은 기준, 팀워크)
**구조**: SvgGraphic(중앙 일러스트) + BodyText

SC40에서 관찰: 최소한의 선 그래픽 + 한 줄 설명

**적합 semantic_shape**: symbol, pause

---

## 17. before-after 전환 (before-after-shift)

**언제**: 변화, 개선, 업그레이드, 이력/전환 ("이전에는", "지금은", "예전엔", "바뀌었다")
**구조 A — 카드→카드 이력 전환**: Split(arrow) — 좌측 어두운 카드(이전) + 우측 강조색 카드(현재)
**구조 B — 개념 전환**: Split(line) — 좌측 ✗아이콘+부정 텍스트 + 우측 ◎아이콘+긍정 텍스트 + 중앙 전환 선언

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1100, "variant": "arrow"},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 12}, "children": [
      {"type": "CheckMark", "data": {"label": "✗", "variant": "accent"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
      {"type": "Headline", "data": {"text": "단순 도구", "size": "md"}, "motion": {"preset": "fadeUp", "enterAt": 10}},
      {"type": "BodyText", "data": {"text": "AI가 코드 좀 도와줬다는 수준"}, "motion": {"preset": "fadeUp", "enterAt": 20}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 12}, "children": [
      {"type": "CheckMark", "data": {"label": "◎", "variant": "success"}, "motion": {"preset": "scaleIn", "enterAt": 60}},
      {"type": "Headline", "data": {"text": "패러다임 전환", "size": "md"}, "motion": {"preset": "fadeUp", "enterAt": 70}},
      {"type": "BodyText", "data": {"text": "코딩은 더 이상 인간이 해야 하는 일이 아닌"}, "motion": {"preset": "fadeUp", "enterAt": 80}}
    ]}
  ]
}
```
**Kicker**: "시대가 바뀌었습니다" (전환 선언)
**적합 semantic_shape**: transformation, contrast
**빈도 제한**: 영상당 최대 2회

---

## 18. 인용 히어로 3단 (quote-hero-3tier)

**언제**: 강한 한 문장, 선언, 철학, 핵심 개념 소개 (따옴표, "핵심은", "한마디로")
**구조**: Stack(column) — 아이콘 + 히어로 텍스트(강조색, 대형) + 부제(회색)

```json
{
  "children": [
    {"type": "DevIcon", "data": {"name": "ClaudeAI", "size": 80}, "motion": {"preset": "scaleIn", "enterAt": 0, "duration": 15}, "style": {"filter": "drop-shadow(0 0 12px rgba(0,255,136,0.4))"}},
    {"type": "MarkerHighlight", "data": {"text": "프롬프트 엔지니어링", "fontSize": 56}, "motion": {"preset": "fadeUp", "enterAt": 15}},
    {"type": "BodyText", "data": {"text": "AI에게 일을 시키는 새로운 문법"}, "motion": {"preset": "fadeUp", "enterAt": 30}}
  ]
}
```
**적합 semantic_shape**: symbol, evidence
**빈도 제한**: 영상당 최대 3회

---

## 19. 페르소나 공감 선언 (persona-empathy)

**언제**: 타겟 오디언스의 감정을 지목하고 공감 ("기획자분들", "그 불편함", "맞는 감각이에요")
**구조**: Stack(column) — 타겟 라벨 + PersonAvatar 2개(row) + 경고 Badge + 공감 선언 텍스트

```json
{
  "children": [
    {"type": "Kicker", "data": {"text": "기획자 · 프로덕트 매니저 분들"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "Stack", "layout": {"direction": "row", "gap": 40, "align": "center", "justify": "center"}, "children": [
      {"type": "PersonAvatar", "data": {"label": "기획자"}, "motion": {"preset": "scaleIn", "enterAt": 15}},
      {"type": "PersonAvatar", "data": {"label": "PM"}, "motion": {"preset": "scaleIn", "enterAt": 25}}
    ]},
    {"type": "Badge", "data": {"text": "⚠ 지금 느끼시는 그 불편함"}, "motion": {"preset": "popBadge", "enterAt": 60}},
    {"type": "MarkerHighlight", "data": {"text": "그게 맞는 감각이에요", "fontSize": 42}, "motion": {"preset": "fadeUp", "enterAt": 90}}
  ]
}
```
**적합 semantic_shape**: symbol, evidence
**빈도 제한**: 영상당 최대 2회 (hook 장면 전용)

---

## 20. 오해 깨기 대화 (myth-chatbubble)

**언제**: 오해 vs 사실, 반전 ("많이들 착각하는데", "사실은", "오해")
**구조**: Split(line) — 좌측 사용자 말풍선(흰색 톤) + 우측 AI 반론 말풍선(강조색 톤)

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1100, "variant": "line"},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 12}, "children": [
      {"type": "PersonAvatar", "data": {"label": "사용자"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
      {"type": "ChatBubble", "data": {"messages": [{"sender": "사용자", "text": "일정 알림 앱 만들어줘", "side": "left"}]}, "motion": {"preset": "fadeUp", "enterAt": 15}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 12}, "children": [
      {"type": "DevIcon", "data": {"name": "ClaudeAI", "size": 60}, "motion": {"preset": "scaleIn", "enterAt": 60}},
      {"type": "ChatBubble", "data": {"messages": [{"sender": "AI", "text": "잠깐요! 그건 알림 앱이 아니에요", "side": "right"}]}, "motion": {"preset": "fadeUp", "enterAt": 75}}
    ]}
  ]
}
```
**적합 semantic_shape**: contrast
**빈도 제한**: 영상당 최대 2회

---

## 21. Do/Don't 대비 바 (do-dont-bars)

**언제**: 가이드라인, 행동 규칙, 조건 유무에 따른 결과 대비 ("하지 말고", "대신", "줄 때/안 줄 때")
**구조**: Split(line) — 좌측 ✓+프로그레스바+숫자 + 우측 ✗+프로그레스바+숫자

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1100, "variant": "line"},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 16}, "children": [
      {"type": "CheckMark", "data": {"label": "규칙 있음", "variant": "success"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
      {"type": "ProgressBar", "data": {"value": 90, "label": "코드 품질"}, "motion": {"preset": "fadeUp", "enterAt": 20}},
      {"type": "ImpactStat", "data": {"value": "90", "suffix": "%"}, "motion": {"preset": "popNumber", "enterAt": 40}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 16}, "children": [
      {"type": "CheckMark", "data": {"label": "규칙 없음", "variant": "accent"}, "motion": {"preset": "fadeUp", "enterAt": 60}},
      {"type": "ProgressBar", "data": {"value": 30, "label": "코드 품질"}, "motion": {"preset": "fadeUp", "enterAt": 80}},
      {"type": "ImpactStat", "data": {"value": "30", "suffix": "%"}, "motion": {"preset": "popNumber", "enterAt": 100}}
    ]}
  ]
}
```
**적합 semantic_shape**: contrast
**빈도 제한**: 영상당 최대 2회

---

## 22. 입력→출력 플로우 (input-output-flow)

**언제**: 입력→처리→출력 변환 ("넣으면", "거치고", "결과로", "출력")
**구조 A — 수직 2단**: Stack(column) — 프롬프트 입력창(강조 테두리) + 응답 카드(회색)
**구조 B — 수평 3단 + 다중 출력**: Stack(row) — Input아이콘 → 처리아이콘(강조) → Output뱃지 × 3

```json
{
  "type": "Stack", "layout": {"direction": "row", "gap": 24, "maxWidth": 1100, "align": "center", "justify": "center"},
  "children": [
    {"type": "FrameBox", "layout": {"maxWidth": 280, "gap": 8}, "children": [
      {"type": "DevIcon", "data": {"name": "Image", "size": 60, "label": "사진 1장"}, "motion": {"preset": "fadeUp", "enterAt": 0}}
    ]},
    {"type": "ArrowConnector", "data": {"direction": "right"}, "motion": {"preset": "fadeUp", "enterAt": 20}},
    {"type": "DevIcon", "data": {"name": "ClaudeAI", "size": 80}, "motion": {"preset": "scaleIn", "enterAt": 30}, "style": {"filter": "drop-shadow(0 0 12px rgba(0,255,136,0.4))"}},
    {"type": "ArrowConnector", "data": {"direction": "right"}, "motion": {"preset": "fadeUp", "enterAt": 45}},
    {"type": "Stack", "layout": {"direction": "column", "gap": 8}, "children": [
      {"type": "Badge", "data": {"text": "A. 브랜드 분석"}, "motion": {"preset": "fadeUp", "enterAt": 55}},
      {"type": "Badge", "data": {"text": "B. 색상 추출"}, "motion": {"preset": "fadeUp", "enterAt": 65}},
      {"type": "Badge", "data": {"text": "C. 레이아웃 제안"}, "motion": {"preset": "fadeUp", "enterAt": 75}}
    ]}
  ]
}
```
**적합 semantic_shape**: transformation, flow

---

## 23. 합류 플로우 (convergence-flow)

**언제**: 두 개념이 합쳐져 하나가 됨 ("A와 B가 만나서", "결합", "융합")
**구조**: Stack(row) — 좌측 아이콘(빈 원) + 중앙 아이콘(채워진 원, 합류점) + 우측 아이콘(빈 원) + ArrowConnector

```json
{
  "type": "Stack", "layout": {"direction": "row", "gap": 32, "maxWidth": 900, "align": "center", "justify": "center"},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 8}, "children": [
      {"type": "NumberCircle", "data": {"number": "?", "label": "철학"}, "motion": {"preset": "fadeUp", "enterAt": 0}}
    ]},
    {"type": "ArrowConnector", "data": {"direction": "right"}, "motion": {"preset": "fadeUp", "enterAt": 20}},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 8}, "children": [
      {"type": "DevIcon", "data": {"name": "ClaudeAI", "size": 100, "label": "제품"}, "motion": {"preset": "scaleIn", "enterAt": 30}, "style": {"filter": "drop-shadow(0 0 12px rgba(0,255,136,0.4))"}}
    ]},
    {"type": "ArrowConnector", "data": {"direction": "left"}, "motion": {"preset": "fadeUp", "enterAt": 40}},
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 8}, "children": [
      {"type": "NumberCircle", "data": {"number": "{ }", "label": "기술"}, "motion": {"preset": "fadeUp", "enterAt": 50}}
    ]}
  ]
}
```
**FooterCaption**: "소크라테스가 프로그래밍을 배운 거예요"
**적합 semantic_shape**: transformation, hierarchy

---

## 24. 교차 검증 (cross-verify)

**언제**: 2개 에이전트/관점이 하나의 산출물을 동시에 검토 ("교차 검증", "피어리뷰", "다중 에이전트")
**구조**: Split(line) — 좌측 AI-A아이콘 + 우측 AI-B아이콘 + 중앙 산출물 FrameBox

```json
{
  "type": "Stack", "layout": {"direction": "row", "gap": 24, "maxWidth": 1100, "align": "center", "justify": "center"},
  "children": [
    {"type": "DevIcon", "data": {"name": "ClaudeAI", "size": 80, "label": "AI-A"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "ArrowConnector", "data": {"direction": "right"}, "motion": {"preset": "fadeUp", "enterAt": 15}},
    {"type": "FrameBox", "layout": {"maxWidth": 300, "gap": 12}, "data": {"variant": "border-accent"}, "children": [
      {"type": "Headline", "data": {"text": "디자인", "size": "lg"}, "motion": {"preset": "scaleIn", "enterAt": 30}}
    ]},
    {"type": "ArrowConnector", "data": {"direction": "left"}, "motion": {"preset": "fadeUp", "enterAt": 45}},
    {"type": "DevIcon", "data": {"name": "OpenAI", "size": 80, "label": "AI-B"}, "motion": {"preset": "fadeUp", "enterAt": 55}}
  ]
}
```
**Kicker**: "교차 검증"
**적합 semantic_shape**: hierarchy, evidence

---

## 25. 도넛 숫자 히어로 (donut-stat-hero)

**언제**: 비율/퍼센트를 도넛 차트로 강조 + 내역을 리스트로 풀어서 설명
**구조**: Split(gap) — 좌측 RingChart(대형, 강조색) + 우측 BulletList(내역)

```json
{
  "type": "Split", "layout": {"ratio": [1, 2], "gap": 40, "maxWidth": 1100},
  "children": [
    {"type": "RingChart", "data": {"value": 92, "label": "AI 도구 사용률", "size": 280}, "motion": {"preset": "scaleIn", "enterAt": 0}},
    {"type": "Stack", "layout": {"direction": "column", "gap": 16, "align": "start"}, "children": [
      {"type": "Headline", "data": {"text": "개발자 AI 도구 채택", "size": "lg"}, "motion": {"preset": "fadeUp", "enterAt": 20}},
      {"type": "BulletList", "data": {"items": ["매일 사용하는 개발자 92%", "코드 41%를 AI가 생성", "생산성 2배 이상 향상"], "variant": "check"}, "motion": {"preset": "fadeUp", "enterAt": 40}}
    ]}
  ]
}
```
**적합 semantic_shape**: metric, evidence
**빈도 제한**: 영상당 최대 3회

---

## 26. 도넛+행동 분할 (donut-split-action)

**언제**: 숫자(얼마나) + 행동(어떻게)을 한 장면에 동시 전달
**구조**: Split(line) — 좌측 RingChart + 우측 CheckMark 리스트

```json
{
  "type": "Split", "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1100, "variant": "line"},
  "children": [
    {"type": "Stack", "layout": {"direction": "column", "align": "center", "gap": 12}, "children": [
      {"type": "Kicker", "data": {"text": "사업 도입 시"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
      {"type": "RingChart", "data": {"value": 80, "label": "비용 절감", "size": 240}, "motion": {"preset": "scaleIn", "enterAt": 10}}
    ]},
    {"type": "Stack", "layout": {"direction": "column", "gap": 16, "align": "start"}, "children": [
      {"type": "CheckMark", "data": {"label": "전부 비싼 모델 → 필요 없다", "variant": "success"}, "motion": {"preset": "fadeUp", "enterAt": 60}},
      {"type": "CheckMark", "data": {"label": "용도별 모델 선택 → 비용 최적화", "variant": "success"}, "motion": {"preset": "fadeUp", "enterAt": 80}}
    ]}
  ]
}
```
**적합 semantic_shape**: metric, evidence

---

## 27. 수평 타임라인 (timeline-horizontal)

**언제**: 시간 흐름, 역사, 출시 순서 (연도, "초기", "중반", "최근")
**구조**: AnimatedTimeline(direction: horizontal) + 현재 시점만 강조색 Badge

```json
{
  "children": [
    {"type": "Kicker", "data": {"text": "AI 타임라인"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "AnimatedTimeline", "data": {
      "direction": "horizontal",
      "steps": [
        {"label": "2020", "desc": "GPT-3 등장"},
        {"label": "2023", "desc": "ChatGPT 폭발"},
        {"label": "2025", "desc": "바이브코딩 시대", "icon": "star"}
      ],
      "stepEnterAts": [15, 60, 120]
    }, "motion": {"preset": "fadeUp", "enterAt": 15}},
    {"type": "MarkerHighlight", "data": {"text": "뒤늦게 후회하는 사람들", "fontSize": 36}, "motion": {"preset": "fadeUp", "enterAt": 180}}
  ]
}
```
**적합 semantic_shape**: flow, evidence
**빈도 제한**: 영상당 최대 2회

---

## 28. 우선도 체크리스트 (checklist-graded)

**언제**: 조건, 점검 항목, 준비물 ("확인해야", "체크", "조건", "이것만은 꼭")
**구조**: Stack(column) — 넘버 뱃지(색상 그라데이션: 빨→노→초) + 라벨 + 보조설명

```json
{
  "children": [
    {"type": "Headline", "data": {"text": "이것만은 꼭 지켜주세요", "size": "lg"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "Stack", "layout": {"direction": "column", "gap": 20, "maxWidth": 900}, "children": [
      {"type": "Stack", "layout": {"direction": "row", "gap": 16, "align": "center"}, "children": [
        {"type": "NumberCircle", "data": {"number": 1, "label": ""}, "style": {"color": "#ff4444"}, "motion": {"preset": "popBadge", "enterAt": 20}},
        {"type": "Stack", "layout": {"direction": "column", "gap": 4}, "children": [
          {"type": "Headline", "data": {"text": "프롬프트에 맥락을 넣어라", "size": "sm"}, "motion": {"preset": "fadeUp", "enterAt": 25}},
          {"type": "BodyText", "data": {"text": "AI는 독심술사가 아니다"}, "motion": {"preset": "fadeUp", "enterAt": 30}}
        ]}
      ]},
      {"type": "Stack", "layout": {"direction": "row", "gap": 16, "align": "center"}, "children": [
        {"type": "NumberCircle", "data": {"number": 2, "label": ""}, "style": {"color": "#ffaa00"}, "motion": {"preset": "popBadge", "enterAt": 80}},
        {"type": "Stack", "layout": {"direction": "column", "gap": 4}, "children": [
          {"type": "Headline", "data": {"text": "결과를 반드시 검증하라", "size": "sm"}, "motion": {"preset": "fadeUp", "enterAt": 85}},
          {"type": "BodyText", "data": {"text": "AI 출력은 초안이지 완성이 아니다"}, "motion": {"preset": "fadeUp", "enterAt": 90}}
        ]}
      ]},
      {"type": "Stack", "layout": {"direction": "row", "gap": 16, "align": "center"}, "children": [
        {"type": "NumberCircle", "data": {"number": 3, "label": ""}, "style": {"color": "#00ff88"}, "motion": {"preset": "popBadge", "enterAt": 140}},
        {"type": "Stack", "layout": {"direction": "column", "gap": 4}, "children": [
          {"type": "Headline", "data": {"text": "작게 시작하라", "size": "sm"}, "motion": {"preset": "fadeUp", "enterAt": 145}},
          {"type": "BodyText", "data": {"text": "한 번에 전부 시키면 실패한다"}, "motion": {"preset": "fadeUp", "enterAt": 150}}
        ]}
      ]}
    ]}
  ]
}
```
**적합 semantic_shape**: cluster, flow
**빈도 제한**: 영상당 최대 2회

---

## 29. 퍼널 페르소나 (funnel-persona)

**언제**: 넓은 대상에서 구체적 1명으로 좁혀가는 타겟팅 ("구체적으로 누구한테?", "밤에 잠을 못 자요?")
**구조**: Stack(column) — 질문 Headline + FunnelDiagram(3단) + PersonAvatar + 감정 훅

```json
{
  "children": [
    {"type": "Headline", "data": {"text": "구체적으로 누구한테 필요한가?", "size": "lg", "emphasis": ["누구"]}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "FunnelDiagram", "data": {"steps": [{"label": "마케팅팀"}, {"label": "중소기업"}, {"label": "한 사람"}]}, "motion": {"preset": "fadeUp", "enterAt": 30}},
    {"type": "PersonAvatar", "data": {"label": ""}, "motion": {"preset": "scaleIn", "enterAt": 90}},
    {"type": "MarkerHighlight", "data": {"text": "뭐 때문에 밤에 잠을 못 자요?", "fontSize": 36}, "motion": {"preset": "fadeUp", "enterAt": 120}}
  ]
}
```
**적합 semantic_shape**: hierarchy
**빈도 제한**: 영상당 최대 1회

---

## 30. 다축 도넛 스코어카드 (scorecard-donut-3)

**언제**: 3개 축으로 동시 평가 ("성능, 비용, 편의성", "N가지만 설정")
**구조**: Stack(row) — RingChart × 3 수평 등간격 (색상: 초→노→빨 그라데이션)

```json
{
  "children": [
    {"type": "Kicker", "data": {"text": "딱 3가지만 설정하세요"}, "motion": {"preset": "fadeUp", "enterAt": 0}},
    {"type": "Stack", "layout": {"direction": "row", "gap": 40, "maxWidth": 1100, "align": "center", "justify": "center"}, "children": [
      {"type": "RingChart", "data": {"value": 95, "label": "정확도", "size": 200}, "motion": {"preset": "scaleIn", "enterAt": 15}},
      {"type": "RingChart", "data": {"value": 70, "label": "속도", "size": 200}, "motion": {"preset": "scaleIn", "enterAt": 35}},
      {"type": "RingChart", "data": {"value": 40, "label": "비용", "size": 200}, "motion": {"preset": "scaleIn", "enterAt": 55}}
    ]},
    {"type": "FooterCaption", "data": {"text": "정확도는 높고, 비용은 낮게"}, "motion": {"preset": "fadeUp", "enterAt": 90}}
  ]
}
```
**적합 semantic_shape**: metric, cluster
**빈도 제한**: 영상당 최대 2회
