// ---------------------------------------------------------------------------
// Fake API Credentials Generator for Simulated Cloud Resources
// ---------------------------------------------------------------------------
// Format:
//   Access Key: "crm_ak_" + 20 random alphanumeric chars
//   Secret Key: "crm_sk_" + 40 random alphanumeric chars
//
// NEVER reads from environment variables.
// NEVER uses real project API keys (Firebase, NVIDIA, Cloudinary, etc.).
// ---------------------------------------------------------------------------

export interface ApiCredentials {
  accessKey: string;
  secretKey: string;
  createdAt: string;
}

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function getRandomChars(length: number): string {
  if (typeof window !== "undefined" && window.crypto) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    return Array.from(values, (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join("");
  }
  // Server-side / fallback
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return result;
}

/**
 * Generate a fresh pair of fake credentials for a cloud resource.
 */
export function generateFakeCredentials(): ApiCredentials {
  return {
    accessKey: `crm_ak_${getRandomChars(20)}`,
    secretKey: `crm_sk_${getRandomChars(40)}`,
    createdAt: new Date().toISOString(),
  };
}

