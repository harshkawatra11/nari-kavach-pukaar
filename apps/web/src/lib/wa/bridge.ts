import { env } from "@/lib/env";

export interface WaAlertResult {
  name: string;
  phone: string;
  submitted: boolean;
  error?: string;
}

export interface WaBatchResult {
  stage: "queued" | "preparing" | "submitting" | "submitted" | "failed" | "unknown";
  contacts: WaAlertResult[];
  foregroundRestored: boolean;
}

/** Sends every recipient through one serialized desktop operation so
 * WhatsApp comes forward once and Pukaar is restored once after the batch. */
export async function sendWhatsAppAlerts(opts: {
  alertId: string;
  contacts: Array<{ name: string; phone: string }>;
  message: string;
  returnDelayMs?: number;
}): Promise<WaBatchResult> {
  try {
    const headers = { "content-type": "application/json", "x-bridge-secret": env.WA_BRIDGE_SECRET };
    const res = await fetch(`${env.WA_BRIDGE_URL}/alerts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ alertId: opts.alertId, contacts: opts.contacts, message: opts.message, returnDelayMs: opts.returnDelayMs ?? 2000 }),
      signal: AbortSignal.timeout(5000),
    });
    let data = (await res.json().catch(() => ({}))) as Partial<WaBatchResult> & { error?: string };
    if (!res.ok) throw new Error(data.error ?? `bridge returned ${res.status}`);
    const terminal = new Set(["submitted", "failed", "unknown"]);
    for (let attempt = 0; attempt < 45 && !terminal.has(data.stage ?? "queued"); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const status = await fetch(`${env.WA_BRIDGE_URL}/alerts/${encodeURIComponent(opts.alertId)}`, { headers, signal: AbortSignal.timeout(3000) });
      if (!status.ok) throw new Error(`bridge status returned ${status.status}`);
      data = (await status.json()) as Partial<WaBatchResult>;
    }
    return { stage: data.stage ?? "unknown", contacts: Array.isArray(data.contacts) ? data.contacts : [], foregroundRestored: data.foregroundRestored === true };
  } catch (err) {
    const error = String(err instanceof Error ? err.message : err);
    return { stage: "failed", contacts: opts.contacts.map((contact) => ({ ...contact, submitted: false, error })), foregroundRestored: false };
  }
}
