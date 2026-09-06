import { OrbGlyph } from "./orb-glyph";
import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

/** Dark stadium pill, small live glyph, quiet text, no colour. This is the
 *  monochrome status indicator: it replaces the bare phase label that used to
 *  float under the hero, and it is what sits in the call header next to the
 *  compact orb. */
export function StatusPill({ phase, className }: { phase: string; className?: string }) {
  const active = phase === "listening" || phase === "thinking" || phase === "speaking";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-[var(--radius-full)] border border-hairline bg-surface-1 py-2 pl-2.5 pr-4",
        "text-[length:var(--text-base)] text-ink-soft",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <OrbGlyph phase={phase} className="h-5 w-5 shrink-0 text-ink-faint" />
      <span className="font-medium text-ink">{LABEL[phase] ?? "Ready"}</span>
      {active && (
        <span className="text-ink-ghost" aria-hidden>
          &middot;&middot;&middot;
        </span>
      )}
    </div>
  );
}
