import { describe, expect, it } from "vitest";
import { buildAlertMessage } from "./message";

describe("buildAlertMessage", () => {
  it("includes the maps link when a point is available", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: { lat: 28.68, lng: 77.21, accuracyM: 10, at: 0 },
      trackUrl: "http://localhost:3000/t/abc123",
    });
    expect(msg).toContain("Dayita said her safe word at 21:04");
    expect(msg).toContain("maps.google.com/?q=28.68,77.21");
    expect(msg).toContain("http://localhost:3000/t/abc123");
    expect(msg).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("omits the maps line when no point is available yet", () => {
    const msg = buildAlertMessage({
      userName: "Dayita",
      timeHHMM: "21:04",
      point: null,
      trackUrl: "http://localhost:3000/t/abc123",
    });
    expect(msg).not.toContain("maps.google.com");
    expect(msg).toContain("Follow her here");
  });
});
