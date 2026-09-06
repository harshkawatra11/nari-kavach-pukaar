"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Info, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export function Composer({
  onSubmit,
  placeholder = "Ask what Pukaar does, or start a call",
  autoFocus,
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  function grow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }

  function send() {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
    requestAnimationFrame(grow);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      className={cn(
        "w-full rounded-[var(--radius-lg)] border border-hairline bg-surface-2",
        "transition-colors duration-[var(--dur-fast)]",
        "focus-within:border-[var(--focus)]",
      )}
    >
      <textarea
        ref={areaRef}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          setValue(e.target.value);
          grow();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Ask a question about Pukaar"
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[length:var(--text-base)] leading-[var(--leading-normal)] text-ink placeholder:text-ink-ghost focus:outline-none"
      />
      <div className="flex items-center gap-1 px-2 pb-2">
        <IconButton label="What Pukaar is" size="sm" onClick={() => onSubmit("What is Pukaar?")}>
          <Info className="h-4 w-4" />
        </IconButton>
        <span className="ml-1 text-[length:var(--text-2xs)] text-ink-ghost">Enter to send</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Start a call" size="sm" onClick={() => router.push("/setup")}>
            <Phone className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={send}
            disabled={!value.trim()}
            aria-label="Send"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent text-ink transition-opacity duration-[var(--dur-fast)] hover:bg-accent-hover disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
