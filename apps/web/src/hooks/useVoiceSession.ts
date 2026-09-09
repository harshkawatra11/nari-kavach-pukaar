"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientFrame, Lang, ServerFrame } from "@pukaar/core";
import { TurnClock } from "@pukaar/core";
import { bytesToB64 } from "@/lib/audio/b64";
import { AudioPlaybackQueue } from "@/lib/audio/playback";
import { orbAudio, type OrbPhase } from "@/lib/audio/levels";

export interface TranscriptLine {
  id: string;
  speaker: "puk" | "her";
  text: string;
  partial: boolean;
  isAlarmLine: boolean;
}

export interface VoiceSessionState {
  connected: boolean;
  sttMode: "ws" | "rest" | null;
  lines: TranscriptLine[];
  lastTurnMs: number | null;
  medianTurnMs: number | null;
  alarmFired: boolean;
  micActive: {
    stt: boolean;
    model: boolean;
    voice: boolean;
  };
  /** The orb's phase, mirrored into React state purely so the cockpit's one
   *  line of status text can read it; the orb itself reads orbAudio.phase
   *  directly every frame and never re-renders off this. */
  phase: OrbPhase;
  errorMessage: string | null;
}

/** Owns the microphone, the relay WebSocket, and audio playback for one call.
 *  Everything here must run inside a user gesture (the "Start" click), or the
 *  AudioContext starts suspended with no error at all. */
export function useVoiceSession(opts: {
  sessionId: string;
  language: Lang;
  duressPhrase: string;
  userName: string;
  onAlarm: () => void;
}) {
  const [state, setState] = useState<VoiceSessionState>({
    connected: false,
    sttMode: null,
    lines: [],
    lastTurnMs: null,
    medianTurnMs: null,
    alarmFired: false,
    micActive: { stt: false, model: false, voice: false },
    phase: "idle",
    errorMessage: null,
  });

  const setPhase = useCallback((phase: OrbPhase) => {
    orbAudio.phase = phase;
    setState((s) => (s.phase === phase ? s : { ...s, phase }));
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackRef = useRef<AudioPlaybackQueue | null>(null);
  const clockRef = useRef(new TurnClock());
  const startedRef = useRef(false); // guards against React strict-mode double-connect in dev
  const speakingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((frame: ClientFrame) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(frame));
  }, []);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL ?? "ws://localhost:8787";
    const ws = new WebSocket(relayUrl);
    wsRef.current = ws;
    playbackRef.current = new AudioPlaybackQueue(() => {
      // A short grace period prevents a sentence boundary from flashing the
      // orb back to listening while the next synthesised chunk is arriving.
      if (speakingIdleTimerRef.current) clearTimeout(speakingIdleTimerRef.current);
      speakingIdleTimerRef.current = setTimeout(() => {
        setPhase("listening");
        setState((s) => ({ ...s, micActive: { ...s.micActive, voice: false } }));
      }, 220);
    });
    orbAudio.ttsAnalyser = playbackRef.current.analyser;
    orbAudio.phase = "idle";

    ws.onopen = () => {
      send({ t: "hello", sessionId: opts.sessionId, language: opts.language, duressPhrase: opts.duressPhrase, userName: opts.userName });
      setState((s) => ({ ...s, connected: true }));
    };

    ws.onmessage = (ev) => {
      const frame = JSON.parse(ev.data) as ServerFrame;
      handleServerFrame(frame);
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false, micActive: { stt: false, model: false, voice: false } }));
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, errorMessage: "Connection to the voice relay dropped." }));
    };

    function handleServerFrame(frame: ServerFrame) {
      switch (frame.t) {
        case "ready":
          setState((s) => ({ ...s, sttMode: frame.sttMode }));
          break;
        case "partial":
          setState((s) => upsertPartial(s, frame.text));
          setState((s) => ({ ...s, micActive: { ...s.micActive, stt: true } }));
          setPhase("listening");
          break;
        case "vad":
          if (frame.state === "start") {
            playbackRef.current?.clear();
            setPhase("listening");
            setState((s) => ({ ...s, micActive: { ...s.micActive, stt: true, voice: false } }));
          } else {
            setState((s) => ({ ...s, micActive: { ...s.micActive, stt: false } }));
          }
          break;
        case "final":
          setState((s) => finalizeLine(s, frame.text));
          clockRef.current.startTurn(frame.turnId, Date.now());
          setState((s) => ({ ...s, micActive: { ...s.micActive, stt: false, model: true } }));
          setPhase("thinking");
          break;
        case "reply":
          setState((s) => addReplyLine(s, frame.text));
          setState((s) => ({ ...s, micActive: { ...s.micActive, model: false, voice: true } }));
          break;
        case "audio":
          setPhase("speaking");
          if (speakingIdleTimerRef.current) clearTimeout(speakingIdleTimerRef.current);
          if (frame.seq >= 0) {
            void playbackRef.current?.enqueueWavBase64(frame.b64);
            const mark = clockRef.current.markFirstAudio(frame.turnId, Date.now());
            if (mark?.timeToFirstWordMs != null) {
              setState((s) => ({
                ...s,
                lastTurnMs: mark.timeToFirstWordMs,
                medianTurnMs: clockRef.current.medianTimeToFirstWordMs(),
                micActive: { ...s.micActive, voice: true },
              }));
            }
          } else {
            // filler line, seq -1: play but do not count toward latency stats
            void playbackRef.current?.enqueueWavBase64(frame.b64);
          }
          break;
        case "mark":
          if (frame.key === "llm") clockRef.current.markLlmReply(frame.turnId, frame.at);
          break;
        case "alarm":
          setState((s) => markAlarmLine(s));
          setState((s) => ({ ...s, alarmFired: true }));
          orbAudio.lastAlarmAt = Date.now();
          opts.onAlarm();
          break;
        case "error":
          setState((s) => ({ ...s, errorMessage: frame.message }));
          break;
      }
    }

    // Microphone capture. Must happen inside this click-triggered function.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      await ctx.resume();

      if (ctx.sampleRate !== 16000) {
        setState((s) => ({
          ...s,
          errorMessage: `Microphone context started at ${ctx.sampleRate}Hz instead of 16000Hz. Speech recognition accuracy may suffer on this device.`,
        }));
      }

      await ctx.audioWorklet.addModule("/worklets/pcm-recorder.js");
      const src = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "pcm-recorder");
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        send({ t: "audio", b64: bytesToB64(new Uint8Array(e.data)) });
      };
      // Deliberately NOT node.connect(ctx.destination): that would feed her
      // own mic back into the speakers on top of the AI's voice.
      src.connect(node);

      // A second, silent tap purely for the orb's amplitude read. Connecting
      // one source to two destinations is fine in the Web Audio graph; this
      // analyser never reaches ctx.destination either.
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 512;
      src.connect(micAnalyser);
      orbAudio.micAnalyser = micAnalyser;
    } catch {
      setState((s) => ({ ...s, errorMessage: "Microphone access was denied. Voice input is unavailable for this session." }));
    }
  }, [opts, send, setPhase]);

  const sendTyped = useCallback(
    (text: string) => {
      setState((s) => finalizeLineAsHer(s, text));
      send({ t: "text", body: text });
    },
    [send],
  );

  const teardownOrbAudio = useCallback(() => {
    orbAudio.micAnalyser = null;
    orbAudio.ttsAnalyser = null;
    orbAudio.phase = "idle";
    if (speakingIdleTimerRef.current) clearTimeout(speakingIdleTimerRef.current);
  }, []);

  const stop = useCallback(() => {
    send({ t: "bye" });
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void audioCtxRef.current?.close();
    playbackRef.current?.close();
    teardownOrbAudio();
  }, [send, teardownOrbAudio]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount; does not double-fire because startedRef guards start().
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
      playbackRef.current?.close();
      teardownOrbAudio();
    };
  }, [teardownOrbAudio]);

  // Demo hook: simulates the relay process dying by force-closing the socket
  // from the client side, so trigger path 2 can be shown firing independently
  // without actually needing to kill a shared relay process on stage.
  useEffect(() => {
    const handler = () => {
      wsRef.current?.close();
      setState((s) => ({ ...s, connected: false }));
    };
    window.addEventListener("pukaar:kill-relay", handler);
    return () => window.removeEventListener("pukaar:kill-relay", handler);
  }, []);

  return { state, start, stop, sendTyped };
}

