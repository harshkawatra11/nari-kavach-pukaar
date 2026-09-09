import { endSession, verifySessionControl } from "@/lib/firestore/sessions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await verifySessionControl(id, req.headers.get("x-session-control")))) return Response.json({ ok: false, error: "invalid session control" }, { status: 401 });
  await endSession(id);
  return Response.json({ ok: true });
}
