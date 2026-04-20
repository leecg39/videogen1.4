// POST /api/wizard/create — 위자드 통합 엔드포인트 (multipart FormData)
//
// 모드별 동작:
//   1) srt-dubbing: mp3 + srt 파일 업로드 → input/{pid}.mp3 + input/{pid}.srt 저장
//      → data/{pid}/project.json 생성 → 핸드오프 프롬프트 "/vg-new"
//   2) script-text: 대본 텍스트 → data/{pid}/script.json 저장
//      → data/{pid}/project.json 생성 → 핸드오프 프롬프트 "/vg-voice {pid} → ..."
//
// 공통: render 설정(fps/width/height/stylePack) 을 project.json.render 에 저장.

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import {
  writeJSON,
  ensureDir,
  getProjectPath,
} from "@/services/file-service";
import type { Project, RenderSettings } from "@/types/index";

type WizardMode = "srt-dubbing" | "script-text";

interface ScriptJson {
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    intent: string;
    paragraphs: Array<{ text: string }>;
  }>;
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || `project-${Date.now()}`;
}

/**
 * 대본 텍스트를 간단한 규칙으로 script.json 구조로 변환.
 *  - `# 제목` 또는 `## 챕터제목` 줄은 챕터 경계
 *  - 빈 줄 하나로 분리된 블록 = 문단 (paragraphs[i].text)
 *  - 헤더가 전혀 없으면 전체를 단일 챕터 "본문" 으로 묶음
 */
function parseScriptText(title: string, raw: string): ScriptJson {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const chapters: ScriptJson["chapters"] = [];
  let currentTitle: string | null = null;
  let currentParagraphs: string[] = [];
  let currentBuffer: string[] = [];

  const flushParagraph = () => {
    const text = currentBuffer.join(" ").trim();
    if (text) currentParagraphs.push(text);
    currentBuffer = [];
  };
  const flushChapter = () => {
    flushParagraph();
    if (currentParagraphs.length > 0) {
      const ch = {
        id: `ch${String(chapters.length + 1).padStart(2, "0")}`,
        title: currentTitle ?? "본문",
        intent: "narrative",
        paragraphs: currentParagraphs.map((t) => ({ text: t })),
      };
      chapters.push(ch);
    }
    currentTitle = null;
    currentParagraphs = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const header = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (header) {
      flushChapter();
      currentTitle = header[1].trim();
      continue;
    }
    if (trimmed === "") {
      flushParagraph();
    } else {
      currentBuffer.push(trimmed);
    }
  }
  flushChapter();

  if (chapters.length === 0) {
    // 폴백: 전체 텍스트를 하나의 문단으로
    chapters.push({
      id: "ch01",
      title: "본문",
      intent: "narrative",
      paragraphs: [{ text: raw.trim() }],
    });
  }

  return { title, chapters };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const mode = form.get("mode") as WizardMode | null;
    const titleRaw = (form.get("title") as string | null) ?? "";
    const idRaw = (form.get("id") as string | null) ?? "";
    const renderRaw = (form.get("render") as string | null) ?? "{}";

    if (!mode || !titleRaw.trim()) {
      return NextResponse.json(
        { error: "mode, title 필수" },
        { status: 400 }
      );
    }
    if (mode !== "srt-dubbing" && mode !== "script-text") {
      return NextResponse.json({ error: "알 수 없는 mode" }, { status: 400 });
    }

    const title = titleRaw.trim();
    const id = slugify(idRaw || title);

    let render: RenderSettings = {};
    try {
      render = JSON.parse(renderRaw) as RenderSettings;
    } catch {
      render = {};
    }

    // 공통: project.json 생성
    const now = new Date().toISOString();
    const projectJson: Project = {
      id,
      name: title,
      srt_path: "",
      audio_path: "",
      created_at: now,
      updated_at: now,
      status: "draft",
      total_duration_ms: 0,
      render: {
        fps: render.fps ?? 30,
        width: render.width ?? 1920,
        height: render.height ?? 1080,
        stylePack: render.stylePack ?? "dark-neon",
      },
    };

    const projectDir = path.join(process.cwd(), "data", id);
    await ensureDir(projectDir);

    let handoff = "";
    let extraNote = "";

    if (mode === "srt-dubbing") {
      const mp3 = form.get("mp3");
      const srt = form.get("srt");
      if (!(mp3 instanceof File) || !(srt instanceof File)) {
        return NextResponse.json(
          { error: "mp3, srt 파일 둘 다 필요" },
          { status: 400 }
        );
      }
      const inputDir = path.join(process.cwd(), "input");
      await ensureDir(inputDir);
      const mp3Path = path.join(inputDir, `${id}.mp3`);
      const srtPath = path.join(inputDir, `${id}.srt`);
      await fs.writeFile(mp3Path, Buffer.from(await mp3.arrayBuffer()));
      await fs.writeFile(srtPath, Buffer.from(await srt.arrayBuffer()));

      projectJson.srt_path = `input/${id}.srt`;
      projectJson.audio_path = `input/${id}.mp3`;
      await writeJSON(getProjectPath(id, "project.json"), projectJson);

      handoff =
        `\`input/${id}.mp3\` 와 \`input/${id}.srt\` 를 방금 추가했어. ` +
        `프로젝트 폴더는 \`data/${id}/\` 이고 \`project.json\` 에 렌더 설정` +
        `(fps ${projectJson.render?.fps}, ${projectJson.render?.width}×${projectJson.render?.height}, ${projectJson.render?.stylePack})` +
        `이 저장돼 있어. \`/vg-new\` 를 실행해서 이 프로젝트 영상을 완성해줘.`;
      extraNote = "/vg-new 가 input/ 폴더의 파일을 자동 감지해 풀 파이프라인을 실행합니다.";
    } else {
      const scriptText = (form.get("scriptText") as string | null) ?? "";
      if (!scriptText.trim()) {
        return NextResponse.json(
          { error: "scriptText 비어있음" },
          { status: 400 }
        );
      }
      const scriptJson = parseScriptText(title, scriptText);
      // script.json 경로가 ProjectFileName 에 없을 수 있어 절대 경로 사용
      const scriptPath = path.join(projectDir, "script.json");
      await writeJSON(scriptPath, scriptJson);
      await writeJSON(getProjectPath(id, "project.json"), projectJson);

      handoff =
        `\`data/${id}/script.json\` 에 대본을 저장했어 (챕터 ${scriptJson.chapters.length}개). ` +
        `\`project.json.render\` 에 렌더 설정(fps ${projectJson.render?.fps}, ${projectJson.render?.width}×${projectJson.render?.height}, ${projectJson.render?.stylePack})도 저장돼 있어. ` +
        `\`/vg-voice ${id}\` 로 TTS+SRT 를 생성한 다음, \`/vg-chunk ${id}\` → \`/vg-scene ${id}\` → \`/vg-layout ${id}\` → \`/vg-render ${id}\` 순서로 영상을 완성해줘.`;
      extraNote =
        "/vg-voice 가 ElevenLabs PVC 로 mp3+srt 를 만들고, 이후 파이프라인이 순차 실행됩니다.";
    }

    return NextResponse.json({
      ok: true,
      id,
      title,
      mode,
      render: projectJson.render,
      handoff,
      extraNote,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "위자드 생성 실패", detail: String(e) },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
