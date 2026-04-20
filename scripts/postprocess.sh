#!/bin/bash
# postprocess.sh — 후처리 파이프라인 5단계 일괄 실행
#
# 사용법: bash scripts/postprocess.sh data/{projectId}/scenes-v2.json
#
# 순서:
#   ① sync-enterAt: 자막 키워드 ↔ 노드 텍스트 매칭으로 enterAt 동기화
#   ② fix-row-spacing: Row Stack 내 카드↔화살표 간격 보정
#   ③ optimize-layout: 콘텐츠 높이 기반 gap/maxWidth 자동 조정
#   ④ pad-sparse-scenes: sparse 씬에 InsightTile 자동 삽입
#   ⑤ fix-all-enterAt-gaps: 5초 이상 공백 재분배 + 컨테이너 enterAt 동기화
#
# 검증 체인 (⑥-0 ~ ⑥-v, ⑦, ⑧): 25 HARD GATE
#   DSL 레벨 (텍스트/시맨틱):
#     ⑥-0 visual-plan-coverage         ⑥-g phase-separation
#     ⑥-a layout-diversity             ⑥-h determinism
#     ⑥-b density                      ⑥-i no-exit-anim
#     ⑥-c fidelity                     ⑥-j motion-variety
#     ⑥-d label-quality                ⑥-k no-br
#     ⑥-e node-uniqueness              ⑥-l tabular
#     ⑥-f design-sync                  ⑥-m text-length
#                                       ⑥-n progression
#                                       ⑥-o slide-archetype
#                                       ⑥-p svg-motif-count
#                                       ⑥-q narration-sync
#                                       ⑥-r sfx-volume
#   시각 출력(픽셀) 레벨 (Hyperframes 가드레일):
#     ⑥-s no-emoji  ·  ⑥-t freetext-cap  ·  ⑥-u absolute-bbox  ·  ⑥-v frame-pixels
#   SVG Forge (라이브러리 기반 커스텀 스케치):
#     ⑥-w svg-asset-integrity  ·  ⑥-x svg-coverage
#   Cinematic Backgrounds:
#     ⑥-y background-coverage (asset_mode 에 video 포함 시 ≥30% 강제)
#   Scene Grammar v1.1 (감사 반영 2026-04-18):
#     ⑥-za node-count  ·  ⑥-zb hero-frame  ·  ⑥-zc absolute-content
#     ⑥-zd preview-reviewed  ·  ⑥-ze allow-exit  ·  ⑥-zf visual-elements
#   sync:
#     ⑦ check-scene-sync · ⑧ sync-render-props

set -e

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: bash scripts/postprocess.sh data/{projectId}/scenes-v2.json"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

echo ""
echo "🔧 후처리 파이프라인 시작: $FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ⓪-pre prepare-dsl-subset — R9 원칙 A 분기
# TSX wrapper 씬과 DSL 씬을 분리하여 이후 validator 가 올바른 subset 에서 실행되도록 한다.
# scenes-v2.dsl-subset.json / scenes-v2.tsx-subset.json 생성.
echo ""
echo "⓪-pre prepare-dsl-subset (원칙 A · TSX 분기)..."
node scripts/prepare-dsl-subset.js "$FILE" || {
  echo "❌ prepare-dsl-subset 실패"
  exit 1
}
DSL_FILE="${FILE%.json}.dsl-subset.json"
TSX_FILE="${FILE%.json}.tsx-subset.json"

# ⓪-tsx TSX AST validators — TSX wrapper 씬 대상
if [ -s "$TSX_FILE" ]; then
  TSX_COUNT=$(node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync('$TSX_FILE','utf8')).length)")
  if [ "$TSX_COUNT" -gt 0 ]; then
    echo ""
    echo "⓪-tsx1 validate-tsx-structural-signature (P4 AST 이식)..."
    node scripts/validate-tsx-structural-signature.js "$FILE" || exit 1

    echo ""
    echo "⓪-tsx2 validate-tsx-video-narration-match (P10 재정의)..."
    node scripts/validate-tsx-video-narration-match.js "$FILE" || exit 1

    if [ -f "scripts/validate-tsx-text-dedup.js" ]; then
      echo ""
      echo "⓪-tsx3 validate-tsx-text-dedup (P3 AST 이식)..."
      node scripts/validate-tsx-text-dedup.js "$FILE" || exit 1
    fi
  fi
