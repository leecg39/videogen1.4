#!/usr/bin/env python3
"""
Apply Claude-designed stack_root layouts to scenes 10-64 of value-labor-v2.
18+ archetype variety, meaningful Korean headlines, proper enterAt from subtitles.
"""

import json
import math
import os

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "value-labor-v2")
SCENES_FILE = os.path.join(PROJECT_DIR, "scenes-v2.json")


def enter_at(subs, idx=0):
    """max(15, int(subtitles[idx]['startTime'] * 30))"""
    if not subs or idx >= len(subs):
        return 15
    return max(15, int(subs[idx]["startTime"] * 30))


def sub_enter(subs, idx):
    """enterAt for a subtitle index"""
    if idx >= len(subs):
        return enter_at(subs, len(subs) - 1) + 30
    return max(15, int(subs[idx]["startTime"] * 30))


def base_root(gap=22, padding="40px 80px 110px"):
    return {
        "id": "root",
        "type": "SceneRoot",
        "layout": {"gap": gap, "padding": padding},
        "children": [],
    }


def kicker(text, ea=0):
    return {
        "id": "k0",
        "type": "Kicker",
        "data": {"text": text},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 12},
    }


def headline(text, size="xl", ea=8):
    return {
        "id": "h0",
        "type": "Headline",
        "data": {"text": text, "size": size},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 15},
    }


def footer(text, ea=180):
    return {
        "id": "fc0",
        "type": "FooterCaption",
        "data": {"text": text},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 12},
    }


def icon_node(name, size=90, ea=15, glow=True, emphasis="breathe"):
    node = {
        "id": "ic0",
        "type": "Icon",
        "data": {"name": name, "size": size, "glow": glow},
        "motion": {"preset": "scaleIn", "enterAt": ea, "duration": 15},
    }
    if emphasis:
        node["motion"]["emphasis"] = emphasis
        node["motion"]["emphasisCycle"] = 83
    return node


def stat_number(value, label, ea=60, size="xl"):
    return {
        "id": "st0",
        "type": "StatNumber",
        "data": {"value": value, "label": label, "size": size},
        "style": {"maxWidth": 600},
        "motion": {"preset": "scaleIn", "enterAt": ea, "duration": 18, "emphasis": "pulse", "emphasisCycle": 97},
    }


def compare_card(left, right, ea=60):
    return {
        "id": "cc0",
        "type": "CompareCard",
        "data": {"left": left, "right": right},
        "style": {"maxWidth": 800},
        "motion": {"preset": "slideSplit", "enterAt": ea, "duration": 18},
    }


def warning_card(icon, title, body, ea=30):
    return {
        "id": "wc0",
        "type": "WarningCard",
        "data": {"icon": icon, "title": title, "body": body},
        "style": {"maxWidth": 700},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 15, "emphasis": "wiggle", "emphasisCycle": 97},
    }


def quote_text(text, attribution="", ea=30):
    return {
        "id": "qt0",
        "type": "QuoteText",
        "data": {"text": text, "attribution": attribution},
        "style": {"maxWidth": 800},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 18},
    }


def chat_bubble(messages, ea=30):
    return {
        "id": "cb0",
        "type": "ChatBubble",
        "data": {"messages": messages},
        "style": {"maxWidth": 560},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 24},
    }


def compare_bars(items, unit="", ea=50):
    return {
        "id": "cb0",
        "type": "CompareBars",
        "data": {"items": items, "unit": unit},
        "style": {"maxWidth": 900},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 20},
    }


def flow_diagram(steps, ea=50):
    return {
        "id": "fd0",
        "type": "FlowDiagram",
        "data": {"steps": steps},
        "style": {"maxWidth": 1000, "width": "100%"},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 24},
    }


def timeline_stepper(steps, ea=40):
    return {
        "id": "ts0",
        "type": "TimelineStepper",
        "data": {"steps": steps},
        "style": {"maxWidth": 560},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 24},
    }


def process_step_card(step, icon, title, desc="", ea=50, highlighted=False, node_id="ps0"):
    return {
        "id": node_id,
        "type": "ProcessStepCard",
        "data": {"step": step, "icon": icon, "title": title, "desc": desc, "highlighted": highlighted},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 15},
    }


def pyramid_diagram(layers, ea=50):
    return {
        "id": "py0",
        "type": "PyramidDiagram",
        "data": {"layers": layers},
        "style": {"maxWidth": 500},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 20},
    }


def grid_container(children, columns=3, gap=16, ea=None, maxWidth=1000):
    return {
        "id": "g0",
        "type": "Grid",
        "layout": {"columns": columns, "gap": gap, "width": "100%", "maxWidth": maxWidth},
        "children": children,
    }


def split_container(children, ratio=None, gap=24, maxWidth=1000):
    return {
        "id": "sp0",
        "type": "Split",
        "layout": {"ratio": ratio or [1, 1], "gap": gap, "maxWidth": maxWidth, "width": "100%"},
        "children": children,
    }


def svg_graphic(viewBox, width, height, elements, ea=40, glow=True, emphasis=None, node_id="svg0", maxWidth=700):
    node = {
        "id": node_id,
        "type": "SvgGraphic",
        "data": {
            "viewBox": viewBox,
            "width": width,
            "height": height,
            "drawMode": True,
            "drawDuration": 25,
            "staggerDelay": 5,
            "elements": elements,
        },
        "style": {"maxWidth": maxWidth},
        "motion": {"preset": "fadeUp", "enterAt": ea, "duration": 25},
    }
    if glow:
        node["data"]["glow"] = True
    if emphasis:
        node["motion"]["emphasis"] = emphasis
        node["motion"]["emphasisCycle"] = 109
    return node


def svg_rect(x, y, w, h, rx=16, stagger=0, theme="accent"):
    return {
        "tag": "rect",
        "attrs": {"x": x, "y": y, "width": w, "height": h, "rx": rx, "strokeWidth": 3, "fill": "none"},
        "themeColor": theme,
        "staggerIndex": stagger,
    }


def svg_circle(cx, cy, r, stagger=0, theme="accent", strokeWidth=3, dash=None):
    attrs = {"cx": cx, "cy": cy, "r": r, "strokeWidth": strokeWidth, "fill": "none"}
    if dash:
        attrs["strokeDasharray"] = dash
    return {"tag": "circle", "attrs": attrs, "themeColor": theme, "staggerIndex": stagger}


def svg_text(x, y, text, stagger=0, theme="text", fontSize=24, fontWeight="bold", anchor="middle"):
    return {
        "tag": "text",
        "attrs": {
            "x": x, "y": y, "textAnchor": anchor,
            "fontSize": fontSize, "fontWeight": fontWeight, "fill": "#ffffff",
        },
        "text": text,
        "themeColor": theme,
        "staggerIndex": stagger,
    }


def svg_line(x1, y1, x2, y2, stagger=0, theme="accent", strokeWidth=2):
    return {
        "tag": "line",
        "attrs": {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "strokeWidth": strokeWidth, "fill": "none"},
        "themeColor": theme,
        "staggerIndex": stagger,
    }


