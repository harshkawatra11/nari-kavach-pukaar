import { env } from "./env";
import { log } from "./log";

// The relay never touches Firestore or WhatsApp directly. It posts to the web
// app's own alarm route, which is the single place both trigger paths converge
// and get deduplicated. One writer, one dedupe window, no race between the
// server tool call and the browser's local match arriving milliseconds apart.
export async function raiseAlarm(sessionId: string, reason: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(`${env.WEB_ORIGIN}/api/alarm`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-relay-secret": env.RELAY_SHARED_SECRET,
      },
      body: JSON.stringify({ sessionId, path: "server-tool", reason }),
    });
    if (!res.ok) {
      log.error("alarm POST to web app failed", { sessionId, status: res.status });
      return { ok: false, status: res.status, error: "alarm request rejected" };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    log.error("alarm POST to web app threw", { sessionId, err: String(err) });
    return { ok: false, error: String(err) };
  }
}
