import type { Lang } from "./types";

// The browser <-> relay wire contract. Imported by both apps/web and
// apps/relay so the two sides cannot drift out of sync with each other.

export type ClientFrame =
  | { t: "hello"; sessionId: string; language: Lang; duressPhrase: string; userName?: string }
  | { t: "audio"; b64: string } // PCM16 mono 16k, base64
  | { t: "text"; body: string } // typed fallback when the mic is refused
  | { t: "bye" };

export type ServerFrame =
  | { t: "ready"; sttMode: "ws" | "rest"; ttsMode: "ws" | "rest" }
  | { t: "partial"; text: string; utteranceIdx: number }
  | { t: "vad"; state: "start" | "end"; utteranceIdx: number }
  | { t: "final"; text: string; utteranceIdx: number; turnId: string }
  | { t: "reply"; text: string; turnId: string }
  | { t: "audio"; b64: string; mime: string; sampleRateHz: number; turnId: string; seq: number }
  | { t: "alarm"; path: "server-tool"; at: number }
  | { t: "mark"; turnId: string; key: "final" | "llm" | "audio"; at: number }
  | { t: "error"; message: string; fatal: boolean };
