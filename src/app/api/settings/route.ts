// GET /api/settings — 모든 프로젝트의 render 설정 조회 (regular + demo + video-demo 통합)
import { NextResponse } from "next/server";
import path from "node:path";
import {
  readJSON,
  listDirs,
  getProjectPath,
} from "@/services/file-service";
import type {
  Project,
  DemoSpec,
  VideoSpec,
  RenderSettings,
} from "@/types/index";

export type ProjectKind = "regular" | "product-demo" | "video-demo";

export interface SettingsEntry {
  id: string;
  title: string;
  kind: ProjectKind;
  /** 소스 파일명 — PATCH 가 업데이트할 대상 */
  source: "project.json" | "demo-spec.json" | "video-spec.json";
  render: Required<RenderSettings>;
}

const DEFAULT_RENDER: Required<RenderSettings> = {
  fps: 30,
  width: 1920,
  height: 1080,
  stylePack: "dark-neon",
};

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const dirs = await listDirs(dataDir);
    const entries: SettingsEntry[] = [];

    for (const d of dirs) {
      // Regular project.json
      const proj = await readJSON<Project>(getProjectPath(d, "project.json"));
      if (proj && proj.id) {
        entries.push({
          id: proj.id,
          title: proj.name ?? proj.id,
          kind: "regular",
          source: "project.json",
          render: { ...DEFAULT_RENDER, ...(proj.render ?? {}) },
        });
        continue; // 동일 디렉토리에 demo/video-demo 가 공존하지 않는다고 가정
      }

      // demo-spec.json
      const demo = await readJSON<DemoSpec>(
        getProjectPath(d, "demo-spec.json")
      );
      if (demo && demo.kind === "product-demo") {
        entries.push({
          id: demo.id,
          title: demo.title,
          kind: "product-demo",
          source: "demo-spec.json",
          render: { ...DEFAULT_RENDER, ...(demo.render ?? {}) },
        });
        continue;
      }

      // video-spec.json
      const video = await readJSON<VideoSpec>(
        getProjectPath(d, "video-spec.json")
      );
      if (video && video.kind === "video-demo") {
        entries.push({
          id: video.id,
          title: video.title,
          kind: "video-demo",
          source: "video-spec.json",
          render: { ...DEFAULT_RENDER, ...(video.render ?? {}) },
        });
      }
    }

    entries.sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ projects: entries, defaults: DEFAULT_RENDER });
  } catch (e) {
    return NextResponse.json(
      { error: "설정 조회 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
