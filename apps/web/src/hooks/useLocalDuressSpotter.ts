"use client";

import { useEffect, useRef, useState } from "react";
import { createTranscriptWindow, matchPhrase, profileForStoredPhrase } from "@pukaar/core";

// Trigger path 2. Runs entirely in the browser against the Web Speech API's
// own transcript, and posts straight to /api/alarm without going near the
// relay. If the relay process is killed mid-call, this still fires. That is
// the product's central redundancy claim, demoed live via the "Kill relay"
// button on the call screen.

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
}

export function useLocalDuressSpotter(opts: { sessionId: string; controlToken: string; duressPhrase: string; enabled: boolean; onFired: () => void }) {
  const [available, setAvailable] = useState(true);
  const [armed, setArmed] = useState(false);
  const [fired, setFired] = useState(false);
  const stoppedRef = useRef(false);
  const firedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFiredRef = useRef(opts.onFired);
  const transcriptWindowRef = useRef(createTranscriptWindow());
  const epochRef = useRef(0);

  useEffect(() => {
    onFiredRef.current = opts.onFired;
  }, [opts.onFired]);

  useEffect(() => {
    if (!opts.enabled) return;

    const SR: (new () => SpeechRecognitionLike) | undefined =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SR) {
      // Feature detection: window.SpeechRecognition does not exist during
      // SSR, so this can only be learned client-side, inside this effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailable(false);
      return;
    }

    stoppedRef.current = false;
    firedRef.current = false;
    transcriptWindowRef.current.reset();
    epochRef.current += 1;
    const recognition = new SR();
    const transcriptWindow = transcriptWindowRef.current;
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";

    recognition.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        const transcript = result[0].transcript;
        if (firedRef.current) continue;
        const combined = transcriptWindow.upsert({
          id: `${epochRef.current}:${i}`,
          text: transcript,
          at: Date.now(),
          final: result.isFinal,
        });
        if (!result.isFinal) continue;
        const match = matchPhrase(combined, profileForStoredPhrase(opts.duressPhrase));
        if (match.matched) {
          firedRef.current = true;
          setFired(true);
          onFiredRef.current();
          void fetch("/api/alarm", {
            method: "POST",
            headers: { "content-type": "application/json", "x-session-control": opts.controlToken },
            body: JSON.stringify({ sessionId: opts.sessionId, path: "client-local", reason: "local phrase profile matched" }),
          });
        }
      }
    };

    recognition.onerror = (ev) => {
      if (ev.error === "no-speech") return; // normal, not a failure
      if (ev.error === "not-allowed") {
        // Two consumers of one microphone: getUserMedia (worklet) and
        // SpeechRecognition (this). Some setups refuse the second. Degrade
        // gracefully rather than tearing down the call.
        setAvailable(false);
      }
    };

    // SpeechRecognition stops on its own after a few seconds of silence
    // regardless of continuous=true. Restart it, guarded so it does not
    // restart after the session ends.
    recognition.onend = () => {
      if (!stoppedRef.current) {
        epochRef.current += 1;
        try {
          recognition.start();
        } catch {
          // already starting, ignore
        }
      }
    };

    try {
      recognition.start();
      setArmed(true);
    } catch {
      setAvailable(false);
    }

    return () => {
      stoppedRef.current = true;
      transcriptWindow.reset();
      recognition.onend = null;
      recognition.stop();
    };
  }, [opts.controlToken, opts.duressPhrase, opts.enabled, opts.sessionId]);

  return { available, armed, fired };
}
