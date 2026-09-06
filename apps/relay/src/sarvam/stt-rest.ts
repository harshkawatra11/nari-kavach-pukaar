// Turn-based STT fallback tier. Used when STT_MODE=rest, or when the relay
// downgrades to it after two failed realtime-socket reconnect attempts.
// Sends a complete WAV clip and gets one transcript back; there are no
// partial events on this path, which the browser UI accounts for.

export async function transcribeRest(opts: { apiKey: string; wavBase64: string; language: string }): Promise<string> {
  const wavBytes = Buffer.from(opts.wavBase64, "base64");
  const form = new FormData();
  form.append("model", "saaras:v3");
  if (opts.language && opts.language !== "auto") form.append("language_code", opts.language);
  form.append("file", new Blob([new Uint8Array(wavBytes)], { type: "audio/wav" }), "audio.wav");

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": opts.apiKey },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sarvam STT REST failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { transcript?: string };
  return data.transcript ?? "";
}
