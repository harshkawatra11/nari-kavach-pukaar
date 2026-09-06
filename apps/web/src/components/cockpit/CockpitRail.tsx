"use client";

import { EyeOff, Home, Info, PhoneOff } from "lucide-react";
import Link from "next/link";

export function CockpitRail({ onCoverMode, onEnd }: { onCoverMode: () => void; onEnd: () => void }) {
  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-16 flex flex-col items-center justify-between py-6 z-[var(--z-rail)]"
      style={{ zIndex: 10 }}
      aria-label="Session controls"
    >
      <Link
        href="/"
        aria-label="Back to entry"
        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        style={{ borderRadius: "50%" }}
      >
        <Home className="w-5 h-5 text-ink-soft" aria-hidden />
      </Link>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onCoverMode}
          aria-label="Switch to cover mode"
          title="Cover mode (Esc)"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-strong border border-border hover:bg-plum hover:text-ground transition-colors"
          style={{ borderRadius: "50%" }}
        >
          <EyeOff className="w-5 h-5" aria-hidden />
        </button>
        <Link
          href="/system"
          aria-label="System and evidence"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          style={{ borderRadius: "50%" }}
        >
          <Info className="w-5 h-5 text-ink-soft" aria-hidden />
        </Link>
      </div>
      <button
        type="button"
        onClick={onEnd}
        aria-label="End session"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-magenta text-ground hover:brightness-95 transition-all"
        style={{ borderRadius: "50%" }}
      >
        <PhoneOff className="w-5 h-5" aria-hidden />
      </button>
    </nav>
  );
}
