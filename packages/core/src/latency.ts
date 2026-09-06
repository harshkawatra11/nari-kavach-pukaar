import type { TurnMark } from "./types";

/** Records the marks for one voice turn and computes time-to-first-word. */
export class TurnClock {
  private marks = new Map<string, TurnMark>();

  startTurn(turnId: string, finalTranscriptAt: number): TurnMark {
    const mark: TurnMark = { turnId, finalTranscriptAt, llmReplyAt: null, firstAudioAt: null, timeToFirstWordMs: null };
    this.marks.set(turnId, mark);
    return mark;
  }

  markLlmReply(turnId: string, at: number): TurnMark | undefined {
    const mark = this.marks.get(turnId);
    if (!mark) return undefined;
    mark.llmReplyAt = at;
    return mark;
  }

  markFirstAudio(turnId: string, at: number): TurnMark | undefined {
    const mark = this.marks.get(turnId);
    if (!mark || mark.firstAudioAt !== null) return mark;
    mark.firstAudioAt = at;
    mark.timeToFirstWordMs = at - mark.finalTranscriptAt;
    return mark;
  }

  get(turnId: string): TurnMark | undefined {
    return this.marks.get(turnId);
  }

  /** Median time-to-first-word across all completed turns, ms. Null if none completed. */
  medianTimeToFirstWordMs(): number | null {
    const values = [...this.marks.values()]
      .map((m) => m.timeToFirstWordMs)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    if (values.length === 0) return null;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }
}