fi

# ⓪-dsl _dsl_rationale strict — DSL 씬은 원칙 A 3조건 근거 필수
if [ -f "scripts/validate-dsl-rationale.js" ]; then
  echo ""
  echo "⓪-dsl validate-dsl-rationale (원칙 A strict)..."
  node scripts/validate-dsl-rationale.js "$DSL_FILE" || exit 2
fi

echo ""
echo "⓪-a normalize-stack-nodes (플랫→중첩 구조 정규화)..."
node scripts/normalize-stack-nodes.js "$FILE"

echo ""
echo "⓪-c strip-kicker-motion (씬 상단 흔들림 방지)..."
node scripts/strip-kicker-motion.js "$FILE"

echo ""
echo "⓪-b fix-transition-drift (TransitionSeries 오버랩 보정)..."
npx tsx scripts/fix-transition-drift.ts "$FILE"

echo ""
echo "① sync-enterAt — 비활성화 (타이밍 파괴 방지: 레이아웃 JSON의 enterAt 보존)"
# npx tsx scripts/sync-enterAt.ts "$FILE"

echo ""
echo "② fix-row-spacing (카드↔화살표 간격 보정)..."
npx tsx scripts/fix-row-spacing.ts "$FILE"

echo ""
echo "③ optimize-layout (gap/maxWidth 최적화)..."
npx tsx scripts/optimize-layout.ts "$FILE"

echo ""
echo "④ pad-sparse-scenes — 건너뜀 (12개 문법: 비카드 씬은 의도적으로 sparse)"
# node scripts/pad-sparse-scenes.js "$FILE"

echo ""
echo "⑤ fix-all-enterAt-gaps — 비활성화 (레이아웃 enterAt 보존)"
# node scripts/fix-all-enterAt-gaps.js "$FILE"

echo ""

# ⑥-0 validate-visual-plan-coverage — visual_plan commit HARD GATE
# /vg-scene 이 씬별 구성안을 확정했는지 검증. 구성안 누락 시 /vg-layout 이 realize 할 수 없음.
if [ -f "scripts/validate-visual-plan-coverage.js" ]; then
  node scripts/validate-visual-plan-coverage.js "$FILE" || {
    echo ""
    echo "❌ visual_plan coverage 검증 실패 — /vg-scene 이 시각 구성안을 커밋하지 않았습니다."
    echo "   /vg-scene 을 최신 버전으로 재실행하여 pattern_ref/focal/support 를 채우세요."
    exit 1
  }
fi

# ⑥-a validate-layout-diversity — 구조 다양성 HARD GATE (씬별 수동 설계 강제)
if [ -f "scripts/validate-layout-diversity.js" ]; then
  node scripts/validate-layout-diversity.js "$FILE" || {
    echo ""
    echo "❌ 레이아웃 다양성 검증 실패 — 배치 템플릿으로 생성된 결과로 의심됩니다."
    echo "   /vg-layout 의 핵심 법칙(씬별 수동 설계)을 지켰는지 확인하세요."
    exit 1
  }
fi

# ⑥-b validate-density — 레이아웃 밀도 검증
if [ -f "scripts/validate-density.sh" ]; then
  bash scripts/validate-density.sh "$FILE"
fi

# ⑥-c validate-fidelity — 레퍼런스 DNA 강제 검증 (색상/바차트/DevIcon/focal)
if [ -f "scripts/validate-fidelity.js" ]; then
  node scripts/validate-fidelity.js "$FILE" || {
    echo ""
    echo "❌ fidelity 검증 실패 — reference/SC *.png 의 mint accent / 차트 다양화 / 거대 focal 법칙 위반."
    exit 1
  }
fi

