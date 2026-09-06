export interface FaqAnswer {
  id: string;
  /** Matched against the user's question, lowercased, by keyword overlap. */
  keywords: string[];
  question: string;
  answer: string;
  action?: { label: string; href: string };
}

// Deterministic local knowledge base, not a model call: instant, always
// works on stage, costs nothing, and cannot hallucinate. Answer copy is
// drawn from the same figures /system renders and packages/core computes.
export const FAQ: FaqAnswer[] = [
  {
    id: "what",
    keywords: ["what", "pukaar", "does", "do", "is"],
    question: "What is Pukaar?",
    answer:
      "A two-way voice call you start before an unsafe walk. It talks and listens like a real person, so it holds up to anyone standing near you. One ordinary sentence, spoken mid-conversation, sends your live location to the people you chose. The call never breaks and never acknowledges it.",
    action: { label: "Start a session", href: "/setup" },
  },
  {
    id: "alarm",
    keywords: ["alarm", "trigger", "safe", "word", "duress", "phrase", "how", "work"],
    question: "How does the alarm work?",
    answer:
      "Two independent paths, so one failure cannot mute it. The model calls a raise_alarm tool silently the instant it hears your phrase. Separately, your browser matches the same phrase locally and posts directly, without the voice relay involved at all. Either one fires the alert; both are deduplicated so contacts are messaged once.",
    action: { label: "See the architecture", href: "/system" },
  },
  {
    id: "stored",
    keywords: ["store", "stored", "privacy", "data", "keep", "audio", "recording"],
    question: "What gets stored?",
    answer:
      "No audio, ever. No transcripts. What is written is a session id, the contacts you chose, a location trail scoped to the session, and the timestamp if the alarm fired. A Firestore TTL deletes the trail six hours after the session starts.",
    action: { label: "See the architecture", href: "/system" },
  },
  {
    id: "cost",
    keywords: ["cost", "price", "money", "rupees", "expensive", "cheap"],
    question: "What does it cost to run?",
    answer:
      "About Rs 23 for a twenty-minute protected commute at Sarvam's published rates: roughly Rs 10 of speech to text, Rs 12 of speech synthesis, and well under a rupee of reasoning. The figure on the page is computed live from the rate card, not typed in.",
    action: { label: "See the numbers", href: "/system" },
  },
  {
    id: "why",
    keywords: ["why", "112", "police", "button", "sos", "existing", "different"],
    question: "Why not just an SOS button?",
    answer:
      "Because the alarm layer already exists and arrives in 18.61 minutes on national average. Every deployed tool activates after the threat is real. Pukaar covers the ninety seconds before, which is the window 72.3 percent of women already improvise for by faking a phone call.",
  },
  {
    id: "start",
    keywords: ["start", "begin", "call", "session", "try", "demo"],
    question: "How do I start a call?",
    answer: "Set your name, at least one trusted contact, and the sentence you would say if you needed help. Then start the call and speak normally. The microphone stays on for the whole session.",
    action: { label: "Start a session", href: "/setup" },
  },
];

const STOP = new Set(["the", "a", "an", "is", "it", "of", "to", "and", "i", "you", "my", "for", "in", "on", "do", "does"]);

/** Keyword-overlap match. Deterministic and instant; degrades to a clear
 *  "here is what I can answer" rather than inventing a reply. */
export function answerFor(question: string): FaqAnswer | null {
  const tokens = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
  if (tokens.length === 0) return null;

  let best: FaqAnswer | null = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    const score = tokens.filter((t) => entry.keywords.some((k) => k.startsWith(t) || t.startsWith(k))).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 1 ? best : null;
}
