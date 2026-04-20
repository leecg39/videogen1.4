#!/bin/bash
# validate-density.sh — scenes-v2.json의 레이아웃 밀도를 검증
# postprocess.sh 이후 실행하여 밀도 부족 씬을 리포트
# Usage: bash scripts/validate-density.sh data/{projectId}/scenes-v2.json

set -euo pipefail

SCENES_FILE="${1:?Usage: validate-density.sh <scenes-v2.json>}"

if [ ! -f "$SCENES_FILE" ]; then
  echo "❌ 파일 없음: $SCENES_FILE"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⑥ validate-density — 레이아웃 밀도 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

python3 -c "
import json, sys

CHART_NODES = {'CompareBars', 'RingChart', 'PieChart', 'ProgressBar', 'AreaChart', 'DataTable'}
ICON_NODES = {'DevIcon', 'ImageAsset', 'SvgGraphic', 'Icon'}
CONTAINER_NODES = {'SceneRoot', 'Split', 'Grid', 'Stack', 'FrameBox', 'Overlay', 'AnchorBox', 'SafeArea'}
DECO_NODES = {'Divider', 'Badge', 'Pill', 'ArrowConnector', 'Kicker', 'FooterCaption'}
TEXT_ONLY = {'Headline', 'BodyText', 'MarkerHighlight', 'DualToneText'}

def collect_types(node):
    types = [node.get('type', 'Unknown')]
    for c in node.get('children', []):
        types.extend(collect_types(c))
    return types

scenes = json.load(open('$SCENES_FILE'))
n = len(scenes)
warnings = []
chart_count = 0
asset_count = 0

for s in scenes:
    sr = s.get('stack_root')
    if not sr:
        warnings.append(f\"  ❌ {s['id']}: stack_root 없음\")
        continue

    all_types = collect_types(sr)
    meaningful = [t for t in all_types if t not in CONTAINER_NODES and t not in DECO_NODES]
    has_chart = any(t in CHART_NODES for t in all_types)
    has_asset = any(t in ICON_NODES for t in all_types)
    text_only = all(t in TEXT_ONLY for t in meaningful)
    dur_s = (s['end_ms'] - s['start_ms']) / 1000

    if has_chart: chart_count += 1
    if has_asset: asset_count += 1

    # 밀도 체크
    if dur_s >= 20 and len(meaningful) < 4:
        warnings.append(f\"  ⚠ {s['id']} ({dur_s:.0f}s): 유의미 노드 {len(meaningful)}개 (20s+ 씬은 ≥4 필요)\")
    elif dur_s >= 10 and len(meaningful) < 3:
        warnings.append(f\"  ⚠ {s['id']} ({dur_s:.0f}s): 유의미 노드 {len(meaningful)}개 (10s+ 씬은 ≥3 필요)\")

    # 텍스트 온리 체크
    if text_only and len(meaningful) > 0:
        warnings.append(f\"  ⚠ {s['id']}: 텍스트만 있음 — 차트/아이콘/숫자 추가 필요\")

chart_pct = chart_count / n * 100
asset_pct = asset_count / n * 100

print(f'  차트 사용률: {chart_count}/{n} ({chart_pct:.0f}%) {\"✅\" if chart_pct >= 30 else \"❌ <30%\"}')
print(f'  에셋 사용률: {asset_count}/{n} ({asset_pct:.0f}%) {\"✅\" if asset_pct >= 50 else \"❌ <50%\"}')

if warnings:
    print(f'\n  경고 {len(warnings)}개:')
    for w in warnings:
        print(w)
    print(f'\n  ⚠ 밀도 검증에서 {len(warnings)}개 문제 발견')
else:
    print(f'\n  ✅ 밀도 검증 통과!')
"
