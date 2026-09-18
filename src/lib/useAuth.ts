"use client";

// ---------------------------------------------------------------------------
// useAuth — Firebase Authentication hook (Google, Email/Password & Phone Linking)
// ---------------------------------------------------------------------------
// Wraps onAuthStateChanged to provide current user, loading state,
// multiple authentication methods (Google, Email/Password), and
// phone number linking with SMS OTP verification.
// On sign-in / link it creates or updates the Firestore doc at /users/{uid}.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  unlink,
  updateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { toast } from "sonner";

export interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInWithPhone: (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult>;
  linkPhoneNumber: (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult>;
  confirmPhoneCode: (
    confirmationResult: ConfirmationResult,
    code: string,
    isLinking?: boolean
  ) => Promise<void>;
  unlinkPhoneNumber: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Create or update the Firestore user profile doc.
 * Called on every successful sign-in so displayName, email, photoURL,
 * and phoneNumber stay synchronized.
 */
async function upsertUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data();
    await setDoc(
      ref,
      {
        displayName: user.displayName || existing.displayName || "Cloud User",
        email: user.email || existing.email || "",
        photoURL: user.photoURL || existing.photoURL || "",
        phoneNumber: user.phoneNumber || existing.phoneNumber || "",
      },
      { merge: true }
    );
  } else {
    await setDoc(ref, {
      displayName: user.displayName || "Cloud User",
      email: user.email || "",
      photoURL: user.photoURL || "",
      phoneNumber: user.phoneNumber || "",
      createdAt: serverTimestamp(),
      totalStorageUsedBytes: 0,
      estimatedMonthlyCost: 0,
    });
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await upsertUserDoc(firebaseUser);
        } catch (err) {
          console.error("Failed to upsert user doc:", err);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      await upsertUserDoc(auth.currentUser);
    }
  }, []);

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(message);
      console.error("Auth error:", err);
    }
  }, []);

  // Email / Password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user);
      toast.success("Welcome back! Signed in successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Email sign-in failed";
      toast.error(message);
      throw err;
    }
  }, []);

  // Email / Password sign up
  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (displayName) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        await upsertUserDoc(cred.user);
        toast.success("Account created successfully!");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  // Phone sign-in (OTP send)
  const signInWithPhone = useCallback(
    async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
      try {
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        toast.success("SMS verification code sent!");
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to send SMS code";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  // Link phone number to existing authenticated user
  const linkPhoneNumber = useCallback(
    async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to link a phone number.");
      }
      try {
        const result = await linkWithPhoneNumber(
          auth.currentUser,
          phoneNumber,
          appVerifier
        );
        toast.success(`Verification code sent to ${phoneNumber}`);
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to link phone number";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  // Confirm phone verification OTP
  const confirmPhoneCode = useCallback(
    async (
      confirmationResult: ConfirmationResult,
      code: string,
      isLinking = true
    ) => {
      try {
        const cred = await confirmationResult.confirm(code);
        if (cred.user) {
          setUser({ ...cred.user });
          await upsertUserDoc(cred.user);
        }
        if (isLinking) {
          toast.success("Mobile number successfully linked to your account!");
        } else {
          toast.success("Phone sign-in successful!");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Invalid verification code";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  // Unlink phone number
  const unlinkPhoneNumber = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const updatedUser = await unlink(
        auth.currentUser,
        PhoneAuthProvider.PROVIDER_ID
      );
      setUser({ ...updatedUser });
      await updateDoc(doc(db, "users", updatedUser.uid), {
        phoneNumber: "",
      });
      toast.success("Phone number unlinked");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to unlink phone number";
      toast.error(message);
      throw err;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign-out failed";
      toast.error(message);
    }
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    linkPhoneNumber,
    confirmPhoneCode,
    unlinkPhoneNumber,
    refreshUser,
    signOut,
  };
}
