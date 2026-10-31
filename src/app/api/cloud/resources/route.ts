// ---------------------------------------------------------------------------
// API Route: GET /api/cloud/resources
// ---------------------------------------------------------------------------
// Normalizes and returns live resources across all connected cloud providers.
// Includes 60s in-memory server cache and typed non-blocking error banners.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, listConnectedProviders, getCredentials } from "@/lib/server/vault";
import { getCachedData, setCachedData, DEFAULT_CACHE_TTL_MS } from "@/lib/server/cache";
import { fetchAwsResources } from "@/lib/server/normalizers/aws";
import { fetchGcpResources } from "@/lib/server/normalizers/gcp";
import { fetchAzureResources } from "@/lib/server/normalizers/azure";
import type { Resource } from "@/lib/useResources";
import type { CloudError } from "@/components/dashboard/cloud-error-banner";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check server-side cache
    const cacheKey = `${auth.uid}:resources`;
    const cached = getCachedData<Resource[]>(cacheKey);
    if (cached && cached.length > 0) {
      return NextResponse.json({ resources: cached, fromCache: true, errors: [] });
    }

    // 2. Fetch connected providers from vault
    const providers = await listConnectedProviders(auth.uid);
    if (providers.length === 0) {
      return NextResponse.json({ resources: [], fromCache: false, errors: [] });
    }

    const mergedResources: Resource[] = [];
    const errors: CloudError[] = [];

    // 3. Fan-out fetch in parallel
    const promises = providers.map(async (meta) => {
      try {
        const stored = await getCredentials(auth.uid, meta.provider);
        if (!stored) return;

        if (meta.provider === "aws") {
          const list = await fetchAwsResources(stored.credentials as any);
          mergedResources.push(...list);
        } else if (meta.provider === "gcp") {
          const list = await fetchGcpResources(stored.credentials as any);
          mergedResources.push(...list);
        } else if (meta.provider === "azure") {
          const list = await fetchAzureResources(stored.credentials as any);
          mergedResources.push(...list);
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        let errorType: CloudError["type"] = "unknown";
        if (msg.includes("Signature") || msg.includes("Auth") || msg.includes("Credential") || msg.includes("Token")) {
          errorType = "auth_failed";
        } else if (msg.includes("AccessDenied") || msg.includes("Permission") || msg.includes("Unauthorized")) {
          errorType = "permission_denied";
        } else if (msg.includes("RateLimit") || msg.includes("Throttling")) {
          errorType = "rate_limited";
        }

        errors.push({
          provider: meta.provider,
          type: errorType,
          message: `Failed to fetch live resources from ${meta.provider.toUpperCase()}: ${msg.split("\n")[0]}`,
          details: msg,
        });
      }
    });

    await Promise.allSettled(promises);

    // 4. Update in-memory cache if we have results
    if (mergedResources.length > 0) {
      setCachedData(cacheKey, mergedResources, DEFAULT_CACHE_TTL_MS);
    }

    return NextResponse.json({
      resources: mergedResources,
      errors,
      fromCache: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cloud resources API error:", err);
    return NextResponse.json(
      { error: "Failed to query cloud providers", details: err?.message },
      { status: 500 }
    );
  }
}
