#!/usr/bin/env python3
"""
deep-blue: scene.subtitles[]를 의미 단위로 재분할.
이전 버전은 어절 단위 강제 분할로 '가면,' 같은 파편을 만들었음.
이번 버전은 문장부호 → 접속사 → 절 종결 어미까지만 시도하고
그래도 긴 구절은 그대로 두어 의미를 보존한다.
"""
import json, re
from typing import List, Tuple

PID = "deep-blue"
MAX = 30  # 한 줄 목표 상한

# ---------- SRT 파싱 ----------
def parse_srt(path):
    entries = []
    raw = open(path).read().strip()
    for b in re.split(r"\n\n+", raw):
        lines = b.strip().split("\n")
        if len(lines) < 3: continue
        m = re.match(r"(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})", lines[1])
        if not m: continue
        vals = list(map(int, m.groups()))
        s_ms = vals[0]*3600000 + vals[1]*60000 + vals[2]*1000 + vals[3]
        e_ms = vals[4]*3600000 + vals[5]*60000 + vals[6]*1000 + vals[7]
        text = " ".join(lines[2:]).strip()
        entries.append({"start_ms": s_ms, "end_ms": e_ms, "text": text})
    return entries

# ---------- 의미 단위 분할 ----------
# 접속사 (문두 또는 쉼표 뒤에 오는 것)
CONJ = r"(?:그런데|하지만|그래서|그리고|그러니까|오히려|심지어|정확히는|그러면|그래도|따라서)"
# 절 종결 어미 (이 다음에 공백이 있으면 절 경계)
CLAUSE_END = r"(?:때|면|지만|니까|면서|라서|해서|되어|되면)"

def split_by_sentence(text: str) -> List[str]:
    """문장부호 . ! ? 기준 1차 분할. 구두점 유지."""
    pieces = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in pieces if p.strip()]

def split_by_comma(text: str) -> List[str]:
    """쉼표 기준 분할. 쉼표 유지."""
    pieces = re.split(r"(?<=,)\s+", text.strip())
    return [p.strip() for p in pieces if p.strip()]

def split_by_conjunction(text: str) -> List[str]:
    """접속사로 시작하는 구문을 분리. '그런데 A B C' → ['A', '그런데 B C']는 아니고,
       중간에 접속사가 있으면 거기서 자른다. 예: 'X Y 그래서 Z W' → ['X Y', '그래서 Z W']"""
    # 공백 + 접속사 + 공백 앞에서 split
    pattern = rf"(?<=\s){CONJ}(?=\s)"
    # positions of match starts
    matches = [m for m in re.finditer(pattern, text)]
    if not matches:
        return [text]
    out = []
    prev = 0
    for m in matches:
        left = text[prev:m.start()].rstrip()
        if left:
            out.append(left)
        prev = m.start()
    tail = text[prev:].strip()
    if tail:
        out.append(tail)
    return out

def split_by_clause_end(text: str) -> List[str]:
    """절 종결 어미 뒤에서 분할. '~때 A B' → ['~때', 'A B']"""
    # 가변 길이 look-behind 회피: 매치 위치를 직접 찾기
    clause_words = ["때", "면", "지만", "니까", "면서", "라서", "해서", "되면",
                    "고", "며", "여", "되어"]
    parts = []
    cursor = 0
    i = 0
    while i < len(text):
        # 공백을 만났을 때 그 앞이 clause_word로 끝나는지 체크
        if text[i] == " ":
            prefix = text[cursor:i]
            if any(prefix.endswith(w) for w in clause_words) and len(prefix.strip()) >= 6:
                parts.append(prefix.strip())
                cursor = i + 1
        i += 1
    tail = text[cursor:].strip()
    if tail:
        parts.append(tail)
    if not parts:
        return [text]
    # 짧은 조각은 다음과 합치기 (너무 잘게 쪼개지는 걸 방지)
    merged = []
    for p in parts:
        if merged and (len(merged[-1]) < 10 or len(p) < 10):
            merged[-1] = merged[-1] + " " + p
        else:
            merged.append(p)
    return merged

