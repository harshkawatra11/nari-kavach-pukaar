"use client";

import Link from "next/link";
import { Bar } from "react-chartjs-2";
import { costOfCommute, SARVAM_RATES } from "@pukaar/core";
import { AppBar } from "@/components/shell/AppBar";
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
      backgroundColor: CHART_COLORS.bar,
      borderRadius: 3,
      maxBarThickness: 22,
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
      backgroundColor: [CHART_COLORS.barMuted, CHART_COLORS.bar, CHART_COLORS.alarm],
      borderRadius: 3,
      maxBarThickness: 22,
    },
  ],
};

const TOC = [
  { href: "#gap", label: "The gap" },
  { href: "#paths", label: "Two trigger paths" },
  { href: "#latency", label: "Latency" },
  { href: "#cost", label: "Cost" },
  { href: "#reach", label: "Reach" },
  { href: "#privacy", label: "Privacy" },
];

export default function SystemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppBar back={{ href: "/", label: "Back" }} title="How it works" />
      <div className="mx-auto grid w-full max-w-[1040px] grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[200px_1fr]">
        <nav className="hidden self-start lg:sticky lg:top-[76px] lg:block">
          <ul className="flex flex-col gap-2">
            {TOC.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="block py-0.5 text-[length:var(--text-sm)] text-ink-faint transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="flex max-w-[680px] flex-col gap-10">
          <div id="gap">
            <h1>How Pukaar works</h1>
            <p className="mt-3 text-[length:var(--text-lg)] leading-relaxed text-ink-soft">
              India has spent a decade building the alarm layer. The national average 112 response is
              18.61 minutes. Every deployed tool activates after the threat is already real. Pukaar
              covers the window before that, the one 72.3% of women already improvise for by hand with
              a fake phone call.
            </p>
          </div>

          <hr className="border-hairline" />

          <section id="paths">
            <h2>Two independent trigger paths</h2>
            <p className="mt-1 text-[length:var(--text-base)] text-ink-soft">
              One relies on the network, one does not. The alarm still fires if either one does.
            </p>
            <dl className="mt-4 divide-y divide-[var(--hairline)] rounded-[var(--radius-lg)] border border-hairline">
              <div className="p-4">
                <dt className="text-[length:var(--text-sm)] font-medium text-ink">Path 1 &middot; model tool call</dt>
                <dd className="mt-1 text-[length:var(--text-base)] text-ink-soft">
                  The model calls a <code className="font-mono text-[length:var(--text-sm)]">raise_alarm</code> tool
                  silently mid-conversation the instant she says her duress phrase, or a close paraphrase of it.
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-[length:var(--text-sm)] font-medium text-ink">Path 2 &middot; local phrase match</dt>
                <dd className="mt-1 text-[length:var(--text-base)] text-ink-soft">
                  The browser runs its own local phrase match against the Web Speech transcript and posts
                  directly, independent of the relay.
                </dd>
              </div>
            </dl>
          </section>

          <hr className="border-hairline" />

          <section id="latency">
            <h2>Latency budget</h2>
            <p className="mt-1 text-[length:var(--text-base)] text-ink-soft">
              Target: 1,200ms from her final word to Pukaar&apos;s first spoken word back.
            </p>
            <figure className="mt-4 rounded-[var(--radius-lg)] border border-hairline p-4">
              <div style={{ height: 220 }}>
                <Bar
                  data={latencyData}
                  options={{ ...baseChartOptions, indexAxis: "y" as const, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }}
                />
              </div>
            </figure>
          </section>

          <hr className="border-hairline" />

          <section id="cost">
            <h2>Cost, computed live</h2>
            <p className="mt-1 text-[length:var(--text-base)] text-ink-soft">
              A 20-minute protected commute at real Sarvam AI pricing (verified against docs.sarvam.ai).
            </p>
            <dl className="mt-4 rounded-[var(--radius-lg)] border border-hairline">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <dt className="text-[length:var(--text-base)] text-ink-faint">Speech to text</dt>
                <dd className="font-mono text-[length:var(--text-base)] text-ink">&#8377;{commute.sttRupees}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <dt className="text-[length:var(--text-base)] text-ink-faint">Text to speech</dt>
                <dd className="font-mono text-[length:var(--text-base)] text-ink">&#8377;{commute.ttsRupees}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <dt className="text-[length:var(--text-base)] text-ink-faint">Reasoning</dt>
                <dd className="font-mono text-[length:var(--text-base)] text-ink">&#8377;{commute.chatRupees}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-[length:var(--text-base)] font-medium text-ink">Total per protected commute</dt>
                <dd className="font-mono text-[length:var(--text-base)] font-medium text-ink">&#8377;{commute.totalRupees}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[length:var(--text-xs)] text-ink-faint">
              Rs {SARVAM_RATES.sttPerHour}/hr STT &middot; Rs {SARVAM_RATES.ttsPer10kChars}/10k chars TTS &middot; Rs{" "}
              {SARVAM_RATES.chatOutputPerMTokens}/1M output tokens
            </p>
          </section>

          <hr className="border-hairline" />

          <section id="reach">
            <h2>Reach, built bottom up</h2>
            <p className="mt-1 text-[length:var(--text-base)] text-ink-soft">Named counts, not a percentage slice of a market size.</p>
            <figure className="mt-4 rounded-[var(--radius-lg)] border border-hairline p-4">
              <div style={{ height: 200 }}>
                <Bar
                  data={reachData}
                  options={{
                    ...baseChartOptions,
                    indexAxis: "y" as const,
                    plugins: { ...baseChartOptions.plugins, legend: { display: false } },
                    // Logarithmic, not linear: 34,014 next to 22.4M is
                    // unreadable on a linear scale (the smallest bar collapses
                    // to a sliver), and this figure exists specifically to
                    // show all three named counts, not just the largest one.
                    scales: { ...baseChartOptions.scales, x: { ...baseChartOptions.scales.x, type: "logarithmic" as const } },
                  }}
                />
              </div>
              <figcaption className="mt-3 text-[length:var(--text-xs)] text-ink-faint">
                Source: AISHE 2023-24, PIB, DU admissions reporting 2025
              </figcaption>
            </figure>
          </section>

          <hr className="border-hairline" />

          <section id="privacy">
            <h2>What gets stored</h2>
            <p className="mt-1 text-[length:var(--text-base)] text-ink-soft">
              No audio, ever. No transcripts. A session id, the contacts you chose, a location trail
              scoped to the session, and the alarm timestamp if it fired. A Firestore TTL deletes the
              trail six hours after the session starts.
            </p>
          </section>

          <Link href="/setup" className="text-[length:var(--text-base)] text-ink-faint transition-colors hover:text-ink">
            Start a session &rarr;
          </Link>
        </article>
      </div>
    </div>
  );
}
