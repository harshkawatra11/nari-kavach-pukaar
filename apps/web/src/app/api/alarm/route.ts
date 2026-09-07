import { buildAlertMessage, mapsLink } from "@pukaar/core";
import type { TriggerPath } from "@pukaar/core";
import { getDb } from "@/lib/firestore/admin";
import { recordAlert } from "@/lib/firestore/alerts";
import { sendWhatsAppAlert } from "@/lib/wa/bridge";
import { env } from "@/lib/env";

const DEDUPE_WINDOW_MS = 15000;

interface AlarmBody {
  sessionId: string;
  path: TriggerPath;
  reason: string;
}

// The convergence point both trigger paths post to. A transaction here is
// not optional: the server-tool path and the client-local path can arrive
// within milliseconds of each other, and a read-then-write race would send
// the WhatsApp message twice.
export async function POST(req: Request) {
  const relaySecretHeader = req.headers.get("x-relay-secret");
  const body = (await req.json()) as Partial<AlarmBody>;

  if (!body.sessionId || !body.path) {
    return Response.json({ ok: false, error: "sessionId and path are required" }, { status: 400 });
  }

  // The relay path authenticates with a shared secret; the browser's local
  // trigger path is same-origin and does not carry it. Both are legitimate.
  if (body.path === "server-tool" && relaySecretHeader !== env.RELAY_SHARED_SECRET) {
    return Response.json({ ok: false, error: "invalid relay secret" }, { status: 401 });
  }

  const db = getDb();
  const ref = db.collection("sessions").doc(body.sessionId);

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { kind: "not_found" as const };

    const data = snap.data()!;
    const now = Date.now();
    if (data.alarm?.raised && now - (data.alarm.at ?? 0) < DEDUPE_WINDOW_MS) {
      return { kind: "deduped" as const, session: data };
    }

    tx.update(ref, { alarm: { raised: true, at: now, path: body.path, reason: body.reason ?? "" } });
    return { kind: "raised" as const, session: data, at: now };
  });

  if (outcome.kind === "not_found") {
    return Response.json({ ok: false, error: "session not found" }, { status: 404 });
  }
  if (outcome.kind === "deduped") {
    return Response.json({ ok: true, deduped: true });
  }

  const session = outcome.session;
  const trail = (session.trail ?? []) as { lat: number; lng: number; accuracyM: number; at: number }[];
  const lastPoint = trail.length > 0 ? trail[trail.length - 1] : null;
  const trackUrl = `${env.PUBLIC_ORIGIN}/t/${session.trackToken}`;
  const timeHHMM = new Date(outcome.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  const message = buildAlertMessage({
    userName: session.userName ?? "she",
    timeHHMM,
    point: lastPoint,
    trackUrl,
    testMode: session.testMode === true,
  });

  const contacts = (session.contacts ?? []) as { name: string; phone: string }[];
  const results = [];
  for (const contact of contacts) {
    // Sequential, not parallel: WhatsApp Desktop has exactly one window, so
    // the bridge itself serializes, but sending sequentially here keeps the
    // ordering predictable and the per-contact timeout meaningful.
    const result = await sendWhatsAppAlert({ name: contact.name, phone: contact.phone, message });
    results.push(result);
  }

  await recordAlert({
    sessionId: body.sessionId,
    path: body.path,
    reason: body.reason ?? "",
    at: outcome.at,
    contacts: results,
  });

  return Response.json({
    ok: true,
    path: body.path,
    trackUrl,
    mapsLink: lastPoint ? mapsLink(lastPoint) : null,
    contacts: results,
  });
}
