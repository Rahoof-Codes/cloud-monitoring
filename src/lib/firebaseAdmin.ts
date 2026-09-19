// ---------------------------------------------------------------------------
// Firebase Admin SDK — server-side only
// ---------------------------------------------------------------------------
// Used in API routes for:
//   1. Verifying Firebase ID tokens (auth)
//   2. Reading Firestore data server-side (don't trust client-sent data)
// ---------------------------------------------------------------------------

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

function ensureInitialized() {
  if (getApps().length === 0) {
    // When no service account JSON is provided, use application-default
    // credentials or the project ID from the environment.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    app = initializeApp({
      projectId,
    });
  } else {
    app = getApps()[0];
  }

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

export function getAdminAuth(): Auth {
  ensureInitialized();
  return adminAuth;
}

export function getAdminDb(): Firestore {
  ensureInitialized();
  return adminDb;
}
