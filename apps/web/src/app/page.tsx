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

interface Turn {
  id: string;
  side: "left" | "right";
  text: string;
  action?: { label: string; href: string };
}

const SUGGESTIONS = ["How does the alarm work?", "What gets stored?", "What does it cost to run?"];

export default function Home() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const started = turns.length > 0;

  function ask(text: string) {
    const answer = answerFor(text);
    setTurns((t) => [
      ...t,
      { id: crypto.randomUUID(), side: "right", text },
      {
        id: crypto.randomUUID(),
        side: "left",
        text: answer?.answer ?? `I can answer these directly: ${FAQ.map((f) => f.question).join("  ·  ")}`,
        action: answer?.action,
      },
    ]);
  }

  return (
    <div className="flex min-h-screen flex-col">
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
            <OrbStage phase="idle" size={200} showLabel={false} />
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
                {turn.text}
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
    </div>
  );
}
