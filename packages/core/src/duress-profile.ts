export interface PhraseProfile {
  version: 1;
  mode: "anchors" | "exact";
  displayPhrase: string;
  anchors: Array<{ id: string; aliases: string[] }>;
  exactVariants: string[];
  maxSpanTokens: number;
}

export interface PhraseDecision {
  matched: boolean;
  reason: "anchors" | "exact" | "incomplete" | "negated";
  matchedAnchorIds: string[];
}

export const DEMO_PHRASE_PROFILE: PhraseProfile = {
  version: 1,
  mode: "anchors",
  displayPhrase: "Mummy ko bol dena blue notebook drawer mein rakhi hai",
  anchors: [
    { id: "blue", aliases: ["blue", "blu", "ब्लू", "नीली", "neeli", "nili"] },
    { id: "notebook", aliases: ["notebook", "note book", "नोटबुक", "नोट बुक"] },
    { id: "drawer", aliases: ["drawer", "drawar", "ड्रॉअर", "ड्रावर", "दराज", "दराज़", "daraz"] },
  ],
  exactVariants: [],
  maxSpanTokens: 16,
};

export function profileForStoredPhrase(displayPhrase: string): PhraseProfile {
  const normalized = tokens(displayPhrase).join(" ");
  const demoNormalized = tokens(DEMO_PHRASE_PROFILE.displayPhrase).join(" ");
  if (normalized === demoNormalized) return DEMO_PHRASE_PROFILE;
  return { version: 1, mode: "exact", displayPhrase, anchors: [], exactVariants: [], maxSpanTokens: 16 };
}

const NEGATIONS = new Set(["nahi", "nahin", "नहीं", "नही", "not", "never"]);

function tokens(text: string): string[] {
  return text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/u).filter(Boolean);
}

function at(words: string[], alias: string[], index: number): boolean {
  return alias.length > 0 && index + alias.length <= words.length && alias.every((token, offset) => words[index + offset] === token);
}

export function validatePhraseProfile(profile: PhraseProfile): void {
  if (profile.version !== 1 || !["anchors", "exact"].includes(profile.mode)) throw new Error("Unsupported phrase profile");
  if (!profile.displayPhrase.trim() || profile.displayPhrase.length > 240) throw new Error("Phrase must contain 1 to 240 characters");
  if (!Number.isInteger(profile.maxSpanTokens) || profile.maxSpanTokens < 3 || profile.maxSpanTokens > 24) throw new Error("Phrase span must be 3 to 24 tokens");
  if (profile.exactVariants.length > 8) throw new Error("At most eight exact variants");
  if (profile.mode === "exact") {
    for (const variant of [profile.displayPhrase, ...profile.exactVariants]) {
      if (variant.length > 240 || tokens(variant).length < 3) throw new Error("Each exact variant needs at least three words and at most 240 characters");
    }
    return;
  }
  if (profile.anchors.length < 3 || profile.anchors.length > 6) throw new Error("Choose three to six distinctive groups");
  const ids = new Set<string>();
  const seenAliases = new Map<string, string>();
  for (const group of profile.anchors) {
    if (!group.id || ids.has(group.id)) throw new Error("Anchor IDs must be unique");
    ids.add(group.id);
    if (!group.aliases.length || group.aliases.length > 8) throw new Error("Each group needs one to eight aliases");
    for (const alias of group.aliases) {
      const normalized = tokens(alias).join(" ");
      if (!normalized || alias.length > 60) throw new Error("Invalid anchor alias");
      if (seenAliases.has(normalized) && seenAliases.get(normalized) !== group.id) throw new Error("The same alias cannot belong to two anchor groups");
      seenAliases.set(normalized, group.id);
    }
  }
}

export function matchPhrase(text: string, profile: PhraseProfile): PhraseDecision {
  const words = tokens(text).slice(-64);
  const miss = (): PhraseDecision => ({ matched: false, reason: "incomplete", matchedAnchorIds: [] });
  if (!words.length) return miss();
  if (profile.mode === "exact") {
    for (const variant of [profile.displayPhrase, ...profile.exactVariants]) {
      const phrase = tokens(variant);
      for (let i = 0; i <= words.length - phrase.length; i += 1) {
        if (at(words, phrase, i)) return { matched: true, reason: "exact", matchedAnchorIds: [] };
      }
    }
    return miss();
  }
  if (profile.anchors.length < 3) return miss();
  const groups = profile.anchors.map((group) => ({ id: group.id, aliases: group.aliases.map(tokens).filter((alias) => alias.length > 0).sort((a, b) => b.length - a.length) }));
  let sawNegated = false;
  function search(groupIndex: number, cursor: number, start: number): boolean {
    if (groupIndex === groups.length) {
      const context = words.slice(start, Math.min(words.length, cursor + 4));
      if (context.some((word) => NEGATIONS.has(word))) { sawNegated = true; return false; }
      return true;
    }
    const last = Math.min(words.length, start + profile.maxSpanTokens);
    for (let i = cursor; i < last; i += 1) {
      for (const alias of groups[groupIndex].aliases) {
        if (i + alias.length <= last && at(words, alias, i) && search(groupIndex + 1, i + alias.length, start)) return true;
      }
    }
    return false;
  }
  for (let i = 0; i < words.length; i += 1) {
    for (const alias of groups[0].aliases) {
      if (at(words, alias, i) && search(1, i + alias.length, i)) return { matched: true, reason: "anchors", matchedAnchorIds: groups.map((group) => group.id) };
    }
  }
  return { matched: false, reason: sawNegated ? "negated" : "incomplete", matchedAnchorIds: [] };
}
