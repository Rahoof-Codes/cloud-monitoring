// ---------------------------------------------------------------------------
// Firebase initialisation — modular SDK v9+
// ---------------------------------------------------------------------------
// All Firebase services used in the app are initialised here and exported
// as singletons.  Config values come from NEXT_PUBLIC_* env vars so they
// are available on the client.
//
// During SSR/build, Firebase may not have valid config — we guard against
// that so static generation doesn't crash.
//
// NOTE: Firebase Storage is NOT used — files are stored as base64 in
// Firestore to avoid requiring the Blaze (paid) plan.
// ---------------------------------------------------------------------------

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Only initialise Firebase if we have a valid API key (client-side).
// During SSR / static build the env vars may be empty.
if (firebaseConfig.apiKey) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Provide stubs so imports don't crash at module-evaluation time
  // during `next build`. These will never be used at runtime because
  // the client always has the env vars via NEXT_PUBLIC_*.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export const googleProvider = new GoogleAuthProvider();
export { auth, db };
