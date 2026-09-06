"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AuroraField } from "@/components/field/AuroraField";
import { OrbStage } from "@/components/orb/OrbStage";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      <AuroraField intensity={0.9} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center text-center max-w-lg"
      >
        <OrbStage phase="idle" size={280} />

        <h1 className="font-display font-semibold text-4xl md:text-5xl mt-8 leading-tight">
          Pukaar
        </h1>
        <p className="font-body text-lg text-ink-soft mt-4 leading-relaxed">
          The call she is already pretending to be on, made real, with the alarm hidden inside
          the conversation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link href="/setup">
            <Button size="lg">Start a session</Button>
          </Link>
          <Link href="/system">
            <Button size="lg" variant="outline">
              How it works
            </Button>
          </Link>
        </div>
      </motion.div>

      <p className="absolute bottom-6 font-body text-xs text-ink-faint">
        Team IdeaForge &middot; Nari Kavach 2026
      </p>
    </main>
  );
}
