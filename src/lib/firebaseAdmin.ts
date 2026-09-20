// ---------------------------------------------------------------------------
// Firebase Admin SDK — server-side only
// ---------------------------------------------------------------------------
// Used in API routes for:
//   1. Verifying Firebase ID tokens (auth)
//   2. Reading Firestore data server-side when service account credentials exist
// ---------------------------------------------------------------------------

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function hasAdminCredentials(): boolean {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

function ensureInitialized(): boolean {
  if (app) return true;
  if (getApps().length > 0) {
    app = getApps()[0];
    try {
      adminAuth = getAuth(app);
      adminDb = getFirestore(app);
      return true;
    } catch {
      return false;
    }
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Try service account from env if available
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(parsed);
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  // Only initialize if we have credentials or ADC configured
  if (credential) {
    try {
      app = initializeApp({ credential, projectId });
      adminAuth = getAuth(app);
      adminDb = getFirestore(app);
      return true;
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin with credentials:", e);
      return false;
    }
  }

  // No server-side credentials configured
  return false;
}

export function getAdminAuth(): Auth | null {
  if (!ensureInitialized()) return null;
  return adminAuth;
}

export function getAdminDb(): Firestore | null {
  if (!ensureInitialized()) return null;
  return adminDb;
}