def semantic_split(text: str) -> List[str]:
    """문장 → 쉼표 → 접속사 → 절 종결 어미 순으로 시도.
       max 넘으면 다음 레벨. 끝까지 못 줄이면 그대로 반환 (2줄 허용)."""
    text = text.strip()
    if not text: return []

    # Level 1: 문장
    out = split_by_sentence(text)
    if all(len(p) <= MAX for p in out): return out

    # Level 2: 쉼표
    next_out = []
    for p in out:
        if len(p) <= MAX:
            next_out.append(p)
        else:
            next_out.extend(split_by_comma(p))
    out = next_out
    if all(len(p) <= MAX for p in out): return out

    # Level 3: 접속사
    next_out = []
    for p in out:
        if len(p) <= MAX:
            next_out.append(p)
        else:
            next_out.extend(split_by_conjunction(p))
    out = next_out
    if all(len(p) <= MAX for p in out): return out

    # Level 4: 절 종결 어미 — 그래도 긴 건 2줄 허용
    next_out = []
    for p in out:
        if len(p) <= MAX:
            next_out.append(p)
        else:
            pieces = split_by_clause_end(p)
            next_out.extend(pieces)
    return next_out  # 일부는 여전히 MAX 초과할 수 있음 — 2줄 허용

def allocate_times(pieces: List[str], start_ms: int, end_ms: int) -> List[Tuple[str,int,int]]:
    total_chars = sum(len(p) for p in pieces) or 1
    duration = end_ms - start_ms
    cum = 0.0
    out = []
    for i, p in enumerate(pieces):
        share = len(p) / total_chars
        seg_dur = duration * share
        cs = round(start_ms + cum)
        ce = end_ms if i == len(pieces) - 1 else round(start_ms + cum + seg_dur)
        out.append((p, cs, ce))
        cum += seg_dur
    return out

# ---------- 실행 ----------
srt_entries = parse_srt(f"output/{PID}.srt")

# 펼친 subtitle 리스트 (글로벌 ms)
flat = []
for e in srt_entries:
    pieces = semantic_split(e["text"])
    flat.extend(allocate_times(pieces, e["start_ms"], e["end_ms"]))

# 통계
lengths = [len(p[0]) for p in flat]
print(f"총 {len(flat)}개 자막")
print(f"  길이 분포: min={min(lengths)} max={max(lengths)} mean={sum(lengths)/len(lengths):.1f}")
print(f"  30자 초과: {sum(1 for l in lengths if l>30)}개")
print(f"  5자 이하: {sum(1 for l in lengths if l<=5)}개")

# scenes-v2에 적용 — center 기준 한 씬에만 할당 (경계 클립 방지)
scenes = json.load(open(f"data/{PID}/scenes-v2.json"))
for sc in scenes:
    sc["subtitles"] = []

for text, gs, ge in flat:
    center = (gs + ge) / 2
    # center가 속한 씬 찾기
    target = None
    for sc in scenes:
        if sc["start_ms"] <= center < sc["end_ms"]:
            target = sc
            break
    if target is None:
        # edge case: 마지막 씬 이후
        target = scenes[-1]
    sc_start = target["start_ms"]
    sc_dur_ms = target["end_ms"] - sc_start
    # 상대 시간, 씬 길이로 클램핑
    rel_start = max(0, gs - sc_start) / 1000
    rel_end = min(sc_dur_ms, ge - sc_start) / 1000
    if rel_end <= rel_start:
        rel_end = min(sc_dur_ms / 1000, rel_start + 0.3)
    target["subtitles"].append({
        "startTime": round(rel_start, 3),
        "endTime": round(rel_end, 3),
        "text": text,
    })

json.dump(scenes, open(f"data/{PID}/scenes-v2.json","w"), indent=2, ensure_ascii=False)

# render-props 동기화
props = {"projectId": PID, "audioSrc": f"{PID}.mp3", "scenes": scenes}
json.dump(props, open(f"data/{PID}/render-props-v2.json","w"), indent=2, ensure_ascii=False)
print(f"✅ {len(scenes)}씬 자막 재분할 완료")

# 샘플 출력
for i in [11, 14, 20]:
    print(f"\n--- scene-{i} ---")
    for s in scenes[i]["subtitles"]:
        marker = " ⚠2줄" if len(s["text"]) > 30 else ""
        print(f"  [{s['startTime']:.2f}-{s['endTime']:.2f}] ({len(s['text'])}자){marker} {s['text']}")
