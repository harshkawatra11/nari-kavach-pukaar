import { endSession } from "@/lib/firestore/sessions";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await endSession(id);
  return Response.json({ ok: true });
}
