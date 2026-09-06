import { describe, expect, it } from "vitest";
import { costOfCommute } from "./cost";

describe("costOfCommute", () => {
  it("computes a 20-minute commute at realistic Tier A usage", () => {
    // ~20 min of audio, ~4000 chars spoken back, ~12k input / 3k output tokens
    // across roughly a dozen conversational turns.
    const result = costOfCommute({ minutes: 20, ttsChars: 4000, inTokens: 12000, outTokens: 3000 });

    expect(result.sttRupees).toBeCloseTo(10, 2); // (20/60) * 30
    expect(result.ttsRupees).toBeCloseTo(12, 2); // (4000/10000) * 30
    expect(result.chatRupees).toBeCloseTo(0.5732, 2); // 12000/1e6*29.28 + 3000/1e6*73.2
    expect(result.totalRupees).toBeGreaterThan(20);
    expect(result.totalRupees).toBeLessThan(25);
  });

  it("is zero for zero usage", () => {
    const result = costOfCommute({ minutes: 0, ttsChars: 0, inTokens: 0, outTokens: 0 });
    expect(result.totalRupees).toBe(0);
  });
});