# ⑥-d validate-label-quality — 라벨/텍스트 품질 HARD GATE (DUP_PHRASE 방지)
# 2026-04-17 세션 회고: mass realizer 가 extract_phrases()[0] 를 Kicker/Badge/focal.label 에
# 동시 주입하여 35+ 씬이 "그리고/물론/그냥" 같은 기능어 라벨 + 씬 내 중복 발생.
if [ -f "scripts/validate-label-quality.js" ]; then
  node scripts/validate-label-quality.js "$FILE" || {
    echo ""
    echo "❌ label quality 검증 실패 — Kicker/Badge/focal.label 중복 또는 기능어 라벨."
    echo "   narration 첫 phrase 를 여러 노드에 복사하지 말고, 각 노드는 의미있는 명사구를 사용."
    exit 1
  }
fi

# ⑥-e validate-node-uniqueness — 시각 템플릿-loop HARD GATE
# 2026-04-17 세션 회고: SvgGraphic warning triangle 이 5개 씬에서 동일 재사용.
# narration 과 무관한 realizer fallback 으로 발견.
if [ -f "scripts/validate-node-uniqueness.js" ]; then
  node scripts/validate-node-uniqueness.js "$FILE" || {
    echo ""
    echo "❌ node uniqueness 검증 실패 — 동일 SvgGraphic 템플릿-loop 또는 2-bar 약한 CompareBars."
    echo "   씬별 고유 SVG + 의미있는 CompareBars items ≥ 3 + warning triangle 은 경고 narration 씬만."
    exit 1
  }
fi

# ⑥-f validate-design-sync — docs/design-system.md ↔ theme.ts HARD GATE
# 2026-04-17 회고: docs 는 퍼플 네온 v1 이었고 theme 은 mint 인 불일치 → 혼란.
if [ -f "scripts/validate-design-sync.js" ]; then
  node scripts/validate-design-sync.js || {
    echo ""
    echo "❌ design-system sync 검증 실패 — docs/design-system.md 와 theme.ts 의 브랜드색 불일치."
    exit 1
  }
fi

# ⑥-g validate-phase-separation — Phase A 씬에 motion props 금지
if [ -f "scripts/validate-phase-separation.js" ]; then
  node scripts/validate-phase-separation.js "$FILE" || {
    echo ""
    echo "❌ phase separation 위반 — Phase A 씬에 motion props 존재. 제거 후 Phase B 로 이동."
    exit 1
  }
fi

# ⑥-h validate-determinism — src/remotion Math.random/Date.now/setTimeout 금지
if [ -f "scripts/validate-determinism.js" ]; then
  node scripts/validate-determinism.js || {
    echo ""
    echo "❌ determinism 위반 — src/remotion 에 non-deterministic 패턴 존재."
    exit 1
  }
fi

# ⑥-i validate-no-exit-anim — 퇴장 애니 금지 (마지막 씬의 allow_exit 만 예외)
if [ -f "scripts/validate-no-exit-anim.js" ]; then
  node scripts/validate-no-exit-anim.js "$FILE" || {
    echo ""
    echo "❌ no-exit-anim 위반 — motion.exit 제거. TransitionSeries 가 씬 전환 담당."
    exit 1
  }
fi

# ⑥-j validate-motion-variety — preset 다양성 / 첫 enterAt ≥3 / 무한 loop 차단
if [ -f "scripts/validate-motion-variety.js" ]; then
  node scripts/validate-motion-variety.js "$FILE" || {
    echo ""
    echo "❌ motion variety 위반 — preset 다양화 필요."
    exit 1
  }
fi

# ⑥-k validate-no-br — data.text 내 강제 개행 금지
if [ -f "scripts/validate-no-br.js" ]; then
  node scripts/validate-no-br.js "$FILE" || {
    echo ""
    echo "❌ no-br 위반 — \\n 제거, 한글은 keep-all 자동 래핑."
    exit 1
  }
fi