function upsertPartial(s: VoiceSessionState, text: string): VoiceSessionState {
  const lines = [...s.lines];
  const last = lines[lines.length - 1];
  if (last && last.speaker === "her" && last.partial) {
    lines[lines.length - 1] = { ...last, text };
  } else {
    lines.push({ id: crypto.randomUUID(), speaker: "her", text, partial: true, isAlarmLine: false });
  }
  return { ...s, lines };
}

function finalizeLine(s: VoiceSessionState, text: string): VoiceSessionState {
  const lines = [...s.lines];
  const last = lines[lines.length - 1];
  if (last && last.speaker === "her" && last.partial) {
    lines[lines.length - 1] = { ...last, text, partial: false };
  } else {
    lines.push({ id: crypto.randomUUID(), speaker: "her", text, partial: false, isAlarmLine: false });
  }
  return { ...s, lines };
}

function finalizeLineAsHer(s: VoiceSessionState, text: string): VoiceSessionState {
  return { ...s, lines: [...s.lines, { id: crypto.randomUUID(), speaker: "her", text, partial: false, isAlarmLine: false }] };
}

function addReplyLine(s: VoiceSessionState, text: string): VoiceSessionState {
  return { ...s, lines: [...s.lines, { id: crypto.randomUUID(), speaker: "puk", text, partial: false, isAlarmLine: false }] };
}

function markAlarmLine(s: VoiceSessionState): VoiceSessionState {
  const lines = [...s.lines];
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].speaker === "her") {
      lines[i] = { ...lines[i], isAlarmLine: true };
      break;
    }
  }
  return { ...s, lines };
}
