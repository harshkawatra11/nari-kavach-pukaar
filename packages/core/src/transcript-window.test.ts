import { describe, expect, it } from "vitest";
import { createTranscriptWindow } from "./transcript-window";

describe("transcript window", () => {
  it("joins corrected partials and consecutive final utterances once", () => {
    const window = createTranscriptWindow();
    window.upsert({ id: "a", text: "blue note", at: 1000, final: false });
    window.upsert({ id: "a", text: "blue notebook", at: 1200, final: true });
    const joined = window.upsert({ id: "b", text: "drawer mein rakhi hai", at: 2500, final: true });
    expect(joined).toBe("blue notebook drawer mein rakhi hai");
    expect(window.upsert({ id: "b", text: "drawer mein rakhi hai", at: 2600, final: true })).toBe(joined);
  });

  it("does not join utterances separated by more than eight seconds", () => {
    const window = createTranscriptWindow();
    window.upsert({ id: "a", text: "blue notebook", at: 1000, final: true });
    expect(window.upsert({ id: "b", text: "drawer mein hai", at: 10001, final: true })).toBe("drawer mein hai");
  });

  it("ignores late events and clears state", () => {
    const window = createTranscriptWindow();
    window.upsert({ id: "a", text: "blue notebook", at: 2000, final: true });
    expect(window.upsert({ id: "old", text: "drawer", at: 1000, final: true })).toBe("blue notebook");
    window.reset();
    expect(window.upsert({ id: "new", text: "drawer", at: 3000, final: true })).toBe("drawer");
  });
});
