#!/bin/bash
# run-experiment.sh — 백업 복원 → postprocess → 측정
# 사용법: bash scripts/autoresearch/run-experiment.sh
set -e

PROJECTS="rag3 saas-fullstack value-labor-v2 ai-coding-future"

# 1. 백업에서 복원 (깨끗한 상태)
for d in $PROJECTS; do
  cp "data/$d/scenes-v2.baseline.json" "data/$d/scenes-v2.json"
done

# 2. postprocess 실행
for d in $PROJECTS; do
  bash scripts/postprocess.sh "data/$d/scenes-v2.json" > /dev/null 2>&1
done

# 3. 측정
npx tsx scripts/autoresearch/measure-sync.ts data/rag3 data/saas-fullstack data/value-labor-v2 data/ai-coding-future
