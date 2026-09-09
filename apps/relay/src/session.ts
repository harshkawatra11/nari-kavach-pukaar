import { randomUUID } from "crypto";
import type WebSocket from "ws";
import {
  containsForbiddenWord,
  createTranscriptWindow,
  matchPhrase,
  profileForStoredPhrase,
  NEUTRAL_FALLBACK_LINES,
  splitSentences,
  systemPrompt,
  type ChatMessage,
  type ClientFrame,
  type Lang,
  type ServerFrame,
} from "@pukaar/core";
import { env } from "./env";
import { log } from "./log";
import { raiseAlarm } from "./alarm";
import { chatCompletion } from "./sarvam/chat";
import { synthesizeRest } from "./sarvam/tts-rest";
import { openSttSocket, type SttSocketHandle } from "./sarvam/stt-ws";

const MAX_HISTORY_MESSAGES = 16;
const STT_RECONNECT_DELAY_MS = 500;

function send(ws: WebSocket, frame: ServerFrame) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(frame));
}

export class Session {
  private ws: WebSocket;
  private sessionId = "";
  private language: Lang = "auto";
  private duressPhrase = "";
  private userName: string | undefined;
  private history: ChatMessage[] = [];
  private alarmRaised = false;
  private disposed = false;
  private sttHandle: SttSocketHandle | null = null;
  private sttFailCount = 0;
  private sttMode: "ws" | "rest" = env.STT_MODE;
  private transcriptWindow = createTranscriptWindow();
  private sttEpoch = 0;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  handleMessage(raw: string) {
    let frame: ClientFrame;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    switch (frame.t) {
      case "hello":
        void this.onHello(frame);
        break;
      case "audio":
        this.onAudio(frame.b64);
        break;
      case "text":
        void this.onTypedText(frame.body);
        break;
      case "bye":
        this.dispose();
        break;
    }
  }

  private async onHello(frame: Extract<ClientFrame, { t: "hello" }>) {
    this.sessionId = frame.sessionId;
    this.language = frame.language;
    this.duressPhrase = frame.duressPhrase;
    this.transcriptWindow.reset();
    this.userName = frame.userName;
    this.history = [{ role: "system", content: systemPrompt({ duressPhrase: this.duressPhrase, userName: this.userName }) }];

    if (this.sttMode === "ws") {
      this.openStt();
    }

    send(this.ws, { t: "ready", sttMode: this.sttMode, ttsMode: env.TTS_MODE });

    // Open in the same casual Hinglish register used in the live demo. Send
    // the text frame as well as audio so the cockpit never starts with an
    // unexplained voice that is missing from the transcript.
    const openingTurnId = randomUUID();
    const opening = "हाँ बेटा, बोलो. आज का दिन कैसा था?";
    send(this.ws, { t: "reply", text: opening, turnId: openingTurnId });
    await this.speakTurn(opening, openingTurnId);
  }

  private openStt() {
    this.sttEpoch += 1;
    this.sttHandle = openSttSocket({
      apiKey: env.SARVAM_API_KEY,
      language: this.language,
      onEvent: (e) => {
        if (e.event === "transcript.partial") {
          send(this.ws, { t: "partial", text: e.text, utteranceIdx: e.utterance_idx });
        } else if (e.event === "transcript.final") {
          void this.onFinalTranscript(e.text, e.utterance_idx);
        } else if (e.event === "vad.speech_start") {
          send(this.ws, { t: "vad", state: "start", utteranceIdx: e.utterance_idx });
        } else if (e.event === "vad.speech_end") {
          send(this.ws, { t: "vad", state: "end", utteranceIdx: e.utterance_idx });
        } else if (e.event === "error" && e.is_fatal) {
          this.degradeSttToRest("fatal STT error: " + e.message);
        }
      },
      onClose: (code) => {
        if (!this.disposed && code !== 1000) this.reconnectOrDegradeStt();
      },
      onError: (err) => {
        log.warn("STT socket error", { sessionId: this.sessionId, err: err.message });
        this.reconnectOrDegradeStt();
      },
    });
  }

  private reconnectOrDegradeStt() {
    if (this.disposed) return;
    this.sttFailCount += 1;
    if (this.sttFailCount === 1) {
      send(this.ws, { t: "error", message: "Reconnecting to speech service...", fatal: false });
      setTimeout(() => {
        if (!this.disposed) this.openStt();
      }, STT_RECONNECT_DELAY_MS);
    } else {
      this.degradeSttToRest("realtime STT failed twice");
    }
  }

  private degradeSttToRest(reason: string) {
    log.warn("degrading STT to REST turn-based mode", { sessionId: this.sessionId, reason });
    this.sttMode = "rest";
    send(this.ws, { t: "ready", sttMode: "rest", ttsMode: env.TTS_MODE });
  }

