# SVG Accents — SVG 악센트 사전

SvgGraphic 노드에서 사용하는 **간결한 시각 요소** 패턴.
복잡한 일러스트가 아닌, 구조를 잇거나 의미를 강조하는 **악센트** 역할.

## 절대 원칙

1. **요소 5개 이하** — 6개 넘으면 기존 노드(FlowDiagram, CompareBars 등) 사용
2. **졸라맨(인물 실루엣) 금지** — 사람은 Icon(users) 노드로
3. **모든 stroke에 `strokeLinecap:"round"`, `strokeLinejoin:"round"`**
4. **strokeWidth 최소 3.0** (보조선 2.0)
5. **drawMode: true** 기본 — VideoScribe 스타일 드로잉

## 화살표 표준 패턴

### 수평 화살표 (가장 자주 사용)
```json
{ "tag": "path", "attrs": {
  "d": "M200 150 L370 150 M350 135 L375 150 L350 165",
  "fill": "none", "strokeWidth": 3, "strokeLinecap": "round", "strokeLinejoin": "round"
}, "themeColor": "accent" }
```
**핵심:** 화살표 머리는 별도 `M`으로 시작하는 V자 — `M350 135 L375 150 L350 165`

### 수직 화살표 (아래 방향)
```json
{ "tag": "path", "attrs": {
  "d": "M300 100 L300 250 M285 230 L300 255 L315 230",
  "fill": "none", "strokeWidth": 3, "strokeLinecap": "round", "strokeLinejoin": "round"
}, "themeColor": "accent" }
```

### 양방향 화살표
```json
{ "tag": "path", "attrs": {
  "d": "M175 150 L165 135 M175 150 L165 165 M175 150 L425 150 M415 135 L425 150 L415 165",
  "fill": "none", "strokeWidth": 3, "strokeLinecap": "round", "strokeLinejoin": "round"
}, "themeColor": "accent" }
```

## 마크 악센트

### X 마크 (거부/실패)
```json
{ "tag": "path", "attrs": {
  "d": "M-15 -15 L15 15 M15 -15 L-15 15",
  "fill": "none", "strokeWidth": 4, "strokeLinecap": "round", "stroke": "#EF4444"
}}
```
**크기 조절:** 좌표를 중심점 기준 ±15~25로 조절

### 체크 마크 (긍정/완료)
```json
{ "tag": "path", "attrs": {
  "d": "M-12 2 L-3 12 L15 -10",
  "fill": "none", "strokeWidth": 4, "strokeLinecap": "round", "strokeLinejoin": "round"
}, "themeColor": "accent" }
```

### 물음표 (질문/의문)
```json
[
  { "tag": "path", "attrs": {
    "d": "M-8 -18 A12 12 0 1 1 0 0 L0 8",
    "fill": "none", "strokeWidth": 3, "strokeLinecap": "round"
  }, "themeColor": "accentBright" },
  { "tag": "circle", "attrs": { "cx": 0, "cy": 18, "r": 3 }, "themeColor": "accentBright" }
]
```

## 구조선 악센트

### 수렴선 (여러 개 → 하나)
위에 N개 점에서 아래 1개 점으로 모이는 선.
```json
[
  { "tag": "line", "attrs": { "x1": 100, "y1": 0, "x2": 300, "y2": 100, "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "muted" },
  { "tag": "line", "attrs": { "x1": 300, "y1": 0, "x2": 300, "y2": 100, "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "muted" },
  { "tag": "line", "attrs": { "x1": 500, "y1": 0, "x2": 300, "y2": 100, "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "muted" }
]
```

### 분기선 (하나 → 여러 개)
수렴선의 반대. y 좌표를 뒤집으면 됨.

### 연결 점선
```json
{ "tag": "line", "attrs": {
  "x1": 100, "y1": 150, "x2": 500, "y2": 150,
  "strokeWidth": 2, "strokeDasharray": "8 6", "strokeLinecap": "round"
}, "themeColor": "muted" }
```

## 개념 골격 악센트

