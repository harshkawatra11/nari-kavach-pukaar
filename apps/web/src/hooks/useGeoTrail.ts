"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@pukaar/core";

/** watchPosition + POST to /api/session/:id/location. geolocation needs a
 *  secure context: http://localhost qualifies, a LAN IP does not, and both
 *  fail silently rather than throwing, so this is demoed on localhost. */
export function useGeoTrail(sessionId: string, enabled: boolean) {
  const [lastPoint, setLastPoint] = useState<GeoPoint | null>(null);
  const [available, setAvailable] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      // Feature detection, not derivable state: "available" defaults true
      // and this effect is the only place that can learn otherwise, since
      // `navigator.geolocation` does not exist during SSR either.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailable(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          at: Date.now(),
        };
        setLastPoint(point);
        void fetch(`/api/session/${sessionId}/location`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(point),
        });
      },
      () => setAvailable(false),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [sessionId, enabled]);

  return { lastPoint, available };
}
