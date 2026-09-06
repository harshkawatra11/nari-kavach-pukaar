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
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="alert"
          aria-live="assertive"
          className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4"
          style={{ zIndex: 90 }}
        >
          <div className="bg-magenta text-ground rounded-2xl px-5 py-4 shadow-lg" style={{ borderRadius: "1.25rem" }}>
            <div className="flex items-start gap-3">
              <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1">
                <p className="font-display font-semibold text-base">Alarm raised{path ? ` · ${path}` : ""}</p>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {contacts.map((c) => (
                    <li key={c.phone} className="font-body text-sm opacity-95">
                      {c.name}: {c.sent ? "message sent" : `failed (${c.error ?? "unknown error"})`}
                    </li>
                  ))}
                  {contacts.length === 0 && <li className="font-body text-sm opacity-80">Dispatching...</li>}
                </ul>
                {trackUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-ground text-ink border-0"
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
