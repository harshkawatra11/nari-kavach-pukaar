"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { StatusPill } from "@/components/ui/status-pill";

const OrbScene = dynamic(() => import("./OrbScene").then((m) => m.OrbScene), { ssr: false });

/** The stage the orb sits on: sized, optionally labelled with a StatusPill,
 *  and the single entry point screens use. Handles the reduced-motion branch
 *  by passing it down rather than skipping the canvas entirely, so the same
 *  composition (stage, glow, ring) survives either way. `showLabel=false` is
 *  for compact placements (the call header) where the status is shown
 *  elsewhere instead. */
export function OrbStage({ phase, size = 320, showLabel = true }: { phase: string; size?: number; showLabel?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Not a lazy useState initializer: that runs during the server render
    // too, where `navigator` does not exist, and React does not re-run it on
    // client hydration, so the low-power branch would permanently read false
    // regardless of the real device. This has to run client-side, after mount.
    if (navigator.hardwareConcurrency < 4) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLowPower(true);
    }
  }, []);

  const useStatic = reducedMotion || lowPower;
  // Mouse-parallax: the glass catches light as the cursor moves. Driven as a
  // real rotation of the orb's own three.js group (see Orb.tsx), not a CSS
  // transform on the canvas element - tilting the DOM node would skew the
  // flat rendered image like a photograph rather than showing a different
  // angle of refraction, and was tried first and looked wrong. Held in a
  // ref, not state: read once per r3f frame, no React re-render per pixel
  // of mouse movement.
  const pointer = useRef({ x: 0, y: 0 });

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (useStatic) return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    };
  }
  function onPointerLeave() {
    pointer.current = { x: 0, y: 0 };
  }

  const pulsing = phase === "listening" || phase === "speaking";

  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={false}
      animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.97, y: ready ? 0 : 6 }}
      transition={{ duration: useStatic ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        style={{ width: size, height: size }}
        className="relative"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {/* A deliberately faint glow, standing in for bloom (see OrbScene.tsx
            for why postprocessing bloom is not used here). "The glass should
            be sharp, only the light around it should bloom" - this stays
            subtle so it reads as ambient light spill, not a second orb. */}
        <div
          aria-hidden
          className="absolute rounded-full blur-3xl transition-colors duration-700"
          style={{
            inset: "-12%",
            background:
              phase === "speaking"
                ? "radial-gradient(circle, #65eaff2a, transparent 70%)"
                : phase === "thinking"
                  ? "radial-gradient(circle, #b98cff26, transparent 70%)"
                  : "radial-gradient(circle, #ff6fcf26, transparent 70%)",
          }}
        />
        <Suspense fallback={<div className="absolute inset-0 rounded-full bg-surface-2 opacity-60 blur-2xl" />}>
          <OrbScene reducedMotion={useStatic} pointer={pointer} onReady={() => setReady(true)} />
        </Suspense>
        {/* Pulsing halo: a clean, regular pulse a viewer can register at a
            glance, distinct from the shader's own continuous, jittery
            amplitude reactivity. Colour and cadence tell listening and
            speaking apart even with sound off, same principle as StatusPill. */}
        {!useStatic && pulsing && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-2"
            style={{ inset: "-6%", borderColor: phase === "speaking" ? "#65eaff" : "#ff6fcf" }}
            animate={{ opacity: [0.15, 0.55, 0.15], scale: [1, 1.035, 1] }}
            transition={{ duration: phase === "speaking" ? 0.9 : 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {useStatic && <StaticAmplitudeRing phase={phase} />}
      </div>
      {showLabel && <StatusPill phase={phase} />}
    </motion.div>
  );
}

/** Reduced-motion fallback for amplitude: a single ring whose scale animates
 *  via CSS transition (not JS/rAF), so state is still legible without the
 *  shader loop running at all. */
function StaticAmplitudeRing({ phase }: { phase: string }) {
  const active = phase === "listening" || phase === "speaking";
  return (
    <div
      aria-hidden
      className="absolute inset-0 rounded-full border-2 border-ink-faint transition-transform duration-700"
      style={{
        transform: active ? "scale(1.08)" : "scale(1)",
        opacity: active ? 0.5 : 0.25,
      }}
    />
  );
}
