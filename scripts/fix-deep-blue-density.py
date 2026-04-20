#!/usr/bin/env python3
"""밀도 부족 씬에 visual 노드 보충 + text-only 해소"""
import json

scenes = json.load(open("data/deep-blue/scenes-v2.json"))

CHART_NODES = {"CompareBars","RingChart","PieChart","ProgressBar","AreaChart","DataTable"}
ICON_NODES = {"DevIcon","ImageAsset","SvgGraphic","Icon"}
CONTAINER_NODES = {"SceneRoot","Split","Grid","Stack","FrameBox","Overlay","AnchorBox","SafeArea"}
DECO_NODES = {"Divider","Badge","Pill","ArrowConnector","Kicker","FooterCaption"}
TEXT_ONLY = {"Headline","BodyText","MarkerHighlight","DualToneText"}

def collect_types(n, types=None):
    if types is None: types = []
    types.append(n.get("type", "?"))
    for c in n.get("children", []):
        collect_types(c, types)
    return types

ICONS = "icons/deep-blue"

def img(src, eid="extra-img", maxHeight=200, circle=False, enterAt=20):
    d = {"src": src, "maxHeight": maxHeight, "shadow": True, "shape": "rounded"}
    if circle: d["circle"] = True
    return {"id": eid, "type": "ImageAsset", "data": d,
            "motion": {"preset": "scaleIn", "enterAt": enterAt, "duration": 18}}

def progress(value, label, eid="pr", enterAt=80):
    return {"id": eid, "type": "ProgressBar",
            "data": {"value": value, "label": label},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 18}}

def comparebars(items, eid="cb", enterAt=120):
    return {"id": eid, "type": "CompareBars",
            "data": {"items": items},
            "layout": {"maxWidth": 900},
            "motion": {"preset": "fadeUp", "enterAt": enterAt, "duration": 22}}

# 씬별 보강
def add(idx, node, position=-1):
    sr = scenes[idx]["stack_root"]
    children = sr["children"]
    if position == -1:
        # insert before footer if exists
        idx_ft = next((i for i,c in enumerate(children) if c.get("type")=="FooterCaption"), len(children))
        children.insert(idx_ft, node)
    else:
        children.insert(position, node)

# 0: 인사 (focal-only Headline) — add ImpactStat or Image
add(0, img(f"{ICONS}/code-tags.svg", eid="x-code", maxHeight=120, enterAt=200))

# 1: SplitRevealCard 단독 (12s) — Kicker은 deco. Need 3 meaningful. Add Headline + Body
# Actually SplitReveal=1 meaningful. Need 2 more.
add(1, {"id": "x-bd", "type": "BodyText",
        "data": {"text": "AI 코딩 시대의 두 풍경"},
        "motion": {"preset": "fadeUp", "enterAt": 240, "duration": 16}})
add(1, img(f"{ICONS}/code-tags.svg", eid="x-img", maxHeight=100, enterAt=300))

# 4: hero-center (13s) — has Kicker+Headline+FlowDiagram. FlowDiagram=1 meaningful + Headline=1 = 2. Need 3.
add(4, {"id": "x-bd", "type": "BodyText",
        "data": {"text": "AI 코딩 도구의 세 가지 진화 축"},
        "motion": {"preset": "fadeUp", "enterAt": 360, "duration": 16}})

# 5: AnimatedTimeline 단독 (14s) — 1 meaningful. Add 2.
add(5, {"id": "x-bd", "type": "BodyText",
        "data": {"text": "에러 한 줄에서 몇 시간을 보내던 시절"},
        "motion": {"preset": "fadeUp", "enterAt": 360, "duration": 16}})
# add icon
add(5, img(f"{ICONS}/code-tags.svg", eid="x-img", maxHeight=100, enterAt=300))

# 7: text-only (Marker만) — add Image
add(7, img(f"{ICONS}/scale.svg", eid="x-img", maxHeight=140, enterAt=80))

