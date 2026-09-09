// Sarvam TTS, REST leg. Chosen as the default over the streaming WebSocket
// leg because this exact contract was verified working end to end before
// this file was written (see docs/ARCHITECTURE.md). Two things that will
// break silently if skipped:
//   - TTS returns a standard WAV header. NEVER hardcode a sample rate:
//     bulbul:v2 returns 22050 Hz, bulbul:v3 returns 24000 Hz. Always read it
//     from the header, the way parseWavHeader does below.
//   - Speaker names must be lowercase in the request body ("simran", not
//     "Simran") or the request 400s.

export interface TtsSynthesis {
  /** Raw PCM samples, no header. */
  pcm: Buffer;
  sampleRateHz: number;
  channels: number;
}

/** Parses a standard RIFF/WAVE header and returns the PCM payload plus the
 *  format fields actually present in it, rather than assuming any of them.
 *  Walks chunks after the 12-byte RIFF/WAVE header rather than assuming
 *  "fmt " and "data" sit at fixed offsets, since some encoders insert extra
 *  chunks (e.g. LIST) between them. */
function parseWavHeader(buf: Buffer): TtsSynthesis {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Sarvam TTS did not return a recognizable WAV file.");
  }
  let offset = 12;
  let sampleRateHz = 0;
  let channels = 0;
  let dataStart = -1;
  let dataLength = 0;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;
    if (chunkId === "fmt ") {
      channels = buf.readUInt16LE(bodyStart + 2);
      sampleRateHz = buf.readUInt32LE(bodyStart + 4);
    } else if (chunkId === "data") {
      dataStart = bodyStart;
      dataLength = chunkSize;
    }
    offset = bodyStart + chunkSize + (chunkSize % 2);
  }
  if (dataStart < 0 || sampleRateHz === 0) {
    throw new Error("Sarvam TTS WAV was missing a fmt or data chunk.");
  }
  return {
    pcm: buf.subarray(dataStart, dataStart + dataLength),
    sampleRateHz,
    channels: channels || 1,
  };
}

export interface WavSynthesis {
  wavBase64: string;
  sampleRateHz: number;
}

export async function synthesizeRest(opts: {
  apiKey: string;
  text: string;
  speaker: string;
  language: string;
}): Promise<WavSynthesis> {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": opts.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: opts.text,
      target_language_code: opts.language === "auto" ? "hi-IN" : opts.language,
      speaker: opts.speaker.toLowerCase(),
      model: "bulbul:v3",
      pace: 1,
      temperature: 0.45,
      speech_sample_rate: 24000,
      output_audio_codec: "wav",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sarvam TTS failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { audios: string[] };
  const wavBuffer = Buffer.from(data.audios[0], "base64");
  const parsed = parseWavHeader(wavBuffer);
  return { wavBase64: data.audios[0], sampleRateHz: parsed.sampleRateHz };
}
