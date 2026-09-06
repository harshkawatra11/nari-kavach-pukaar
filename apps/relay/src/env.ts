// Single place process.env is read in the relay. Throws a typed error naming
// the missing variable and the file to add it to, rather than failing inside
// a fetch call with an opaque 401 later.

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`${name} is not set. Add it to apps/relay/.env (copy from .env.example at the repo root).`);
    this.name = "MissingEnvError";
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new MissingEnvError(name);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  get SARVAM_API_KEY() {
    return required("SARVAM_API_KEY");
  },
  SARVAM_SPEAKER: optional("SARVAM_SPEAKER", "simran"),
  SARVAM_LANGUAGE: optional("SARVAM_LANGUAGE", "auto"),
  STT_MODE: optional("STT_MODE", "ws") as "ws" | "rest",
  TTS_MODE: optional("TTS_MODE", "rest") as "rest" | "ws",
  WEB_ORIGIN: optional("WEB_ORIGIN", "http://localhost:3000"),
  get RELAY_SHARED_SECRET() {
    return required("RELAY_SHARED_SECRET");
  },
  RELAY_PORT: Number(optional("RELAY_PORT", "8787")),
};
