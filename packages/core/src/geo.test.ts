import { describe, expect, it } from "vitest";
import { haversineM, locationFreshness, mapsLink, parseTelegramMapsLink, shouldPersistPing } from "./geo";
import type { GeoPoint } from "./types";

const DU = { lat: 28.6879, lng: 77.2107, accuracyM: 10, at: 0 };

describe("haversineM", () => {
  it("is zero for the same point", () => {
    expect(haversineM(DU, DU)).toBeCloseTo(0, 3);
  });

  it("is roughly correct for a known short distance", () => {
    const near: GeoPoint = { ...DU, lat: DU.lat + 0.001, at: 0 };
    // ~111m per 0.001 degree latitude
    expect(haversineM(DU, near)).toBeGreaterThan(100);
    expect(haversineM(DU, near)).toBeLessThan(120);
  });
});

describe("shouldPersistPing", () => {
  it("always writes the first point", () => {
    expect(shouldPersistPing(null, DU)).toBe(true);
  });

  it("skips a point that barely moved within the interval", () => {
    const last: GeoPoint = { ...DU, at: 1000 };
    const next: GeoPoint = { ...DU, at: 1500 };
    expect(shouldPersistPing(last, next)).toBe(false);
  });

  it("writes once the interval elapses even with no movement", () => {
    const last: GeoPoint = { ...DU, at: 0 };
    const next: GeoPoint = { ...DU, at: 6000 };
    expect(shouldPersistPing(last, next)).toBe(true);
  });

  it("writes early if the point moved far enough", () => {
    const last: GeoPoint = { ...DU, at: 0 };
    const next: GeoPoint = { ...DU, lat: DU.lat + 0.001, at: 500 };
    expect(shouldPersistPing(last, next)).toBe(true);
  });
});

describe("mapsLink", () => {
  it("builds a google maps query link", () => {
    expect(mapsLink(DU)).toBe("https://www.google.com/maps/search/?api=1&query=28.6879%2C77.2107");
  });
});

describe("parseTelegramMapsLink", () => {
  it("parses Telegram's maps.google.com location link", () => {
    expect(parseTelegramMapsLink("https://maps.google.com/maps?q=28.713800,77.207110&ll=28.713800,77.207110&z=16")).toEqual({
      lat: 28.7138,
      lng: 77.20711,
      canonicalUrl: "https://www.google.com/maps/search/?api=1&query=28.7138%2C77.20711",
    });
  });

  it("parses a canonical Google Maps search link", () => {
    expect(parseTelegramMapsLink("https://www.google.com/maps/search/?api=1&query=28.713800%2C77.207110")).toMatchObject({ lat: 28.7138, lng: 77.20711 });
  });

  it.each([
    "http://maps.google.com/maps?q=28.7,77.2",
    "https://evil.example/maps?q=28.7,77.2",
    "https://maps.app.goo.gl/example",
    "https://maps.google.com/maps?q=Delhi",
    "not a link",
  ])("rejects unsafe or non-coordinate input: %s", (input) => {
    expect(parseTelegramMapsLink(input)).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseTelegramMapsLink("https://maps.google.com/maps?q=91,77")).toBeNull();
  });

  it("rejects conflicting q and ll coordinates", () => {
    expect(parseTelegramMapsLink("https://maps.google.com/maps?q=28.7,77.2&ll=29.7,78.2")).toBeNull();
  });
});

describe("locationFreshness", () => {
  it("reports Telegram locations as snapshots", () => {
    const point = { ...DU, accuracyM: null, source: "telegram-desktop" as const };
    expect(locationFreshness(point, 1000)).toEqual({ capturedAt: 0, ageMs: 1000, status: "snapshot" });
  });

  it("keeps legacy locations on browser freshness rules", () => {
    expect(locationFreshness(DU, 1000).status).toBe("live");
  });
});
