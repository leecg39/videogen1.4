#!/usr/bin/env node
// validate-frame-pixels.js — HARD GATE: 렌더 결과(픽셀) 품질 검증
//
// Hyperframes 가드레일 원칙: "DSL 이 통과해도 픽셀이 통과한 건 아니다."
// output/full-frames/*.png 을 ffmpeg 로 분석하여:
//   (1) 빈 프레임 — 평균 루마(Y) < 25 (거의 검정)
//   (2) 단색 프레임 — 모든 채널 표준편차 < 8 (flat)
//   (3) 중앙 황무지 — 씬 중앙 40% 영역 평균 밝기가 가장자리와 차이 < 6 (콘텐츠 부재)
//
// 의존성: ffmpeg (macOS homebrew 기본 제공).
// 사용법: node validate-frame-pixels.js [frames_dir]
//   기본 frames_dir = output/full-frames
//
// postprocess.sh ⑥-v 로 삽입 (렌더 스틸이 생성된 경우에만 실행).

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const FRAMES_DIR = process.argv[2] || "output/full-frames";
const LUMA_MIN = 25;          // 이 이하면 "빈 프레임"
const FLAT_STDDEV = 8;        // 단색 판정
const CENTER_DELTA_MIN = 6;   // 중앙↔가장자리 밝기 차이 최소

function ffmpegSignalStats(file) {
  // signalstats + metadata=print 로 Y / U / V 평균+범위 추출 (stderr 로 출력됨)
  try {
    const out = execSync(
      `ffmpeg -hide_banner -nostats -loglevel info -i "${file}" -vf "signalstats,metadata=mode=print" -f null - 2>&1`,
      { encoding: "utf8" }
    );
    return parseSignalStats(out);
  } catch (e) {
    return parseSignalStats(String(e.stderr || e.stdout || ""));
  }
}

function parseSignalStats(txt) {
  // 예: "YAVG:128.42 YMIN:0 YMAX:255 YLOW:... YHIGH:... YDIF:... UAVG:128 ..."
  // ffmpeg signalstats metadata lines: lavfi.signalstats.YAVG=...
  const grab = (k) => {
    const re = new RegExp(`signalstats\\.${k}=([\\d.]+)`);
    const m = txt.match(re);
    return m ? Number(m[1]) : null;
  };
  return {
    yavg: grab("YAVG"),
    ymin: grab("YMIN"),
    ymax: grab("YMAX"),
    uavg: grab("UAVG"),
    vavg: grab("VAVG"),
    // stddev 가 없는 버전용: YHIGH - YLOW 로 근사
    ylow: grab("YLOW"),
    yhigh: grab("YHIGH"),
  };
}

function computeDynamicRange(stats) {
  if (stats.yhigh != null && stats.ylow != null) return stats.yhigh - stats.ylow;
  if (stats.ymax != null && stats.ymin != null) return stats.ymax - stats.ymin;
  return null;
}

function cropCompare(file) {
  // 중앙 영역(40%)과 전체 평균 루마 차이
  try {
    const center = execSync(
      `ffmpeg -hide_banner -nostats -loglevel info -i "${file}" -vf "crop=iw*0.4:ih*0.4,signalstats,metadata=mode=print" -f null - 2>&1`,
      { encoding: "utf8" }
    );
    const full = execSync(
      `ffmpeg -hide_banner -nostats -loglevel info -i "${file}" -vf "signalstats,metadata=mode=print" -f null - 2>&1`,
      { encoding: "utf8" }
    );
    const c = parseSignalStats(center);
    const f = parseSignalStats(full);
    if (c.yavg != null && f.yavg != null) return Math.abs(c.yavg - f.yavg);
    return null;
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(FRAMES_DIR)) {
    console.log("");
    console.log(`⚠️  [SKIP] frame-pixels 검증 생략 — ${FRAMES_DIR} 없음. vg-preview-still 또는 render-stills 를 먼저 실행.`);
    process.exit(0);
  }

  const pngs = fs.readdirSync(FRAMES_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  if (pngs.length === 0) {
    console.log("");
    console.log(`⚠️  [SKIP] ${FRAMES_DIR} 에 이미지 없음 — 검증 생략.`);
    process.exit(0);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔍 frame-pixels 검증 (${pngs.length}개 프레임)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const blanks = [];
  const flats = [];
  const emptyCenters = [];

  for (const name of pngs) {
    const file = path.join(FRAMES_DIR, name);
    const stats = ffmpegSignalStats(file);
    const yavg = stats.yavg;
    const dr = computeDynamicRange(stats);

    if (yavg != null && yavg < LUMA_MIN) {
      blanks.push({ name, yavg });
    }
    if (dr != null && dr < FLAT_STDDEV) {
      flats.push({ name, dr, yavg });
    }
    const centerDelta = cropCompare(file);
    if (centerDelta != null && centerDelta < CENTER_DELTA_MIN) {
      emptyCenters.push({ name, centerDelta: Number(centerDelta.toFixed(2)), yavg });
    }
  }

  console.log(`  블랭크 (YAVG < ${LUMA_MIN}): ${blanks.length}`);
  console.log(`  플랫 (dynamic range < ${FLAT_STDDEV}): ${flats.length}`);
  console.log(`  중앙 빈 콘텐츠 (center Δ < ${CENTER_DELTA_MIN}): ${emptyCenters.length}`);

  const failures = [];

  // 허용치: 블랭크 1개 / 플랫 1개 / 중앙 빈 공간 ≤ 10% 씬
  const total = pngs.length;
  if (blanks.length > 1) failures.push({ kind: "blank", items: blanks });
  if (flats.length > 1) failures.push({ kind: "flat", items: flats });
  if (emptyCenters.length > Math.max(3, Math.floor(total * 0.1))) {
    failures.push({ kind: "empty-center", items: emptyCenters });
  }

  if (failures.length === 0) {
    console.log("");
    console.log("✅ frame-pixels 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${failures.length}개 픽셀 위반 카테고리:`);
  for (const f of failures) {
    console.log(`  ▼ ${f.kind} — ${f.items.length}개:`);
    f.items.slice(0, 8).forEach((it) => {
      console.log(`      ${it.name}  ${JSON.stringify(it).replace(/"/g, "")}`);
    });
    if (f.items.length > 8) console.log(`      ... 외 ${f.items.length - 8}개`);
  }
  console.log("");
  console.log(
    "해결: 블랭크/플랫 프레임은 해당 씬의 enterAt 타이밍과 콘텐츠 존재 여부를 재확인. 중앙 빈 콘텐츠는 focal 노드를 중앙으로 이동하거나 focal 크기 확대."
  );
  process.exit(1);
}

main();
