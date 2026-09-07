"use client";

import { use, useEffect, useState } from "react";
import { AppBar } from "@/components/shell/AppBar";
import { LiveMap } from "@/components/track/LiveMap";
import type { GeoPoint } from "@pukaar/core";

interface TrackState {
  status: "active" | "ended" | "unknown";
  trail: GeoPoint[];
  alarm: { raised: boolean; at: number | null; path: string | null; reason: string | null };
  userName: string;
  expiresAt: number | null;
  error: string | null;
}

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<TrackState>({
    status: "unknown",
    trail: [],
    alarm: { raised: false, at: null, path: null, reason: null },
    userName: "she",
    expiresAt: null,
    error: null,
  });

  useEffect(() => {
    const es = new EventSource(`/api/track/${token}/stream`);
    es.addEventListener("update", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setState((s) => ({ ...s, ...data, error: null }));
    });
    es.addEventListener("error", (ev) => {
      const raw = (ev as MessageEvent).data;
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setState((s) => ({ ...s, error: data.message ?? "Connection lost." }));
          es.close();
        } catch {
          /* connection-level error event, no payload */
        }
      }
    });
    return () => es.close();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
        <div>
          <h1>Following {state.userName}</h1>
          <p className="mt-2 text-[length:var(--text-base)] text-ink-soft">
            This page updates automatically while her session is active. Sent to you because Pukaar raised an alert.
          </p>
          {state.status === "ended" && <p className="mt-2 text-[length:var(--text-sm)] text-ink-faint">Session ended. Showing the final recorded position.</p>}
        </div>
        {state.error ? (
          <p className="text-[length:var(--text-base)] text-alarm">{state.error}</p>
        ) : (
          <LiveMap trail={state.trail} alarm={state.alarm} userName={state.userName} />
        )}
      </main>
    </div>
  );
}
