import * as fs from "fs";
import * as path from "path";
import { selectBestLayout, scoreAllLayouts, type ScoringInput, type ScoringContext } from "../src/services/scoring-engine";
import { generateSceneDSLv2, type DSLGeneratorInput } from "../src/services/dsl-generator";
import { groupBeatsIntoSceneBlocks, type SceneBlockBeat } from "../src/services/scene-blocks";
import { selectSvgLayoutReferencePack } from "../src/services/svg-layout-selector";

const FPS = 30;
const ROLE_TO_INTENT: Record<string,string> = {
  pause:"introduce",cluster:"list",declaration:"emphasize",evidence:"example",
  comparison:"compare",escalation:"stack",sequence:"sequence",metaphor:"focus",
  payoff:"highlight",support:"introduce",
};

function parseSrt(fp: string) {
  const text = fs.readFileSync(fp,"utf-8").replace(/^\uFEFF/,"");
  const blocks = text.trim().split(/\n\n+/);
  const r: Array<{start:number;end:number;text:string}> = [];
  for (const b of blocks) {
    const l = b.trim().split("\n");
    if (l.length<3) continue;
    const t = l[1].split(" --> ");
    const p = (s:string) => { const[hms,ms]=s.trim().split(","); const[h,m,sec]=hms.split(":").map(Number); return h*3600000+m*60000+sec*1000+Number(ms); };
    r.push({start:p(t[0]),end:p(t[1]),text:l.slice(2).join(" ")});
  }
  return r;
}

async function main() {
  const pid = process.argv[2] || "news-0331";
  const dir = path.join("data", pid);
  const raw = JSON.parse(fs.readFileSync(path.join(dir,"beats.json"),"utf-8"));
  const rawList: any[] = Array.isArray(raw) ? raw : raw.beats ?? [];
  console.log(`✅ ${rawList.length} beats`);

  const beats: SceneBlockBeat[] = rawList.map((b:any) => ({
    beat_index: b.beat_index, start_ms: b.start_ms, end_ms: b.end_ms,
    start_frame: Math.round(b.start_ms/1000*FPS), end_frame: Math.round(b.end_ms/1000*FPS),
    text: b.text, srt_entries: b.srt_entries,
    semantic: {
      intent: ROLE_TO_INTENT[b.scene?.role??""] ?? b.semantic?.intent ?? "introduce",
      tone: b.semantic?.tone ?? "neutral",
      evidence_type: b.semantic?.evidence_type ?? "statement",
      emphasis_tokens: b.semantic?.emphasis_tokens ?? [],
      density: b.semantic?.density ?? 2,
    },
    scene: b.scene,
  }));

  let srt: ReturnType<typeof parseSrt> = [];
  try {
    const proj = JSON.parse(fs.readFileSync(path.join(dir,"project.json"),"utf-8"));
    const sp = path.join(dir, proj.srt_path);
    if (fs.existsSync(sp)) srt = parseSrt(sp);
    else { const sp2 = path.join("public",proj.srt_path); if(fs.existsSync(sp2)) srt = parseSrt(sp2); }
  } catch {}

  const blocks = groupBeatsIntoSceneBlocks(beats);
  console.log(`✅ ${blocks.length} scene blocks`);

  const ctx: ScoringContext = {recentLayouts:[],previousLayout:null};
  const scenes: any[] = [];

  for (const block of blocks) {
    const lead = block.beats[0];
    const tokens = Array.from(new Set(block.beats.flatMap(b=>b.semantic.emphasis_tokens))).slice(0,5);
    const intent = block.beats.map(b=>b.semantic.intent).find(v=>v==="compare") ?? lead.semantic.intent;
    const evType = block.beats.map(b=>b.semantic.evidence_type).find(v=>v==="statistic") ?? lead.semantic.evidence_type;
    const density = Math.round(block.beats.reduce((s,b)=>s+b.semantic.density,0)/Math.max(block.beats.length,1));

    const si: ScoringInput = {intent, tone:lead.semantic.tone, evidenceType:evType, emphasisTokens:tokens, density:Math.min(5,Math.max(1,density)), hasChartData:evType==="statistic", hasIcons:tokens.length>0};
    const best = selectBestLayout(si, {...ctx});
    const lr = selectSvgLayoutReferencePack(si, best.layoutFamily);

    const di: DSLGeneratorInput = {beat:lead, layoutFamily:best.layoutFamily, projectId:pid, sceneIndex:block.scene_index, sceneBlock:block, layoutReference:lr};
    const blockSubs = srt.filter(e=>e.start>=block.start_ms&&e.end<=block.end_ms+500).map(e=>({startTime:e.start/1000,endTime:e.end/1000,text:e.text}));
    const scene = generateSceneDSLv2({...di, narration:block.text??lead.text});

    scenes.push({...scene, subtitles:blockSubs.length>0?blockSubs:scene.subtitles, transition:{type:"none",durationFrames:0}});
    ctx.previousLayout = best.layoutFamily;
    ctx.recentLayouts = [...ctx.recentLayouts, best.layoutFamily].slice(-3);
  }

  console.log(`✅ ${scenes.length} scenes generated`);
  fs.writeFileSync(path.join(dir,"scenes-v2.json"), JSON.stringify(scenes,null,2));

  let audioSrc: string|undefined;
  try { audioSrc = JSON.parse(fs.readFileSync(path.join(dir,"project.json"),"utf-8")).audio_path; } catch{}
  fs.writeFileSync(path.join(dir,"render-props-v2.json"), JSON.stringify({projectId:pid,...(audioSrc&&{audioSrc}),scenes},null,2));
  console.log(`✅ scenes-v2.json + render-props-v2.json saved`);
}
main().catch(e=>{console.error(e);process.exit(1)});
