"use client";

import { useEffect, useState } from "react";
import { OrbStage } from "@/components/orb/OrbStage";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

export function CallHeader({ phase, connected, started }: { phase: string; connected: boolean; started: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const dotTone = !started ? "bg-ink-ghost" : connected ? "bg-success" : "bg-alarm";

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-hairline bg-ground px-5">
      <OrbStage phase={phase} size={44} showLabel={false} />
      <div className="min-w-0">
        <p className="truncate text-[length:var(--text-base)] font-medium text-ink">Maa</p>
        <p className="text-[length:var(--text-xs)] text-ink-faint">Mother</p>
      </div>
      <StatusPill phase={phase} className="ml-4" />
      <div className="ml-auto flex items-center gap-3">
        {started && <span className="font-mono text-[length:var(--text-sm)] text-ink-soft">{mm}:{ss}</span>}
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-[var(--radius-full)]", dotTone)} />
      </div>
    </header>
  );
}
