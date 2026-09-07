"use client";

import { useEffect, useRef, useState } from "react";
import { PanelRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";
import type { LocationStatus } from "@pukaar/core";

const TARGET_MS = 1200;

function TriggerRow({ label, state }: { label: string; state: "idle" | "armed" | "fired" | "unavailable" }) {
  const dot = { idle: "bg-ink-ghost", armed: "bg-ink-faint", fired: "bg-alarm animate-pulse", unavailable: "bg-ink-ghost opacity-40" }[state];
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-[var(--radius-full)]", dot)} />
      <span className="text-[length:var(--text-sm)] text-ink-soft">{label}</span>
      <span className="ml-auto font-mono text-[length:var(--text-2xs)] uppercase text-ink-faint">{state}</span>
    </div>
  );
}

export function Inspector({
  lastTurnMs,
  path1State,
  path2State,
  trackUrl,
  location,
  accuracyM,
  onKillRelay,
}: {
  lastTurnMs: number | null;
  path1State: "idle" | "armed" | "fired";
  path2State: "idle" | "armed" | "fired" | "unavailable";
  trackUrl: string | null;
  location: { capturedAt: number | null; ageMs: number | null; status: LocationStatus };
  accuracyM: number | null;
  onKillRelay: () => void;
}) {
  const [history, setHistory] = useState<number[]>([]);
  const lastSeen = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // localStorage does not exist during SSR, so the collapsed state can
    // only be learned client-side, after mount, same as the low-power and
    // reduced-motion checks elsewhere in the orb components.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem("pukaar.inspectorCollapsed") === "1");
    } catch {
      /* private browsing or storage blocked, default to expanded */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("pukaar.inspectorCollapsed", next ? "1" : "0");
      } catch {
        /* best effort */
      }
      return next;
    });
  }

  useEffect(() => {
    if (lastTurnMs !== null && lastTurnMs !== lastSeen.current) {
      lastSeen.current = lastTurnMs;
      setHistory((h) => [...h.slice(-11), lastTurnMs]);
    }
  }, [lastTurnMs]);

  if (collapsed) {
    return (
      <div className="hidden w-12 shrink-0 flex-col items-center border-l border-hairline py-3 lg:flex">
        <IconButton label="Expand inspector" onClick={toggle} side="left">
          <PanelRight className="h-4 w-4" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-hairline lg:flex">
      <div className="flex h-[72px] shrink-0 items-center border-b border-hairline px-4">
        <span className="section-label">Session</span>
        <IconButton label="Collapse inspector" onClick={toggle} side="left" className="ml-auto">
          <PanelRight className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="flex flex-col gap-6 p-4">
        <div>
          <p className="section-label mb-2">Time to first word</p>
          <Sparkline values={history} targetMs={TARGET_MS} />
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex justify-between text-[length:var(--text-sm)]">
              <span className="text-ink-faint">Last</span>
              <span className="font-mono text-ink">{lastTurnMs !== null ? `${lastTurnMs}ms` : "Not measured"}</span>
            </div>
            <div className="flex justify-between text-[length:var(--text-sm)]">
              <span className="text-ink-faint">Target</span>
              <span className="font-mono text-ink">{TARGET_MS}ms</span>
            </div>
          </div>
        </div>

        <div className="border-t border-hairline pt-4">
          <p className="section-label mb-1">Trigger paths</p>
          <TriggerRow label="Model tool call" state={path1State} />
          <TriggerRow label="Local phrase match" state={path2State} />
        </div>

        <div className="border-t border-hairline pt-4">
          <p className="section-label mb-2">Session</p>
          <p className="text-[length:var(--text-sm)] text-ink-soft">Contacts configured at setup</p>
          <div className="mt-3 flex items-center justify-between text-[length:var(--text-sm)]">
            <span className="text-ink-faint">Location</span>
            <span className="font-mono uppercase text-ink">{location.status}</span>
          </div>
          {location.capturedAt && (
            <p className="mt-1 text-[length:var(--text-2xs)] text-ink-faint">
              Updated {Math.floor((location.ageMs ?? 0) / 1000)}s ago{accuracyM !== null ? ` · ±${Math.round(accuracyM)}m` : ""}
            </p>
          )}
          {trackUrl && (
            <Button variant="quiet" size="sm" className="mt-1 px-0" onClick={() => window.open(trackUrl, "_blank", "noopener,noreferrer")}>
              Open contact view
            </Button>
          )}
        </div>

        <div className="mt-auto border-t border-hairline pt-4">
          <Button variant="quiet" size="sm" className="px-0" onClick={onKillRelay}>
            Kill relay
          </Button>
          <p className="mt-1 text-[length:var(--text-2xs)] text-ink-ghost">Demonstrates that path 2 fires without the relay.</p>
        </div>
      </div>
    </div>
  );
}
