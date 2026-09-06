import WebSocket from "ws";

// Optional Tier B TTS leg: lower latency, streams audio chunks as they are
// generated instead of waiting for one complete WAV. Behind TTS_MODE=ws.
// bulbul:v3 has no pitch/loudness params and a narrower 0.5-2.0 pace range
// compared to v2.

export interface TtsWsHandle {
  ws: WebSocket;
  sendText(text: string): void;
  flush(): void;
  close(): void;
}

export function openTtsSocket(opts: {
  apiKey: string;
  speaker: string;
  language: string;
  onAudioChunk: (b64: string, mime: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}): TtsWsHandle {
  const ws = new WebSocket("wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3", {
    headers: { "api-subscription-key": opts.apiKey },
  });

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        type: "config",
        data: {
          language_code: opts.language === "auto" ? "hi-IN" : opts.language,
          speaker: opts.speaker.toLowerCase(),
          model: "bulbul:v3",
          pace: 1.0,
          temperature: 0.5,
          speech_sample_rate: "24000",
          output_audio_codec: "mp3",
          output_audio_bitrate: "128k",
          min_buffer_size: 50,
          max_chunk_length: 150,
        },
      }),
    );
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string;
        data?: { audio?: string; content_type?: string; event_type?: string };
      };
      if (msg.type === "audio" && msg.data?.audio) {
        opts.onAudioChunk(msg.data.audio, msg.data.content_type ?? "audio/mp3");
      } else if (msg.type === "event" && msg.data?.event_type === "final") {
        opts.onDone();
      }
    } catch {
      // malformed frame, ignore
    }
  });
  ws.on("error", (err) => opts.onError(err instanceof Error ? err : new Error(String(err))));

  return {
    ws,
    sendText(text: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "text", data: { text } }));
      }
    },
    flush() {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "flush" }));
    },
    close() {
      ws.close();
    },
  };
}
