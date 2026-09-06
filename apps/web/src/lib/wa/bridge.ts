import { env } from "@/lib/env";

export interface WaAlertResult {
  name: string;
  phone: string;
  sent: boolean;
  error?: string;
}

/** Posts one alert to the local WhatsApp bridge. Never throws: a bridge
 *  failure (bridge not running, WhatsApp not signed in) must not fail the
 *  overall alarm request, since the Firestore write and the live map SSE
 *  stream have already delivered the alert by the time this runs. */
export async function sendWhatsAppAlert(opts: { name: string; phone: string; message: string }): Promise<WaAlertResult> {
  try {
    const res = await fetch(`${env.WA_BRIDGE_URL}/alert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: opts.phone, message: opts.message }),
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { name: opts.name, phone: opts.phone, sent: false, error: data.error ?? `bridge returned ${res.status}` };
    }
    return { name: opts.name, phone: opts.phone, sent: true };
  } catch (err) {
    return { name: opts.name, phone: opts.phone, sent: false, error: String(err instanceof Error ? err.message : err) };
  }
}
