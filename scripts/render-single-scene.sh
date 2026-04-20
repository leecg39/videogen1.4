#!/bin/bash
# render-single-scene.sh — 단일 씬만 포함한 props 로 전체 TransitionSeries 를 1-scene 으로 축소 렌더.
# 사용: bash scripts/render-single-scene.sh <projectId> <sceneIndex> <outPath>
set -e
PID="$1"
IDX="$2"
OUT="$3"

if [ -z "$PID" ] || [ -z "$IDX" ] || [ -z "$OUT" ]; then
  echo "Usage: bash scripts/render-single-scene.sh <projectId> <sceneIndex> <outPath>"
  exit 1
fi

PROPS="data/${PID}/render-props-v2.json"
TMP="/tmp/vgn-single-scene-${PID}-${IDX}.json"

node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('${PROPS}','utf8'));
const scene = d.scenes[${IDX}];
if (!scene) { console.error('scene index out of range'); process.exit(1); }
scene.transition = null;
d.scenes = [scene];
fs.writeFileSync('${TMP}', JSON.stringify(d));
console.log('scene=' + scene.id + ' duration=' + scene.duration_frames);
"

HALF=$(node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('${TMP}','utf8'));
console.log(Math.floor((d.scenes[0].duration_frames || 90) / 2));
")

npx remotion still src/remotion/index.ts MainComposition "${OUT}" \
  --frame=${HALF} --props="${TMP}" 2>&1 | tail -3

echo "DONE → ${OUT}"
