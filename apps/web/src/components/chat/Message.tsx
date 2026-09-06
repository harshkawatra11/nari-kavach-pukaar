"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bubble geometry follows the Messages/ChatGPT convention: 18px on three
 *  corners and 6px on the corner nearest the speaker, which is what makes a
 *  bubble read as directional rather than as a rounded rectangle. Grouping is
 *  the other half: a run from one speaker shows the name once and tightens
 *  the gap between bubbles. Used by both the entry-screen FAQ chat and the
 *  live call transcript, so bubbles are identical everywhere in the product. */
export function Message({
  side,
  name,
  showName,
  muted,
  alarm,
  footer,
  children,
}: {
  side: "left" | "right";
  name: string;
  showName: boolean;
  muted?: boolean;
  alarm?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const isRight = side === "right";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: muted ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col", isRight ? "items-end" : "items-start", showName ? "mt-5" : "mt-1")}
    >
      {showName && (
        <span className="mb-1.5 px-1 text-[length:var(--text-2xs)] font-medium uppercase tracking-[0.07em] text-ink-faint">
          {name}
        </span>
      )}
      <div
        className={cn(
          "max-w-[74%] px-3.5 py-2.5 text-[length:var(--text-base)] leading-[var(--leading-normal)]",
          isRight
            ? "rounded-[var(--radius-xl)] rounded-br-[var(--radius-xs)] bg-surface-3 text-ink"
            : "rounded-[var(--radius-xl)] rounded-bl-[var(--radius-xs)] border border-hairline bg-surface-1 text-ink",
          alarm && "ring-1 ring-alarm",
        )}
      >
        {children}
      </div>
      {footer && <div className="mt-1.5 px-1">{footer}</div>}
    </motion.div>
  );
}
