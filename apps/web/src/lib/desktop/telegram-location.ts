import { env } from "@/lib/env";

export type TelegramCaptureStage =
  | "queued"
  | "opening_telegram"
  | "opening_saved_messages"
  | "opening_picker"
  | "awaiting_confirmation"
  | "copying_link"
  | "captured"
  | "cancelled"
  | "failed"
  | "unparsed";

export interface TelegramCaptureSnapshot {
  captureId: string;
  stage: TelegramCaptureStage;
  mapsUrl?: string;
  point?: {
    lat: number;
    lng: number;
    accuracyM: null;
    at: number;
    source: "telegram-desktop";
  };
  foregroundRestored?: boolean;
  errorCode?: string;
  error?: string;
}

function headers() {
  return { "content-type": "application/json", "x-bridge-secret": env.WA_BRIDGE_SECRET };
}

export async function startTelegramLocationCapture(captureId: string): Promise<TelegramCaptureSnapshot> {
  const response = await fetch(`${env.WA_BRIDGE_URL}/location-captures`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ captureId, confirmationTimeoutMs: 45000 }),
    signal: AbortSignal.timeout(4000),
  });
  const body = (await response.json()) as TelegramCaptureSnapshot & { error?: string };
  if (!response.ok) throw new Error(body.error || `desktop bridge returned ${response.status}`);
  return body;
}

export async function readTelegramLocationCapture(captureId: string): Promise<TelegramCaptureSnapshot> {
  const response = await fetch(`${env.WA_BRIDGE_URL}/location-captures/${encodeURIComponent(captureId)}`, {
    headers: headers(),
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });
  const body = (await response.json()) as TelegramCaptureSnapshot & { error?: string };
  if (!response.ok) throw new Error(body.error || `desktop bridge returned ${response.status}`);
  return body;
}
