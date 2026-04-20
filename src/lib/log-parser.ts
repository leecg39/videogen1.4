// @TASK Control Center Phase 2 — 스트리밍 로그 정제기
// Claude CLI stream-json + job-runner system 로그를 사용자 친화 이벤트로 변환.
// 순수 함수 — 브라우저/Node 양쪽에서 동작.

import type { JobLogLine } from "@/services/job-runner";

export type PrettyKind =
  | "session"
  | "phase"
  | "thinking"
  | "text"
  | "tool"
  | "tool-result"
  | "skill"
  | "system"
  | "auto-default"
  | "abort"
  | "error"
  | "result";

export type PrettyTone = "info" | "success" | "warning" | "error" | "muted";

export interface PrettyLogEvent {
  id: string;
  ts: number;
  kind: PrettyKind;
  icon: string;
  tone: PrettyTone;
  title: string;
  body?: string;
  collapsed?: boolean;
}

interface ToolUseBlock {
  type: "tool_use";
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface TextBlock {
  type: "text";
  text?: string;
}

interface ThinkingBlock {
  type: "thinking";
  thinking?: string;
}

interface ToolResultBlock {
  type: "tool_result";
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

type ContentBlock = ToolUseBlock | TextBlock | ThinkingBlock | ToolResultBlock;

interface StreamJsonMessage {
  type?: string;
  subtype?: string;
  message?: {
    content?: ContentBlock[];
    role?: string;
    model?: string;
  };
  result?: string;
  tool_use_result?: { stdout?: string; stderr?: string };
  uuid?: string;
  session_id?: string;
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= n) return trimmed;
  return trimmed.slice(0, n) + "…";
}

function detectPhase(text: string): string | null {
  const m = text.match(/Phase\s*(\d)[^a-zA-Z]*/);
  if (!m) return null;
  const phaseNum = m[1];
  return `Phase ${phaseNum}`;
}

const PHASE_LABELS: Record<number, string> = {
  0: "프로젝트 초기화",
  1: "자막 청킹 중",
  2: "씬 블록 설계 중",
  3: "레이아웃 생성 중",
  4: "영상 렌더링 중",
  5: "자가 검증 중",
};

export function phaseLabel(n: number): string {
  return PHASE_LABELS[n] ?? `Phase ${n}`;
}

function detectPhaseFromSkill(skillName: string): number | null {
  const s = skillName.replace(/^\//, "");
  if (/^vg-chunk$|^vg-demo-script$|^vg-video-demo-script$|^vg-script$/.test(s))
    return 1;
  if (/^vg-scene$|^vg-demo-voice$|^vg-video-demo-voice$|^vg-voice$/.test(s))
    return 2;
  if (/^vg-layout$|^vg-demo-layout$|^vg-video-demo-layout$/.test(s)) return 3;
  if (/^vg-render$|^vg-demo-fx$|^vg-cinematic$/.test(s)) return 4;
  return null;
}

function detectPhaseFromBash(cmd: string): number | null {
  const trimmed = cmd.trimStart();
  // Exclude read-only / inspection commands that just mention script names
  if (
    /^(cat|head|tail|grep|less|more|find|ls|wc|awk|sed|file|stat|echo|which|type)\b/.test(
      trimmed
    )
  ) {
    return null;
  }

  // Actual script execution
  if (/\b(npx\s+(tsx\s+)?|node\s+|bun\s+)scripts\/gen-beats\b/i.test(cmd))
    return 1;
  if (
    /\b(npx\s+(tsx\s+)?|node\s+|bun\s+)scripts\/gen-scenes\b/i.test(cmd)
  )
    return 2;
  if (
    /\b(npx\s+(tsx\s+)?|node\s+|bun\s+)scripts\/gen-layout\b/i.test(cmd)
  )
    return 3;
  if (/\bremotion\s+render\b/i.test(cmd)) return 4;
  if (/\bbash\s+scripts\/postprocess\.sh\b/i.test(cmd)) return 4;
  if (/\bffmpeg\b.*\bframes\b/i.test(cmd)) return 5;

  return null;
}

function detectPhaseFromFile(
  filePath: string,
  contentHint?: string
): number | null {
  if (/\bbeats\.json$/i.test(filePath)) return 1;
  if (/\bscene-plan\.json$/i.test(filePath)) return 2;
  if (/\bscenes\.json$/i.test(filePath) && !/scenes-v2/i.test(filePath))
    return 2;
  if (/\bscenes-v2\.json$/i.test(filePath)) {
    if (contentHint && /stack_root/i.test(contentHint)) return 3;
    return 2;
  }
  if (/\brender-props-v2\.json$/i.test(filePath)) return 3;
  if (/\boutput\/[^/]+\.mp4$/i.test(filePath)) return 4;
  return null;
}

function toolIcon(name: string): string {
  switch (name) {
    case "Bash":
      return "🔧";
    case "Edit":
    case "Write":
      return "📝";
    case "Read":
      return "📖";
    case "Grep":
    case "Glob":
      return "🔍";
    case "WebSearch":
    case "WebFetch":
      return "🌐";
    case "Skill":
      return "🎯";
    case "TodoWrite":
    case "TaskCreate":
    case "TaskUpdate":
      return "📋";
    default:
      return "🛠️";
  }
}

function parseStreamJson(
  line: JobLogLine,
  raw: string
): PrettyLogEvent[] {
  let msg: StreamJsonMessage;
  try {
    msg = JSON.parse(raw) as StreamJsonMessage;
  } catch {
    return [];
  }

  const mkId = () =>
    `${line.ts}-${Math.random().toString(36).slice(2, 8)}`;
  const out: PrettyLogEvent[] = [];

  if (msg.type === "system") {
    if (msg.subtype === "init") {
      out.push({
        id: mkId(),
        ts: line.ts,
        kind: "session",
        icon: "🚀",
        tone: "info",
        title: "Claude 세션 시작",
        body: msg.message?.model ? `모델: ${msg.message.model}` : undefined,
      });
    }
    return out;
  }

  if (msg.type === "rate_limit_event") return [];

  if (msg.type === "assistant" && Array.isArray(msg.message?.content)) {
    const blocks = msg.message.content;
    for (const block of blocks) {
      if (block.type === "thinking") {
        const text = (block as ThinkingBlock).thinking ?? "";
        if (!text.trim()) continue;
        out.push({
          id: mkId(),
          ts: line.ts,
          kind: "thinking",
          icon: "💭",
          tone: "muted",
          title: truncate(text, 80),
          body: text,
          collapsed: true,
        });
        continue;
      }
      if (block.type === "text") {
        const text = (block as TextBlock).text ?? "";
        if (!text.trim()) continue;

        if (text.includes("[control-center-abort]")) {
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "abort",
            icon: "🛑",
            tone: "error",
            title: truncate(
              text.replace(/\[control-center-abort\]/g, ""),
              120
            ),
            body: text,
          });
          continue;
        }

        if (text.includes("[auto-default]")) {
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "auto-default",
            icon: "⚙️",
            tone: "warning",
            title: truncate(text, 120),
            body: text,
          });
          continue;
        }

        const phase = detectPhase(text);
        if (phase) {
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "phase",
            icon: "📍",
            tone: "info",
            title: `${phase} — ${truncate(text, 100)}`,
            body: text,
          });
          continue;
        }

        out.push({
          id: mkId(),
          ts: line.ts,
          kind: "text",
          icon: "💬",
          tone: "info",
          title: truncate(text, 120),
          body: text.length > 120 ? text : undefined,
        });
        continue;
      }
      if (block.type === "tool_use") {
        const tu = block as ToolUseBlock;
        const name = tu.name ?? "Tool";
        const input = tu.input ?? {};
        const icon = toolIcon(name);

        if (name === "Bash") {
          const cmd = String(input.command ?? "");
          const desc = String(input.description ?? "");
          const phase = detectPhaseFromBash(cmd);
          if (phase !== null) {
            out.push({
              id: mkId(),
              ts: line.ts,
              kind: "phase",
              icon: "📍",
              tone: "info",
              title: `Phase ${phase} — ${phaseLabel(phase)}`,
              body: cmd,
            });
          }
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "tool",
            icon,
            tone: "muted",
            title: desc ? `$ ${desc}` : `$ ${truncate(cmd, 100)}`,
            body: cmd,
            collapsed: true,
          });
          continue;
        }

        if (name === "Skill") {
          const skillName = String(
            input.skill ??
              input.skillName ??
              input.skill_name ??
              input.name ??
              ""
          );
          const phase = detectPhaseFromSkill(skillName);
          if (phase !== null) {
            out.push({
              id: mkId(),
              ts: line.ts,
              kind: "phase",
              icon: "📍",
              tone: "info",
              title: `Phase ${phase} — ${phaseLabel(phase)}`,
              body: `/${skillName}`,
            });
          }
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "skill",
            icon,
            tone: "info",
            title: `스킬 호출: /${skillName}`,
            body: JSON.stringify(input, null, 2),
            collapsed: true,
          });
          continue;
        }

        if (name === "Edit" || name === "Write" || name === "Read") {
          const fp = String(input.file_path ?? "");
          if (name !== "Read") {
            const contentHint = String(
              input.new_string ?? input.content ?? ""
            );
            const phase = detectPhaseFromFile(fp, contentHint);
            if (phase !== null) {
              out.push({
                id: mkId(),
                ts: line.ts,
                kind: "phase",
                icon: "📍",
                tone: "info",
                title: `Phase ${phase} — ${phaseLabel(phase)}`,
                body: fp,
              });
            }
          }
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "tool",
            icon,
            tone: "muted",
            title: `${name} ${truncate(fp, 90)}`,
            body: undefined,
            collapsed: true,
          });
          continue;
        }

        if (name === "WebSearch" || name === "WebFetch") {
          const q = String(input.query ?? input.url ?? "");
          out.push({
            id: mkId(),
            ts: line.ts,
            kind: "tool",
            icon,
            tone: "muted",
            title: `${name}: ${truncate(q, 100)}`,
            collapsed: true,
          });
          continue;
        }

        out.push({
          id: mkId(),
          ts: line.ts,
          kind: "tool",
          icon,
          tone: "muted",
          title: name,
          body: JSON.stringify(input, null, 2),
          collapsed: true,
        });
      }
    }
    return out;
  }

  if (msg.type === "user" && Array.isArray(msg.message?.content)) {
    const blocks = msg.message.content;
    for (const block of blocks) {
      if (block.type === "tool_result") {
        const tr = block as ToolResultBlock;
        const isError = tr.is_error ?? false;
        const content = typeof tr.content === "string" ? tr.content : "";
        const stdout = msg.tool_use_result?.stdout ?? content;
        const body = typeof stdout === "string" ? stdout : content;
        if (!body || body.length === 0) continue;
        out.push({
          id: mkId(),
          ts: line.ts,
          kind: "tool-result",
          icon: isError ? "❌" : "✓",
          tone: isError ? "error" : "muted",
          title: isError
            ? `오류: ${truncate(body, 100)}`
            : `결과: ${truncate(body, 100)}`,
          body,
          collapsed: true,
        });
      }
    }
    return out;
  }

  if (msg.type === "result") {
    const isError = msg.subtype === "error";
    const text = msg.result ?? "";
    out.push({
      id: mkId(),
      ts: line.ts,
      kind: "result",
      icon: isError ? "❌" : "✅",
      tone: isError ? "error" : "success",
      title: isError ? "실행 실패" : "완료",
      body: text,
    });
    return out;
  }

  return out;
}