# ⑥-l validate-tabular — 숫자 노드 tabular-nums 강제
if [ -f "scripts/validate-tabular.js" ]; then
  node scripts/validate-tabular.js || {
    echo ""
    echo "❌ tabular 위반 — StatNumber/ImpactStat 렌더에 tabular-nums 적용."
    exit 1
  }
fi

# ⑥-m validate-text-length — VersusCard ≤15자 / ImpactStat value+suffix ≤8자
if [ -f "scripts/validate-text-length.js" ]; then
  node scripts/validate-text-length.js "$FILE" || {
    echo ""
    echo "❌ text length 위반 — VersusCard/ImpactStat 텍스트 단축."
    exit 1
  }
fi

# ⑥-n validate-progression — 씬 intent 진행 패턴 (compare 다음 emphasize/example)
if [ -f "scripts/validate-progression.js" ]; then
  node scripts/validate-progression.js "$FILE" || {
    echo ""
    echo "❌ progression 위반 — intent 흐름 재배치 또는 /vg-scene 재실행."
    exit 1
  }
fi

# ⑥-o validate-slide-archetype — 슬라이드 유형↔컴포넌트 매핑 (슬라이드 프로젝트에만 적용)
if [ -f "scripts/validate-slide-archetype.js" ]; then
  node scripts/validate-slide-archetype.js "$FILE" || {
    echo ""
    echo "❌ slide archetype 위반 — 슬라이드 유형에 대응되는 필수 컴포넌트 포함."
    exit 1
  }
fi

# ⑥-p validate-svg-motif-count — motif_ids ≤ 3 (scene-plan 우선, 없으면 scenes-v2)
if [ -f "scripts/validate-svg-motif-count.js" ]; then
  PLAN_PATH="$(dirname "$FILE")/scene-plan.json"
  MOTIF_INPUT="$FILE"
  if [ -f "$PLAN_PATH" ]; then MOTIF_INPUT="$PLAN_PATH"; fi
  node scripts/validate-svg-motif-count.js "$MOTIF_INPUT" || {
    echo ""
    echo "❌ svg motif count 위반 — svg-layout-selector 가 motif 를 3개 이하로 잘라야 함."
    exit 1
  }
fi

# ⑥-q validate-narration-sync — demo/video-demo narration 메타톤 금지 (spec 있을 때만)
PROJECT_DIR="$(dirname "$FILE")"
for SPEC in "video-spec.json" "demo-spec.json"; do
  if [ -f "$PROJECT_DIR/$SPEC" ] && [ -f "scripts/validate-narration-sync.js" ]; then
    node scripts/validate-narration-sync.js "$PROJECT_DIR/$SPEC" || {
      echo ""
      echo "❌ narration-sync 위반 ($SPEC) — 메타톤 제거 후 /vg-demo-script 재실행."
      exit 1
    }
  fi
done

# ⑥-r validate-sfx-volume — keepOriginalAudio 세그먼트의 click volume ≤ 0.5
if [ -f "scripts/validate-sfx-volume.js" ]; then
  SPEC_PATH=""
  if [ -f "$PROJECT_DIR/video-spec.json" ]; then SPEC_PATH="$PROJECT_DIR/video-spec.json"; fi
  if [ -z "$SPEC_PATH" ] && [ -f "$PROJECT_DIR/demo-spec.json" ]; then SPEC_PATH="$PROJECT_DIR/demo-spec.json"; fi
  if [ -n "$SPEC_PATH" ]; then
    node scripts/validate-sfx-volume.js "$FILE" "$SPEC_PATH" || {
      echo ""
      echo "❌ sfx-volume 위반 — 원본 오디오 마스킹. click SFX volume ≤ 0.5."
      exit 1
    }
  fi
fi

# ⑥-s validate-no-emoji — 유니코드 이모지 금지 (DevIcon/SvgGraphic 로 교체 강제)
if [ -f "scripts/validate-no-emoji.js" ]; then
  node scripts/validate-no-emoji.js "$FILE" || {
    echo ""
    echo "❌ no-emoji 위반 — 시스템 이모지 제거, DevIcon 또는 SvgGraphic path 로 교체."
    exit 1
  }
