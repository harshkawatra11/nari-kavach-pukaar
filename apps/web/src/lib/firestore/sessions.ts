import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import type { Contact, GeoPoint, Lang, SessionDoc } from "@pukaar/core";
import { shouldPersistPing } from "@pukaar/core";
import { getDb } from "./admin";

// Unguessable, URL-safe track tokens. 21 chars of this alphabet is roughly
// the same entropy as a standard UUID v4.
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 21);

const SESSIONS = "sessions";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function createSession(input: {
  contacts: Contact[];
  duressPhrase: string;
  language: Lang;
  userName: string;
}): Promise<{ sessionId: string; trackToken: string }> {
  const db = getDb();
  const ref = db.collection(SESSIONS).doc();
  const now = Date.now();
  const trackToken = nanoid();

  const doc: Omit<SessionDoc, "id"> & { expiresAt: Timestamp } = {
    trackToken,
    createdAt: now,
    endedAt: null,
    language: input.language,
    duressPhrase: input.duressPhrase,
    userName: input.userName,
    contacts: input.contacts,
    status: "active",
    alarm: { raised: false, at: null, path: null, reason: null },
    trail: [],
    // Firestore TTL requires a Timestamp field, not a number, or the policy
    // silently ignores the document and nothing is ever deleted.
    expiresAt: Timestamp.fromMillis(now + SIX_HOURS_MS),
  };

  await ref.set(doc);
  return { sessionId: ref.id, trackToken };
}

export async function getSession(sessionId: string): Promise<(SessionDoc & { expiresAt: Timestamp }) | null> {
  const snap = await getDb().collection(SESSIONS).doc(sessionId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<SessionDoc, "id"> & { expiresAt: Timestamp }) };
}

export async function getSessionByTrackToken(trackToken: string): Promise<(SessionDoc & { expiresAt: Timestamp }) | null> {
  const snap = await getDb().collection(SESSIONS).where("trackToken", "==", trackToken).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<SessionDoc, "id"> & { expiresAt: Timestamp }) };
}

export async function endSession(sessionId: string): Promise<void> {
  await getDb().collection(SESSIONS).doc(sessionId).update({ status: "ended", endedAt: Date.now() });
}

/** Applies the movement/interval gate before writing, so a stationary phone
 *  does not spam Firestore writes during a live demo. */
export async function appendLocationPing(sessionId: string, point: GeoPoint): Promise<{ written: boolean }> {
  const db = getDb();
  const ref = db.collection(SESSIONS).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return { written: false };

  const data = snap.data() as SessionDoc;
  const trail = data.trail ?? [];
  const last = trail.length > 0 ? trail[trail.length - 1] : null;

  if (!shouldPersistPing(last, point)) return { written: false };

  await ref.update({ trail: FieldValue.arrayUnion(point) });
  return { written: true };
}
