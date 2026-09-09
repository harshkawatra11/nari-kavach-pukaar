import { getDb } from "./admin";
import type { TriggerPath } from "@pukaar/core";

const ALERTS = "alerts";

export interface AlertRecord {
  sessionId: string;
  path: TriggerPath;
  reason: string;
  at: number;
  contacts: { name: string; phone: string; submitted?: boolean; sent?: boolean; error?: string }[];
  foregroundRestored?: boolean;
  stage?: "detected" | "queued" | "preparing" | "submitting" | "submitted" | "failed" | "unknown";
}

export async function recordAlert(record: AlertRecord, alertId?: string): Promise<string> {
  const ref = alertId ? getDb().collection(ALERTS).doc(alertId) : getDb().collection(ALERTS).doc();
  await ref.set(record, { merge: true });
  return ref.id;
}
