"use client";

// ---------------------------------------------------------------------------
// useCloudData — Real-time telemetry hook for authenticated users with credentials
// ---------------------------------------------------------------------------
// Replaces the mock/Firestore snapshot stream when dataMode === "real-with-creds".
// Normalizes AWS, GCP, and Azure data directly into canonical Dashboard schemas.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "firebase/auth";
import type { Resource } from "@/lib/useResources";
import type { TimeSeriesPoint } from "@/lib/data";
import type { UsageRecord } from "@/lib/billing";
import type { CloudError } from "@/components/dashboard/cloud-error-banner";

interface UseCloudDataProps {
  user: User | null;
  enabled: boolean;
  intervalSeconds?: number;
}

export function useCloudData({ user, enabled, intervalSeconds = 30 }: UseCloudDataProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [errors, setErrors] = useState<CloudError[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const isMountedRef = useRef(true);

  const fetchAllCloudData = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [resResources, resMetrics, resBilling] = await Promise.allSettled([
        fetch("/api/cloud/resources", { headers, cache: "no-store" }),
        fetch("/api/cloud/metrics", { headers, cache: "no-store" }),
        fetch("/api/cloud/billing", { headers, cache: "no-store" }),
      ]);

      if (!isMountedRef.current) return;

      // Process Resources
      if (resResources.status === "fulfilled" && resResources.value.ok) {
        const data = await resResources.value.json();
        setResources(data.resources || []);
        if (Array.isArray(data.errors)) {
          setErrors(data.errors);
        }
      }

      // Process Metrics
      if (resMetrics.status === "fulfilled" && resMetrics.value.ok) {
        const data = await resMetrics.value.json();
        if (Array.isArray(data.timeSeries) && data.timeSeries.length > 0) {
          setTimeSeries(data.timeSeries);
        }
      }

      // Process Billing
      if (resBilling.status === "fulfilled" && resBilling.value.ok) {
        const data = await resBilling.value.json();
        if (Array.isArray(data.usageRecords)) {
          setUsageRecords(data.usageRecords);
        }
      }

      setLastFetched(new Date());
    } catch (err) {
      console.warn("useCloudData error:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, enabled]);

  // Initial fetch and interval polling
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && user) {
      fetchAllCloudData();

      const timer = setInterval(() => {
        fetchAllCloudData();
      }, Math.max(10, intervalSeconds) * 1000);

      return () => {
        isMountedRef.current = false;
        clearInterval(timer);
      };
    } else {
      setResources([]);
      setTimeSeries([]);
      setUsageRecords([]);
      setErrors([]);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user, enabled, intervalSeconds, fetchAllCloudData]);

  const dismissError = (idx: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  return {
    resources,
    timeSeries,
    usageRecords,
    errors,
    loading,
    lastFetched,
    refresh: fetchAllCloudData,
    dismissError,
  };
}
