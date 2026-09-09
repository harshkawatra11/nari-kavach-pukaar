import { describe, expect, it } from "vitest";
import { buildAlertMessage } from "./message";

describe("buildAlertMessage", () => {
  it("includes the maps link when a point is available", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: { lat: 28.68, lng: 77.21, accuracyM: 10, at: Date.now() },
      trackUrl: "https://pukaar-web-wine.vercel.app/t/abc123",
    });
    expect(msg).toContain("Dayita said her safe word at 21:04");
    expect(msg).toContain("Current location:");
    expect(msg).toContain("query=28.68%2C77.21");
    expect(msg).toContain("https://pukaar-web-wine.vercel.app/t/abc123");
    expect(msg).not.toMatch(/localhost|127\.0\.0\.1|192\.168\./);
    expect(msg).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("omits the maps line when no point is available yet", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: null,
      trackUrl: "https://pukaar-web-wine.vercel.app/t/abc123",
    });
    expect(msg).not.toContain("google.com/maps");
    expect(msg).toContain("Live tracking:");
  });

  it("labels a delivery rehearsal before any emergency wording", () => {
    const msg = buildAlertMessage({
      userName: "Harsh",
      timeHHMM: "21:04",
      point: null,
      trackUrl: "https://pukaar-web-wine.vercel.app/t/abc123",
      testMode: true,
    });
    expect(msg.startsWith("PUKAAR TEST: No emergency.")).toBe(true);
  });

  it("labels coordinates older than one minute as last known", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: { lat: 28.68, lng: 77.21, accuracyM: 10, at: Date.now() - 61000 },
      trackUrl: "https://pukaar-web-wine.vercel.app/t/abc123",
    });
    expect(msg).toContain("Last known location:");
  });

  it("labels Telegram coordinates as a selected snapshot", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: { lat: 28.7138, lng: 77.20711, accuracyM: null, at: Date.now(), source: "telegram-desktop" },
      trackUrl: "https://pukaar-web-wine.vercel.app/t/abc123",
    });
    expect(msg).toContain("Selected location:");
    expect(msg).not.toContain("Current location:");
  });
});
