# Pukaar repair reference implementations

Companion to [the implementation plan](2026-09-08-pukaar-reliability-voice-glass.md). These are proposed code modules, not installed application changes. Keep their interfaces unchanged when wiring consumers. All times are milliseconds. No module below contacts a provider or sends a message.

Verification on 8 September 2026: extracted all four TypeScript fences in this document into a temporary script and executed with the repository's `pnpm exec tsx`. Result: 18 phrase cases, rolling-window checks, exact-mode checks and the camera-framing assertion passed. This verifies the reference examples, not the as-yet-unimplemented integration or general speech recognition accuracy.

## 1. packages/core/src/duress-profile.ts

```ts
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

const NEGATIONS = new Set(["nahi", "nahin", "नहीं", "नही", "not", "never"]);

function tokens(text: string): string[] {
  return text.normalize("NFC").toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/u).filter(Boolean);
}

function at(words: string[], alias: string[], index: number): boolean {
  return alias.length > 0 && index + alias.length <= words.length &&
    alias.every((token, offset) => words[index + offset] === token);
}

export function validatePhraseProfile(profile: PhraseProfile): void {
  if (profile.version !== 1 || !["anchors", "exact"].includes(profile.mode)) {
    throw new Error("Unsupported phrase profile");
  }
  if (!profile.displayPhrase.trim() || profile.displayPhrase.length > 240) {
    throw new Error("Phrase must contain 1 to 240 characters");
  }
  if (!Number.isInteger(profile.maxSpanTokens) || profile.maxSpanTokens < 3 || profile.maxSpanTokens > 24) {
    throw new Error("Phrase span must be 3 to 24 tokens");
  }
  if (profile.exactVariants.length > 8) throw new Error("At most eight exact variants");
  if (profile.mode === "exact") {
    for (const variant of [profile.displayPhrase, ...profile.exactVariants]) {
      if (variant.length > 240 || tokens(variant).length < 3) {
        throw new Error("Each exact variant needs at least three words and at most 240 characters");
      }
    }
    return;
  }
  if (profile.anchors.length < 3 || profile.anchors.length > 6) {
    throw new Error("Choose three to six distinctive groups");
  }
  const ids = new Set<string>();
  const seenAliases = new Map<string, string>();
  for (const group of profile.anchors) {
    if (!group.id || ids.has(group.id)) throw new Error("Anchor IDs must be unique");
    ids.add(group.id);
    if (!group.aliases.length || group.aliases.length > 8) throw new Error("Each group needs one to eight aliases");
    for (const alias of group.aliases) {
      const normalized = tokens(alias).join(" ");
      if (!normalized || alias.length > 60) throw new Error("Invalid anchor alias");
      if (seenAliases.has(normalized) && seenAliases.get(normalized) !== group.id) {
        throw new Error("The same alias cannot belong to two anchor groups");
      }
      seenAliases.set(normalized, group.id);
    }
  }
}

export function matchPhrase(text: string, profile: PhraseProfile): PhraseDecision {
  // API validation must call validatePhraseProfile once when saving/loading.
  // Limit the hot path even for unexpectedly long provider input.
  const words = tokens(text).slice(-64);
  const miss = (): PhraseDecision => ({ matched:false, reason:"incomplete", matchedAnchorIds:[] });
  if (!words.length) return miss();
  if (profile.mode === "exact") {
    for (const variant of [profile.displayPhrase, ...profile.exactVariants]) {
      const phrase = tokens(variant);
      for (let i=0; i<=words.length-phrase.length; i++) {
        if (at(words, phrase, i)) return { matched:true, reason:"exact", matchedAnchorIds:[] };
      }
    }
    return miss();
  }
  if (profile.anchors.length < 3) return miss();
  const groups = profile.anchors.map(group => ({
    id:group.id,
    aliases:group.aliases.map(tokens).filter(a=>a.length>0).sort((a,b)=>b.length-a.length),
  }));
  let sawNegated = false;
  function search(groupIndex: number, cursor: number, start: number): boolean {
    if (groupIndex === groups.length) {
      // Conservative local negation policy. Do not remove negation as filler.
      // This can reject corrective clauses; setup preview makes that visible.
      const context = words.slice(start, Math.min(words.length, cursor+4));
      if (context.some(word=>NEGATIONS.has(word))) {
        sawNegated=true;
        return false;
      }
      return true;
    }
    const last = Math.min(words.length, start+profile.maxSpanTokens);
    for (let i=cursor; i<last; i++) {
      for (const alias of groups[groupIndex].aliases) {
        if (i+alias.length<=last && at(words,alias,i) && search(groupIndex+1,i+alias.length,start)) return true;
      }
    }
    return false;
  }
  for (let i=0; i<words.length; i++) {
    for (const alias of groups[0].aliases) {
      if (at(words,alias,i) && search(1,i+alias.length,i)) {
        return { matched:true, reason:"anchors", matchedAnchorIds:groups.map(g=>g.id) };
      }
    }
  }
  return { matched:false, reason:sawNegated ? "negated" : "incomplete", matchedAnchorIds:[] };
}
```

