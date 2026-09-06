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
      <div className="relative aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface-1">
        {point ? (
          <>
            <div className="absolute inset-0 bg-surface-2" />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="block h-4 w-4 rounded-[var(--radius-full)] bg-alarm" />
              <span className="absolute inset-0 h-4 w-4 animate-ping rounded-[var(--radius-full)] bg-alarm" />
            </motion.div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[length:var(--text-base)] text-ink-faint">
            Waiting for a location update
          </div>
        )}
      </div>

      {point && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[length:var(--text-base)] text-ink-soft">Last known position, updated {agoLabel(point.at)}</p>
            <p className="mt-1 font-mono text-[length:var(--text-xs)] text-ink-faint">
              {point.lat.toFixed(5)}, {point.lng.toFixed(5)} &middot; &plusmn;{Math.round(point.accuracyM)}m
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => window.open(mapsLink(point), "_blank", "noopener,noreferrer")}>
            Open in Maps
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {alarm.raised ? (
          <Badge variant="alarm">
            {userName} said her safe word
            {alarm.at ? ` at ${new Date(alarm.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </Badge>
        ) : (
          <Badge variant="idle">No alert has been raised in this session</Badge>
        )}
      </div>
    </div>
  );
}
