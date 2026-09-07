import { describe, expect, it } from "vitest";
import { haversineM, mapsLink, shouldPersistPing } from "./geo";
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
