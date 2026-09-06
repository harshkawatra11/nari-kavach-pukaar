"use client";

import { use, useEffect, useState } from "react";
import { AuroraField } from "@/components/field/AuroraField";
import { LiveMap } from "@/components/track/LiveMap";
import type { GeoPoint } from "@pukaar/core";

interface TrackState {
  status: "active" | "ended" | "unknown";
  trail: GeoPoint[];
  alarm: { raised: boolean; at: number | null; path: string | null; reason: string | null };
  userName: string;
  error: string | null;
}

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<TrackState>({
    status: "unknown",
    trail: [],
    alarm: { raised: false, at: null, path: null, reason: null },
    userName: "she",
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
        } catch {
          /* connection-level error event, no payload */
        }
      }
    });
    return () => es.close();
  }, [token]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraField intensity={0.4} />
      <div className="relative max-w-2xl mx-auto px-6 py-16 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-semibold text-3xl">Following {state.userName}</h1>
          <p className="font-body text-sm text-ink-soft mt-2">
            This page updates automatically while her session is active. Sent to you because Pukaar raised an alert.
          </p>
        </div>
        {state.error ? (
          <p className="font-body text-sm text-magenta">{state.error}</p>
        ) : (
          <LiveMap trail={state.trail} alarm={state.alarm} userName={state.userName} />
        )}
      </div>
    </main>
  );
}
