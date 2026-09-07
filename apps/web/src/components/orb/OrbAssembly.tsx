"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { OrbScene } from "./OrbScene";

const TRACES = [
  { x: "9vw", y: "18vh", dx: -16, dy: -8, color: "#ff9add", size: 3 },
  { x: "22vw", y: "76vh", dx: -9, dy: 13, color: "#ffffff", size: 2 },
  { x: "38vw", y: "10vh", dx: -5, dy: -14, color: "#8eeaff", size: 2 },
  { x: "76vw", y: "14vh", dx: 12, dy: -12, color: "#ffffff", size: 3 },
  { x: "91vw", y: "48vh", dx: 18, dy: 2, color: "#ff9add", size: 2 },
  { x: "81vw", y: "84vh", dx: 14, dy: 14, color: "#8eeaff", size: 3 },
  { x: "53vw", y: "91vh", dx: 2, dy: 18, color: "#ffffff", size: 2 },
  { x: "5vw", y: "58vh", dx: -18, dy: 5, color: "#8eeaff", size: 2 },
] as const;

/** A restrained first-load reveal. The same OrbScene used by the resting
 * home screen appears at the same visual position, so the final frame does
 * not swap from one 3D construction to another. Eight fine light traces
 * establish assembly without turning the launch into a particle demo. */
export function OrbAssembly({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1900);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onComplete, onSkip]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-ground"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Pukaar is readying the call"
    >
      {TRACES.map((trace, index) => (
        <motion.span
          key={`${trace.x}-${trace.y}`}
          aria-hidden
          className="absolute rounded-full"
          style={{ left: trace.x, top: trace.y, width: trace.size, height: trace.size, background: trace.color, boxShadow: `0 0 14px ${trace.color}` }}
          initial={{ opacity: 0, scale: 0.4, x: trace.dx, y: trace.dy }}
          animate={{ left: "50vw", top: "32vh", opacity: [0, 0.62, 0], scale: [0.4, 1, 0.2], x: 0, y: 0 }}
          transition={{ duration: 1.2, delay: 0.08 + index * 0.035, ease: [0.32, 0, 0.2, 1] }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-[32%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.72, filter: "blur(14px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.28, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(255,111,207,0.12),transparent_68%)] blur-2xl"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0.65, 0.22], scale: [0.7, 1.08, 1] }}
          transition={{ duration: 1.55, delay: 0.22, ease: "easeOut" }}
        />
        <OrbScene reducedMotion={false} orbScale={0.8125} />
      </motion.div>

      <motion.p
        className="absolute left-1/2 top-[53%] -translate-x-1/2 text-[length:var(--text-2xs)] font-medium tracking-[0.18em] text-ink-faint"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: [0, 0.55, 0], y: 0 }}
        transition={{ duration: 1.35, delay: 0.45, ease: "easeOut" }}
      >
        LINE READY
      </motion.p>
    </motion.div>
  );
}