Wire validation at HTTP boundary using runtime shape checks before casting JSON to PhraseProfile. In particular arrays and member types must be checked before this typed validator is invoked. Do not run the old matcher as an OR fallback for anchors, since the red-notebook false positive would return.

Negation scope in this reference is deliberately a four-token suffix, including across punctuation after normalization. This is more conservative than sentence-aware parsing. Lock that behavior for the first repair and document it in setup preview. Do not broaden to semantic negation inference without new tests. Exact mode accepts only explicitly confirmed variants and does not silently override their meaning.

## 2. packages/core/src/transcript-window.ts

```ts
export interface TranscriptSegment {
  id: string;
  text: string;
  at: number;
  final: boolean;
}

export function createTranscriptWindow() {
  let segments: TranscriptSegment[] = [];
  let lastEventAt: number | null = null;
  function reset() {
    segments=[];
    lastEventAt=null;
  }
  function text() {
    return segments.map(s=>s.text.trim()).join(" ").split(/\s+/u).filter(Boolean).slice(-64).join(" ");
  }
  function upsert(next: TranscriptSegment): string {
    if (!next.id || !next.text.trim() || !Number.isFinite(next.at)) return text();
    // Ignore late events from an older recognition generation.
    if (lastEventAt !== null && next.at < lastEventAt) return text();
    if (lastEventAt !== null && next.at-lastEventAt>8000) reset();
    lastEventAt=next.at;
    segments=segments.filter(s=>next.at-s.at<=12000);
    const existing=segments.find(s=>s.id===next.id);
    if (existing?.final) return text();
    if (!next.final) segments=segments.filter(s=>s.final || s.id===next.id);
    const index=segments.findIndex(s=>s.id===next.id);
    if (index>=0) segments[index]={...next};
    else segments.push({...next});
    const finalIds=segments.filter(s=>s.final).slice(-3).map(s=>s.id);
    segments=segments.filter(s=>!s.final || finalIds.includes(s.id));
    return text();
  }
  return {upsert,reset};
}
```

Integration detail: finalizing an utterance closes that ID. If a provider explicitly supports corrected finals, allocate a revision field and a dedicated correction test before accepting those updates. For current app adapters, final is final. Browser Web Speech resets its result indices after restart, so use `epoch:resultIndex` IDs.

## 3. Proposed unit-radius camera check

Keep this in `orb-geometry.test.ts`, with numeric-only calculation shared from `orb-scene-config.ts` if exported. It tests framing, not subjective aesthetics.

```ts
function projectedHalfExtent(radius: number, distance: number, fovDegrees: number) {
  return radius/Math.sqrt(distance*distance-radius*radius)/Math.tan(fovDegrees*Math.PI/360);
}
const maximumRadius=1.012*1.026;
if (projectedHalfExtent(maximumRadius,4.6,34)>=0.8) {
  throw new Error("Orb exceeds safe camera framing");
}
```

A group offset, changed camera target or added glow can still clip even if this passes. Browser visual review checks the full scene.

## 4. Zero-provider verification harness

The following checks can run with the two modules above concatenated into a temporary TypeScript script. At execution, use colocated Vitest imports instead. The planning audit uses only a temporary file outside product source.

