import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The macOS-Settings pattern: a labelled group of rows in one bordered
 *  container, hairlines between rows instead of gaps between cards. Replaces
 *  every "big rounded card with a heading inside it" pattern in the app. */
export function SettingsGroup({
  label,
  footnote,
  children,
  className,
}: {
  label: string;
  footnote?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h2 className="section-label px-1">{label}</h2>
      <div className="divide-y divide-[var(--hairline)] overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface-1">
        {children}
      </div>
      {footnote && <p className="px-1 text-[length:var(--text-xs)] leading-[var(--leading-snug)] text-ink-faint">{footnote}</p>}
    </section>
  );
}

/** One row inside a SettingsGroup. Label left, control right, 52px tall.
 *  `stacked` is for controls that need the full width, such as a long text
 *  input or a meter. */
export function SettingsRow({
  label,
  htmlFor,
  hint,
  stacked,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("px-4 py-3", stacked ? "flex flex-col gap-2" : "flex min-h-[52px] items-center gap-4")}>
      {label && (
        <div className={stacked ? "" : "shrink-0"}>
          <label htmlFor={htmlFor} className="text-[length:var(--text-base)] text-ink">
            {label}
          </label>
          {hint && <p className="mt-0.5 text-[length:var(--text-xs)] text-ink-faint">{hint}</p>}
        </div>
      )}
      <div className={stacked ? "w-full" : "ml-auto flex max-w-[62%] flex-1 justify-end"}>{children}</div>
    </div>
  );
}
