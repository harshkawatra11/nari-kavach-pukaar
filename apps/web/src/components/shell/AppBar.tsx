import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 52px, hairline bottom, small tracked wordmark left, actions right. The
 *  wordmark is deliberately small: a large centred wordmark on every page is
 *  a landing-page habit, not a product one. */
export function AppBar({
  title,
  back,
  actions,
  className,
}: {
  title?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-[52px] shrink-0 items-center gap-3 border-b border-hairline bg-ground px-4",
        className,
      )}
    >
      {back ? (
        <Link href={back.href} className="text-[length:var(--text-sm)] text-ink-faint transition-colors hover:text-ink">
          &larr; {back.label}
        </Link>
      ) : (
        <Link href="/" className="font-display text-[length:var(--text-sm)] font-semibold tracking-[0.16em] text-ink">
          PUKAAR
        </Link>
      )}
      {title && <span className="text-[length:var(--text-sm)] text-ink-faint">{title}</span>}
      <div className="ml-auto flex items-center gap-1">{actions}</div>
    </header>
  );
}
