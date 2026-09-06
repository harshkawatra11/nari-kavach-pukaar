import type { GeoPoint } from "@pukaar/core";
import { appendLocationPing } from "@/lib/firestore/sessions";

// Next 16: dynamic route params arrive as a Promise. Destructuring directly
// gives you a Promise object and a confusing 404 further down the stack.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return Response.json({ ok: true, written: result.written });
}
