import { validatePublicTrackingOrigin } from "@pukaar/core";

// Single place process.env is read on the server side of the web app. Throws
// a typed error naming the missing variable and the file to add it to.

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`${name} is not set. Add it to apps/web/.env.local (copy from .env.example at the repo root).`);
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
  get FIREBASE_PROJECT_ID() {
    return required("FIREBASE_PROJECT_ID");
  },
  get FIREBASE_CLIENT_EMAIL() {
    return required("FIREBASE_CLIENT_EMAIL");
  },
  get FIREBASE_PRIVATE_KEY() {
    return required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
  },
  get RELAY_SHARED_SECRET() {
    return required("RELAY_SHARED_SECRET");
  },
  WA_BRIDGE_URL: optional("WA_BRIDGE_URL", "http://127.0.0.1:8790"),
  get WA_BRIDGE_SECRET() {
    return required("WA_BRIDGE_SECRET");
  },
  get PUBLIC_TRACKING_ORIGIN() {
    return validatePublicTrackingOrigin(required("PUBLIC_TRACKING_ORIGIN"));
  },
};