### 텍스트 줄 (문서 추상화)
```json
[
  { "tag": "rect", "attrs": { "x": 0, "y": 0, "width": 120, "height": 8, "rx": 4 }, "themeColor": "muted" },
  { "tag": "rect", "attrs": { "x": 0, "y": 16, "width": 100, "height": 8, "rx": 4 }, "themeColor": "muted" },
  { "tag": "rect", "attrs": { "x": 0, "y": 32, "width": 80, "height": 8, "rx": 4 }, "themeColor": "muted" }
]
```

### 문서 아이콘
```json
[
  { "tag": "rect", "attrs": { "x": 0, "y": 0, "width": 70, "height": 90, "rx": 6, "fill": "none", "strokeWidth": 2, "strokeLinecap": "round", "strokeLinejoin": "round" }, "themeColor": "accent" },
  { "tag": "path", "attrs": { "d": "M45 0 L70 25", "fill": "none", "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "accent" },
  { "tag": "rect", "attrs": { "x": 12, "y": 40, "width": 46, "height": 6, "rx": 3 }, "themeColor": "muted" },
  { "tag": "rect", "attrs": { "x": 12, "y": 54, "width": 36, "height": 6, "rx": 3 }, "themeColor": "muted" }
]
```

### 조직도 골격
```json
[
  { "tag": "rect", "attrs": { "x": 40, "y": 0, "width": 60, "height": 30, "rx": 6, "fill": "none", "strokeWidth": 2 }, "themeColor": "accent" },
  { "tag": "line", "attrs": { "x1": 70, "y1": 30, "x2": 70, "y2": 50, "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "muted" },
  { "tag": "line", "attrs": { "x1": 20, "y1": 50, "x2": 120, "y2": 50, "strokeWidth": 2, "strokeLinecap": "round" }, "themeColor": "muted" },
  { "tag": "rect", "attrs": { "x": 0, "y": 55, "width": 50, "height": 25, "rx": 4, "fill": "none", "strokeWidth": 2 }, "themeColor": "muted" },
  { "tag": "rect", "attrs": { "x": 90, "y": 55, "width": 50, "height": 25, "rx": 4, "fill": "none", "strokeWidth": 2 }, "themeColor": "muted" }
]
```

## 장식 악센트

### 음파 바 (사운드/오디오)
```json
[
  { "tag": "rect", "attrs": { "x": -20, "y": -15, "width": 6, "height": 30, "rx": 3 }, "themeColor": "accent" },
  { "tag": "rect", "attrs": { "x": -8, "y": -25, "width": 6, "height": 50, "rx": 3 }, "themeColor": "accentBright" },
  { "tag": "rect", "attrs": { "x": 4, "y": -35, "width": 6, "height": 70, "rx": 3 }, "themeColor": "accent" },
  { "tag": "rect", "attrs": { "x": 16, "y": -25, "width": 6, "height": 50, "rx": 3 }, "themeColor": "accentBright" },
  { "tag": "rect", "attrs": { "x": 28, "y": -15, "width": 6, "height": 30, "rx": 3 }, "themeColor": "accent" }
]
```

### 원형 테두리 (아이콘 감싸기)
```json
{ "tag": "circle", "attrs": {
  "cx": 0, "cy": 0, "r": 40, "fill": "none", "strokeWidth": 2.5, "strokeLinecap": "round"
}, "themeColor": "accent" }
```

## 사용 판단 기준

| 상황 | SVG 악센트 사용 | 기존 노드 사용 |
|------|-------------|------------|
| 화살표 1~2개 필요 | ✅ | — |
| 요소 연결선 | ✅ | — |
| X/체크 마크 | ✅ | CheckMark 노드도 가능 |
| 문서/아이콘 형상 | ✅ (3~4개) | Icon 노드도 가능 |
| 3단계 이상 흐름 | — | ✅ FlowDiagram |
| 비교 데이터 | — | ✅ CompareBars |
| 원형 비율 | — | ✅ RingChart, PieChart |
| 인물/캐릭터 | ❌ 절대 금지 | ✅ Icon(users) |
