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
          className="cover-mode fixed inset-0 flex flex-col items-center justify-between py-16"
          style={{ zIndex: 60 }}
          onClick={onExit}
          role="button"
          tabIndex={0}
          aria-label="Tap anywhere or press Escape to return to the console"
        >
          <div className="text-center mt-12">
            <p className="font-display text-2xl" style={{ color: "var(--cover-ink)" }}>Maa</p>
            <p className="font-mono text-base mt-3" style={{ color: "var(--cover-ink-soft)" }}>{mm}:{ss}</p>
          </div>
          <div className="flex gap-10">
            <div
              className="w-16 h-16 flex items-center justify-center rounded-full"
              style={{ borderRadius: "50%", background: "oklch(0.3 0.02 330)" }}
            >
              <Mic className="w-6 h-6" style={{ color: "var(--cover-ink)" }} aria-hidden />
            </div>
            <div
              className="w-16 h-16 flex items-center justify-center rounded-full"
              style={{ borderRadius: "50%", background: "var(--magenta)" }}
            >
              <PhoneOff className="w-6 h-6" style={{ color: "var(--cover-ink)" }} aria-hidden />
            </div>
          </div>
          <p className="font-mono text-xs" style={{ color: "var(--cover-ink-soft)" }}>On call</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
