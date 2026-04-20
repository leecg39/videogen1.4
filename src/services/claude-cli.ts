// @TASK Control Center Phase 1 — Claude Code CLI headless spawn wrapper
// 역할: Next.js 서버 측에서 `claude -p` 서브프로세스를 띄우고 stdout 을 줄 단위로 스트리밍.
// 전제: 사용자의 PATH 에 `claude` 가 존재해야 함 (로컬 전용).
// NON_INTERACTIVE: Control Center 는 AskUserQuestion 불가 → 기본값 디렉티브 주입.

import { spawn, type ChildProcess } from "child_process";
import path from "path";

export interface ClaudeStreamJsonMessage {
  type?: string;
  subtype?: string;
  message?: unknown;
  [key: string]: unknown;
}

export type HeadlessMode = "full-restart" | "step";

export interface SpawnClaudeOptions {
  command: string;
  cwd?: string;
  headlessMode?: HeadlessMode;
  onLog?: (line: string, stream: "stdout" | "stderr") => void;
  onJson?: (msg: ClaudeStreamJsonMessage) => void;
  onExit?: (code: number | null, signal: NodeJS.Signals | null) => void;
}

export interface ClaudeHandle {
  pid: number | undefined;
  done: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  cancel: (signal?: NodeJS.Signals) => void;
}

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

const BASE_HEADLESS_RULES = `CONTROL_CENTER_HEADLESS_MODE: You are running inside a Next.js Control Center headless CLI subprocess.

ABSOLUTE RULES:
- DO NOT call the AskUserQuestion tool. It is DISALLOWED and will error.
- DO NOT write a text question and wait for a user reply. There is no user to reply.
- DO NOT pause for confirmation. Proceed through every phase autonomously.
- Progress is reported via stdout stream-json log lines only.
- Log each auto-default decision with a "[auto-default]" prefix so the user can audit.
- If you encounter a truly blocking error you cannot resolve with defaults, print "[control-center-abort]" followed by a one-line reason and exit. Do NOT hang waiting for input.

LAYOUT AUTHORING BAN (Phase 3 / /vg-layout ABSOLUTE):
- Writing a batch-generation script that produces stack_root for N scenes in a loop is FORBIDDEN.
  Examples of banned patterns: "for scene in scenes: stack_root = ...", "scenes.map(scene => buildStackRoot(scene))",
  "generate_layouts.py / build-layouts.ts" or any file that iterates scenes and applies a shared template.
- Stack_root MUST be authored per-scene by you, directly editing scenes-v2.json (Edit / Write), with unique
  composition decisions per scene. Each scene's stack_root shape must differ from adjacent scenes.
- scripts/validate-layout-diversity.js is a HARD GATE run inside postprocess.sh. It fails if:
  (a) same stack_root shape hash appears ≥ 3 times, (b) ≥ 3 consecutive scenes share layout_family,
  (c) < 6 distinct layout_family values, (d) < 10 distinct node types, (e) < 40% non-card scenes,
  (f) > 30% Split-topped scenes. Failure → exit 1 → no mp4. You cannot skip it.
- If time/token budget is tight, design in batches of 10-15 scenes and commit incrementally — do NOT write a script.`;

const FULL_RESTART_DIRECTIVE = `${BASE_HEADLESS_RULES}

INTENT: FULL_AUTO_RESTART. The user clicked "⚡ Full Auto" in the Control Center. This means: run the entire orchestrator pipeline FROM SCRATCH, overwriting any previous output.

DEFAULT ANSWERS (apply automatically whenever a skill would ask):
- Duplicate project detected → OVERWRITE (option "덮어쓰기 / 처음부터"). Wipe data/{projectId}/ except control-jobs/ and input-source files, then re-run Phase 0 onward. Treat existing beats.json / scenes-v2.json / render-props-v2.json / output/*.mp4 as STALE — regenerate all of them.
- "Project already verified, nothing to do" is NOT an acceptable conclusion. Full Auto must re-execute every phase from the beginning and produce a fresh mp4. If the pipeline would exit early because output already exists, DELETE that output first and continue.
- Asset collection scope → "DevIcon + 이미지" (option 2). DevIcon matching + WebSearch for people/brand/concept PNGs. No Pexels videos, no screenshots.
- Multiple input files → use the first file found (sorted by filename).
- Post-Phase 2 editor question → 바로 진행 (skip editor, continue pipeline).
- GATE 3 failure 3 times → render with current state.
- GATE 5 failure → complete with current state.
- Any other ambiguous choice → pick the safest default that still produces a fresh mp4 output.

HARD REQUIREMENT: The session MUST end with Phase 4 (render) having run to completion in THIS session, not a stale earlier render. Verify this by checking file mtime > session start time.`;

const STEP_DIRECTIVE = `${BASE_HEADLESS_RULES}

INTENT: SINGLE_STEP. The user clicked a specific step button in the Control Center. Run ONLY that one skill. Do NOT chain to the next phase even if the skill normally would.

DEFAULT ANSWERS (apply automatically whenever a skill would ask):
- Duplicate project / existing output files → proceed with the step anyway, overwriting its own outputs.
- Asset collection scope → "DevIcon + 이미지" (option 2).
- Multiple input files → use the first file found (sorted by filename).
- Any other ambiguous choice → pick the safest default and log with [auto-default] prefix.`;

function directiveFor(mode: HeadlessMode | undefined): string {
  return mode === "step" ? STEP_DIRECTIVE : FULL_RESTART_DIRECTIVE;
}

export function spawnClaude(opts: SpawnClaudeOptions): ClaudeHandle {
  const cwd = opts.cwd || process.cwd();

  const args = [
    "-p",
    opts.command,
    "--permission-mode",
    "bypassPermissions",
    "--output-format",
    "stream-json",
    "--verbose",
    "--append-system-prompt",
    directiveFor(opts.headlessMode),
    "--disallowedTools",
    "AskUserQuestion",
  ];

  const child: ChildProcess = spawn(CLAUDE_BIN, args, {
    cwd,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const pipe = (stream: NodeJS.ReadableStream, tag: "stdout" | "stderr") => {
    let buf = "";
    stream.setEncoding("utf-8");
    stream.on("data", (chunk: string) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line) continue;
        opts.onLog?.(line, tag);
        if (tag === "stdout") {
          const trimmed = line.trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
              const parsed = JSON.parse(trimmed) as ClaudeStreamJsonMessage;
              opts.onJson?.(parsed);
            } catch {
              // not JSON, already emitted as raw log
            }
          }
        }
      }
    });
    stream.on("end", () => {
      if (buf) {
        opts.onLog?.(buf, tag);
        buf = "";
      }
    });
  };

  if (child.stdout) pipe(child.stdout, "stdout");
  if (child.stderr) pipe(child.stderr, "stderr");

  const done = new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve) => {
    child.on("close", (code, signal) => {
      opts.onExit?.(code, signal);
      resolve({ code, signal });
    });
    child.on("error", (err) => {
      opts.onLog?.(`[spawn error] ${err.message}`, "stderr");
      opts.onExit?.(-1, null);
      resolve({ code: -1, signal: null });
    });
  });

  return {
    pid: child.pid,
    done,
    cancel: (signal: NodeJS.Signals = "SIGTERM") => {
      if (!child.killed) child.kill(signal);
    },
  };
}

export function getProjectCwd(): string {
  return path.resolve(process.cwd());
}
