#!/usr/bin/env python3
"""Strict Layout Quality Scorer — 보수적 채점. 50점부터 시작."""
import json, sys, re

def score_file(path):
    with open(path) as f:
        scenes = json.load(f)

    total = len(scenes)
    deductions = []  # (points_lost, reason)

    def walk(node, visitor, parent=None, depth=0):
        visitor(node, parent, depth)
        for c in node.get("children", []):
            walk(c, visitor, node, depth+1)

    # === CATEGORY 1: CSS/렌더링 정합성 (25점 만점) ===
    cat1_max = 25
    cat1_lost = 0

    # 1a. Invalid CSS border values (-3 each)
    for s in scenes:
        def check_border(n, p, d):
            nonlocal cat1_lost
            if n.get("type") == "FrameBox":
                b = n.get("style", {}).get("border", "")
                if b and isinstance(b, str) and not re.match(r'^(\d|none)', b) and "px" not in b:
                    cat1_lost += 3
                    deductions.append((3, f"{s['id']}: invalid CSS border '{b}'"))
        walk(s.get("stack_root", {}), check_border)

    # 1b. Split children not FrameBox for VS comparisons (-4 each)
    for s in scenes:
        def check_split(n, p, d):
            nonlocal cat1_lost
            if n.get("type") == "Split":
                ch = n.get("children", [])
                if len(ch) == 2:
                    types = [c.get("type") for c in ch]
                    if any(t in ("SvgGraphic", "PersonAvatar") for t in types):
                        return
                    if not all(t == "FrameBox" for t in types):
                        cat1_lost += 4
                        deductions.append((4, f"{s['id']}: Split children {types} not FrameBox"))
        walk(s.get("stack_root", {}), check_split)

    cat1 = max(0, cat1_max - cat1_lost)

    # === CATEGORY 2: 크기/비율 균형 (25점 만점) ===
    cat2_max = 25
    cat2_lost = 0

    # 2a. SvgGraphic too small (-5 each)
    for s in scenes:
        def check_svg(n, p, d):
            nonlocal cat2_lost
            if n.get("type") == "SvgGraphic":
                data = n.get("data", {})
                w, h = data.get("width", 0), data.get("height", 0)
                if w < 600 or h < 350:
                    cat2_lost += 5
                    deductions.append((5, f"{s['id']}: SvgGraphic too small {w}x{h}"))
                if len(data.get("elements", [])) < 5:
                    cat2_lost += 3
                    deductions.append((3, f"{s['id']}: SvgGraphic too few elements"))
        walk(s.get("stack_root", {}), check_svg)

    # 2b. Cards missing maxWidth (-2 each)
    card_types = {"IconCard", "WarningCard", "ProcessStepCard", "StatCard", "CompareCard", "ChatBubble"}
    for s in scenes:
        def check_card(n, p, d):
            nonlocal cat2_lost
            if n.get("type") in card_types:
                mw = n.get("layout", {}).get("maxWidth") or n.get("style", {}).get("maxWidth")
                if not mw:
                    cat2_lost += 2
                    deductions.append((2, f"{s['id']}: {n['type']} missing maxWidth"))
        walk(s.get("stack_root", {}), check_card)

    # 2c. Split FrameBox padding/gap inconsistency (-3 each)
    for s in scenes:
        def check_split_consistency(n, p, d):
            nonlocal cat2_lost
            if n.get("type") == "Split":
                ch = n.get("children", [])
                if len(ch) == 2 and all(c.get("type") == "FrameBox" for c in ch):
                    l, r = ch
                    lp = str(l.get("layout", {}).get("padding", ""))
                    rp = str(r.get("layout", {}).get("padding", ""))
                    lg = l.get("layout", {}).get("gap")
                    rg = r.get("layout", {}).get("gap")
                    if lp != rp or lg != rg:
                        cat2_lost += 3
                        deductions.append((3, f"{s['id']}: Split FrameBox pad/gap mismatch L({lp},{lg}) R({rp},{rg})"))
                    # Icon size consistency
                    def icons(node):
                        r = []
                        for c in node.get("children", []):
                            if c.get("type") == "Icon":
                                r.append(c.get("data", {}).get("size", 0))
                            r.extend(icons(c))
                        return r
                    li, ri = icons(l), icons(r)
                    if li and ri and li != ri:
                        cat2_lost += 3
                        deductions.append((3, f"{s['id']}: Split icon sizes differ {li} vs {ri}"))
        walk(s.get("stack_root", {}), check_split_consistency)

    # 2d. Process flow cards not FrameBox (-3 each)
    for s in scenes:
        def check_flow(n, p, d):
            nonlocal cat2_lost
            if n.get("type") == "Stack" and n.get("layout", {}).get("direction") == "row":
                ch = n.get("children", [])
                cards = [c for c in ch if c.get("type") not in ("ArrowConnector", "LineConnector")]
                arrows = [c for c in ch if c.get("type") == "ArrowConnector"]
                if len(cards) >= 2 and arrows:
                    for c in cards:
                        if c.get("type") not in ("FrameBox",):
                            cat2_lost += 2
                            deductions.append((2, f"{s['id']}: process flow card is {c.get('type')} not FrameBox"))
        walk(s.get("stack_root", {}), check_flow)

    cat2 = max(0, cat2_max - cat2_lost)

    # === CATEGORY 3: 텍스트 품질 (15점 만점) ===
    cat3_max = 15
    cat3_lost = 0
    limits = {"Headline": 25, "BodyText": 15, "FooterCaption": 20, "InsightTile": 15, "QuoteText": 25}
    for s in scenes:
        def check_text(n, p, d):
            nonlocal cat3_lost
            ntype = n.get("type", "")
            if ntype in limits:
                data = n.get("data", {})
                text = data.get("text", "") or data.get("title", "")
                if len(text) > limits[ntype]:
                    cat3_lost += 1
                    deductions.append((1, f"{s['id']}: {ntype} text {len(text)}>{limits[ntype]}: '{text[:20]}…'"))
        walk(s.get("stack_root", {}), check_text)

    cat3 = max(0, cat3_max - cat3_lost)

    # === CATEGORY 4: 모션/emphasis 규칙 (10점 만점) ===
    cat4_max = 10
    cat4_lost = 0
    no_emphasis = {"Kicker", "Headline", "Badge", "Pill", "FooterCaption"}
    for s in scenes:
        def check_emph(n, p, d):
            nonlocal cat4_lost
            if n.get("type") in no_emphasis and n.get("motion", {}).get("emphasis"):
                cat4_lost += 2
                deductions.append((2, f"{s['id']}: {n['type']} has emphasis (forbidden)"))
        walk(s.get("stack_root", {}), check_emph)

    cat4 = max(0, cat4_max - cat4_lost)

    # === CATEGORY 5: 다양성 (15점 만점) ===
    cat5_max = 15
    cat5_lost = 0

    archetype_seq = []
    for s in scenes:
        sr = s.get("stack_root", {})
        ch = sr.get("children", [])
        types = [c.get("type") for c in ch]
        # Deep scan for nested patterns
        def has_nested(node, target_type):
            if node.get("type") == target_type: return True
            return any(has_nested(c, target_type) for c in node.get("children", []))
        def has_arrow_flow(node):
            if node.get("type") == "Stack" and node.get("layout",{}).get("direction") == "row":
                ctypes = [c.get("type") for c in node.get("children",[])]
                if "ArrowConnector" in ctypes: return True
            return any(has_arrow_flow(c) for c in node.get("children",[]))
        def has_timeline(node):
            if node.get("type") == "Stack" and node.get("layout",{}).get("direction") != "row":
                ctypes = [c.get("type") for c in node.get("children",[])]
                if "LineConnector" in ctypes: return True
            return any(has_timeline(c) for c in node.get("children",[]))

        if any(t == "Split" for t in types): arch = "Split"
        elif any(t == "Grid" for t in types): arch = "Grid"
        elif any(t in ("VennDiagram", "FunnelDiagram", "PyramidDiagram", "MatrixQuadrant", "CycleDiagram", "FlowDiagram") for t in types): arch = "Diagram"
        elif any(t == "ChatBubble" for t in types): arch = "Chat"
        elif any(t == "CompareCard" for t in types): arch = "Compare"
        elif any(t == "CompareBars" for t in types): arch = "Bars"
        elif any(t == "StatNumber" for t in types): arch = "Stat"
        elif any(t == "QuoteText" for t in types): arch = "Quote"
        elif any(t == "WarningCard" for t in types): arch = "Warning"
        elif any(t == "ProcessStepCard" for t in types): arch = "Step"
        elif has_arrow_flow(sr): arch = "Process"
        elif has_timeline(sr): arch = "Timeline"
        elif any(t == "IconCard" for t in types): arch = "IconCard"
        elif any(t == "FrameBox" for t in types): arch = "FrameCard"
        else: arch = "Basic"
        archetype_seq.append(arch)

    for i in range(len(archetype_seq) - 2):
        if archetype_seq[i] == archetype_seq[i+1] == archetype_seq[i+2]:
            if archetype_seq[i] != "Step":  # ProcessStepCard trilogy allowed
                cat5_lost += 2
                deductions.append((2, f"scene-{i}~{i+2}: 3 consecutive '{archetype_seq[i]}'"))

    # Count unique archetypes used
    unique = len(set(archetype_seq))
    if unique < 8:
        penalty = (8 - unique) * 2
        cat5_lost += penalty
        deductions.append((penalty, f"Only {unique} unique archetypes (need 8+)"))

    cat5 = max(0, cat5_max - cat5_lost)

    # === CATEGORY 6: 구조적 완결성 (10점 만점) ===
    cat6_max = 10
    cat6_lost = 0

    for s in scenes:
        sr = s.get("stack_root", {})
        ch = sr.get("children", [])

        # Every scene must have at least Headline
        has_headline = False
        def find_headline(n, p, d):
            nonlocal has_headline
            if n.get("type") == "Headline":
                has_headline = True
        walk(sr, find_headline)
        if not has_headline:
            cat6_lost += 2
            deductions.append((2, f"{s['id']}: missing Headline"))

        # enterAt must not exceed duration_frames
        dur = s.get("duration_frames", 9999)
        def check_enterAt(n, p, d):
            nonlocal cat6_lost
            ea = n.get("motion", {}).get("enterAt", 0)
            if ea > dur:
                cat6_lost += 1
                deductions.append((1, f"{s['id']}: enterAt {ea} > duration {dur}"))
        walk(sr, check_enterAt)

    cat6 = max(0, cat6_max - cat6_lost)

    # === TOTAL ===
    raw_total = cat1 + cat2 + cat3 + cat4 + cat5 + cat6
    # Scale: start from 50, map 0-100 raw to 50-100 display
    # Actually, user said start from 50 and be conservative
    # Apply a penalty multiplier: any deduction counts double
    total_deducted = sum(d[0] for d in deductions)
    # Conservative: base 100, each deduction point costs 1.5x
    conservative_score = max(0, 100 - total_deducted * 1.5)
    # Floor at 50 if there are issues
    if total_deducted > 0 and conservative_score > 95:
        conservative_score = min(conservative_score, 92)

    print(f"\n{'='*60}")
    print(f"STRICT LAYOUT QUALITY SCORE: {conservative_score:.0f} / 100")
    print(f"{'='*60}")
    print(f"  Cat1 CSS/렌더링:    {cat1}/{cat1_max}")
    print(f"  Cat2 크기/비율:     {cat2}/{cat2_max}")
    print(f"  Cat3 텍스트:        {cat3}/{cat3_max}")
    print(f"  Cat4 모션/emphasis: {cat4}/{cat4_max}")
    print(f"  Cat5 다양성:        {cat5}/{cat5_max}")
    print(f"  Cat6 구조:          {cat6}/{cat6_max}")
    print(f"  Raw: {raw_total}/100  Deductions: {total_deducted}  Conservative: {conservative_score:.0f}")

    if deductions:
        print(f"\n--- Deductions ({len(deductions)}, total {total_deducted}pts) ---")
        for pts, reason in sorted(deductions, key=lambda x: -x[0]):
            print(f"  -{pts}: {reason}")

    print(f"\nFINAL SCORE: {conservative_score:.0f}/100")
    return conservative_score

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "data/value-labor-v2/scenes-v2.json"
    score = score_file(path)
    sys.exit(0 if score >= 90 else 1)
