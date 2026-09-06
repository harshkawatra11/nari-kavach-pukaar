"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TranscriptLine } from "@/hooks/useVoiceSession";
import { cn } from "@/lib/utils";

/** The transcript as a stream, not a chat log. Lines rise in from below,
 *  older lines recede and fade rather than scrolling off in a static list,
 *  so it reads as speech happening in the moment rather than a record being
 *  appended to. The in-flight partial sits at the front with a caret. */
export function TranscriptDock({ lines }: { lines: TranscriptLine[] }) {
  const visible = lines.slice(-5);

  return (
    <div
      className="w-full max-w-2xl mx-auto flex flex-col-reverse gap-2 min-h-[220px]"
      role="log"
      aria-live="polite"
      aria-label="Call transcript"
    >
      <AnimatePresence initial={false}>
        {[...visible].reverse().map((line, indexFromTop) => {
          const depth = indexFromTop; // 0 = newest
          return (
            <motion.div
              key={line.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{
                opacity: line.partial ? 0.7 : Math.max(0.3, 1 - depth * 0.18),
                y: 0,
                scale: 1 - depth * 0.01,
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className={cn("flex", line.speaker === "her" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] px-4 py-2.5 font-body text-[15px] leading-snug rounded-2xl",
                  line.isAlarmLine
                    ? "bg-magenta text-ground font-medium"
                    : line.speaker === "puk"
                      ? "bg-surface-strong text-ink border border-border"
                      : "bg-plum text-ground",
                )}
                style={{ borderRadius: "1.1rem" }}
              >
                {line.text}
                {line.partial && (
                  <span className="inline-block w-1.5 h-3.5 bg-current opacity-60 ml-1 align-middle animate-pulse" aria-hidden />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {visible.length === 0 && (
        <p className="text-center font-body text-sm text-ink-faint">The call has not started yet.</p>
      )}
    </div>
  );
}
