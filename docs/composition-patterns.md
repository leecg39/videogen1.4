# Composition Patterns — 구성 패턴 카탈로그

레퍼런스 영상 분석에서 추출한 22종 구성 패턴.
vg-layout에서 씬 설계 시 이 목록에서 선택하여 변주한다.

## 핵심 원칙

1. **한 화면 = 하나의 메시지** — 노드 1~3개 + 캡션
2. **여백 > 50%** — 빽빽하면 실패
3. **Kicker→Headline→FooterCaption 3단 구조는 5씬 중 최대 1회**
4. **같은 패턴 2연속 금지** — 직전 씬과 다른 패턴 사용
5. **SvgGraphic = 악센트/구조선만** — 복잡한 일러스트 금지

## 패턴 카탈로그

### 1. 거부+대안 (contrast)
X 마크 + 취소 텍스트 → 긍정 대안 제시.
```
Stack > [
  X악센트 + "Premiere Pro" (취소선/muted)
  X악센트 + "After Effects" (취소선/muted)
  Icon(terminal) + "명령어 몇 줄" (accent)
]
```
**변주:** X/체크 조합, 색상 반전, 취소선 유무

### 2. 스탯 대시보드 (metric)
아이콘+큰 숫자+라벨을 2~4열로 병렬 배치.
```
Grid(3열) > [
  Icon(users) + ImpactStat("2만명") + "1달 만에 구독자"
  Icon(won) + ImpactStat("100만+") + "월수익"
  Icon(clock) + ImpactStat("3시간") + "하루 투자"
]
```
**변주:** 2/3/4열, Icon원/Icon사각, AnimatedCounter 사용

### 3. 번호 단계 — 원, 세로 (sequence)
NumberCircle + 라벨을 세로로 나열.
```
Stack(column) > [
  NumberCircle(1) + "대본 쓰기"
  NumberCircle(2) + "녹음하기"
  NumberCircle(3) + "편집하기"
]
```
**변주:** 원/박스, 아이콘 유무, 결론행 추가

### 4. 링 히어로 (fraction)
RingChart를 화면 중앙에 크게. 하나의 강한 비율 전달.
```
Kicker("유튜브 시작 후")
RingChart(value: 90, label: "포기", size: "large")
FooterCaption("3개월 안에 포기")
```
**변주:** 중앙 대형/측면 소형, 도넛/원형

### 5. 대비 바 (contrast)
CompareBars로 before/after 극적 차이 표현.
```
CompareBars([
  { label: "기존", value: 100, color: "#666" },
  { label: "자동화", value: 5, color: "#4ADE80" }
])
FooterCaption("그게 가능합니다")
```
**변주:** 수평/수직, 2개/3개, 색상쌍

### 6. 좌우 비교 — 단순 (contrast)
CompareCard로 A vs B 개념 대비.
```
CompareCard(
  left: { icon: "chef-hat", title: "수작업", subtitle: "직접 볶는다" },
  right: { icon: "server", title: "자동화", subtitle: "오븐이 굽는다" }
)
```
**변주:** VS텍스트/수직선, 아이콘 색상 대비(muted vs accent)

### 7. 시간 단계 — 박스 (sequence)
Badge(시간) + 텍스트를 세로로 나열, 마지막에 결론.
```
Stack(column) > [
  Badge("1분") + "제목을 띄워라"
  Badge("3분") + "그래프를 보여줘라"
  Badge("5분") + "다음 장면으로 넘겨라"
]
DualToneText("글로 적으면 영상이 완성")
```

### 8. 브랜드 히어로 (symbol)
ImageAsset을 화면 중앙에 크게 + 브랜드명.
```
ImageAsset(src: "assets/remotion.png", maxHeight: 200)
Kicker("2026.01.20")
Headline("AI × Remotion", size: "xl")
```

### 9. 흐름도 — 가로, 풍성 (sequence)
FlowDiagram으로 3~4단계 가로 흐름. 아이콘+숫자+라벨.
```
FlowDiagram(steps: [
  { label: "말로 설명", icon: "message-square" },
  { label: "AI가 작성", icon: "cpu" },
  { label: "영상 생성", icon: "video" }
])
```
**규칙:** 4단계 이하 → 아이콘 포함, 5단계 이상 → 라벨만

### 10. 허브-스포크 (hierarchy)
여러 요소가 하나로 수렴하는 구조.
```
Grid(5열) > [Icon+라벨] × 5
— SVG 수렴선 (line 3~5개) —
Icon(AI) + "AI"
```
**SVG:** 수렴/분기 연결선만 (요소 5개 이하)

### 11. 단일 포커스 (symbol)
하나의 개념에 화면 전체 집중. NumberCircle+Icon+악센트.
```
NumberCircle(2) + Icon(mic) + "목소리"
Kicker("TTS (Text-to-Speech)")
SvgGraphic(음파 바: rect 5개)
```

