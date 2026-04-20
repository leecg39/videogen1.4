#!/usr/bin/env node
// validate-no-exit-anim.js — HARD GATE: 퇴장 애니메이션 금지
//
// scene-grammar.md Section 4: 퇴장 애니는 마지막 씬만 허용 (scenes[last].allow_exit: true).
// TransitionSeries 가 씬 전환을 처리하므로 내부 exit 애니는 jump-cut 오류를 만든다.
//
// 검출 대상 (stack_root 의 모든 노드):
//   - node.motion.exit 필드 존재
//   - node.motion.preset 이 "fade-out" / "slideOut*" / "zoomOut*" / "-out" 패턴
//   - node.motion.outAt / node.motion.leaveAt 필드 존재
//
// 마지막 씬에 allow_exit: true 가 아닌 모든 씬에서 위반 시 exit 1.
// postprocess.sh ⑥-i 로 삽입.

const fs = require("fs");

const EXIT_PRESET_RE = /(^|[-_])(fadeOut|fade-out|slideOut|zoomOut|slide-out|zoom-out|exitFade|exitSlide|outRight|outLeft|outUp|outDown)/i;

function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const kids = node.children || [];
  if (Array.isArray(kids)) {
    kids.forEach((c) => walk(c, fn, [...path, node.type || "?"]));
  }
}

function exitViolation(node) {
  const m = node.motion;
  if (!m || typeof m !== "object") return null;
  if (m.exit != null) return `motion.exit=${JSON.stringify(m.exit)}`;
  if (m.outAt != null) return `motion.outAt=${m.outAt}`;
  if (m.leaveAt != null) return `motion.leaveAt=${m.leaveAt}`;
  if (typeof m.preset === "string" && EXIT_PRESET_RE.test(m.preset)) {
    return `motion.preset="${m.preset}"`;
  }
  return null;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-no-exit-anim.js <scenes-v2.json>");
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const scenes = Array.isArray(raw) ? raw : Array.isArray(raw.scenes) ? raw.scenes : [];

  const violations = [];
  const lastIndex = scenes.length - 1;

  scenes.forEach((sc, idx) => {
    // 마지막 씬은 allow_exit: true 일 때 건너뛴다
    if (idx === lastIndex && sc.allow_exit === true) return;
    if (!sc.stack_root) return;

    const offending = [];
    walk(sc.stack_root, (n, path) => {
      const why = exitViolation(n);
      if (why) {
        const loc = [...path, n.type || "?"].join(">");
        offending.push(`${loc}  ${why}`);
      }
    });

    if (offending.length > 0) {
      violations.push({ id: sc.id, idx, sample: offending.slice(0, 3), total: offending.length });
    }
  });

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 no-exit-anim 검증 (퇴장 애니는 마지막 씬의 allow_exit=true 에만 허용)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 씬: ${scenes.length}`);
  console.log(`  위반 씬: ${violations.length}`);

  if (violations.length === 0) {
    console.log("");
    console.log("✅ no-exit-anim 검증 통과.");
    process.exit(0);
  }

  console.log("");
  console.log(`❌ [FAIL] ${violations.length}개 씬에 퇴장 애니메이션:`);
  for (const v of violations.slice(0, 10)) {
    console.log(`  - ${v.id} (idx=${v.idx}, 위반 ${v.total}개)`);
    v.sample.forEach((s) => console.log(`      · ${s}`));
  }
  if (violations.length > 10) console.log(`  ... 외 ${violations.length - 10}개 씬`);
  console.log("");
  console.log(
    "해결: motion.exit / exit preset / outAt 제거. TransitionSeries 가 씬 전환을 담당하므로 내부 퇴장은 불필요. 마지막 씬에만 scene.allow_exit=true 허용."
  );
  process.exit(1);
}

main();
