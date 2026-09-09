export type Lang = "hi-IN" | "en-IN" | "auto";

export interface Contact {
  id: string;
  name: string;
  /** E.164 digits, no plus, no spaces. "919876543210". */
  phone: string;
  relationship: string;
}

export interface AlarmState {
  raised: boolean;
  at: number | null;
  path: TriggerPath | null;
  reason: string | null;
}

export interface SessionDoc {
  id: string;
  /** Unguessable, 21-char nanoid. The only thing standing between the internet and her map. */
  trackToken: string;
  controlTokenHash?: string;
  createdAt: number;
  endedAt: number | null;
  language: Lang;
  duressPhrase: string;
  userName: string;
  /** Marks an approved delivery check so recipients never mistake a stage
   * rehearsal for a real emergency. */
  testMode?: boolean;
  contacts: Contact[];
  status: "active" | "ended";
  alarm: AlarmState;
  /** Session-scoped location trail. Cleared by Firestore TTL. Never a permanent history. */
  trail: GeoPoint[];
}

export type TriggerPath = "server-tool" | "client-local";

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracyM: number;
  at: number;
}

export interface TurnMark {
  turnId: string;
  finalTranscriptAt: number;
  llmReplyAt: number | null;
  firstAudioAt: number | null;
  /** firstAudioAt - finalTranscriptAt. The number the deck promises at 1200ms. */
  timeToFirstWordMs: number | null;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