```ts
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
validatePhraseProfile(DEMO_PHRASE_PROFILE);
const positives=[
  "Mummy ko bol dena blue notebook drawer mein rakhi hai",
  "Papa ko bol dena blue notebook drawer mein rakhi hai",
  "Oh accha haan ek baat aur yaad aayi Mummy ko bol dena blue notebook drawer mein rakhi hai",
  "blue notebook drawer mein rakhi hai",
  "blue note book drawer mein hai",
  "मम्मी को बोल देना ब्लू नोटबुक ड्रॉअर में रखी है",
  "Papa को बोल देना blue नोटबुक drawer में रखी है",
  "नीली नोटबुक दराज में रखी है",
];
const negatives=[
  "Mummy ko bol dena red notebook drawer mein rakhi hai",
  "Mummy ko bol dena blue notebook kitchen mein rakhi hai",
  "blue notebook", "drawer mein rakhi hai", "blue", "bluebook notebook drawer",
  "blue notebook drawer mein nahi hai", "ब्लू नोटबुक दराज में नहीं है",
  "kal ka plan kya hai", "Mummy ko bol dena khana kha liya",
];
for(const input of positives) assert(matchPhrase(input,DEMO_PHRASE_PROFILE).matched,"positive failed: "+input);
for(const input of negatives) assert(!matchPhrase(input,DEMO_PHRASE_PROFILE).matched,"negative failed: "+input);
const w=createTranscriptWindow();
w.upsert({id:"a",text:"blue note",at:1000,final:false});
w.upsert({id:"a",text:"blue notebook",at:1200,final:true});
const joined=w.upsert({id:"b",text:"drawer mein rakhi hai",at:2500,final:true});
assert(joined==="blue notebook drawer mein rakhi hai","partial duplication");
assert(matchPhrase(joined,DEMO_PHRASE_PROFILE).matched,"split clause not recognized");
const repeated=w.upsert({id:"b",text:"drawer mein rakhi hai",at:2600,final:true});
assert(repeated===joined,"duplicate final appended");
w.reset();
w.upsert({id:"a",text:"blue notebook",at:1000,final:true});
const expired=w.upsert({id:"b",text:"drawer mein hai",at:10001,final:true});
assert(!matchPhrase(expired,DEMO_PHRASE_PROFILE).matched,"distant mentions joined");
w.reset();
assert(w.upsert({id:"new:0",text:"drawer",at:11000,final:true})==="drawer","reset leaked old call");
const exact:PhraseProfile={version:1,mode:"exact",displayPhrase:"orange diary shelf",anchors:[],exactVariants:[],maxSpanTokens:16};
validatePhraseProfile(exact);
assert(matchPhrase("haan orange diary shelf mein hai",exact).matched,"exact variant missing");
assert(!matchPhrase("orange book shelf",exact).matched,"exact variant changed");
console.log("Reference checks passed: 18 phrase cases, rolling-window and exact-mode checks, camera framing.");
```

## 5. API fault assertions to implement with injected boundaries

These are exact behavioral assertions for the integration suite, not claims that they ran in planning.

| Injected condition | Assert |
|---|---|
| Alarm POST accepted, bridge returns 202 queued | UI shows queued, not submitted; one stable alertId |
| Alarm POST network failure | Error exposed, no swallowed rejection, same alertId on recovery |
| Bridge 409 with empty contacts | Protocol/conflict state, never endless dispatching |
| Clipboard get rejects | Enter count 0; worker unlocked; job failed |
| Clipboard set rejects after Enter succeeds | Enter count 1; submitted retained; worker unlocked |
| Composer verifier returns false | Enter count 0; failed before submission |
| Enter function throws | Unknown, no auto retry |
| Restart journal contains submitting | Unknown and paused, no automatic Windows action |
| Two detectors, one session | One primary Firestore alert and one bridge job |
| Location capture succeeds, upload 500 | Captured but not shared; public UI never invents point |
| Old position from browser cache | Original timestamp preserved |
| Stream expires while disconnected | Client expiry timer closes reconnect path |
| User interrupts while decode pending | Old decode cannot schedule output |
| Voice hidden behind WhatsApp | Audio and microphone continue; only decoration may pause |

## 6. Implementation notes preventing accidental scope changes

- Source code snippets do not justify claiming general semantic phrase understanding. This is a configured deterministic recognizer with explicit aliases and bounded context.
- Do not call Sarvam for each phrase comparison or for every speculative UI test.
- No call-quality sample establishes broad pronunciation accuracy. Keep human evaluation notes separate from deterministic test results.
- A nonterminal local bridge journal is sensitive. Expire it and ignore it in git. Do not store it in a public folder or expose it through Vercel.
- A Google Maps coordinate link does not update as the user moves. The separate Pukaar tracking page does, while its session and browser location updates remain active.
