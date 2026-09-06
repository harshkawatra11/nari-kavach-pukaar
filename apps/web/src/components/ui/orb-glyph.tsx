"use client";

import { useEffect, useRef } from "react";
import { analyserRms, orbAudio } from "@/lib/audio/levels";
import { cn } from "@/lib/utils";

/** A 20px inline-SVG glyph, one per phase, all strokes currentColor so the
 *  pill controls the colour. This is what the reference status pill actually
 *  needed: a small live indicator, not a screenshot of the 3D orb shrunk
 *  down. "listening" scales with real mic amplitude via a rAF loop that
 *  writes transform directly (never React state, same rule as the 3D orb and
 *  the call dock's waveform), so it is not a canned animation. */
export function OrbGlyph({ phase, className }: { phase: string; className?: string }) {
  const dotsRef = useRef<SVGGElement>(null);
  const smoothed = useRef(0);

  useEffect(() => {
    if (phase !== "listening") return;
    let raf: number;
    const tick = () => {
      const analyser = orbAudio.micAnalyser;
      const target = analyser ? analyserRms(analyser) : 0;
      smoothed.current += (target - smoothed.current) * (target > smoothed.current ? 0.4 : 0.12);
      if (dotsRef.current) {
        const s = 1 + smoothed.current * 0.9;
        dotsRef.current.style.transform = `scale(${s})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (phase === "listening") {
    const dots = Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2;
      return { cx: 10 + Math.cos(angle) * 7, cy: 10 + Math.sin(angle) * 7 };
    });
    return (
      <svg viewBox="0 0 20 20" className={cn("origin-center", className)} aria-hidden>
        <g ref={dotsRef} style={{ transformOrigin: "10px 10px" }}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="currentColor" />
          ))}
        </g>
      </svg>
    );
  }

  if (phase === "thinking") {
    return (
      <svg viewBox="0 0 20 20" className={cn("animate-[orb-spin_2.4s_linear_infinite]", className)} aria-hidden>
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" />
      </svg>
    );
  }

  if (phase === "speaking") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden>
        <circle cx="10" cy="10" r="3" fill="currentColor" className="animate-[orb-pulse_1.2s_ease-in-out_infinite]" />
        <circle
          cx="10"
          cy="10"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className="animate-[orb-pulse_1.2s_ease-in-out_infinite_0.15s]"
        />
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="animate-[orb-pulse_1.2s_ease-in-out_infinite_0.3s]"
        />
      </svg>
    );
  }

  // idle
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}
