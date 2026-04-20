#!/usr/bin/env python3
"""
deep-blue 프로젝트 stack_root 수동 설계.
37씬 각각에 의도적으로 다른 문법/노드 조합을 부여한다.
"""
import json

PID = "deep-blue"
FPS = 30

scenes_path = f"data/{PID}/scenes-v2.json"
data = json.load(open(scenes_path))
scenes = data["scenes"]

def sceneroot(children, padding="60px 100px 160px"):
    return {
        "id": "scene-root",
        "type": "SceneRoot",
        "layout": {"gap": 28, "padding": padding, "align": "center", "justify": "center"},
        "children": children,
    }

def head(text, size="xl", emphasis=None, enterAt=0, eid="hl"):
    return {
        "id": eid, "type": "Headline",
        "data": {"text": text, "size": size, **({"emphasis": emphasis} if emphasis else {})},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
    }

def kicker(text, enterAt=0, eid="k"):
    return {"id": eid, "type": "Kicker",
            "data": {"text": text},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 14}}

def body(text, enterAt=0, eid="bd"):
    return {"id": eid, "type": "BodyText",
            "data": {"text": text},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 16}}

def footer(text, enterAt, eid="ft"):
    return {"id": eid, "type": "FooterCaption",
            "data": {"text": text},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 14}}

def badge(text, enterAt=0, eid="bg"):
    return {"id": eid, "type": "Badge",
            "data": {"text": text},
            "motion": {"preset": "popBadge", "enterAt": enterAt, "duration": 14}}

def impactstat(value, suffix="", label="", enterAt=10, eid="st"):
    d = {"value": value}
    if suffix: d["suffix"] = suffix
    if label: d["label"] = label
    return {"id": eid, "type": "ImpactStat", "data": d,
            "motion": {"preset": "popNumber", "enterAt": enterAt, "duration": 22}}

def numcircle(number, label="", enterAt=0, eid="nc"):
    return {"id": eid, "type": "NumberCircle",
            "data": {"number": number, "label": label, "size": "lg"},
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 20}}

def marker(text, fontSize=56, enterAt=0, eid="mk"):
    return {"id": eid, "type": "MarkerHighlight",
            "data": {"text": text, "fontSize": fontSize},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18}}

def dual(segments, enterAt=0, eid="dt"):
    return {"id": eid, "type": "DualToneText",
            "data": {"segments": segments},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18}}

def quote(text, author="", enterAt=0, eid="qt"):
    d = {"text": text}
    if author: d["author"] = author
    return {"id": eid, "type": "QuoteText", "data": d,
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 20}}

def img(src, shape="rounded", maxHeight=320, circle=False, enterAt=0, eid="im"):
    d = {"src": src, "maxHeight": maxHeight, "shadow": True}
    if shape: d["shape"] = shape
    if circle: d["circle"] = True
    return {"id": eid, "type": "ImageAsset", "data": d,
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 22}}

def devicon(name, size=140, label="", circle=False, enterAt=0, eid="di"):
    d = {"name": name, "size": size}
    if label: d["label"] = label
    if circle: d["circle"] = True
    return {"id": eid, "type": "DevIcon", "data": d,
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 20}}

def split(left, right, ratio=(1,1), variant="gap", maxWidth=1240, gap=48, enterAt=0, eid="sp"):
    return {
        "id": eid, "type": "Split",
        "layout": {"ratio": list(ratio), "gap": gap, "maxWidth": maxWidth, "variant": variant},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
        "children": [left, right],
    }

def grid(items, columns=3, gap=28, maxWidth=1280, enterAt=0, eid="gd"):
    return {
        "id": eid, "type": "Grid",
        "layout": {"columns": columns, "gap": gap, "maxWidth": maxWidth},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
        "children": items,
    }

def stack_row(children, gap=40, enterAt=0, eid="sr"):
    return {
        "id": eid, "type": "Stack",
        "layout": {"direction": "row", "gap": gap, "align": "center", "justify": "center"},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
        "children": children,
    }

