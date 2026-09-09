import { randomUUID } from "node:crypto";
import { parseTelegramMapsLink } from "@pukaar/core";
import { verifySessionControl, appendLocationPing } from "@/lib/firestore/sessions";
import { readTelegramLocationCapture, startTelegramLocationCapture } from "@/lib/desktop/telegram-location";

async function authorized(id: string, req: Request) {
  return verifySessionControl(id, req.headers.get("x-session-control"));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authorized(id, req))) return Response.json({ ok: false, error: "invalid session control" }, { status: 401 });
  if (process.env.VERCEL) return Response.json({ ok: false, error: "desktop_bridge_unavailable" }, { status: 503 });
  const captureId = randomUUID();
  try {
    const capture = await startTelegramLocationCapture(captureId);
    return Response.json({ ok: true, captureId, stage: capture.stage }, { status: 202 });
  } catch {
    return Response.json({ ok: false, error: "desktop_bridge_unavailable" }, { status: 503 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authorized(id, req))) return Response.json({ ok: false, error: "invalid session control" }, { status: 401 });
  if (process.env.VERCEL) return Response.json({ ok: false, error: "desktop_bridge_unavailable" }, { status: 503 });
  const captureId = new URL(req.url).searchParams.get("captureId");
  if (!captureId || captureId.length < 8) return Response.json({ ok: false, error: "captureId is required" }, { status: 400 });
  try {
    const capture = await readTelegramLocationCapture(captureId);
    if (capture.stage !== "captured") return Response.json({ ok: true, ...capture });
    const parsed = capture.mapsUrl ? parseTelegramMapsLink(capture.mapsUrl) : null;
    if (!parsed) return Response.json({ ok: true, ...capture, stage: "unparsed", errorCode: "maps_link_invalid" });
    const point = {
      lat: parsed.lat,
      lng: parsed.lng,
      accuracyM: null,
      at: capture.point?.at ?? Date.now(),
      source: "telegram-desktop" as const,
    };
    const persisted = await appendLocationPing(id, point);
    if (persisted.status === "missing") return Response.json({ ok: false, error: "session not found" }, { status: 404 });
    if (persisted.status === "ended") return Response.json({ ok: false, error: "session ended" }, { status: 410 });
    return Response.json({ ok: true, ...capture, mapsUrl: parsed.canonicalUrl, persistedPoint: persisted.persistedPoint });
  } catch {
    return Response.json({ ok: false, error: "desktop_bridge_unavailable" }, { status: 503 });
  }
}
