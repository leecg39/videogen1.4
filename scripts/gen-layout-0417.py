#!/usr/bin/env python3
"""
gen-layout-0417.py — programmatic stack_root generator for 0417-테스트
78 scenes × template rotation with manifest asset matching.
Targets: focal-only ≥40%, Split ≤30%, compound ≥20%, unique nodes ≥12.
"""

import json
import re
import sys
from pathlib import Path

PID = sys.argv[1] if len(sys.argv) > 1 else "0417-테스트"
SCENES_PATH = Path(f"data/{PID}/scenes-v2.json")
MANIFEST_PATH = Path(f"public/icons/{PID}/manifest.json")

scenes = json.loads(SCENES_PATH.read_text())
manifest = json.loads(MANIFEST_PATH.read_text()) if MANIFEST_PATH.exists() else []

# manifest keyword matching
KEYWORD_MAP = {}
for e in manifest:
    kw = e["keyword"].lower()
    if "devicon" in e:
        KEYWORD_MAP[kw] = {"type": "devicon", "name": e["devicon"], "mtype": e["type"]}
    else:
        KEYWORD_MAP[kw] = {"type": "image", "path": "/" + e["path"], "mtype": e["type"]}

# Korean → English keyword aliases for matching
ALIASES = {
    "클로드": "claude", "앤트로픽": "anthropic", "엔트로픽": "anthropic",
    "오픈ai": "openai", "오픈에이아이": "openai", "챗gpt": "chatgpt", "지피티": "gpt",
    "구글": "google", "딥마인드": "deepmind", "젬마": "gemma", "제마": "gemma",
    "애플": "apple", "맥북": "macbook", "레딧": "reddit", "깃허브": "github",
    "오라마": "ollama", "올라마": "ollama", "터미널": "terminal",
    "에이전트": "agent", "클라우드": "cloud", "잠금": "lock", "락": "lock",
    "브이엘엘엠": "vllm", "vllm": "vllm", "vllm": "vllm",
}

def find_manifest_hits(text: str):
    """Return ordered list of manifest entries whose keyword appears in narration."""
    text_lower = text.lower()
    hits = []
    seen = set()
    for kor, eng in ALIASES.items():
        if kor in text_lower and eng in KEYWORD_MAP and eng not in seen:
            seen.add(eng)
            hits.append((eng, KEYWORD_MAP[eng]))
    for kw, info in KEYWORD_MAP.items():
        if kw in text_lower and kw not in seen:
            seen.add(kw)
            hits.append((kw, info))
    return hits[:3]

def extract_numbers(text: str):
    """Extract %/number patterns."""
    m = re.findall(r"(\d+(?:\.\d+)?)\s*(%|배|초|분|시간|일|주|달|년|억|조|만|명|개|점|회|달러|원)", text)
    return m[:3]

def compact_headline(text: str, limit=28):
    text = text.strip()
    if len(text) <= limit:
        return text
    # break at sentence-ish
    for sep in [". ", ", ", " "]:
        if sep in text[:limit+5]:
            idx = text[:limit+5].rfind(sep)
            if idx > 8:
                return text[:idx].strip()
    return text[:limit].strip() + "…"

def short_token(text: str, limit=14):
    return text.strip()[:limit]

def subtitle_rel_frames(scene):
    """Return (rel_frame, key_word) list per subtitle."""
    start_s = scene["start_ms"] / 1000.0
    out = []
    for sub in scene.get("subtitles", []):
        rel = max(0, round((sub["startTime"] - 0) * 30))  # startTime is already relative in seconds?
        # In scenes.json, subtitle startTime is in seconds RELATIVE to scene
        out.append((round(sub["startTime"] * 30), sub.get("text","")))
    return out

def enter_for_index(scene, i, total):
    dur = scene["duration_frames"]
    if total <= 1:
        return 0
    # Distribute across scene, max 80% of duration
    step = int(dur * 0.7 / max(1, total - 1))
    step = max(step, 30)  # min 1-sec spacing
    return min(round(i * step), int(dur * 0.8))

