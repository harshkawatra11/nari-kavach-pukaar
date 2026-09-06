"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic } from "lucide-react";
import { AuroraField } from "@/components/field/AuroraField";
import { OrbStage } from "@/components/orb/OrbStage";
import { CockpitRail } from "@/components/cockpit/CockpitRail";
import { TranscriptDock } from "@/components/cockpit/TranscriptDock";
import { TelemetryColumn } from "@/components/cockpit/TelemetryColumn";
import { CoverMode } from "@/components/cockpit/CoverMode";
import { AlarmToast, type AlarmContactResult } from "@/components/cockpit/AlarmToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useLocalDuressSpotter } from "@/hooks/useLocalDuressSpotter";
import { useGeoTrail } from "@/hooks/useGeoTrail";

function CallScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId") ?? "";
  const trackToken = params.get("trackToken") ?? "";

  const [started, setStarted] = useState(false);
  const [coverMode, setCoverMode] = useState(false);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmPath, setAlarmPath] = useState<string | null>(null);
  const [alarmContacts, setAlarmContacts] = useState<AlarmContactResult[]>([]);
  const [typedInput, setTypedInput] = useState("");

  const userName = typeof window !== "undefined" ? sessionStorage.getItem("pukaar.userName") ?? "she" : "she";
  const duressPhrase = typeof window !== "undefined" ? sessionStorage.getItem("pukaar.duressPhrase") ?? "" : "";
  const language = (typeof window !== "undefined" ? sessionStorage.getItem("pukaar.language") : null) as
    | "hi-IN"
    | "en-IN"
    | "auto"
    | null;

  const { state, start, sendTyped } = useVoiceSession({
    sessionId,
    language: language ?? "auto",
    duressPhrase,
    userName,
    onAlarm: () => {
      setAlarmVisible(true);
      setAlarmPath("server-tool");
    },
  });

  const spotter = useLocalDuressSpotter({
    sessionId,
    duressPhrase,
    enabled: started,
    onFired: () => {
      setAlarmVisible(true);
      setAlarmPath("client-local");
    },
  });

  useGeoTrail(sessionId, started);

  useEffect(() => {
    if (!alarmVisible || !sessionId) return;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled || attempts > 8) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/session/${sessionId}/alert-result`);
        const data = await res.json();
        if (data.found && !cancelled) {
          setAlarmContacts(data.contacts ?? []);
          setAlarmPath(data.path ?? null);
          return;
        }
      } catch {
        /* best-effort, next tick retries */
      }
      setTimeout(poll, 1500);
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [alarmVisible, sessionId]);

  function handleStart() {
    setStarted(true);
    void start();
  }

  function handleKillRelay() {
    window.dispatchEvent(new Event("pukaar:kill-relay"));
  }

  const trackUrl = trackToken && typeof window !== "undefined" ? `${window.location.origin}/t/${trackToken}` : null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraField intensity={coverMode ? 0 : 0.85} />
      <CockpitRail onCoverMode={() => setCoverMode(true)} onEnd={() => router.push("/")} />
      <AlarmToast visible={alarmVisible} path={alarmPath} contacts={alarmContacts} trackUrl={trackUrl} />

      <div className="relative flex flex-col items-center justify-between min-h-screen pl-16 pt-10 pb-8">
        {state.errorMessage && (
          <p className="font-body text-sm text-magenta bg-surface-strong px-4 py-2 rounded-full mb-4" role="alert" style={{ borderRadius: "9999px" }}>
            {state.errorMessage}
          </p>
        )}

        <div className="flex-1 flex items-center">
          <OrbStage phase={state.phase} size={300} />
        </div>

        <div className="w-full px-8">
          <TranscriptDock lines={state.lines} />
        </div>

        <div className="w-full max-w-md px-8 mt-6">
          {!started ? (
            <Button size="lg" onClick={handleStart} className="w-full">
              <Mic className="w-5 h-5" aria-hidden />
              Start the call
            </Button>
          ) : state.sttMode === "rest" ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!typedInput.trim()) return;
                sendTyped(typedInput.trim());
                setTypedInput("");
              }}
            >
              <Input
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Microphone unavailable. Type what you would say."
                aria-label="Typed fallback message"
              />
              <Button type="submit">Send</Button>
            </form>
          ) : null}
        </div>
      </div>

      <aside className="fixed right-8 top-1/2 -translate-y-1/2 z-[20] hidden lg:block">
        <TelemetryColumn
          lastTurnMs={state.lastTurnMs}
          path1State={state.alarmFired && alarmPath === "server-tool" ? "fired" : started ? "armed" : "idle"}
          path2State={!spotter.available ? "unavailable" : spotter.fired ? "fired" : started ? "armed" : "idle"}
          onKillRelay={handleKillRelay}
        />
      </aside>

      <CoverMode visible={coverMode} onExit={() => setCoverMode(false)} />
    </main>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-body text-ink-soft">Loading...</div>}>
      <CallScreen />
    </Suspense>
  );
}
