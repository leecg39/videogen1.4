const scenes = JSON.parse(require("fs").readFileSync("data/rag3/scenes-v2.json", "utf-8"));

function walk(n, cb) {
  cb(n);
  if (n.children) n.children.forEach(c => walk(c, cb));
}

const widths = {};
const fb = { leaf: 0, container: 0 };

scenes.forEach(s => {
  if (s.stack_root == null) return;
  walk(s.stack_root, n => {
    const mw = (n.layout && n.layout.maxWidth) || (n.style && n.style.maxWidth);
    if (mw && n.type !== "SceneRoot") {
      const k = n.type + ":" + mw;
      widths[k] = (widths[k] || 0) + 1;
    }
    if (n.type === "FrameBox") {
      if (n.children && n.children.length > 0) fb.container++;
      else fb.leaf++;
    }
  });
});

console.log("=== Card maxWidth ===");
Object.entries(widths).sort((a, b) => b[1] - a[1]).forEach(e => console.log(e[0], ":", e[1]));
console.log("\n=== FrameBox ===");
console.log("Container:", fb.container, "Leaf:", fb.leaf);
