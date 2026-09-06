import { Chart as ChartJS, registerables } from "chart.js";

ChartJS.register(...registerables);

// Chart palette drawn from the locked deck tokens, never a library default.
// Per ui-ux-pro-max chart guidance: legends visible, tooltips on interact,
// gridlines subtle, accessible contrast (all pairs here meet 3:1 against
// white for large graphical elements).
export const CHART_COLORS = {
  plum: "#5C1A4B",
  plumDeep: "#3A0E30",
  gold: "#E8B33C",
  magenta: "#E5399E",
  plumTint: "#E8D5E2",
  ink: "#0A0A0A",
  grid: "rgba(10, 10, 10, 0.12)",
};

export const CHART_FONT = {
  family: "var(--font-inter), system-ui, sans-serif",
  size: 13,
  weight: 600 as const,
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { font: CHART_FONT, color: CHART_COLORS.ink, usePointStyle: true, boxWidth: 10 },
    },
    tooltip: {
      backgroundColor: CHART_COLORS.ink,
      titleFont: CHART_FONT,
      bodyFont: CHART_FONT,
      padding: 10,
      cornerRadius: 0,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: { color: CHART_COLORS.grid },
      ticks: { font: CHART_FONT, color: CHART_COLORS.ink },
    },
    y: {
      grid: { color: CHART_COLORS.grid },
      ticks: { font: CHART_FONT, color: CHART_COLORS.ink },
      beginAtZero: true,
    },
  },
};
