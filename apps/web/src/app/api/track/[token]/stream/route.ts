import { getSessionByTrackToken } from "@/lib/firestore/sessions";

// Server-sent events for the live contact-view map. All four of these are
// required or the stream buffers and nothing arrives at the browser:
// nodejs runtime (not edge), force-dynamic, and the three response headers
// below, plus a periodic heartbeat comment or intermediaries close the
// connection.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = 1500;
const HEARTBEAT_MS = 15000;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let closed = false;
  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let lastPayload = "";

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const session = await getSessionByTrackToken(token);
          if (!session) {
            send("error", { message: "This tracking link is no longer active." });
            return;
          }
          const payload = JSON.stringify({
            status: session.status,
            trail: session.trail,
            alarm: session.alarm,
            userName: session.userName,
          });
          if (payload !== lastPayload) {
            lastPayload = payload;
            send("update", JSON.parse(payload));
          }
        } catch {
          // transient Firestore hiccup, next poll tick will retry
        }
      };

      void poll();
      pollInterval = setInterval(poll, POLL_MS);
      heartbeatInterval = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_MS);
    },
    cancel() {
      // Every closed tab must clear its interval or it leaks a Firestore poll
      // forever. This fires when the client disconnects.
      closed = true;
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
