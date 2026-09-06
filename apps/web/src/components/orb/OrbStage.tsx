"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const OrbScene = dynamic(() => import("./OrbScene").then((m) => m.OrbScene), { ssr: false });

const PHASE_LABEL: Record<string, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

/** The stage the orb sits on: sized, labelled with the current phase, and
 *  the single entry point screens use. Handles the reduced-motion branch by
 *  passing it down rather than skipping the canvas entirely, so the same
 *  composition (stage, reflection plane, label) survives either way. */
export function OrbStage({ phase, size = 320 }: { phase: string; size?: number }) {
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

  return (
    <div className="flex flex-col items-center gap-6">
      <div style={{ width: size, height: size }} className="relative">
        {/* The bloom/glow read, done in CSS rather than fighting canvas alpha
            compositing through postprocessing (see OrbScene.tsx). Sits behind
            the canvas, larger than it, blurred. */}
        <div
          aria-hidden
          className="absolute rounded-full blur-3xl transition-colors duration-700"
          style={{
            inset: "-18%",
            borderRadius: "50%",
            background:
              phase === "speaking"
                ? "radial-gradient(circle, #E8B33C55, transparent 70%)"
                : phase === "thinking"
                  ? "radial-gradient(circle, #5C1A4B55, transparent 70%)"
                  : "radial-gradient(circle, #E5399E4d, transparent 70%)",
          }}
        />
        <Suspense fallback={<div className="absolute inset-0 rounded-full bg-[var(--aurora-lilac)] opacity-40 blur-2xl" style={{ borderRadius: "50%" }} />}>
          <OrbScene reducedMotion={useStatic} />
        </Suspense>
        {useStatic && <StaticAmplitudeRing phase={phase} />}
      </div>
      <p className="font-body text-sm text-ink-soft tracking-wide">{PHASE_LABEL[phase] ?? "Ready"}</p>
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
      className="absolute inset-0 rounded-full border-2 border-plum transition-transform duration-700"
      style={{
        transform: active ? "scale(1.08)" : "scale(1)",
        opacity: active ? 0.5 : 0.25,
        borderRadius: "50%",
      }}
    />
  );
}
