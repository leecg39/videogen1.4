// @TASK Control Center Phase 1 — 잡 실시간 로그 SSE 스트림

import { NextRequest } from "next/server";
import { getJob, subscribeJob } from "@/services/job-runner";

type RouteContext = {
  params: Promise<{ projectId: string; jobId: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { projectId, jobId } = await context.params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseFrame(event, data)));
        } catch {
          // stream closed
        }
      };

      const initial = await getJob(projectId, jobId);
      if (!initial) {
        send("error", { message: "잡을 찾을 수 없습니다" });
        controller.close();
        return;
      }

      send("snapshot", {
        id: initial.id,
        status: initial.status,
        step_id: initial.step_id,
        skill: initial.skill,
        logs: initial.logs,
        started_at: initial.started_at,
      });

      if (
        initial.status === "completed" ||
        initial.status === "failed" ||
        initial.status === "cancelled"
      ) {
        send("done", {
          status: initial.status,
          exit_code: initial.exit_code,
        });
        controller.close();
        return;
      }

      const unsubscribe = subscribeJob(jobId, (ev) => {
        send(ev.type, ev.payload);
        if (ev.type === "done") {
          unsubscribe();
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      });

      const heartbeat = setInterval(() => {
        send("ping", { ts: Date.now() });
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
