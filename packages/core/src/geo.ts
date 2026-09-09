import type { GeoPoint } from "./types";

const EARTH_RADIUS_M = 6371000;

export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const MIN_MOVE_M = 15;
const MIN_INTERVAL_MS = 5000;

/** Skip a Firestore write if the point moved under 15m AND under 5s since the
 *  last persisted point. Keeps writes well under the free tier during a live
 *  demo without making the trail look frozen for a genuinely stationary user
 *  (the very first point, and any point after MIN_INTERVAL_MS, always writes). */
export function shouldPersistPing(last: GeoPoint | null, next: GeoPoint): boolean {
  if (!last) return true;
  const elapsed = next.at - last.at;
  if (elapsed >= MIN_INTERVAL_MS) return true;
  return haversineM(last, next) >= MIN_MOVE_M;
}

export function mapsLink(point: GeoPoint): string {
  const query = encodeURIComponent(`${point.lat},${point.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export interface ParsedMapsLocation {
  lat: number;
  lng: number;
  canonicalUrl: string;
}

function parseCoordinatePair(value: string | null): { lat: number; lng: number } | null {
  if (!value) return null;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseTelegramMapsLink(input: string): ParsedMapsLocation | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !["maps.google.com", "www.google.com"].includes(url.hostname.toLowerCase())) return null;
  const pairs = [url.searchParams.get("q"), url.searchParams.get("query"), url.searchParams.get("ll")]
    .map(parseCoordinatePair)
    .filter((pair): pair is { lat: number; lng: number } => pair !== null);
  if (pairs.length === 0) return null;
  const first = pairs[0];
  if (pairs.some((pair) => Math.abs(pair.lat - first.lat) > 1e-6 || Math.abs(pair.lng - first.lng) > 1e-6)) return null;
  return { ...first, canonicalUrl: mapsLink({ ...first, accuracyM: null, at: 0, source: "telegram-desktop" }) };
}

export type LocationStatus = "live" | "snapshot" | "stale" | "unavailable";

export function locationFreshness(point: GeoPoint | null, now = Date.now()): { capturedAt: number | null; ageMs: number | null; status: LocationStatus } {
  if (!point) return { capturedAt: null, ageMs: null, status: "unavailable" };
  const ageMs = Math.max(0, now - point.at);
  if (point.source === "telegram-desktop") return { capturedAt: point.at, ageMs, status: "snapshot" };
  return { capturedAt: point.at, ageMs, status: ageMs <= 60000 ? "live" : "stale" };
}