# Template builders
def tpl_hero_text(scene, nid):
    hl = compact_headline(scene["copy_layers"].get("headline") or scene["narration"], 36)
    kicker = scene["copy_layers"].get("kicker") or ""
    children = []
    if kicker:
        children.append({"id": f"{nid}-k", "type": "Kicker",
                         "data": {"text": short_token(kicker, 20)},
                         "motion": {"enterAt": 0}})
    children.append({"id": f"{nid}-h", "type": "Headline",
                     "data": {"text": hl, "size": "xl"},
                     "motion": {"preset": "fadeUp", "enterAt": 8, "duration": 15}})
    return children, "focal-only"

def tpl_stat_chart(scene, nid):
    """ImpactStat + CompareBars — 2-modality satisfied."""
    nums = extract_numbers(scene["narration"])
    val = nums[0][0] if nums else "1"
    suffix = nums[0][1] if nums else ""
    label = compact_headline(scene["copy_layers"].get("headline") or "", 24)
    hits = find_manifest_hits(scene["narration"])
    bars = []
    if len(nums) >= 2:
        bars = [{"label": f"A", "value": float(nums[0][0])},
                {"label": f"B", "value": float(nums[1][0])}]
    else:
        bars = [{"label": "기대", "value": 100},
                {"label": "실제", "value": max(1, min(99, int(float(val)) if val.isdigit() else 30))}]
    children = [
        {"id": f"{nid}-stat", "type": "ImpactStat",
         "data": {"value": val[:5], "suffix": suffix[:3], "label": label[:20], "size": "xl"},
         "motion": {"preset": "popNumber", "enterAt": 8, "duration": 15}},
        {"id": f"{nid}-bars", "type": "CompareBars",
         "data": {"items": bars},
         "layout": {"maxWidth": 900},
         "motion": {"preset": "fadeUp", "enterAt": 60, "duration": 20}},
    ]
    return [{"id": f"{nid}-split", "type": "Split",
             "layout": {"ratio": [1, 1], "gap": 40, "maxWidth": 1400, "variant": "line"},
             "children": children}], "split"

def tpl_brand_focal(scene, nid, hits):
    """DevIcon large + headline — brand scene."""
    kw, info = hits[0]
    hl = compact_headline(scene["copy_layers"].get("headline") or scene["narration"], 30)
    children = []
    if info["type"] == "devicon":
        children.append({"id": f"{nid}-icon", "type": "DevIcon",
                         "data": {"name": info["name"], "size": 200, "label": kw.upper()},
                         "motion": {"preset": "scaleIn", "enterAt": 8, "duration": 15}})
    else:
        children.append({"id": f"{nid}-img", "type": "ImageAsset",
                         "data": {"src": info["path"], "rounded": True, "maxHeight": 200, "shadow": True},
                         "motion": {"preset": "scaleIn", "enterAt": 8, "duration": 15}})
    children.append({"id": f"{nid}-h", "type": "Headline",
                     "data": {"text": hl, "size": "lg"},
                     "motion": {"preset": "fadeUp", "enterAt": 30, "duration": 15}})
    return children, "focal-only"

def tpl_split_brands(scene, nid, hits):
    """Two brand logos side-by-side."""
    left_kw, left_info = hits[0]
    right_kw, right_info = hits[1]
    def build_side(kw, info, side_id):
        inner = []
        if info["type"] == "devicon":
            inner.append({"id": f"{nid}-{side_id}-icon", "type": "DevIcon",
                          "data": {"name": info["name"], "size": 150, "label": kw.upper()},
                          "motion": {"preset": "scaleIn", "enterAt": 10, "duration": 15}})
        else:
            inner.append({"id": f"{nid}-{side_id}-img", "type": "ImageAsset",
                          "data": {"src": info["path"], "rounded": True, "maxHeight": 180, "shadow": True},
                          "motion": {"preset": "scaleIn", "enterAt": 10, "duration": 15}})
        return {"id": f"{nid}-{side_id}", "type": "Stack",
                "layout": {"direction": "column", "gap": 16, "align": "center"},
                "children": inner}
    split = {"id": f"{nid}-split", "type": "Split",
             "layout": {"ratio": [1, 1], "gap": 60, "maxWidth": 1400, "variant": "vs"},
             "children": [build_side(left_kw, left_info, "l"), build_side(right_kw, right_info, "r")]}
    return [split], "split"

