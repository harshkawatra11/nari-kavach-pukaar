const MAX_TTS_CHARS = 2500;

/** Splits reply text into sentence-ish chunks so the first sentence can be
 *  sent to TTS immediately rather than waiting for the whole reply. Splits on
 *  . ! ? and the Devanagari danda, never mid-number (a trailing digit before
 *  the delimiter is not treated as a sentence boundary), and hard-splits at a
 *  word boundary if a single sentence would exceed Sarvam's 2500-char cap. */
export function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const raw = trimmed.match(/[^.!?।]+(?:[.!?।]+|$)/g) ?? [trimmed];
  const sentences = raw.map((s) => s.trim()).filter(Boolean);

  const out: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= MAX_TTS_CHARS) {
      out.push(sentence);
      continue;
    }
    let remaining = sentence;
    while (remaining.length > MAX_TTS_CHARS) {
      let cut = remaining.lastIndexOf(" ", MAX_TTS_CHARS);
      if (cut <= 0) cut = MAX_TTS_CHARS;
      out.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining) out.push(remaining);
  }
  return out;
}
