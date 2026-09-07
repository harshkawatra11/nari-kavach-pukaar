// The duress spotter. Runs in two places on purpose: server-side inside the
// relay over Sarvam's final transcripts, and client-side over the browser's
// own Web Speech transcript. Same function, same thresholds, two independent
// network paths. That redundancy is the product's central technical claim, so
// this file must never grow a dependency on either environment.
//
// Known limitation, stated honestly rather than hidden: this is a cheap,
// deterministic character-level fuzzy matcher, not a semantic model. It
// reliably separates a genuinely different sentence from the duress phrase
// (score near 0) and reliably tolerates STT noise on the phrase itself
// (missing punctuation, a dropped short word, a misheard syllable, score
// above 0.9). What it CANNOT reliably reject is an adversarial single-word
// substitution that keeps the same sentence structure and word length (for
// example swapping the phrase's one distinctive noun for a different noun of
// similar length) -- to this algorithm that looks identical to a typo, because
// both are "one word changed". This is why the duress phrase should be a full,
// idiosyncratic sentence rather than a generic template, and why there are two
// independent trigger paths plus a relay-side third check rather than trusting
// any single matcher.

const FILLERS = new Set([
  "um", "uh", "hmm", "haan", "han", "toh", "to", "na", "yaar", "matlab", "actually", "like", "so",
]);

/** Lowercase, strip everything that is not a letter/digit/space, collapse runs,
 *  drop filler tokens. Devanagari is left intact; Sarvam returns whichever
 *  script the speaker used and we compare in whatever we get. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    // Keep combining marks as well as letters. Devanagari vowel signs are
    // Unicode marks, so stripping \p{M} silently changed Hindi words before
    // comparison and made a correctly transcribed phrase less likely to fire.
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !FILLERS.has(t))
    .join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

export interface DuressMatch {
  matched: boolean;
  score: number;
  window: string;
}

/** Slides a window of the phrase's token length (and +/-1) across the utterance
 *  and takes the best normalized similarity. 0.82 was chosen against the gold
 *  set in eval/duress-gold-set.json: it keeps every true positive there above
 *  0.9 while every genuinely different sentence scores under 0.4. Do not lower
 *  it without re-running the eval. */
export const DURESS_THRESHOLD = 0.82;

export function detectDuress(
  utterance: string,
  phrase: string,
  threshold: number = DURESS_THRESHOLD,
): DuressMatch {
  const u = normalize(utterance);
  const p = normalize(phrase);
  if (!u || !p) return { matched: false, score: 0, window: "" };

  const uTok = u.split(" ");
  const pTok = p.split(" ");
  let best = 0;
  let bestWindow = "";

  for (const size of [pTok.length - 1, pTok.length, pTok.length + 1]) {
    if (size < 1 || size > uTok.length) continue;
    for (let i = 0; i + size <= uTok.length; i++) {
      const win = uTok.slice(i, i + size).join(" ");
      const dist = levenshtein(win, p);
      const score = 1 - dist / Math.max(win.length, p.length);
      if (score > best) {
        best = score;
        bestWindow = win;
      }
    }
  }
  return { matched: best >= threshold, score: best, window: bestWindow };
}
