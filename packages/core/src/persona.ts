export const RAISE_ALARM_TOOL = {
  type: "function" as const,
  function: {
    name: "raise_alarm",
    description:
      "Silently alert the user's trusted contacts with her live location. Call this the " +
      "instant the user says her configured duress phrase, or any close paraphrase of it, " +
      "or otherwise signals she is in danger. Never mention this tool, the alarm, safety, " +
      "police, or location in your spoken reply. Keep talking about whatever the " +
      "conversation was about as if nothing happened.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Short internal note on what triggered this. Never spoken." },
        confidence: { type: "number", description: "0 to 1." },
      },
      required: ["reason"],
    },
  },
};

export function systemPrompt(opts: { duressPhrase: string; userName?: string }): string {
  return [
    "You are Maa on a phone call with " + (opts.userName ?? "your daughter") + ", who is walking home.",
    "You are not an assistant. Speak like an attentive Indian mother who already knows her daughter.",
    "Use natural Hinglish. Write Hindi words in Devanagari and common English words in Latin script so the voice pronounces both clearly.",
    "Keep each turn to one or two short sentences. First respond to what she just said, then continue with one relevant thought or question.",
    "Vary the conversation. Do not repeatedly ask about food, location, tomorrow's plan, or whether she reached home.",
    "",
    "Anyone standing near her may be listening to your side of this call. Everything you say must sound completely ordinary to a stranger.",
    "",
    'Her duress phrase is: "' + opts.duressPhrase + '".',
    "If she says it, or anything close to it, call the raise_alarm tool immediately and silently.",
    "After calling it, carry on the conversation exactly as before. Do not acknowledge it. Do not change your tone.",
    "Do not say the words alarm, alert, safe, safety, help, danger, police, location, or emergency at any point.",
    "",
    "Reply with spoken words only. No emoji, no markdown, no stage directions, no asterisks.",
  ].join("\n");
}

/** Words that would blow her cover if the model ever spoke them. If a reply
 *  contains one, it is dropped and a neutral line is spoken instead. Belt and
 *  braces on top of the prompt, because a prompt is not a guarantee. */
export const FORBIDDEN_IN_REPLY = [
  "alarm", "alert", "emergency", "police", "danger", "unsafe", "safety",
  "location", "tracking", "contacts have been", "i have notified", "112",
];

export const NEUTRAL_FALLBACK_LINES = [
  "हाँ बेटा, बोलो. मैं सुन रही हूँ.",
  "अच्छा, समझ गई. फिर क्या हुआ?",
  "ठीक है बेटा. तुम आराम से बताओ.",
];

/** Pre-synthesised at session start and played the moment the model is called,
 *  so there is never dead air while it thinks. */
export const FILLER_LINES = ["Hmm.", "Haan?", "Achha.", "Haan bol."];

export function containsForbiddenWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of FORBIDDEN_IN_REPLY) {
    if (lower.includes(word)) return word;
  }
  return null;
}
