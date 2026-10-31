// ---------------------------------------------------------------------------
// API Route: GET /api/cloud/metrics
// ---------------------------------------------------------------------------
// Normalizes and returns time-series metrics across all connected cloud providers.
// Aggregated into the exact TimeSeriesPoint[] format required by dashboard charts.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, listConnectedProviders, getCredentials } from "@/lib/server/vault";
import { getCachedData, setCachedData, DEFAULT_CACHE_TTL_MS } from "@/lib/server/cache";
import { fetchAwsMetrics } from "@/lib/server/normalizers/aws";
import { fetchGcpMetrics } from "@/lib/server/normalizers/gcp";
import { fetchAzureMetrics } from "@/lib/server/normalizers/azure";
import type { TimeSeriesPoint } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `${auth.uid}:metrics`;
    const cached = getCachedData<TimeSeriesPoint[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ timeSeries: cached, fromCache: true });
    }

    const providers = await listConnectedProviders(auth.uid);
    if (providers.length === 0) {
      return NextResponse.json({ timeSeries: [], fromCache: false });
    }

    const seriesLists: TimeSeriesPoint[][] = [];

    const promises = providers.map(async (meta) => {
      try {
        const stored = await getCredentials(auth.uid, meta.provider);
        if (!stored) return;

        if (meta.provider === "aws") {
          const s = await fetchAwsMetrics(stored.credentials as any);
          if (s.length > 0) seriesLists.push(s);
        } else if (meta.provider === "gcp") {
          const s = await fetchGcpMetrics(stored.credentials as any);
          if (s.length > 0) seriesLists.push(s);
        } else if (meta.provider === "azure") {
          const s = await fetchAzureMetrics(stored.credentials as any);
          if (s.length > 0) seriesLists.push(s);
        }
      } catch (err) {
        console.warn(`Metrics fetch error for ${meta.provider}:`, err);
      }
    });

    await Promise.allSettled(promises);

    let mergedSeries: TimeSeriesPoint[] = [];

    if (seriesLists.length > 0) {
      // Use the longest or average series across providers
      mergedSeries = seriesLists[0];
      if (seriesLists.length > 1) {
        // Average CPU and Memory across providers for each point
        mergedSeries = mergedSeries.map((basePt, i) => {
          let sumCpu = basePt.avgCpu;
          let sumMem = basePt.avgMemory;
          let count = 1;

          for (let sIdx = 1; sIdx < seriesLists.length; sIdx++) {
            const pt = seriesLists[sIdx][i];
            if (pt) {
              sumCpu += pt.avgCpu;
              sumMem += pt.avgMemory;
              count++;
            }
          }

          const avgCpu = Math.round(sumCpu / count);
          const avgMemory = Math.round(sumMem / count);
          return {
            ...basePt,
            avgCpu,
            peakCpu: Math.min(100, avgCpu + 15),
            avgMemory,
            peakMemory: Math.min(100, avgMemory + 15),
            anomaly: avgCpu > 85,
          };
        });
      }
      setCachedData(cacheKey, mergedSeries, DEFAULT_CACHE_TTL_MS);
    }

    return NextResponse.json({
      timeSeries: mergedSeries,
      fromCache: false,
    });
  } catch (err: any) {
    console.error("Cloud metrics route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch cloud metrics", details: err?.message },
      { status: 500 }
    );
  }
}
