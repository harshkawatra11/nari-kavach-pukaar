"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { GeoPoint } from "@pukaar/core";
import { mapsLink } from "@pukaar/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function agoLabel(at: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function LiveMap({ trail, alarm, userName }: { trail: GeoPoint[]; alarm: { raised: boolean; at: number | null }; userName: string }) {
  const [, forceTick] = useState(0);
  const point = trail.at(-1) ?? null;

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-video bg-surface-strong border border-border rounded-2xl overflow-hidden" style={{ borderRadius: "1.25rem" }}>
        {point ? (
          <>
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, var(--aurora-lilac), var(--ground) 70%)" }} />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="block w-4 h-4 rounded-full bg-magenta" style={{ borderRadius: "50%" }} />
              <span className="absolute inset-0 w-4 h-4 rounded-full bg-magenta animate-ping" style={{ borderRadius: "50%" }} />
            </motion.div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-body text-ink-faint">
            Waiting for a location update...
          </div>
        )}
      </div>

      {point && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-ink-soft">Last known position, updated {agoLabel(point.at)}</p>
            <p className="font-mono text-xs text-ink-faint mt-1">
              {point.lat.toFixed(5)}, {point.lng.toFixed(5)} &middot; &plusmn;{Math.round(point.accuracyM)}m
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(mapsLink(point), "_blank", "noopener,noreferrer")}>
            Open in Maps
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {alarm.raised ? (
          <Badge variant="magenta">
            {userName} said her safe word{alarm.at ? ` at ${new Date(alarm.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </Badge>
        ) : (
          <Badge variant="idle">No alert has been raised in this session</Badge>
        )}
      </div>
    </div>
  );
}
