import { getDb } from "@/lib/firestore/admin";

// Polled briefly by the call screen right after an alarm fires, to show which
// contacts actually got messaged. Not exposed via SSE because it only matters
// for the few seconds right after the alarm, not for the life of the session.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Filtered without orderBy to avoid requiring a composite Firestore index
  // for a query this infrequent; sorted client-side instead, over a small
  // capped batch (a session raises at most one alarm in practice).
  const snap = await getDb().collection("alerts").where("sessionId", "==", id).limit(10).get();
  if (snap.empty) return Response.json({ ok: true, found: false });
  const docs = snap.docs.map((d) => d.data()).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  const data = docs[0];
  const contacts = (data.contacts ?? []).map((contact: { sent?: boolean; submitted?: boolean; [key: string]: unknown }) => ({
    ...contact,
    submitted: contact.submitted ?? contact.sent ?? false,
  }));
  return Response.json({ ok: true, found: true, path: data.path, contacts, foregroundRestored: data.foregroundRestored ?? null });
}
