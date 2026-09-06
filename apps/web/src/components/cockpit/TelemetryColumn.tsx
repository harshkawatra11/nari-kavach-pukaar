"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

const TARGET_MS = 1200;

function TriggerDot({ label, state }: { label: string; state: "idle" | "armed" | "fired" | "unavailable" }) {
  const color = { idle: "bg-ink-faint", armed: "bg-plum", fired: "bg-magenta animate-pulse", unavailable: "bg-ink-faint opacity-40" }[state];
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className={cn("w-2.5 h-2.5 rounded-full", color)} style={{ borderRadius: "50%" }} />
      <span className="font-body text-xs text-ink-soft">{label}</span>
      <span className="font-mono text-[10px] uppercase text-ink-faint ml-auto">{state}</span>
    </div>
  );
}

export function TelemetryColumn({
  lastTurnMs,
  path1State,
  path2State,
  onKillRelay,
}: {
  lastTurnMs: number | null;
  path1State: "idle" | "armed" | "fired";
  path2State: "idle" | "armed" | "fired" | "unavailable";
  onKillRelay: () => void;
}) {
  const [history, setHistory] = useState<number[]>([]);
  const lastSeen = useRef<number | null>(null);

  useEffect(() => {
    if (lastTurnMs !== null && lastTurnMs !== lastSeen.current) {
      lastSeen.current = lastTurnMs;
      setHistory((h) => [...h.slice(-11), lastTurnMs]);
    }
  }, [lastTurnMs]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[220px]">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Time to first word</p>
        <Sparkline values={history} targetMs={TARGET_MS} />
        <p className="font-mono text-sm mt-1 text-ink">
          {lastTurnMs !== null ? `${lastTurnMs}ms` : "–"}
          <span className="text-ink-faint text-xs"> / {TARGET_MS}ms target</span>
        </p>
      </div>
      <div className="flex flex-col gap-2 pt-4 border-t border-border">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">Trigger paths</p>
        <TriggerDot label="Model tool call" state={path1State} />
        <TriggerDot label="Local phrase match" state={path2State} />
        <button
          type="button"
          onClick={onKillRelay}
          className="mt-2 text-left font-mono text-[10px] uppercase tracking-wider text-magenta hover:underline"
        >
          Kill relay &rarr;
        </button>
      </div>
    </div>
  );
}