  private onAudio(b64: string) {
    if (this.sttMode === "ws" && this.sttHandle) {
      this.sttHandle.sendAudio(b64);
    }
    // In "rest" mode (STT_MODE=rest, or after a realtime-socket degrade),
    // continuous mic audio is not accepted: batching a full-turn WAV client
    // side and posting it as a "text" typed-fallback style turn is out of
    // scope for this build. The UI switches to the typed-text input in this
    // mode instead (see apps/web hooks/useVoiceSession.ts), which reuses
    // onTypedText below and gives every turn the exact same handling either way.
  }

  private async onTypedText(text: string) {
    // Typed fallback path when the mic was refused. Treat it exactly like a
    // final transcript.
    await this.onFinalTranscript(text, 0);
  }

  private async onFinalTranscript(text: string, utteranceIdx: number) {
    if (!text.trim()) return;
    const turnId = randomUUID();
    const finalAt = Date.now();
    send(this.ws, { t: "final", text, utteranceIdx, turnId });
    send(this.ws, { t: "mark", turnId, key: "final", at: finalAt });

    // Third, independent safety net: the relay also scans the final transcript
    // for the duress phrase, in addition to the model's own tool call and the
    // browser's local Web Speech matcher. Any one of the three can trigger.
    const combinedTranscript = this.transcriptWindow.upsert({ id: `${this.sttEpoch}:${utteranceIdx}`, text, at: finalAt, final: true });
    const localMatch = matchPhrase(combinedTranscript, profileForStoredPhrase(this.duressPhrase));
    if (localMatch.matched && !this.alarmRaised) {
      this.alarmRaised = true;
      const result = await raiseAlarm(this.sessionId, "relay phrase profile matched");
      if (result.ok) send(this.ws, { t: "alarm", path: "server-tool", at: Date.now() });
    }

    this.history.push({ role: "user", content: text });
    await this.handleTurn(turnId, finalAt);
  }

  private async handleTurn(turnId: string, finalAt: number) {
    try {
      let result = await chatCompletion({ apiKey: env.SARVAM_API_KEY, messages: this.history });

      if (result.toolCalls?.some((tc) => tc.function.name === "raise_alarm")) {
        const call = result.toolCalls.find((tc) => tc.function.name === "raise_alarm")!;
        if (!this.alarmRaised) {
          this.alarmRaised = true;
          let reason = "model tool call";
          try {
            reason = JSON.parse(call.function.arguments).reason ?? reason;
          } catch {
            /* keep default reason */
          }
          void raiseAlarm(this.sessionId, reason);
          send(this.ws, { t: "alarm", path: "server-tool", at: Date.now() });
        }
        this.history.push({ role: "assistant", content: null, tool_calls: result.toolCalls });
        this.history.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: true }) });
        result = await chatCompletion({ apiKey: env.SARVAM_API_KEY, messages: this.history, toolResultRound: true });
      }

      let replyText = result.content ?? "";
      const forbidden = containsForbiddenWord(replyText);
      if (forbidden) {
        log.warn("reply contained a forbidden word, substituting a neutral line", { word: forbidden });
        replyText = NEUTRAL_FALLBACK_LINES[Math.floor(Math.random() * NEUTRAL_FALLBACK_LINES.length)];
      }
      if (!replyText.trim()) {
        replyText = NEUTRAL_FALLBACK_LINES[0];
      }

      send(this.ws, { t: "reply", text: replyText, turnId });
      send(this.ws, { t: "mark", turnId, key: "llm", at: Date.now() });
      this.history.push({ role: "assistant", content: replyText });

      await this.speakTurn(replyText, turnId, finalAt);

      // Trim history so a long call does not grow context and cost unbounded,
      // and so the system prompt (with the duress instruction) never gets
      // truncated out by the model provider.
      if (this.history.length > MAX_HISTORY_MESSAGES + 1) {
        const recent = this.history.slice(-MAX_HISTORY_MESSAGES);
        if (recent[0]?.role === "assistant" || recent[0]?.role === "tool") recent.shift();
        this.history = [this.history[0], ...recent];
      }
    } catch (err) {
      log.error("turn failed", { sessionId: this.sessionId, err: String(err) });
      send(this.ws, { t: "error", message: "Something went wrong on this turn.", fatal: false });
    }
  }

  private async speakTurn(replyText: string, turnId: string, finalAt?: number) {
    const chunks = splitSentences(replyText);
    let seq = 0;
    for (const chunk of chunks) {
      try {
        const synth = await synthesizeRest({ apiKey: env.SARVAM_API_KEY, text: chunk, speaker: env.SARVAM_SPEAKER, language: this.language });
        if (seq === 0 && finalAt !== undefined) {
          send(this.ws, { t: "mark", turnId, key: "audio", at: Date.now() });
        }
        send(this.ws, { t: "audio", b64: synth.wavBase64, mime: "audio/wav", sampleRateHz: synth.sampleRateHz, turnId, seq });
        seq += 1;
      } catch (err) {
        log.error("TTS failed for a sentence chunk", { err: String(err) });
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.sttHandle?.end();
    this.transcriptWindow.reset();
  }
}
