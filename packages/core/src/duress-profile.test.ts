import { describe, expect, it } from "vitest";
import { DEMO_PHRASE_PROFILE, matchPhrase, validatePhraseProfile } from "./duress-profile";

describe("phrase profile", () => {
  it.each([
    "Mummy ko bol dena blue notebook drawer mein rakhi hai",
    "Papa ko bol dena blue notebook drawer mein rakhi hai",
    "Oh accha haan ek baat aur yaad aayi Mummy ko bol dena blue notebook drawer mein rakhi hai",
    "blue note book drawer mein hai",
    "मम्मी को बोल देना ब्लू नोटबुक ड्रॉअर में रखी है",
    "Papa को बोल देना blue नोटबुक drawer में रखी है",
    "नीली नोटबुक दराज में रखी है",
  ])("accepts %s", (text) => expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(true));

  it.each([
    "Mummy ko bol dena red notebook drawer mein rakhi hai",
    "Mummy ko bol dena blue notebook kitchen mein rakhi hai",
    "blue notebook",
    "drawer mein rakhi hai",
    "blue notebook drawer mein nahi hai",
    "ब्लू नोटबुक दराज में नहीं है",
  ])("rejects %s", (text) => expect(matchPhrase(text, DEMO_PHRASE_PROFILE).matched).toBe(false));

  it("validates exact profiles without changing meaning", () => {
    const profile = { version: 1 as const, mode: "exact" as const, displayPhrase: "orange diary shelf", anchors: [], exactVariants: [], maxSpanTokens: 16 };
    expect(() => validatePhraseProfile(profile)).not.toThrow();
    expect(matchPhrase("haan orange diary shelf mein hai", profile).matched).toBe(true);
    expect(matchPhrase("orange book shelf", profile).matched).toBe(false);
  });
});
