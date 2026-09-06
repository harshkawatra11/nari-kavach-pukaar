"use client";

/** A bespoke inline SVG sparkline for turn latency. Chart.js is the wrong
 *  tool at this size and cadence (a handful of points, updating live); this
 *  is cheaper and reads better inline in a thin telemetry column. */
export function Sparkline({ values, targetMs, width = 180, height = 48 }: { values: number[]; targetMs: number; width?: number; height?: number }) {
  const max = Math.max(targetMs * 1.6, ...values, 1);
  const points = values.map((v, i) => {
    const x = values.length <= 1 ? width : (i / (values.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  const targetY = height - (targetMs / max) * height;

  return (
    <svg width={width} height={height} role="img" aria-label={`Latency sparkline, last value ${values.at(-1) ?? 0} milliseconds, target ${targetMs} milliseconds`}>
      <line x1={0} x2={width} y1={targetY} y2={targetY} stroke="var(--ink-ghost)" strokeWidth={1} strokeDasharray="3 3" />
      {points.length > 1 && (
        <polyline points={points.join(" ")} fill="none" stroke="var(--ink-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.length > 0 && (
        <circle
          cx={points.at(-1)!.split(",")[0]}
          cy={points.at(-1)!.split(",")[1]}
          r={3}
          fill={values.at(-1)! > targetMs * 1.5 ? "var(--alarm)" : "var(--ink-soft)"}
        />
      )}
    </svg>
  );
}