def svg_path(d, stagger=0, theme="accent", strokeWidth=2):
    return {
        "tag": "path",
        "attrs": {"d": d, "strokeWidth": strokeWidth, "fill": "none"},
        "themeColor": theme,
        "staggerIndex": stagger,
    }


def svg_arrow(x1, y1, x2, y2, stagger=0, theme="accentBright"):
    """Arrow line with arrowhead"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx * dx + dy * dy)
    if length == 0:
        return svg_line(x1, y1, x2, y2, stagger, theme)
    ux, uy = dx / length, dy / length
    # Arrowhead
    aw = 10
    px1 = x2 - aw * ux + aw * 0.4 * uy
    py1 = y2 - aw * uy - aw * 0.4 * ux
    px2 = x2 - aw * ux - aw * 0.4 * uy
    py2 = y2 - aw * uy + aw * 0.4 * ux
    return {
        "tag": "path",
        "attrs": {
            "d": f"M{x1},{y1} L{x2},{y2} M{x2},{y2} L{px1},{py1} M{x2},{y2} L{px2},{py2}",
            "strokeWidth": 2.5,
            "fill": "none",
            "strokeLinecap": "round",
        },
        "themeColor": theme,
        "staggerIndex": stagger,
    }


# ============================================================================
# Scene design functions
# ============================================================================

def design_scene_10(subs, dur):
    """모든 지식 노동의 위기 — Grid C (IconCards)"""
    root = base_root()
    root["children"] = [
        kicker("CRISIS"),
        headline("지식 노동의 위기", "xl"),
        grid_container([
            {"id": "ic1", "type": "IconCard", "data": {"icon": "code", "title": "IT 개발", "body": "단가 폭락", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 0) + 10, "duration": 12}},
            {"id": "ic2", "type": "IconCard", "data": {"icon": "pen-tool", "title": "디자인", "body": "AI 자동화", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1) + 10, "duration": 12}},
            {"id": "ic3", "type": "IconCard", "data": {"icon": "globe", "title": "번역", "body": "기계 번역", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1) + 20, "duration": 12}},
            {"id": "ic4", "type": "IconCard", "data": {"icon": "file-text", "title": "콘텐츠", "body": "생성형 AI", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 2), "duration": 12}},
        ], columns=4, gap=14, maxWidth=1050),
        footer("거의 모든 지식 노동이 위협받는 시대", ea=dur - 50),
    ]
    return root


def design_scene_11(subs, dur):
    """불안은 자연스럽다 — Timeline E"""
    root = base_root()
    root["children"] = [
        kicker("EMPATHY"),
        headline("불안은 자연스럽다"),
        timeline_stepper([
            {"title": "나도 필요 없어지나?", "icon": "help-circle"},
            {"title": "충분히 이해합니다", "icon": "heart"},
            {"title": "저도 마찬가지입니다", "icon": "user"},
        ], ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_12(subs, dur):
    """다른 각도로 보기 — Icon hero A"""
    root = base_root()
    root["children"] = [
        kicker("PERSPECTIVE"),
        icon_node("refresh-cw", 100, ea=15),
        headline("다른 각도로 보자"),
        footer("오늘의 관점 전환", ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_13(subs, dur):
    """이반 일리치, 1973 — SVG layers (book)"""
    elements = [
        # Book shape
        svg_rect(200, 80, 300, 340, rx=8, stagger=0, theme="accent"),
        svg_line(350, 80, 350, 420, stagger=1, theme="accentBright"),
        # Spine line
        svg_text(350, 150, "성장을 멈춰라", stagger=2, theme="text", fontSize=28),
        svg_text(350, 200, "Tools for", stagger=3, theme="muted", fontSize=18),
        svg_text(350, 230, "Conviviality", stagger=4, theme="muted", fontSize=18),
        # Year
        svg_text(350, 310, "1973", stagger=5, theme="accentBright", fontSize=40, fontWeight="bold"),
        # Author
        svg_text(350, 370, "이반 일리치", stagger=6, theme="text", fontSize=22),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("PHILOSOPHY"),
        headline("일리치의 저서"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1), emphasis="breathe"),
    ]
    return root


def design_scene_14(subs, dur):
    """자율성을 파고든 철학자 — Single card K"""
    root = base_root()
    root["children"] = [
        kicker("IVAN ILLICH"),
        headline("자율성의 철학자"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "user", "title": "이반 일리치", "body": "현대사회가 인간 자율성을\n어떻게 빼앗는지 탐구한 사상가"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 15},
        },
        footer("가톨릭 사제이자 철학자", ea=dur - 50),
    ]
    return root


def design_scene_15(subs, dur):
    """임금 노동 vs 가치 노동 — SVG versus"""
    elements = [
        # Left box
        svg_rect(30, 60, 260, 380, rx=16, stagger=0, theme="accent"),
        svg_text(160, 120, "임금 노동", stagger=1, theme="text", fontSize=30),
        svg_text(160, 175, "시장이 가격을", stagger=2, theme="muted", fontSize=18),
        svg_text(160, 205, "매기는 일", stagger=2, theme="muted", fontSize=18),
        svg_text(160, 270, "월급", stagger=3, theme="accentBright", fontSize=36, fontWeight="bold"),
        svg_text(160, 330, "교환 가치", stagger=4, theme="muted", fontSize=16),
        # VS
        svg_text(350, 250, "VS", stagger=5, theme="accentBright", fontSize=42, fontWeight="bold"),
        # Right box
        svg_rect(410, 60, 260, 380, rx=16, stagger=6, theme="accentBright"),
        svg_text(540, 120, "가치 노동", stagger=7, theme="text", fontSize=30),
        svg_text(540, 175, "스스로 선택한", stagger=8, theme="muted", fontSize=18),
        svg_text(540, 205, "자율적 활동", stagger=8, theme="muted", fontSize=18),
        svg_text(540, 270, "의미", stagger=9, theme="accentBright", fontSize=36, fontWeight="bold"),
        svg_text(540, 330, "사용 가치", stagger=10, theme="muted", fontSize=16),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("KEY CONCEPT"),
        headline("두 가지 노동"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1), glow=True),
    ]
    return root


def design_scene_16(subs, dur):
    """가치 노동의 정의 — K"""
    root = base_root()
    root["children"] = [
        kicker("DEFINITION"),
        headline("가치 노동이란"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "target", "title": "자급적 활동", "body": "시장 밖에서 스스로의 필요를\n충족하는 자율적 활동"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 15},
        },
        footer("Vernacular Activity", ea=dur - 50),
    ]
    return root


def design_scene_17(subs, dur):
    """사용 가치의 회복 — Process D"""
    root = base_root()
    root["children"] = [
        kicker("CORE IDEA"),
        headline("핵심 두 가지"),
        flow_diagram([
            {"title": "사용 가치 회복", "subtitle": "가격표가 아닌\n쓸모 중심"},
            {"title": "→"},
            {"title": "시장 논리 탈피", "subtitle": "교환 가치에서\n벗어나기"},
            {"title": "→"},
            {"title": "주체적 창조", "subtitle": "자율적 목적\n설정"},
        ], ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_18(subs, dur):
    """주체성의 탈환 — Timeline E"""
    root = base_root()
    root["children"] = [
        kicker("AUTONOMY"),
        headline("주체성의 탈환"),
        timeline_stepper([
            {"title": "시스템의 부품", "subtitle": "고용된 존재", "icon": "lock"},
            {"title": "목적 설정 주체", "subtitle": "스스로 방향을 정함", "icon": "compass"},
            {"title": "도구의 주인", "subtitle": "기술을 지배하는 삶", "icon": "crown"},
        ], ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_19(subs, dur):
    """새벽 코딩 = 가치 노동 — Icon hero A"""
    root = base_root()
    root["children"] = [
        kicker("EXAMPLE"),
        icon_node("terminal", 100, ea=15),
        headline("새벽 코딩의 의미"),
        stat_number("가치 노동", "아무도 시키지 않은\n자발적 몰입", ea=sub_enter(subs, 2)),
    ]
    return root


def design_scene_20(subs, dur):
    """후배 멘토링 = 가치 노동 — ChatBubble U"""
    root = base_root()
    root["children"] = [
        kicker("EXAMPLE"),
        headline("순수한 도움"),
        chat_bubble([
            {"sender": "후배", "text": "클로드 코드 어떻게 쓰나요?", "side": "left"},
            {"sender": "나", "text": "이렇게 해보세요!", "side": "right"},
            {"sender": "후배", "text": "감사합니다 선배!", "side": "left"},
        ], ea=sub_enter(subs, 0) + 10),
        footer("이것도 가치 노동입니다", ea=dur - 50),
    ]
    return root


def design_scene_21(subs, dur):
    """텃밭/오픈소스 = 가치 노동 — Grid C"""
    root = base_root()
    root["children"] = [
        kicker("EXAMPLES"),
        headline("일상 속 가치 노동"),
        grid_container([
            {"id": "ic1", "type": "IconCard", "data": {"icon": "sun", "title": "텃밭 가꾸기", "body": "자급적 활동", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 0) + 10, "duration": 12}},
            {"id": "ic2", "type": "IconCard", "data": {"icon": "git-branch", "title": "오픈소스 기여", "body": "자발적 창조", "size": "sm"},
             "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 12}},
        ], columns=2, gap=20, maxWidth=700),
    ]
    return root


def design_scene_22(subs, dur):
    """그림자 노동 경고 — Warning G"""
    root = base_root()
    root["children"] = [
        kicker("WARNING"),
        headline("그림자 노동의 경고"),
        warning_card("alert-triangle", "그림자 노동", "비슷해 보이지만 완전히 다른 것을\n일리치는 강력히 경고했습니다", ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_23(subs, dur):
    """셀프계산대/은행앱 = 그림자 노동 — SVG versus"""
    elements = [
        # Left: shadow labor examples
        svg_rect(30, 50, 280, 400, rx=16, stagger=0, theme="accent"),
        svg_text(170, 110, "그림자 노동", stagger=1, theme="text", fontSize=28),
        svg_text(170, 170, "셀프 계산대", stagger=2, theme="muted", fontSize=20),
        svg_text(170, 210, "은행 앱 이체", stagger=3, theme="muted", fontSize=20),
        svg_text(170, 250, "무인 주문", stagger=4, theme="muted", fontSize=20),
        svg_text(170, 330, "시스템이 시킨 일", stagger=5, theme="accentBright", fontSize=22),
        # VS
        svg_text(350, 250, "≠", stagger=6, theme="accentBright", fontSize=48, fontWeight="bold"),
        # Right: value labor
        svg_rect(390, 50, 280, 400, rx=16, stagger=7, theme="accentBright"),
        svg_text(530, 110, "가치 노동", stagger=8, theme="text", fontSize=28),
        svg_text(530, 170, "새벽 코딩", stagger=9, theme="muted", fontSize=20),
        svg_text(530, 210, "오픈소스 기여", stagger=10, theme="muted", fontSize=20),
        svg_text(530, 250, "멘토링", stagger=11, theme="muted", fontSize=20),
        svg_text(530, 330, "내가 선택한 일", stagger=12, theme="accentBright", fontSize=22),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("CONTRAST"),
        headline("그림자 vs 가치"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_24(subs, dur):
    """차이는 '선택'이다 — StatNumber A"""
    root = base_root()
    root["children"] = [
        kicker("KEY WORD"),
        icon_node("check-circle", 90, ea=15),
        headline("한 단어의 차이"),
        stat_number("선택", "가치 노동과 그림자 노동을\n가르는 핵심 기준", ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_25(subs, dur):
    """자발적 vs 강제적 — CompareCard B"""
    root = base_root()
    root["children"] = [
        kicker("DISTINCTION"),
        headline("자발적 vs 강제적"),
        compare_card(
            {"icon": "check-circle", "title": "자발적 시작", "subtitle": "내가 필요를 느끼고\n스스로 선택한 일", "positive": True},
            {"icon": "x-circle", "title": "강제적 수행", "subtitle": "시스템이 시켜서\n어쩔 수 없이 하는 일", "negative": True},
            ea=sub_enter(subs, 0) + 15,
        ),
        footer("이 구분이 매우 중요합니다", ea=dur - 50),
    ]
    return root


def design_scene_26(subs, dur):
    """공생 Conviviality — SVG hub (3 nodes)"""
    cx, cy = 350, 250
    elements = [
        # Center
        svg_circle(cx, cy, 70, stagger=0, theme="accentBright", strokeWidth=3),
        svg_text(cx, cy - 10, "공생", stagger=1, theme="text", fontSize=32, fontWeight="bold"),
        svg_text(cx, cy + 25, "Conviviality", stagger=1, theme="muted", fontSize=14),
        # Node 1 - top
        svg_circle(cx, cy - 180, 45, stagger=2, theme="accent"),
        svg_text(cx, cy - 180, "자율", stagger=3, theme="text", fontSize=20),
        svg_line(cx, cy - 70, cx, cy - 135, stagger=2, theme="accent"),
        # Node 2 - bottom-left
        svg_circle(cx - 155, cy + 90, 45, stagger=4, theme="accent"),
        svg_text(cx - 155, cy + 90, "창조", stagger=5, theme="text", fontSize=20),
        svg_line(cx - 50, cy + 40, cx - 115, cy + 60, stagger=4, theme="accent"),
        # Node 3 - bottom-right
        svg_circle(cx + 155, cy + 90, 45, stagger=6, theme="accent"),
        svg_text(cx + 155, cy + 90, "상호작용", stagger=7, theme="text", fontSize=18),
        svg_line(cx + 50, cy + 40, cx + 115, cy + 60, stagger=6, theme="accent"),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("CONVIVIALITY"),
        headline("공생의 세 요소"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_27(subs, dur):
    """일리치의 급진적 공생 — SVG split F"""
    elements = [
        # Left half
        svg_rect(30, 60, 290, 380, rx=16, stagger=0, theme="accent"),
        svg_text(175, 130, "일반적 공생", stagger=1, theme="text", fontSize=24),
        svg_text(175, 190, "함께 잘 살자", stagger=2, theme="muted", fontSize=18),
        svg_text(175, 230, "서로 돕자", stagger=2, theme="muted", fontSize=18),
        # Divider
        svg_line(350, 80, 350, 420, stagger=3, theme="accentBright", strokeWidth=2),
        svg_text(350, 50, "≠", stagger=3, theme="accentBright", fontSize=36),
        # Right half
        svg_rect(380, 60, 290, 380, rx=16, stagger=4, theme="accentBright"),
        svg_text(525, 130, "일리치의 공생", stagger=5, theme="text", fontSize=24),
        svg_text(525, 190, "자율적 상호작용", stagger=6, theme="muted", fontSize=18),
        svg_text(525, 230, "창조적 교류", stagger=6, theme="muted", fontSize=18),
        svg_text(525, 300, "더 급진적", stagger=7, theme="accentBright", fontSize=28, fontWeight="bold"),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("RADICAL IDEA"),
        headline("급진적 공생 개념"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 0) + 15),
    ]
    return root


def design_scene_28(subs, dur):
    """도구의 두 얼굴 — SVG versus"""
    elements = [
        # Industrial tool - left
        svg_rect(30, 80, 260, 340, rx=16, stagger=0, theme="accent"),
        svg_text(160, 140, "산업적 도구", stagger=1, theme="text", fontSize=26),
        svg_text(160, 200, "인간을 지배", stagger=2, theme="muted", fontSize=20),
        svg_text(160, 240, "소외와 종속", stagger=3, theme="muted", fontSize=20),
        svg_text(160, 320, "⚠", stagger=4, theme="accentBright", fontSize=40),
        # VS
        svg_text(350, 250, "VS", stagger=5, theme="accentBright", fontSize=42, fontWeight="bold"),
        # Convivial tool - right
        svg_rect(410, 80, 260, 340, rx=16, stagger=6, theme="accentBright"),
        svg_text(540, 140, "공생의 도구", stagger=7, theme="text", fontSize=26),
        svg_text(540, 200, "인간을 증폭", stagger=8, theme="muted", fontSize=20),
        svg_text(540, 240, "창조와 자율", stagger=9, theme="muted", fontSize=20),
        svg_text(540, 320, "✦", stagger=10, theme="accentBright", fontSize=40),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("TOOL DUALITY"),
        headline("도구의 두 얼굴"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_29(subs, dur):
    """바이브코딩의 함정 — Warning G"""
    root = base_root()
    root["children"] = [
        kicker("TRAP"),
        headline("맹목적 추종의 함정"),
        warning_card("alert-octagon", "바이브코딩 경고",
                     "도구를 쓰는 게 아니라\n도구에 맞춰 따라가는 삶이 됩니다",
                     ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_30(subs, dur):
    """공생의 도구란 — SVG ring"""
    cx, cy = 350, 250
    elements = [
        svg_circle(cx, cy, 190, stagger=0, theme="accent", strokeWidth=2, dash="8 8"),
        svg_circle(cx, cy, 130, stagger=1, theme="accentBright", strokeWidth=3),
        svg_circle(cx, cy, 65, stagger=2, theme="accentBright", strokeWidth=4),
        svg_text(cx, cy - 10, "인간", stagger=3, theme="text", fontSize=28, fontWeight="bold"),
        svg_text(cx, cy + 20, "통제권", stagger=3, theme="muted", fontSize=16),
        svg_text(cx, cy - 130 - 30, "비전 실현", stagger=4, theme="text", fontSize=18),
        svg_text(cx - 130 - 20, cy + 10, "상상력", stagger=5, theme="text", fontSize=18),
        svg_text(cx + 130 + 20, cy + 10, "도구 활용", stagger=6, theme="text", fontSize=18),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("CONVIVIAL TOOLS"),
        headline("공생의 도구"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 0) + 15, emphasis="spinSlow"),
    ]
    return root


def design_scene_31(subs, dur):
    """다시 하청 개발사로 — Icon hero A"""
    root = base_root()
    root["children"] = [
        kicker("BACK TO STORY"),
        icon_node("arrow-left", 90, ea=15),
        headline("다시 그 이야기로"),
        footer("일주일 만에 해낸 비결은?", ea=sub_enter(subs, 2)),
    ]
    return root


def design_scene_32(subs, dur):
    """AI만으로는 부족하다 — K"""
    root = base_root()
    root["children"] = [
        kicker("INSIGHT"),
        headline("AI만으로는 부족하다"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "cpu", "title": "AI는 조건일 뿐", "body": "진짜 이유는 따로 있습니다"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 15},
        },
    ]
    return root


def design_scene_33(subs, dur):
    """도메인 지식의 힘 — SVG layers"""
    elements = [
        # Bottom layer
        svg_rect(100, 340, 500, 80, rx=12, stagger=0, theme="accent"),
        svg_text(350, 380, "수년간 축적된 경험", stagger=1, theme="text", fontSize=20),
        # Middle layer
        svg_rect(140, 240, 420, 80, rx=12, stagger=2, theme="accent"),
        svg_text(350, 280, "도메인 지식", stagger=3, theme="text", fontSize=22, fontWeight="bold"),
        # Top layer
        svg_rect(180, 140, 340, 80, rx=12, stagger=4, theme="accentBright"),
        svg_text(350, 180, "시스템 이해", stagger=5, theme="text", fontSize=22, fontWeight="bold"),
        # Crown
        svg_text(350, 80, "속속들이 아는 힘", stagger=6, theme="accentBright", fontSize=26, fontWeight="bold"),
        # Arrows up
        svg_arrow(350, 340, 350, 325, stagger=1, theme="accent"),
        svg_arrow(350, 240, 350, 225, stagger=3, theme="accent"),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("DOMAIN"),
        headline("도메인 지식의 힘"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_34(subs, dur):
    """실력으로 인정해야 — Quote H"""
    root = base_root()
    root["children"] = [
        kicker("COMMENT"),
        headline("현장의 목소리"),
        quote_text(
            "일주일 만에 납품 가능한 레벨로\nAI를 다루는 것 자체가 실력입니다",
            "커뮤니티 댓글",
            ea=sub_enter(subs, 1),
        ),
    ]
    return root


def design_scene_35(subs, dur):
    """락인 효과의 비밀 — CompareBars M"""
    root = base_root()
    root["children"] = [
        kicker("LOCK-IN"),
        headline("대체 불가능의 비밀"),
        compare_bars([
            {"label": "새 업체 전환 비용", "value": 90, "icon": "trending-up"},
            {"label": "기존 업체 유지", "value": 30, "icon": "check"},
        ], unit="상대 비용", ea=sub_enter(subs, 1)),
        footer("다른 업체로 바꾸면 한 달 이상 소요", ea=dur - 50),
    ]
    return root


def design_scene_36(subs, dur):
    """도메인은 복사 불가 — SVG ring"""
    cx, cy = 350, 250
    elements = [
        svg_circle(cx, cy, 180, stagger=0, theme="accent", strokeWidth=2, dash="6 6"),
        svg_circle(cx, cy, 110, stagger=1, theme="accentBright", strokeWidth=3),
        svg_text(cx, cy - 15, "도메인", stagger=2, theme="text", fontSize=32, fontWeight="bold"),
        svg_text(cx, cy + 20, "지식", stagger=2, theme="text", fontSize=32, fontWeight="bold"),
        svg_text(cx, cy - 110 - 25, "복사 불가", stagger=3, theme="accentBright", fontSize=20),
        svg_text(cx - 140, cy + 110, "AI는 복제 가능", stagger=4, theme="muted", fontSize=16),
        svg_text(cx + 140, cy + 110, "경험은 유일무이", stagger=5, theme="muted", fontSize=16),
        # X mark over copy
        svg_path(f"M{cx-30},{cy+70} L{cx+30},{cy+110}", stagger=6, theme="accentBright", strokeWidth=3),
        svg_path(f"M{cx+30},{cy+70} L{cx-30},{cy+110}", stagger=6, theme="accentBright", strokeWidth=3),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("IRREPLACEABLE"),
        headline("복사 불가능한 자산"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_37(subs, dur):
    """임금 단가↓ 가치↑ — CompareBars M"""
    root = base_root()
    root["children"] = [
        kicker("ILLICH'S LENS"),
        headline("단가와 가치의 역설"),
        compare_bars([
            {"label": "임금 노동 단가", "value": 25, "icon": "trending-down"},
            {"label": "가치 노동 밀도", "value": 95, "icon": "trending-up"},
        ], ea=sub_enter(subs, 2)),
        footer("일리치의 언어로 번역하면", ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_38(subs, dur):
    """한나 아렌트의 구분 — PyramidDiagram"""
    root = base_root()
    root["children"] = [
        kicker("HANNAH ARENDT"),
        headline("인간 활동의 세 층위"),
        pyramid_diagram([
            {"label": "행위", "description": "관계 구축"},
            {"label": "작업", "description": "내구적 창조"},
            {"label": "노동", "description": "반복 생존"},
        ], ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_39(subs, dur):
    """노동 = 반복 생존 — ProcessStepCards I"""
    root = base_root()
    root["children"] = [
        kicker("LABOR"),
        headline("노동이란"),
        grid_container([
            process_step_card("1", "repeat", "반복적 행위", "소비되고 사라지는 일", ea=sub_enter(subs, 0) + 10, node_id="ps1"),
            process_step_card("2", "code", "코드 찍어내기", "매일같이 반복하는 구현", ea=sub_enter(subs, 0) + 20, node_id="ps2"),
        ], columns=2, gap=16, maxWidth=700),
    ]
    return root


def design_scene_40(subs, dur):
    """작업 = 내구성 창조 — SVG flow"""
    elements = [
        # Step 1
        svg_rect(30, 180, 170, 120, rx=14, stagger=0, theme="accent"),
        svg_text(115, 225, "설계", stagger=1, theme="text", fontSize=24),
        svg_text(115, 260, "아키텍처", stagger=1, theme="muted", fontSize=14),
        # Arrow
        svg_arrow(200, 240, 250, 240, stagger=2, theme="accentBright"),
        # Step 2
        svg_rect(265, 180, 170, 120, rx=14, stagger=3, theme="accent"),
        svg_text(350, 225, "창조", stagger=4, theme="text", fontSize=24),
        svg_text(350, 260, "내구적 결과물", stagger=4, theme="muted", fontSize=14),
        # Arrow
        svg_arrow(435, 240, 485, 240, stagger=5, theme="accentBright"),
        # Step 3
        svg_rect(500, 180, 170, 120, rx=14, stagger=6, theme="accentBright"),
        svg_text(585, 225, "작업", stagger=7, theme="text", fontSize=26, fontWeight="bold"),
        svg_text(585, 260, "사라지지 않는 것", stagger=7, theme="muted", fontSize=14),
        # Top label
        svg_text(350, 100, "한 번 만들면 영원히 남는다", stagger=8, theme="accentBright", fontSize=22),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("WORK"),
        headline("작업이란"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_41(subs, dur):
    """행위 = 관계 구축 — SVG hub"""
    cx, cy = 350, 260
    elements = [
        # Center
        svg_circle(cx, cy, 60, stagger=0, theme="accentBright", strokeWidth=3),
        svg_text(cx, cy - 8, "행위", stagger=1, theme="text", fontSize=28, fontWeight="bold"),
        svg_text(cx, cy + 22, "ACTION", stagger=1, theme="muted", fontSize=12),
        # Node: customer
        svg_circle(cx - 180, cy - 100, 40, stagger=2, theme="accent"),
        svg_text(cx - 180, cy - 100, "고객", stagger=3, theme="text", fontSize=18),
        svg_line(cx - 60, cy - 30, cx - 140, cy - 70, stagger=2, theme="accent"),
        # Node: team
        svg_circle(cx + 180, cy - 100, 40, stagger=4, theme="accent"),
        svg_text(cx + 180, cy - 100, "팀", stagger=5, theme="text", fontSize=18),
        svg_line(cx + 60, cy - 30, cx + 140, cy - 70, stagger=4, theme="accent"),
        # Node: trust
        svg_circle(cx, cy + 170, 40, stagger=6, theme="accent"),
        svg_text(cx, cy + 170, "신뢰", stagger=7, theme="text", fontSize=18),
        svg_line(cx, cy + 60, cx, cy + 130, stagger=6, theme="accent"),
        # Title
        svg_text(cx, 70, "관계 속 존재 드러내기", stagger=8, theme="accentBright", fontSize=22),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("ACTION"),
        headline("행위란"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_42(subs, dur):
    """AI가 대체한 것 — K"""
    root = base_root()
    root["children"] = [
        kicker("AI IMPACT"),
        headline("AI가 가져간 것"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "cpu", "title": "반복적 노동", "body": "단순 구현, 보일러플레이트,\n스켈레톤 코드"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 0) + 10, "duration": 15},
        },
    ]
    return root


def design_scene_43(subs, dur):
    """AI가 못 가져가는 것 — CompareCard B"""
    root = base_root()
    root["children"] = [
        kicker("IRREPLACEABLE"),
        headline("AI가 못 가져가는 것"),
        compare_card(
            {"icon": "x-circle", "title": "AI 대체 영역", "subtitle": "반복 코드 작성\n단순 구현", "negative": True},
            {"icon": "shield", "title": "인간 고유 영역", "subtitle": "설계 판단력\n관계와 신뢰 구축", "positive": True},
            ea=sub_enter(subs, 1),
        ),
    ]
    return root


def design_scene_44(subs, dur):
    """세 가지 전략 — FlowDiagram D"""
    root = base_root()
    root["children"] = [
        kicker("STRATEGY"),
        headline("세 가지 전략"),
        flow_diagram([
            {"title": "단가 경쟁 거부", "subtitle": "밀도로 승부"},
            {"title": "락인 효과 설계", "subtitle": "해자 구축"},
            {"title": "가치 노동 축적", "subtitle": "자산화"},
        ], ea=sub_enter(subs, 2)),
    ]
    return root


def design_scene_45(subs, dur):
    """단가 경쟁 거부 — CompareBars M"""
    root = base_root()
    root["children"] = [
        kicker("STRATEGY ①"),
        headline("단가 경쟁 거부"),
        compare_bars([
            {"label": "시간당 단가 경쟁", "value": 20, "icon": "x-circle"},
            {"label": "5배 밀도 전략", "value": 100, "icon": "zap"},
        ], ea=sub_enter(subs, 1)),
        footer("같은 돈으로 5배의 가치를", ea=dur - 50),
    ]
    return root


def design_scene_46(subs, dur):
    """가치 밀도를 높여라 — Quote H (일리치 인용)"""
    root = base_root()
    root["children"] = [
        kicker("ILLICH'S WORD"),
        headline("가치 밀도의 철학"),
        quote_text(
            "임금의 가격은 시장이 결정하지만\n가치의 밀도는 내가 만들어 간다",
            "일리치 사상 요약",
            ea=sub_enter(subs, 0) + 15,
        ),
    ]
    return root


def design_scene_47(subs, dur):
    """락인 효과 설계 — SVG ring"""
    cx, cy = 350, 250
    elements = [
        # Outer ring (moat)
        svg_circle(cx, cy, 200, stagger=0, theme="accent", strokeWidth=2, dash="10 6"),
        svg_text(cx, cy - 200 - 20, "대체 불가능한 해자", stagger=1, theme="accentBright", fontSize=18),
        # Middle ring
        svg_circle(cx, cy, 130, stagger=2, theme="accentBright", strokeWidth=3),
        # Inner core
        svg_circle(cx, cy, 55, stagger=3, theme="accentBright", strokeWidth=4),
        svg_text(cx, cy - 8, "나", stagger=4, theme="text", fontSize=28, fontWeight="bold"),
        # Spokes with labels
        svg_text(cx - 160, cy - 30, "도메인\n지식", stagger=5, theme="text", fontSize=16),
        svg_text(cx + 160, cy - 30, "AI\n오케스트레이션", stagger=6, theme="text", fontSize=16),
        svg_text(cx, cy + 150, "고유 경험", stagger=7, theme="text", fontSize=16),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("STRATEGY ②"),
        headline("락인 효과 설계"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1), emphasis="spinSlow"),
    ]
    return root


def design_scene_48(subs, dur):
    """해자를 만들어라 — SVG hub (moat diagram)"""
    cx, cy = 350, 260
    elements = [
        # Castle center
        svg_rect(cx - 50, cy - 50, 100, 100, rx=8, stagger=0, theme="accentBright"),
        svg_text(cx, cy, "핵심 역량", stagger=1, theme="text", fontSize=18),
        # Moat (water ring)
        svg_circle(cx, cy, 120, stagger=2, theme="accent", strokeWidth=6, dash="4 8"),
        svg_text(cx, cy - 140, "해자", stagger=3, theme="accentBright", fontSize=22, fontWeight="bold"),
        # Outer threats
        svg_text(cx - 220, cy, "경쟁자", stagger=4, theme="muted", fontSize=16),
        svg_text(cx + 220, cy, "대체 업체", stagger=5, theme="muted", fontSize=16),
        svg_text(cx, cy + 180, "가격 압박", stagger=6, theme="muted", fontSize=16),
        # Blocked arrows
        svg_path(f"M{cx-200},{cy} L{cx-140},{cy}", stagger=4, theme="accent", strokeWidth=2),
        svg_path(f"M{cx+200},{cy} L{cx+140},{cy}", stagger=5, theme="accent", strokeWidth=2),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("MOAT"),
        headline("해자를 만들어라"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_49(subs, dur):
    """설계를 디테일하게 — Timeline E"""
    root = base_root()
    root["children"] = [
        kicker("HOW"),
        headline("설계력을 키우는 법"),
        timeline_stepper([
            {"title": "무엇을 만들 것인가", "subtitle": "목적 설정", "icon": "target"},
            {"title": "왜 이 구조인가", "subtitle": "판단력 훈련", "icon": "layout"},
            {"title": "디테일한 설계", "subtitle": "AI가 못하는 영역", "icon": "pen-tool"},
        ], ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_50(subs, dur):
    """가치 노동을 축적하라 — Icon hero A"""
    root = base_root()
    root["children"] = [
        kicker("STRATEGY ③"),
        icon_node("layers", 100, ea=15),
        headline("가치 노동 축적"),
        stat_number("축적", "오늘의 핵심 메시지", ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_51(subs, dur):
    """설계=작업, 관계=행위 — SVG versus"""
    elements = [
        # Left: work
        svg_rect(30, 80, 280, 340, rx=16, stagger=0, theme="accent"),
        svg_text(170, 140, "설계", stagger=1, theme="text", fontSize=32, fontWeight="bold"),
        svg_text(170, 190, "= 작업", stagger=2, theme="accentBright", fontSize=24),
        svg_text(170, 250, "AI에게 위임 불가", stagger=3, theme="muted", fontSize=18),
        svg_text(170, 340, "내구적 결과물", stagger=4, theme="muted", fontSize=16),
        # VS
        svg_text(350, 250, "+", stagger=5, theme="accentBright", fontSize=48, fontWeight="bold"),
        # Right: action
        svg_rect(390, 80, 280, 340, rx=16, stagger=6, theme="accentBright"),
        svg_text(530, 140, "관계", stagger=7, theme="text", fontSize=32, fontWeight="bold"),
        svg_text(530, 190, "= 행위", stagger=8, theme="accentBright", fontSize=24),
        svg_text(530, 250, "사람 간 신뢰", stagger=9, theme="muted", fontSize=18),
        svg_text(530, 340, "대체 불가능", stagger=10, theme="muted", fontSize=16),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("ARENDT'S LENS"),
        headline("작업과 행위"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_52(subs, dur):
    """빼앗을 수 없는 자산 — Icon hero A (shield)"""
    root = base_root()
    root["children"] = [
        kicker("ASSET"),
        icon_node("shield", 100, ea=15),
        headline("빼앗을 수 없는 자산"),
        {
            "id": "bt0",
            "type": "BodyText",
            "data": {"text": "연봉은 회사가 줬다가 뺏을 수 있지만\n내 안에 축적된 것은 누구도 가져갈 수 없습니다"},
            "style": {"maxWidth": 700, "textAlign": "center"},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 2), "duration": 15},
        },
    ]
    return root


def design_scene_53(subs, dur):
    """검증 없는 복붙 금지 — Warning G"""
    root = base_root()
    root["children"] = [
        kicker("CAUTION"),
        headline("검증 없는 복붙 금지"),
        warning_card("alert-triangle", "복붙의 위험",
                     "AI 코드를 검증 없이 복사하면\n그것은 가치 노동이 아닙니다",
                     ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_54(subs, dur):
    """그림자 노동의 덫 — CompareCard O"""
    root = base_root()
    root["children"] = [
        kicker("SHADOW LABOR"),
        headline("그림자 노동의 덫"),
        compare_card(
            {"icon": "x-circle", "title": "AI에 종속", "subtitle": "시스템이 시키는 대로\n수동적으로 따르기", "negative": True},
            {"icon": "check-circle", "title": "AI를 주도", "subtitle": "내가 판단하고\n도구로 활용하기", "positive": True},
            ea=sub_enter(subs, 1),
        ),
    ]
    return root


def design_scene_55(subs, dur):
    """사라지는 vs 단단해지는 — CompareCard B"""
    root = base_root()
    root["children"] = [
        kicker("FATE"),
        headline("두 갈래 운명"),
        compare_card(
            {"icon": "x-circle", "title": "사라지는 개발자", "subtitle": "AI를 도구로만 쓰는\n수동적 태도", "negative": True},
            {"icon": "shield", "title": "단단해지는 개발자", "subtitle": "도메인 지식과 결합해\n새 가치를 창조", "positive": True},
            ea=sub_enter(subs, 0) + 15,
        ),
    ]
    return root


def design_scene_56(subs, dur):
    """현대판 공생의 도구 — SVG flow"""
    elements = [
        # Step 1
        svg_rect(20, 180, 150, 120, rx=12, stagger=0, theme="accent"),
        svg_text(95, 215, "코드 작성", stagger=1, theme="text", fontSize=18),
        svg_text(95, 245, "AI 위임", stagger=1, theme="muted", fontSize=13),
        # Arrow
        svg_arrow(170, 240, 210, 240, stagger=2, theme="accentBright"),
        # Step 2
        svg_rect(225, 180, 150, 120, rx=12, stagger=3, theme="accent"),
        svg_text(300, 215, "AI 지휘", stagger=4, theme="text", fontSize=18),
        svg_text(300, 245, "내 손발처럼", stagger=4, theme="muted", fontSize=13),
        # Arrow
        svg_arrow(375, 240, 415, 240, stagger=5, theme="accentBright"),
        # Step 3
        svg_rect(430, 180, 150, 120, rx=12, stagger=6, theme="accent"),
        svg_text(505, 215, "가치 창출", stagger=7, theme="text", fontSize=18),
        svg_text(505, 245, "설계력 + AI", stagger=7, theme="muted", fontSize=13),
        # Arrow
        svg_arrow(580, 240, 620, 240, stagger=8, theme="accentBright"),
        # Final
        svg_circle(660, 240, 35, stagger=9, theme="accentBright", strokeWidth=3),
        svg_text(660, 240, "공생", stagger=10, theme="text", fontSize=16, fontWeight="bold"),
        # Top banner
        svg_text(350, 100, "현대판 공생의 도구", stagger=11, theme="accentBright", fontSize=24),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("CONVIVIALITY 2.0"),
        headline("공생의 도구 활용"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_57(subs, dur):
    """창조성을 증폭하는 AI — K"""
    root = base_root()
    root["children"] = [
        kicker("AMPLIFIER"),
        headline("AI는 증폭기"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "zap", "title": "창조성 증폭기", "body": "인간을 대체하는 도구가 아닌\n창조성을 증폭시키는 공생의 도구"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 0) + 15, "duration": 15},
        },
    ]
    return root


def design_scene_58(subs, dur):
    """가치 노동 생태계 — SVG hub"""
    cx, cy = 350, 260
    elements = [
        # Center
        svg_circle(cx, cy, 70, stagger=0, theme="accentBright", strokeWidth=3),
        svg_text(cx, cy - 12, "가치 노동", stagger=1, theme="text", fontSize=22, fontWeight="bold"),
        svg_text(cx, cy + 18, "생태계", stagger=1, theme="muted", fontSize=16),
        # Node 1: Autonomy
        svg_circle(cx - 200, cy - 80, 45, stagger=2, theme="accent"),
        svg_text(cx - 200, cy - 80, "자율", stagger=3, theme="text", fontSize=18),
        svg_line(cx - 70, cy - 30, cx - 155, cy - 55, stagger=2, theme="accent"),
        # Node 2: AI tool
        svg_circle(cx + 200, cy - 80, 45, stagger=4, theme="accent"),
        svg_text(cx + 200, cy - 80, "AI 도구", stagger=5, theme="text", fontSize=16),
        svg_line(cx + 70, cy - 30, cx + 155, cy - 55, stagger=4, theme="accent"),
        # Node 3: Domain
        svg_circle(cx - 200, cy + 120, 45, stagger=6, theme="accent"),
        svg_text(cx - 200, cy + 120, "도메인", stagger=7, theme="text", fontSize=18),
        svg_line(cx - 55, cy + 50, cx - 160, cy + 85, stagger=6, theme="accent"),
        # Node 4: Relationships
        svg_circle(cx + 200, cy + 120, 45, stagger=8, theme="accent"),
        svg_text(cx + 200, cy + 120, "관계", stagger=9, theme="text", fontSize=18),
        svg_line(cx + 55, cy + 50, cx + 160, cy + 85, stagger=8, theme="accent"),
        # Top title
        svg_text(cx, 60, "주도적 가치 노동 생태계", stagger=10, theme="accentBright", fontSize=22),
    ]
    root = base_root(gap=18)
    root["children"] = [
        kicker("ECOSYSTEM"),
        headline("가치 노동 생태계"),
        svg_graphic("0 0 700 500", 700, 500, elements, ea=sub_enter(subs, 1)),
    ]
    return root


def design_scene_59(subs, dur):
    """일리치의 마지막 질문 — Icon hero A"""
    root = base_root()
    root["children"] = [
        kicker("FINAL QUESTION"),
        icon_node("message-circle", 90, ea=15, emphasis="glowPulse"),
        headline("일리치의 질문"),
        footer("마지막으로 드리고 싶은 질문", ea=sub_enter(subs, 0) + 10),
    ]
    return root


def design_scene_60(subs, dur):
    """월급 없이 계속할 일 — Quote H"""
    root = base_root()
    root["children"] = [
        kicker("ILLICH'S QUESTION"),
        headline("당신에게 묻습니다"),
        quote_text(
            "당신이 월급을 받지 않아도\n계속할 수 있는 일은 무엇입니까?",
            "이반 일리치",
            ea=sub_enter(subs, 0) + 10,
        ),
    ]
    return root


def design_scene_61(subs, dur):
    """그것이 가치 노동이다 — Icon hero A (heart)"""
    root = base_root()
    root["children"] = [
        kicker("ANSWER"),
        icon_node("heart", 100, ea=15, emphasis="pulse"),
        headline("그것이 가치 노동"),
        {
            "id": "bt0",
            "type": "BodyText",
            "data": {"text": "AI가 아무리 똑똑해져도\n절대 대체하지 못하는 영역입니다"},
            "style": {"maxWidth": 700, "textAlign": "center"},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 15},
        },
    ]
    return root


def design_scene_62(subs, dur):
    """일리치도 알고 있었다 — K"""
    root = base_root()
    root["children"] = [
        kicker("LEGACY"),
        headline("50년 전의 통찰"),
        {
            "id": "ic0",
            "type": "IconCard",
            "data": {"icon": "book-open", "title": "일리치의 선견지명",
                     "body": "50년 전에 이미 알고 있었습니다\n오늘 작은 질문 하나를 남기겠습니다"},
            "style": {"maxWidth": 600},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 0) + 15, "duration": 15},
        },
    ]
    return root


def design_scene_63(subs, dur):
    """지금 하고 있는가? — Icon hero A (target)"""
    root = base_root()
    root["children"] = [
        kicker("QUESTION"),
        icon_node("target", 100, ea=15, emphasis="glowPulse"),
        headline("지금 하고 있는가?"),
        {
            "id": "bt0",
            "type": "BodyText",
            "data": {"text": "정말로 하고 싶은 일을\n지금 이 순간 하고 있습니까?"},
            "style": {"maxWidth": 700, "textAlign": "center"},
            "motion": {"preset": "fadeUp", "enterAt": sub_enter(subs, 1), "duration": 15},
        },
    ]
    return root


def design_scene_64(subs, dur):
    """감사합니다 — Icon hero A (smile)"""
    root = base_root()
    root["children"] = [
        kicker("THANK YOU"),
        icon_node("smile", 100, ea=15, emphasis="pulse"),
        headline("감사합니다"),
    ]
    return root


# ============================================================================
# Main
# ============================================================================

DESIGN_MAP = {
    10: design_scene_10,
    11: design_scene_11,
    12: design_scene_12,
    13: design_scene_13,
    14: design_scene_14,
    15: design_scene_15,
    16: design_scene_16,
    17: design_scene_17,
    18: design_scene_18,
    19: design_scene_19,
    20: design_scene_20,
    21: design_scene_21,
    22: design_scene_22,
    23: design_scene_23,
    24: design_scene_24,
    25: design_scene_25,
    26: design_scene_26,
    27: design_scene_27,
    28: design_scene_28,
    29: design_scene_29,
    30: design_scene_30,
    31: design_scene_31,
    32: design_scene_32,
    33: design_scene_33,
    34: design_scene_34,
    35: design_scene_35,
    36: design_scene_36,
    37: design_scene_37,
    38: design_scene_38,
    39: design_scene_39,
    40: design_scene_40,
    41: design_scene_41,
    42: design_scene_42,
    43: design_scene_43,
    44: design_scene_44,
    45: design_scene_45,
    46: design_scene_46,
    47: design_scene_47,
    48: design_scene_48,
    49: design_scene_49,
    50: design_scene_50,
    51: design_scene_51,
    52: design_scene_52,
    53: design_scene_53,
    54: design_scene_54,
    55: design_scene_55,
    56: design_scene_56,
    57: design_scene_57,
    58: design_scene_58,
    59: design_scene_59,
    60: design_scene_60,
    61: design_scene_61,
    62: design_scene_62,
    63: design_scene_63,
    64: design_scene_64,
}

# Archetype labels for reporting
ARCHETYPE_MAP = {
    10: "C_Grid",
    11: "E_Timeline",
    12: "A_IconHero",
    13: "SVG_layers",
    14: "K_SingleCard",
    15: "SVG_versus",
    16: "K_SingleCard",
    17: "D_Process",
    18: "E_Timeline",
    19: "A_IconHero",
    20: "U_ChatBubble",
    21: "C_Grid",
    22: "G_Warning",
    23: "SVG_versus",
    24: "A_StatNumber",
    25: "B_CompareCard",
    26: "SVG_hub",
    27: "SVG_split",
    28: "SVG_versus",
    29: "G_Warning",
    30: "SVG_ring",
    31: "A_IconHero",
    32: "K_SingleCard",
    33: "SVG_layers",
    34: "H_Quote",
    35: "M_CompareBars",
    36: "SVG_ring",
    37: "M_CompareBars",
    38: "Pyramid",
    39: "I_ProcessStep",
    40: "SVG_flow",
    41: "SVG_hub",
    42: "K_SingleCard",
    43: "B_CompareCard",
    44: "D_FlowDiagram",
    45: "M_CompareBars",
    46: "H_Quote",
    47: "SVG_ring",
    48: "SVG_hub",
    49: "E_Timeline",
    50: "A_IconHero",
    51: "SVG_versus",
    52: "A_IconHero",
    53: "G_Warning",
    54: "O_CompareCard",
    55: "B_CompareCard",
    56: "SVG_flow",
    57: "K_SingleCard",
    58: "SVG_hub",
    59: "A_IconHero",
    60: "H_Quote",
    61: "A_IconHero",
    62: "K_SingleCard",
    63: "A_IconHero",
    64: "A_IconHero",
}


def main():
    with open(SCENES_FILE) as f:
        scenes = json.load(f)

    print(f"Loaded {len(scenes)} scenes")

    # Apply designs
    for idx in range(10, 65):
        scene = scenes[idx]
        subs = scene["subtitles"]
        dur = scene["duration_frames"]
        design_fn = DESIGN_MAP[idx]
        new_root = design_fn(subs, dur)
        scene["stack_root"] = new_root
        scene["transition"] = {"type": "none", "durationFrames": 0}

        # Update copy_layers from the new root's headline
        hl_text = ""
        for child in new_root.get("children", []):
            if child.get("type") == "Headline":
                hl_text = child.get("data", {}).get("text", "")
                break
        kicker_text = ""
        for child in new_root.get("children", []):
            if child.get("type") == "Kicker":
                kicker_text = child.get("data", {}).get("text", "")
                break
        scene["copy_layers"]["headline"] = hl_text
        scene["copy_layers"]["kicker"] = kicker_text

    # Validate no 3 consecutive same archetype
    archetypes = [ARCHETYPE_MAP[i] for i in range(10, 65)]
    for i in range(len(archetypes) - 2):
        if archetypes[i] == archetypes[i + 1] == archetypes[i + 2]:
            print(f"  WARNING: 3 consecutive '{archetypes[i]}' at scenes {i+10}-{i+12}")

    # Report archetype distribution
    from collections import Counter
    counter = Counter(archetypes)
    print("\n=== Archetype Distribution (scenes 10-64) ===")
    for arch, count in sorted(counter.items(), key=lambda x: -x[1]):
        print(f"  {arch:20s}: {count}")

    # Count direct SVG scenes
    svg_scenes = [i for i in range(10, 65) if "SVG" in ARCHETYPE_MAP[i]]
    print(f"\nDirect SVG scenes: {len(svg_scenes)} ({svg_scenes})")

    total_types = len(set(archetypes))
    print(f"Unique archetype varieties: {total_types}")

    # Save
    with open(SCENES_FILE, "w") as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {SCENES_FILE}")
    print("Done!")


if __name__ == "__main__":
    main()
