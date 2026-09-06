// Real Sarvam pricing, verified against docs.sarvam.ai on 6 Sep 2026. All
// figures in Indian Rupees. Chat is billed per token, STT per second of
// audio, TTS per character. This is the one place these rates live; the
// README and the pitch deck both quote numbers computed from this file, so a
// price change here should be checked against both before being considered
// finished (see docs/ARCHITECTURE.md "keeping the deck honest").

export const SARVAM_RATES = {
  /** Rs per 1,000,000 input tokens, sarvam-105b-conversations. */
  chatInputPerMTokens: 29.28,
  /** Rs per 1,000,000 output tokens. */
  chatOutputPerMTokens: 73.2,
  /** Rs per hour of audio transcribed. */
  sttPerHour: 30,
  /** Rs per 10,000 characters synthesised, bulbul:v3. */
  ttsPer10kChars: 30,
};

export interface CommuteCostInput {
  minutes: number;
  ttsChars: number;
  inTokens: number;
  outTokens: number;
}

export interface CommuteCostBreakdown {
  sttRupees: number;
  ttsRupees: number;
  chatRupees: number;
  totalRupees: number;
}

export function costOfCommute(input: CommuteCostInput): CommuteCostBreakdown {
  const sttRupees = (input.minutes / 60) * SARVAM_RATES.sttPerHour;
  const ttsRupees = (input.ttsChars / 10000) * SARVAM_RATES.ttsPer10kChars;
  const chatRupees =
    (input.inTokens / 1_000_000) * SARVAM_RATES.chatInputPerMTokens +
    (input.outTokens / 1_000_000) * SARVAM_RATES.chatOutputPerMTokens;
  const totalRupees = sttRupees + ttsRupees + chatRupees;
  return {
    sttRupees: round2(sttRupees),
    ttsRupees: round2(ttsRupees),
    chatRupees: round2(chatRupees),
    totalRupees: round2(totalRupees),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
