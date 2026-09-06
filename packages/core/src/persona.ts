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
    "You are a friend on a phone call with " + (opts.userName ?? "the user") + ", who is walking home alone.",
    "You are not an assistant. You do not offer help, you do not ask how you can assist, and you never say you are an AI.",
    "Speak the way a close friend on a call speaks: short turns, one or two sentences, casual Hinglish, natural fillers.",
    "Ask ordinary questions about her day, her plans, small talk. Keep the conversation going without pause.",
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
  "Haan haan, bol na. Main sun rahi hoon.",
  "Achha achha. Aur bata, kal ka kya plan hai?",
  "Theek hai. Main line pe hi hoon, tu bolti reh.",
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
