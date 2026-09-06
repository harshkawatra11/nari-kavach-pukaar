"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Three soft radial fields in the aurora hues, drifting slowly on independent
 *  loops. CSS-driven, not canvas: cheap, and it never competes with the R3F
 *  frame budget the orb needs. Respects reduced-motion by freezing drift. */
export function AuroraField({ intensity = 1, className }: { intensity?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) ref.current?.classList.add("aurora-static");
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ opacity: intensity }}
    >
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-grain" />
      <style jsx>{`
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(64px);
          will-change: transform;
        }
        .aurora-blob-1 {
          width: 60vw;
          height: 60vw;
          left: -10vw;
          top: -18vw;
          background: radial-gradient(circle at 40% 40%, var(--aurora-rose), transparent 70%);
          animation: drift1 26s ease-in-out infinite;
        }
        .aurora-blob-2 {
          width: 50vw;
          height: 50vw;
          right: -14vw;
          top: 4vw;
          background: radial-gradient(circle at 60% 40%, var(--aurora-gold), transparent 70%);
          animation: drift2 32s ease-in-out infinite;
        }
        .aurora-blob-3 {
          width: 55vw;
          height: 55vw;
          left: 20vw;
          bottom: -22vw;
          background: radial-gradient(circle at 50% 50%, var(--aurora-lilac), transparent 70%);
          animation: drift3 38s ease-in-out infinite;
        }
        .aurora-grain {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4vw, 5vw) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5vw, 3vw) scale(1.05); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3vw, -4vw) scale(1.1); }
        }
        :global(.aurora-static) .aurora-blob {
          animation: none !important;
        }
      `}</style>
    </div>
  );
}
