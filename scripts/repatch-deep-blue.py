#!/usr/bin/env python3
"""
deep-blue: 새 TTS audio + scene 타이밍 보정 + 자막 한 줄 단위 재분할.
- 각 scene의 start/end/duration_frames를 새 audio total_ms에 비례 스케일
- stack_root의 enterAt도 비례 스케일 (모든 nested 노드 walk)
- scene.subtitles[]는 새 SRT를 단위로 24자 한도 single-line으로 재분할
"""
import json, re, os, math
from typing import List, Tuple

PID = "deep-blue"
FPS = 30
MAX_LINE_CHARS = 24  # Korean chars per single line

# ---------- 1. 새 SRT 파싱 ----------
def parse_srt(path):
    entries = []
    raw = open(path).read().strip()
    blocks = re.split(r"\n\n+", raw)
    for b in blocks:
        lines = b.strip().split("\n")
        if len(lines) < 3: continue
        # idx | ts | text...
        ts = lines[1]
        m = re.match(r"(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})", ts)
        if not m: continue
        sh,sm,ss,sms = map(int, m.groups()[:4])
        eh,em,es,ems = map(int, m.groups()[4:])
        start_ms = sh*3600000 + sm*60000 + ss*1000 + sms
        end_ms = eh*3600000 + em*60000 + es*1000 + ems
        text = " ".join(lines[2:]).strip()
        entries.append({"idx": int(lines[0]), "start_ms": start_ms, "end_ms": end_ms, "text": text})
    return entries

new_srt = parse_srt(f"output/{PID}.srt")
new_total_ms = new_srt[-1]["end_ms"]
print(f"new SRT: {len(new_srt)} entries, total {new_total_ms/1000:.2f}s")

# ---------- 2. scenes-v2 로드 ----------
scenes = json.load(open(f"data/{PID}/scenes-v2.json"))
old_total_ms = max(s["end_ms"] for s in scenes)
print(f"old total {old_total_ms/1000:.2f}s")
scale = new_total_ms / old_total_ms
print(f"scale factor: {scale:.5f}")

# ---------- 3. 새 SRT를 단일 라인 단위로 재분할 ----------
def split_single_line(text: str, start_ms: int, end_ms: int) -> List[Tuple[str, int, int]]:
    """한 SRT 항목을 24자 이하 한 줄 자막 여러 개로 분할.
    반환: [(text, start_ms, end_ms), ...]
    """
    text = text.strip()
    if not text: return []
    if len(text) <= MAX_LINE_CHARS:
        return [(text, start_ms, end_ms)]

    # 1차: 마침표/물음표/느낌표 기준 (이미 SRT 단위는 한 문장이지만 안전)
    # 2차: 쉼표 기준
    # 3차: Korean 접속사
    parts = []
    # split at commas first
    pieces = re.split(r"(?<=,)\s*", text)
    pieces = [p.strip() for p in pieces if p.strip()]

    # 각 piece가 여전히 길면 어절 단위 분할
    final_pieces = []
    for p in pieces:
        if len(p) <= MAX_LINE_CHARS:
            final_pieces.append(p)
        else:
            # 어절(공백) 단위로 모아서 24자 한도
            words = p.split(" ")
            buf = ""
            for w in words:
                if not buf:
                    buf = w
                elif len(buf) + 1 + len(w) <= MAX_LINE_CHARS:
                    buf = buf + " " + w
                else:
                    final_pieces.append(buf)
                    buf = w
            if buf:
                final_pieces.append(buf)

    # 시간 분배 (글자 수 비례)
    total_chars = sum(len(p) for p in final_pieces) or 1
    duration = end_ms - start_ms
    cum = 0
    out = []
    for i, p in enumerate(final_pieces):
        share = len(p) / total_chars
        seg_dur = duration * share
        seg_start = start_ms + cum
        seg_end = end_ms if i == len(final_pieces) - 1 else round(start_ms + cum + seg_dur)
        out.append((p, round(seg_start), seg_end))
        cum += seg_dur
    return out

# 새 SRT를 한 줄 단위로 펼치기 (글로벌 ms)
flat_subs = []  # [(text, start_ms, end_ms)]
for entry in new_srt:
    pieces = split_single_line(entry["text"], entry["start_ms"], entry["end_ms"])
    flat_subs.extend(pieces)

print(f"flattened single-line subs: {len(flat_subs)}")

# ---------- 4. 씬 타이밍 스케일 ----------
def scale_enter_at(node, factor):
    if isinstance(node, dict):
        m = node.get("motion") or {}
        if "enterAt" in m and isinstance(m["enterAt"], (int, float)):
            m["enterAt"] = round(m["enterAt"] * factor)
        # also check stepEnterAts
        d = node.get("data") or {}
        if "stepEnterAts" in d and isinstance(d["stepEnterAts"], list):
            d["stepEnterAts"] = [round(x * factor) for x in d["stepEnterAts"]]
        for c in node.get("children", []) or []:
            scale_enter_at(c, factor)

cum_offset_ms = 0  # 새 누적 위치
for sc in scenes:
    old_start = sc["start_ms"]
    old_end = sc["end_ms"]
    old_dur = old_end - old_start
    new_dur = round(old_dur * scale)
    new_start = cum_offset_ms
    new_end = cum_offset_ms + new_dur
    sc["start_ms"] = new_start
    sc["end_ms"] = new_end
    sc["duration_frames"] = round(new_dur * FPS / 1000)
    cum_offset_ms = new_end

    # stack_root의 enterAt 스케일
    if sc.get("stack_root"):
        scale_enter_at(sc["stack_root"], scale)

# ---------- 5. 각 씬의 subtitles[]를 새 SRT 한 줄 자막으로 채우기 ----------
# 글로벌 ms 기준으로 각 씬에 속하는 flat_subs를 찾기
for sc in scenes:
    sc_start = sc["start_ms"]
    sc_end = sc["end_ms"]
    new_subs = []
    for text, gms_start, gms_end in flat_subs:
        # 씬 범위와 교집합이 있으면 포함
        if gms_end <= sc_start or gms_start >= sc_end:
            continue
        # 클램핑
        cs = max(gms_start, sc_start)
        ce = min(gms_end, sc_end)
        if ce <= cs:
            continue
        new_subs.append({
            "startTime": round((cs - sc_start) / 1000, 3),
            "endTime": round((ce - sc_start) / 1000, 3),
            "text": text,
        })
    sc["subtitles"] = new_subs

# ---------- 6. 저장 + render-props 동기화 + audio 복사 ----------
json.dump(scenes, open(f"data/{PID}/scenes-v2.json","w"), indent=2, ensure_ascii=False)

props = {"projectId": PID, "audioSrc": f"{PID}.mp3", "scenes": scenes}
json.dump(props, open(f"data/{PID}/render-props-v2.json","w"), indent=2, ensure_ascii=False)

import shutil
shutil.copy(f"output/{PID}.mp3", f"public/{PID}.mp3")
print(f"audio copied → public/{PID}.mp3")

total_frames = sum(s["duration_frames"] for s in scenes)
print(f"new total frames: {total_frames} ({total_frames/FPS:.2f}s)")
print(f"new total scene end: {scenes[-1]['end_ms']/1000:.2f}s")

# 자막 한 줄 검증
oversized = [(s["id"], sub["text"], len(sub["text"])) for s in scenes for sub in s["subtitles"] if len(sub["text"]) > MAX_LINE_CHARS]
print(f"oversized subs (>{MAX_LINE_CHARS} chars): {len(oversized)}")
for oid, txt, ln in oversized[:5]:
    print(f"  {oid}: '{txt}' ({ln})")