def stack_col(children, gap=24, maxWidth=1100, enterAt=0, eid="sc"):
    return {
        "id": eid, "type": "Stack",
        "layout": {"direction": "column", "gap": gap, "maxWidth": maxWidth, "align": "center"},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
        "children": children,
    }

def framebox(children, variant="filled-muted", maxWidth=1200, gap=20, enterAt=0, eid="fb"):
    return {
        "id": eid, "type": "FrameBox",
        "data": {"variant": variant},
        "layout": {"gap": gap, "maxWidth": maxWidth, "padding": "32px 40px"},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
        "children": children,
    }

def iconcard(icon, title, body, enterAt=0, eid="ic"):
    return {
        "id": eid, "type": "IconCard",
        "data": {"icon": icon, "title": title, "body": body},
        "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18},
    }

def checkmark(label, variant="accent", enterAt=0, eid="cm"):
    return {"id": eid, "type": "CheckMark",
            "data": {"label": label, "variant": variant},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 16}}

def bullets(items, variant="dot", enterAt=0, eid="bl"):
    return {"id": eid, "type": "BulletList",
            "data": {"items": items, "variant": variant},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18}}

def comparebars(items, maxWidth=1100, enterAt=0, eid="cb"):
    return {"id": eid, "type": "CompareBars",
            "data": {"items": items},
            "layout": {"maxWidth": maxWidth},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def ringchart(value, label, size=260, enterAt=0, eid="rc"):
    return {"id": eid, "type": "RingChart",
            "data": {"value": value, "label": label, "size": size},
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 24}}

