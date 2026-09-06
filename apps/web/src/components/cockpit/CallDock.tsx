"use client";

import { useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Composer } from "@/components/chat/Composer";
import { Waveform } from "./Waveform";

const PHASE_TEXT: Record<string, string> = {
  idle: "Connecting",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function CallDock({
  started,
  phase,
  sttMode,
  onStart,
  onEnd,
  onSendTyped,
}: {
  started: boolean;
  phase: string;
  sttMode: "ws" | "rest" | null;
  onStart: () => void;
  onEnd: () => void;
  onSendTyped: (text: string) => void;
}) {
  const [muted, setMuted] = useState(false);

  return (
    <div className="shrink-0 border-t border-hairline bg-ground px-5 py-3">
      <div className="mx-auto max-w-[760px]">
        {!started ? (
          <Button size="lg" onClick={onStart} className="w-full">
            <Mic className="h-4 w-4" aria-hidden />
            Start call
          </Button>
        ) : sttMode === "rest" ? (
          <Composer onSubmit={onSendTyped} placeholder="Microphone unavailable. Type what you would say." />
        ) : (
          <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-hairline bg-surface-1 px-4 py-3">
            <Waveform active={started} />
            <span className="text-[length:var(--text-sm)] text-ink-faint">{PHASE_TEXT[phase] ?? "Connecting"}</span>
            <div className="ml-auto flex items-center gap-2">
              <IconButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </IconButton>
              <Button variant="danger" size="sm" onClick={onEnd}>
                <PhoneOff className="h-3.5 w-3.5" aria-hidden />
                End
              </Button>
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-[length:var(--text-2xs)] text-ink-ghost">Press Esc for cover mode</p>
      </div>
    </div>
  );
}