def tpl_grid_cards(scene, nid):
    """Grid of 3 IconCards based on narration chunks."""
    # Take three short phrases
    narr = scene["narration"]
    phrases = re.split(r"[,\.\s]{1,}", narr)
    phrases = [p.strip() for p in phrases if 4 < len(p.strip()) < 30][:4]
    while len(phrases) < 3:
        phrases.append(compact_headline(narr, 12))
    cards = []
    for i, p in enumerate(phrases[:3]):
        cards.append({"id": f"{nid}-c{i}", "type": "IconCard",
                      "data": {"title": p[:18], "body": "", "icon": "sparkle"},
                      "motion": {"preset": "fadeUp", "enterAt": 10 + i*25, "duration": 15}})
    return [{"id": f"{nid}-grid", "type": "Grid",
             "layout": {"columns": 3, "gap": 24, "maxWidth": 1400},
             "children": cards}], "grid"

def tpl_flow(scene, nid):
    """FlowDiagram with 3 steps."""
    narr = scene["narration"]
    parts = re.split(r"[,\.\s]+", narr)
    parts = [p for p in parts if 3 < len(p) < 15][:4]
    while len(parts) < 3:
        parts.append("단계")
    step_enters = [0, round(scene["duration_frames"] * 0.3), round(scene["duration_frames"] * 0.6)]
    return [{"id": f"{nid}-flow", "type": "FlowDiagram",
             "data": {"steps": [{"label": p[:14]} for p in parts[:3]],
                      "stepEnterAts": step_enters, "variant": "box-chain"},
             "layout": {"maxWidth": 1400},
             "motion": {"preset": "fadeUp", "enterAt": 0, "duration": 15}}], "compound"

def tpl_timeline(scene, nid):
    narr = scene["narration"]
    parts = re.split(r"[,\.\s]+", narr)
    parts = [p for p in parts if 3 < len(p) < 20][:4]
    while len(parts) < 3:
        parts.append("포인트")
    dur = scene["duration_frames"]
    step_enters = [0, round(dur * 0.3), round(dur * 0.6)]
    return [{"id": f"{nid}-tl", "type": "AnimatedTimeline",
             "data": {"steps": [{"label": p[:14], "desc": ""} for p in parts[:3]],
                      "stepEnterAts": step_enters},
             "layout": {"maxWidth": 1400},
             "motion": {"preset": "fadeUp", "enterAt": 0, "duration": 15}}], "compound"

def tpl_versus(scene, nid):
    nums = extract_numbers(scene["narration"])
    narr = scene["narration"]
    # detect contrast words
    left_label = "이전"
    right_label = "현재"
    if "기대" in narr or "예상" in narr:
        left_label, right_label = "기대", "실제"
    if "전" in narr and ("후" in narr or "현재" in narr or "지금" in narr):
        left_label, right_label = "이전", "현재"
    if "유료" in narr and ("무료" in narr or "로컬" in narr):
        left_label, right_label = "유료", "로컬"
    lv = nums[0][0]+nums[0][1] if nums else left_label
    rv = nums[1][0]+nums[1][1] if len(nums) > 1 else right_label
    return [{"id": f"{nid}-vs", "type": "VersusCard",
             "data": {"leftLabel": left_label, "rightLabel": right_label,
                      "leftValue": short_token(lv, 12), "rightValue": short_token(rv, 12)},
             "layout": {"maxWidth": 1400},
             "motion": {"preset": "fadeUp", "enterAt": 5, "duration": 18}}], "compound"

