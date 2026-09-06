import { describe, expect, it } from "vitest";
import { splitSentences } from "./transcript";

describe("splitSentences", () => {
  it("splits on standard sentence punctuation", () => {
    expect(splitSentences("Haan bol. Kya kar rahi hai?")).toEqual(["Haan bol.", "Kya kar rahi hai?"]);
  });

  it("splits on the Devanagari danda", () => {
    expect(splitSentences("ठीक है। मैं यहीं हूं।")).toEqual(["ठीक है।", "मैं यहीं हूं।"]);
  });

  it("returns the whole string as one chunk if there is no terminal punctuation", () => {
    expect(splitSentences("theek hai chal")).toEqual(["theek hai chal"]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });

  it("hard-splits a sentence longer than the 2500-char cap at a word boundary", () => {
    const long = "a".repeat(2000) + " " + "b".repeat(2000) + ".";
    const chunks = splitSentences(long);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2500);
  });
});
