"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@pukaar/core";

export type LocationSyncState = "unavailable" | "captured" | "uploading" | "synced" | "failed";

export function useGeoTrail(sessionId: string, controlToken: string, enabled: boolean, initialPoint: GeoPoint | null = null) {
  const [lastPoint, setLastPoint] = useState<GeoPoint | null>(initialPoint);
  const [available, setAvailable] = useState(true);
  const [syncState, setSyncState] = useState<LocationSyncState>(initialPoint ? "synced" : "captured");
  const watchIdRef = useRef<number | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    if (!initialPoint) return;
    // The setup position arrives from sessionStorage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastPoint(initialPoint);
    setSyncState("synced");
  }, [initialPoint]);

  useEffect(() => {
    if (!enabled) return;
    stopped.current = false;
    if (!("geolocation" in navigator)) {
      // Browser capability detection can only run after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailable(false);
      setSyncState("unavailable");
      return;
    }

    async function upload(point: GeoPoint) {
      setSyncState("uploading");
      for (const delay of [0, 500, 1500]) {
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        if (stopped.current) return;
        try {
          const res = await fetch(`/api/session/${sessionId}/location`, { method: "POST", headers: { "content-type": "application/json", "x-session-control": controlToken }, body: JSON.stringify(point) });
          const data = await res.json();
          if (res.ok && data.ok) {
            if (data.persistedPoint) setLastPoint(data.persistedPoint as GeoPoint);
            setSyncState("synced");
            return;
          }
          if (res.status === 404 || res.status === 410) break;
        } catch { /* bounded retry below */ }
      }
      if (!stopped.current) setSyncState("failed");
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy, at: pos.timestamp };
        setSyncState("captured");
        void upload(point);
      },
      () => { setAvailable(false); setSyncState("unavailable"); },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    watchIdRef.current = id;
    return () => {
      stopped.current = true;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [sessionId, controlToken, enabled]);

  return { lastPoint, available, syncState };
}
