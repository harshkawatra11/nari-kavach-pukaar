"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { AppBar } from "@/components/shell/AppBar";
import { IconButton } from "@/components/ui/icon-button";
import { OrbStage } from "@/components/orb/OrbStage";
import { Composer } from "@/components/chat/Composer";
import { Message } from "@/components/chat/Message";
import { answerFor, FAQ } from "@/lib/faq";
import { motion } from "framer-motion";

interface Turn {
  id: string;
  side: "left" | "right";
  text: string;
  action?: { label: string; href: string };
  pending?: boolean;
}

const SUGGESTIONS = ["How does the alarm work?", "What gets stored?", "What does it cost to run?"];
const FALLBACK_TEXT = `I can answer these directly: ${FAQ.map((f) => f.question).join("  ·  ")}`;

export default function Home() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const started = turns.length > 0;

  // Local FAQ match first: instant, zero network, cannot be wrong. Only
  // questions outside those six ever reach the Groq fallback (/api/chat),
  // which is grounded in the same FAQ facts rather than free to invent
  // claims about the product. Never both for the same question.
  async function ask(text: string) {
    setTurns((t) => [...t, { id: crypto.randomUUID(), side: "right", text }]);

    const local = answerFor(text);
    if (local) {
      setTurns((t) => [...t, { id: crypto.randomUUID(), side: "left", text: local.answer, action: local.action }]);
      return;
    }

    const pendingId = crypto.randomUUID();
    setTurns((t) => [...t, { id: pendingId, side: "left", text: "", pending: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      const answer: string = data.ok ? data.answer : FALLBACK_TEXT;
      setTurns((t) => t.map((turn) => (turn.id === pendingId ? { ...turn, text: answer, pending: false } : turn)));
    } catch {
      setTurns((t) => t.map((turn) => (turn.id === pendingId ? { ...turn, text: FALLBACK_TEXT, pending: false } : turn)));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <motion.div
        className="flex min-h-screen flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
      <AppBar
        actions={
          <Link href="/system">
            <IconButton label="How it works" size="sm">
              <Info className="h-4 w-4" />
            </IconButton>
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-6">
            <OrbStage phase="idle" size={300} showLabel={false} />
            <div className="text-center">
              <h1 className="text-[length:var(--text-2xl)]">The call she is already pretending to be on</h1>
              <p className="mt-2 text-[length:var(--text-base)] text-ink-soft">
                Made real, with the alarm hidden inside the conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-6">
            {turns.map((turn, i) => (
              <Message
                key={turn.id}
                side={turn.side}
                name={turn.side === "right" ? "You" : "Pukaar"}
                showName={i === 0 || turns[i - 1].side !== turn.side}
                muted={turn.pending}
                footer={
                  turn.action ? (
                    <Link
                      href={turn.action.href}
                      className="text-[length:var(--text-sm)] text-ink-soft transition-colors hover:text-ink"
                    >
                      {turn.action.label} &rarr;
                    </Link>
                  ) : undefined
                }
              >
                {turn.pending ? (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle opacity-60" aria-hidden />
                ) : (
                  turn.text
                )}
              </Message>
            ))}
          </div>
        )}

        <div className="sticky bottom-0 bg-ground pb-6 pt-2">
          <Composer onSubmit={ask} autoFocus />
          {!started && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-[var(--radius-sm)] border border-hairline bg-surface-1 px-3 py-1.5 text-[length:var(--text-sm)] text-ink-soft transition-colors duration-[var(--dur-fast)] hover:border-hairline-strong hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-[length:var(--text-2xs)] text-ink-ghost">
            Team IdeaForge &middot; Nari Kavach 2026
          </p>
        </div>
      </main>
      </motion.div>
    </div>
  );
}