fi

# ⑥-t validate-freetext-cap — FreeText 씬당 ≤ 2 (카논 노드 강제)
if [ -f "scripts/validate-freetext-cap.js" ]; then
  node scripts/validate-freetext-cap.js "$FILE" || {
    echo ""
    echo "❌ FreeText cap 위반 — Kicker/Headline/BodyText/FooterCaption/Badge 로 교체."
    exit 1
  }
fi

# ⑥-u validate-absolute-bbox — Absolute 정렬 위반 (flow-collapse + overlap)
if [ -f "scripts/validate-absolute-bbox.js" ]; then
  node scripts/validate-absolute-bbox.js "$FILE" || {
    echo ""
    echo "❌ absolute-bbox 위반 — Absolute 안에 Stack/Grid 컨테이너 필수, bbox overlap 금지."
    exit 1
  }
fi

# ⑥-v validate-frame-pixels — 렌더 결과 PNG 픽셀 품질 (하이퍼프레임스급 시각 가드)
# output/full-frames/*.png 가 있을 때만 (vg-preview-still 또는 render-stills 이후)
if [ -f "scripts/validate-frame-pixels.js" ] && [ -d "output/full-frames" ]; then
  PNG_COUNT=$(ls output/full-frames/*.png 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PNG_COUNT" -gt 0 ]; then
    node scripts/validate-frame-pixels.js output/full-frames || {
      echo ""
      echo "❌ frame-pixels 위반 — 렌더 결과에 블랭크/플랫/중앙 빈 프레임 존재. 해당 씬 재설계."
      exit 1
    }
  fi
fi

# ⑥-w validate-svg-asset-integrity — SvgAsset 참조가 svg-library/index.json 에 존재하는지
if [ -f "scripts/validate-svg-asset-integrity.js" ]; then
  node scripts/validate-svg-asset-integrity.js "$FILE" || {
    echo ""
    echo "❌ svg-asset 무결성 위반 — npx tsx scripts/svg-forge.ts --project <pid> 로 생성."
    exit 1
  }
fi

# ⑥-x validate-svg-coverage — SvgGraphic.elements 직접 작성 비율 제한 (50% 초과 시 FAIL)
if [ -f "scripts/validate-svg-coverage.js" ]; then
  node scripts/validate-svg-coverage.js "$FILE" || {
    echo ""
    echo "❌ svg-coverage 위반 — SvgGraphic.elements 과다. svg-library 로 이전."
    exit 1
  }
fi

# ⑥-y validate-background-coverage — DEPRECATED (v1.4, 2026-04-19)
# 원칙 A 채택으로 TSX 씬 내 <OffthreadVideo> 가 기본. validate-tsx-video-narration-match.js (⓪-tsx2) 가 대체.
# 파일 삭제 후 postprocess 호출 제거.

# ⑥-za validate-node-count — 의미 노드 5~9개 (조건 ②)
if [ -f "scripts/validate-node-count.js" ]; then
  node scripts/validate-node-count.js "$FILE" || { echo "❌ node-count 위반 — 과밀/희박 씬 재설계."; exit 1; }
fi

# ⑥-zb validate-hero-frame — hero_frame_ms 필수
if [ -f "scripts/validate-hero-frame.js" ]; then
  node scripts/validate-hero-frame.js "$FILE" || { echo "❌ hero-frame 위반 — 각 씬에 hero_frame_ms 지정."; exit 1; }
fi

# ⑥-zc validate-absolute-content — Absolute 는 장식 전용
if [ -f "scripts/validate-absolute-content.js" ]; then
  node scripts/validate-absolute-content.js "$FILE" || { echo "❌ absolute-content 위반 — Absolute 직계 자식 콘텐츠 금지."; exit 1; }
fi

# ⑥-zd validate-preview-reviewed — Phase B 씬 preview_reviewed_at 필수
if [ -f "scripts/validate-preview-reviewed.js" ]; then
  node scripts/validate-preview-reviewed.js "$FILE" || { echo "❌ preview-reviewed 위반 — Phase B 씬 preview PNG Read 후 timestamp 기입."; exit 1; }
fi

# ⑥-ze validate-allow-exit — 중간 씬 allow_exit 금지
if [ -f "scripts/validate-allow-exit.js" ]; then
  node scripts/validate-allow-exit.js "$FILE" || { echo "❌ allow-exit 위반 — 마지막 씬 외 allow_exit:true 제거."; exit 1; }
fi

# ⑥-zf count-visual-elements — 씬당 시각요소 ≥ 4
if [ -f "scripts/count-visual-elements.js" ]; then
  node scripts/count-visual-elements.js "$FILE" || { echo "❌ visual-elements 위반 — sparse 씬 보강."; exit 1; }
fi


# ⑦ check-scene-sync — 씬 경계 ↔ SRT 동기화 검증 (drift 가드)
# scenes-v2.json의 경로에서 projectId 추출 → output/{pid}.srt와 비교
if [ -f "scripts/check-scene-sync.ts" ]; then
  PID_DIR=$(dirname "$FILE")
  PID=$(basename "$PID_DIR")
  SRT_PATH="output/${PID}.srt"
  if [ ! -f "$SRT_PATH" ]; then SRT_PATH="${PID_DIR}/${PID}.srt"; fi
  if [ -f "$SRT_PATH" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⑦ check-scene-sync — 씬-SRT 동기화 검증"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx tsx scripts/check-scene-sync.ts "$FILE" "$SRT_PATH" || {
      echo ""
      echo "❌ scene-SRT drift 발견 — 자막이 오디오와 어긋납니다."
      echo "   /vg-voice를 재실행한 경우 /vg-chunk + /vg-scene + /vg-layout 을 다시 돌려야 합니다."
      echo "   scene 경계를 수동으로 scale하지 마세요 (누적 drift 원인)."
      exit 1
    }
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⑦-b compute-hero-frame — hero_frame_ms 자동 주입 (Positive→Negative)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "scripts/compute-hero-frame.js" ]; then
  node scripts/compute-hero-frame.js "$FILE" || {
    echo ""
    echo "❌ [FAIL] hero_frame_ms 자동 계산 실패 — stack_root 또는 motion 필드 문제."
    exit 1
  }
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⑧ sync-render-props — scenes-v2 → render-props-v2 자동 동기화 (MANDATORY)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# Remotion 이 실제로 읽는 파일은 render-props-v2.json. scenes-v2.json 만 수정하고
# 여기서 sync 하지 않으면 stale 파일로 렌더링되어 모든 authoring 이 낭비된다.
if [ -f "scripts/sync-render-props.js" ]; then
  node scripts/sync-render-props.js "$FILE" || {
    echo ""
    echo "❌ render-props sync 실패 — Remotion 은 stale 파일을 읽을 것입니다."
    exit 1
  }
else
  echo "❌ scripts/sync-render-props.js 없음 — 렌더링 전 수동 sync 필요."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⑨ validate-transitions — 씬 간 전환 Non-Negotiable (HyperFrames 철학)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# v1.1 round 2: env bypass 없음. sync-render-props 가 intent 기반 rotation
# 자동 주입 (⑧ 에서 수행). 명시적 none 3연속만 fail.
if [ -f "scripts/validate-transitions.js" ]; then
  RENDER_PROPS="${FILE%/scenes-v2.json}/render-props-v2.json"
  TARGET="$FILE"
  [ -f "$RENDER_PROPS" ] && TARGET="$RENDER_PROPS"
  node scripts/validate-transitions.js "$TARGET" || {
    echo ""
    echo "❌ transitions 위반 — 명시적 jump cut 3연속."
    echo "   해결: scene.transition 필드를 제거하여 autoSelect 위임 (sync-render-props 가 자동 처리)."
    echo "         또는 transition_explicit:true 로 의도 명시하고 연속 3 미만으로 분산."
    exit 1
  }
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 후처리 파이프라인 완료! (scenes-v2 + render-props-v2 모두 최신)"
echo ""


