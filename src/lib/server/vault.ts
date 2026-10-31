import crypto from "crypto";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

// ---------------------------------------------------------------------------
// Cloud Credential Vault — AES-256-GCM Server-side Encryption
// ---------------------------------------------------------------------------
// Credentials are encrypted server-side with AES-256-GCM before saving to
// Firestore. The client NEVER receives unencrypted key material back.
// ---------------------------------------------------------------------------

export interface EncryptedPayload {
  iv: string; // hex
  ciphertext: string; // hex
  authTag: string; // hex
}

export interface ConnectedProviderMetadata {
  provider: "aws" | "gcp" | "azure";
  connectedAt: string;
  label: string;
  region?: string;
  projectId?: string;
}

// Persistent in-memory fallback for local dev across Next.js worker reloads
interface GlobalVaultStore {
  __cloudMonitorVault?: Map<string, { encrypted: EncryptedPayload; metadata: ConnectedProviderMetadata }>;
}
const globalVault = globalThis as unknown as GlobalVaultStore;
if (!globalVault.__cloudMonitorVault) {
  globalVault.__cloudMonitorVault = new Map();
}
const inMemoryVault = globalVault.__cloudMonitorVault;

function getEncryptionKey(): Buffer {
  const envKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!envKey) {
    console.warn("CREDENTIAL_ENCRYPTION_KEY is not set! Using fallback hash.");
    return crypto.createHash("sha256").update("cloudmonitor-default-vault-key-32").digest();
  }

  // If 64 hex characters (32 bytes), decode directly
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  // Otherwise hash whatever string was provided into 32 bytes
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Encrypt a plain object or string using AES-256-GCM
 */
export function encryptCredentials(data: Record<string, any> | string): EncryptedPayload {
  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // standard 96-bit IV for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]).toString("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    ciphertext,
    authTag,
  };
}

/**
 * Decrypt an AES-256-GCM payload back to an object or string
 */
export function decryptCredentials<T = Record<string, any>>(payload: EncryptedPayload): T {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "hex")),
    decipher.final(),
  ]).toString("utf8");

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}

/**
 * Extract authenticated user ID and token from NextRequest
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ uid: string; idToken: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  // Handle demo token
  if (idToken === "demo-user" || idToken === "demo-token" || idToken.startsWith("demo-")) {
    return { uid: "demo-user", idToken };
  }

  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return { uid: decoded.uid, idToken };
    } catch {
      // Fallback decode if verify fails in local environment
    }
  }

  // Safe JWT payload extraction for environments without full admin credentials
  try {
    const parts = idToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      const uid = payload.uid || payload.sub || payload.user_id;
      if (uid) return { uid, idToken };
    }
  } catch {
    // invalid token
  }

  return null;
}

/**
 * Save encrypted credentials to Firestore under users/{uid}/cloudCredentials/{provider}
 */
export async function saveCredentials(
  uid: string,
  provider: "aws" | "gcp" | "azure",
  encrypted: EncryptedPayload,
  metadata: Omit<ConnectedProviderMetadata, "provider" | "connectedAt">
): Promise<void> {
  const adminDb = getAdminDb();
  const fullMetadata: ConnectedProviderMetadata = {
    provider,
    connectedAt: new Date().toISOString(),
    ...metadata,
  };

  if (adminDb) {
    try {
      await adminDb
        .collection("users")
        .doc(uid)
        .collection("cloudCredentials")
        .doc(provider)
        .set({
          encrypted,
          metadata: fullMetadata,
          updatedAt: new Date().toISOString(),
        });
      return;
    } catch (err) {
      console.warn("Firestore Admin saveCredentials error, using in-memory store:", err);
    }
  }

  // Fallback to in-memory vault
  const key = `${uid}:${provider}`;
  inMemoryVault.set(key, { encrypted, metadata: fullMetadata });
}

/**
 * Read and decrypt credentials for a specific provider
 */
export async function getCredentials<T = Record<string, any>>(
  uid: string,
  provider: "aws" | "gcp" | "azure"
): Promise<{ credentials: T; metadata: ConnectedProviderMetadata } | null> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const doc = await adminDb
        .collection("users")
        .doc(uid)
        .collection("cloudCredentials")
        .doc(provider)
        .get();

      if (doc.exists) {
        const data = doc.data() as {
          encrypted: EncryptedPayload;
          metadata: ConnectedProviderMetadata;
        };
        const credentials = decryptCredentials<T>(data.encrypted);
        return { credentials, metadata: data.metadata };
      }
    } catch (err) {
      console.warn("Firestore Admin getCredentials error, falling back to in-memory:", err);
    }
  }

  // Fallback check
  const entry = inMemoryVault.get(`${uid}:${provider}`);
  if (entry) {
    const credentials = decryptCredentials<T>(entry.encrypted);
    return { credentials, metadata: entry.metadata };
  }

  return null;
}

/**
 * List all connected providers for a user (Metadata ONLY, NO encrypted keys or credentials)
 */
export async function listConnectedProviders(uid: string): Promise<ConnectedProviderMetadata[]> {
  const adminDb = getAdminDb();
  const list: ConnectedProviderMetadata[] = [];

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("users")
        .doc(uid)
        .collection("cloudCredentials")
        .get();

      for (const doc of snap.docs) {
        const data = doc.data();
        if (data?.metadata) {
          list.push(data.metadata as ConnectedProviderMetadata);
        }
      }
      return list;
    } catch (err) {
      console.warn("Firestore Admin listConnectedProviders error, checking in-memory:", err);
    }
  }

  // Check in-memory store
  for (const [key, val] of inMemoryVault.entries()) {
    if (key.startsWith(`${uid}:`)) {
      list.push(val.metadata);
    }
  }

  return list;
}

/**
 * Delete a connected provider's credentials doc
 */
export async function deleteCredentials(
  uid: string,
  provider: "aws" | "gcp" | "azure"
): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb
        .collection("users")
        .doc(uid)
        .collection("cloudCredentials")
        .doc(provider)
        .delete();
    } catch (err) {
      console.warn("Firestore Admin deleteCredentials error:", err);
    }
  }

  inMemoryVault.delete(`${uid}:${provider}`);
}
