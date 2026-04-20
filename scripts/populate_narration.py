#!/usr/bin/env python3
"""
Populate narration fields in scenes-v2.json from SRT subtitle file.
Matches SRT entries to scenes by time range overlap.
"""

import json
import re
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRT_PATH = BASE / "input" / "자막.srt"
SCENES_PATH = BASE / "data" / "rag-intro" / "scenes-v2.json"
RENDER_PROPS_PATH = BASE / "data" / "rag-intro" / "render-props-v2.json"


def parse_srt(path: Path) -> list[dict]:
    """Parse SRT file into list of {index, start_ms, end_ms, text}."""
    content = path.read_text(encoding="utf-8-sig")
    entries = []
    # Split by blank lines
    blocks = re.split(r"\n\n+", content.strip())
    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) < 2:
            continue
        # Line 0: index
        index = int(lines[0].strip())
        # Line 1: timestamps
        ts_match = re.match(
            r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})",
            lines[1].strip(),
        )
        if not ts_match:
            continue
        g = [int(x) for x in ts_match.groups()]
        start_ms = g[0] * 3600000 + g[1] * 60000 + g[2] * 1000 + g[3]
        end_ms = g[4] * 3600000 + g[5] * 60000 + g[6] * 1000 + g[7]
        # Lines 2+: text
        text = " ".join(line.strip() for line in lines[2:] if line.strip())
        entries.append(
            {
                "index": index,
                "start_ms": start_ms,
                "end_ms": end_ms,
                "text": text,
            }
        )
    return entries


def overlaps(sub_start, sub_end, scene_start, scene_end) -> bool:
    """Check if two time ranges overlap."""
    return sub_start < scene_end and sub_end > scene_start


def populate_scenes(scenes: list[dict], srt_entries: list[dict]) -> list[dict]:
    """Add narration and subtitles to each scene based on SRT time overlap."""
    for scene in scenes:
        s_start = scene["start_ms"]
        s_end = scene["end_ms"]

        matching = []
        for entry in srt_entries:
            if overlaps(entry["start_ms"], entry["end_ms"], s_start, s_end):
                matching.append(entry)

        # Set narration as joined text
        scene["narration"] = " ".join(e["text"] for e in matching)

        # Add subtitles array with times in seconds
        scene["subtitles"] = [
            {
                "startTime": round(e["start_ms"] / 1000.0, 3),
                "endTime": round(e["end_ms"] / 1000.0, 3),
                "text": e["text"],
            }
            for e in matching
        ]

    return scenes


def main():
    # Parse SRT
    srt_entries = parse_srt(SRT_PATH)
    print(f"Parsed {len(srt_entries)} SRT entries")

    # Load scenes
    scenes = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    print(f"Loaded {len(scenes)} scenes")

    # Populate
    scenes = populate_scenes(scenes, srt_entries)

    # Save scenes-v2.json
    SCENES_PATH.write_text(
        json.dumps(scenes, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Saved {SCENES_PATH}")

    subprocess.run(
        ["npx", "tsx", "scripts/sync-enterAt.ts", str(SCENES_PATH)],
        cwd=BASE,
        check=True,
    )

    scenes = json.loads(SCENES_PATH.read_text(encoding="utf-8"))

    # Save render-props-v2.json
    render_props = json.loads(RENDER_PROPS_PATH.read_text(encoding="utf-8"))
    render_props["scenes"] = scenes
    RENDER_PROPS_PATH.write_text(
        json.dumps(render_props, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Saved {RENDER_PROPS_PATH}")

    # Print first 3 scenes' narration for verification
    print("\n=== First 3 scenes' narration ===")
    for scene in scenes[:3]:
        print(f"\n[{scene['id']}] ({scene['start_ms']}ms - {scene['end_ms']}ms)")
        print(f"  narration: {scene['narration']}")
        print(f"  subtitles count: {len(scene['subtitles'])}")
        for sub in scene["subtitles"]:
            print(f"    [{sub['startTime']}s - {sub['endTime']}s] {sub['text']}")


if __name__ == "__main__":
    main()
