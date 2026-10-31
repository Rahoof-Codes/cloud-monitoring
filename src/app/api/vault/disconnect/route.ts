// ---------------------------------------------------------------------------
// API Route: DELETE /api/vault/disconnect (and POST)
// ---------------------------------------------------------------------------
// Deletes cloud provider credentials doc from Firestore.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, deleteCredentials } from "@/lib/server/vault";
import { invalidateUserCache } from "@/lib/server/cache";

async function handleDisconnect(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    let provider: "aws" | "gcp" | "azure" | null = null;

    // Check query param
    const searchParams = request.nextUrl.searchParams;
    const queryProvider = searchParams.get("provider");
    if (queryProvider === "aws" || queryProvider === "gcp" || queryProvider === "azure") {
      provider = queryProvider;
    } else {
      // Check JSON body
      try {
        const body = await request.json();
        if (body.provider === "aws" || body.provider === "gcp" || body.provider === "azure") {
          provider = body.provider;
        }
      } catch {
        // body might be empty in DELETE
      }
    }

    if (!provider) {
      return NextResponse.json(
        { error: "Missing or invalid provider param. Supported: aws, gcp, azure" },
        { status: 400 }
      );
    }

    await deleteCredentials(auth.uid, provider);
    invalidateUserCache(auth.uid);

    return NextResponse.json({
      success: true,
      message: `Disconnected ${provider} credentials successfully`,
      provider,
    });
  } catch (err) {
    console.error("Vault disconnect route error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return handleDisconnect(request);
}

export async function POST(request: NextRequest) {
  return handleDisconnect(request);
}
