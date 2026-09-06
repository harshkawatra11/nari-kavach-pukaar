import { Chart as ChartJS, registerables } from "chart.js";

ChartJS.register(...registerables);

// Chart palette drawn from the v4 monochrome tokens (packages/ui/src/tokens.css),
// never a library default. This file previously carried the v2 light-theme
// ink colour (#0A0A0A) for ticks, legend and tooltip text, which on the dark
// v3/v4 ground rendered every axis label near-invisible dark-grey-on-dark -
// a real bug, not a taste call, caught by screenshot review. Values below
// are the hex equivalents of the CSS custom properties, since Chart.js
// canvas rendering cannot resolve var(...) itself.
export const CHART_COLORS = {
  bar: "#8b6bb8", // --accent
  barMuted: "#3a3a42", // --surface-3
  alarm: "#e0568f", // --alarm
  ink: "#f2f2f4", // --ink
  inkFaint: "#8c8c96", // --ink-faint
  grid: "rgba(255, 255, 255, 0.06)", // --hairline
  tooltipBg: "#1f1f24", // --surface-3, opaque
};

export const CHART_FONT = {
  family: "var(--font-body), system-ui, sans-serif",
  size: 12,
  weight: 500 as const,
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { font: CHART_FONT, color: CHART_COLORS.inkFaint, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      backgroundColor: CHART_COLORS.tooltipBg,
      titleFont: CHART_FONT,
      titleColor: CHART_COLORS.ink,
      bodyFont: CHART_FONT,
      bodyColor: CHART_COLORS.ink,
      padding: 10,
      cornerRadius: 6,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: { color: CHART_COLORS.grid },
      ticks: { font: CHART_FONT, color: CHART_COLORS.inkFaint },
    },
    y: {
      grid: { color: CHART_COLORS.grid },
      ticks: { font: CHART_FONT, color: CHART_COLORS.inkFaint },
      beginAtZero: true,
    },
  },
};
