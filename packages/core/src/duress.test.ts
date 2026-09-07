import { describe, expect, it } from "vitest";
import { detectDuress, levenshtein, normalize } from "./duress";

const PHRASE = "No, I already told mom. I will eat at home.";

describe("normalize", () => {
  it("lowercases, strips punctuation, drops fillers", () => {
    expect(normalize("Um, No! I already told MOM.")).toBe("no i already told mom");
  });

  it("collapses whitespace runs", () => {
    expect(normalize("no   i    already")).toBe("no i already");
  });

  it("drops filler tokens but keeps ordinary short words", () => {
    expect(normalize("haan toh main aa rahi hoon")).toBe("main aa rahi hoon");
  });
});

describe("levenshtein", () => {
  it("is zero for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("counts a single substitution as one", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });
});

describe("detectDuress - true positives", () => {
  it("matches the exact phrase", () => {
    const r = detectDuress(PHRASE, PHRASE);
    expect(r.matched).toBe(true);
  });

  it("matches with missing punctuation from STT", () => {
    const r = detectDuress("no i already told mom i will eat at home", PHRASE);
    expect(r.matched).toBe(true);
  });

  it("matches mom vs mumma, a common STT spelling variant", () => {
    const r = detectDuress("no i already told mumma i will eat at home", PHRASE);
    expect(r.matched).toBe(true);
  });

  it("matches with one short word dropped, a common STT artifact", () => {
    const r = detectDuress("no i already told mom will eat at home", PHRASE);
    expect(r.matched).toBe(true);
  });

  it("matches with one inserted filler", () => {
    const r = detectDuress("no um i already told mom i will eat at home", PHRASE);
    expect(r.matched).toBe(true);
  });

  it("matches when the phrase sits mid-sentence in a longer utterance", () => {
    const r = detectDuress(
      "okay so listen no i already told mom i will eat at home so dont worry",
      PHRASE,
    );
    expect(r.matched).toBe(true);
  });

  it("matches the locked Hinglish demo phrase inside natural speech", () => {
    const phrase = "Mummy ko bol dena, blue notebook kitchen mein hai.";
    const r = detectDuress("accha sun mummy ko bol dena blue notebook kitchen mein hai theek hai", phrase);
    expect(r.matched).toBe(true);
  });

  it("preserves Devanagari vowel marks during matching", () => {
    const phrase = "मम्मी को बोल देना नीली कॉपी रसोई में है";
    expect(normalize(phrase)).toContain("नीली");
    expect(detectDuress(phrase, phrase).matched).toBe(true);
  });
});

describe("detectDuress - hard negatives, genuinely different sentences that must never fire", () => {
  it("does not match ordinary small talk", () => {
    const r = detectDuress("haan bol na, kal ka kya plan hai", PHRASE);
    expect(r.matched).toBe(false);
    expect(r.score).toBeLessThan(0.5);
  });

  it("does not match an unrelated sentence that happens to mention mom", () => {
    const r = detectDuress("my mom is calling me right now", PHRASE);
    expect(r.matched).toBe(false);
    expect(r.score).toBeLessThan(0.5);
  });

  it("does not match an unrelated sentence about plans tomorrow", () => {
    const r = detectDuress("i will see you tomorrow at the market near college", PHRASE);
    expect(r.matched).toBe(false);
    expect(r.score).toBeLessThan(0.5);
  });

  it("returns unmatched for empty input", () => {
    const r = detectDuress("", PHRASE);
    expect(r.matched).toBe(false);
    expect(r.score).toBe(0);
  });

  it("returns unmatched for a short unrelated greeting", () => {
    const r = detectDuress("hello, can you hear me okay", PHRASE);
    expect(r.matched).toBe(false);
  });
});

describe("detectDuress - documented limitation", () => {
  it("a single-word swap of similar length and shape can score close to a real match (known limitation, see file header)", () => {
    // "mom" swapped for "them" keeps identical sentence structure and near-identical
    // length, so this lightweight matcher cannot reliably reject it the way it
    // rejects a structurally different sentence above. This is exactly why the
    // duress phrase should be a distinctive full sentence, not a generic template,
    // and why the product never relies on this matcher alone (see relay session.ts
    // third-check and the two independent trigger paths).
    const r = detectDuress("no i already told them i will eat at home", PHRASE);
    expect(r.score).toBeGreaterThan(0.5);
  });
});
