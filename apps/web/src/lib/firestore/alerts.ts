import { getDb } from "./admin";
import type { TriggerPath } from "@pukaar/core";

const ALERTS = "alerts";

export interface AlertRecord {
  sessionId: string;
  path: TriggerPath;
  reason: string;
  at: number;
  contacts: { name: string; phone: string; sent: boolean; error?: string }[];
}

export async function recordAlert(record: AlertRecord): Promise<string> {
  const ref = await getDb().collection(ALERTS).add(record);
  return ref.id;
}
