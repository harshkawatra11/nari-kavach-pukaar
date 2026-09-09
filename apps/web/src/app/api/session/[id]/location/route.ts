import type { GeoPoint } from "@pukaar/core";
import { appendLocationPing, verifySessionControl } from "@/lib/firestore/sessions";

// Next 16: dynamic route params arrive as a Promise. Destructuring directly
// gives you a Promise object and a confusing 404 further down the stack.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await verifySessionControl(id, req.headers.get("x-session-control")))) return Response.json({ ok: false, error: "invalid session control" }, { status: 401 });
  const point = (await req.json()) as Partial<GeoPoint>;

  if (typeof point.lat !== "number" || typeof point.lng !== "number") {
    return Response.json({ ok: false, error: "lat and lng are required numbers" }, { status: 400 });
  }

  const result = await appendLocationPing(id, {
    lat: point.lat,
    lng: point.lng,
    accuracyM: point.accuracyM ?? 0,
    at: point.at ?? Date.now(),
  });
  if (result.status === "missing") return Response.json({ ok: false, error: "session not found" }, { status: 404 });
  if (result.status === "ended") return Response.json({ ok: false, error: "session ended", persistedPoint: result.persistedPoint }, { status: 410 });
  return Response.json({ ok: true, written: result.written, persistedPoint: result.persistedPoint });
}
