"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
  // The R3F canvas is expensive per-pixel (real-time transmission); scale the
  // orb geometry itself down for compact placements rather than shrinking a
  // full-size canvas with CSS, which would still pay the full render cost.
  const orbScale = Math.min(1, size / 320);

  return (
    <div className="flex flex-col items-center gap-5">
      <div style={{ width: size, height: size }} className="relative">
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
          <OrbScene reducedMotion={useStatic} orbScale={orbScale} />
        </Suspense>
        {useStatic && <StaticAmplitudeRing phase={phase} />}
      </div>
      {showLabel && <StatusPill phase={phase} />}
    </div>
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
