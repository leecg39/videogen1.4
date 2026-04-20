#!/bin/bash
# postprocess-cinematic.sh — 시네마틱 영상 후처리 파이프라인
#
# 사용법: bash scripts/postprocess-cinematic.sh data/{projectId}/scenes-v2.json
#
# 인포그래픽 전용 단계 제거, 타이밍 보정만 수행:
#   ① fix-transition-drift (TransitionSeries 오버랩 보정)

set -e

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: bash scripts/postprocess-cinematic.sh data/{projectId}/scenes-v2.json"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

echo ""
echo "🎬 시네마틱 후처리 파이프라인 시작: $FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "① fix-transition-drift (TransitionSeries 오버랩 보정)..."
npx tsx scripts/fix-transition-drift.ts "$FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 시네마틱 후처리 완료!"
echo ""
