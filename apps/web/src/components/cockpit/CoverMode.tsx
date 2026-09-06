"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, PhoneOff } from "lucide-react";

/** The product's thesis, applied to its own interface: a plain, boring,
 *  believable call screen that replaces the whole console. The session keeps
 *  running underneath, unchanged, including both trigger paths. If the alarm
 *  fires while this is up, nothing here reacts, which is the entire point
 *  and the strongest beat available in a live demo. */
export function CoverMode({ visible, onExit }: { visible: boolean; onExit: () => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!visible) return;
    // Resets the on-screen timer the moment cover mode opens. AnimatePresence
    // keeps this component mounted through its exit animation too, so
    // without this the timer would show whatever count it last reached
    // rather than starting fresh on the next open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, onExit]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="cover-mode fixed inset-0 z-[var(--z-cover)] flex flex-col items-center justify-between py-16"
          onClick={onExit}
          role="button"
          tabIndex={0}
          aria-label="Tap anywhere or press Escape to return to the console"
        >
          <div className="mt-12 text-center">
            <p className="text-[length:var(--text-xl)]" style={{ color: "var(--cover-ink)" }}>
              Maa
            </p>
            <p className="mt-3 font-mono text-[length:var(--text-base)]" style={{ color: "var(--cover-ink-soft)" }}>
              {mm}:{ss}
            </p>
          </div>
          <div className="flex gap-10">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)]"
              style={{ background: "oklch(0.16 0.004 300)" }}
            >
              <Mic className="h-6 w-6" style={{ color: "var(--cover-ink)" }} aria-hidden />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)]" style={{ background: "var(--alarm)" }}>
              <PhoneOff className="h-6 w-6" style={{ color: "var(--cover-ink)" }} aria-hidden />
            </div>
          </div>
          <p className="font-mono text-[length:var(--text-xs)]" style={{ color: "var(--cover-ink-soft)" }}>
            On call
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
