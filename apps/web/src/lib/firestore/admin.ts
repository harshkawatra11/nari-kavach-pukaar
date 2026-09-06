import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "@/lib/env";

// Lazy singleton, same shape as adhikaar/fintech's Firestore client. The
// service account is scoped to roles/datastore.user only; there is no
// firebase client SDK in this repo, so firestore.rules can deny all direct
// client access (the live map is served through an SSE route instead).

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
  return app;
}

let db: Firestore | undefined;

export function getDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