def tpl_ring(scene, nid):
    nums = extract_numbers(scene["narration"])
    val = float(nums[0][0]) if nums and nums[0][0].replace('.','').isdigit() else 50
    label = compact_headline(scene["copy_layers"].get("headline") or "", 20)
    suffix = nums[0][1] if nums else ""
    return [{"id": f"{nid}-ring", "type": "RingChart",
             "data": {"value": min(100, int(val)), "label": f"{int(val)}{suffix}"[:14], "size": 300},
             "motion": {"preset": "popNumber", "enterAt": 5, "duration": 20}},
            {"id": f"{nid}-cap", "type": "BodyText",
             "data": {"text": label or "지표"},
             "motion": {"preset": "fadeUp", "enterAt": 45, "duration": 15}}], "focal-only"

def tpl_bullet(scene, nid):
    narr = scene["narration"]
    parts = re.split(r"[,\.]+", narr)
    items = [p.strip()[:26] for p in parts if 4 < len(p.strip()) < 40][:4]
    while len(items) < 3:
        items.append(compact_headline(narr, 18))
    hl = compact_headline(scene["copy_layers"].get("headline") or "", 22)
    return [{"id": f"{nid}-h", "type": "Headline",
             "data": {"text": hl, "size": "lg"},
             "motion": {"preset": "fadeUp", "enterAt": 0, "duration": 12}},
            {"id": f"{nid}-list", "type": "BulletList",
             "data": {"items": items[:3], "variant": "check"},
             "layout": {"maxWidth": 1100},
             "motion": {"preset": "fadeUp", "enterAt": 35, "duration": 18}}], "focal-only"

def tpl_quote(scene, nid):
    hl = compact_headline(scene["copy_layers"].get("headline") or scene["narration"], 50)
    return [{"id": f"{nid}-mh", "type": "MarkerHighlight",
             "data": {"text": hl, "fontSize": 54},
             "motion": {"preset": "fadeUp", "enterAt": 6, "duration": 18}}], "focal-only"

def tpl_kicker_pause(scene, nid):
    kicker = scene["copy_layers"].get("kicker") or compact_headline(scene["narration"], 18)
    hl = compact_headline(scene["copy_layers"].get("headline") or scene["narration"], 32)
    return [{"id": f"{nid}-k", "type": "Kicker",
             "data": {"text": short_token(kicker, 16)},
             "motion": {"enterAt": 0}},
            {"id": f"{nid}-display", "type": "DisplayText",
             "data": {"text": hl, "size": "xl"},
             "motion": {"preset": "fadeUp", "enterAt": 10, "duration": 18}}], "focal-only"

# ---------- choose template per scene ----------
TEMPLATE_PATTERN = [
    "hero", "stat-chart", "brand-focal", "split-brands", "grid-cards", "flow",
    "timeline", "versus", "ring", "bullet", "quote", "kicker-pause", "hero"
]

def detect_best_template(scene, hits, prev_type):
    narr = scene["narration"]
    nums = extract_numbers(narr)
    has_contrast = any(w in narr for w in ["반면", "반대로", "대신", "vs", "와 달리", "지만", "하지만"])
    has_flow = any(w in narr for w in ["먼저", "그다음", "이후", "마지막으로", "단계", "결과로", "거치고"])
    has_timeline = any(w in narr for w in ["작년", "이번", "지난", "최근", "초기", "다음 주", "곧"])
    has_list = narr.count(",") >= 2 or any(w in narr for w in ["첫째", "둘째", "셋째"])
    has_quote = any(w in narr for w in ["라고", "했다", "말했", "라는"])
    percent = any("%" in n[1] for n in nums)
    # brand detection
    if hits and len(hits) >= 2:
        return "split-brands"
    if hits and len(hits) == 1 and len(narr) < 80:
        return "brand-focal"
    if percent and nums:
        return "ring"
    if nums and prev_type != "split":
        return "stat-chart"
    if has_contrast:
        return "versus"
    if has_flow:
        return "flow"
    if has_timeline:
        return "timeline"
    if has_list:
        return "bullet"
    if has_quote and len(narr) > 40:
        return "quote"
    return None  # fall through to rotation

# Rotation tracker
rotation_idx = 0
prev_container = None
recent_templates = []
containers_used = {"focal-only": 0, "split": 0, "grid": 0, "compound": 0}
node_types_used = set()

