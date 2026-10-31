// ---------------------------------------------------------------------------
// API Route: POST /api/vault/connect
// ---------------------------------------------------------------------------
// Encrypts and securely stores cloud provider credentials in Firestore.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, encryptCredentials, saveCredentials } from "@/lib/server/vault";
import { invalidateUserCache } from "@/lib/server/cache";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, credentials, label } = body;

    if (!provider || !["aws", "gcp", "azure"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Supported: aws, gcp, azure" },
        { status: 400 }
      );
    }

    if (!credentials || typeof credentials !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid credentials payload" },
        { status: 400 }
      );
    }

    let providerLabel = label;
    let extraMeta: Record<string, any> = {};

    // Validate provider specific required keys
    if (provider === "aws") {
      const { accessKeyId, secretAccessKey, region } = credentials;
      if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
        return NextResponse.json(
          { error: "AWS Access Key ID and Secret Access Key are required" },
          { status: 400 }
        );
      }
      providerLabel = providerLabel || `AWS (${region || "us-east-1"})`;
      extraMeta = { region: region || "us-east-1" };
    } else if (provider === "gcp") {
      let clientEmail = credentials.clientEmail || credentials.client_email;
      let privateKey = credentials.privateKey || credentials.private_key;
      let projectId = credentials.projectId || credentials.project_id;

      if (!projectId || !clientEmail || !privateKey) {
        return NextResponse.json(
          { error: "GCP Project ID, Client Email, and Private Key are required" },
          { status: 400 }
        );
      }
      providerLabel = providerLabel || `GCP (${projectId})`;
      extraMeta = { projectId };
    } else if (provider === "azure") {
      const { tenantId, clientId, clientSecret, subscriptionId } = credentials;
      if (!tenantId?.trim() || !clientId?.trim() || !clientSecret?.trim() || !subscriptionId?.trim()) {
        return NextResponse.json(
          { error: "Azure Tenant ID, Client ID, Client Secret, and Subscription ID are required" },
          { status: 400 }
        );
      }
      providerLabel = providerLabel || `Azure (${subscriptionId.slice(0, 8)}…)`;
    }

    // Encrypt server-side with AES-256-GCM
    const encrypted = encryptCredentials(credentials);

    // Save in user's vault
    await saveCredentials(auth.uid, provider, encrypted, {
      label: providerLabel,
      ...extraMeta,
    });

    // Invalidate cached telemetry so next fetch immediately discovers the new provider
    invalidateUserCache(auth.uid);

    return NextResponse.json({
      success: true,
      provider,
      label: providerLabel,
      connectedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Vault connect route error:", err);
    return NextResponse.json(
      { error: "Failed to store encrypted credentials" },
      { status: 500 }
    );
  }
}
