"use client";

import { useMemo } from "react";
import { detectDuress } from "@pukaar/core";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_PHRASE = "No, I already told mom. I will eat at home.";

// A handful of things people say constantly, used only to warn if the chosen
// phrase sits too close to ordinary small talk. Not a security boundary, a
// nudge: see packages/core/src/duress.ts for why a distinctive phrase matters.
const GENERIC_PROBES = ["okay I will call you back", "I am on my way home now", "let me call you later", "yeah I am almost there"];

type Level = "too-short" | "generic" | "short" | "distinctive";

const METER_FILL: Record<Level, number> = { "too-short": 0, generic: 1, short: 2, distinctive: 3 };
const METER_COPY: Record<Level, string> = {
  "too-short": "Too short to recognize reliably. Use a full sentence.",
  generic: "Close to something people say all the time. Make it more specific.",
  short: "Works, but a longer sentence is easier to recognize under noise.",
  distinctive: "Distinctive. Easy to recognize, unlikely to say by accident.",
};

/** Renders rows only, no owned heading or container: the parent page places
 *  this inside a SettingsGroup. The distinctiveness meter (three segments)
 *  replaces the old sentence-of-coloured-text feedback with something
 *  scannable at a glance. */
export function DuressPhrasePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  const level: Level = useMemo(() => {
    if (wordCount < 3) return "too-short";
    const closest = Math.max(...GENERIC_PROBES.map((p) => detectDuress(p, value, 0).score));
    if (closest > 0.55) return "generic";
    if (wordCount < 6) return "short";
    return "distinctive";
  }, [value, wordCount]);

  const filled = METER_FILL[level];

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <Input id="duress-phrase" value={value} onChange={(e) => onChange(e.target.value)} placeholder={DEFAULT_PHRASE} />
      {value.length > 0 && (
        <>
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-[var(--radius-full)]",
                  i < filled ? (level === "distinctive" ? "bg-success" : "bg-ink-faint") : "bg-surface-3",
                )}
              />
            ))}
          </div>
          <p className="text-[length:var(--text-xs)] text-ink-faint">{METER_COPY[level]}</p>
        </>
      )}
      <button
        type="button"
        onClick={() => onChange(DEFAULT_PHRASE)}
        className="self-start text-[length:var(--text-sm)] text-ink-faint transition-colors hover:text-ink"
      >
        Use the demo phrase
      </button>
    </div>
  );
}
