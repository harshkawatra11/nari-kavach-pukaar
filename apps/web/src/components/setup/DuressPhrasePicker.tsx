"use client";

import { useMemo } from "react";
import { detectDuress } from "@pukaar/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_PHRASE = "No, I already told mom. I will eat at home.";

// A handful of things people say constantly, used only to warn if the chosen
// phrase sits too close to ordinary small talk. Not a security boundary, a
// nudge: see packages/core/src/duress.ts for why a distinctive phrase matters.
const GENERIC_PROBES = [
  "okay I will call you back",
  "I am on my way home now",
  "let me call you later",
  "yeah I am almost there",
];

export function DuressPhrasePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  const distinctiveness = useMemo(() => {
    if (wordCount < 3) return { level: "too-short" as const };
    const closest = Math.max(...GENERIC_PROBES.map((p) => detectDuress(p, value, 0).score));
    if (closest > 0.55) return { level: "generic" as const, closest };
    if (wordCount < 6) return { level: "short" as const };
    return { level: "distinctive" as const };
  }, [value, wordCount]);

  const feedback = {
    "too-short": { text: "Too short to recognize reliably. Use a full sentence.", tone: "text-magenta" },
    generic: { text: "Close to something people say all the time. Make it more specific.", tone: "text-gold" },
    short: { text: "Works, but a longer sentence is easier to recognize under noise.", tone: "text-ink-faint" },
    distinctive: { text: "Distinctive. Easy to recognize, unlikely to say by accident.", tone: "text-success" },
  }[distinctiveness.level];

  return (
    <div className="bg-surface-strong rounded-2xl p-6 border border-border" style={{ borderRadius: "1.25rem" }}>
      <Label htmlFor="duress-phrase">Your duress phrase</Label>
      <p className="font-body text-sm text-ink-soft mb-3 leading-relaxed">
        A full, ordinary-sounding sentence you would only say if you needed to. The more
        distinctive it is, the more reliably it is recognized, and the harder it is to say by
        accident.
      </p>
      <Input
        id="duress-phrase"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_PHRASE}
      />
      {value.length > 0 && (
        <p className={cn("font-body text-xs mt-2", feedback.tone)}>{feedback.text}</p>
      )}
      <button
        type="button"
        onClick={() => onChange(DEFAULT_PHRASE)}
        className="mt-3 text-sm font-body font-medium underline text-plum"
      >
        Use the demo phrase
      </button>
    </div>
  );
}