function parseSystemLine(line: JobLogLine): PrettyLogEvent {
  const id = `${line.ts}-${Math.random().toString(36).slice(2, 8)}`;
  const text = line.text.replace(/^\[system\]\s*/, "");

  if (text.includes("실행:")) {
    const skillMatch = text.match(/실행:\s*(\S+)\s*(\S*)/);
    const skill = skillMatch?.[1] ?? "";
    const pid = skillMatch?.[2] ?? "";
    return {
      id,
      ts: line.ts,
      kind: "system",
      icon: "🚀",
      tone: "info",
      title: `CLI 실행 — ${skill}${pid ? ` ${pid}` : ""}`,
    };
  }

  if (text.includes("종료")) {
    const ok = text.includes("status=completed");
    return {
      id,
      ts: line.ts,
      kind: "system",
      icon: ok ? "🏁" : "⚠️",
      tone: ok ? "success" : "warning",
      title: `CLI 종료 — ${text}`,
    };
  }

  if (text.includes("취소")) {
    return {
      id,
      ts: line.ts,
      kind: "system",
      icon: "⏹️",
      tone: "warning",
      title: "사용자 취소",
    };
  }

  if (text.includes("체이닝")) {
    return {
      id,
      ts: line.ts,
      kind: "system",
      icon: "🔗",
      tone: "info",
      title: text,
    };
  }

  return {
    id,
    ts: line.ts,
    kind: "system",
    icon: "ℹ️",
    tone: "muted",
    title: text,
  };
}

export function parseLogLine(line: JobLogLine): PrettyLogEvent[] {
  if (line.stream === "system") {
    return [parseSystemLine(line)];
  }

  const trimmed = line.text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parseStreamJson(line, trimmed);
  }

  // Non-JSON stderr or raw stdout
  if (line.stream === "stderr") {
    return [
      {
        id: `${line.ts}-${Math.random().toString(36).slice(2, 8)}`,
        ts: line.ts,
        kind: "error",
        icon: "⚠️",
        tone: "error",
        title: truncate(trimmed, 120),
        body: trimmed,
      },
    ];
  }

  return [];
}

export function parseLogLines(lines: JobLogLine[]): PrettyLogEvent[] {
  const out: PrettyLogEvent[] = [];
  for (const line of lines) {
    const events = parseLogLine(line);
    for (const ev of events) out.push(ev);
  }
  return out;
}
