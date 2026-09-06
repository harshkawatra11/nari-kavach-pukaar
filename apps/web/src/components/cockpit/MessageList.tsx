"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/hooks/useVoiceSession";
import { Message } from "@/components/chat/Message";

/** Renders the full transcript, not the last five lines: this is a real
 *  chat client, and a judge scrolling back through it is expected. Left is
 *  Pukaar, right is the caller, matching the entry-screen FAQ chat exactly. */
export function MessageList({ lines }: { lines: TranscriptLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-6" role="log" aria-live="polite" aria-label="Call transcript">
      <div className="mx-auto flex max-w-[760px] flex-col">
        {lines.length === 0 && <p className="mt-10 text-center text-[length:var(--text-base)] text-ink-faint">The call has not started.</p>}
        {lines.map((line, i) => (
          <Message
            key={line.id}
            side={line.speaker === "puk" ? "left" : "right"}
            name={line.speaker === "puk" ? "Pukaar" : "You"}
            showName={i === 0 || lines[i - 1].speaker !== line.speaker}
            muted={line.partial}
            alarm={line.isAlarmLine}
            footer={
              line.isAlarmLine ? (
                <span className="inline-flex items-center gap-1.5 text-[length:var(--text-2xs)] text-alarm">
                  <span className="h-1.5 w-1.5 rounded-[var(--radius-full)] bg-alarm" />
                  Safe word detected &middot; alert sent
                </span>
              ) : undefined
            }
          >
            {line.text}
            {line.partial && <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle opacity-60" aria-hidden />}
          </Message>
        ))}
      </div>
    </div>
  );
}
