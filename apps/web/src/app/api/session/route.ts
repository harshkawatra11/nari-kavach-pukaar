import type { Contact, Lang } from "@pukaar/core";
import { createSession } from "@/lib/firestore/sessions";

interface CreateSessionBody {
  contacts: Contact[];
  duressPhrase: string;
  language: Lang;
  userName: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<CreateSessionBody>;

  if (!body.contacts || body.contacts.length === 0) {
    return Response.json({ ok: false, error: "at least one contact is required" }, { status: 400 });
  }
  if (!body.duressPhrase || body.duressPhrase.trim().length < 6) {
    return Response.json({ ok: false, error: "duress phrase must be a real sentence, not a single word" }, { status: 400 });
  }

  const { sessionId, trackToken } = await createSession({
    contacts: body.contacts,
    duressPhrase: body.duressPhrase.trim(),
    language: body.language ?? "auto",
    userName: body.userName?.trim() || "she",
  });

  return Response.json({ ok: true, sessionId, trackToken });
}
