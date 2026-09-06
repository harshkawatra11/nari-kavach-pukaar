"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AlarmContactResult {
  name: string;
  phone: string;
  sent: boolean;
  error?: string;
}

/** Quiet delivery, not a solid alarm-coloured panel: a neutral surface with a
 *  2px accent bar, matching the monochrome system. The product's whole claim
 *  is that nothing visibly changes when the alarm fires; the notification
 *  that tells the room it happened should not shout either. */
export function AlarmToast({
  visible,
  path,
  contacts,
  trackUrl,
}: {
  visible: boolean;
  path: string | null;
  contacts: AlarmContactResult[];
  trackUrl: string | null;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          role="alert"
          aria-live="assertive"
          className="fixed left-1/2 top-4 z-[var(--z-toast)] w-full max-w-md -translate-x-1/2 px-4"
        >
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface-2 pl-5 pr-4 py-4 shadow-[var(--shadow-md)]">
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-alarm" />
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-4 w-4 shrink-0 translate-y-0.5 text-alarm" aria-hidden />
              <div className="flex-1">
                <p className="text-[length:var(--text-base)] font-medium text-ink">Alarm raised{path ? ` · ${path}` : ""}</p>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {contacts.map((c) => (
                    <li key={c.phone} className="text-[length:var(--text-sm)] text-ink-soft">
                      {c.name}: {c.sent ? "message sent" : `failed (${c.error ?? "unknown error"})`}
                    </li>
                  ))}
                  {contacts.length === 0 && <li className="text-[length:var(--text-sm)] text-ink-faint">Dispatching&hellip;</li>}
                </ul>
                {trackUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.open(trackUrl, "_blank", "noopener,noreferrer")}
                  >
                    Open contact view
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
