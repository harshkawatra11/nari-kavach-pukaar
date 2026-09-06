"use client";

import { useEffect, useRef } from "react";
import { analyserRms, orbAudio } from "@/lib/audio/levels";

const BAR_COUNT = 7;
const BAR_OFFSETS = Array.from({ length: BAR_COUNT }, (_, i) => (i % 3) * 0.12);

/** Seven bars, live mic/TTS amplitude written straight to transform, never
 *  React state (same rule as the 3D orb and the OrbGlyph): this runs every
 *  animation frame during a call, and routing it through setState would
 *  re-render the whole call screen at 60fps. */
export function Waveform({ active }: { active: boolean }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!active) return;
    let raf: number;
    const smoothed = { current: 0 };
    const tick = () => {
      const analyser = orbAudio.phase === "speaking" ? orbAudio.ttsAnalyser : orbAudio.micAnalyser;
      const target = analyser ? analyserRms(analyser) : 0;
      smoothed.current += (target - smoothed.current) * (target > smoothed.current ? 0.4 : 0.12);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const wobble = 1 + Math.sin(performance.now() / 220 + BAR_OFFSETS[i] * 10) * 0.15;
        const scale = Math.max(0.15, Math.min(1, smoothed.current * 3.2 * wobble));
        bar.style.transform = `scaleY(${scale})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="h-full w-[3px] origin-center rounded-[var(--radius-full)] bg-ink-faint"
          style={{ transform: "scaleY(0.15)" }}
        />
      ))}
    </div>
  );
}
