#!/usr/bin/env python3
"""Layout Quality Scorer — Frozen Metric for autoresearch loop.
Scores scenes-v2.json on 10 criteria, 0-100 scale.
"""
import json, sys, re

def score_file(path):
    with open(path) as f:
        scenes = json.load(f)

    total = len(scenes)
    issues = []
    scores = {
        "valid_css_border": 0,       # 15pts: FrameBox border가 유효한 CSS인가
        "split_framebox": 0,         # 15pts: Split 자식이 FrameBox로 감싸져 있는가
        "split_consistency": 0,      # 10pts: Split 좌우 FrameBox의 padding/gap 일치
        "svg_size": 0,               # 10pts: SvgGraphic이 충분히 큰가 (w≥600, h≥350)
        "card_maxwidth": 0,          # 10pts: 카드 컴포넌트에 maxWidth가 있는가
        "process_flow_framebox": 0,  # 10pts: Stack(row) 프로세스의 카드가 FrameBox인가
        "icon_consistency": 0,       # 10pts: 형제 카드 내 아이콘 사이즈 일치
        "text_length": 0,            # 5pts: 텍스트 길이 제한 준수
        "emphasis_rules": 0,         # 5pts: Kicker/Headline/Badge에 emphasis 없음
        "diversity": 0,              # 10pts: 연속 3씬 같은 아키타입 없음
    }

    # Helpers
    def walk(node, visitor, parent=None, depth=0):
        visitor(node, parent, depth)
        for c in node.get("children", []):
            walk(c, visitor, node, depth+1)

    # 1. Valid CSS border (15pts)
    invalid_border_count = 0
    total_framebox = 0
    for s in scenes:
        def check_border(n, p, d):
            nonlocal invalid_border_count, total_framebox
            if n.get("type") == "FrameBox":
                total_framebox += 1
                b = n.get("style", {}).get("border", "")
                if b and isinstance(b, str):
                    # Valid CSS border: starts with number or "none" or "solid" or contains "px"
                    if not re.match(r'^(\d|none|solid)', b) and "px" not in b and "rgba" not in b:
                        invalid_border_count += 1
                        issues.append(f"{s['id']}: FrameBox border='{b}' is invalid CSS")
        walk(s.get("stack_root", {}), check_border)

    if total_framebox > 0:
        scores["valid_css_border"] = round(15 * (1 - invalid_border_count / total_framebox), 1)
    else:
        scores["valid_css_border"] = 15

    # 2. Split children are FrameBox (15pts)
    split_total = 0
    split_ok = 0
    for s in scenes:
        def check_split(n, p, d):
            nonlocal split_total, split_ok
            if n.get("type") == "Split":
                ch = n.get("children", [])
                # Only check VS/comparison splits (both children should be cards)
                if len(ch) == 2:
                    types = [c.get("type") for c in ch]
                    # Skip if one is SvgGraphic or PersonAvatar (asymmetric split)
                    if any(t in ("SvgGraphic", "PersonAvatar") for t in types):
                        return
                    split_total += 1
                    if all(t == "FrameBox" for t in types):
                        split_ok += 1
                    else:
                        issues.append(f"{s['id']}: Split children are {types}, should be [FrameBox, FrameBox]")
        walk(s.get("stack_root", {}), check_split)

    if split_total > 0:
        scores["split_framebox"] = round(15 * split_ok / split_total, 1)
    else:
        scores["split_framebox"] = 15

    # 3. Split FrameBox consistency (10pts)
    split_consistent = 0
    split_pairs = 0
    for s in scenes:
        def check_split_consistency(n, p, d):
            nonlocal split_consistent, split_pairs
            if n.get("type") == "Split":
                ch = n.get("children", [])
                if len(ch) == 2 and all(c.get("type") == "FrameBox" for c in ch):
                    split_pairs += 1
                    l, r = ch
                    lp = l.get("layout", {}).get("padding")
                    rp = r.get("layout", {}).get("padding")
                    lg = l.get("layout", {}).get("gap")
                    rg = r.get("layout", {}).get("gap")
                    # Check internal icon sizes
                    def get_icon_sizes(node):
                        sizes = []
                        for c in node.get("children", []):
                            if c.get("type") == "Icon":
                                sizes.append(c.get("data", {}).get("size", 0))
                            sizes.extend(get_icon_sizes(c))
                        return sizes
                    li = get_icon_sizes(l)
                    ri = get_icon_sizes(r)

                    ok = True
                    if str(lp) != str(rp):
                        issues.append(f"{s['id']}: Split FrameBox padding mismatch: {lp} vs {rp}")
                        ok = False
                    if str(lg) != str(rg):
                        issues.append(f"{s['id']}: Split FrameBox gap mismatch: {lg} vs {rg}")
                        ok = False
                    if li and ri and li != ri:
                        issues.append(f"{s['id']}: Split FrameBox icon sizes: {li} vs {ri}")
                        ok = False
                    if ok:
                        split_consistent += 1
        walk(s.get("stack_root", {}), check_split_consistency)

    if split_pairs > 0:
        scores["split_consistency"] = round(10 * split_consistent / split_pairs, 1)
    else:
        scores["split_consistency"] = 10

    # 4. SVG size (10pts)
    svg_total = 0
    svg_ok = 0
    for s in scenes:
        def check_svg(n, p, d):
            nonlocal svg_total, svg_ok
            if n.get("type") == "SvgGraphic":
                svg_total += 1
                data = n.get("data", {})
                w = data.get("width", 0)
                h = data.get("height", 0)
                elems = len(data.get("elements", []))
                if w >= 600 and h >= 350 and elems >= 5:
                    svg_ok += 1
                else:
                    issues.append(f"{s['id']}: SvgGraphic too small w={w} h={h} elems={elems} (need w≥600 h≥350 elems≥5)")
        walk(s.get("stack_root", {}), check_svg)

    if svg_total > 0:
        scores["svg_size"] = round(10 * svg_ok / svg_total, 1)
    else:
        scores["svg_size"] = 10

    # 5. Card maxWidth (10pts)
    card_total = 0
    card_ok = 0
    card_types = {"IconCard", "WarningCard", "ProcessStepCard", "StatCard", "CompareCard", "ChatBubble", "TerminalBlock"}
    for s in scenes:
        def check_card_mw(n, p, d):
            nonlocal card_total, card_ok
            if n.get("type") in card_types:
                card_total += 1
                mw = n.get("layout", {}).get("maxWidth") or n.get("style", {}).get("maxWidth")
                if mw:
                    card_ok += 1
                else:
                    issues.append(f"{s['id']}: {n['type']} missing maxWidth")
        walk(s.get("stack_root", {}), check_card_mw)

    if card_total > 0:
        scores["card_maxwidth"] = round(10 * card_ok / card_total, 1)
    else:
        scores["card_maxwidth"] = 10

    # 6. Process flow uses FrameBox (10pts)
    flow_total = 0
    flow_ok = 0
    for s in scenes:
        def check_flow(n, p, d):
            nonlocal flow_total, flow_ok
            if n.get("type") == "Stack" and n.get("layout", {}).get("direction") == "row":
                ch = n.get("children", [])
                cards = [c for c in ch if c.get("type") not in ("ArrowConnector", "LineConnector", "Divider")]
                arrows = [c for c in ch if c.get("type") == "ArrowConnector"]
                if len(cards) >= 2 and arrows:  # This is a process flow
                    flow_total += 1
                    if all(c.get("type") == "FrameBox" for c in cards):
                        flow_ok += 1
                    else:
                        bad = [c.get("type") for c in cards if c.get("type") != "FrameBox"]
                        issues.append(f"{s['id']}: process flow has non-FrameBox cards: {bad}")
        walk(s.get("stack_root", {}), check_flow)

    if flow_total > 0:
        scores["process_flow_framebox"] = round(10 * flow_ok / flow_total, 1)
    else:
        scores["process_flow_framebox"] = 10

    # 7. Icon consistency in sibling cards (10pts)
    icon_checks = 0
    icon_ok = 0
    for s in scenes:
        def check_icon_consistency(n, p, d):
            nonlocal icon_checks, icon_ok
            if n.get("type") in ("Grid", "Split") or (n.get("type") == "Stack" and n.get("layout", {}).get("direction") == "row"):
                ch = n.get("children", [])
                real_children = [c for c in ch if c.get("type") not in ("ArrowConnector", "LineConnector", "Divider")]
                if len(real_children) >= 2:
                    def first_icon_size(node):
                        if node.get("type") == "Icon":
                            return node.get("data", {}).get("size")
                        for c in node.get("children", []):
                            r = first_icon_size(c)
                            if r is not None:
                                return r
                        return None

                    sizes = [first_icon_size(c) for c in real_children]
                    sizes = [s for s in sizes if s is not None]
                    if len(sizes) >= 2:
                        icon_checks += 1
                        if len(set(sizes)) <= 1:
                            icon_ok += 1
                        else:
                            issues.append(f"{s['id']}: sibling icon sizes differ: {sizes}")
        walk(s.get("stack_root", {}), check_icon_consistency)

    if icon_checks > 0:
        scores["icon_consistency"] = round(10 * icon_ok / icon_checks, 1)
    else:
        scores["icon_consistency"] = 10

    # 8. Text length (5pts)
    text_violations = 0
    text_checks = 0
    limits = {"Headline": 25, "BodyText": 15, "FooterCaption": 20, "InsightTile": 15}
    for s in scenes:
        def check_text(n, p, d):
            nonlocal text_violations, text_checks
            ntype = n.get("type", "")
            if ntype in limits:
                text_checks += 1
                data = n.get("data", {})
                text = data.get("text", "") or data.get("title", "")
                if len(text) > limits[ntype]:
                    text_violations += 1
                    issues.append(f"{s['id']}: {ntype} text too long ({len(text)}>{limits[ntype]}): '{text[:30]}...'")
        walk(s.get("stack_root", {}), check_text)

    if text_checks > 0:
        scores["text_length"] = round(5 * (1 - text_violations / text_checks), 1)
    else:
        scores["text_length"] = 5

    # 9. Emphasis rules (5pts)
    emphasis_violations = 0
    emphasis_checks = 0
    no_emphasis_types = {"Kicker", "Headline", "Badge", "Pill", "FooterCaption"}
    for s in scenes:
        def check_emphasis(n, p, d):
            nonlocal emphasis_violations, emphasis_checks
            if n.get("type") in no_emphasis_types:
                emphasis_checks += 1
                if n.get("motion", {}).get("emphasis"):
                    emphasis_violations += 1
                    issues.append(f"{s['id']}: {n['type']} should not have emphasis")
        walk(s.get("stack_root", {}), check_emphasis)

    if emphasis_checks > 0:
        scores["emphasis_rules"] = round(5 * (1 - emphasis_violations / emphasis_checks), 1)
    else:
        scores["emphasis_rules"] = 5

    # 10. Diversity (10pts)
    archetype_seq = []
    for s in scenes:
        sr = s.get("stack_root", {})
        ch = sr.get("children", [])
        types = [c.get("type") for c in ch]
        # Determine dominant pattern
        if any(t == "Split" for t in types):
            arch = "Split"
        elif any(t == "Grid" for t in types):
            arch = "Grid"
        elif any(t in ("VennDiagram", "FunnelDiagram", "PyramidDiagram", "MatrixQuadrant", "CycleDiagram", "FlowDiagram") for t in types):
            arch = "Diagram"
        elif any(t == "ChatBubble" for t in types):
            arch = "Chat"
        elif any(t == "CompareCard" for t in types):
            arch = "Compare"
        elif any(t == "CompareBars" for t in types):
            arch = "Bars"
        elif any(t == "StatNumber" for t in types):
            arch = "Stat"
        elif any(t == "QuoteText" for t in types):
            arch = "Quote"
        elif any(t == "WarningCard" for t in types):
            arch = "Warning"
        elif any(t == "ProcessStepCard" for t in types):
            arch = "Step"
        else:
            arch = "Basic"
        archetype_seq.append(arch)

    triple_violations = 0
    for i in range(len(archetype_seq) - 2):
        if archetype_seq[i] == archetype_seq[i+1] == archetype_seq[i+2]:
            # Allow ProcessStepCard trilogy (intentional)
            if archetype_seq[i] != "Step":
                triple_violations += 1
                issues.append(f"scene-{i}~{i+2}: 3 consecutive '{archetype_seq[i]}'")

    max_triples = max(total - 2, 1)
    scores["diversity"] = round(10 * (1 - triple_violations / max_triples), 1)

    # Total
    total_score = sum(scores.values())

    print(f"\n{'='*60}")
    print(f"LAYOUT QUALITY SCORE: {total_score:.1f} / 100")
    print(f"{'='*60}")
    for k, v in scores.items():
        max_pts = {"valid_css_border":15, "split_framebox":15, "split_consistency":10,
                   "svg_size":10, "card_maxwidth":10, "process_flow_framebox":10,
                   "icon_consistency":10, "text_length":5, "emphasis_rules":5, "diversity":10}[k]
        status = "✅" if v >= max_pts * 0.9 else "⚠️" if v >= max_pts * 0.5 else "❌"
        print(f"  {status} {k}: {v:.1f}/{max_pts}")

    if issues:
        print(f"\n--- Issues ({len(issues)}) ---")
        for issue in issues[:30]:
            print(f"  • {issue}")
        if len(issues) > 30:
            print(f"  ... and {len(issues)-30} more")

    print(f"\nTotal: {total_score:.1f}/100")
    return total_score

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "data/value-labor-v2/scenes-v2.json"
    score = score_file(path)
    sys.exit(0 if score >= 90 else 1)
