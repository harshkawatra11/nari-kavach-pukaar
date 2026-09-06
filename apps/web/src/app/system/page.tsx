"use client";

import Link from "next/link";
import { Bar } from "react-chartjs-2";
import { costOfCommute, SARVAM_RATES } from "@pukaar/core";
import { AuroraField } from "@/components/field/AuroraField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import "@/lib/chartTheme";
import { CHART_COLORS, baseChartOptions } from "@/lib/chartTheme";

const commute = costOfCommute({ minutes: 20, ttsChars: 4000, inTokens: 12000, outTokens: 3000 });

const latencyBudget = [
  { label: "Mic capture and VAD", ms: 120 },
  { label: "STT partial", ms: 220 },
  { label: "Chat first token", ms: 380 },
  { label: "TTS first chunk", ms: 300 },
  { label: "Playback start", ms: 180 },
];

const latencyData = {
  labels: latencyBudget.map((l) => l.label),
  datasets: [
    {
      label: "Budget (ms)",
      data: latencyBudget.map((l) => l.ms),
      backgroundColor: CHART_COLORS.plum,
      borderColor: CHART_COLORS.ink,
      borderWidth: 1,
    },
  ],
};

const reachFunnel = [
  { label: "Women in Indian higher education", value: 22_400_000 },
  { label: "Women in Indian STEM higher education", value: 4_490_000 },
  { label: "University of Delhi, female enrolment", value: 34_014 },
];

const reachData = {
  labels: reachFunnel.map((r) => r.label),
  datasets: [
    {
      label: "Named count",
      data: reachFunnel.map((r) => r.value),
      backgroundColor: [CHART_COLORS.plumTint, CHART_COLORS.plum, CHART_COLORS.magenta],
      borderColor: CHART_COLORS.ink,
      borderWidth: 1,
    },
  ],
};

export default function SystemPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraField intensity={0.25} />
      <div className="relative max-w-3xl mx-auto px-6 py-16 flex flex-col gap-12">
        <div>
          <Link href="/" className="font-body text-sm text-ink-soft hover:underline">
            &larr; Back
          </Link>
          <h1 className="font-display font-semibold text-3xl mt-4">How Pukaar works</h1>
          <p className="font-body text-ink-soft mt-3 leading-relaxed">
            India has spent a decade building the alarm layer. The national average 112 response
            is 18.61 minutes. Every deployed tool activates after the threat is already real.
            Pukaar covers the window before that, the one 72.3% of women already improvise for by
            hand with a fake phone call.
          </p>
        </div>

        <section>
          <h2 className="font-display font-semibold text-xl mb-1">Two independent trigger paths</h2>
          <p className="font-body text-sm text-ink-soft mb-4">
            One relies on the network, one does not. The alarm still fires if either one does.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-surface-strong border border-border rounded-xl" style={{ borderRadius: "1rem" }}>
              <Badge>Path 1</Badge>
              <p className="font-body text-sm">The model calls a <code className="font-mono text-xs">raise_alarm</code> tool silently mid-conversation the instant she says her duress phrase, or a close paraphrase of it.</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-surface-strong border border-border rounded-xl" style={{ borderRadius: "1rem" }}>
              <Badge variant="magenta">Path 2</Badge>
              <p className="font-body text-sm">The browser runs its own local phrase match against the Web Speech transcript and posts directly, independent of the relay.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl mb-1">Latency budget</h2>
          <p className="font-body text-sm text-ink-soft mb-4">
            Target: 1,200ms from her final word to Pukaar&apos;s first spoken word back.
          </p>
          <div style={{ height: 220 }}>
            <Bar data={latencyData} options={{ ...baseChartOptions, indexAxis: "y" as const, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl mb-1">Cost, computed live</h2>
          <p className="font-body text-sm text-ink-soft mb-4">
            A 20-minute protected commute at real Sarvam AI pricing (verified against docs.sarvam.ai).
          </p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-surface-strong border border-border rounded-xl text-center" style={{ borderRadius: "1rem" }}>
              <p className="font-mono text-2xl">&#8377;{commute.sttRupees}</p>
              <p className="font-body text-xs text-ink-faint mt-1">speech to text</p>
            </div>
            <div className="p-4 bg-surface-strong border border-border rounded-xl text-center" style={{ borderRadius: "1rem" }}>
              <p className="font-mono text-2xl">&#8377;{commute.ttsRupees}</p>
              <p className="font-body text-xs text-ink-faint mt-1">text to speech</p>
            </div>
            <div className="p-4 bg-surface-strong border border-border rounded-xl text-center" style={{ borderRadius: "1rem" }}>
              <p className="font-mono text-2xl">&#8377;{commute.chatRupees}</p>
              <p className="font-body text-xs text-ink-faint mt-1">reasoning</p>
            </div>
          </div>
          <p className="font-body text-sm text-center">
            Total: <span className="font-mono font-semibold">&#8377;{commute.totalRupees}</span> per protected commute
          </p>
          <p className="font-body text-xs text-ink-faint text-center mt-2">
            Rs {SARVAM_RATES.sttPerHour}/hr STT &middot; Rs {SARVAM_RATES.ttsPer10kChars}/10k chars TTS &middot; Rs {SARVAM_RATES.chatOutputPerMTokens}/1M output tokens
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl mb-1">Reach, built bottom up</h2>
          <p className="font-body text-sm text-ink-soft mb-4">
            Named counts, not a percentage slice of a market size.
          </p>
          <div style={{ height: 200 }}>
            <Bar data={reachData} options={{ ...baseChartOptions, indexAxis: "y" as const, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
          </div>
          <p className="font-body text-xs text-ink-faint mt-2">Source: AISHE 2023-24, PIB, DU admissions reporting 2025</p>
        </section>

        <Link href="/setup">
          <Button size="lg" className="w-full">
            Start a session
          </Button>
        </Link>
      </div>
    </main>
  );
}
