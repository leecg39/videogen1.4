// Apply beat-director to vibe-news-0407/beats.json
import * as fs from "node:fs";
import * as path from "node:path";
import { directBeats, qualityCheck } from "../src/services/beat-director";

const file = path.resolve("data/vibe-news-0407/beats.json");
const beats = JSON.parse(fs.readFileSync(file, "utf8"));

const directed = directBeats(beats);

// keep svg_needs (API 가 채운) 유지
for (let i = 0; i < directed.length; i++) {
  if (beats[i].svg_needs) (directed[i] as any).svg_needs = beats[i].svg_needs;
}

fs.writeFileSync(file, JSON.stringify(directed, null, 2));
const q = qualityCheck(directed as any);
console.log(JSON.stringify(q, null, 2));
