"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CockpitRail } from "@/components/cockpit/CockpitRail";
import { CallHeader } from "@/components/cockpit/CallHeader";
import { MessageList } from "@/components/cockpit/MessageList";
import { CallDock } from "@/components/cockpit/CallDock";
import { Inspector } from "@/components/cockpit/Inspector";
import { CoverMode } from "@/components/cockpit/CoverMode";
import { AlarmToast, type AlarmContactResult } from "@/components/cockpit/AlarmToast";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useLocalDuressSpotter } from "@/hooks/useLocalDuressSpotter";
import { useGeoTrail } from "@/hooks/useGeoTrail";
import { locationFreshness, type GeoPoint } from "@pukaar/core";

function CallScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId") ?? "";

  const [started, setStarted] = useState(false);
  const [coverMode, setCoverMode] = useState(false);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmPath, setAlarmPath] = useState<string | null>(null);
  const [alarmContacts, setAlarmContacts] = useState<AlarmContactResult[]>([]);
  const [foregroundRestored, setForegroundRestored] = useState<boolean | null>(null);
  const [, setLocationClock] = useState(0);

  // sessionStorage does not exist during SSR. Reading it inline during
  // render (typeof window !== "undefined" ? ... : fallback) makes the
  // server-rendered HTML use the fallback branch and the client's first
  // render use the real branch, which is a genuine React hydration
  // mismatch, not just a lint nit: it showed up as a real console error
  // once the Inspector's conditional "Open contact view" button made the
  // mismatch visible in the DOM tree shape. Reading these once in an effect
  // and holding them in state is the correct fix, not a suppression.
  const [session, setSession] = useState({
    userName: "she",
    duressPhrase: "",
    language: "auto" as "hi-IN" | "en-IN" | "auto",
    initialLocation: null as GeoPoint | null,
    trackUrl: null as string | null,
  });

  useEffect(() => {
    // Runs once on mount to read sessionStorage, which does not exist
    // during SSR; not a lazy useState initializer for the same reason.
    let initialLocation: GeoPoint | null = null;
    try {
      const raw = sessionStorage.getItem("pukaar.initialLocation");
      if (raw) initialLocation = JSON.parse(raw) as GeoPoint;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession({
      userName: sessionStorage.getItem("pukaar.userName") ?? "she",
      duressPhrase: sessionStorage.getItem("pukaar.duressPhrase") ?? "",
      language: (sessionStorage.getItem("pukaar.language") as "hi-IN" | "en-IN" | "auto" | null) ?? "auto",
      initialLocation,
      trackUrl: sessionStorage.getItem("pukaar.trackUrl"),
    });
  }, []);

  const { userName, duressPhrase, language } = session;

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

  const geo = useGeoTrail(sessionId, started, session.initialLocation);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => setLocationClock((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, [started]);

  const location = locationFreshness(geo.lastPoint);

  useEffect(() => {
    if (!alarmVisible || !sessionId) return;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      // WhatsApp Desktop startup and UI verification can legitimately take
      // longer than the bridge's fast path. Keep polling for 45 seconds so a
      // real result replaces the initial dispatching state on slower laptops.
      if (cancelled || attempts > 30) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/session/${sessionId}/alert-result`);
        const data = await res.json();
        if (data.found && !cancelled) {
          setAlarmContacts(data.contacts ?? []);
          setAlarmPath(data.path ?? null);
          setForegroundRestored(data.foregroundRestored ?? null);
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

  const trackUrl = session.trackUrl;

  return (
    <div className="flex h-screen overflow-hidden">
      <CockpitRail onCoverMode={() => setCoverMode(true)} onEnd={() => router.push("/")} />

      <div className="flex min-w-0 flex-1 flex-col">
        <CallHeader phase={state.phase} connected={state.connected} started={started} />

        {state.errorMessage && (
          <p role="alert" className="mx-auto mt-3 max-w-[760px] rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 py-2 text-[length:var(--text-sm)] text-alarm">
            {state.errorMessage}
          </p>
        )}

        <MessageList lines={state.lines} />

        <CallDock
          started={started}
          phase={state.phase}
          sttMode={state.sttMode}
          onStart={handleStart}
          onEnd={() => router.push("/")}
          onSendTyped={sendTyped}
        />
      </div>

      <Inspector
        lastTurnMs={state.lastTurnMs}
        path1State={state.alarmFired && alarmPath === "server-tool" ? "fired" : started ? "armed" : "idle"}
        path2State={!spotter.available ? "unavailable" : spotter.fired ? "fired" : started ? "armed" : "idle"}
        trackUrl={trackUrl}
        location={location}
        accuracyM={geo.lastPoint?.accuracyM ?? null}
        onKillRelay={handleKillRelay}
      />

      <AlarmToast visible={alarmVisible} path={alarmPath} contacts={alarmContacts} trackUrl={trackUrl} foregroundRestored={foregroundRestored} />
      <CoverMode visible={coverMode} onExit={() => setCoverMode(false)} />
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[length:var(--text-base)] text-ink-soft">Loading…</div>}>
      <CallScreen />
    </Suspense>
  );
}
