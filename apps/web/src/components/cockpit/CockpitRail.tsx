"use client";

import { EyeOff, Home, Info, PhoneOff } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/icon-button";

export function CockpitRail({ onCoverMode, onEnd }: { onCoverMode: () => void; onEnd: () => void }) {
  return (
    <nav
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-hairline py-3"
      aria-label="Session controls"
    >
      <Link href="/">
        <IconButton label="Back to entry" side="right">
          <Home className="h-4 w-4" />
        </IconButton>
      </Link>
      <div className="flex flex-col gap-1">
        <IconButton label="Cover mode (Esc)" onClick={onCoverMode}>
          <EyeOff className="h-4 w-4" />
        </IconButton>
        <Link href="/system">
          <IconButton label="System and evidence">
            <Info className="h-4 w-4" />
          </IconButton>
        </Link>
      </div>
      <IconButton label="End session" tone="danger" onClick={onEnd} className="mt-auto">
        <PhoneOff className="h-4 w-4" />
      </IconButton>
    </nav>
  );
}