def pick_template(scene, prev_container_type):
    global rotation_idx
    hits = find_manifest_hits(scene["narration"])
    best = detect_best_template(scene, hits, prev_container_type)
    # Avoid repeating same template > 2 in a row
    if best and recent_templates[-2:].count(best) >= 2:
        best = None
    if best is None:
        # rotation: force variety
        total = len(scenes)
        target_focal = 0.45 * total
        target_split = 0.27 * total
        target_compound = 0.22 * total
        target_grid = 0.06 * total
        under = sorted(containers_used.items(), key=lambda kv: kv[1] - {"focal-only":target_focal,"split":target_split,"compound":target_compound,"grid":target_grid}[kv[0]])
        want = under[0][0]
        pool = {"focal-only": ["hero", "kicker-pause", "quote", "bullet", "ring"],
                "split": ["stat-chart", "split-brands"],
                "compound": ["flow", "timeline", "versus"],
                "grid": ["grid-cards"]}
        candidates = [t for t in pool[want] if recent_templates[-2:].count(t) < 2]
        if not candidates:
            candidates = pool[want]
        best = candidates[rotation_idx % len(candidates)]
        rotation_idx += 1
    return best, hits

TEMPLATE_BUILDERS = {
    "hero": lambda sc, nid, hits: tpl_hero_text(sc, nid),
    "stat-chart": lambda sc, nid, hits: tpl_stat_chart(sc, nid),
    "brand-focal": lambda sc, nid, hits: tpl_brand_focal(sc, nid, hits),
    "split-brands": lambda sc, nid, hits: tpl_split_brands(sc, nid, hits),
    "grid-cards": lambda sc, nid, hits: tpl_grid_cards(sc, nid),
    "flow": lambda sc, nid, hits: tpl_flow(sc, nid),
    "timeline": lambda sc, nid, hits: tpl_timeline(sc, nid),
    "versus": lambda sc, nid, hits: tpl_versus(sc, nid),
    "ring": lambda sc, nid, hits: tpl_ring(sc, nid),
    "bullet": lambda sc, nid, hits: tpl_bullet(sc, nid),
    "quote": lambda sc, nid, hits: tpl_quote(sc, nid),
    "kicker-pause": lambda sc, nid, hits: tpl_kicker_pause(sc, nid),
}

def collect_node_types(node, acc):
    if "type" in node:
        acc.add(node["type"])
    for ch in node.get("children", []):
        collect_node_types(ch, acc)

for i, scene in enumerate(scenes):
    nid = scene["id"]
    tpl_name, hits = pick_template(scene, prev_container)

    # split-brands requires 2 hits; downgrade if not
    if tpl_name == "split-brands" and len(hits) < 2:
        tpl_name = "brand-focal" if hits else "hero"
    if tpl_name == "brand-focal" and not hits:
        tpl_name = "hero"

    children, ctype = TEMPLATE_BUILDERS[tpl_name](scene, nid, hits)

    # Build SceneRoot
    stack_root = {
        "id": f"{nid}-root", "type": "SceneRoot",
        "layout": {"gap": 24, "padding": "60px 100px 140px", "align": "center", "justify": "center"},
        "children": children
    }
    scene["stack_root"] = stack_root
    # counters
    containers_used[ctype] += 1
    prev_container = ctype
    recent_templates.append(tpl_name)
    collect_node_types(stack_root, node_types_used)

SCENES_PATH.write_text(json.dumps(scenes, ensure_ascii=False, indent=2))

# stats
print(f"Scenes: {len(scenes)}")
print(f"Containers used: {containers_used}")
focal_pct = containers_used['focal-only'] / len(scenes) * 100
split_pct = containers_used['split'] / len(scenes) * 100
compound_pct = containers_used['compound'] / len(scenes) * 100
print(f"focal-only: {focal_pct:.0f}% | split: {split_pct:.0f}% | compound: {compound_pct:.0f}%")
print(f"Unique node types: {len(node_types_used)} — {sorted(node_types_used)}")
