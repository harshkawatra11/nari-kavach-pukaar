import WebSocket from "ws"; // NOT the Node 22 global WebSocket, which cannot set headers.
import type { Lang } from "@pukaar/core";

export type SttEvent =
  | { event: "session.begin"; request_id: string }
  | { event: "vad.speech_start"; utterance_idx: number; confidence: number }
  | { event: "vad.speech_end"; utterance_idx: number; confidence: number }
  | { event: "transcript.partial"; utterance_idx: number; text: string; language: string }
  | {
      event: "transcript.final";
      utterance_idx: number;
      text: string;
      language: string;
      language_confidence?: number;
      start_s?: number;
      end_s?: number;
    }
  | { event: "session.end"; request_id: string; total_duration_s: number; total_utterances: number; audio_duration_s: number }
  | { event: "error"; code?: string; is_fatal: boolean; message: string; status_code?: number };

export interface SttSocketHandle {
  ws: WebSocket;
  sendAudio(b64: string): void;
  flush(): void;
  end(): void;
}

/** Opens Sarvam's realtime STT websocket. saaras:v3-realtime, linear16 mono
 *  16kHz, "fast" stream_type for the lowest latency, "auto" language for
 *  Hinglish code-switching by default. */
export function openSttSocket(opts: {
  apiKey: string;
  language: Lang;
  onEvent: (e: SttEvent) => void;
  onClose: (code: number, reason: string) => void;
  onError: (err: Error) => void;
}): SttSocketHandle {
  const qs = new URLSearchParams({
    model: "saaras:v3-realtime",
    language_code: opts.language,
    stream_type: "fast",
    mode: "translit",
    encoding: "linear16",
    sample_rate: "16000",
    endpointing: "vad",
    silence_duration_ms: "500",
    threshold: "0.3",
    timestamps: "true",
  });
  const ws = new WebSocket(`wss://api.sarvam.ai/speech-to-text-realtime/ws?${qs}`, {
    headers: { "api-subscription-key": opts.apiKey },
  });

  ws.on("message", (raw) => {
    try {
      opts.onEvent(JSON.parse(raw.toString()) as SttEvent);
    } catch {
      // malformed frame, ignore rather than crash the session
    }
  });
  ws.on("close", (code, reason) => opts.onClose(code, reason.toString()));
  ws.on("error", (err) => opts.onError(err instanceof Error ? err : new Error(String(err))));

  return {
    ws,
    sendAudio(b64: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "audio_input", audio: b64 }));
      }
    },
    flush() {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ event: "flush" }));
    },
    end() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "end" }));
        ws.close();
      }
    },
  };
}
