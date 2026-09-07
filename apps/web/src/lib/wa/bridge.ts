import { env } from "@/lib/env";

export interface WaAlertResult {
  name: string;
  phone: string;
  submitted: boolean;
  error?: string;
}

export interface WaBatchResult {
  contacts: WaAlertResult[];
  foregroundRestored: boolean;
}

/** Sends every recipient through one serialized desktop operation so
 * WhatsApp comes forward once and Pukaar is restored once after the batch. */
export async function sendWhatsAppAlerts(opts: {
  contacts: Array<{ name: string; phone: string }>;
  message: string;
  returnDelayMs?: number;
}): Promise<WaBatchResult> {
  try {
    const res = await fetch(`${env.WA_BRIDGE_URL}/alerts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contacts: opts.contacts, message: opts.message, returnDelayMs: opts.returnDelayMs ?? 2000 }),
      signal: AbortSignal.timeout(60000),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<WaBatchResult> & { error?: string };
    if (!Array.isArray(data.contacts)) {
      return {
        contacts: opts.contacts.map((contact) => ({ ...contact, submitted: false, error: data.error ?? `bridge returned ${res.status}` })),
        foregroundRestored: false,
      };
    }
    return { contacts: data.contacts, foregroundRestored: data.foregroundRestored === true };
  } catch (err) {
    const error = String(err instanceof Error ? err.message : err);
    return { contacts: opts.contacts.map((contact) => ({ ...contact, submitted: false, error })), foregroundRestored: false };
  }
}