def versus(leftLabel, rightLabel, leftValue="", rightValue="", enterAt=0, eid="vc"):
    d = {"leftLabel": leftLabel, "rightLabel": rightLabel}
    if leftValue: d["leftValue"] = leftValue
    if rightValue: d["rightValue"] = rightValue
    return {"id": eid, "type": "VersusCard", "data": d,
            "layout": {"maxWidth": 1280},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def flowdiag(steps, variant="box-chain", stepEnterAts=None, enterAt=0, eid="fd"):
    d = {"steps": steps, "variant": variant}
    if stepEnterAts: d["stepEnterAts"] = stepEnterAts
    return {"id": eid, "type": "FlowDiagram", "data": d,
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def cyclediag(steps, centerLabel, enterAt=0, eid="cy"):
    return {"id": eid, "type": "CycleDiagram",
            "data": {"steps": steps, "centerLabel": centerLabel},
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 22}}

def timeline(steps, stepEnterAts=None, enterAt=0, eid="tl"):
    d = {"steps": steps}
    if stepEnterAts: d["stepEnterAts"] = stepEnterAts
    return {"id": eid, "type": "AnimatedTimeline", "data": d,
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def chatbubbles(messages, enterAt=0, eid="cb"):
    return {"id": eid, "type": "ChatBubble",
            "data": {"messages": messages},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def progress(value, label, enterAt=0, eid="pr"):
    return {"id": eid, "type": "ProgressBar",
            "data": {"value": value, "label": label},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18}}

def scale_cmp(items, enterAt=0, eid="sc"):
    return {"id": eid, "type": "ScaleComparison",
            "data": {"items": items},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def split_reveal(beforeItems, afterItems, beforeLabel="이전", afterLabel="지금", enterAt=0, eid="sr"):
    return {"id": eid, "type": "SplitRevealCard",
            "data": {"beforeLabel": beforeLabel, "afterLabel": afterLabel,
                     "beforeItems": beforeItems, "afterItems": afterItems},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

def datatable(columns, rows, enterAt=0, eid="dt"):
    return {"id": eid, "type": "DataTable",
            "data": {"columns": columns, "rows": rows},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

ICONS = "icons/deep-blue"

# ============== 37씬 stack_root 설계 ==============
# 문법 분포 목표: 비카드 ≥15(40%), Split ≤11(30%), 나머지 Grid/Stack/Compound

LAYOUTS = [None] * 37

# [0] scene-0 — 인사 + 자기소개 (focal-only, hero-text)  비카드
LAYOUTS[0] = sceneroot([
    kicker("바이브랩스 이석현", enterAt=0),
    head("나는 이 세상을 오래 기다렸습니다", size="xl", emphasis=["오래"], enterAt=20),
    footer("바이브 코딩 시대를 기다린 개발자의 고백", enterAt=120),
])

# [1] scene-1 — 말→코드 / 주말→몇분 / 신났던 미래  복합(SplitReveal)
LAYOUTS[1] = sceneroot([
    kicker("내가 그리던 미래", enterAt=0),
    split_reveal(
        beforeLabel="예전",
        afterLabel="이제",
        beforeItems=["주말을 태우며 붙잡던 기능", "에러 한 줄에 몇 시간"],
        afterItems=["몇 분 만에 돌아가는 세상", "말로 꺼내면 코드가 즉시"],
        enterAt=20,
    ),
])

# [2] scene-2 — 도착한 미래, 환희 아닌 3가지 감정  복합(Grid 3카드)
LAYOUTS[2] = sceneroot([
    head("도착한 미래의 첫 감정", size="lg", enterAt=0),
    grid([
        iconcard("snowflake", "춥다", "익숙했던 열기가 사라졌다", enterAt=80),
        iconcard("circle-dashed", "비어 있다", "내 자리가 보이지 않는다", enterAt=140),
        iconcard("ghost", "허무하다", "이겼는데 싸운 적이 없다", enterAt=200),
    ], columns=3, gap=24, maxWidth=1320, enterAt=40),
])

# [3] scene-3 — Anthropic Claude Code Max $100  복합(Brand + Stat)
LAYOUTS[3] = sceneroot([
    kicker("AI 코딩 도구의 가속", enterAt=0),
    split(
        stack_col([
            devicon("Anthropic", size=140, label="Claude Code", enterAt=20),
            badge("Pro / Max 플랜", enterAt=70),
        ], gap=20),
        stack_col([
            impactstat("$100", suffix="/월", label="Max 시작가", enterAt=80),
            body("월 100달러로 무한에 가까운 컨텍스트", enterAt=160),
        ], gap=24),
        ratio=(1, 1.2), variant="line", maxWidth=1320, enterAt=10,
    ),
])

# [4] scene-4 — 더 길게/넓게/많이 (escalation flow)  복합(FlowDiagram)
LAYOUTS[4] = sceneroot([
    kicker("도구는 어떻게 진화하는가", enterAt=0),
    head("더 길게 · 더 넓게 · 더 많이", size="lg", emphasis=["더 길게","더 넓게","더 많이"], enterAt=20),
    flowdiag(
        steps=[
            {"label": "길게 생각", "icon": "brain"},
            {"label": "넓은 문맥", "icon": "expand"},
            {"label": "한 번에 처리", "icon": "layers"},
        ],
        variant="box-chain",
        stepEnterAts=[60, 160, 260],
        enterAt=40,
    ),
])

# [5] scene-5 — 옛 디버깅 cascade + 짜릿  복합(Timeline + Note)
LAYOUTS[5] = sceneroot([
    kicker("예전의 디버깅 의식", enterAt=0),
    timeline(
        steps=[
            {"label": "에러 로그 한 줄", "icon": "alert-triangle"},
            {"label": "콜스택 추적", "icon": "git-branch"},
            {"label": "문서 열기", "icon": "book"},
            {"label": "코드 뜯기", "icon": "wrench"},
            {"label": "또 깨지기", "icon": "x-circle"},
        ],
        stepEnterAts=[20, 70, 130, 200, 280],
        enterAt=10,
    ),
    footer("고통스러웠지만, 묘하게 짜릿했다", enterAt=360),
])

# [6] scene-6 — 문제를 해부하던 감각 + 한꺼번에 도착하는 결과  Split(arrow)
LAYOUTS[6] = sceneroot([
    split(
        stack_col([
            badge("예전", enterAt=0),
            head("문제를 해부", size="lg", enterAt=20),
            body("내가 직접 콜스택을 풀어보던 감각", enterAt=80),
        ], gap=20),
        stack_col([
            badge("지금", enterAt=110),
            head("결과가 한꺼번에", size="lg", emphasis=["한꺼번에"], enterAt=140),
            bullets(["수정안", "테스트", "예외 처리"], variant="check", enterAt=200),
        ], gap=20),
        ratio=(1, 1), variant="arrow", maxWidth=1300, enterAt=10,
    ),
])

# [7] scene-7 — 이겼는데 싸운 것 같지 않다  비카드 (focal-only Marker)
LAYOUTS[7] = sceneroot([
    kicker("승리의 묘한 공허", enterAt=0),
    marker("이겼는데, 싸운 적이 없다", fontSize=72, enterAt=20),
    footer("AI가 이긴 게임, 내가 본 풍경", enterAt=140),
])

# [8] scene-8 — 2026.01.08 Adam Leventhal Oxide podcast 명명  복합(Image+Stat)
LAYOUTS[8] = sceneroot([
    kicker("이름이 생긴 날", enterAt=0),
    split(
        img(f"{ICONS}/adam-leventhal.jpg", circle=True, maxHeight=240, enterAt=20),
        stack_col([
            badge("2026.01.08", enterAt=40),
            head("Adam Leventhal", size="lg", enterAt=80),
            body("Oxide and Friends 팟캐스트에서 즉석으로", enterAt=140),
        ], gap=18),
        ratio=(1, 1.6), variant="line", maxWidth=1280, enterAt=10,
    ),
])

# [9] scene-9 — Simon Willison 인용 + Adam의 한마디 "Like, deep blue"  비카드(인용)
LAYOUTS[9] = sceneroot([
    kicker("팟캐스트의 한 장면", enterAt=0),
    img(f"{ICONS}/simon-willison.jpg", circle=True, maxHeight=180, enterAt=20),
    quote("지금 소프트웨어 엔지니어들에게는 심리적으로 어려운 시기다", author="Simon Willison", enterAt=70),
    marker("Like, deep blue. You know?", fontSize=56, enterAt=240),
])

# [10] scene-10 — 권태와 두려움의 정의  복합(IconCard 2개)
LAYOUTS[10] = sceneroot([
    kicker("Simon이 정리한 정의", enterAt=0),
    head("심리적 권태 + 실존적 두려움", size="lg", emphasis=["권태","두려움"], enterAt=20),
    stack_row([
        framebox([
            badge("ennui", enterAt=80),
            body("같은 일이 반복되는데 의미가 비어가는 감각"),
        ], variant="border-accent", maxWidth=480, gap=14, enterAt=80),
        framebox([
            badge("dread", enterAt=160),
            body("내일도 내 자리가 있을지 흔들리는 감각"),
        ], variant="glass", maxWidth=480, gap=14, enterAt=160),
    ], gap=36, enterAt=60),
])

# [11] scene-11 — 1997 IBM Deep Blue vs Kasparov  복합(Image+Stat+Image)
LAYOUTS[11] = sceneroot([
    kicker("1997년 5월", enterAt=0),
    stack_row([
        stack_col([
            img(f"{ICONS}/deep-blue.jpg", maxHeight=220, enterAt=20),
            badge("IBM Deep Blue", enterAt=80),
        ], gap=14),
        stack_col([
            impactstat("3.5", suffix="–2.5", label="6국 매치", enterAt=140),
        ], gap=10),
        stack_col([
            img(f"{ICONS}/kasparov.jpg", circle=True, maxHeight=200, enterAt=200),
            badge("Garry Kasparov", enterAt=260),
        ], gap=14),
    ], gap=44, enterAt=10),
])

# [12] scene-12 — 인간 전문성 무너지는 장면 + 비슷  비카드(DualTone)
LAYOUTS[12] = sceneroot([
    kicker("그날 사람들이 본 장면", enterAt=0),
    dual([
        {"text": "인간의 전문성도 ", "tone": "muted"},
        {"text": "기계 앞에서 무너질 수 있다", "tone": "accent"},
    ], enterAt=20),
    footer("지금 개발자들이 느끼는 것도 이와 비슷하다", enterAt=140),
])

# [13] scene-13 — 3가지 자문 (cluster)  복합(Grid 3 + 마지막 quote)
LAYOUTS[13] = sceneroot([
    kicker("개발자의 자문", enterAt=0),
    grid([
        framebox([head("나는 지금도 유능한가?", size="md")], variant="border-neutral", maxWidth=380, enterAt=40),
        framebox([head("내 숙련은 이제 무엇이 되는가?", size="md")], variant="border-accent", maxWidth=380, enterAt=120),
        framebox([head("내 능력은 너무 싸져버린 건 아닌가?", size="md")], variant="glass", maxWidth=380, enterAt=200),
    ], columns=3, gap=22, maxWidth=1320, enterAt=20),
    marker("딥 블루 = 정체성의 떨림", fontSize=48, enterAt=290),
])

# [14] scene-14 — 비관에서 벗어나서 + 바둑이 그랬다  비카드(symbol 전환)
LAYOUTS[14] = sceneroot([
    kicker("비관 너머의 단서", enterAt=0),
    img(f"{ICONS}/go-board.svg", maxHeight=220, enterAt=20),
    head("바둑이 먼저 겪었다", size="xl", emphasis=["바둑"], enterAt=80),
    footer("그런데 그 뒤에 벌어진 일은 더 흥미롭다", enterAt=300),
])

# [15] scene-15 — 짧은 pause "더 흥미로운 일"  비카드 (focal marker)
LAYOUTS[15] = sceneroot([
    marker("더 흥미로운 일이 벌어졌다", fontSize=64, enterAt=0),
])

# [16] scene-16 — Lee Sedol 2019 + AlphaGo 이후 학습 도구  복합(Image+Quote+Bars)
LAYOUTS[16] = sceneroot([
    kicker("2019년 이세돌 9단의 은퇴", enterAt=0),
    split(
        stack_col([
            img(f"{ICONS}/lee-sedol.jpg", circle=True, maxHeight=240, enterAt=20),
            badge("이세돌", enterAt=80),
        ], gap=14),
        stack_col([
            quote("AI는 절대 이길 수 없는 존재가 됐다", author="이세돌, 2019", enterAt=70),
            comparebars(items=[
                {"label": "AlphaGo 이전", "value": 100, "color": "#94a3b8"},
                {"label": "AlphaGo 이후", "value": 138, "color": "#34d399"},
            ], maxWidth=520, enterAt=200),
            footer("프로 기사 의사결정 품질 — 연구가 보고한 향상폭", enterAt=300),
        ], gap=18),
        ratio=(1, 1.7), variant="line", maxWidth=1320, enterAt=10,
    ),
])

# [17] scene-17 — 자리 제거 → 방식 변경 (transformation)  비카드(VersusCard)
LAYOUTS[17] = sceneroot([
    kicker("AlphaGo가 남긴 진짜 변화", enterAt=0),
    versus("자리를 없앤 것", "방식을 바꾼 것",
           leftValue="≠", rightValue="=", enterAt=20),
    footer("기계는 인간이 잘하는 방식 자체를 갱신했다", enterAt=240),
])

# [18] scene-18 — Boris Cherny: largely solved / everyone codes  복합(Image+Quote)
LAYOUTS[18] = sceneroot([
    kicker("Anthropic 인터뷰", enterAt=0),
    split(
        stack_col([
            img(f"{ICONS}/boris-cherny.jpg", circle=True, maxHeight=220, enterAt=20),
            badge("Boris Cherny", enterAt=70),
            footer("Head of Claude Code", enterAt=120),
        ], gap=12),
        stack_col([
            quote("My kind of coding is largely solved", enterAt=40),
            quote("Everyone codes", enterAt=160),
        ], gap=22),
        ratio=(1, 1.7), variant="vs", maxWidth=1320, enterAt=10,
    ),
])

# [19] scene-19 — software engineer → builder (title transformation)  비카드(MarkerHighlight + arrow)
LAYOUTS[19] = sceneroot([
    kicker("연말이 되면", enterAt=0),
    versus("software engineer", "builder",
           leftValue="이름표", rightValue="역할", enterAt=20),
])

# [20] scene-20 — 가치는 정하기/버리기/책임지기  복합(BulletList + IconCard)
LAYOUTS[20] = sceneroot([
    kicker("개발자의 가치가 옮겨가는 곳", enterAt=0),
    head("타이핑보다 — 정하기 · 버리기 · 책임지기", size="lg", enterAt=20),
    grid([
        iconcard("compass", "정하기", "무엇을 만들지 결정한다", enterAt=80),
        iconcard("trash-2", "버리기", "무엇을 안 만들지 결정한다", enterAt=160),
        iconcard("shield-check", "책임지기", "어떤 결과를 책임진다", enterAt=240),
    ], columns=3, gap=24, maxWidth=1320, enterAt=60),
])

# [21] scene-21 — 타자수 → 판단 설계자 (payoff)  비카드(DualTone + Marker)
LAYOUTS[21] = sceneroot([
    kicker("결국 우리가 되는 사람", enterAt=0),
    dual([
        {"text": "타자수가 아니라 ", "tone": "muted"},
        {"text": "판단을 설계하는 사람", "tone": "accent"},
    ], enterAt=20),
    marker("Judgment Designer", fontSize=44, enterAt=180),
])

# [22] scene-22 — 코드를 덜 사랑하라 / 문제를 더 사랑하라  비카드(VersusCard)
LAYOUTS[22] = sceneroot([
    kicker("이 시기의 역설", enterAt=0),
    versus("코드를 덜", "문제를 더",
           leftValue="사랑하라", rightValue="사랑하라", enterAt=20),
    footer("코드는 AI에게, 문제는 나에게", enterAt=260),
])

# [23] scene-23 — 인턴 + 감독 / 시키는 사람 (compound)  복합(IconCard + Quote)
LAYOUTS[23] = sceneroot([
    kicker("첫째 — 장인에서 감독으로", enterAt=0),
    split(
        stack_col([
            img(f"{ICONS}/brick-wall.svg", maxHeight=180, enterAt=20),
            badge("예전", enterAt=80),
            body("벽돌을 직접 쌓는 사람"),
        ], gap=16),
        stack_col([
            img(f"{ICONS}/director.svg", maxHeight=180, enterAt=140),
            badge("지금", enterAt=200),
            body("빠른 인턴들을 거느린 감독"),
        ], gap=16),
        ratio=(1,1), variant="arrow", maxWidth=1280, enterAt=10,
    ),
])

# [24] scene-24 — 문제 소유권 / 코드 → AI / 3가지 인간 결정  복합(Grid)
LAYOUTS[24] = sceneroot([
    kicker("둘째 — 문제의 소유권", enterAt=0),
    head("코드는 넘겨도 — 이건 못 넘긴다", size="lg", emphasis=["못 넘긴다"], enterAt=20),
    grid([
        iconcard("target", "어떤 문제를", "풀지 결정", enterAt=80),
        iconcard("ruler", "어디까지", "풀지 결정", enterAt=160),
        iconcard("ban", "무엇은", "일부러 안 풀지", enterAt=240),
    ], columns=3, gap=22, maxWidth=1320, enterAt=60),
])

# [25] scene-25 — PR 수 × 문제 소유 (payoff)  비카드(VersusCard 변주)
LAYOUTS[25] = sceneroot([
    kicker("귀한 개발자란", enterAt=0),
    versus("PR 수가 많은 사람", "문제를 자기 것으로 만든 사람",
           leftValue="개수 ↑", rightValue="소유 ↑", enterAt=20),
])

# [26] scene-26 — 셋째: 취향 / AI 평균품 / 죽는 zone  복합(RingChart + Body)
LAYOUTS[26] = sceneroot([
    kicker("셋째 — 취향을 훈련하라", enterAt=0),
    split(
        ringchart(value=70, label="AI는 평균 70점", size=260, enterAt=20),
        stack_col([
            head("대부분의 제품은 '꽤 괜찮음'에서 죽는다", size="md", emphasis=["꽤 괜찮음","죽는다"], enterAt=80),
            body("70점에서 벗어나는 30점이 진짜 차이를 만든다"),
        ], gap=18),
        ratio=(1, 1.4), variant="line", maxWidth=1280, enterAt=10,
    ),
])

# [27] scene-27 — UX 4가지 미세 품질 + 취향 영역  복합(Grid 4 + footer)
LAYOUTS[27] = sceneroot([
    kicker("AI가 못 잡는 차이", enterAt=0),
    grid([
        iconcard("activity", "리듬", "사용자 경험의 박자", enterAt=40),
        iconcard("type", "결", "문장의 결과 톤", enterAt=110),
        iconcard("thermometer", "온도", "인터랙션의 따뜻함", enterAt=180),
        iconcard("alert-circle", "어색함", "한 박자의 거슬림", enterAt=250),
    ], columns=4, gap=18, maxWidth=1380, enterAt=20),
    footer("앞으로 경쟁력은 실력 + 안목에서 갈린다", enterAt=320),
])

# [28] scene-28 — 피아니스트 metaphor (handcraft)  비카드(Image + Quote)
LAYOUTS[28] = sceneroot([
    kicker("넷째 — 손으로 만드는 시간", enterAt=0),
    img(f"{ICONS}/piano.svg", maxHeight=240, enterAt=20),
    head("피아니스트는 자동 피아노가 있어도 손가락 훈련을 버리지 않는다", size="md", enterAt=100),
    footer("AI 시대의 코더에게도 같은 법칙이 적용된다", enterAt=260),
])

# [29] scene-29 — 직접 해본 사람만 수상한데를 안다  비카드(Marker + footer)
LAYOUTS[29] = sceneroot([
    marker("뭔가 수상한데?", fontSize=64, enterAt=0),
    footer("직접 해본 사람만 알 수 있는 감각", enterAt=80),
])

# [30] scene-30 — 다섯째: 사람 + 5가지 인간 task  복합(Grid 5)
LAYOUTS[30] = sceneroot([
    kicker("다섯째 — 사람 쪽으로 더 깊이", enterAt=0),
    grid([
        iconcard("mic", "고객 인터뷰", "현장의 목소리"),
        iconcard("eye", "현장 관찰", "말하지 않는 신호"),
        iconcard("users", "팀 갈등", "조용한 균열의 추적"),
        iconcard("git-merge", "우선순위 충돌", "무엇을 먼저"),
        iconcard("heart", "진짜 아픔 구분", "누가 정말 아픈가"),
    ], columns=3, gap=22, maxWidth=1320, enterAt=20),
])

# [31] scene-31 — 현실 vs 명세서 + 인간 가치 살아남  복합(VersusCard + footer)
LAYOUTS[31] = sceneroot([
    kicker("현실의 결", enterAt=0),
    versus("명세서", "현실",
           leftValue="깨끗", rightValue="더럽고 애매", enterAt=20),
    footer("바로 그 지점에서 인간 개발자의 가치가 살아난다", enterAt=180),
])

# [32] scene-32 — 가능성 속에서 진짜 중요한 걸 고르는 사람  비카드(MarkerHighlight)
LAYOUTS[32] = sceneroot([
    kicker("딥 블루를 통과하는 사람", enterAt=0),
    head("AI보다 잘 치는 사람이 아니라", size="md", enterAt=20),
    marker("진짜 중요한 걸 고르는 사람", fontSize=60, enterAt=100),
])

# [33] scene-33 — 도구 좋아짐 + 자동화 + 능력 싸짐 (3가지 흐름)  복합(FlowDiagram)
LAYOUTS[33] = sceneroot([
    kicker("앞으로 일어날 일", enterAt=0),
    flowdiag(
        steps=[
            {"label": "도구는 더 좋아진다", "icon": "trending-up"},
            {"label": "자동화가 더 늘어난다", "icon": "settings"},
            {"label": "능력은 상품처럼 싸진다", "icon": "tag"},
        ],
        variant="circle-chain",
        stepEnterAts=[40, 130, 220],
        enterAt=20,
    ),
    footer("그건 부정할 수 없다", enterAt=300),
])

# [34] scene-34 — 체스/바둑 살아남 + 인간 더 깊어짐 (4 beats: chess survived/go survived/deepened)  복합(Stack-row 2 image + payoff)
LAYOUTS[34] = sceneroot([
    kicker("역사가 보여준 패턴", enterAt=0),
    stack_row([
        stack_col([
            img(f"{ICONS}/chess-king.svg", maxHeight=160, enterAt=20),
            badge("체스", enterAt=70),
            body("Deep Blue 이후에도 사라지지 않았다"),
        ], gap=12),
        stack_col([
            img(f"{ICONS}/go-board.svg", maxHeight=160, enterAt=120),
            badge("바둑", enterAt=170),
            body("AlphaGo 이후에 끝나지 않았다"),
        ], gap=12),
    ], gap=60, enterAt=10),
    marker("인간은 더 깊어졌다", fontSize=52, enterAt=240),
])

# [35] scene-35 — 손은 가져가도 질문은 못 가져간다  Split(arrow)
LAYOUTS[35] = sceneroot([
    kicker("AI가 가져가는 것 vs 못 가져가는 것", enterAt=0),
    split(
        stack_col([
            img(f"{ICONS}/hands.svg", maxHeight=180, enterAt=20),
            badge("AI가 가져간다", enterAt=80),
            body("우리 손의 일부"),
        ], gap=14),
        stack_col([
            img(f"{ICONS}/scale.svg", maxHeight=180, enterAt=140),
            badge("못 가져간다", enterAt=200),
            body("우리의 질문"),
        ], gap=14),
        ratio=(1,1), variant="vs", maxWidth=1300, enterAt=10,
    ),
])

# [36] scene-36 — 4 questions + 오래 서 있는 사람 + 결국 좋은 개발자  복합(BulletList + Marker)
LAYOUTS[36] = sceneroot([
    kicker("AI가 못 가져갈 네 가지 질문", enterAt=0),
    bullets([
        "무엇을 만들어야 하는가",
        "왜 이걸 만들어야 하는가",
        "어디까지가 충분한가",
        "무엇이 인간에게 진짜 도움이 되는가",
    ], variant="dot", enterAt=20),
    marker("이 질문 앞에 오래 서 있는 사람이 결국, 좋은 개발자다", fontSize=40, enterAt=120),
])

# ============= 적용 =============
for i, sc in enumerate(scenes):
    sc["stack_root"] = LAYOUTS[i]
    sc["transition"] = {"type": "none", "durationFrames": 0}

json.dump(data, open(scenes_path, "w"), indent=2, ensure_ascii=False)

# 통계
def count_grammar(stack_root):
    """비카드(focal-only) vs 카드(컨테이너) 판별"""
    children = stack_root.get("children", [])
    has_container = any(c.get("type") in ("Split","Grid","Stack","FrameBox") for c in children)
    if has_container:
        # split-2col?
        for c in children:
            if c.get("type") == "Split": return "split"
        for c in children:
            if c.get("type") == "Grid": return "grid"
        for c in children:
            if c.get("type") == "Stack": return "stack"
        return "compound"
    return "focal-only"

from collections import Counter
grammars = [count_grammar(sc["stack_root"]) for sc in scenes]
print(f"문법 분포: {Counter(grammars)}")
non_card = sum(1 for g in grammars if g == "focal-only")
print(f"비카드: {non_card}/{len(scenes)} = {non_card*100/len(scenes):.0f}% (≥40%)")
split_cnt = grammars.count("split")
print(f"Split: {split_cnt}/{len(scenes)} = {split_cnt*100/len(scenes):.0f}% (≤30%)")

# Unique node types
all_types = set()
def walk(n):
    if isinstance(n, dict):
        if "type" in n: all_types.add(n["type"])
        for c in n.get("children", []): walk(c)
for sc in scenes:
    walk(sc["stack_root"])
print(f"고유 노드 타입: {len(all_types)} (≥10)")
print(f"  {sorted(all_types)}")

# 연속 동일 grammar
max_consec = 1; cur = 1
for i in range(1, len(grammars)):
    if grammars[i] == grammars[i-1]:
        cur += 1; max_consec = max(max_consec, cur)
    else: cur = 1
print(f"최대 연속 동일 문법: {max_consec} (≤2)")