### 12. 파이프라인 — pill (sequence)
FlowDiagram을 라벨만으로 간결하게.
```
Kicker("영상 자동화 파이프라인")
FlowDiagram(steps: [
  { label: "주제" }, { label: "대본" }, { label: "목소리" },
  { label: "화면" }, { label: "자막" }, { label: "영상" }
])
```

### 13. 좌우 비교 — 리스트 (contrast)
Split + BulletList로 체크/X 항목 비교.
```
Split(1:1) > [
  "AI를 쓰는 것" + CheckIcon + BulletList(variant:"check", [...])
  "AI만 쓰는 것" + XIcon + BulletList(variant:"x", [...])
]
```

### 14. 번호+아이콘 — 세로 (sequence)
NumberCircle + Icon + 텍스트가 가로 1줄씩, 세로 나열.
```
Stack(column) > [
  Row: NumberCircle(1) + Icon(play) + "프로젝트 세팅"
  Row: NumberCircle(2) + Icon(message) + "코드에게 말하기"
  Row: NumberCircle(3) + Icon(sliders) + "디테일 잡기"
]
```

### 15. 질문 목록 (pause)
? 아이콘 + Pill(말풍선) 나열.
```
ImageAsset(브랜드, 작게)
Kicker("AI가 먼저 물어봐요")
Stack(column) > [
  Icon(?) + Pill("어떤 방식으로 로그인?")
  Icon(?) + Pill("이메일? 소셜 로그인?")
]
FooterCaption("2~3가지 방법 + 장단점 제안")
```

### 16. 주장+근거 적층 (evidence)
서로 다른 노드를 세로 적층. 위=주장, 아래=근거.
```
FlowDiagram(기준 정의 → 만들기 → 검증)
Kicker("발생 빈도")
CompareBars([기준 없이: 80, TDD 적용: 30])
```
**10초+ 긴 씬에서 사용**

### 17. 순환 다이어그램 (sequence)
CycleDiagram으로 순환 구조.
```
CycleDiagram(
  centerLabel: "팀장",
  steps: [{ label: "탐색" }, { label: "구현" }, { label: "검증" }]
)
```

### 18. 평가 리스트 (evidence)
텍스트 + ProgressBar + X/체크 조합.
```
Stack(column) > [
  "벤치마크 데이터 부재" + ProgressBar(60) + XIcon
  "프롬프트만으로 충분?" + ProgressBar(70) + XIcon
  "E2E 테스트 보완 필요" + ProgressBar(80) + CheckIcon
]
```

### 19. 변환 전/후 (transformation)
SVG 골격 + 화살표로 before/after 추상화.
```
Split(1:1) > [
  SvgGraphic(rect 3개 = 텍스트 줄) + "글자 몇 줄"
  SvgGraphic(rect+line = 조직도) + "도표 완성"
]
— 가운데: 화살표 + "자동 변환" —
```

### 20. 아이콘 그리드 (cluster)
SVG 미니 아이콘 + 라벨을 그리드로.
```
Grid(3열) > [
  SvgGraphic(문서아이콘) + "보고서"
  SvgGraphic(문서아이콘 변주) + "기획서"
  SvgGraphic(문서아이콘 변주) + "제안서"
]
Pill("프로세스 그려주세요") + Pill("조직도 넣어주세요")
```

### 21. 타임라인/간트 (sequence)
SvgGraphic으로 시간축 + 막대 배치.
```
SvgGraphic(
  왼쪽: rect 라벨 ("기획","개발","출시")
  상단: text ("1월"~"4월")
  본문: rect 바 (길이/색상 다름)
  마커: 점선 line ("TODAY")
)
```

### 22. 파이차트 (fraction)
PieChart로 비율 분배 시각화.
```
Kicker("네 번째: 파이차트")
PieChart(
  title: "업무 시간 분배",
  segments: [
    { label: "기획", value: 40, color: "#4ADE80" },
    { label: "개발", value: 35 },
    { label: "회의", value: 25 }
  ]
)
```

## semantic_shape → 패턴 매핑

| semantic_shape | 사용 가능 패턴 |
|---|---|
| contrast | 1(거부+대안), 5(대비바), 6(좌우단순), 13(좌우리스트) |
| sequence | 3(번호원), 7(시간박스), 9(흐름도), 12(파이프라인), 14(번호아이콘), 17(순환), 21(간트) |
| cluster | 2(스탯대시보드), 10(허브스포크), 20(아이콘그리드) |
| metric | 2(스탯대시보드), 4(링히어로), 5(대비바) |
| fraction | 4(링히어로), 22(파이차트) |
| hierarchy | 10(허브스포크) |
| transformation | 5(대비바), 19(변환전후) |
| pause | 11(단일포커스), 15(질문목록) |
| symbol | 8(브랜드히어로), 11(단일포커스) |
| evidence | 16(주장근거), 18(평가리스트) |
| summary | 3(번호원), 12(파이프라인), 13(좌우리스트) |
