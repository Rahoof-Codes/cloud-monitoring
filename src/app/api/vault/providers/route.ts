// ---------------------------------------------------------------------------
// API Route: GET /api/vault/providers
// ---------------------------------------------------------------------------
// Returns the list of cloud providers the authenticated user has connected.
// Metadata ONLY (provider name, connectedAt, label, region).
// Zero secret key material is ever exposed to the client.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, listConnectedProviders } from "@/lib/server/vault";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Missing or invalid Authentication token" },
        { status: 401 }
      );
    }

    const providers = await listConnectedProviders(auth.uid);
    return NextResponse.json({ providers });
  } catch (err) {
    console.error("Vault providers route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