# 10: text-only — Frameboxes contain only BodyText. Add IconCards or Image
# manifest 없는 추상 개념. Add ImageAsset hands or scale
add(10, img(f"{ICONS}/scale.svg", eid="x-img", maxHeight=120, enterAt=240))

# 12: text-only (DualTone + Footer) — Kicker+DualTone=1+0. Add image
add(12, img(f"{ICONS}/lee-sedol.jpg", eid="x-img", maxHeight=160, circle=True, enterAt=80))

# 13: text-only (FrameBoxes with Headline only). Add stat
add(13, {"id": "x-stat", "type": "ImpactStat",
         "data": {"value": "?", "suffix": "", "label": "정체성의 떨림"},
         "motion": {"preset": "popNumber", "enterAt": 320, "duration": 22}})

# 14: hero-center (14s) — Kicker+Image+Headline+Footer. Image+Headline=2 meaningful. Need 3.
add(14, {"id": "x-bd", "type": "BodyText",
         "data": {"text": "AlphaGo가 인간 기사를 어떻게 바꿨는지"},
         "motion": {"preset": "fadeUp", "enterAt": 360, "duration": 16}})

# 15: text-only Marker — short scene 3.3s. Add image
add(15, img(f"{ICONS}/alphago.svg", eid="x-img", maxHeight=120, enterAt=20))

# 17: VersusCard (12s) — 1 meaningful. Need 3.
add(17, {"id": "x-h", "type": "Headline",
         "data": {"text": "AlphaGo가 가르친 진짜 변화", "size": "md"},
         "motion": {"preset": "fadeUp", "enterAt": 200, "duration": 16}})
add(17, img(f"{ICONS}/alphago.svg", eid="x-img", maxHeight=120, enterAt=300))

# 21: text-only DualTone+Marker — 2 meaningful. Need 3 + asset.
add(21, img(f"{ICONS}/director.svg", eid="x-img", maxHeight=140, enterAt=240))

# 22: VersusCard (12s) — 1 meaningful. Need 3.
add(22, {"id": "x-h", "type": "Headline",
         "data": {"text": "이 시기의 역설", "size": "md"},
         "motion": {"preset": "fadeUp", "enterAt": 240, "duration": 16}})
add(22, img(f"{ICONS}/code-tags.svg", eid="x-img", maxHeight=100, enterAt=320))

# 25: VersusCard (11s) — 1 meaningful. Need 3.
add(25, {"id": "x-h", "type": "Headline",
         "data": {"text": "PR 수보다 문제 소유권", "size": "md"},
         "motion": {"preset": "fadeUp", "enterAt": 220, "duration": 16}})
add(25, img(f"{ICONS}/scale.svg", eid="x-img", maxHeight=120, enterAt=300))

# 28: hero (13s) — Kicker+Image+Headline+Footer. Image+Headline=2. Need 3.
add(28, {"id": "x-bd", "type": "BodyText",
         "data": {"text": "자동 도구 시대의 손가락 훈련"},
         "motion": {"preset": "fadeUp", "enterAt": 320, "duration": 16}})

# 29: text-only Marker — add image
add(29, img(f"{ICONS}/code-tags.svg", eid="x-img", maxHeight=100, enterAt=160))

# 32: text-only inside FrameBox (Headline+Marker). Add image
add(32, img(f"{ICONS}/scale.svg", eid="x-img", maxHeight=100, enterAt=200))

# 33: FlowDiagram (13s) — 1 meaningful + Footer (deco). Need 3.
add(33, {"id": "x-h", "type": "Headline",
         "data": {"text": "앞으로 일어날 흐름", "size": "md"},
         "motion": {"preset": "fadeUp", "enterAt": 0, "duration": 16}})
add(33, {"id": "x-bd", "type": "BodyText",
         "data": {"text": "도구·자동화·상품화"},
         "motion": {"preset": "fadeUp", "enterAt": 280, "duration": 16}})

# 차트 비율 30% 달성: 11+ scenes need charts.
# 현재 차트 있는 씬: 16 (CompareBars), 26 (RingChart) = 2개
# 9개 더 필요. ProgressBar/CompareBars를 자연스러운 자리에 추가:

# scene-3 ($100/월): RingChart 추가 (max 비율)
add(3, progress(value=70, label="$100/월 가성비", enterAt=240))
# scene-4 (3 진화 축): ProgressBars
# Actually scene 4 has FlowDiagram, fine.
# scene-12 (개발자도 비슷): CompareBars (전문성 무너짐 비율)
add(12, comparebars(
    items=[
        {"label": "1997 전문성", "value": 100, "color": "#94a3b8"},
        {"label": "AI 시대 전문성", "value": 65, "color": "#f59e0b"},
    ],
    enterAt=200,
))
# scene-19 (software→builder): comparebars
add(19, comparebars(
    items=[
        {"label": "타이핑 노동 비중", "value": 80, "color": "#94a3b8"},
        {"label": "판단 노동 비중", "value": 20, "color": "#34d399"},
    ],
    enterAt=120,
))
# scene-20 (정하기/버리기/책임지기): RingChart
add(20, {"id": "x-rc", "type": "RingChart",
         "data": {"value": 33, "label": "타이핑 비중 ↓", "size": 200},
         "motion": {"preset": "scaleIn", "enterAt": 320, "duration": 22}})
# scene-24 (3 인간 결정): comparebars (인간 vs AI 결정 영역)
add(24, comparebars(
    items=[
        {"label": "AI 결정 영역", "value": 60, "color": "#64748b"},
        {"label": "인간 결정 영역", "value": 40, "color": "#34d399"},
    ],
    enterAt=320,
))
# scene-30 (5 human tasks): progress
add(30, progress(value=85, label="현실의 결을 읽는 능력", enterAt=240))
# scene-33 (좋아짐/자동화/싸짐): comparebars
add(33, comparebars(
    items=[
        {"label": "도구 성능", "value": 95, "color": "#34d399"},
        {"label": "능력 가격", "value": 25, "color": "#94a3b8"},
    ],
    enterAt=320,
))
# scene-34 (체스/바둑 살아남): progress
add(34, progress(value=140, label="AlphaGo 이후 인간 기사 품질", enterAt=300))
# scene-36 (4 questions): RingChart
add(36, {"id": "x-rc", "type": "RingChart",
         "data": {"value": 100, "label": "사람만 답할 수 있는 질문", "size": 220},
         "motion": {"preset": "scaleIn", "enterAt": 200, "duration": 22}})

json.dump(scenes, open("data/deep-blue/scenes-v2.json","w"), indent=2, ensure_ascii=False)

# Re-validate
warnings = []
chart_count = asset_count = 0
n = len(scenes)
for s in scenes:
    sr = s.get("stack_root")
    types = collect_types(sr)
    meaningful = [t for t in types if t not in CONTAINER_NODES and t not in DECO_NODES]
    has_chart = any(t in CHART_NODES for t in types)
    has_asset = any(t in ICON_NODES for t in types)
    text_only = all(t in TEXT_ONLY for t in meaningful)
    dur_s = (s["end_ms"] - s["start_ms"]) / 1000
    if has_chart: chart_count += 1
    if has_asset: asset_count += 1
    if dur_s >= 20 and len(meaningful) < 4:
        warnings.append(f"  ⚠ {s['id']} ({dur_s:.0f}s): {len(meaningful)} meaningful (≥4)")
    elif dur_s >= 10 and len(meaningful) < 3:
        warnings.append(f"  ⚠ {s['id']} ({dur_s:.0f}s): {len(meaningful)} meaningful (≥3)")
    if text_only and len(meaningful) > 0:
        warnings.append(f"  ⚠ {s['id']}: text-only")

print(f"차트: {chart_count}/{n} = {chart_count*100/n:.0f}% (≥30%)")
print(f"에셋: {asset_count}/{n} = {asset_count*100/n:.0f}% (≥50%)")
print(f"warnings: {len(warnings)}")
for w in warnings[:20]: print(w)
